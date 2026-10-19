/**
 * Story Lab: Branching Adventures — интерфейс.
 * Ученик отвечает персонажам английскими репликами; выбор меняет ход истории (engine.js).
 * Перевод реплики — по кнопке; перевод и разбор ответа — только после выбора.
 */

import { bootstrap, mountHeader, el, $, sfx, confetti } from '../../core/ui.js';
import { icon } from '../../core/icons.js';
import { cover } from '../../core/art.js';
import { t, pick, getLang } from '../../core/i18n.js';
import { store } from '../../core/store.js';
import { recordAnswer, recordGame, getProgress } from '../../core/progress.js';
import { resultView } from '../../core/results.js';
import { canSpeak, speak } from '../../core/speech.js';
import { STORIES, getStory } from './stories.js';
import { createRun, currentNode, choose, result } from './engine.js';

const GAME_ID = 'story-lab';
const TOPIC = 'english-5-basics';
const ENDINGS_KEY = 'story_lab_endings'; // какие концовки ученик уже открыл (только для подсказки «ещё N»)
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const state = { level: 'beginner', story: null, run: null, saved: false, started: 0, xpBefore: 0, mistakes: [] };
const screens = ['startScreen', 'playScreen', 'resultScreen'];
const show = (id) => screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));
const ART = { school: 'school', book: 'book', quiz: 'quiz', smile: 'smile', users: 'users', coin: 'coin', map: 'map', bolt: 'bolt', museum: 'flag' };
const TONE = { beginner: 'teal', intermediate: 'amber', advanced: 'violet' };

async function openedEndings() { return (await store.get(ENDINGS_KEY, {})) || {}; }

// ─── Выбор истории ────────────────────────────────────────────────────────────

async function renderStart() {
  const lang = getLang();
  const opened = await openedEndings();
  $('#levelList').replaceChildren(...LEVELS.map((l) => el('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(l === state.level),
    onclick: () => { state.level = l; renderStart(); }
  }, t(`eg_level_${l}`))));
  const list = [...STORIES].sort((a, b) => (b.level === state.level) - (a.level === state.level));
  $('#storyList').replaceChildren(...list.map((s) => {
    const total = Object.keys(s.endings).length;
    const got = (opened[s.id] || []).length;
    return el('button', { class: `card sl-story ${s.level === state.level ? 'match' : ''}`, type: 'button', onclick: () => start(s.id) },
      el('div', { class: 'sl-story-art' }, cover(icon(ART[s.art] || 'book', { size: 40 }), TONE[s.level])),
      el('b', { lang: 'en' }, s.title.en),
      el('span', { class: 'small' }, pick(s.title, lang)),
      el('span', { class: 'small muted' }, pick(s.desc, lang)),
      el('span', { class: 'chips' },
        el('span', { class: 'chip small' }, t(`eg_level_${s.level}`)),
        el('span', { class: 'chip small' }, t('sl_endings_found', { n: got, total }))));
  }));
  show('startScreen');
}

async function start(storyId) {
  state.story = getStory(storyId);
  state.run = createRun(state.story);
  state.saved = false;
  state.mistakes = [];
  state.started = Date.now();
  state.xpBefore = (await getProgress()).xp;
  $('#storyTitle').textContent = state.story.title.en;
  $('#storyTitle').setAttribute('lang', 'en');
  show('playScreen');
  renderNode();
}

// ─── Сцена ────────────────────────────────────────────────────────────────────

function renderNode() {
  const lang = getLang();
  const node = currentNode(state.run, state.story);
  const step = state.run.history.length + 1;
  $('#stepLabel').textContent = t('sl_step', { n: step });
  // Длина истории зависит от пути — прогресс оцениваем по 5 шагам
  const pct = Math.min(95, Math.round(((step - 1) / 5) * 100));
  $('#progressBar').style.width = `${pct}%`;
  $('#progressWrap').setAttribute('aria-valuenow', String(pct));
  $('#feedback').classList.add('hidden');
  const translation = el('p', { class: 'small muted hidden sl-translation' }, pick(node.lineT, lang));
  $('#scene').replaceChildren(
    el('div', { class: 'sl-art' }, cover(icon(ART[node.art] || 'book', { size: 44 }), TONE[state.story.level])),
    el('p', { class: 'sl-context' }, pick(node.context, lang)),
    el('div', { class: 'sl-bubble' },
      el('b', { class: 'sl-speaker', lang: 'en' }, node.speaker),
      el('p', { class: 'sl-line', lang: 'en' }, `“${node.line}”`),
      translation),
    el('div', { class: 'row', style: 'gap:8px' },
      canSpeak() ? el('button', { class: 'btn soft', type: 'button', onclick: () => speak(node.line, 'en-US', 0.9) }, icon('sound', { size: 18 }), ' ', t('eg_listen')) : null,
      el('button', { class: 'btn ghost', type: 'button', onclick: (e) => { translation.classList.toggle('hidden'); e.currentTarget.setAttribute('aria-expanded', String(!translation.classList.contains('hidden'))); }, 'aria-expanded': 'false' }, t('sl_translate')))
  );
  $('#choices').setAttribute('aria-label', t('sl_your_answer'));
  $('#choices').replaceChildren(
    el('b', {}, t('sl_your_answer')),
    ...node.choices.map((c, i) => el('button', { class: 'option sl-choice', type: 'button', lang: 'en', onclick: () => pickChoice(i) },
      el('span', { class: 'key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), el('span', {}, c.text))));
  if (canSpeak()) speak(node.line, 'en-US', 0.9);
}

async function pickChoice(index) {
  const lang = getLang();
  const node = currentNode(state.run, state.story);
  const nodeId = state.run.nodeId;
  const res = choose(state.run, state.story, index);
  if (!res) return;
  const c = res.choice;
  // Кнопки больше не нажимаются — показываем выбор и реакцию
  [...$('#choices').querySelectorAll('button')].forEach((b, i) => {
    b.disabled = true;
    if (i === index) b.classList.add(c.quality === 'best' ? 'correct' : c.quality === 'poor' ? 'wrong' : 'chosen');
  });
  if (c.quality === 'best') sfx.ok?.(); else if (c.quality === 'poor') sfx.bad?.();
  if (c.quality !== 'best') state.mistakes.push({ line: node.line, text: c.text, why: pick(c.why, lang) });
  await recordAnswer({ topic: TOPIC, skill: 'dialogue', correct: c.quality === 'best', questionId: `${GAME_ID}:${state.story.id}:${nodeId}`, gameId: GAME_ID });

  const verdict = { best: t('sl_q_best'), ok: t('sl_q_ok'), poor: t('sl_q_poor') }[c.quality];
  $('#feedback').className = `card stack sl-feedback q-${c.quality}`;
  $('#feedback').replaceChildren(...[
    el('div', { class: 'sl-bubble reply' }, el('b', { class: 'sl-speaker', lang: 'en' }, node.speaker), el('p', { class: 'sl-line', lang: 'en' }, `“${c.reply}”`)),
    el('b', {}, verdict),
    el('p', { style: 'margin:0' }, pick(c.why, lang)),
    el('p', { class: 'small', style: 'margin:0' }, el('b', {}, `${t('sl_meaning')}: `), pick(c.meaning, lang)),
    c.phrases?.length ? el('p', { class: 'small', style: 'margin:0' }, el('b', {}, `${t('sl_remember')}: `), el('span', { lang: 'en' }, c.phrases.join(' · '))) : null,
    res.changedPath ? el('p', { class: 'small muted', style: 'margin:0' }, icon('chevron', { size: 14 }), ' ', t('sl_path_changed')) : null,
    el('div', {}, el('button', { class: 'btn primary', type: 'button', onclick: () => (res.ending ? finish() : renderNode()) }, res.ending ? t('sl_to_ending') : t('sl_continue')))
  ].filter(Boolean));
  $('#feedback').classList.remove('hidden');
  if (canSpeak()) speak(c.reply, 'en-US', 0.9);
  $('#feedback button.primary').focus();
}

// ─── Концовка ─────────────────────────────────────────────────────────────────

async function finish() {
  const lang = getLang();
  const r = result(state.run);
  const ending = state.story.endings[r.ending];
  // Итог записывается один раз за прохождение
  if (!state.saved) {
    state.saved = true;
    await recordGame({ gameId: GAME_ID, topic: TOPIC, score: r.score, correct: r.best, total: r.steps });
    const opened = await openedEndings();
    opened[state.story.id] = [...new Set([...(opened[state.story.id] || []), r.ending])];
    await store.set(ENDINGS_KEY, opened);
  }
  const xp = Math.max(0, (await getProgress()).xp - state.xpBefore);
  const opened = (await openedEndings())[state.story.id] || [];
  const extra = el('div', { class: `card plain stack sl-ending ${ending.good ? 'good' : 'bad'}` },
    el('b', {}, `${ending.good ? '🏁' : '↺'} ${pick(ending.title, lang)}`),
    el('p', { style: 'margin:0' }, pick(ending.text, lang)),
    el('span', { class: 'small muted' }, t('sl_endings_found', { n: opened.length, total: Object.keys(state.story.endings).length })));
  $('#resultScreen').replaceChildren(resultView({
    accuracy: r.accuracy, xp, correct: r.best, total: r.steps,
    timeSec: Math.round((Date.now() - state.started) / 1000),
    skills: [{ title: t('sl_skill_dialogue'), ok: r.best, total: r.steps }],
    mistakes: state.mistakes.map((m) => ({ prompt: `“${m.line}” → “${m.text}”`, explain: m.why })),
    extra,
    onAgain: () => start(state.story.id),
    other: { label: t('sl_other_story'), onClick: () => renderStart() }
  }));
  show('resultScreen');
  $('#resultScreen h1')?.focus();
  if (ending.good) { sfx.win?.(); confetti(); }
}

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'games.html' });
  await renderStart();
})();
