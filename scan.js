/**
 * Bilim Arena — сканер бланков (scan.html).
 *
 * Камера телефона или загруженные фото → core/omr.js находит бланк, читает код теста,
 * вариант, номер ученика и кружки → учитель видит результат поверх фото, поправляет
 * спорные строки и письменные ответы → «Отчетко сактоо» записывает урок «Бумажный тест».
 * Фото обрабатываются только на этом устройстве.
 */

import { bootstrap, mountHeader, el, $, toast, sfx } from './core/ui.js';
import { t, getLang } from './core/i18n.js';
import { store, KEYS } from './core/store.js';
import { setRole } from './core/profile.js';
import { recordStage, studentKey } from './core/lessons.js';
import { allTests, testQuestions, buildVariant, variantName, checkPaperAnswer } from './core/tests.js';
import { detectSheet, readSheet, toImage, testCode, versionCode, BUBBLE_R } from './core/omr.js';

const SESSION = 'scan_session';
const state = {
  classes: [], tests: new Map(), questions: new Map(),
  stream: null, timer: null, busy: false, last: null,
  current: null, queue: [], session: []
};

// ─── Тесты на устройстве ──────────────────────────────────────────────────────

async function loadTests() {
  state.tests = new Map((await allTests()).map((x) => [testCode(x.id), x]));
}

async function questionsOf(test) {
  const key = `${test.id}:${test.updatedAt}`;
  if (!state.questions.has(key)) state.questions.set(key, await testQuestions(test));
  return state.questions.get(key);
}

const classStudents = () => {
  const c = state.classes.find((x) => x.id === $('#classSel').value);
  return c ? (c.members?.map((m) => m.name) || c.students || []) : [];
};

// ─── Распознавание одного кадра ───────────────────────────────────────────────

function imageDataOf(source, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, h);
  return { canvas, data: ctx.getImageData(0, 0, w, h) };
}

/** @returns {Promise<{ok:true, ...}|{ok:false, reason}>} */
async function analyze(source, w, h) {
  const { canvas, data } = imageDataOf(source, w, h);
  const det = detectSheet(data, { maxSide: 1400 });
  if (!det) return { ok: false, reason: 'omr_not_found' };
  const test = state.tests.get(det.code.test);
  if (!test) return { ok: false, reason: 'omr_unknown_test' };
  const items = buildVariant(test, await questionsOf(test), det.code.variant, getLang());
  const read = readSheet(det, items);
  const changed = versionCode(test.questionIds) !== det.code.version;
  return { ok: true, det, test, items, read, canvas, changed, variant: det.code.variant };
}

// ─── Камера ───────────────────────────────────────────────────────────────────

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    $('#camNote').textContent = t('omr_no_camera');
    return;
  }
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false
    });
  } catch {
    $('#camNote').textContent = t('omr_camera_denied');
    return;
  }
  const video = $('#video');
  video.srcObject = state.stream;
  await video.play();
  $('#camView').classList.remove('hidden');
  $('#scanStatus').textContent = t('omr_aim');
  state.last = null;
  loop();
}

function stopCamera() {
  clearTimeout(state.timer);
  state.stream?.getTracks().forEach((tr) => tr.stop());
  state.stream = null;
  $('#camView').classList.add('hidden');
}

/** Каждые ~0.4 с: если бланк найден дважды подряд одинаково — показываем результат */
function loop() {
  clearTimeout(state.timer);
  state.timer = setTimeout(async () => {
    const video = $('#video');
    if (!state.stream || state.current || state.busy || !video.videoWidth) return loop();
    state.busy = true;
    try {
      const res = await analyze(video, video.videoWidth, video.videoHeight);
      if (!res.ok) {
        $('#scanStatus').textContent = t(res.reason);
        state.last = null;
      } else {
        const sig = `${res.test.id}:${res.variant}:${res.read.number}:${res.read.rows.map((r) => r.letters ?? '').join(',')}`;
        if (state.last === sig) {
          sfx.ok?.();
          showResult(res);
        } else {
          state.last = sig;
          $('#scanStatus').textContent = t('omr_hold');
        }
      }
    } catch (e) {
      console.warn('[scan]', e);
    }
    state.busy = false;
    loop();
  }, 400);
}

// ─── Загрузка фото ────────────────────────────────────────────────────────────

async function loadFiles(files) {
  const errors = [];
  for (const file of files) {
    try {
      const bmp = await createImageBitmap(file);
      const res = await analyze(bmp, bmp.width, bmp.height);
      if (res.ok) state.queue.push(res);
      else errors.push(`${file.name}: ${t(res.reason)}`);
    } catch {
      errors.push(`${file.name}: ${t('omr_bad_file')}`);
    }
  }
  $('#fileErrors').textContent = errors.join(' · ');
  if (!state.current) nextFromQueue();
}

function nextFromQueue() {
  const next = state.queue.shift();
  if (next) showResult(next);
}

// ─── Результат: проверка учителем ─────────────────────────────────────────────

const LETTER_CHOICES = ['', 'A', 'B', 'C', 'D', 'E', 'F'];

function grade(res) {
  return res.items.map((it, i) => {
    const row = res.read.rows[i];
    if (!row) return { given: '', correct: false, manual: false };
    if (row.kind === 'box') return { given: '', correct: res.manual[i] === true, manual: true, decided: res.manual[i] !== undefined };
    const given = res.override[i] ?? row.letters;
    return { given, correct: checkPaperAnswer(it, given), status: res.override[i] !== undefined ? 'ok' : row.status };
  });
}

function drawOverlay(res) {
  const canvas = $('#resCanvas');
  const src = res.canvas;
  const scale = Math.min(1, 900 / src.width);
  canvas.width = Math.round(src.width * scale);
  canvas.height = Math.round(src.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  const g = grade(res);
  const pt = (x, y) => toImage(res.det, x, y).map((v) => v * scale);
  const rpx = (x, y) => Math.hypot(...pt(x + BUBBLE_R, y).map((v, k) => v - pt(x, y)[k]));
  ctx.lineWidth = 3;
  res.read.rows.forEach((row, i) => {
    if (row.kind === 'box') {
      const [x0, y0] = pt(row.box.x, row.box.y);
      const [x1, y1] = pt(row.box.x + row.box.w, row.box.y + row.box.h);
      ctx.strokeStyle = g[i].decided ? (g[i].correct ? '#16a34a' : '#dc2626') : '#f59e0b';
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      return;
    }
    const key = res.items[i].key || '';
    row.bubbles.forEach((b) => {
      const chosen = g[i].given.includes(b.letter);
      const right = key.includes(b.letter);
      if (!chosen && !right) return;
      const [cx, cy] = pt(b.x, b.y);
      ctx.strokeStyle = g[i].status !== 'ok' ? '#f59e0b' : chosen ? (right ? '#16a34a' : '#dc2626') : '#2563eb';
      ctx.beginPath();
      ctx.arc(cx, cy, rpx(b.x, b.y) + 3, 0, Math.PI * 2);
      ctx.stroke();
    });
  });
}

/** Клетка с письменным ответом — выпрямленная по геометрии листа (8 px на мм) */
function crop(res, box) {
  const PX = 8;
  const pad = 1;
  const src = res.pixels || (res.pixels = res.canvas.getContext('2d').getImageData(0, 0, res.canvas.width, res.canvas.height));
  const c = document.createElement('canvas');
  c.width = Math.round((box.w + pad * 2) * PX);
  c.height = Math.round((box.h + pad * 2) * PX);
  const ctx = c.getContext('2d');
  const out = ctx.createImageData(c.width, c.height);
  for (let v = 0; v < c.height; v++) {
    for (let u = 0; u < c.width; u++) {
      const [x, y] = toImage(res.det, box.x - pad + u / PX, box.y - pad + v / PX);
      const sx = Math.min(src.width - 1, Math.max(0, Math.round(x)));
      const sy = Math.min(src.height - 1, Math.max(0, Math.round(y)));
      const si = (sy * src.width + sx) * 4;
      const oi = (v * c.width + u) * 4;
      out.data[oi] = src.data[si]; out.data[oi + 1] = src.data[si + 1]; out.data[oi + 2] = src.data[si + 2]; out.data[oi + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  c.className = 'scan-crop';
  return c;
}

function renderResult() {
  const res = state.current;
  const g = grade(res);
  const correct = g.filter((x) => x.correct).length;
  $('#resTitle').textContent = `${res.test.title} · ${t('tst_variant')} ${variantName(res.variant)}`;
  $('#resScore').textContent = `${correct}/${res.items.length}`;
  const warns = [];
  if (res.changed) warns.push(t('omr_changed'));
  if (res.read.numberStatus !== 'ok') warns.push(t('omr_number_unsure'));
  $('#resWarn').textContent = warns.join(' ');

  // Только то, что требует внимания учителя: спорные строки и письменные ответы
  const issues = [];
  res.items.forEach((it, i) => {
    const row = res.read.rows[i];
    if (!row) return;
    if (row.kind === 'box') {
      const decided = res.manual[i];
      issues.push(el('div', { class: 'card plain stack scan-issue' },
        el('b', {}, `${it.n}. ${it.prompt}`),
        crop(res, row.box),
        el('span', { class: 'small' }, `${t('game_correct_answer')}: ${it.keyText}`),
        el('div', { class: 'row', style: 'gap:8px' },
          el('button', { class: `btn ${decided === true ? 'primary' : 'soft'}`, type: 'button', onclick: () => { res.manual[i] = true; renderResult(); } }, `✓ ${t('omr_right')}`),
          el('button', { class: `btn ${decided === false ? 'primary' : 'soft'}`, type: 'button', onclick: () => { res.manual[i] = false; renderResult(); } }, `✗ ${t('omr_wrong')}`))
      ));
    } else if (g[i].status !== 'ok') {
      // Один ответ — выбор из списка, несколько — буквы вручную (например, AC)
      const sel = it.type === 'multiple'
        ? el('input', { class: 'input', value: g[i].given, maxlength: '6', 'aria-label': `${it.n}`, style: 'width:6em' })
        : el('select', { class: 'input', 'aria-label': `${it.n}` },
          ...LETTER_CHOICES.slice(0, (it.options?.length || 4) + 1).map((l) => el('option', { value: l, ...(l === g[i].given ? { selected: 'selected' } : {}) }, l || '—')));
      sel.addEventListener('change', () => { res.override[i] = sel.value.toUpperCase().replace(/[^A-F]/g, ''); renderResult(); });
      issues.push(el('div', { class: 'card plain row between scan-issue' },
        el('span', {}, el('b', {}, `${it.n}. `), t(`omr_status_${row.status}`)),
        sel));
    }
  });
  $('#resIssues').replaceChildren(...(issues.length ? [el('b', {}, t('omr_check_these')), ...issues] : [el('p', { class: 'small muted' }, t('omr_all_clear'))]));
  const waiting = res.items.some((_, i) => res.read.rows[i]?.kind === 'box' && res.manual[i] === undefined);
  $('#acceptBtn').disabled = waiting;
  $('#acceptBtn').title = waiting ? t('omr_decide_boxes') : '';
  drawOverlay(res);
}

function showResult(res) {
  res.manual = {};
  res.override = {};
  state.current = res;
  const students = classStudents();
  const n = res.read.number;
  $('#resNumber').value = n ?? '';
  $('#resName').value = n && students[n - 1] ? students[n - 1] : '';
  $('#resultCard').classList.remove('hidden');
  renderResult();
  $('#resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeResult() {
  state.current = null;
  state.last = null;
  $('#resultCard').classList.add('hidden');
  if (state.queue.length) nextFromQueue();
  else if (state.stream) $('#scanStatus').textContent = t('omr_aim');
}

async function accept() {
  const res = state.current;
  const number = Number($('#resNumber').value) || null;
  const name = $('#resName').value.trim() || (number ? t('omr_student_n', { n: number }) : '');
  if (!name) return toast(t('omr_need_name'), { icon: '⚠️' });
  const g = grade(res);
  const entry = {
    testId: res.test.id, variant: res.variant, name, number,
    answers: res.items.map((it, i) => ({ questionId: it.q.id, topic: it.q.topic, skill: it.q.skill, correct: g[i].correct })),
    correct: g.filter((x) => x.correct).length, total: res.items.length
  };
  // Повторный скан того же ученика заменяет прежний
  state.session = state.session.filter((x) => !(x.testId === entry.testId && studentKey(x.name) === studentKey(entry.name)));
  state.session.push(entry);
  saveSession();
  renderSession();
  toast(t('omr_saved_one', { name, c: entry.correct, n: entry.total }), { icon: '✅' });
  closeResult();
}

// ─── Сессия проверки ──────────────────────────────────────────────────────────

function saveSession() {
  try { sessionStorage.setItem(SESSION, JSON.stringify(state.session)); } catch { /* приватный режим */ }
}

function renderSession() {
  const titles = new Map([...state.tests.values()].map((x) => [x.id, x.title]));
  $('#sessionCount').textContent = String(state.session.length);
  $('#finishBtn').disabled = !state.session.length;
  $('#sessionList').replaceChildren(...state.session.map((x, i) => el('div', { class: 'q-row' },
    el('span', { class: 'q-text' },
      el('b', {}, `${x.number ? `${x.number}. ` : ''}${x.name}`),
      el('span', { class: 'small muted' }, `${titles.get(x.testId) || ''} · ${t('tst_variant')} ${variantName(x.variant)}`)),
    el('b', {}, `${x.correct}/${x.total}`),
    el('button', { class: 'btn ghost', type: 'button', 'aria-label': t('delete'), onclick: () => { state.session.splice(i, 1); saveSession(); renderSession(); } }, '✕')
  )));
}

async function finish() {
  const byTest = new Map();
  state.session.forEach((x) => { if (!byTest.has(x.testId)) byTest.set(x.testId, []); byTest.get(x.testId).push(x); });
  const tests = new Map([...state.tests.values()].map((x) => [x.id, x]));
  for (const [testId, list] of byTest) {
    const test = tests.get(testId);
    if (!test) continue;
    const log = [];
    const players = [];
    list.forEach((x) => {
      const playerId = `paper:${studentKey(x.name)}`;
      x.answers.forEach((a) => log.push({ playerId, playerName: x.name, topic: a.topic, skill: a.skill, correct: a.correct, questionId: a.questionId }));
      players.push({ id: playerId, name: x.name, score: x.correct });
    });
    await recordStage({ subject: test.subject, topic: test.topic, mode: $('#isCheck').checked ? 'paper-check' : 'paper', gameId: 'paper', log, players });
  }
  toast(t('tst_results_saved', { n: state.session.length }), { icon: '✅', ms: 4000 });
  state.session = [];
  saveSession();
  setTimeout(() => { location.href = './reports.html'; }, 1500);
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  await setRole('teacher');
  mountHeader($('#header'), { role: 'teacher', active: 'scan.html' });
  await loadTests();
  state.classes = await store.get(KEYS.classes, []);
  $('#classSel').replaceChildren(el('option', { value: '' }, '—'), ...state.classes.map((c) => el('option', { value: c.id }, c.name)));
  try { state.session = JSON.parse(sessionStorage.getItem(SESSION) || '[]'); } catch { state.session = []; }
  renderSession();
  if (!state.tests.size) $('#camNote').textContent = t('omr_no_tests');

  $('#camBtn').addEventListener('click', startCamera);
  $('#stopBtn').addEventListener('click', stopCamera);
  $('#fileInput').addEventListener('change', (e) => { loadFiles([...e.target.files]); e.target.value = ''; });
  $('#acceptBtn').addEventListener('click', accept);
  $('#skipBtn').addEventListener('click', closeResult);
  $('#finishBtn').addEventListener('click', finish);
  $('#resNumber').addEventListener('input', () => {
    const s = classStudents()[Number($('#resNumber').value) - 1];
    if (s) $('#resName').value = s;
  });
  window.addEventListener('pagehide', stopCamera);
})();
