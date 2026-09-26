/**
 * Bilim Arena — профиль ученика.
 *
 * Компактно: кто я, уровень и XP, дневная цель, серия дней.
 * Ниже — только то, в чём уже есть данные: начатые предметы,
 * ошибки с объяснениями, достижения и последние игры.
 * Пустые и нулевые показатели отдельными блоками не выводятся.
 */

import { bootstrap, mountHeader, el, $, toast } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { icon } from './core/icons.js';
import { avatar, AVATAR_VARIANTS, avatarVariant } from './core/art.js';
import { SUBJECTS, TOPICS, getTopic, skillTitle, findQuestion } from './core/curriculum.js';
import { store, KEYS } from './core/store.js';
import { loadCase, CASES } from './data/investigations/index.js';
import { findSpeakItem } from './data/speaking/index.js';
import { findLabStep } from './data/labs/index.js';
import { getGame } from './data/games.js';
import { getProgress, knowledgeMap, weakSkills, reviewSuggestions, history, BADGES, migrateLegacy } from './core/progress.js';
import { getProfile, saveProfile } from './core/profile.js';

/** Иконки достижений — из общего набора, а не эмодзи */
const BADGE_ICON = {
  'first-lesson': 'teacher', 'xp-100': 'star', 'xp-1000': 'sparkle', 'streak-7': 'flame',
  'ten-correct': 'check', 'first-team': 'team', 'fractions-master': 'chart',
  'history-expert': 'map', 'logic-master': 'logic', 'english-starter': 'language'
};

let draftAvatar = null;

// ─── Профиль и уровень ────────────────────────────────────────────────────────

async function renderProfile(p, pr) {
  const lang = getLang();
  $('#avatar').replaceChildren(avatar(p.avatar, { size: 104 }));
  $('#profileName').textContent = p.name || t('role_student');
  $('#levelLine').textContent = `${t('home_level', { n: pr.level })} · ${pick(pr.title, lang)} · ${pr.xp} XP`;
  $('#xpBar').style.width = `${pr.levelPct}%`;
  $('#xpNote').textContent = t('home_xp_next', { n: pr.levelNeed - pr.levelInto });

  // Только реальные показатели: нули не показываем
  const dayPct = Math.min(100, Math.round((pr.dayXP / pr.dailyGoal) * 100));
  const facts = [
    el('li', { class: 'fact goal' },
      icon('target', { size: 20 }),
      el('span', {}, el('b', {}, `${pr.dayXP}/${pr.dailyGoal} XP`), ' ', t('home_daily_goal').toLowerCase()),
      el('span', { class: 'bar reward mini' }, el('i', { style: `width:${dayPct}%` }))),
    pr.streak > 0 ? el('li', { class: 'fact' }, icon('flame', { size: 20, cls: 'ic-reward' }), el('span', {}, t('home_streak', { n: pr.streak }))) : null,
    Object.keys(pr.topics).length ? el('li', { class: 'fact' }, icon('book', { size: 20 }), el('span', {}, t('profile_topics_n', { n: Object.keys(pr.topics).length }))) : null
  ].filter(Boolean);
  $('#facts').replaceChildren(...facts);

  // Редактирование: имя и цвет иллюстрации
  $('#nameInput').value = p.name || '';
  draftAvatar = avatarVariant(p.avatar);
  const drawPicker = () => $('#avatarPicker').replaceChildren(...AVATAR_VARIANTS.map((v) => el('button', {
    class: 'avatar-option', type: 'button', 'aria-pressed': String(v === draftAvatar),
    'aria-label': `${t('profile_avatar')} ${AVATAR_VARIANTS.indexOf(v) + 1}`,
    onclick: () => { draftAvatar = v; drawPicker(); $('#avatar').replaceChildren(avatar(v, { size: 104 })); }
  }, avatar(v, { size: 52, animated: false }))));
  drawPicker();
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
    return el('div', { class: 'history-row' },
      el('div', {}, el('b', {}, title), topic && game ? el('div', { class: 'small muted' }, pick(topic.title, lang)) : null),
      el('span', { class: 'muted small' }, `${h.correct}/${h.total}`),
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

  const renderAll = async () => {
    const [p, pr] = await Promise.all([getProfile(), getProgress()]);
    await renderProfile(p, pr);
    const hasMap = await renderKnowledgeMap();
    const hasReview = await renderReview();
    renderBadges(pr);
    const hasHistory = await renderHistory();
    // Совсем новый ученик — одна понятная карточка вместо пустых блоков
    $('#emptyProfile').classList.toggle('hidden', !!(pr.xp || hasMap || hasReview || hasHistory));
  };
  await renderAll();
  window.addEventListener('ba:synced', renderAll); // данные пришли из облака

  $('#saveProfileBtn').addEventListener('click', async () => {
    const name = $('#nameInput').value.trim();
    if (!name) return toast(t('err_enter_name'), { icon: '⚠️' });
    await saveProfile({ name, avatar: draftAvatar });
    toast(t('save'), { icon: '✅' });
    $('#editBox').open = false;
    await renderAll();
  });
})();
