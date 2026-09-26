/**
 * Bilim Arena — прогресс ученика.
 *
 * Сверху: иллюстрация, имя, уровень, XP и полоса уровня.
 * Ниже — только то, в чём уже есть данные: статистика, достижения,
 * история игр, начатые предметы и ошибки с объяснениями.
 * Нулевые показатели не выводятся; новому ученику — одна карточка «Начни».
 * Имя, иллюстрация и язык меняются на странице профиля (profile.html).
 */

import { bootstrap, mountHeader, el, $ } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { icon } from './core/icons.js';
import { avatar, cover } from './core/art.js';
import { SUBJECTS, TOPICS, getTopic, skillTitle, findQuestion } from './core/curriculum.js';
import { store, KEYS } from './core/store.js';
import { loadCase, CASES } from './data/investigations/index.js';
import { findSpeakItem } from './data/speaking/index.js';
import { findLabStep } from './data/labs/index.js';
import { getGame } from './data/games.js';
import { getProgress, knowledgeMap, weakSkills, reviewSuggestions, history, BADGES, migrateLegacy } from './core/progress.js';
import { getProfile } from './core/profile.js';

/** Иконки достижений — из общего набора, а не эмодзи */
const BADGE_ICON = {
  'first-lesson': 'teacher', 'xp-100': 'star', 'xp-1000': 'sparkle', 'streak-7': 'flame',
  'ten-correct': 'check', 'first-team': 'team', 'fractions-master': 'chart',
  'history-expert': 'map', 'logic-master': 'logic', 'english-starter': 'language'
};

// ─── Профиль и уровень ────────────────────────────────────────────────────────

function renderProfile(p, pr) {
  const lang = getLang();
  $('#avatar').replaceChildren(avatar(p.avatar, { size: 104 }));
  $('#profileName').textContent = p.name || t('role_student');
  $('#levelLine').textContent = `${t('home_level', { n: pr.level })} · ${pick(pr.title, lang)} · ${pr.xp} XP`;
  $('#xpBar').style.width = `${pr.levelPct}%`;
  $('#xpBarWrap').setAttribute('aria-valuenow', String(pr.levelPct));
  $('#xpBarWrap').setAttribute('aria-label', t('home_level', { n: pr.level }));
  $('#xpNote').textContent = t('home_xp_next', { n: pr.levelNeed - pr.levelInto });
  $('#settingsLink').replaceChildren(icon('settings', { size: 18 }), el('span', {}, t('profile_settings')));
}

// ─── Статистика: только реальные ненулевые показатели ─────────────────────────

function renderStats(pr) {
  const plays = Object.values(pr.games || {}).reduce((n, g) => n + (g.plays || 0), 0);
  const skills = Object.values(pr.skills || {});
  const answered = skills.reduce((n, s) => n + (s.total || 0), 0);
  const correct = skills.reduce((n, s) => n + (s.ok || 0), 0);
  const dayPct = Math.min(100, Math.round((pr.dayXP / pr.dailyGoal) * 100));

  const stat = (ic, value, label, extra = null, tone = '') => el('li', { class: `stat-card card ${tone}` },
    el('span', { class: 'stat-icon' }, icon(ic, { size: 22 })),
    el('span', { class: 'stat-text' }, el('b', {}, value), el('span', {}, label)),
    extra);

  const items = [
    stat('star', `${pr.xp}`, t('profile_stat_xp'), null, 'violet'),
    plays ? stat('games', `${plays}`, t('profile_stat_games'), null, 'teal') : null,
    answered ? stat('check', `${Math.round((correct / answered) * 100)}%`, t('profile_stat_accuracy', { n: answered }), null, 'teal') : null,
    pr.streak > 0 ? stat('flame', `${pr.streak}`, t('profile_stat_streak'), null, 'amber') : null,
    stat('target', `${pr.dayXP}/${pr.dailyGoal}`, t('home_daily_goal'),
      el('span', { class: 'bar reward mini', role: 'progressbar', 'aria-valuenow': String(dayPct), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': t('home_daily_goal') },
        el('i', { style: `width:${dayPct}%` })), 'amber'),
    Object.keys(pr.topics).length ? stat('book', `${Object.keys(pr.topics).length}`, t('profile_stat_topics'), null, 'violet') : null
  ].filter(Boolean);
  $('#statGrid').replaceChildren(...items);
}

// ─── Карта знаний: только начатые предметы ────────────────────────────────────

async function renderKnowledgeMap() {
  const lang = getLang();
  const map = await knowledgeMap(TOPICS);
  const rows = SUBJECTS.filter((s) => map[s.id] && (map[s.id].learned + map[s.id].review) > 0).map((subject) => {
    const s = map[subject.id];
    return el('div', { class: 'km-row' },
      el('div', { class: 'row between' },
        el('b', {}, pick(subject.title, lang)),
        el('span', { class: 'muted small' }, `${s.percent}%`)
      ),
      el('div', { class: `bar ${s.percent >= 80 ? 'ok' : ''}` }, el('i', { style: `width:${s.percent}%` })),
      el('div', { class: 'row small km-states' },
        s.learned ? el('span', { class: 'state learned' }, icon('check', { size: 14 }), `${t('mastery_learned')}: ${s.learned}`) : null,
        s.review ? el('span', { class: 'state review' }, icon('refresh', { size: 14 }), `${t('mastery_review')}: ${s.review}`) : null,
        el('span', { class: 'state new' }, t('mastery_of_topics', { done: s.learned, total: s.total }))
      )
    );
  });
  $('#mapSection').classList.toggle('hidden', !rows.length);
  $('#knowledgeMap').replaceChildren(...rows);
  return rows.length;
}

// ─── Что повторить ────────────────────────────────────────────────────────────

async function renderReview() {
  const lang = getLang();
  const weak = await weakSkills({ limit: 5 });
  const topics = await reviewSuggestions(3);
  const explained = await recentMistakes(3);

  const items = weak.map((w) => el('div', { class: 'review-row' },
    el('div', {}, el('b', {}, skillTitle(w.topic, w.skill, lang)), el('div', { class: 'small muted' }, pick(getTopic(w.topic)?.title, lang))),
    el('span', { class: 'tag amber' }, t('profile_mistakes_n', { n: w.count }))
  ));
  const suggestions = topics.map((s) => el('a', { class: 'btn soft', href: `./practice.html?topic=${s.id}` },
    icon('refresh', { size: 16 }), `${pick(s.topic.title, lang)} · ${Math.round(s.mastery * 100)}%`));

  const has = items.length || explained.length;
  $('#reviewSection').classList.toggle('hidden', !has);
  $('#reviewList').replaceChildren(...[
    ...items,
    explained.length ? el('div', { class: 'label', style: 'margin-top:6px' }, t('review_you_should')) : null,
    ...explained,
    suggestions.length ? el('div', { class: 'row', style: 'gap:8px' }, suggestions) : null
  ].filter(Boolean));
  return has;
}

/** Ошибки из общей аналитики + текст вопроса и объяснение */
async function recentMistakes(limit) {
  const lang = getLang();
  const errors = (await store.get(KEYS.errors, [])).slice().reverse();
  const seen = new Set();
  const cards = [];

  for (const e of errors) {
    if (cards.length >= limit) break;
    const key = `${e.topic}::${e.questionId}`;
    if (seen.has(key) || !e.questionId) continue;
    seen.add(key);

    let q = await findQuestion(e.topic, e.questionId);
    // Вопросы расследований хранятся в файлах дел
    if (!q && e.gameId === 'investigation') {
      for (const meta of CASES.filter((c) => c.topic === e.topic)) {
        const data = await loadCase(meta.id);
        const clue = data?.clues.find((c) => c.id === e.questionId);
        if (clue) { q = clue.question; break; }
      }
    }
    // Шаги опытов и произношение хранятся в своих наборах
    if (!q && e.gameId === 'lab') q = findLabStep(e.questionId);
    if (!q && e.gameId === 'speak') {
      const item = findSpeakItem(e.questionId);
      if (item) q = { prompt: `${item.text} ${item.sound}`, explain: item.tip || item.hint };
    }
    if (!q) continue;

    cards.push(el('div', { class: 'card plain mistake-card' },
      el('div', { class: 'small muted' }, `${skillTitle(e.topic, e.skill, lang)} · ${pick(getTopic(e.topic)?.title, lang)}`),
      el('b', {}, pick(q.prompt ?? q.question, lang)),
      el('p', { class: 'small mistake-explain' }, icon('info', { size: 16 }), el('span', {}, pick(q.explain ?? q.explanation, lang)))
    ));
  }
  return cards;
}

// ─── Достижения: полученные ярко, остальные — бледно ─────────────────────────

function renderBadges(pr) {
  const lang = getLang();
  $('#badgeSection').classList.remove('hidden');
  const owned = BADGES.filter((b) => pr.badges.includes(b.id));
  const next = BADGES.filter((b) => !pr.badges.includes(b.id));
  $('#badgeCount').textContent = `${owned.length}/${BADGES.length}`;
  $('#badgeGrid').replaceChildren(...[...owned, ...next].map((b) => {
    const on = pr.badges.includes(b.id);
    return el('div', { class: `badge-card ${on ? 'on' : ''}`, title: pick(b.title, lang) },
      el('span', { class: 'badge-icon' }, icon(BADGE_ICON[b.id] || 'medal', { size: 24 })),
      el('span', { class: 'small' }, pick(b.title, lang)),
      on ? null : el('span', { class: 'sr-only' }, t('profile_badge_locked'))
    );
  }));
}

// ─── Последние игры ───────────────────────────────────────────────────────────

async function renderHistory() {
  const lang = getLang();
  const list = await history(8);
  $('#historySection').classList.toggle('hidden', !list.length);
  $('#historyList').replaceChildren(...list.map((h) => {
    const topic = getTopic(h.topic);
    const game = getGame(h.gameId);
    const title = game ? pick(game.title, lang) : topic ? pick(topic.title, lang) : h.gameId;
    const when = new Date(h.at).toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'ru' ? 'ru-RU' : 'ky-KG', { day: 'numeric', month: 'short' });
    return el('div', { class: 'history-row' },
      el('div', {}, el('b', {}, title),
        el('div', { class: 'small muted' }, [topic && game ? pick(topic.title, lang) : null, when].filter(Boolean).join(' · '))),
      h.total ? el('span', { class: 'small history-ratio' }, t('profile_correct_of', { n: h.correct, total: h.total })) : el('span'),
      el('b', { class: 'history-score' }, `${h.score}`)
    );
  }));
  return list.length;
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'progress.html' });
  await migrateLegacy(); // XP старых языковых игр — в общий профиль

  $('#emptyArt').replaceChildren(cover(icon('play', { size: 48 }), 'violet'));
  $('#firstGameBtn').replaceChildren(icon('play', { size: 18 }), el('span', {}, t('profile_first_game')));

  const renderAll = async () => {
    const [p, pr] = await Promise.all([getProfile(), getProgress()]);
    renderProfile(p, pr);
    const played = Object.keys(pr.games || {}).length > 0 || (await history(1)).length > 0;
    const fresh = !pr.xp && !played;
    // Совсем новый ученик — одна понятная карточка вместо пустых блоков
    $('#emptyProfile').classList.toggle('hidden', !fresh);
    $('#statsSection').classList.toggle('hidden', fresh);
    if (fresh) return;
    renderStats(pr);
    renderBadges(pr);
    await renderHistory();
    await renderKnowledgeMap();
    await renderReview();
  };
  await renderAll();
  window.addEventListener('ba:synced', renderAll); // данные пришли из облака
})();
