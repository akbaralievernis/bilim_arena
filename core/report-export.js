/**
 * Bilim Arena — отчёты учителя в Excel (core/xlsx.js).
 *
 * Три выгрузки: все ученики (сводка + темы), один урок, один ученик.
 * Колонка «Оценка (подсказка)» — 5-балльная шкала от процента; это подсказка
 * для журнала, а не выставленная оценка. Шкала описана на отдельном листе.
 */

import { t, pick, getLang } from './i18n.js';
import { getTopic, getSubject, skillTitle } from './curriculum.js';
import { studentSummaries, studentReport, getLesson, weakFrom } from './lessons.js';
import { masterySettings } from './mastery.js';
import { downloadXlsx } from './xlsx.js';

/** 5-балльная подсказка: 85 % и выше — 5, 70 % — 4, 50 % — 3, ниже — 2 */
export const GRADE_SCALE = [[85, 5], [70, 4], [50, 3], [0, 2]];
// Повреждённое значение (NaN, Infinity) — без подсказки, а не ошибка всего отчёта (аудит 21.10)
export const suggestGrade = (pct) => (pct == null || !Number.isFinite(Number(pct)) ? null : GRADE_SCALE.find(([min]) => Math.max(0, Number(pct)) >= min)[1]);

const pct = (ok, total) => (total ? Math.round((ok / total) * 100) : null);
const two = (n) => String(n).padStart(2, '0');
const dateText = (ms) => { if (!ms) return ''; const d = new Date(ms); return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}`; };
// В таблицу — настоящая дата (сортируется и фильтруется в Excel), core/xlsx.js
const date = (ms) => (ms && Number.isFinite(Number(ms)) ? { date: Number(ms) } : '');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`; };
const topicTitle = (id) => pick(getTopic(id)?.title, getLang()) || id || '';
const subjectTitle = (topicId, subjectId) => pick(getSubject(getTopic(topicId)?.subject || subjectId)?.title, getLang()) || '';
const statusText = (s) => t({ mastered: 'mastery_learned', ready: 'mastery_ready', learning: 'mastery_review', insufficient: 'mastery_insufficient', new: 'mastery_new' }[s] || 'mastery_new');

/** Лист со шкалой и правилом «изучено» — чтобы цифры в файле были понятны без сайта */
async function scaleSheet() {
  const m = await masterySettings();
  return {
    name: t('xl_sheet_scale'),
    rows: [
      [t('xl_scale_from'), t('xl_grade')],
      ...GRADE_SCALE.map(([min, g]) => [`${min}%`, g]),
      [],
      [t('xl_scale_note')],
      [t('rep_mastery_rule', { th: m.threshold, n: m.minAnswers })]
    ]
  };
}

const studentTopicRows = (name, r) => r.topicRows.map((row) => {
  const basis = row.checkPct ?? row.pct;
  const noData = row.status === 'new' || row.status === 'insufficient';
  return [name, subjectTitle(row.topic), topicTitle(row.topic), row.answered, row.pct, row.checkPct, statusText(row.status), noData ? null : suggestGrade(basis)];
});

const TOPIC_HEAD = () => [t('xl_student'), t('lesson_subject'), t('rep_topic'), t('rep_answers_col'), '%', t('rep_last_check'), t('rep_status'), t('xl_grade_hint')];

/** Все ученики: сводка и состояние по темам */
export async function exportStudents() {
  const list = await studentSummaries();
  const { minAnswers } = await masterySettings();
  const summary = [[t('xl_student'), t('rep_lessons_col'), t('rep_answers_col'), t('results_correct'), '%', t('rep_homework_col'), t('xl_homework_pct'), t('rep_weak'), t('rep_last_seen'), t('xl_grade_hint')]];
  const topics = [TOPIC_HEAD()];
  for (const s of list) {
    // Подсказка оценки — только когда данных достаточно (как на листе тем), а не после одного ответа
    const enough = (Number(s.answered) || 0) >= minAnswers || (Number(s.homework) || 0) > 0;
    const p = enough ? (s.pct ?? s.homeworkPct) : null;
    summary.push([s.name, s.lessons, s.answered, s.correct, s.pct, s.homework, s.homeworkPct,
      s.weak.map((w) => skillTitle(w.topic, w.skill, getLang()) || w.skill).join(', '), date(s.lastAt), suggestGrade(p)]);
    const r = await studentReport(s.key);
    if (r) topics.push(...studentTopicRows(s.name, r));
  }
  downloadXlsx(`Bilim Arena — ${t('xl_file_students')} ${today()}.xlsx`, [
    { name: t('xl_sheet_students'), rows: summary },
    { name: t('xl_sheet_topics'), rows: topics },
    await scaleSheet()
  ]);
  return list.length;
}

/** Один урок: ученики и слабые навыки класса */
export async function exportLesson(id) {
  const lesson = await getLesson(id);
  if (!lesson) return 0;
  const students = Object.values(lesson.students || {}).sort((a, b) => a.name.localeCompare(b.name));
  const rows = [[t('xl_student'), t('rep_answers_col'), t('results_correct'), '%', t('xl_score'), t('xl_mistakes'), t('xl_grade_hint')]];
  students.forEach((s) => {
    const p = pct(s.correct, s.answered);
    rows.push([s.name, s.answered, s.correct, p, s.score || 0, (s.wrong || []).length, suggestGrade(p)]);
  });
  const weak = [[t('rep_topic'), t('hw_skill'), t('results_correct'), t('rep_answers_col'), '%']];
  weakFrom(lesson.bySkill, 50).forEach((w) => weak.push([topicTitle(w.topic), skillTitle(w.topic, w.skill, getLang()) || w.skill, w.ok, w.total, pct(w.ok, w.total)]));
  const title = `${topicTitle(lesson.topic)} ${dateText(lesson.at)}`.trim();
  downloadXlsx(`Bilim Arena — ${title}.xlsx`, [
    { name: t('xl_sheet_lesson'), rows },
    { name: t('rep_class_weak'), rows: weak },
    await scaleSheet()
  ]);
  return students.length;
}

/** Один ученик: темы, уроки, домашние задания */
export async function exportStudent(key) {
  const r = await studentReport(key);
  if (!r) return 0;
  const lessons = [[t('rep_date'), t('lesson_subject'), t('rep_topic'), t('rep_answers_col'), t('results_correct'), '%']];
  r.lessonRows.forEach((l) => lessons.push([date(l.at), subjectTitle(l.topic, l.subject), topicTitle(l.topic), l.answered, l.correct, l.pct]));
  const homework = [[t('rep_date'), t('xl_task'), t('rep_topic'), t('xl_attempts'), t('xl_best_pct'), t('xl_late')]];
  r.homeworkRows.forEach((h) => homework.push([date(h.lastAt), h.title || '', topicTitle(h.topic), h.attempts, h.best, h.late ? t('xl_yes') : '']));
  downloadXlsx(`Bilim Arena — ${r.name} ${today()}.xlsx`, [
    { name: t('xl_sheet_topics'), rows: [TOPIC_HEAD(), ...studentTopicRows(r.name, r)] },
    { name: t('rep_lessons_col'), rows: lessons },
    { name: t('rep_homework_col'), rows: homework },
    await scaleSheet()
  ]);
  return 1;
}

