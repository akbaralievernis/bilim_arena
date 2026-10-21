/**
 * Bilim Arena — отчёты учителя: история уроков и отчёт по каждому ученику.
 * Данные: журнал уроков с доски (core/lessons.js) и домашние задания.
 */

import { bootstrap, mountHeader, el, $, toast } from './core/ui.js';
import { icon } from './core/icons.js';
import { t, pick, getLang } from './core/i18n.js';
import { getTopic, getSubject, skillTitle, SUBJECTS, TOPICS, findQuestion } from './core/curriculum.js';
import { setRole, getProfile } from './core/profile.js';
import { lessonHistory, getLesson, deleteLesson, studentSummaries, studentReport, studentPractice, weakFrom } from './core/lessons.js';
import { masterySettings, saveMasterySettings } from './core/mastery.js';
import { fromTeacher, reportLink } from './core/parent-report.js';
import { allCycles, getCycle, saveCycle, deleteCycle, cycleReport } from './core/cycles.js';
import { classYurts, yurtSvg, YURT_PARTS, SHARE, MIN_CHECKED } from './core/yurt.js';
import { store, KEYS } from './core/store.js';

/** Статус освоения темы → класс и подпись */
const STATUS_VIEW = {
  mastered: ['learned', 'mastery_learned'],
  ready: ['ready', 'mastery_ready'],
  learning: ['review', 'mastery_review'],
  insufficient: ['insufficient', 'mastery_insufficient'],
  new: ['new', 'mastery_new']
};
/** Выгрузка в Excel: модуль подгружается только по нажатию */
async function toExcel(kind, arg) {
  try {
    const mod = await import('./core/report-export.js');
    const n = await { students: mod.exportStudents, lesson: mod.exportLesson, student: mod.exportStudent }[kind](arg);
    toast(n ? t('xl_done') : t('rep_students_empty'), { icon: n ? '📊' : 'ℹ️' });
  } catch (e) {
    console.error('[excel]', e);
    toast(t('xl_failed'), { icon: '⚠️' });
  }
}
const excelBtn = (onclick) => el('button', { class: 'btn ghost', type: 'button', onclick }, icon('download', { size: 18 }), ' ', t('xl_export'));

const statusBadge = (status) => el('span', { class: `state ${STATUS_VIEW[status][0]}` }, t(STATUS_VIEW[status][1]));

const screens = ['lessonsScreen', 'lessonScreen', 'studentsScreen', 'studentScreen', 'cyclesScreen', 'cycleFormScreen', 'cycleScreen'];
const show = (id) => {
  screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));
  const tab = id.startsWith('student') ? 'tabStudents' : id.startsWith('cycle') ? 'tabCycles' : 'tabLessons';
  ['tabLessons', 'tabStudents', 'tabCycles'].forEach((x) => {
    $('#' + x).classList.toggle('on', x === tab);
    $('#' + x).setAttribute('aria-selected', String(x === tab));
  });
  window.scrollTo(0, 0);
};

// Дата без зависимости от языковых данных браузера (кыргызской локали часто нет)
const two = (n) => String(n).padStart(2, '0');
const fmtDate = (ms) => { const d = new Date(ms); return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}`; };
const fmtDateTime = (ms) => { const d = new Date(ms); return `${fmtDate(ms)} ${two(d.getHours())}:${two(d.getMinutes())}`; };

const pctOf = (ok, total) => (total ? Math.round((ok / total) * 100) : null);
const pctBadge = (p) => el('span', { class: `rep-pct ${p === null ? '' : p < 50 ? 'low' : p < 70 ? 'mid' : 'high'}` }, p === null ? '—' : `${p}%`);

function topicLine(topicId, subjectId) {
  const lang = getLang();
  const topic = getTopic(topicId);
  const subject = getSubject(topic?.subject || subjectId);
  return [subject ? pick(subject.title, lang) : null, topic ? t('grade', { n: topic.grade }) : null, topic ? pick(topic.title, lang) : null]
    .filter(Boolean).join(' · ');
}

const skillName = (topic, skill) => skillTitle(topic, skill, getLang()) || skill || '—';

function weakList(weak, sameTopic = null) {
  if (!weak.length) return el('p', { class: 'muted' }, t('rep_no_weak'));
  return el('div', { class: 'rep-weak' }, ...weak.map((w) => el('div', { class: 'rep-weak-row' },
    el('span', {}, el('b', {}, skillName(w.topic, w.skill)), el('span', { class: 'small muted' }, w.topic && w.topic !== sameTopic ? ` · ${pick(getTopic(w.topic)?.title, getLang()) || ''}` : '')),
    el('span', { class: 'small' }, `${w.ok}/${w.total} `, pctBadge(w.pct))
  )));
}

// ─── История уроков ───────────────────────────────────────────────────────────

/**
 * Экран, открытый последним. Данные читаются асинхронно: запоздавшая отрисовка прежнего экрана
 * (например, начальная «История уроков» на медленном телефоне) не должна перекрыть вкладку,
 * которую учитель уже открыл.
 */
let viewSeq = 0;
const nextView = () => { const n = ++viewSeq; return () => n === viewSeq; };

async function renderLessons() {
  const current = nextView();
  const lessons = await lessonHistory();
  if (!current()) return;
  show('lessonsScreen');
  if (!lessons.length) {
    $('#lessonList').replaceChildren(el('div', { class: 'card center muted' }, t('rep_lessons_empty')));
    return;
  }
  $('#lessonList').replaceChildren(...lessons.map((l) => {
    const students = Object.keys(l.students || {}).length;
    return el('button', { class: 'rep-row', type: 'button', onclick: () => openLesson(l.id) },
      el('b', {}, topicLine(l.topic, l.subject) || '—'),
      pctBadge(pctOf(l.correct, l.answered)),
      el('span', { class: 'rep-sub small muted' },
        [l.mode === 'paper-check' ? t('rep_paper_check') : l.mode === 'paper' ? t('rep_paper') : null,
          fmtDateTime(l.at), t('rep_students_n', { n: students }), t('rep_answers', { c: l.correct, n: l.answered }), t('rep_stage_n', { n: l.stages.length })]
          .filter(Boolean).join(' · '))
    );
  }));
}

async function openLesson(id) {
  const current = nextView();
  const lesson = await getLesson(id);
  if (!current()) return;
  if (!lesson) return renderLessons();
  const students = Object.values(lesson.students || {})
    .map((s) => ({ ...s, pct: pctOf(s.correct, s.answered) }))
    .sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101) || a.name.localeCompare(b.name));
  const weak = weakFrom(lesson.bySkill, 6);
  const wrongIds = [...new Set(students.flatMap((s) => s.wrong || []))];
  const topic = getTopic(lesson.topic);

  const reviewUrl = topic ? `./board.html?${new URLSearchParams({
    subject: topic.subject, topic: topic.id, mode: 'review',
    questions: wrongIds.slice(0, 12).join(','),
    skills: weak.filter((w) => w.topic === topic.id).map((w) => w.skill).join(',')
  })}` : null;

  $('#lessonDetail').replaceChildren(
    el('div', { class: 'row between' },
      el('div', {},
        el('h2', { style: 'margin:0' }, topicLine(lesson.topic, lesson.subject) || '—'),
        el('div', { class: 'small muted' }, `${fmtDateTime(lesson.at)} · ${t('rep_stage_n', { n: lesson.stages.length })}`)
      ),
      el('div', { class: 'stats' },
        el('div', { class: 'stat' }, el('b', {}, String(students.length)), el('span', {}, t('rep_tab_students'))),
        el('div', { class: 'stat' }, el('b', {}, `${pctOf(lesson.correct, lesson.answered) ?? 0}%`), el('span', {}, t('analytics_class_average')))
      )
    ),
    el('h3', {}, t('rep_class_weak')),
    weakList(weak, lesson.topic),
    el('div', { class: 'row no-print', style: 'gap:8px' },
      ...(reviewUrl && (wrongIds.length || weak.length) ? [el('a', { class: 'btn primary', href: reviewUrl }, icon('board', { size: 18 }), ' ', t('rep_repeat_board'))] : []),
      ...(topic ? [el('a', { class: 'btn ghost', href: `./homework.html?${new URLSearchParams({ topic: topic.id })}` }, t('act_homework'))] : []),
      excelBtn(() => toExcel('lesson', lesson.id)),
      el('button', {
        class: 'btn ghost', type: 'button',
        onclick: async () => {
          if (!confirm(t('rep_delete_confirm'))) return;
          await deleteLesson(lesson.id);
          toast(t('delete'), { icon: '🗑️' });
          renderLessons();
        }
      }, icon('trash', { size: 18 }), ' ', t('rep_delete_lesson'))
    ),
    el('h3', {}, t('rep_tab_students')),
    el('div', { class: 'rep-table-wrap' }, el('table', { class: 'rep-table' },
      el('thead', {}, el('tr', {},
        el('th', {}, t('rep_student')), el('th', { class: 'num' }, t('rep_result')), el('th', { class: 'num' }, '%'),
        el('th', {}, t('rep_weak')))),
      el('tbody', {}, ...students.map((s) => {
        const w = weakFrom(s.bySkill, 2);
        return el('tr', {},
          el('td', {}, el('a', { href: `#student=${encodeURIComponent(s.name)}`, onclick: (e) => { e.preventDefault(); openStudent(s.name); } }, s.name)),
          el('td', { class: 'num' }, `${s.correct}/${s.answered}`),
          el('td', { class: 'num' }, pctBadge(s.pct)),
          el('td', { class: 'small' }, w.map((x) => skillName(x.topic, x.skill)).join(', ') || '—')
        );
      }))
    ))
  );
  show('lessonScreen');
}

// ─── Ученики ──────────────────────────────────────────────────────────────────

let summaries = [];

async function renderStudents() {
  const current = nextView();
  const list = await studentSummaries();
  const m = await masterySettings();
  if (!current()) return;
  summaries = list;
  $('#mThreshold').value = m.threshold;
  $('#mMinAnswers').value = m.minAnswers;
  show('studentsScreen');
  drawStudentList();
}

async function saveMastery() {
  const m = await saveMasterySettings({ threshold: $('#mThreshold').value, minAnswers: $('#mMinAnswers').value });
  $('#mThreshold').value = m.threshold;
  $('#mMinAnswers').value = m.minAnswers;
  toast(t('rep_mastery_saved'), { icon: '✅' });
}

function drawStudentList() {
  const needle = $('#studentSearch').value.trim().toLowerCase();
  const list = summaries.filter((s) => !needle || s.key.includes(needle));
  if (!summaries.length) {
    $('#studentList').replaceChildren(el('div', { class: 'card center muted' }, t('rep_students_empty')));
    return;
  }
  $('#studentList').replaceChildren(
    el('div', { class: 'small muted' }, t('rep_students_n', { n: list.length })),
    ...list.map((s) => el('button', { class: 'rep-row', type: 'button', onclick: () => openStudent(s.name) },
      el('b', {}, s.name),
      pctBadge(s.pct ?? s.homeworkPct),
      el('span', { class: 'rep-sub small muted' }, [
        s.lessons ? t('rep_lesson_count', { n: s.lessons }) : null,
        s.homework ? t('rep_homework_count', { n: s.homework, p: s.homeworkPct }) : null,
        s.weak.length ? `${t('rep_weak')}: ${s.weak.map((w) => skillName(w.topic, w.skill)).join(', ')}` : null,
        s.lastAt ? `${t('rep_last_seen')}: ${fmtDate(s.lastAt)}` : null
      ].filter(Boolean).join(' · '))
    ))
  );
}

/** Отчёт для родителей: комментарий учителя → страница по ссылке (данные — в самой ссылке) */
function parentReportBox(r) {
  const note = el('textarea', { class: 'input', rows: '3', maxlength: '600', placeholder: t('pr_note_hint'), 'aria-label': t('pr_note') });
  const open = async () => {
    const teacher = (await getProfile()).name || '';
    window.open(reportLink(fromTeacher(r, { note: note.value.trim(), teacher })), '_blank', 'noopener');
  };
  return el('details', { class: 'card plain no-print' },
    el('summary', {}, el('b', {}, t('pr_for_parents'))),
    el('p', { class: 'small muted' }, t('pr_for_parents_hint')),
    note,
    el('div', {}, el('button', { class: 'btn primary', type: 'button', onclick: open }, t('pr_open'))));
}

async function openStudent(name) {
  const key = String(name).replace(/\s+/g, ' ').trim().toLowerCase();
  const current = nextView();
  const r = await studentReport(key);
  const practice = await studentPractice(key);
  if (!current()) return;
  if (!r) return renderStudents();
  const weakTopic = r.weak.find((w) => getTopic(w.topic))?.topic;

  $('#studentDetail').replaceChildren(
    el('div', { class: 'row no-print', style: 'gap:8px' }, excelBtn(() => toExcel('student', key))),
    parentReportBox(r),
    el('div', { class: 'row between' },
      el('h2', { style: 'margin:0' }, r.name),
      el('div', { class: 'stats' },
        el('div', { class: 'stat' }, el('b', {}, String(r.lessons)), el('span', {}, t('rep_lessons_col'))),
        el('div', { class: 'stat' }, el('b', {}, r.pct === null ? '—' : `${r.pct}%`), el('span', {}, t('results_correct'))),
        el('div', { class: 'stat' }, el('b', {}, String(r.homework)), el('span', {}, t('rep_homework_col')))
      )
    ),
    ...(r.topicRows.length ? [
      el('h3', {}, t('rep_topics_status')),
      el('p', { class: 'small muted' }, t('rep_mastery_rule', { th: r.settings.threshold, n: r.settings.minAnswers })),
      el('div', { class: 'rep-table-wrap' }, el('table', { class: 'rep-table' },
        el('thead', {}, el('tr', {},
          el('th', {}, t('rep_topic')), el('th', { class: 'num' }, t('rep_answers_col')), el('th', { class: 'num' }, '%'),
          el('th', { class: 'num' }, t('rep_last_check')), el('th', {}, t('rep_status')))),
        el('tbody', {}, ...r.topicRows.map((row) => el('tr', {},
          el('td', {}, pick(getTopic(row.topic)?.title, getLang()) || row.topic),
          el('td', { class: 'num' }, String(row.answered)),
          el('td', { class: 'num' }, pctBadge(row.pct)),
          el('td', { class: 'num' }, row.checkPct == null ? '—' : pctBadge(row.checkPct)),
          el('td', {}, statusBadge(row.status), row.status === 'insufficient' ? el('div', { class: 'small muted' }, t('rep_need_more', { n: row.need })) : null)
        )))
      ))
    ] : []),
    ...(practice ? [
      el('h3', {}, t('rep_practice')),
      el('p', { class: 'small muted' }, t('rep_practice_hint', { date: fmtDate(practice.at) })),
      el('div', { class: 'rep-table-wrap' }, el('table', { class: 'rep-table' },
        el('thead', {}, el('tr', {},
          el('th', {}, t('rep_topic')), el('th', { class: 'num' }, t('rep_answers_col')), el('th', { class: 'num' }, '%'),
          el('th', { class: 'num' }, t('rep_last_check')), el('th', {}, t('rep_date')))),
        el('tbody', {}, ...practice.rows.map((row) => el('tr', {},
          el('td', {}, pick(getTopic(row.topic)?.title, getLang()) || row.topic),
          el('td', { class: 'num' }, String(row.answered)),
          el('td', { class: 'num' }, row.pct == null ? '—' : pctBadge(row.pct)),
          el('td', { class: 'num' }, row.checkPct == null ? '—' : pctBadge(row.checkPct)),
          el('td', {}, fmtDate(Math.max(row.lastAt, row.checkAt)))
        )))
      ))
    ] : []),
    el('h3', {}, t('rep_weak')),
    weakList(r.weak),
    ...(weakTopic ? [el('div', { class: 'row no-print' },
      el('a', { class: 'btn primary', href: `./homework.html?${new URLSearchParams({ topic: weakTopic })}` }, t('rep_homework_weak')))] : []),
    ...(r.lessonRows.length ? [
      el('h3', {}, t('rep_lessons_col')),
      el('div', { class: 'rep-table-wrap' }, el('table', { class: 'rep-table' },
        el('thead', {}, el('tr', {}, el('th', {}, t('rep_date')), el('th', {}, t('rep_topic')), el('th', { class: 'num' }, t('rep_result')), el('th', { class: 'num' }, '%'))),
        el('tbody', {}, ...r.lessonRows.map((l) => el('tr', {},
          el('td', {}, el('a', { href: '#', onclick: (e) => { e.preventDefault(); openLesson(l.id); } }, fmtDate(l.at))),
          el('td', {}, topicLine(l.topic, l.subject) || '—'),
          el('td', { class: 'num' }, `${l.correct}/${l.answered}`),
          el('td', { class: 'num' }, pctBadge(l.pct))
        )))
      ))
    ] : []),
    ...(r.homeworkRows.length ? [
      el('h3', {}, t('rep_homework_col')),
      el('div', { class: 'rep-table-wrap' }, el('table', { class: 'rep-table' },
        el('thead', {}, el('tr', {}, el('th', {}, t('rep_date')), el('th', {}, t('rep_topic')), el('th', { class: 'num' }, '%'))),
        el('tbody', {}, ...r.homeworkRows.map((h) => el('tr', {},
          el('td', {}, h.lastAt ? fmtDate(h.lastAt) : '—'),
          el('td', {}, [h.title || pick(getTopic(h.topic)?.title, getLang()) || '—', t('rep_attempts', { n: h.attempts }), h.late ? t('rep_late') : null].filter(Boolean).join(' · ')),
          el('td', { class: 'num' }, pctBadge(h.best))
        )))
      ))
    ] : [])
  );
  show('studentScreen');
}

// ─── Учебные циклы по теме ────────────────────────────────────────────────────

const CYCLE_STATUS = {
  reached: ['learned', 'cy_st_reached'],
  not_yet: ['review', 'cy_st_not_yet'],
  no_check: ['insufficient', 'cy_st_no_check']
};
const SKILL_STATE = {
  mastered: ['learned', 'cy_sk_mastered'],
  gap: ['review', 'cy_sk_gap'],
  insufficient: ['insufficient', 'mastery_insufficient']
};
const badge = (map, key) => el('span', { class: `state ${map[key][0]}` }, t(map[key][1]));
const dateInput = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`; };
const fromInput = (v) => { const [y, m, d] = String(v).split('-').map(Number); return y && m && d ? new Date(y, m - 1, d).getTime() : NaN; };
const deltaText = (d) => (d === null || d === undefined ? '—' : `${d > 0 ? '+' : d < 0 ? '−' : '±'}${Math.abs(d)} ${t('cy_pp')}`);
const cyclePeriod = (c) => `${fmtDate(c.from)} — ${fmtDate(c.to)}`;

/** «Боз үй класса»: каждая освоенная классом тема добавляет часть юрты */
async function renderYurts(list) {
  const lang = getLang();
  const reports = await Promise.all(list.map((c) => cycleReport(c)));
  const groups = classYurts(reports.filter(Boolean));
  if (!groups.length) groups.push({ classId: null, className: null, built: [], pending: [], count: 0, fullYurts: 0, inCurrent: 0, next: YURT_PARTS[0] });
  $('#yurtBox').replaceChildren(...groups.map((g) => {
    const title = t('yt_title', { cls: g.className || t('cy_all_students') });
    const figure = el('div', { class: 'yurt-full', html: yurtSvg(g.inCurrent, title) });
    const partRows = YURT_PARTS.map((p, i) => {
      const b = g.built[g.fullYurts * YURT_PARTS.length + i];
      return el('li', {},
        el('span', { class: 'yurt-tick', 'aria-hidden': 'true' }, b ? '✓' : i === g.inCurrent ? '→' : ''),
        el('span', { class: b ? '' : 'todo' }, el('b', {}, pick(p.name, lang)),
          b ? ` — ${pick(getTopic(b.topic)?.title, lang) || ''}` : i === g.inCurrent ? ` — ${t('yt_next')}` : ''));
    });
    return el('section', { class: 'card yurt-card', 'aria-label': title },
      figure,
      el('div', { class: 'stack', style: 'gap:10px' },
        el('h2', { class: 'section-title', style: 'margin:0' }, title),
        el('p', { class: 'small muted', style: 'margin:0' }, t('yt_rule', { share: Math.round(SHARE * 100), min: MIN_CHECKED })),
        el('p', { style: 'margin:0' }, el('b', {}, t('yt_count', { n: g.count })), g.fullYurts ? ` · ${t('yt_full', { n: g.fullYurts })}` : ''),
        el('ul', { class: 'yurt-parts' }, ...partRows),
        g.pending.length ? el('p', { class: 'small muted', style: 'margin:0' }, t('yt_pending', {
          list: g.pending.map((x) => `${pick(getTopic(x.topic)?.title, lang)} (${x.reached}/${x.base})`).join(', ')
        })) : null,
        el('div', { class: 'row no-print', style: 'gap:8px' },
          el('button', { class: 'btn ghost', type: 'button', onclick: () => figure.requestFullscreen?.().catch(() => {}) }, icon('board', { size: 18 }), ' ', t('yt_show_board'))))
    );
  }));
}

async function renderCycles() {
  const current = nextView();
  show('cyclesScreen');
  const list = (await allCycles()).sort((a, b) => b.from - a.from);
  if (!current()) return;
  await renderYurts(list);
  if (!current()) return;
  if (!list.length) {
    $('#cycleList').replaceChildren(el('div', { class: 'card center muted' }, t('cy_empty')));
    return;
  }
  const classes = new Map((await store.get(KEYS.classes, [])).map((c) => [c.id, c.name]));
  if (!current()) return;
  const now = Date.now();
  $('#cycleList').replaceChildren(...list.map((c) => {
    const state = now < c.from ? t('cy_planned') : now > c.to ? t('cy_finished') : t('cy_running');
    return el('button', { class: 'rep-row', type: 'button', onclick: () => openCycle(c.id) },
      el('b', {}, c.title || topicLine(c.topic, c.subject) || '—'),
      el('span', { class: 'small' }, state),
      el('span', { class: 'rep-sub small muted' }, [
        c.title ? topicLine(c.topic, c.subject) : null,
        classes.get(c.classId) || null,
        cyclePeriod(c)
      ].filter(Boolean).join(' · '))
    );
  }));
}

function fillSelect(sel, items, value) {
  sel.replaceChildren(...items.map((it) => el('option', { value: it.value }, it.label)));
  if (value !== undefined && value !== null && items.some((it) => String(it.value) === String(value))) sel.value = String(value);
}

function syncCycleTopics(topicId = null) {
  const lang = getLang();
  const topics = TOPICS.filter((x) => x.subject === $('#cySubject').value).sort((a, b) => a.grade - b.grade);
  fillSelect($('#cyTopic'), topics.map((x) => ({ value: x.id, label: `${pick(x.title, lang)} (${t('grade', { n: x.grade })})` })), topicId || topics[0]?.id);
}

let editingCycle = null;

async function openCycleForm(cycle = null) {
  const current = nextView();
  const lang = getLang();
  editingCycle = cycle;
  const withTopics = new Set(TOPICS.map((x) => x.subject));
  fillSelect($('#cySubject'), SUBJECTS.filter((x) => withTopics.has(x.id)).map((x) => ({ value: x.id, label: pick(x.title, lang) })),
    cycle?.subject || getTopic(cycle?.topic)?.subject);
  syncCycleTopics(cycle?.topic);
  const classes = await store.get(KEYS.classes, []);
  fillSelect($('#cyClass'), [{ value: '', label: t('cy_all_students') }, ...classes.map((c) => ({ value: c.id, label: c.name }))], cycle?.classId || '');
  $('#cyThreshold').value = cycle?.threshold ?? (await masterySettings()).threshold;
  $('#cyFrom').value = dateInput(cycle?.from ?? Date.now());
  $('#cyTo').value = dateInput(cycle?.to ?? Date.now() + 30 * 86400000);
  $('#cyGoal').value = cycle?.goal || '';
  $('#cyFormError').textContent = '';
  $('#cycleFormTitle').textContent = cycle ? t('cy_edit') : t('cy_new');
  if (!current()) return;
  show('cycleFormScreen');
  $('#cySubject').focus();
}

async function submitCycle(e) {
  e.preventDefault();
  const btn = $('#cySaveBtn');
  $('#cyFormError').textContent = '';
  btn.disabled = true;
  try {
    const saved = await saveCycle({
      id: editingCycle?.id,
      subject: $('#cySubject').value,
      topic: $('#cyTopic').value,
      classId: $('#cyClass').value || null,
      threshold: $('#cyThreshold').value,
      from: fromInput($('#cyFrom').value),
      to: fromInput($('#cyTo').value),
      goal: $('#cyGoal').value
    });
    toast(t('cy_saved'), { icon: '✅' });
    await openCycle(saved.id);
  } catch (err) {
    const key = { topic: 'cy_err_topic', dates: 'cy_err_dates', storage: 'cy_err_storage' }[err?.message] || 'cy_err_storage';
    $('#cyFormError').textContent = t(key);
  } finally {
    btn.disabled = false;
  }
}

async function openCycle(id) {
  const current = nextView();
  const cycle = await getCycle(id);
  if (!current()) return;
  if (!cycle) return renderCycles();
  const r = await cycleReport(cycle);
  if (!current()) return;
  const lang = getLang();
  const topic = getTopic(cycle.topic);
  const sum = r.summary;
  const skill = (s) => skillName(cycle.topic, s);

  // Предупреждения — честно о том, чего данные не позволяют сказать
  const warnings = [
    sum.checked === 0 ? t('cy_w_no_checks') : null,
    sum.noCheck && sum.checked ? t('cy_w_no_check_n', { n: sum.noCheck }) : null,
    sum.oneCheck ? t('cy_w_one_check', { n: sum.oneCheck }) : null,
    sum.shortChecks ? t('cy_w_short', { n: sum.shortChecks, min: r.checkMin }) : null,
    !cycle.classId ? t('cy_w_no_class') : null
  ].filter(Boolean);

  // Рекомендации на следующее занятие
  const hwBase = topic ? { topic: topic.id, ...(cycle.classId ? { class: cycle.classId } : {}) } : null;
  const reviewUrl = topic && r.gaps.length ? `./board.html?${new URLSearchParams({
    subject: topic.subject, topic: topic.id, mode: 'review',
    questions: r.frequentWrong.map((w) => w.id).slice(0, 12).join(','), skills: r.gaps.join(',')
  })}` : null;
  const actions = [];
  if (hwBase && sum.checked === 0) actions.push(el('a', { class: 'btn primary', href: `./homework.html?${new URLSearchParams({ ...hwBase, check: '1' })}` }, t('cy_act_diagnostic')));
  if (reviewUrl) actions.push(el('a', { class: 'btn primary', href: reviewUrl }, icon('board', { size: 18 }), ' ', t('cy_act_review')));
  if (hwBase && r.gaps.length) actions.push(el('a', { class: 'btn ghost', href: `./homework.html?${new URLSearchParams(hwBase)}` }, t('cy_act_practice')));
  if (hwBase && sum.checked > 0) actions.push(el('a', { class: 'btn ghost', href: `./homework.html?${new URLSearchParams({ ...hwBase, check: '1' })}` }, t('cy_act_final')));
  actions.push(el('a', { class: 'btn ghost', href: './tests.html' }, t('cy_act_paper')));

  const recommendations = [
    sum.checked === 0 ? t('cy_r_start') : null,
    r.gaps.length ? t('cy_r_gaps', { list: r.gaps.map(skill).join(', ') }) : null,
    sum.checked && !r.gaps.length && sum.reached === sum.students ? t('cy_r_done') : null,
    sum.noCheck && sum.checked ? t('cy_r_missing') : null
  ].filter(Boolean);

  const wrongRows = await Promise.all(r.frequentWrong.slice(0, 5).map(async (w) => {
    const q = await findQuestion(cycle.topic, w.id).catch(() => null);
    return { ...w, text: q ? pick(q.prompt, lang) : null };
  }));
  if (!current()) return;

  const stat = (value, label) => el('div', { class: 'stat' }, el('b', {}, value), el('span', {}, label));
  const pctOrDash = (p) => (p === null || p === undefined ? '—' : `${p}%`);

  $('#cycleDetail').replaceChildren(
    el('div', { class: 'row between' },
      el('div', {},
        el('h2', { style: 'margin:0' }, topicLine(cycle.topic, cycle.subject) || '—'),
        el('div', { class: 'small muted' }, [r.className, cyclePeriod(cycle), t('cy_threshold_is', { n: cycle.threshold })].filter(Boolean).join(' · '))),
      el('div', { class: 'row no-print', style: 'gap:8px' },
        el('button', { class: 'btn ghost', type: 'button', onclick: () => openCycleForm(cycle) }, t('cy_edit')),
        el('button', {
          class: 'btn ghost', type: 'button',
          onclick: async () => {
            if (!confirm(t('cy_delete_confirm'))) return;
            await deleteCycle(cycle.id);
            toast(t('cy_deleted'), { icon: '🗑️' });
            renderCycles();
          }
        }, icon('trash', { size: 18 }), ' ', t('delete')))
    ),
    ...(cycle.goal ? [el('p', { class: 'cy-goal' }, el('b', {}, `${t('cy_goal')}: `), cycle.goal)] : []),
    el('div', { class: 'stats' },
      stat(`${sum.checked}/${sum.students}`, t('cy_s_checked')),
      stat(pctOrDash(sum.firstAvg), t('cy_s_first')),
      stat(pctOrDash(sum.lastAvg), t('cy_s_last')),
      stat(deltaText(sum.deltaAvg), t('cy_s_delta')),
      stat(`${sum.reached}/${sum.students}`, t('cy_s_reached', { n: cycle.threshold })),
      stat(sum.lastCheckAt ? fmtDate(sum.lastCheckAt) : '—', t('cy_s_last_at'))),
    el('p', { class: 'small muted' }, sum.paired ? t('cy_avg_note', { n: sum.paired }) : t('cy_no_delta')),
    ...(warnings.length ? [el('div', { class: 'cy-warn', role: 'status' }, el('b', {}, t('cy_warnings')), el('ul', {}, ...warnings.map((w) => el('li', {}, w))))] : []),
    el('h3', {}, t('cy_next')),
    el('ul', { class: 'cy-list' }, ...(recommendations.length ? recommendations : [t('cy_r_none')]).map((x) => el('li', {}, x))),
    el('div', { class: 'row no-print', style: 'gap:8px;flex-wrap:wrap' }, ...actions),
    ...(r.skills.length ? [
      el('h3', {}, t('cy_skills')),
      el('div', { class: 'rep-table-wrap' }, el('table', { class: 'rep-table' },
        el('thead', {}, el('tr', {},
          el('th', {}, t('cy_skill')), el('th', { class: 'num' }, t('cy_first')), el('th', { class: 'num' }, t('cy_last')),
          el('th', { class: 'num' }, t('cy_below')), el('th', {}, t('rep_status')))),
        el('tbody', {}, ...r.skills.map((s) => el('tr', {},
          el('td', {}, skill(s.skill)),
          el('td', { class: 'num' }, pctBadge(s.firstPct)),
          el('td', { class: 'num' }, pctBadge(s.lastPct)),
          el('td', { class: 'num' }, String(s.below)),
          el('td', {}, badge(SKILL_STATE, s.state))
        )))))
    ] : []),
    ...(wrongRows.length ? [
      el('h3', {}, t('cy_wrong')),
      el('ol', { class: 'cy-list' }, ...wrongRows.map((w) => el('li', {}, w.text || w.id, el('span', { class: 'small muted' }, ` · ${t('cy_wrong_n', { n: w.n })}`))))
    ] : []),
    el('h3', {}, t('rep_tab_students')),
    r.rows.length ? el('div', { class: 'rep-table-wrap' }, el('table', { class: 'rep-table' },
      el('thead', {}, el('tr', {},
        el('th', {}, t('rep_student')), el('th', { class: 'num' }, t('cy_first')), el('th', { class: 'num' }, t('cy_last')),
        el('th', { class: 'num' }, t('cy_change')), el('th', { class: 'num' }, t('cy_checks')), el('th', { class: 'num' }, t('cy_practice')),
        el('th', {}, t('cy_gaps')), el('th', {}, t('rep_status')))),
      el('tbody', {}, ...r.rows.map((row) => {
        const gaps = Object.entries(row.skills).filter(([, v]) => v.state === 'gap').map(([k]) => skill(k));
        return el('tr', {},
          el('td', {}, el('a', { href: '#', onclick: (e) => { e.preventDefault(); openStudent(row.name); } }, row.name)),
          el('td', { class: 'num' }, row.first ? pctBadge(row.first.pct) : '—', row.first ? el('div', { class: 'small muted' }, fmtDate(row.first.at)) : null),
          el('td', { class: 'num' }, row.checks > 1 ? pctBadge(row.last.pct) : '—', row.checks > 1 ? el('div', { class: 'small muted' }, fmtDate(row.last.at)) : null),
          el('td', { class: 'num' }, deltaText(row.delta)),
          el('td', { class: 'num' }, String(row.checks)),
          el('td', { class: 'num' }, row.attempts ? t('cy_practice_val', { a: row.practice, n: row.attempts }) : '0'),
          el('td', { class: 'small' }, gaps.join(', ') || '—'),
          el('td', {}, badge(CYCLE_STATUS, row.status))
        );
      }))
    )) : el('p', { class: 'muted' }, t('cy_no_students')),
    el('p', { class: 'small muted' }, t('cy_method', { min: r.checkMin, skill: r.skillMin }))
  );
  show('cycleScreen');
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  await setRole('teacher');
  mountHeader($('#header'), { role: 'teacher', active: 'reports.html' });

  $('#tabLessons').addEventListener('click', renderLessons);
  $('#tabStudents').addEventListener('click', renderStudents);
  $('#tabCycles').addEventListener('click', renderCycles);
  $('#cycleNewBtn').addEventListener('click', () => openCycleForm(null));
  $('#cycleFormBackBtn').addEventListener('click', renderCycles);
  $('#cycleBackBtn').addEventListener('click', renderCycles);
  $('#cySubject').addEventListener('change', () => syncCycleTopics());
  $('#cycleForm').addEventListener('submit', submitCycle);
  $('#lessonBackBtn').addEventListener('click', renderLessons);
  $('#studentBackBtn').addEventListener('click', renderStudents);
  $('#studentSearch').addEventListener('input', drawStudentList);
  $('#mSaveBtn').addEventListener('click', saveMastery);
  $('#exportStudentsBtn').replaceChildren(icon('download', { size: 18 }), ' ', t('xl_export_all'));
  $('#exportStudentsBtn').addEventListener('click', () => toExcel('students'));
  $('#printBtn').addEventListener('click', () => window.print());
  // Вкладки оживают, когда обработчики на месте (раньше нажатие на медленном телефоне терялось)
  ['#tabLessons', '#tabStudents', '#tabCycles'].forEach((s) => { $(s).disabled = false; });
  // Результаты учеников пришли из облака — обновить открытый список
  window.addEventListener('ba:synced', () => {
    if (!$('#lessonsScreen').classList.contains('hidden')) renderLessons();
    if (!$('#studentsScreen').classList.contains('hidden')) renderStudents();
    if (!$('#cyclesScreen').classList.contains('hidden')) renderCycles();
  });

  const params = new URLSearchParams(location.search);
  if (params.get('view') === 'students') await renderStudents();
  else if (params.get('view') === 'cycles') await renderCycles();
  else await renderLessons();
})();
