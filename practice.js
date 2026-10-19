/**
 * Bilim Arena — самостоятельная практика ученика.
 *
 * Тот же игровой движок, что и на доске, но в режиме «соло»:
 * прогресс, ошибки и XP сохраняются в профиле ученика.
 * Перед игрой всегда показывается цель и правила, после — разбор ошибок.
 * Путь по теме: диагностика → разбор слабых навыков → тренировка (объяснение
 * после каждого ответа, повтор ошибок) → итоговая проверка (только невиданные
 * вопросы, разбор в конце). «Изучено» — только по итоговой проверке.
 */

import { bootstrap, mountHeader, el, $, sfx, confetti, toast } from './core/ui.js';
import { icon } from './core/icons.js';
import { t, pick, getLang } from './core/i18n.js';
import { SUBJECTS, TOPICS, topicsOf, getTopic, getSubject, getQuestions, skillTitle } from './core/curriculum.js';
import { BaseGame } from './core/engine.js';
import { renderQuestion } from './core/quiz-ui.js';
import { setPromptImage } from './core/images.js';
import { getProgress, questionMemory, recordCheck, topicStatus, topicPath, recordDiagnostic, recordExplained } from './core/progress.js';
import { pickPractice, pickCheck, pickDiagnostic, pickExamples, weakSkillsOf, dueCount, unseenCount, CHECK_MIN } from './core/selection.js';
import { masterySettings } from './core/mastery.js';
import { store, KEYS } from './core/store.js';
import { getProfile } from './core/profile.js';
import { resultView } from './core/results.js';

/** Практика — одиночная игра-викторина по теме */
class PracticeGame extends BaseGame {
  static meta = {
    id: 'practice',
    icon: 'target',
    title: { ky: 'Машыгуу', ru: 'Практика', en: 'Practice' },
    goal: {
      ky: 'Теманы бекемдөө жана кайсы жерде ката кетирериңди билүү',
      ru: 'Закрепить тему и понять, где именно ты ошибаешься',
      en: 'Practise the topic and see exactly where you go wrong'
    },
    how: {
      ky: 'Суроону окуп, туура жоопту тандаңыз. Ар бир жооптон кийин түшүндүрмө чыгат.',
      ru: 'Прочитай вопрос и выбери верный ответ. После каждого ответа появится объяснение.',
      en: 'Read the question and choose the right answer. An explanation follows each answer.'
    },
    teamBased: false,
    needsPhones: false,
    minPlayers: 1
  };
}

const state = { subject: null, topic: null, game: null, player: 'me', mode: 'practice' };
const ROUND = 10; // вопросов в раунде

/** Все вопросы темы (банк + вопросы учителя) */
const topicPool = (topic) => getQuestions({ topic, count: 10000 });
const screens = ['pickScreen', 'introScreen', 'explainScreen', 'playScreen', 'resultScreen'];
const show = (id) => screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));

/** Статус темы (core/mastery.js) → класс, значок, подпись */
const STATUS_VIEW = {
  mastered: { cls: 'learned', icon: 'check', key: 'mastery_learned' },
  ready: { cls: 'ready', icon: 'target', key: 'mastery_ready' },
  learning: { cls: 'review', icon: 'warn', key: 'mastery_review' },
  insufficient: { cls: 'insufficient', icon: 'info', key: 'mastery_insufficient' },
  new: { cls: 'new', icon: 'target', key: 'mastery_new' }
};
const statusBadge = (status) => {
  const v = STATUS_VIEW[status] || STATUS_VIEW.new;
  return el('span', { class: `state ${v.cls}` }, icon(v.icon, { size: 16 }), t(v.key));
};

/** Правильный ответ вопроса банка — для разбора */
function answerOf(q, lang) {
  if (q.type === 'input') return (q.answer || [])[0] || '';
  if (q.type === 'multiple') return (q.correct || []).map((i) => pick(q.options?.[i], lang)).join(', ');
  if (q.type === 'match') return (q.pairs || []).map(([a, b]) => `${pick(a, lang)} → ${pick(b, lang)}`).join('; ');
  if (q.type === 'sort') return (q.items || []).map((x) => pick(x, lang)).join(' → ');
  return pick(q.options?.[q.correct ?? 0], lang);
}
const stat = (v, l) => el('div', { class: 'stat' }, el('b', {}, String(v)), el('span', {}, l));

// ─── Выбор темы ───────────────────────────────────────────────────────────────

async function renderPicker() {
  const lang = getLang();
  const withTopics = SUBJECTS.filter((s) => TOPICS.some((x) => x.subject === s.id));
  if (!state.subject) state.subject = withTopics[0]?.id;

  $('#subjectChips').replaceChildren(...withTopics.map((s) => el('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(s.id === state.subject),
    onclick: () => { state.subject = s.id; renderPicker(); }
  }, `${pick(s.title, lang)}`)));

  const topics = topicsOf(state.subject);
  const settings = await masterySettings();
  const cards = [];
  for (const tp of topics) {
    const { status } = await topicStatus(tp.id, settings);
    cards.push(el('button', {
      class: 'subject-card card', type: 'button', style: 'text-align:left',
      onclick: () => openIntro(tp.id)
    },
      el('div', { class: 'row between' },
        el('b', {}, pick(tp.title, lang)),
        statusBadge(status)
      ),
      el('div', { class: 'small muted' }, `${t('grade', { n: tp.grade })} · ${pick(tp.section, lang)}`),
      el('div', { class: 'chips' }, tp.skills.slice(0, 3).map((sk) => el('span', { class: 'chip small' }, pick(sk.title, lang))))
    ));
  }
  $('#topicGrid').replaceChildren(...cards);
  show('pickScreen');
}

// ─── Экран перед игрой ────────────────────────────────────────────────────────

async function openIntro(topicId) {
  state.topic = topicId;
  const lang = getLang();
  const topic = getTopic(topicId);
  const subject = getSubject(topic.subject);

  $('#introIcon').replaceChildren(icon(PracticeGame.meta.icon, { size: 36 }));
  $('#introTitle').textContent = pick(topic.title, lang);
  $('#introSubject').textContent = `${pick(subject.title, lang)} · ${t('grade', { n: topic.grade })}`;
  $('#introGoal').textContent = pick(PracticeGame.meta.goal, lang);
  $('#introHow').textContent = pick(PracticeGame.meta.how, lang);

  const pr = await getProgress();
  const rec = pr.topics[topicId];
  $('#introStats').replaceChildren(
    stat(ROUND, t('questions_n', { n: '' }).trim() || String(ROUND)),
    stat('~4 ' + t('minutes'), t('game_time')),
    stat(rec ? `${Math.round((rec.correct / rec.answered) * 100)}%` : '—', t('knowledge_map'))
  );

  // Что ждёт на каждом шаге — честно, до начала
  const [pool, mem, path, settings] = await Promise.all([topicPool(topicId), questionMemory(), topicPath(topicId), masterySettings()]);
  const ms = await topicStatus(topicId, settings);
  const due = dueCount(pool, mem, topicId);
  const unseen = unseenCount(pool, mem, topicId);
  const weak = weakSkillsOf(path.diag);
  const diagSet = pickDiagnostic(pool, mem, topicId, topic.skills.map((s) => s.id));

  $('#topicStatus').replaceChildren(statusBadge(ms.status));
  $('#topicStatusNote').textContent = {
    new: t('path_status_new'),
    insufficient: t('path_status_insufficient', { n: ms.need }),
    learning: ms.checkPct != null
      ? t('path_status_check_failed', { p: ms.checkPct, th: settings.threshold })
      : t('path_status_learning', { p: ms.pct, th: settings.threshold }),
    ready: t('path_status_ready', { p: ms.pct }),
    mastered: t('path_status_mastered', { p: ms.checkPct })
  }[ms.status];

  $('#diagNote').textContent = path.diagAt
    ? t('path_diag_done', { k: Object.keys(path.diag || {}).length - weak.length, n: Object.keys(path.diag || {}).length })
    : diagSet.length >= 2 ? t('questions_n', { n: diagSet.length }) : t('path_diag_none');
  $('#diagBtn').disabled = diagSet.length < 2;
  $('#explainNote').textContent = weak.length
    ? t('path_weak', { list: weak.map((s) => skillTitle(topicId, s, lang)).join(', ') })
    : path.diagAt ? t('path_no_weak') : t('path_explain_all_hint');

  $('#practiceNote').textContent = due ? t('mode_due_n', { n: due }) : t('mode_due_none');
  const last = pr.checks?.[topicId]?.at(-1);
  $('#checkNote').textContent = [
    unseen < CHECK_MIN ? t('mode_check_short', { n: unseen, min: CHECK_MIN })
      : unseen < ROUND ? t('mode_check_fewer', { n: unseen }) : t('mode_unseen_n', { n: unseen }),
    last ? t('mode_last_check', { p: Math.round((last.correct / Math.max(1, last.total)) * 100) }) : ''
  ].filter(Boolean).join(' · ');
  $('#checkBtn').disabled = unseen < CHECK_MIN;

  // Какие шаги пройдены и какой следующий
  const done = {
    stepDiag: !!path.diagAt,
    stepExplain: !!path.explainedAt,
    stepPractice: ms.status === 'ready' || ms.status === 'mastered',
    stepCheck: ms.status === 'mastered'
  };
  const next = ms.status === 'mastered' ? null
    : ms.status === 'new' && !path.diagAt && diagSet.length >= 2 ? 'stepDiag'
      : weak.length && !path.explainedAt ? 'stepExplain'
        : ms.status === 'ready' && unseen >= CHECK_MIN ? 'stepCheck' : 'stepPractice';
  const BTN = { stepDiag: '#diagBtn', stepExplain: '#explainBtn', stepPractice: '#startBtn', stepCheck: '#checkBtn' };
  Object.entries(BTN).forEach(([step, btn]) => {
    $('#' + step).classList.toggle('done', done[step]);
    $('#' + step).classList.toggle('next', step === next);
    $(btn).classList.toggle('primary', step === next);
  });

  show('introScreen');
}

// ─── Разбор: примеры с решением ───────────────────────────────────────────────

async function openExplain() {
  const lang = getLang();
  const topic = getTopic(state.topic);
  const [pool, mem, path, errors] = await Promise.all([
    topicPool(state.topic), questionMemory(), topicPath(state.topic), store.get(KEYS.errors, [])
  ]);
  const weak = weakSkillsOf(path.diag);
  const skills = weak.length ? weak : topic.skills.map((s) => s.id);
  const mistakeIds = errors.filter((e) => e.topic === state.topic).map((e) => e.questionId).reverse();
  const groups = pickExamples(pool, mem, state.topic, skills, mistakeIds, { perSkill: skills.length > 2 ? 1 : 2 });

  $('#explainIntro').textContent = weak.length ? t('path_explain_weak') : t('path_explain_all');
  const blocks = groups.filter((g) => g.questions.length).map((g) => el('section', { class: 'stack' },
    el('h2', {}, skillTitle(state.topic, g.skill, lang)),
    ...g.questions.map((q) => el('div', { class: 'card plain stack example' },
      el('b', {}, pick(q.prompt, lang)),
      el('span', { class: 'example-answer' }, `${q.errorHunt ? t('path_error_here') : t('game_correct_answer')}: ${answerOf(q, lang)}`),
      q.explain ? el('p', { class: 'small' }, pick(q.explain, lang)) : null
    ))
  ));
  $('#explainList').replaceChildren(...(blocks.length ? blocks : [el('div', { class: 'card center muted' }, t('path_no_examples'))]));
  // Вопросы, показанные с ответом, больше не попадут в итоговую проверку
  await recordExplained({ topic: state.topic, questionIds: groups.flatMap((g) => g.questions.map((q) => q.id)) });
  show('explainScreen');
  $('#explainScreen h1').focus?.();
}

// ─── Игра ─────────────────────────────────────────────────────────────────────

async function startGame(onlyWrong = false, mode = 'practice') {
  const lang = getLang();
  let questions = [];

  if (onlyWrong && state.game) {
    const wrongIds = state.game.wrongQuestionIds();
    questions = wrongIds.length ? await getQuestions({ topic: state.topic, ids: wrongIds }) : [];
    mode = 'practice'; // повтор ошибок — всегда тренировка
  }
  if (!questions.length) {
    const [pool, mem] = await Promise.all([topicPool(state.topic), questionMemory()]);
    if (mode === 'diag') {
      questions = pickDiagnostic(pool, mem, state.topic, getTopic(state.topic).skills.map((s) => s.id));
    } else if (mode === 'check') {
      const chosen = pickCheck(pool, mem, state.topic, { count: ROUND });
      if (!chosen.enough) {
        toast(t('mode_check_short', { n: chosen.available, min: CHECK_MIN }), { icon: 'ℹ️', ms: 5000 });
        return openIntro(state.topic);
      }
      questions = chosen.questions;
    } else {
      const focus = weakSkillsOf((await topicPath(state.topic)).diag);
      questions = pickPractice(pool, mem, state.topic, { count: ROUND, focus }).questions;
    }
  }
  state.mode = mode;

  state.xpBefore = (await getProgress()).xp;
  state.game?.destroy();
  state.game = new PracticeGame({
    questions, topic: state.topic, lang, perQuestionSec: 30, solo: true,
    onUpdate: (game, kind) => renderGame(game, kind)
  });
  state.game.addPlayer({ id: state.player, name: 'me' });

  show('playScreen');
  await state.game.start();
}

function renderGame(game, kind) {
  $('#timer').textContent = String(Math.max(0, game.timeLeft));
  $('#timer').classList.toggle('low', game.timeLeft <= 5 && game.state === 'running');
  if (kind === 'tick') return;

  if (game.state === 'finished') return showResults(game);

  const reveal = game.state === 'reveal';
  const answered = game.answers.get(state.player);

  $('#counter').textContent = `${game.current?.number || 0} / ${game.questionCount}`;
  $('#progressBar').style.width = `${((game.index) / game.questionCount) * 100}%`;
  $('#prompt').textContent = game.current?.prompt || '';
  setPromptImage($('#promptImage'), game.current?.image, game.current?.prompt);

  // Один рендерер для всех типов: выбор, ввод, сопоставление, сортировка…
  $('#inputWrap').classList.add('hidden');
  $('#options').classList.remove('hidden');
  const hide = state.mode !== 'practice'; // в проверке и диагностике не показываем, верно ли
  renderQuestion($('#options'), game.current, {
    reveal: reveal && !hide,
    given: answered?.value ?? null,
    correct: hide ? null : answered?.correct ?? null,
    onAnswer: (value) => answer(value)
  });

  const explain = $('#explain');
  if (hide) {
    // Проверка и диагностика: без подсказок — правильный ответ и объяснение только в конце
    explain.classList.toggle('hidden', !reveal);
    if (reveal) {
      explain.replaceChildren(el('b', {}, t('mode_check_answered')));
      clearTimeout(game._next);
      game._next = setTimeout(() => game.nextQuestion(), 700);
    }
    return;
  }
  explain.classList.toggle('hidden', !reveal);
  if (reveal) {
    const correctText = game.correctText();
    explain.replaceChildren(
      el('b', {}, answered?.correct ? `${t('game_correct')} ` : `${t('game_correct_answer')}: ${correctText} `),
      el('span', {}, game.current.explain || '')
    );
    if (answered?.correct) sfx.ok(); else sfx.bad();

    // Пауза на чтение объяснения, затем следующий вопрос
    clearTimeout(game._next);
    game._next = setTimeout(() => game.nextQuestion(), 2600);
  }
}

function answer(value) {
  state.game?.handleAnswer(state.player, value);
  state.game?.revealAnswer();
}

// ─── Результат ────────────────────────────────────────────────────────────────

async function showResults(game) {
  const r = game.results;
  if (!r) return;
  const lang = getLang();
  const xp = Math.max(0, (await getProgress()).xp - (state.xpBefore ?? 0));

  if (state.mode === 'check') {
    await recordCheck({ topic: state.topic, correct: r.correctAnswers, total: r.totalAnswers });
    toast(t('mode_check_done'), { icon: '✅' });
  }
  if (state.mode === 'diag') await recordDiagnostic({ topic: state.topic, bySkill: r.bySkill });

  // Следующий шаг пути — одной кнопкой
  const ms = await topicStatus(state.topic);
  const nextStep = state.mode === 'diag'
    ? { text: weakSkillsOf(r.bySkill).length ? t('path_after_diag_weak') : t('path_after_diag_ok'), label: weakSkillsOf(r.bySkill).length ? t('path_explain_start') : t('mode_practice_start'), go: () => (weakSkillsOf(r.bySkill).length ? openExplain() : startGame(false, 'practice')) }
    : ms.status === 'ready' ? { text: t('path_after_ready'), label: t('mode_check_start'), go: () => openIntro(state.topic) }
      : null;
  const extra = nextStep ? el('div', { class: 'card plain stack' },
    el('b', {}, nextStep.text),
    el('button', { class: 'btn primary', type: 'button', onclick: nextStep.go }, nextStep.label)) : null;

  $('#resultScreen').replaceChildren(resultView({
    accuracy: r.accuracy, xp, correct: r.correctAnswers, total: r.totalAnswers, timeSec: r.durationSec,
    skills: Object.entries(r.bySkill).map(([skill, s]) => ({ title: skillTitle(state.topic, skill, lang), ...s })),
    mistakes: r.mistakes,
    extra,
    onRepeatMistakes: () => startGame(true),
    onAgain: state.mode === 'diag' ? null : () => startGame(false, state.mode),
    other: { label: t('path_title'), onClick: () => openIntro(state.topic) }
  }));
  show('resultScreen');
  $('#resultScreen h1').focus();
  if (r.accuracy >= 70) { sfx.win(); confetti(); }
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'practice.html' });

  const params = new URLSearchParams(location.search);
  const topicParam = params.get('topic');
  const subjectParam = params.get('subject');
  if (subjectParam) state.subject = subjectParam;

  await renderPicker();
  if (topicParam && getTopic(topicParam)) openIntro(topicParam);

  $('#startBtn').addEventListener('click', () => startGame(false, 'practice'));
  $('#checkBtn').addEventListener('click', () => startGame(false, 'check'));
  $('#diagBtn').addEventListener('click', () => startGame(false, 'diag'));
  $('#explainBtn').addEventListener('click', openExplain);
  $('#explainDoneBtn').addEventListener('click', () => startGame(false, 'practice'));
  $('#explainBackBtn').addEventListener('click', () => openIntro(state.topic));
  $('#backBtn').addEventListener('click', () => renderPicker());
  $('#sendBtn').addEventListener('click', () => {
    const v = $('#answerInput').value.trim();
    if (v) answer(v);
  });
  $('#answerInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#sendBtn').click(); });

  // Клавиши 1–4 для быстрых ответов с клавиатуры
  document.addEventListener('keydown', (e) => {
    if ($('#playScreen').classList.contains('hidden')) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4) {
      const btn = $('#options').querySelectorAll('.option')[n - 1];
      if (btn && !btn.disabled) btn.click();
    }
  });

  await getProfile(); // создаём профиль при первом заходе
})();
