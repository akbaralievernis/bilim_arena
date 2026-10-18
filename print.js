/**
 * Bilim Arena — печать теста (print.html?test=ID).
 *
 * Каждый вариант — свой лист: шапка (имя, класс, дата), вопросы, при желании
 * бланк ответов с кружками A–D. В конце — ключ ответов для учителя по всем
 * вариантам. Порядок и буквы считаются в core/tests.js и совпадают с вводом
 * результатов на странице «Тесты».
 */

import { bootstrap, mountHeader, el, $ } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { getTopic, getSubject } from './core/curriculum.js';
import { setRole } from './core/profile.js';
import { getTest, testQuestions, buildVariant, variantName, LETTERS } from './core/tests.js';
import { sheetSvg, MAX_ITEMS } from './core/omr.js';

const state = { test: null, questions: [] };
const field = (label) => el('span', { class: 'p-field' }, `${label}: `, el('span', { class: 'p-line' }));
const version = (test) => new Date(test.updatedAt).toISOString().slice(0, 16).replace('T', ' ');

function head(test, v, lang) {
  const topic = getTopic(test.topic);
  return el('header', { class: 'p-head' },
    el('div', { class: 'p-title-row' },
      el('b', { class: 'p-title' }, test.title),
      el('b', { class: 'p-variant' }, `${t('tst_variant')} ${variantName(v)}`)),
    el('div', { class: 'p-meta' }, [pick(getSubject(topic?.subject)?.title, lang), topic ? t('grade', { n: topic.grade }) : null, pick(topic?.title, lang)].filter(Boolean).join(' · ')),
    el('div', { class: 'p-fields' }, field(t('tst_p_name')), field(t('tst_p_class')), field(t('tst_p_date')))
  );
}

function questionBlock(item) {
  const body = [];
  if (item.options) {
    if (item.type === 'multiple') body.push(el('div', { class: 'p-hint' }, t('tst_p_multiple')));
    // Строки решения («где ошибка?») — одной колонкой и по порядку
    body.push(el('ol', { class: `p-options ${item.q.errorHunt ? 'p-lines' : ''}` }, ...item.options.map((o, k) => el('li', {}, el('b', {}, `${LETTERS[k]})`), ' ', o.text))));
  } else if (item.type === 'match') {
    body.push(el('div', { class: 'p-hint' }, t('tst_p_match')));
    body.push(el('div', { class: 'p-match' },
      el('ol', {}, ...item.left.map((l, k) => el('li', {}, el('b', {}, `${k + 1}.`), ' ', l.text))),
      el('ol', {}, ...item.right.map((r, k) => el('li', {}, el('b', {}, `${LETTERS[k]})`), ' ', r.text)))));
    body.push(el('div', { class: 'p-answer' }, item.left.map((_, k) => `${k + 1} — ____`).join('    ')));
  } else if (item.type === 'sort') {
    body.push(el('div', { class: 'p-hint' }, t('tst_p_sort')));
    body.push(el('ol', { class: 'p-options' }, ...item.items.map((x, k) => el('li', {}, el('b', {}, `${LETTERS[k]})`), ' ', x.text))));
    body.push(el('div', { class: 'p-answer' }, `${t('tst_p_order')}: ${item.items.map(() => '___').join(' → ')}`));
  } else {
    body.push(el('div', { class: 'p-answer' }, `${t('tst_p_answer')}: ______________________`));
  }
  return el('li', { class: 'p-q' }, el('div', { class: 'p-prompt' }, item.prompt), ...body);
}

/** Бланк ответов для сканера (core/omr.js): метки, код теста, номер ученика, кружки */
function answerSheet(test, v, items) {
  const box = el('div', { class: 'p-omr' });
  box.innerHTML = sheetSvg({
    testId: test.id, questionIds: test.questionIds, variant: v, items,
    title: test.title, variantLabel: `${t('tst_variant')} ${variantName(v)}`,
    labels: {
      name: t('tst_p_name'), number: t('omr_number'), tens: t('omr_tens'), units: t('omr_units'),
      howto: t('omr_howto'), version: `Bilim Arena · ${t('tst_p_version')}: ${version(test)}`
    }
  });
  return box;
}

function keyTable(test, variants) {
  return el('section', { class: 'p-sheet p-key' },
    el('h2', {}, `${t('tst_p_key')} — ${test.title}`),
    el('div', { class: 'p-meta' }, `${t('tst_p_version')}: ${version(test)}`),
    el('div', { class: 'p-key-grid' }, ...variants.map(({ v, items }) => el('table', { class: 'p-key-table' },
      el('caption', {}, `${t('tst_variant')} ${variantName(v)}`),
      el('tbody', {}, ...items.map((it) => el('tr', {}, el('th', {}, String(it.n)), el('td', {}, it.keyText))))
    )))
  );
}

function render() {
  const lang = getLang();
  const test = state.test;
  const count = Number($('#pVariants').value) || 1;
  const variants = Array.from({ length: count }, (_, v) => ({ v, items: buildVariant(test, state.questions, v, lang) }));
  const sheets = variants.map(({ v, items }) => el('section', { class: 'p-sheet' },
    head(test, v, lang),
    el('ol', { class: 'p-questions' }, ...items.map(questionBlock)),
    el('footer', { class: 'p-foot' }, `Bilim Arena · ${t('tst_p_version')}: ${version(test)}`),
    // Бланк — отдельной страницей (подвал уже на нём)
    ...($('#pGrid').checked ? [el('div', { class: 'p-grid-wrap' }, answerSheet(test, v, items))] : [])
  ));
  if ($('#pKey').checked) sheets.push(keyTable(test, variants));
  $('#sheets').replaceChildren(...sheets);
  const tooLong = variants[0].items.length > MAX_ITEMS;
  $('#omrNote').textContent = tooLong ? t('omr_too_long', { n: MAX_ITEMS }) : '';
}

(async function init() {
  await bootstrap();
  await setRole('teacher');
  mountHeader($('#header'), { role: 'teacher', active: 'print.html' });
  const id = new URLSearchParams(location.search).get('test');
  state.test = id ? await getTest(id) : null;
  if (!state.test) {
    $('#sheets').replaceChildren(el('div', { class: 'card center muted' }, t('tst_not_found')));
    $('#printControls').classList.add('hidden');
    return;
  }
  state.questions = await testQuestions(state.test);
  $('#printTitle').textContent = `${t('tst_print')}: ${state.test.title}`;
  document.title = `${state.test.title} — ${t('app_name')}`;
  ['#pVariants', '#pGrid', '#pKey'].forEach((s) => $(s).addEventListener('change', render));
  $('#printBtn').addEventListener('click', () => window.print());
  render();
})();
