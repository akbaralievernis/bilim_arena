/**
 * Bilim Arena — отчёты учителя: история уроков и отчёт по каждому ученику.
 * Данные: журнал уроков с доски (core/lessons.js) и домашние задания.
 */

import { bootstrap, mountHeader, el, $, toast } from './core/ui.js';
import { icon } from './core/icons.js';
import { t, pick, getLang } from './core/i18n.js';
import { getTopic, getSubject, skillTitle } from './core/curriculum.js';
import { setRole } from './core/profile.js';
import { lessonHistory, getLesson, deleteLesson, studentSummaries, studentReport, weakFrom } from './core/lessons.js';

const screens = ['lessonsScreen', 'lessonScreen', 'studentsScreen', 'studentScreen'];
const show = (id) => {
  screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));
  const students = id.startsWith('student');
  $('#tabLessons').classList.toggle('on', !students);
  $('#tabStudents').classList.toggle('on', students);
  $('#tabLessons').setAttribute('aria-selected', String(!students));
  $('#tabStudents').setAttribute('aria-selected', String(students));
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

async function renderLessons() {
  const lessons = await lessonHistory();
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
        `${fmtDateTime(l.at)} · ${t('rep_students_n', { n: students })} · ${t('rep_answers', { c: l.correct, n: l.answered })} · ${t('rep_stage_n', { n: l.stages.length })}`)
    );
  }));
}

async function openLesson(id) {
  const lesson = await getLesson(id);
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
  summaries = await studentSummaries();
  show('studentsScreen');
  drawStudentList();
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

async function openStudent(name) {
  const key = String(name).replace(/\s+/g, ' ').trim().toLowerCase();
  const r = await studentReport(key);
  if (!r) return renderStudents();
  const weakTopic = r.weak.find((w) => getTopic(w.topic))?.topic;

  $('#studentDetail').replaceChildren(
    el('div', { class: 'row between' },
      el('h2', { style: 'margin:0' }, r.name),
      el('div', { class: 'stats' },
        el('div', { class: 'stat' }, el('b', {}, String(r.lessons)), el('span', {}, t('rep_lessons_col'))),
        el('div', { class: 'stat' }, el('b', {}, r.pct === null ? '—' : `${r.pct}%`), el('span', {}, t('results_correct'))),
        el('div', { class: 'stat' }, el('b', {}, String(r.homework)), el('span', {}, t('rep_homework_col')))
      )
    ),
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

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  await setRole('teacher');
  mountHeader($('#header'), { role: 'teacher', active: 'reports.html' });

  $('#tabLessons').addEventListener('click', renderLessons);
  $('#tabStudents').addEventListener('click', renderStudents);
  $('#lessonBackBtn').addEventListener('click', renderLessons);
  $('#studentBackBtn').addEventListener('click', renderStudents);
  $('#studentSearch').addEventListener('input', drawStudentList);
  $('#printBtn').addEventListener('click', () => window.print());
  // Результаты учеников пришли из облака — обновить открытый список
  window.addEventListener('ba:synced', () => {
    if (!$('#lessonsScreen').classList.contains('hidden')) renderLessons();
    if (!$('#studentsScreen').classList.contains('hidden')) renderStudents();
  });

  const params = new URLSearchParams(location.search);
  if (params.get('view') === 'students') await renderStudents();
  else await renderLessons();
})();
