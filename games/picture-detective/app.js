/**
 * Picture Detective: Describe & Discover — интерфейс.
 * Ученик описывает картинку своими английскими предложениями (текстом или голосом),
 * engine.js проверяет смысловые детали по рубрике. Одна попытка дополнить ответ.
 * Голос распознаёт сам браузер; запись никуда не отправляется и не сохраняется.
 */

import { bootstrap, mountHeader, el, $, toast, sfx, confetti } from '../../core/ui.js';
import { icon } from '../../core/icons.js';
import { t, pick, getLang } from '../../core/i18n.js';
import { recordAnswer, recordGame, getProgress } from '../../core/progress.js';
import { resultView } from '../../core/results.js';
import { canListen, canSpeak, listen, speak } from '../../core/speech.js';
import { TASKS } from './tasks.js';
import { SCENES } from './scenes.js';
import { LEVELS, evaluate, summary, sentences } from './engine.js';

const GAME_ID = 'picture-detective';
const TOPIC = 'english-5-basics';
const PASS = 70;
const state = { level: 'beginner', tasks: [], index: 0, results: [], phase: 'first', saved: false, started: 0, xpBefore: 0 };
const screens = ['startScreen', 'playScreen', 'resultScreen'];
const show = (id) => screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));
const task = () => state.tasks[state.index];

// ─── Начало ───────────────────────────────────────────────────────────────────

function renderStart() {
  $('#levelList').replaceChildren(...LEVELS.map((l) => el('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(l === state.level),
    onclick: () => { state.level = l; renderStart(); }
  }, t(`eg_level_${l}`))));
  $('#taskCount').textContent = t('pd_task_count', { n: TASKS.filter((x) => x.level === state.level).length });
  show('startScreen');
}

async function start() {
  state.tasks = TASKS.filter((x) => x.level === state.level);
  state.index = 0;
  state.results = [];
  state.saved = false;
  state.started = Date.now();
  state.xpBefore = (await getProgress()).xp;
  show('playScreen');
  openTask();
}

// ─── Задание ──────────────────────────────────────────────────────────────────

function openTask() {
  const tk = task();
  const lang = getLang();
  state.phase = 'first';
  $('#counter').textContent = `${state.index + 1} / ${state.tasks.length}`;
  $('#progressBar').style.width = `${(state.index / state.tasks.length) * 100}%`;
  $('#taskTitle').textContent = pick(tk.title, lang);
  // Подпись картинки — только название сцены: подробности не подсказываем
  $('#picture').replaceChildren(el('div', { html: SCENES[tk.scene] }), el('figcaption', { class: 'sr-only' }, `${t('pd_picture')}: ${pick(tk.title, lang)}`));
  $('#prompt').textContent = tk.prompt;
  $('#listenBtn').classList.toggle('hidden', !canSpeak());
  $('#listenBtn').replaceChildren(icon('sound', { size: 18 }), ' ', t('eg_listen'));
  $('#answer').value = '';
  $('#answer').disabled = false;
  $('#checkBtn').disabled = false;
  $('#feedback').classList.add('hidden');
  $('#micNote').textContent = canListen() ? '' : t('pd_no_mic');
  $('#micBtn').classList.toggle('hidden', !canListen());
  $('#micBtn').replaceChildren(icon('mic', { size: 18 }), ' ', t('pd_speak'));
  updateSentenceNote();
  $('#answer').focus();
}

function updateSentenceNote() {
  const n = sentences($('#answer').value).length;
  $('#sentenceNote').textContent = t('pd_sentences', { n, need: task().minSentences });
}

/** Голос: разрешение на микрофон → распознавание браузером → текст в поле (можно поправить) */
async function dictate() {
  const btn = $('#micBtn');
  btn.disabled = true;
  $('#micNote').textContent = t('pd_mic_permission');
  try {
    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((tr) => tr.stop()); // только разрешение — сами ничего не записываем
    }
    $('#micNote').textContent = t('pd_listening');
    const { alternatives } = await listen('en-US', { timeoutMs: 12000 });
    const heard = (alternatives[0] || '').trim();
    if (heard) {
      const box = $('#answer');
      const spaced = box.value.trim() ? `${box.value.trim()} ` : '';
      box.value = `${spaced}${heard.charAt(0).toUpperCase()}${heard.slice(1)}${/[.!?]$/.test(heard) ? '' : '.'}`;
      updateSentenceNote();
      $('#micNote').textContent = t('pd_heard');
      box.focus();
    } else $('#micNote').textContent = t('pd_not_heard');
  } catch (e) {
    $('#micNote').textContent = e?.code === 'unsupported' ? t('pd_no_mic') : (e?.name === 'NotAllowedError' || e?.code === 'not-allowed') ? t('pd_mic_denied') : t('pd_not_heard');
  }
  btn.disabled = false;
}

// ─── Проверка ─────────────────────────────────────────────────────────────────

async function check() {
  const tk = task();
  const text = $('#answer').value.trim();
  if (!text) { toast(t('pd_empty'), { icon: 'ℹ️' }); return; }
  const r = evaluate(tk, text);
  const isRetry = state.phase === 'retry';
  if (!isRetry) state.results.push({ taskId: tk.id, first: { ...r, text }, retry: null });
  else state.results.at(-1).retry = { ...r, text };
  await recordAnswer({ topic: TOPIC, skill: 'describing', correct: r.score >= PASS, questionId: `${GAME_ID}:${tk.id}${isRetry ? ':retry' : ''}`, gameId: GAME_ID, attemptXP: false });
  if (r.score >= PASS) sfx.ok?.(); else sfx.bad?.();
  renderFeedback(tk, r, isRetry);
}

function renderFeedback(tk, r, isRetry) {
  const lang = getLang();
  const byId = new Map(tk.elements.map((e) => [e.id, e]));
  const last = isRetry || r.score >= 100;
  const first = state.results.at(-1).first;
  const box = $('#feedback');
  box.className = `card stack pd-feedback ${r.score >= PASS ? 'good' : 'more'}`;
  box.replaceChildren(...[
    el('div', { class: 'row between' }, el('b', {}, t('pd_completeness')), el('b', { class: 'pd-score' }, `${r.score}%`)),
    el('div', { class: `bar ${r.score >= PASS ? 'ok' : ''}`, role: 'progressbar', 'aria-valuenow': String(r.score), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': t('pd_completeness') }, el('i', { style: `width:${r.score}%` })),
    isRetry ? el('p', { class: 'small', style: 'margin:0' }, t('pd_compare', { a: first.score, b: r.score })) : null,
    r.found.length ? el('div', {}, el('b', {}, `✓ ${t('pd_found')}`), el('ul', { class: 'pd-list' }, ...r.found.map((id) => el('li', {}, pick(byId.get(id).label, lang))))) : null,
    r.missed.length ? el('div', {}, el('b', {}, `✗ ${t('pd_missed')}`), el('ul', { class: 'pd-list' }, ...r.missed.map((id) => el('li', {}, pick(byId.get(id).label, lang), el('span', { class: 'small muted' }, ` — ${pick(byId.get(id).tip, lang)}`))))) : null,
    r.precision.length ? el('p', { class: 'small', style: 'margin:0' }, el('b', {}, `${t('pd_precise')}: `), el('span', { lang: 'en' }, r.precision.join(', '))) : null,
    r.tooShort ? el('p', { class: 'small', style: 'margin:0' }, t('pd_too_short', { n: r.sentences, need: r.required })) : null,
    r.hints.length ? el('div', {}, el('b', {}, t('pd_grammar')), el('ul', { class: 'pd-list' }, ...r.hints.map((h) => el('li', { class: 'small' }, t(`pd_hint_${h}`))))) : null,
    // Образцы — только когда попытки закончились
    last ? el('div', { class: 'card plain stack' }, el('b', {}, t('pd_examples')), ...tk.examples.map((x) => el('span', { lang: 'en' }, x))) : null,
    el('div', { class: 'row', style: 'gap:8px' },
      !last ? el('button', { class: 'btn primary', type: 'button', onclick: retry }, t('pd_improve')) : null,
      el('button', { class: `btn ${last ? 'primary' : 'ghost'}`, type: 'button', onclick: next }, state.index + 1 < state.tasks.length ? t('pd_next') : t('sl_to_ending')))
  ].filter(Boolean));
  box.classList.remove('hidden');
  $('#answer').disabled = true;
  $('#checkBtn').disabled = true;
  box.querySelector('button.primary')?.focus();
}

/** Вторая попытка: прежний текст остаётся — его можно дополнить */
function retry() {
  state.phase = 'retry';
  $('#feedback').classList.add('hidden');
  $('#answer').disabled = false;
  $('#checkBtn').disabled = false;
  const box = $('#answer');
  box.focus();
  box.setSelectionRange(box.value.length, box.value.length);
}

function next() {
  state.index += 1;
  if (state.index >= state.tasks.length) finish();
  else openTask();
}

// ─── Итог ─────────────────────────────────────────────────────────────────────

async function finish() {
  const lang = getLang();
  const s = summary(state.results);
  if (!state.saved) {
    state.saved = true;
    await recordGame({ gameId: GAME_ID, topic: TOPIC, score: s.average, correct: s.passed, total: s.tasks });
  }
  const xp = Math.max(0, (await getProgress()).xp - state.xpBefore);
  const tasks = new Map(TASKS.map((x) => [x.id, x]));
  // Детали, которые чаще всего пропускались — конкретные рекомендации
  const missed = state.results.flatMap((r) => (r.retry || r.first).missed.map((id) => tasks.get(r.taskId).elements.find((e) => e.id === id)));
  const extra = el('div', { class: 'card plain stack' },
    el('b', {}, t('eg_recommend')),
    missed.length
      ? el('ul', { class: 'pd-list small' }, ...missed.slice(0, 4).map((e) => el('li', {}, pick(e.tip, lang))))
      : el('p', { class: 'small', style: 'margin:0' }, t('pd_rec_good')),
    s.improved ? el('span', { class: 'small muted' }, t('pd_improved_n', { n: s.improved })) : null);
  $('#resultScreen').replaceChildren(resultView({
    accuracy: s.average, xp, correct: s.passed, total: s.tasks,
    timeSec: Math.round((Date.now() - state.started) / 1000),
    skills: [{ title: t('pd_skill_describing'), ok: s.passed, total: s.tasks }],
    // Разбор по заданиям: первая попытка → после дополнения, что пропущено
    mistakes: state.results.filter((r) => Math.max(r.first.score, r.retry?.score ?? 0) < 100).map((r) => {
      const tk = tasks.get(r.taskId);
      const final = r.retry || r.first;
      return {
        prompt: `${pick(tk.title, lang)}: ${r.first.score}%${r.retry ? ` → ${r.retry.score}%` : ''}`,
        explain: final.missed.map((id) => pick(tk.elements.find((e) => e.id === id).label, lang)).join(', ') || t('pd_only_sentences')
      };
    }),
    extra,
    onAgain: () => start(),
    other: { label: t('eg_back_catalog'), href: '../../games.html' }
  }));
  show('resultScreen');
  $('#resultScreen h1')?.focus();
  if (s.average >= PASS) { sfx.win?.(); confetti(); }
}

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'games.html' });
  renderStart();
  $('#startBtn').addEventListener('click', start);
  $('#checkBtn').addEventListener('click', check);
  $('#micBtn').addEventListener('click', dictate);
  $('#listenBtn').addEventListener('click', () => speak(task().prompt, 'en-US', 0.9));
  $('#answer').addEventListener('input', updateSentenceNote);
})();
