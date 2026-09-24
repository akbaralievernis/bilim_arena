/**
 * Bilim Arena — домашние задания ученика.
 *
 * Задание выполняется тем же движком (core/engine.js), что и урок на доске,
 * поэтому ошибки автоматически попадают в аналитику по навыкам
 * (core/progress.js → recordAnswer), а не в отдельную систему.
 */

import { bootstrap, mountHeader, el, $, toast, sfx, confetti } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { getTopic, getSubject, getQuestions, skillTitle } from './core/curriculum.js';
import { BaseGame } from './core/engine.js';
import { renderQuestion } from './core/quiz-ui.js';
import { getProfile } from './core/profile.js';
import { studentAssignments, saveSubmission, STATUS } from './core/assignments.js';

/** Домашнее задание — одиночная игра, прогресс пишется в профиль ученика */
class HomeworkGame extends BaseGame {
  static meta = {
    id: 'homework',
    icon: '📝',
    title: { ky: 'Үй тапшырма', ru: 'Домашнее задание', en: 'Homework' },
    goal: { ky: '', ru: '', en: '' },
    how: {
      ky: 'Суроолорго жооп бериңиз. Ар бир жооптон кийин түшүндүрмө чыгат. Жыйынтык мугалимге көрүнөт.',
      ru: 'Отвечайте на вопросы. После каждого ответа появится объяснение. Результат увидит учитель.',
      en: 'Answer the questions. An explanation follows each answer. Your teacher will see the result.'
    },
    teamBased: false,
    needsPhones: false,
    minPlayers: 1
  };
}

const state = { list: [], current: null, game: null, me: 'me', profile: null };
const screens = ['listScreen', 'introScreen', 'playScreen', 'resultScreen'];
const show = (id) => screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));

const stat = (v, l) => el('div', { class: 'stat' }, el('b', {}, String(v)), el('span', {}, l));
const fmtDate = (ts) => new Date(ts).toLocaleDateString();

// ─── Список заданий ───────────────────────────────────────────────────────────

async function renderList() {
  const lang = getLang();
  state.profile = await getProfile();
  state.list = await studentAssignments({
    studentId: state.profile.id || 'me',
    classId: state.profile.classId,
    grade: state.profile.grade
  });

  const active = state.list.filter((x) => x.status !== STATUS.DONE).length;
  $('#countChip').textContent = `${active} / ${state.list.length}`;

  const cards = state.list.map(({ assignment: a, submission, status, attemptsLeft, percent }) => {
    const topic = getTopic(a.topic);
    const subject = getSubject(a.subject);
    const done = status === STATUS.DONE;
    const canStart = attemptsLeft > 0;

    return el('div', { class: 'card hw-card' },
      el('div', { class: 'row between' },
        el('b', {}, a.title || (topic ? pick(topic.title, lang) : '')),
        el('span', { class: `hw-status ${status}` }, t(`hw_status_${status}`))
      ),
      el('div', { class: 'hw-meta' },
        el('span', {}, `${subject?.icon || '📘'} ${pick(subject?.title, lang)}`),
        topic ? el('span', {}, `📚 ${pick(topic.title, lang)}`) : null,
        el('span', {}, `👩‍🏫 ${a.teacherName || t('role_teacher')}`),
        el('span', {}, `📅 ${t('hw_due_at')}: ${fmtDate(a.dueAt)}`),
        el('span', {}, `❓ ${t('questions_n', { n: a.count })}`),
        el('span', {}, `✨ ${a.xp} XP`)
      ),
      el('div', { class: `bar ${percent >= 70 ? 'ok' : ''}` }, el('i', { style: `width:${percent}%` })),
      el('div', { class: 'row between small muted' },
        el('span', {}, submission?.attempts
          ? `${t('results_correct')}: ${submission.correct}/${submission.total} · ${percent}%`
          : t('hw_status_new')),
        el('span', {}, canStart ? t('hw_attempts_left', { n: attemptsLeft }) : t('hw_no_attempts'))
      ),
      el('button', {
        class: `btn ${done ? '' : 'primary'} block`, type: 'button',
        disabled: !canStart,
        onclick: () => openIntro(a.id)
      }, done ? `🔁 ${t('retry')}` : `▶️ ${t('hw_start')}`)
    );
  });

  $('#taskList').replaceChildren(...(cards.length
    ? cards
    : [el('div', { class: 'card center muted' }, t('hw_no_assignments'))]));
  show('listScreen');
}

// ─── Перед началом ────────────────────────────────────────────────────────────

function openIntro(assignmentId) {
  const entry = state.list.find((x) => x.assignment.id === assignmentId);
  if (!entry) return;
  state.current = entry;

  const lang = getLang();
  const a = entry.assignment;
  const topic = getTopic(a.topic);
  const subject = getSubject(a.subject);

  $('#introTitle').textContent = a.title || pick(topic?.title, lang);
  $('#introMeta').textContent = `${subject?.icon || ''} ${pick(subject?.title, lang)} · ${t('grade', { n: a.grade })} · ${pick(topic?.title, lang)}`;
  $('#introHow').textContent = pick(HomeworkGame.meta.how, lang);

  $('#introDetails').replaceChildren(
    el('span', {}, `❓ ${t('questions_n', { n: a.count })}`),
    el('span', {}, `📅 ${t('hw_due_at')}: ${fmtDate(a.dueAt)}`),
    el('span', {}, `🔁 ${t('hw_attempts_left', { n: entry.attemptsLeft })}`),
    el('span', {}, `✨ ${a.xp} XP`),
    a.skill ? el('span', {}, `🎯 ${skillTitle(a.topic, a.skill, lang)}`) : null
  );

  show('introScreen');
}

// ─── Выполнение ───────────────────────────────────────────────────────────────

async function startAssignment(onlyWrong = false) {
  const a = state.current.assignment;
  const lang = getLang();

  let questions;
  if (onlyWrong && state.game) {
    const ids = state.game.wrongQuestionIds();
    questions = await getQuestions({ topic: a.topic, ids });
  } else if (a.questionIds?.length) {
    questions = await getQuestions({ topic: a.topic, ids: a.questionIds });
  } else {
    questions = await getQuestions({
      topic: a.topic,
      count: a.count,
      skills: a.skill ? [a.skill] : null,
      difficulty: a.difficulty
    });
  }

  if (!questions.length) return toast(t('empty_none'), { icon: '⚠️' });

  state.game?.destroy();
  state.game = new HomeworkGame({
    questions, topic: a.topic, lang, perQuestionSec: 45, solo: true,
    onUpdate: (game, kind) => renderGame(game, kind)
  });
  state.game.addPlayer({ id: state.me, name: state.profile.name || 'me' });

  show('playScreen');
  await state.game.start();
}

function renderGame(game, kind) {
  $('#timer').textContent = String(Math.max(0, game.timeLeft));
  $('#timer').classList.toggle('low', game.timeLeft <= 5 && game.state === 'running');
  if (kind === 'tick') return;
  if (game.state === 'finished') return showResults(game);

  const reveal = game.state === 'reveal';
  const answered = game.answers.get(state.me);

  $('#counter').textContent = `${game.current?.number || 0} / ${game.questionCount}`;
  $('#progressBar').style.width = `${(game.index / game.questionCount) * 100}%`;
  $('#prompt').textContent = game.current?.prompt || '';

  renderQuestion($('#answerArea'), game.current, {
    reveal,
    given: answered?.value ?? null,
    correct: answered?.correct ?? null,
    onAnswer: (value) => {
      game.handleAnswer(state.me, value);
      game.revealAnswer();
    }
  });

  const explain = $('#explain');
  explain.classList.toggle('hidden', !reveal);
  if (reveal) {
    explain.replaceChildren(
      el('b', {}, answered?.correct
        ? `✅ ${t('game_correct')} `
        : `❌ ${t('game_correct_answer')}: ${game.correctText()} `),
      el('span', {}, game.current.explain || '')
    );
    if (answered?.correct) sfx.ok(); else sfx.bad();
    clearTimeout(game._next);
    game._next = setTimeout(() => game.nextQuestion(), 3000);
  }
}

// ─── Результат ────────────────────────────────────────────────────────────────

async function showResults(game) {
  const r = game.results;
  if (!r) return;
  show('resultScreen');

  const a = state.current.assignment;
  const lang = getLang();
  const good = r.accuracy >= 70;

  $('#resultIcon').textContent = good ? '🎉' : '💪';
  if (good) { sfx.win(); confetti(); }

  // XP задания начисляется только при результате от 50%
  const earned = r.accuracy >= 50 ? Math.round(a.xp * (r.accuracy / 100)) : 0;
  $('#resultXP').textContent = `+${earned} XP`;

  $('#resultStats').replaceChildren(
    stat(r.correctAnswers, t('results_correct')),
    stat(r.totalAnswers - r.correctAnswers, t('results_wrong')),
    stat(`${r.accuracy}%`, t('accuracy')),
    stat(earned, 'XP')
  );

  // Разбор по навыкам
  const rows = Object.entries(r.bySkill).map(([skill, s]) => {
    const pct = Math.round((s.ok / s.total) * 100);
    const weak = pct < 70;
    return el('div', { style: 'margin-bottom:12px' },
      el('div', { class: 'row between' },
        el('b', {}, skillTitle(a.topic, skill, lang)),
        el('span', { class: `state ${weak ? 'review' : 'learned'}` }, `${weak ? '⚠️' : '✅'} ${s.ok}/${s.total}`)
      ),
      el('div', { class: `bar ${weak ? '' : 'ok'}`, style: 'margin-top:6px' }, el('i', { style: `width:${pct}%` }))
    );
  });
  $('#skillBreakdown').replaceChildren(...(rows.length ? rows : [el('p', { class: 'muted' }, t('results_nothing_wrong'))]));

  // Разбор ошибок: обязательно с объяснением, а не просто «неверно»
  $('#mistakeList').replaceChildren(...(r.mistakes.length
    ? [
      el('div', { class: 'label', style: 'margin-top:10px' }, t('results_review')),
      ...r.mistakes.map((m) => el('div', { class: 'card plain', style: 'margin-bottom:8px' },
        el('b', {}, m.prompt),
        el('p', { class: 'small muted', style: 'margin:4px 0 0' }, `💡 ${m.explain || ''}`)
      ))
    ]
    : []));

  $('#repeatBtn').disabled = r.mistakes.length === 0;

  // Сохраняем попытку для учителя (ошибки по навыкам уже в аналитике)
  await saveSubmission({
    assignmentId: a.id,
    studentId: state.profile.id || 'me',
    studentName: state.profile.name || '—',
    correct: r.correctAnswers,
    total: r.totalAnswers,
    skillStats: r.bySkill,
    mistakes: r.mistakes.map((m) => ({ questionId: m.questionId, skill: m.skill }))
  });
  toast(t('hw_result_saved'), { icon: '✅' });
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'tasks.html' });

  await renderList();

  const params = new URLSearchParams(location.search);
  if (params.get('id')) openIntro(params.get('id'));

  $('#startBtn').addEventListener('click', () => startAssignment(false));
  $('#repeatBtn').addEventListener('click', () => startAssignment(true));
  $('#backBtn').addEventListener('click', renderList);
  $('#toListBtn').addEventListener('click', renderList);

  document.addEventListener('keydown', (e) => {
    if ($('#playScreen').classList.contains('hidden')) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 6) {
      const btn = $('#answerArea').querySelector(`.option:nth-child(${n})`);
      if (btn && !btn.disabled) btn.click();
    }
  });
})();
