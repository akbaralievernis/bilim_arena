/**
 * Bilim Arena — самостоятельная практика ученика.
 *
 * Тот же игровой движок, что и на доске, но в режиме «соло»:
 * прогресс, ошибки и XP сохраняются в профиле ученика.
 * Перед игрой всегда показывается цель и правила, после — разбор ошибок.
 */

import { bootstrap, mountHeader, el, $, sfx, confetti } from './core/ui.js';
import { icon } from './core/icons.js';
import { t, pick, getLang } from './core/i18n.js';
import { SUBJECTS, TOPICS, topicsOf, getTopic, getSubject, getQuestions, skillTitle } from './core/curriculum.js';
import { BaseGame } from './core/engine.js';
import { renderQuestion } from './core/quiz-ui.js';
import { topicState, getProgress } from './core/progress.js';
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

const state = { subject: null, topic: null, game: null, player: 'me' };
const screens = ['pickScreen', 'introScreen', 'playScreen', 'resultScreen'];
const show = (id) => screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));

const STATE_ICON = { learned: 'check', review: 'warn', new: 'target' };
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
  const cards = [];
  for (const tp of topics) {
    const st = await topicState(tp.id);
    cards.push(el('button', {
      class: 'subject-card card', type: 'button', style: 'text-align:left',
      onclick: () => openIntro(tp.id)
    },
      el('div', { class: 'row between' },
        el('b', {}, pick(tp.title, lang)),
        el('span', { class: `state ${st}` }, icon(STATE_ICON[st], { size: 16 }), t('mastery_' + (st === 'learned' ? 'learned' : st === 'review' ? 'review' : 'new')))
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
    stat(10, t('questions_n', { n: '' }).trim() || '10'),
    stat('~4 ' + t('minutes'), t('game_time')),
    stat(rec ? `${Math.round((rec.correct / rec.answered) * 100)}%` : '—', t('knowledge_map'))
  );

  show('introScreen');
}

// ─── Игра ─────────────────────────────────────────────────────────────────────

async function startGame(onlyWrong = false) {
  const lang = getLang();
  let questions;

  if (onlyWrong && state.game) {
    const wrongIds = state.game.wrongQuestionIds();
    const all = await getQuestions({ topic: state.topic, count: 50 });
    questions = all.filter((q) => wrongIds.includes(q.id));
    if (!questions.length) questions = await getQuestions({ topic: state.topic, count: 10 });
  } else {
    questions = await getQuestions({ topic: state.topic, count: 10 });
  }

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

  // Один рендерер для всех типов: выбор, ввод, сопоставление, сортировка…
  $('#inputWrap').classList.add('hidden');
  $('#options').classList.remove('hidden');
  renderQuestion($('#options'), game.current, {
    reveal,
    given: answered?.value ?? null,
    correct: answered?.correct ?? null,
    onAnswer: (value) => answer(value)
  });

  const explain = $('#explain');
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

  $('#resultScreen').replaceChildren(resultView({
    accuracy: r.accuracy, xp, correct: r.correctAnswers, total: r.totalAnswers, timeSec: r.durationSec,
    skills: Object.entries(r.bySkill).map(([skill, s]) => ({ title: skillTitle(state.topic, skill, lang), ...s })),
    mistakes: r.mistakes,
    onRepeatMistakes: () => startGame(true),
    onAgain: () => startGame(false)
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

  $('#startBtn').addEventListener('click', () => startGame(false));
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
