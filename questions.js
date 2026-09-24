/**
 * Bilim Arena — библиотека и конструктор вопросов учителя.
 *
 * Вопросы хранятся отдельно от игрового движка (core/questions.js) и
 * автоматически попадают в уроки, практику и домашние задания через
 * curriculum.getQuestions(). Никакой вопрос не зашит в код игры.
 */

import { bootstrap, mountHeader, el, $, toast } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { SUBJECTS, TOPICS, topicsOf, getTopic, skillTitle, GRADES } from './core/curriculum.js';
import { setRole } from './core/profile.js';
import {
  QUESTION_TYPES, typeMeta, findQuestions, saveQuestion,
  deleteQuestion, duplicateQuestion, getQuestion
} from './core/questions.js';

const state = { editing: null, selected: new Set(), list: [], draft: {} };
const screens = ['listScreen', 'formScreen'];
const show = (id) => screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));

const textOf = (v, lang) => (v && typeof v === 'object' ? (v[lang] || v.ky || Object.values(v)[0] || '') : String(v ?? ''));
const subjectsWithTopics = () => {
  const ids = new Set(TOPICS.map((x) => x.subject));
  return SUBJECTS.filter((s) => ids.has(s.id));
};

function fillSelect(sel, items, value) {
  sel.replaceChildren(...items.map((it) => el('option', {
    value: it.value, ...(String(it.value) === String(value) ? { selected: 'selected' } : {})
  }, it.label)));
}

// ─── Библиотека ───────────────────────────────────────────────────────────────

function renderFilters() {
  const lang = getLang();
  fillSelect($('#filterSubject'), [{ value: '', label: t('hw_all_skills') },
    ...subjectsWithTopics().map((s) => ({ value: s.id, label: `${s.icon} ${pick(s.title, lang)}` }))], '');
  fillSelect($('#filterGrade'), [{ value: '', label: '—' },
    ...GRADES.map((g) => ({ value: g, label: t('grade', { n: g }) }))], '');
  fillSelect($('#filterTopic'), [{ value: '', label: '—' },
    ...TOPICS.map((tp) => ({ value: tp.id, label: pick(tp.title, lang) }))], '');
  fillSelect($('#filterSkill'), [{ value: '', label: t('hw_all_skills') }], '');
  fillSelect($('#filterDifficulty'), [{ value: '', label: '—' },
    { value: 1, label: t('difficulty_1') }, { value: 2, label: t('difficulty_2') }, { value: 3, label: t('difficulty_3') }], '');
  fillSelect($('#filterType'), [{ value: '', label: '—' },
    ...QUESTION_TYPES.map((x) => ({ value: x.id, label: `${x.icon} ${pick(x.title, lang)}` }))], '');
}

function syncFilterSkills() {
  const lang = getLang();
  const topic = getTopic($('#filterTopic').value);
  fillSelect($('#filterSkill'), [{ value: '', label: t('hw_all_skills') },
    ...(topic?.skills || []).map((sk) => ({ value: sk.id, label: pick(sk.title, lang) }))], '');
}

async function renderList() {
  const lang = getLang();
  state.list = await findQuestions({
    subject: $('#filterSubject').value || null,
    grade: $('#filterGrade').value || null,
    topic: $('#filterTopic').value || null,
    skill: $('#filterSkill').value || null,
    difficulty: $('#filterDifficulty').value || null,
    type: $('#filterType').value || null,
    search: $('#filterSearch').value
  });

  $('#countLabel').textContent = `${state.list.length} · ${t('hw_selected', { n: state.selected.size })}`;
  $('#makeAssignmentBtn').disabled = state.selected.size === 0;

  const rows = state.list.map((q) => {
    const meta = typeMeta(q.type);
    const selected = state.selected.has(q.id);
    return el('div', { class: `q-row ${selected ? 'sel' : ''}` },
      el('input', {
        type: 'checkbox', 'aria-label': textOf(q.question, lang),
        ...(selected ? { checked: 'checked' } : {}),
        onchange: (e) => {
          e.target.checked ? state.selected.add(q.id) : state.selected.delete(q.id);
          renderList();
        }
      }),
      el('span', { class: 'q-text' },
        el('b', {}, textOf(q.question, lang)),
        el('span', { class: 'small muted' },
          `${meta.icon} ${pick(meta.title, lang)} · ${skillTitle(q.topic, q.skill, lang)} · ${t('difficulty_' + (q.difficulty || 1))} · ${q.xp || 10} XP`)
      ),
      el('button', { class: 'btn ghost', type: 'button', 'aria-label': t('edit'), onclick: () => openForm(q.id) }, '✏️'),
      el('button', {
        class: 'btn ghost', type: 'button', 'aria-label': t('qb_duplicate'),
        onclick: async () => { await duplicateQuestion(q.id); toast(t('qb_duplicate'), { icon: '📋' }); renderList(); }
      }, '📋'),
      el('button', {
        class: 'btn ghost', type: 'button', 'aria-label': t('delete'),
        onclick: async () => {
          if (!confirm(t('qb_delete_confirm'))) return;
          await deleteQuestion(q.id);
          state.selected.delete(q.id);
          toast(t('delete'), { icon: '🗑️' });
          renderList();
        }
      }, '🗑️')
    );
  });

  $('#questionList').replaceChildren(...(rows.length ? rows : [el('div', { class: 'card center muted' }, t('qb_empty'))]));
  show('listScreen');
}

// ─── Конструктор ──────────────────────────────────────────────────────────────

async function openForm(id = null) {
  const lang = getLang();
  const q = id ? await getQuestion(id) : null;
  state.editing = q;
  state.draft = q ? JSON.parse(JSON.stringify(q)) : { type: 'single', options: ['', '', '', ''], correctAnswer: 0, difficulty: 1, xp: 10 };

  $('#formTitle').textContent = q ? t('qb_edit') : t('qb_create');

  fillSelect($('#fSubject'), subjectsWithTopics().map((s) => ({ value: s.id, label: `${s.icon} ${pick(s.title, lang)}` })), q?.subject);
  fillSelect($('#fGrade'), GRADES.map((g) => ({ value: g, label: t('grade', { n: g }) })), q?.grade || 6);
  fillSelect($('#fDifficulty'), [
    { value: 1, label: t('difficulty_1') }, { value: 2, label: t('difficulty_2') }, { value: 3, label: t('difficulty_3') }
  ], q?.difficulty || 1);
  fillSelect($('#fType'), QUESTION_TYPES.map((x) => ({ value: x.id, label: `${x.icon} ${pick(x.title, lang)}` })), q?.type || 'single');

  $('#fQuestion').value = textOf(q?.question, lang);
  $('#fExplanation').value = textOf(q?.explanation, lang);
  $('#fXP').value = q?.xp || 10;

  syncTopics(q?.topic, q?.skill);
  renderAnswerFields();
  show('formScreen');
}

function syncTopics(topicId = null, skillId = null) {
  const lang = getLang();
  const subject = $('#fSubject').value;
  const grade = Number($('#fGrade').value);
  let topics = topicsOf(subject, grade);
  if (!topics.length) topics = topicsOf(subject);

  fillSelect($('#fTopic'), topics.map((tp) => ({
    value: tp.id, label: `${pick(tp.title, lang)} (${t('grade', { n: tp.grade })})`
  })), topicId || topics[0]?.id);
  syncSkills(skillId);
}

function syncSkills(skillId = null) {
  const lang = getLang();
  const topic = getTopic($('#fTopic').value);
  $('#fSection').value = topic ? pick(topic.section, lang) : '';
  fillSelect($('#fSkill'), (topic?.skills || []).map((sk) => ({ value: sk.id, label: pick(sk.title, lang) })), skillId);
}

/** Поля ответа зависят от выбранного типа задания */
function renderAnswerFields() {
  const lang = getLang();
  const type = $('#fType').value;
  const d = state.draft;
  const host = $('#answerFields');
  host.replaceChildren();

  const optionRows = (labelKey, values, onChange, radio = true) => {
    const box = el('div', { class: 'stack' });
    values.forEach((val, i) => {
      box.append(el('label', { class: 'row', style: 'gap:10px' },
        el('input', {
          type: radio ? 'radio' : 'checkbox', name: 'correctOpt',
          'aria-label': t('qb_correct'),
          ...(radio
            ? (Number(d.correctAnswer) === i ? { checked: 'checked' } : {})
            : ((d.correctAnswer || []).map(Number).includes(i) ? { checked: 'checked' } : {})),
          onchange: (e) => {
            if (radio) d.correctAnswer = i;
            else {
              const set = new Set((d.correctAnswer || []).map(Number));
              e.target.checked ? set.add(i) : set.delete(i);
              d.correctAnswer = [...set];
            }
          }
        }),
        el('input', {
          class: 'input', value: textOf(val, lang), style: 'flex:1',
          'aria-label': t(labelKey, { n: i + 1 }),
          oninput: (e) => onChange(i, e.target.value)
        })
      ));
    });
    return box;
  };

  if (type === 'single' || type === 'multiple') {
    if (!Array.isArray(d.options) || !d.options.length) d.options = ['', '', '', ''];
    if (type === 'multiple' && !Array.isArray(d.correctAnswer)) d.correctAnswer = [];

    host.append(
      el('div', { class: 'label' }, `${t('qb_options')} · ${t('qb_correct')}`),
      optionRows('qb_option', d.options, (i, v) => { d.options[i] = v; }, type === 'single'),
      el('button', {
        class: 'btn ghost', type: 'button',
        onclick: () => { d.options.push(''); renderAnswerFields(); }
      }, `➕ ${t('qb_add_option')}`)
    );

  } else if (type === 'truefalse') {
    host.append(
      el('div', { class: 'label' }, t('qb_correct')),
      el('div', { class: 'chips' },
        [['0', t('yes')], ['1', t('no')]].map(([val, label]) => el('button', {
          class: 'chip', type: 'button',
          'aria-pressed': String(String(d.correctAnswer ?? '0') === val),
          onclick: () => { d.correctAnswer = Number(val); renderAnswerFields(); }
        }, label))
      )
    );

  } else if (type === 'number' || type === 'text') {
    host.append(
      el('label', { class: 'field' },
        el('span', { class: 'label' }, t('qb_answer')),
        el('input', {
          class: 'input', id: 'fAnswer',
          inputmode: type === 'number' ? 'decimal' : 'text',
          value: Array.isArray(d.correctAnswer) ? d.correctAnswer.join(' | ') : (d.correctAnswer ?? ''),
          oninput: (e) => { d.correctAnswer = e.target.value; }
        }),
        el('span', { class: 'small muted' }, t('qb_answer_hint'))
      )
    );

  } else if (type === 'match') {
    if (!Array.isArray(d.correctAnswer) || !d.correctAnswer.length) d.correctAnswer = [['', ''], ['', ''], ['', '']];
    host.append(
      el('div', { class: 'label' }, t('qb_pairs')),
      el('div', { class: 'stack' }, d.correctAnswer.map((pair, i) => el('div', { class: 'row', style: 'gap:8px' },
        el('input', {
          class: 'input', value: textOf(pair[0], lang), 'aria-label': t('qb_left'), style: 'flex:1',
          oninput: (e) => { d.correctAnswer[i][0] = e.target.value; }
        }),
        el('span', {}, '→'),
        el('input', {
          class: 'input', value: textOf(pair[1], lang), 'aria-label': t('qb_right'), style: 'flex:1',
          oninput: (e) => { d.correctAnswer[i][1] = e.target.value; }
        })
      ))),
      el('button', {
        class: 'btn ghost', type: 'button',
        onclick: () => { d.correctAnswer.push(['', '']); renderAnswerFields(); }
      }, `➕ ${t('qb_add_option')}`)
    );

  } else if (type === 'sort' || type === 'sequence') {
    if (!Array.isArray(d.correctAnswer) || !d.correctAnswer.length) d.correctAnswer = ['', '', ''];
    host.append(
      el('div', { class: 'label' }, t('qb_items')),
      el('div', { class: 'stack' }, d.correctAnswer.map((item, i) => el('div', { class: 'row', style: 'gap:8px' },
        el('span', { class: 'key' }, String(i + 1)),
        el('input', {
          class: 'input', value: textOf(item, lang), style: 'flex:1',
          'aria-label': t('qb_option', { n: i + 1 }),
          oninput: (e) => { d.correctAnswer[i] = e.target.value; }
        })
      ))),
      el('button', {
        class: 'btn ghost', type: 'button',
        onclick: () => { d.correctAnswer.push(''); renderAnswerFields(); }
      }, `➕ ${t('qb_add_option')}`)
    );

  } else if (type === 'error') {
    if (!Array.isArray(d.options) || !d.options.length) d.options = ['', '', ''];
    host.append(
      el('div', { class: 'label' }, t('qb_lines')),
      optionRows('qb_option', d.options, (i, v) => { d.options[i] = v; }, true),
      el('div', { class: 'small muted' }, t('qb_error_line')),
      el('button', {
        class: 'btn ghost', type: 'button',
        onclick: () => { d.options.push(''); renderAnswerFields(); }
      }, `➕ ${t('qb_add_option')}`)
    );
  }
}

async function save() {
  const d = state.draft;
  const type = $('#fType').value;
  const question = $('#fQuestion').value.trim();
  const topic = $('#fTopic').value;
  const skill = $('#fSkill').value;

  if (!question || !topic || !skill) return toast(t('required_fields'), { icon: '⚠️' });

  // Приводим ответы к нужному виду для каждого типа
  let correctAnswer = d.correctAnswer;
  let options = d.options;

  if (type === 'single' || type === 'error') {
    options = (options || []).map((x) => String(x).trim()).filter(Boolean);
    correctAnswer = Number(correctAnswer) || 0;
    if (options.length < 2) return toast(t('required_fields'), { icon: '⚠️' });
  } else if (type === 'multiple') {
    options = (options || []).map((x) => String(x).trim()).filter(Boolean);
    correctAnswer = (Array.isArray(correctAnswer) ? correctAnswer : []).map(Number).filter((i) => i < options.length);
    if (!correctAnswer.length) return toast(t('required_fields'), { icon: '⚠️' });
  } else if (type === 'number' || type === 'text') {
    correctAnswer = String(correctAnswer ?? '').split('|').map((x) => x.trim()).filter(Boolean);
    if (!correctAnswer.length) return toast(t('required_fields'), { icon: '⚠️' });
    options = null;
  } else if (type === 'match') {
    correctAnswer = (correctAnswer || []).filter((p) => String(p[0]).trim() && String(p[1]).trim());
    if (correctAnswer.length < 2) return toast(t('required_fields'), { icon: '⚠️' });
    options = null;
  } else if (type === 'sort' || type === 'sequence') {
    correctAnswer = (correctAnswer || []).map((x) => String(x).trim()).filter(Boolean);
    if (correctAnswer.length < 2) return toast(t('required_fields'), { icon: '⚠️' });
    options = null;
  } else if (type === 'truefalse') {
    correctAnswer = Number(correctAnswer) || 0;
    options = null;
  }

  const topicObj = getTopic(topic);
  await saveQuestion({
    id: state.editing?.id,
    type,
    question,
    options,
    correctAnswer,
    explanation: $('#fExplanation').value.trim(),
    subject: $('#fSubject').value,
    grade: Number($('#fGrade').value),
    section: topicObj ? pick(topicObj.section, getLang()) : '',
    topic,
    skill,
    difficulty: Number($('#fDifficulty').value) || 1,
    xp: Number($('#fXP').value) || 10
  });

  toast(t('qb_saved'), { icon: '✅' });
  renderList();
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  await setRole('teacher');
  mountHeader($('#header'), { role: 'teacher', active: 'questions.html' });

  renderFilters();
  await renderList();

  ['filterSubject', 'filterGrade', 'filterTopic', 'filterSkill', 'filterDifficulty', 'filterType'].forEach((id) => {
    $('#' + id).addEventListener('change', () => {
      if (id === 'filterTopic') syncFilterSkills();
      renderList();
    });
  });
  $('#filterSearch').addEventListener('input', () => renderList());

  $('#createBtn').addEventListener('click', () => openForm(null));
  $('#cancelBtn').addEventListener('click', renderList);
  $('#saveBtn').addEventListener('click', save);

  $('#fSubject').addEventListener('change', () => syncTopics());
  $('#fGrade').addEventListener('change', () => syncTopics());
  $('#fTopic').addEventListener('change', () => syncSkills());
  $('#fType').addEventListener('change', () => {
    state.draft = { ...state.draft, options: undefined, correctAnswer: undefined };
    renderAnswerFields();
  });

  $('#selectAllBtn').addEventListener('click', () => {
    state.list.forEach((q) => state.selected.add(q.id));
    renderList();
  });
  $('#clearSelBtn').addEventListener('click', () => { state.selected.clear(); renderList(); });

  // Из выбранных вопросов сразу создаётся домашнее задание
  $('#makeAssignmentBtn').addEventListener('click', () => {
    if (!state.selected.size) return;
    const first = state.list.find((q) => state.selected.has(q.id));
    const params = new URLSearchParams({ questions: [...state.selected].join(',') });
    if (first?.topic) params.set('topic', first.topic);
    location.href = `./homework.html?${params}`;
  });
})();
