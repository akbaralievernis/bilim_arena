/**
 * Bilim Arena — тесты учителя (tests.html).
 *
 * Список тестов → конструктор (вопросы банка и свои, порядок, случайный набор,
 * предупреждения о повторах) → доска / домашнее задание / печать (print.html)
 * → ввод результатов бумажного теста, которые попадают в «Отчёты».
 */

import { bootstrap, mountHeader, el, $, toast } from './core/ui.js';
import { icon } from './core/icons.js';
import { t, pick, getLang } from './core/i18n.js';
import { SUBJECTS, TOPICS, topicsOf, getTopic, skillTitle, loadBank, getQuestions, questionRef, parseQuestionRef } from './core/curriculum.js';
import { setRole } from './core/profile.js';
import { findDuplicates } from './core/duplicates.js';
import { recordStage, studentKey } from './core/lessons.js';
import { CHECK_MIN } from './core/selection.js';
import {
  allTests, getTest, saveTest, deleteTest, testQuestions,
  buildVariant, variantName, parseAnswers, scorePaper, PAPER_TYPES, toRaceTable, RACE_LIMITS
} from './core/tests.js';
import { raceUrl } from './core/race.js';

// sel — ссылки «тема::id»; cache — все загруженные вопросы по ссылке (из любых тем)
const state = { editing: null, pool: [], sel: [], cache: new Map(), test: null, questions: [] };
const screens = ['listScreen', 'editScreen', 'resultsScreen'];
const show = (id) => screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));
const MAX_VARIANTS = 4;

const subjectsWithTopics = () => {
  const ids = new Set(TOPICS.map((x) => x.subject));
  return SUBJECTS.filter((s) => ids.has(s.id));
};
function fillSelect(sel, items, value) {
  sel.replaceChildren(...items.map((it) => el('option', {
    value: it.value, ...(String(it.value) === String(value) ? { selected: 'selected' } : {})
  }, it.label)));
}
const fmtDate = (ts) => new Date(ts).toLocaleDateString();
const promptOf = (q) => pick(q.prompt, getLang());

// ─── Список ───────────────────────────────────────────────────────────────────

const boardUrl = (x) => `./board.html?${new URLSearchParams({ subject: x.subject, topic: x.topic, mode: 'review', test: x.id, questions: x.questionIds.join(',') })}`;
const homeworkUrl = (x) => `./homework.html?${new URLSearchParams({ topic: x.topic, questions: x.questionIds.join(',') })}`;

async function renderList() {
  const lang = getLang();
  const list = (await allTests()).sort((a, b) => b.updatedAt - a.updatedAt);
  const cards = list.map((x) => el('div', { class: 'card stack' },
    el('div', { class: 'row between' },
      el('b', {}, x.title || '—'),
      el('span', { class: 'small muted' }, `${t('questions_n', { n: x.questionIds.length })} · ${fmtDate(x.updatedAt)}`)),
    el('span', { class: 'small muted' }, (x.topics?.length ? x.topics : [x.topic]).map((id) => pick(getTopic(id)?.title, lang)).filter(Boolean).join(' · ')),
    el('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' },
      el('a', { class: 'btn primary', href: boardUrl(x) }, icon('board', { size: 18 }), ' ', t('act_board')),
      el('a', { class: 'btn soft', href: homeworkUrl(x) }, icon('tasks', { size: 18 }), ' ', t('act_homework')),
      el('a', { class: 'btn soft', href: `./print.html?${new URLSearchParams({ test: x.id })}` }, t('tst_print')),
      el('a', { class: 'btn soft', href: './scan.html' }, t('omr_scan')),
      el('button', { class: 'btn soft', type: 'button', onclick: () => toRace(x) }, icon('flag', { size: 18 }), ' ', t('race_export')),
      el('button', { class: 'btn soft', type: 'button', onclick: () => openResults(x.id) }, t('tst_enter_results')),
      el('button', { class: 'btn ghost', type: 'button', 'aria-label': t('edit'), onclick: () => openEdit(x.id) }, icon('pen')),
      el('button', {
        class: 'btn ghost', type: 'button', 'aria-label': t('delete'),
        onclick: async () => {
          if (!confirm(t('tst_delete_confirm'))) return;
          await deleteTest(x.id);
          toast(t('delete'), { icon: '🗑️' });
          renderList();
        }
      }, icon('trash'))
    )
  ));
  $('#testList').replaceChildren(...(cards.length ? cards : [el('div', { class: 'card center muted' }, t('tst_empty'))]));
  show('listScreen');
}

// ─── В гонку (Bilim Arena Race) ───────────────────────────────────────────────

/**
 * Вопросы теста копируются в формате «Вставить из Excel» гонки и открывается
 * создание гонки. Сайты не связаны базами — учитель вставляет строки сам.
 */
async function toRace(x) {
  const r = toRaceTable(x, await testQuestions(x), getLang(), (n) => t('race_cp', { n }));
  if (!r.used) return toast(t('race_export_none'), { icon: 'ℹ️', ms: 5000 });
  let copied = false;
  try { await navigator.clipboard.writeText(r.text); copied = true; } catch { /* нет доступа к буферу — текст ниже */ }
  const notes = [
    t('race_export_used', { n: r.used }),
    r.skippedTypes ? t('race_export_skipped', { n: r.skippedTypes }) : null,
    r.cut ? t('race_export_cut', { n: r.cut, max: RACE_LIMITS.route }) : null
  ].filter(Boolean);
  const area = el('textarea', { class: 'input', rows: '6', readonly: 'readonly', 'aria-label': t('race_export') });
  area.value = r.text;
  $('#racePanel').replaceChildren(
    el('b', {}, copied ? t('race_export_copied') : t('race_export_copy_manual')),
    el('ol', { class: 'small' }, ...['race_step1', 'race_step2', 'race_step3'].map((k) => el('li', {}, t(k)))),
    el('p', { class: 'small muted' }, notes.join(' · ')),
    area,
    el('div', { class: 'row', style: 'gap:8px' },
      el('a', { class: 'btn primary', href: raceUrl('/create'), target: '_blank', rel: 'noopener' }, icon('flag', { size: 18 }), ' ', t('race_open_create')),
      el('button', { class: 'btn ghost', type: 'button', onclick: async () => {
        area.select();
        try { await navigator.clipboard.writeText(r.text); toast(t('race_export_copied'), { icon: '📋' }); } catch { /* выделено — Ctrl+C */ }
      } }, t('race_copy_again')),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => $('#racePanel').classList.add('hidden') }, t('close')))
  );
  $('#racePanel').classList.remove('hidden');
  $('#racePanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Конструктор ──────────────────────────────────────────────────────────────

function syncTopics(topicId = null) {
  const lang = getLang();
  const topics = topicsOf($('#tSubject').value);
  fillSelect($('#tTopic'), topics.map((tp) => ({ value: tp.id, label: `${pick(tp.title, lang)} (${t('grade', { n: tp.grade })})` })), topicId || topics[0]?.id);
}

/** Все вопросы темы: банк по порядку, затем вопросы учителя */
async function loadPool() {
  const topic = $('#tTopic').value;
  const bank = await loadBank(topic);
  const own = (await getQuestions({ topic, count: 10000 })).filter((q) => q.custom);
  state.pool = [...bank, ...own].filter((q) => PAPER_TYPES.includes(q.type) && !q.vote).map((q) => ({ ...q, topic: q.topic || topic }));
  state.pool.forEach((q) => state.cache.set(questionRef(q), q));
  const lang = getLang();
  const tp = getTopic(topic);
  fillSelect($('#fSkill'), [{ value: '', label: t('hw_all_skills') }, ...(tp?.skills || []).map((s) => ({ value: s.id, label: pick(s.title, lang) }))], '');
  // Выбранные вопросы других тем остаются: тест может быть из нескольких тем
}

function filtered() {
  const skill = $('#fSkill').value;
  const diff = Number($('#fDifficulty').value) || 0;
  const needle = $('#fSearch').value.trim().toLowerCase();
  return state.pool.filter((q) => (!skill || q.skill === skill)
    && (!diff || (q.difficulty || 1) === diff)
    && (!needle || promptOf(q).toLowerCase().includes(needle)));
}

const metaLine = (q, withTopic = false) => [withTopic ? pick(getTopic(q.topic)?.title, getLang()) : null, q.custom ? t('dup_mine') : t('dup_bank'), skillTitle(q.topic, q.skill, getLang()), t('difficulty_' + (q.difficulty || 1))].filter(Boolean).join(' · ');

function renderAvail() {
  const list = filtered();
  $('#availCount').textContent = String(list.length);
  $('#availList').replaceChildren(...list.map((q) => {
    const inTest = state.sel.includes(questionRef(q));
    return el('div', { class: 'q-row' },
      el('span', { class: 'q-text' }, el('b', {}, promptOf(q)), el('span', { class: 'small muted' }, metaLine(q))),
      el('button', {
        class: `btn ${inTest ? 'ghost' : 'soft'}`, type: 'button', disabled: inTest,
        'aria-label': `${t('tst_add')}: ${promptOf(q)}`,
        onclick: () => { state.sel.push(questionRef(q)); renderEditor(); }
      }, inTest ? '✓' : '+')
    );
  }));
}

function renderSel() {
  const qs = state.sel.map((ref) => state.cache.get(ref)).filter(Boolean);
  const multi = new Set(qs.map((q) => q.topic)).size > 1;
  $('#selCount').textContent = multi ? `${t('questions_n', { n: qs.length })} · ${t('tst_topics_n', { n: new Set(qs.map((q) => q.topic)).size })}` : t('questions_n', { n: qs.length });
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= state.sel.length) return;
    [state.sel[i], state.sel[j]] = [state.sel[j], state.sel[i]];
    renderEditor();
  };
  $('#selList').replaceChildren(...qs.map((q, i) => el('li', { class: 'q-row' },
    el('span', { class: 'q-text' }, el('b', {}, `${i + 1}. ${promptOf(q)}`), el('span', { class: 'small muted' }, metaLine(q, multi))),
    el('button', { class: 'btn ghost', type: 'button', 'aria-label': t('tst_up'), disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
    el('button', { class: 'btn ghost', type: 'button', 'aria-label': t('tst_down'), disabled: i === qs.length - 1, onclick: () => move(i, 1) }, '↓'),
    el('button', { class: 'btn ghost', type: 'button', 'aria-label': t('delete'), onclick: () => { state.sel.splice(i, 1); renderEditor(); } }, '✕')
  )));

  // Честные предупреждения: повторы внутри теста и слишком короткий тест
  const warnings = [];
  const dup = findDuplicates(qs, { lang: getLang() });
  const pairs = [...dup.exact.map(([a, b]) => [a, b]), ...dup.probable.map((p) => [p.a, p.b])];
  pairs.forEach(([a, b]) => warnings.push(t('tst_warn_dup', { a: qs.indexOf(a) + 1, b: qs.indexOf(b) + 1 })));
  if (qs.length && qs.length < CHECK_MIN) warnings.push(t('tst_warn_short', { min: CHECK_MIN }));
  $('#selWarnings').replaceChildren(...warnings.map((w) => el('div', { class: 'small', style: 'color:var(--warn-ink)' }, '⚠️ ', w)));
}

function renderEditor() {
  renderAvail();
  renderSel();
}

async function openEdit(id = null) {
  const lang = getLang();
  const test = id ? await getTest(id) : null;
  state.editing = test;
  // Старые тесты хранят просто id — приводим к ссылкам «тема::id»
  state.cache = new Map();
  const existing = test ? await testQuestions(test) : [];
  existing.forEach((q) => state.cache.set(questionRef(q), q));
  state.sel = existing.map(questionRef);
  $('#editTitle').textContent = test ? t('tst_edit') : t('tst_create');
  $('#tName').value = test?.title || '';
  const subject = test?.subject || getTopic(test?.topic)?.subject || subjectsWithTopics()[0]?.id;
  fillSelect($('#tSubject'), subjectsWithTopics().map((s) => ({ value: s.id, label: pick(s.title, lang) })), subject);
  syncTopics(test?.topic);
  fillSelect($('#fDifficulty'), [{ value: '', label: t('hw_all_levels') },
    { value: 1, label: t('difficulty_1') }, { value: 2, label: t('difficulty_2') }, { value: 3, label: t('difficulty_3') }], '');
  $('#fSearch').value = '';
  await loadPool();
  renderEditor();
  show('editScreen');
}

/** Случайные N вопросов из отфильтрованных, которых ещё нет в тесте */
function addRandom() {
  const n = Math.max(1, Math.min(50, Number($('#randomN').value) || 5));
  const free = filtered().filter((q) => !state.sel.includes(questionRef(q)));
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [free[i], free[j]] = [free[j], free[i]];
  }
  const add = free.slice(0, n);
  state.sel.push(...add.map(questionRef));
  if (add.length < n) toast(t('tst_random_short', { n: add.length }), { icon: 'ℹ️', ms: 4000 });
  renderEditor();
}

async function save() {
  if (!state.sel.length) return toast(t('tst_need_questions'), { icon: '⚠️' });
  const main = parseQuestionRef(state.sel[0]).topic || $('#tTopic').value;
  await saveTest({
    id: state.editing?.id,
    title: $('#tName').value.trim() || pick(getTopic(main)?.title, getLang()),
    subject: getTopic(main)?.subject || $('#tSubject').value,
    grade: getTopic(main)?.grade,
    topic: main,
    questionIds: state.sel
  });
  toast(t('tst_saved'), { icon: '✅' });
  renderList();
}

// ─── Ввод результатов бумажного теста ─────────────────────────────────────────

/** Пункты варианта v (кэш на время экрана) */
const variantItems = (() => {
  const cache = new Map();
  return (v) => {
    const key = `${state.test.id}:${state.test.updatedAt}:${v}`;
    if (!cache.has(key)) cache.set(key, buildVariant(state.test, state.questions, v, getLang()));
    return cache.get(key);
  };
})();

function resultRow() {
  const name = el('input', { class: 'input', placeholder: t('tst_student_name'), maxlength: '40', 'aria-label': t('tst_student_name') });
  const variant = el('select', { class: 'input', 'aria-label': t('tst_variant') },
    ...Array.from({ length: MAX_VARIANTS }, (_, v) => el('option', { value: String(v) }, `${t('tst_variant')} ${variantName(v)}`)));
  const answers = el('input', { class: 'input', placeholder: t('tst_answers_hint'), autocomplete: 'off', 'aria-label': t('tst_answers') });
  const score = el('b', { class: 'tst-score', 'aria-live': 'polite' }, '—');
  const update = () => {
    const items = variantItems(Number(variant.value));
    const given = parseAnswers(answers.value, items);
    if (!given.length) { score.textContent = '—'; return; }
    const r = scorePaper(items, given);
    score.textContent = `${r.correct}/${r.total}${given.length !== items.length ? ` · ${t('tst_count_mismatch', { n: given.length, m: items.length })}` : ''}`;
  };
  answers.addEventListener('input', update);
  variant.addEventListener('change', update);
  const row = el('div', { class: 'card plain tst-result-row' }, name, variant, answers, score,
    el('button', { class: 'btn ghost', type: 'button', 'aria-label': t('delete'), onclick: () => row.remove() }, '✕'));
  row._read = () => ({ name: name.value.trim(), v: Number(variant.value), text: answers.value });
  return row;
}

async function openResults(id) {
  state.test = await getTest(id);
  if (!state.test) return renderList();
  state.questions = await testQuestions(state.test);
  $('#resultsIntro').textContent = t('tst_results_intro', { title: state.test.title, n: buildVariant(state.test, state.questions, 0, getLang()).length });
  $('#isCheck').checked = false;
  $('#resultRows').replaceChildren(resultRow(), resultRow(), resultRow());
  show('resultsScreen');
}

async function saveResults() {
  const rows = [...$('#resultRows').children].map((r) => r._read()).filter((r) => r.name && r.text.trim());
  if (!rows.length) return toast(t('tst_results_empty'), { icon: '⚠️' });
  const log = [];
  const players = [];
  rows.forEach((r) => {
    const items = variantItems(r.v);
    const res = scorePaper(items, parseAnswers(r.text, items));
    const playerId = `paper:${studentKey(r.name)}`;
    res.rows.forEach((x) => log.push({ playerId, playerName: r.name, topic: x.item.q.topic, skill: x.item.q.skill, correct: x.correct, questionId: x.item.q.id }));
    players.push({ id: playerId, name: r.name, score: res.correct });
  });
  await recordStage({
    subject: state.test.subject, topic: state.test.topic,
    mode: $('#isCheck').checked ? 'paper-check' : 'paper', gameId: 'paper', log, players
  });
  toast(t('tst_results_saved', { n: rows.length }), { icon: '✅', ms: 4000 });
  setTimeout(() => { location.href = './reports.html'; }, 1500);
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  await setRole('teacher');
  mountHeader($('#header'), { role: 'teacher', active: 'tests.html' });

  $('#createBtn').addEventListener('click', () => openEdit(null));
  $('#cancelBtn').addEventListener('click', renderList);
  $('#saveBtn').addEventListener('click', save);
  $('#randomBtn').addEventListener('click', addRandom);
  $('#tSubject').addEventListener('change', async () => { syncTopics(); await loadPool(); renderEditor(); });
  $('#tTopic').addEventListener('change', async () => { await loadPool(); renderEditor(); });
  ['#fSkill', '#fDifficulty'].forEach((s) => $(s).addEventListener('change', renderAvail));
  $('#fSearch').addEventListener('input', renderAvail);
  $('#resultsBackBtn').addEventListener('click', renderList);
  $('#addRowBtn').addEventListener('click', () => $('#resultRows').append(resultRow()));
  $('#saveResultsBtn').addEventListener('click', saveResults);

  const params = new URLSearchParams(location.search);
  if (params.get('edit')) await openEdit(params.get('edit'));
  else if (params.get('results')) await openResults(params.get('results'));
  else await renderList();
})();
