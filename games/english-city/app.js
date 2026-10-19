/**
 * English City: Action Missions — интерфейс.
 * Ученик выполняет английские инструкции: берёт предмет (касание, мышь, перетаскивание
 * или клавиатура) и кладёт его в место сцены. Проверяется конечное состояние сцены
 * (engine.js), прогресс пишется в общую систему (core/progress.js).
 */

import { bootstrap, mountHeader, el, $, toast, sfx, confetti } from '../../core/ui.js';
import { icon } from '../../core/icons.js';
import { t, pick, getLang } from '../../core/i18n.js';
import { recordAnswer, recordGame, getProgress } from '../../core/progress.js';
import { resultView } from '../../core/results.js';
import { canSpeak, speak } from '../../core/speech.js';
import { SCENES, getScene } from './data.js';
import { objectArt, zoneArt } from './art.js';
import {
  LEVELS, createMission, beginTask, currentTask, isFinished, moveObject, submit, skip, resetTask, hintObjects, summary
} from './engine.js';

const GAME_ID = 'english-city';
const TOPIC = 'english-5-basics';
const state = { sceneId: SCENES[0].id, level: 'beginner', listening: false, mission: null, scene: null, selected: null, hinted: [], textShown: false, saved: false, started: 0, xpBefore: 0 };
const screens = ['startScreen', 'playScreen', 'resultScreen'];
const show = (id) => screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));
const describe = (o) => `${o.color} ${o.kind}`; // подпись предмета для экранного диктора (учебный английский)

// ─── Начало ───────────────────────────────────────────────────────────────────

function renderStart() {
  const lang = getLang();
  $('#sceneList').replaceChildren(...SCENES.map((s) => el('button', {
    class: `card ec-place ${s.id === state.sceneId ? 'on' : ''}`, type: 'button', 'aria-pressed': String(s.id === state.sceneId),
    onclick: () => { state.sceneId = s.id; renderStart(); }
  }, el('b', {}, pick(s.title, lang)), el('span', { class: 'small muted' }, pick(s.desc, lang)))));
  $('#levelList').replaceChildren(...LEVELS.map((l) => el('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(l === state.level),
    onclick: () => { state.level = l; renderStart(); }
  }, t(`eg_level_${l}`))));
  $('#listenMode').checked = state.listening;
  $('#listenMode').disabled = !canSpeak();
  $('#audioNote').textContent = canSpeak() ? '' : t('eg_no_audio');
  show('startScreen');
}

async function start() {
  state.scene = getScene(state.sceneId);
  state.mission = createMission(state.scene, state.level);
  state.listening = $('#listenMode').checked && canSpeak();
  state.saved = false;
  state.started = Date.now();
  state.xpBefore = (await getProgress()).xp;
  $('#placeLabel').textContent = `${pick(state.scene.title, getLang())} · ${t(`eg_level_${state.level}`)}`;
  show('playScreen');
  nextTask();
}

// ─── Задание ──────────────────────────────────────────────────────────────────

function nextTask() {
  if (isFinished(state.mission)) return finish();
  const task = beginTask(state.mission);
  state.selected = null;
  state.hinted = [];
  state.textShown = !state.listening;
  const m = state.mission;
  $('#counter').textContent = `${m.index + 1} / ${m.tasks.length}`;
  $('#progressBar').style.width = `${(m.index / m.tasks.length) * 100}%`;
  $('#feedback').replaceChildren();
  $('#feedback').className = 'ec-feedback';
  $('#hintBtn').classList.add('hidden');
  $('#skipBtn').classList.add('hidden');
  renderInstruction(task);
  renderScene();
  if (state.listening) speak(task.text, 'en-US', 0.85);
}

function renderInstruction(task) {
  const box = $('#instruction');
  if (state.textShown) box.replaceChildren(el('span', { lang: 'en' }, task.text));
  else box.replaceChildren(el('span', { class: 'muted' }, icon('sound', { size: 20 }), ' ', t('ec_listen_hidden')));
  $('#listenBtn').classList.toggle('hidden', !canSpeak());
  $('#listenBtn').replaceChildren(icon('sound', { size: 18 }), ' ', t('eg_listen'));
  $('#showTextBtn').classList.toggle('hidden', state.textShown);
}

function renderScene() {
  const { scene, mission } = state;
  $('#scene').replaceChildren(...scene.zones.map((z) => {
    const items = mission.objects.filter((o) => o.zone === z.id);
    const zone = el('div', { class: `ec-zone ${z.start ? 'start' : ''}`, 'data-zone': z.id },
      el('button', {
        class: 'ec-drop', type: 'button', lang: 'en',
        'aria-label': `${t('ec_put_here')}: ${z.label}`,
        onclick: () => place(z.id)
      }, el('span', { class: 'ec-zone-art', html: zoneArt(z.art) }), el('span', { class: 'ec-zone-label' }, z.label)),
      el('div', { class: 'ec-items' }, ...items.map((o) => el('button', {
        class: `ec-obj ${state.selected === o.id ? 'selected' : ''} ${state.hinted.includes(o.id) ? 'hinted' : ''}`,
        type: 'button', lang: 'en', 'data-obj': o.id,
        'aria-label': describe(o), 'aria-pressed': String(state.selected === o.id),
        onpointerdown: (e) => startDrag(e, o.id),
        // После перетаскивания браузер может прислать click — его пропускаем
        onclick: () => { if (state.dragMoved) { state.dragMoved = false; return; } select(o.id); },
        html: objectArt(o)
      })))
    );
    return zone;
  }));
  $('#selectHint').textContent = state.selected ? t('ec_now_place') : t('ec_pick_object');
}

function select(objId) {
  state.selected = state.selected === objId ? null : objId;
  renderScene();
  if (state.selected) $(`[data-obj="${state.selected}"]`)?.focus();
}

function place(zoneId) {
  if (!state.selected) { toast(t('ec_pick_object'), { icon: 'ℹ️' }); return; }
  const moved = moveObject(state.mission, state.selected, zoneId, state.scene);
  const id = state.selected;
  state.selected = null;
  if (moved) sfx.tap?.();
  renderScene();
  $(`[data-obj="${id}"]`)?.focus();
}

// Перетаскивание пальцем или мышью: отпустили над местом — предмет переезжает
function startDrag(e, objId) {
  if (e.button !== undefined && e.button !== 0) return;
  const btn = e.currentTarget;
  const x0 = e.clientX;
  const y0 = e.clientY;
  let ghost = null;
  state.dragMoved = false;
  const move = (ev) => {
    if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
    if (!ghost) {
      state.dragMoved = true;
      ghost = btn.cloneNode(true);
      ghost.className = 'ec-obj ec-ghost';
      ghost.setAttribute('aria-hidden', 'true');
      document.body.append(ghost);
    }
    ghost.style.left = `${ev.clientX - 26}px`;
    ghost.style.top = `${ev.clientY - 26}px`;
  };
  const up = (ev) => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    if (!ghost) return;
    ghost.remove();
    const zone = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.ec-zone');
    if (zone) { state.selected = objId; place(zone.dataset.zone); }
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

// ─── Проверка ─────────────────────────────────────────────────────────────────

async function check() {
  const task = currentTask(state.mission);
  if (!task) return;
  if (state.listening && state.textShown) state.mission.hinted = true; // текст открыт — уже не «на слух»
  const res = submit(state.mission);
  const fb = $('#feedback');
  if (res.ok) {
    sfx.ok?.();
    fb.className = 'ec-feedback ok';
    fb.replaceChildren(el('b', {}, icon('check', { size: 18 }), ' ', t('ec_done')), ' ', el('span', { lang: 'en' }, task.text));
    await saveTask(task);
    $('#checkBtn').disabled = true;
    setTimeout(() => { $('#checkBtn').disabled = false; nextTask(); }, 1400);
    return;
  }
  sfx.bad?.();
  fb.className = 'ec-feedback bad';
  fb.replaceChildren(
    el('b', {}, t('ec_not_yet')),
    el('ul', {}, ...res.missing.map((p) => el('li', { lang: 'en' }, `“${p}”`))),
    el('span', { class: 'small' }, t('ec_try_again')));
  if (res.attempts >= 2) $('#hintBtn').classList.remove('hidden');
  if (res.attempts >= 3) $('#skipBtn').classList.remove('hidden');
}

/** Ответ в общий прогресс: верно — только с первой попытки без подсказок */
async function saveTask(task, skipped = false) {
  const r = state.mission.results.at(-1);
  await recordAnswer({
    topic: TOPIC,
    skill: state.listening ? 'listening' : task.skills.includes('prepositions') ? 'prepositions' : 'listening',
    correct: !skipped && !!r?.firstTry,
    questionId: `${GAME_ID}:${task.id}`,
    gameId: GAME_ID
  });
}

function hint() {
  state.hinted = hintObjects(state.mission);
  renderScene();
  toast(t('ec_hint_shown'), { icon: '💡' });
}

async function skipTask() {
  const task = currentTask(state.mission);
  skip(state.mission);
  await saveTask(task, true);
  nextTask();
}

// ─── Итог ─────────────────────────────────────────────────────────────────────

async function finish() {
  const s = summary(state.mission);
  // Итог игры пишется один раз за миссию — повторное открытие экрана XP не даёт
  if (!state.saved) {
    state.saved = true;
    await recordGame({ gameId: GAME_ID, topic: TOPIC, score: s.score, correct: s.firstTry, total: s.total });
  }
  const xp = Math.max(0, (await getProgress()).xp - state.xpBefore);
  const tasks = new Map(state.mission.tasks.map((x) => [x.id, x]));
  const weak = Object.entries(s.skills).filter(([, v]) => v.total && v.ok / v.total < 0.7).map(([k]) => k);
  const extra = el('div', { class: 'card plain stack' },
    el('b', {}, t('eg_recommend')),
    el('p', { class: 'small', style: 'margin:0' }, weak.length ? weak.map((k) => t(`ec_rec_${k}`)).join(' ') : t('ec_rec_good')));
  $('#resultScreen').replaceChildren(resultView({
    accuracy: s.accuracy, xp, correct: s.firstTry, total: s.total,
    timeSec: Math.round((Date.now() - state.started) / 1000),
    skills: Object.entries(s.skills).map(([k, v]) => ({ title: t(`ec_skill_${k}`), ...v })),
    mistakes: state.mission.results.filter((r) => !r.firstTry).map((r) => ({
      prompt: tasks.get(r.taskId)?.text || '',
      explain: r.skipped ? t('ec_was_skipped') : t('ec_solved_after', { n: r.attempts })
    })),
    extra,
    onAgain: () => start(),
    other: { label: t('eg_back_catalog'), href: '../../games.html' }
  }));
  show('resultScreen');
  $('#resultScreen h1')?.focus();
  if (s.accuracy >= 70) { sfx.win?.(); confetti(); }
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'games.html' });
  renderStart();
  $('#startBtn').addEventListener('click', start);
  $('#checkBtn').addEventListener('click', check);
  $('#resetBtn').addEventListener('click', () => { resetTask(state.mission); state.selected = null; renderScene(); });
  $('#hintBtn').addEventListener('click', hint);
  $('#skipBtn').addEventListener('click', skipTask);
  $('#listenBtn').addEventListener('click', () => { const task = currentTask(state.mission); if (task) speak(task.text, 'en-US', 0.85); });
  $('#showTextBtn').addEventListener('click', () => { state.textShown = true; renderInstruction(currentTask(state.mission)); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.selected) { state.selected = null; renderScene(); } });
})();
