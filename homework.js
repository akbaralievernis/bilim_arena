/**
 * Bilim Arena — домашние задания глазами учителя.
 *
 * Создание задания, назначение классу, аналитика выполнения и кнопка
 * «Повторить тему», которая строит урок на реальных ошибках класса.
 * Используется существующая аналитика по навыкам, своей системы здесь нет.
 */

import { bootstrap, mountHeader, el, $, toast } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { SUBJECTS, TOPICS, topicsOf, getTopic, getSubject, skillTitle, GRADES } from './core/curriculum.js';
import { store, KEYS } from './core/store.js';
import { setRole, getProfile } from './core/profile.js';
import {
  allAssignments, saveAssignment, deleteAssignment,
  assignmentStats, mistakeQuestionIds, STATUS
} from './core/assignments.js';
import { findQuestions } from './core/questions.js';

const state = { editing: null, mode: 'auto', picked: new Set(), classes: [], list: [] };
const screens = ['listScreen', 'formScreen', 'statsScreen'];
const show = (id) => screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));

const stat = (v, l) => el('div', { class: 'stat' }, el('b', {}, String(v)), el('span', {}, l));
const fmtDate = (ts) => new Date(ts).toLocaleDateString();
const dateValue = (ts) => new Date(ts - new Date(ts).getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// ─── Список заданий ───────────────────────────────────────────────────────────

async function renderList() {
  const lang = getLang();
  state.list = await allAssignments();
  state.classes = await store.get(KEYS.classes, []);

  const cards = [];
  for (const a of state.list) {
    const cls = state.classes.find((c) => c.id === a.classId);
    const stats = await assignmentStats(a.id, cls?.students.length || 0);
    const topic = getTopic(a.topic);
    const subject = getSubject(a.subject);

    cards.push(el('div', { class: 'card hw-card' },
      el('div', { class: 'row between' },
        el('b', {}, a.title || pick(topic?.title, lang)),
        el('span', { class: 'chip small' }, `${a.count} ❓`)
      ),
      el('div', { class: 'hw-meta' },
        el('span', {}, `${subject?.icon || '📘'} ${pick(subject?.title, lang)}`),
        el('span', {}, `🎓 ${t('grade', { n: a.grade })}`),
        cls ? el('span', {}, `👥 ${cls.name}`) : null,
        el('span', {}, `📅 ${fmtDate(a.dueAt)}`),
        el('span', {}, `✨ ${a.xp} XP`)
      ),
      el('div', { class: 'row between small' },
        el('span', { class: 'state learned' }, `✅ ${t('hw_completed_n', { n: stats.completed })}`),
        el('span', { class: 'state review' }, `⏳ ${t('hw_not_completed_n', { n: stats.notCompleted })}`),
        el('b', {}, `${stats.average}%`)
      ),
      el('div', { class: `bar ${stats.average >= 70 ? 'ok' : ''}` }, el('i', { style: `width:${stats.average}%` })),
      stats.topMistake
        ? el('div', { class: 'small muted' }, `⚠️ ${t('hw_top_mistake')}: ${skillTitle(a.topic, stats.topMistake.skill, lang)}`)
        : null,
      el('div', { class: 'row', style: 'gap:8px' },
        el('button', { class: 'btn primary', type: 'button', onclick: () => openStats(a.id) }, `📊 ${t('nav_results')}`),
        el('button', { class: 'btn', type: 'button', onclick: () => openForm(a) }, `✏️ ${t('edit')}`),
        el('button', {
          class: 'btn ghost', type: 'button', 'aria-label': t('delete'),
          onclick: async () => {
            if (!confirm(t('hw_delete_confirm'))) return;
            await deleteAssignment(a.id);
            toast(t('delete'), { icon: '🗑️' });
            renderList();
          }
        }, '🗑️')
      )
    ));
  }

  $('#assignmentList').replaceChildren(...(cards.length
    ? cards
    : [el('div', { class: 'card center muted' }, t('hw_no_assignments'))]));
  show('listScreen');
}

// ─── Форма создания ───────────────────────────────────────────────────────────

function fillSelect(sel, items, value) {
  sel.replaceChildren(...items.map((it) => el('option', {
    value: it.value, ...(String(it.value) === String(value) ? { selected: 'selected' } : {})
  }, it.label)));
}

function subjectsWithTopics() {
  const ids = new Set(TOPICS.map((x) => x.subject));
  return SUBJECTS.filter((s) => ids.has(s.id));
}

async function openForm(assignment = null) {
  const lang = getLang();
  state.editing = assignment;
  state.picked = new Set(assignment?.questionIds || []);
  state.mode = assignment?.questionIds?.length ? 'pick' : 'auto';
  state.classes = await store.get(KEYS.classes, []);

  $('#formTitle').textContent = assignment ? t('hw_edit') : t('hw_create');

  fillSelect($('#fSubject'), subjectsWithTopics().map((s) => ({
    value: s.id, label: `${s.icon} ${pick(s.title, lang)}`
  })), assignment?.subject);

  fillSelect($('#fGrade'), GRADES.map((g) => ({ value: g, label: t('grade', { n: g }) })), assignment?.grade || 6);

  fillSelect($('#fDifficulty'), [
    { value: '1,2,3', label: t('hw_all_skills') },
    { value: '1', label: t('difficulty_1') },
    { value: '2', label: t('difficulty_2') },
    { value: '3', label: t('difficulty_3') }
  ], (assignment?.difficulty || [1, 2]).join(','));

  fillSelect($('#fClass'), [
    { value: '', label: '—' },
    ...state.classes.map((c) => ({ value: c.id, label: `${c.name} (${c.students.length})` }))
  ], assignment?.classId || '');

  $('#fTitle').value = assignment?.title || '';
  $('#fCount').value = assignment?.count || 10;
  $('#fAttempts').value = assignment?.attempts || 2;
  $('#fXP').value = assignment?.xp || 50;
  $('#fAssigned').value = dateValue(assignment?.assignedAt || Date.now());
  $('#fDue').value = dateValue(assignment?.dueAt || Date.now() + 7 * 86400000);

  await syncTopics(assignment?.topic, assignment?.skill);
  updateMode();
  show('formScreen');
}

/** Темы и навыки зависят от предмета и класса */
async function syncTopics(topicId = null, skillId = null) {
  const lang = getLang();
  const subject = $('#fSubject').value;
  const grade = Number($('#fGrade').value);

  let topics = topicsOf(subject, grade);
  if (!topics.length) topics = topicsOf(subject); // в этом классе тем нет — показываем все

  fillSelect($('#fTopic'), topics.map((tp) => ({
    value: tp.id, label: `${pick(tp.title, lang)} (${t('grade', { n: tp.grade })})`
  })), topicId || topics[0]?.id);

  syncSkills(skillId);
}

function syncSkills(skillId = null) {
  const lang = getLang();
  const topic = getTopic($('#fTopic').value);
  $('#fSection').value = topic ? pick(topic.section, lang) : '';

  fillSelect($('#fSkill'), [
    { value: '', label: t('hw_all_skills') },
    ...(topic?.skills || []).map((sk) => ({ value: sk.id, label: pick(sk.title, lang) }))
  ], skillId || '');
}

/** Режим: система подбирает вопросы или учитель выбирает вручную */
async function updateMode() {
  const manual = state.mode === 'pick';
  $('#modeAuto').setAttribute('aria-pressed', String(!manual));
  $('#modeAuto').classList.toggle('on', !manual);
  $('#modePick').setAttribute('aria-pressed', String(manual));
  $('#modePick').classList.toggle('on', manual);
  $('#pickBox').classList.toggle('hidden', !manual);
  if (manual) await renderPickList();
}

async function renderPickList() {
  const lang = getLang();
  const topic = $('#fTopic').value;
  const own = await findQuestions({ topic });

  // Готовые вопросы темы + вопросы учителя
  const { loadBank } = await import('./core/curriculum.js');
  const bank = await loadBank(topic);

  const rows = [...bank, ...own].map((q) => {
    const id = q.id;
    const text = pickText(q.prompt ?? q.question, lang);
    const selected = state.picked.has(id);
    return el('label', { class: `q-row ${selected ? 'sel' : ''}` },
      el('input', {
        type: 'checkbox', ...(selected ? { checked: 'checked' } : {}),
        onchange: (e) => {
          e.target.checked ? state.picked.add(id) : state.picked.delete(id);
          $('#pickCount').textContent = t('hw_selected', { n: state.picked.size });
          e.target.closest('.q-row').classList.toggle('sel', e.target.checked);
        }
      }),
      el('span', { class: 'q-text' },
        el('b', {}, text),
        el('span', { class: 'small muted' }, `${skillTitle(topic, q.skill, lang)} · ${t('difficulty_' + (q.difficulty || 1))}`)
      )
    );
  });

  $('#pickCount').textContent = t('hw_selected', { n: state.picked.size });
  $('#pickList').replaceChildren(...(rows.length ? rows : [el('p', { class: 'muted' }, t('qb_empty'))]));
}

const pickText = (v, lang) => (v && typeof v === 'object' ? (v[lang] || v.ky || Object.values(v)[0]) : String(v ?? ''));

async function saveForm() {
  const topic = $('#fTopic').value;
  const title = $('#fTitle').value.trim();
  if (!topic) return toast(t('required_fields'), { icon: '⚠️' });

  const profile = await getProfile();
  const data = {
    id: state.editing?.id,
    title: title || pickText(getTopic(topic)?.title, getLang()),
    subject: $('#fSubject').value,
    grade: Number($('#fGrade').value),
    section: $('#fSection').value,
    topic,
    skill: $('#fSkill').value || null,
    difficulty: $('#fDifficulty').value.split(',').map(Number),
    count: Math.max(3, Number($('#fCount').value) || 10),
    questionIds: state.mode === 'pick' && state.picked.size ? [...state.picked] : null,
    classId: $('#fClass').value || null,
    assignedAt: new Date($('#fAssigned').value).getTime() || Date.now(),
    dueAt: new Date($('#fDue').value).setHours(23, 59, 59, 999) || Date.now(),
    attempts: Math.max(1, Number($('#fAttempts').value) || 1),
    xp: Math.max(10, Number($('#fXP').value) || 50),
    teacherName: profile.name || t('role_teacher')
  };

  // Если вопросы выбраны вручную — их количество и есть количество вопросов
  if (data.questionIds) data.count = data.questionIds.length;

  await saveAssignment(data);
  toast(t('hw_saved'), { icon: '✅' });
  renderList();
}

// ─── Аналитика задания ────────────────────────────────────────────────────────

async function openStats(assignmentId) {
  const lang = getLang();
  state.classes = await store.get(KEYS.classes, []);
  const a = state.list.find((x) => x.id === assignmentId);
  const cls = state.classes.find((c) => c.id === a?.classId);
  const s = await assignmentStats(assignmentId, cls?.students.length || 0);
  const topic = getTopic(a.topic);

  $('#statsTitle').textContent = a.title || pick(topic?.title, lang);
  $('#statsMeta').textContent = [
    pick(getSubject(a.subject)?.title, lang),
    t('grade', { n: a.grade }),
    pick(topic?.title, lang),
    cls ? `${cls.name} · ${cls.students.length} ${t('role_student').toLowerCase()}` : ''
  ].filter(Boolean).join(' · ');

  $('#statsNumbers').replaceChildren(
    stat(s.assigned, t('nav_class')),
    stat(s.completed, t('hw_completed_n', { n: '' }).replace(/:.*$/, '')),
    stat(s.notCompleted, t('hw_not_completed_n', { n: '' }).replace(/:.*$/, '')),
    stat(`${s.average}%`, t('hw_average')),
    stat(s.late, t('hw_status_late'))
  );

  // Навыки, по которым класс ошибается чаще всего
  $('#statsSkills').replaceChildren(...(s.weakSkills.length
    ? s.weakSkills.map((w) => el('div', { style: 'margin-bottom:12px' },
      el('div', { class: 'row between' },
        el('b', {}, skillTitle(a.topic, w.skill, lang)),
        el('span', { class: 'state review' }, `⚠️ ${w.percent}%`)
      ),
      el('div', { class: 'bar' }, el('i', { style: `width:${w.percent}%` })),
      el('div', { class: 'small muted' }, t('analytics_students_review', { n: w.students }))
    ))
    : [el('p', { class: 'muted' }, t('results_nothing_wrong'))]));

  // Кто выполнил и с каким результатом
  $('#statsStudents').replaceChildren(...(s.submissions.length
    ? s.submissions.map((sub) => el('div', { class: 'row between', style: 'padding:.4em 0;border-bottom:1px solid var(--line)' },
      el('span', {}, sub.studentName || '—'),
      el('span', { class: 'small muted' }, `${sub.correct}/${sub.total}`),
      el('b', { class: sub.best >= 70 ? 'state learned' : 'state review' }, `${sub.best}%`)
    ))
    : [el('p', { class: 'muted' }, t('hw_not_completed_n', { n: s.notCompleted }))]));

  // Повторение строится на реальных ошибках класса
  $('#reviewBtn').disabled = s.weakSkills.length === 0;
  $('#reviewBtn').onclick = async () => {
    const ids = await mistakeQuestionIds(assignmentId);
    const params = new URLSearchParams({
      subject: a.subject, topic: a.topic, duration: '20', mode: 'review'
    });
    if (s.weakSkills.length) params.set('skills', s.weakSkills.map((w) => w.skill).join(','));
    if (ids.length) params.set('questions', ids.slice(0, 12).join(','));
    location.href = `./board.html?${params}`;
  };

  show('statsScreen');
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  await setRole('teacher');
  mountHeader($('#header'), { role: 'teacher', active: 'homework.html' });

  await renderList();
  // Пришли результаты учеников из облака — обновить список, если открыт он
  window.addEventListener('ba:synced', () => { if (!$('#listScreen')?.classList.contains('hidden')) renderList(); });

  $('#createBtn').addEventListener('click', () => openForm(null));
  $('#cancelBtn').addEventListener('click', renderList);
  $('#saveBtn').addEventListener('click', saveForm);
  $('#statsBackBtn').addEventListener('click', renderList);

  $('#fSubject').addEventListener('change', () => syncTopics());
  $('#fGrade').addEventListener('change', () => syncTopics());
  $('#fTopic').addEventListener('change', () => { syncSkills(); if (state.mode === 'pick') renderPickList(); });
  $('#modeAuto').addEventListener('click', () => { state.mode = 'auto'; updateMode(); });
  $('#modePick').addEventListener('click', () => { state.mode = 'pick'; updateMode(); });

  // Быстрое создание задания из выбранных вопросов библиотеки
  const params = new URLSearchParams(location.search);
  if (params.get('questions')) {
    await openForm(null);
    state.mode = 'pick';
    state.picked = new Set(params.get('questions').split(','));
    if (params.get('topic')) {
      $('#fTopic').value = params.get('topic');
      syncSkills();
    }
    updateMode();
  }
  void STATUS;
})();
