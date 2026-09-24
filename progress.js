/**
 * Bilim Arena — кабинет ученика.
 *
 * Показывает не только XP, но и главное: какие темы освоены,
 * какие нужно повторить и какие ошибки повторяются чаще всего.
 */

import { bootstrap, mountHeader, el, $, toast } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { SUBJECTS, TOPICS, getTopic, getSubject, skillTitle, findQuestion } from './core/curriculum.js';
import { store, KEYS } from './core/store.js';
import { loadCase, CASES } from './data/investigations/index.js';
import { getProgress, knowledgeMap, weakSkills, reviewSuggestions, history, BADGES, migrateLegacy } from './core/progress.js';
import { getProfile, saveProfile, AVATARS } from './core/profile.js';

const stat = (value, label) => el('div', { class: 'stat' }, el('b', {}, String(value)), el('span', {}, label));

const STATE_ICON = { learned: '✅', review: '⚠️', new: '○' };

async function renderProfile() {
  const p = await getProfile();
  const pr = await getProgress();
  const lang = getLang();

  $('#avatar').textContent = p.avatar || '🦊';
  $('#nameInput').value = p.name || '';
  $('#levelLine').textContent =
    `${t('profile_level', { level: pr.level })} · ${pick(pr.title, lang)} · ${t('profile_xp', { xp: pr.xp })}`;
  $('#xpBar').style.width = pr.levelPct + '%';
  $('#xpNote').textContent = t('profile_next_level', { xp: pr.levelNeed - pr.levelInto });

  $('#mainStats').replaceChildren(
    stat(pr.streak, `🔥 ${t('profile_streak', { days: '' }).trim()}`),
    stat(Object.keys(pr.topics).length, t('subjects')),
    stat(pr.badges.length, t('achievements')),
    stat(`${pr.dayXP}/${pr.dailyGoal}`, 'XP')
  );

  $('#avatarPicker').replaceChildren(...AVATARS.map((a) => el('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(a === p.avatar),
    onclick: async () => { await saveProfile({ avatar: a }); renderProfile(); }
  }, a)));
}

async function renderKnowledgeMap() {
  const lang = getLang();
  const map = await knowledgeMap(TOPICS);
  const rows = [];

  for (const subject of SUBJECTS) {
    const s = map[subject.id];
    if (!s) continue; // предмет без тем пока не показываем
    rows.push(el('div', { class: 'km-row' },
      el('div', { class: 'row between' },
        el('b', {}, `${subject.icon} ${pick(subject.title, lang)}`),
        el('span', { class: 'muted small' }, `${s.percent}% · ${t('mastery_of_topics', { done: s.learned, total: s.total })}`)
      ),
      el('div', { class: `bar ${s.percent >= 80 ? 'ok' : ''}` }, el('i', { style: `width:${s.percent}%` })),
      el('div', { class: 'row small', style: 'gap:14px;margin-top:4px' },
        el('span', { class: 'state learned' }, `${STATE_ICON.learned} ${t('mastery_learned')}: ${s.learned}`),
        el('span', { class: 'state review' }, `${STATE_ICON.review} ${t('mastery_review')}: ${s.review}`),
        el('span', { class: 'state new' }, `${STATE_ICON.new} ${t('mastery_new')}: ${s.new}`)
      )
    ));
  }

  $('#knowledgeMap').replaceChildren(...(rows.length ? rows : [el('p', { class: 'muted' }, t('empty_none'))]));
}

async function renderReview() {
  const lang = getLang();
  const weak = await weakSkills({ limit: 5 });
  const topics = await reviewSuggestions(3);

  const items = weak.map((w) => el('div', { class: 'row between review-row' },
    el('span', {}, `⚠️ ${skillTitle(w.topic, w.skill, lang)}`),
    el('span', { class: 'muted small' }, pick(getTopic(w.topic)?.title, lang)),
    el('b', {}, `${w.count}`)
  ));

  const suggestions = topics.map((s) => el('a', {
    class: 'btn', href: `./practice.html?topic=${s.id}`
  }, `🔁 ${pick(s.topic.title, lang)} — ${Math.round(s.mastery * 100)}%`));

  // Последние ошибки — всегда с объяснением, а не просто «неверно»
  const explained = await recentMistakes(4);

  $('#reviewList').replaceChildren(
    ...(items.length ? items : [el('p', { class: 'muted' }, t('results_nothing_wrong'))]),
    ...(explained.length ? [el('div', { class: 'label', style: 'margin-top:14px' }, t('review_you_should'))] : []),
    ...explained,
    ...(suggestions.length ? [el('div', { class: 'row', style: 'margin-top:10px' }, suggestions)] : [])
  );
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
    if (!q) continue;

    cards.push(el('div', { class: 'card plain', style: 'margin-bottom:8px' },
      el('div', { class: 'small muted' }, `⚠️ ${skillTitle(e.topic, e.skill, lang)} · ${pick(getTopic(e.topic)?.title, lang)}`),
      el('b', {}, pick(q.prompt ?? q.question, lang)),
      el('p', { class: 'small', style: 'margin:6px 0 0' }, `💡 ${pick(q.explain ?? q.explanation, lang)}`)
    ));
  }
  return cards;
}

async function renderBadges() {
  const pr = await getProgress();
  const lang = getLang();
  $('#badgeGrid').replaceChildren(...BADGES.map((b) => {
    const owned = pr.badges.includes(b.id);
    return el('div', { class: `badge-card ${owned ? 'on' : ''}`, title: pick(b.title, lang) },
      el('div', { class: 'badge-icon' }, b.icon),
      el('div', { class: 'small' }, pick(b.title, lang))
    );
  }));
}

async function renderHistory() {
  const lang = getLang();
  const list = await history(10);
  $('#historyList').replaceChildren(...(list.length ? list.map((h) => {
    const topic = getTopic(h.topic);
    const subject = topic ? getSubject(topic.subject) : null;
    return el('div', { class: 'row between', style: 'padding:.45em 0;border-bottom:1px solid var(--line)' },
      el('span', {}, `${subject?.icon || '🎮'} ${topic ? pick(topic.title, lang) : h.gameId}`),
      el('span', { class: 'muted small' }, `${h.correct}/${h.total}`),
      el('b', {}, `${h.score}`)
    );
  }) : [el('p', { class: 'muted' }, t('empty_none'))]));
}

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'progress.html' });
  await migrateLegacy(); // перенос прогресса со старой версии сайта

  await renderProfile();
  await renderKnowledgeMap();
  await renderReview();
  await renderBadges();
  await renderHistory();

  $('#saveProfileBtn').addEventListener('click', async () => {
    const name = $('#nameInput').value.trim();
    if (!name) return toast(t('err_enter_name'), { icon: '⚠️' });
    await saveProfile({ name });
    toast(t('save'), { icon: '✅' });
    renderProfile();
  });
})();
