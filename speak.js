/**
 * Bilim Arena — «Айт! / Говори»: тренировка произношения.
 *
 * Ученик слушает образец и произносит слово или фразу, браузер
 * распознаёт речь и сравнивает с образцом. Где распознавания нет
 * (или микрофон запрещён) — режим «Послушай и напиши».
 *
 * Результаты идут в общий прогресс: XP, навыки темы, разбор ошибок.
 */

import { bootstrap, mountHeader, el, $, toast, sfx, confetti } from './core/ui.js';
import { icon } from './core/icons.js';
import { t, pick, getLang } from './core/i18n.js';
import { recordAnswer, recordGame } from './core/progress.js';
import { canListen, canSpeak, speak, listen, bestMatch, normalize, PASS_SCORE } from './core/speech.js';
import { SPEAK_SETS, getSet } from './data/speaking/index.js';

const ROUND = 10;          // заданий за раз
const MAX_ATTEMPTS = 3;    // попыток на задание
const POINTS = [100, 70, 40];

const state = {
  mode: canListen() ? 'speak' : 'type',
  set: null,
  items: [],
  index: 0,
  attempts: 0,
  busy: false,
  done: false,
  results: [],   // { item, ok, attempts, heard }
  itemStart: 0
};

const screens = ['pickScreen', 'playScreen', 'resultScreen'];
const show = (id) => screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));
const stat = (v, l) => el('div', { class: 'stat' }, el('b', {}, String(v)), el('span', {}, l));

const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── Выбор набора ─────────────────────────────────────────────────────────────

function renderPicker() {
  const lang = getLang();

  $('#supportNote').textContent = canListen() ? t('sp_supported') : `${t('sp_unsupported')}`;

  const modes = [['speak', t('sp_mode_speak')], ['type', t('sp_mode_type')]];
  $('#modeChips').replaceChildren(...modes.map(([id, label]) => el('button', {
    class: 'chip', type: 'button',
    'aria-pressed': String(state.mode === id),
    disabled: id === 'speak' && !canListen(),
    onclick: () => { state.mode = id; renderPicker(); }
  }, label)));

  $('#setGrid').replaceChildren(...SPEAK_SETS.map((set) => el('button', {
    class: 'card game-card', type: 'button', style: 'text-align:left;cursor:pointer',
    onclick: () => startRound(set.id)
  },
    el('div', { style: 'font-size:2rem' }, set.icon),
    el('b', {}, pick(set.title, lang)),
    el('div', { class: 'small muted' }, t('sp_items', { n: set.items.length }))
  )));
  show('pickScreen');
}

// ─── Тренировка ───────────────────────────────────────────────────────────────

function startRound(setId, items = null) {
  state.set = getSet(setId);
  state.items = items || shuffle(state.set.items).slice(0, ROUND);
  state.index = 0;
  state.results = [];
  show('playScreen');
  showItem();
}

function showItem() {
  const item = state.items[state.index];
  const lang = getLang();
  const typing = state.mode === 'type';
  state.attempts = 0;
  state.done = false;
  state.busy = false;
  state.itemStart = Date.now();

  $('#counter').textContent = `${state.index + 1} / ${state.items.length}`;
  $('#progressBar').style.width = `${(state.index / state.items.length) * 100}%`;

  // В режиме «Послушай и напиши» слово скрыто — его нужно расслышать
  $('#target').textContent = typing ? '?' : item.text;
  $('#target').setAttribute('lang', state.set.lang.slice(0, 2));
  $('#sound').textContent = typing ? '' : item.sound;
  $('#meaning').textContent = pick(item.hint, lang);
  // Подсказка может выдать написание — в режиме письма она появится после ответа
  $('#tip').classList.toggle('hidden', !item.tip || typing);
  $('#tip').textContent = item.tip ? `${pick(item.tip, lang)}` : '';

  $('#micBtn').classList.toggle('hidden', typing);
  $('#micBtn').disabled = false;
  $('#micBtn').replaceChildren(icon('mic'), t('sp_speak_btn'));
  $('#typeForm').classList.toggle('hidden', !typing);
  $('#typeInput').value = '';
  $('#typeInput').disabled = false;
  $('#listenBtn').disabled = !canSpeak();
  $('#heard').textContent = '';
  setFeedback('', '');
  $('#skipBtn').classList.remove('hidden');
  $('#nextBtn').classList.add('hidden');
  renderAttempts();

  if (typing) {
    $('#typeInput').focus();
    speak(item.text, state.set.lang);
  }
}

function renderAttempts() {
  const left = MAX_ATTEMPTS - state.attempts;
  $('#attempts').replaceChildren(...Array.from({ length: MAX_ATTEMPTS }, (_, i) =>
    el('i', { class: i < left ? 'on' : '' })));
  $('#attempts').setAttribute('aria-label', `${left}/${MAX_ATTEMPTS}`);
}

function setFeedback(text, kind) {
  const box = $('#feedback');
  box.textContent = text;
  box.className = `speak-feedback ${kind}`;
}

/** Ученик сказал — сравниваем с образцом */
async function onMic() {
  if (state.busy || state.done) return;
  const item = state.items[state.index];
  state.busy = true;
  if (canSpeak()) speechSynthesis.cancel();
  $('#micBtn').disabled = true;
  $('#micBtn').classList.add('listening');
  $('#micBtn').replaceChildren(icon('mic'), t('sp_listening'));
  setFeedback('', '');

  try {
    const { alternatives } = await listen(state.set.lang);
    const match = bestMatch(item.text, alternatives, item.accept);
    $('#heard').textContent = t('sp_heard', { text: match.heard || '…' });
    judge(match.score >= PASS_SCORE, match.score >= 1, match.heard);
  } catch (err) {
    const code = err?.code || 'error';
    if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'unsupported') {
      toast(t('sp_mic_denied'), { icon: '🎤' });
      state.mode = 'type';
      showItem(); // то же задание, но в режиме «Послушай и напиши»
      return;
    }
    // Тишина или сбой — попытка не сгорает
    setFeedback(code === 'network' ? t('sp_network') : (code === 'no-speech' || code === 'aborted' ? t('sp_no_speech') : t('sp_error')), 'warn');
  } finally {
    $('#micBtn').classList.remove('listening');
    if (!state.done) {
      $('#micBtn').disabled = false;
      $('#micBtn').replaceChildren(icon('mic'), t('sp_speak_btn'));
    }
    state.busy = false;
  }
}

/** «Послушай и напиши»: здесь нужна точная запись, «почти» не засчитывается */
function onType(e) {
  e.preventDefault();
  if (state.done) return;
  const item = state.items[state.index];
  const typed = $('#typeInput').value;
  if (!normalize(typed)) return;
  const ok = [item.text, ...(item.accept || [])].some((x) => normalize(x) === normalize(typed));
  judge(ok, ok, typed);
}

/** Итог попытки: засчитать, дать ещё попытку или завершить задание */
function judge(ok, perfect, heard) {
  const item = state.items[state.index];
  const typing = state.mode === 'type';
  state.attempts += 1;
  renderAttempts();

  if (ok) {
    sfx.ok();
    setFeedback(typing ? t('sp_type_ok') : (perfect ? t('sp_perfect') : t('sp_almost')), 'ok');
    return finishItem(true, heard);
  }

  sfx.bad();
  const left = MAX_ATTEMPTS - state.attempts;
  if (left > 0) {
    setFeedback(t(typing ? 'sp_type_again' : 'sp_try_again', { n: left }), 'bad');
    if (typing) { $('#typeInput').select(); speak(item.text, state.set.lang, 0.7); }
    return;
  }
  setFeedback(typing ? t('sp_spelling', { text: item.text }) : t('sp_failed'), 'bad');
  finishItem(false, heard);
}

async function finishItem(ok, heard) {
  const item = state.items[state.index];
  state.done = true;
  state.results.push({ item, ok, attempts: state.attempts, heard });

  // Слово показываем всегда: в режиме письма — после ответа
  $('#target').textContent = item.text;
  $('#sound').textContent = item.sound;
  $('#tip').classList.toggle('hidden', !item.tip);
  $('#micBtn').disabled = true;
  $('#typeInput').disabled = true;
  $('#skipBtn').classList.add('hidden');
  $('#nextBtn').classList.remove('hidden');
  $('#nextBtn').focus();

  await recordAnswer({
    topic: state.set.topic, skill: item.skill, correct: ok,
    questionId: item.id, timeMs: Date.now() - state.itemStart, gameId: 'speak'
  });
}

function next() {
  state.index += 1;
  if (state.index >= state.items.length) return finishRound();
  showItem();
}

function skip() {
  if (state.done) return;
  state.attempts = MAX_ATTEMPTS;
  setFeedback(t('sp_failed'), 'bad');
  finishItem(false, '');
}

// ─── Итог ─────────────────────────────────────────────────────────────────────

async function finishRound() {
  const lang = getLang();
  const r = state.results;
  const correct = r.filter((x) => x.ok).length;
  const score = r.reduce((s, x) => s + (x.ok ? POINTS[x.attempts - 1] || 0 : 0), 0);
  const acc = r.length ? Math.round((correct / r.length) * 100) : 0;

  await recordGame({ gameId: 'speak', topic: state.set.topic, score, correct, total: r.length });

  $('#progressBar').style.width = '100%';
  $('#resultIcon').replaceChildren(icon(acc >= 80 ? 'trophy' : acc >= 50 ? 'star' : 'target', { size: 36 }));
  $('#resultStats').replaceChildren(
    stat(`${correct}/${r.length}`, t('results_correct')),
    stat(`${acc}%`, t('accuracy')),
    stat(score, t('sp_points'))
  );

  const weak = r.filter((x) => !x.ok || x.attempts > 1);
  $('#practiseList').replaceChildren(...(weak.length
    ? weak.map((x) => el('div', { class: 'row between speak-review' },
      el('div', {},
        el('b', { lang: state.set.lang.slice(0, 2) }, x.item.text), ' ',
        el('span', { class: 'muted' }, `${x.item.sound} · ${pick(x.item.hint, lang)}`)
      ),
      el('button', {
        class: 'btn ghost', type: 'button', 'aria-label': `${t('sp_listen')}: ${x.item.text}`,
        disabled: !canSpeak(),
        onclick: () => speak(x.item.text, state.set.lang, 0.8)
      }, icon('sound'))
    ))
    : [el('p', { class: 'muted' }, t('results_nothing_wrong'))]));

  // «Ещё раз» — сначала то, что не получилось
  $('#againBtn').onclick = () => {
    const retry = weak.map((x) => x.item);
    const rest = shuffle(state.set.items.filter((x) => !retry.includes(x)));
    startRound(state.set.id, [...retry, ...rest].slice(0, ROUND));
  };

  show('resultScreen');
  if (acc >= 80) { sfx.win(); confetti(); }
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'speak.html' });

  $('#listenBtn').onclick = () => {
    const item = state.items[state.index];
    if (item) speak(item.text, state.set.lang);
  };
  $('#micBtn').onclick = onMic;
  $('#typeForm').onsubmit = onType;
  $('#nextBtn').onclick = next;
  $('#skipBtn').onclick = skip;
  $('#otherBtn').onclick = renderPicker;
  $('#typeInput').placeholder = t('sp_type_placeholder');
  $('#listenBtn').replaceChildren(icon('sound'), t('sp_listen'));

  // Голоса синтеза в Chrome подгружаются асинхронно
  if (canSpeak()) speechSynthesis.getVoices();

  renderPicker();
})();
