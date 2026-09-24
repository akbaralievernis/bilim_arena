/**
 * Bilim Arena — режим интерактивной доски.
 *
 * Сценарий урока:
 *   настройка → подключение учеников (QR) → этапы урока → разбор ошибок → итог
 *
 * Доска — главный экран, телефоны учеников — контроллеры.
 * Вся игровая логика живёт здесь; телефон только показывает то,
 * что ему прислала доска, и отправляет ответы обратно.
 */

import { bootstrap, el, $, toast, sfx, confetti, fmtTime } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { SUBJECTS, TOPICS, topicsOf, getTopic, getSubject, getQuestions, skillTitle } from './core/curriculum.js';
import { createRoom, joinUrl, renderQR } from './core/realtime.js';
import QuickVoteGame from './games/quickvote/game.js';
import TerritoryGame from './games/territory/game.js';
import ErrorHuntGame from './games/errorhunt/game.js';
import TimelineGame from './games/timeline/game.js';
import CodeLockGame from './games/codelock/game.js';
import InvestigationGame, { PHASE } from './games/investigation/game.js';
import { CASES, loadCase } from './data/investigations/index.js';
import { packAssignments, mergeSubmissions } from './core/sync.js';

const GAMES = {
  quickvote: QuickVoteGame, territory: TerritoryGame, investigation: InvestigationGame,
  errorhunt: ErrorHuntGame, timeline: TimelineGame, codelock: CodeLockGame
};

/**
 * Игры, которые запускаются отдельным режимом (не этапом плана урока).
 * У некоторых свой формат заданий (questionFilter), остальным подходят любые.
 */
const FORMAT_GAMES = ['codelock', 'errorhunt', 'timeline'];

/** Сколько подходящих заданий есть в теме: { topicId: { errorhunt: n, timeline: n, ... } } */
const formatCounts = new Map();

async function countFormats(topicId) {
  if (formatCounts.has(topicId)) return formatCounts.get(topicId);
  const topic = getTopic(topicId);
  const counts = {};
  for (const id of FORMAT_GAMES) {
    const G = GAMES[id];
    const allowed = !G.meta.subjects || G.meta.subjects.includes(topic?.subject);
    counts[id] = allowed
      ? (await getQuestions({ topic: topicId, count: 100, filter: G.questionFilter, strict: true })).length
      : 0;
  }
  formatCounts.set(topicId, counts);
  return counts;
}

/** План урока: этапы подбираются под выбранную длительность */
function buildPlan(durationMin) {
  const plans = {
    20: [
      { id: 'warmup', key: 'lesson_stage_warmup', game: 'quickvote', questions: 4, minutes: 5, difficulty: [1] },
      { id: 'practice', key: 'lesson_stage_practice', game: 'quickvote', questions: 6, minutes: 8, difficulty: [1, 2] },
      { id: 'arena', key: 'lesson_stage_arena', game: 'territory', questions: 8, minutes: 7, difficulty: [2, 3] }
    ],
    30: [
      { id: 'warmup', key: 'lesson_stage_warmup', game: 'quickvote', questions: 5, minutes: 5, difficulty: [1] },
      { id: 'practice', key: 'lesson_stage_practice', game: 'quickvote', questions: 8, minutes: 10, difficulty: [1, 2] },
      { id: 'arena', key: 'lesson_stage_arena', game: 'territory', questions: 10, minutes: 15, difficulty: [2, 3] }
    ],
    45: [
      { id: 'warmup', key: 'lesson_stage_warmup', game: 'quickvote', questions: 6, minutes: 7, difficulty: [1] },
      { id: 'practice', key: 'lesson_stage_practice', game: 'quickvote', questions: 10, minutes: 13, difficulty: [1, 2] },
      { id: 'arena', key: 'lesson_stage_arena', game: 'territory', questions: 12, minutes: 20, difficulty: [2, 3] }
    ]
  };
  return plans[durationMin] || plans[30];
}

const state = {
  mode: 'lesson',      // 'lesson' | 'investigation' | 'errorhunt' | 'timeline'
  caseId: null,
  subject: null,
  topic: null,
  duration: 30,
  plan: [],
  stageIndex: 0,
  room: null,
  game: null,
  players: new Map(),   // playerId -> { id, name, team }
  lessonStats: { answered: 0, correct: 0, bySkill: {} },
  repeatQuestions: null, // вопросы для повторного прохождения по ошибкам
  review: null           // { ids, skills } — повторение по ошибкам класса
};

// ─── Экраны ───────────────────────────────────────────────────────────────────
const screens = ['setupScreen', 'lobbyScreen', 'gameScreen', 'resultScreen', 'summaryScreen'];
function show(id) {
  screens.forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));
  $('#timer').classList.toggle('hidden', id !== 'gameScreen');
  $('#pauseBtn').hidden = id !== 'gameScreen';
}

// ─── 1. Настройка урока ───────────────────────────────────────────────────────

function renderSetup() {
  const lang = getLang();

  // Предметы, у которых есть готовые вопросы
  const subjectIds = [...new Set(TOPICS.map((x) => x.subject))];
  const subjects = SUBJECTS.filter((s) => subjectIds.includes(s.id));
  if (!state.subject) state.subject = subjects[0]?.id;

  $('#subjectChips').replaceChildren(...subjects.map((s) => el('button', {
    class: 'chip', type: 'button',
    'aria-pressed': String(s.id === state.subject),
    onclick: () => { state.subject = s.id; state.topic = null; renderSetup(); }
  }, `${s.icon} ${pick(s.title, lang)}`)));

  const topics = topicsOf(state.subject);
  if (!state.topic) state.topic = topics[0]?.id;

  $('#topicChips').replaceChildren(...topics.map((tp) => el('button', {
    class: 'chip', type: 'button',
    'aria-pressed': String(tp.id === state.topic),
    onclick: () => { state.topic = tp.id; renderSetup(); }
  }, `${t('grade', { n: tp.grade })} · ${pick(tp.title, lang)}`)));

  $('#durationChips').closest('.card')?.classList.toggle('hidden', state.mode !== 'lesson' || !!state.review);
  $('#durationChips').replaceChildren(...[20, 30, 45].map((d) => el('button', {
    class: 'chip', type: 'button',
    'aria-pressed': String(d === state.duration),
    onclick: () => { state.duration = d; renderSetup(); }
  }, `${d} ${t('minutes')}`)));

  // План урока — учитель сразу видит структуру.
  // В режиме повторения — один этап из вопросов, где класс ошибся.
  const counts = formatCounts.get(state.topic);
  if (!counts) {
    // Узнаём, есть ли в теме задания для отдельных игр, и перерисовываем
    countFormats(state.topic).then(() => renderSetup());
  } else if (FORMAT_GAMES.includes(state.mode) && !counts[state.mode]) {
    state.mode = 'lesson'; // в новой теме нет заданий этого формата
  }

  state.plan = state.review
    ? [{ id: 'review', key: 'lesson_stage_practice', game: 'quickvote', questions: Math.max(4, state.review.ids.length), minutes: 10, difficulty: [1, 2, 3] }]
    : FORMAT_GAMES.includes(state.mode)
      ? [{ id: state.mode, key: 'lesson_stage_practice', game: state.mode, questions: Math.min(GAMES[state.mode].meta.questions || 8, counts?.[state.mode] || 0), minutes: 10, difficulty: [1, 2, 3] }]
      : buildPlan(state.duration);
  const topic = getTopic(state.topic);
  $('#planPreview').replaceChildren(
    el('div', { class: 'label' }, t('lesson_plan')),
    el('ol', { class: 'plan-list' }, state.plan.map((st) => el('li', {},
      el('b', {}, t(st.key)),
      el('span', { class: 'muted' }, ` · ${st.minutes} ${t('minutes')} · ${t('questions_n', { n: st.questions })}`),
      el('span', { class: 'muted' }, ` · ${pick(GAMES[st.game].meta.title, lang)}`)
    )))
  );

  // Выбор режима: обычный урок или расследование
  const modeBox = $('#modeChips');
  if (modeBox) {
    modeBox.replaceChildren(
      el('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(state.mode === 'lesson'),
        onclick: () => { state.mode = 'lesson'; renderSetup(); }
      }, `📘 ${t('lesson_plan')}`),
      // Отдельные игры — только если в теме есть задания их формата
      ...FORMAT_GAMES.filter((id) => counts?.[id] > 0).map((id) => el('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(state.mode === id),
        onclick: () => { state.mode = id; renderSetup(); }
      }, `${GAMES[id].meta.icon} ${pick(GAMES[id].meta.title, lang)}`)),
      ...CASES.map((c) => el('button', {
        class: 'chip', type: 'button',
        'aria-pressed': String(state.mode === 'investigation' && state.caseId === c.id),
        onclick: () => { state.mode = 'investigation'; state.caseId = c.id; renderSetup(); }
      }, `🔍 ${t('inv_case_n', { n: c.number })}: ${pick(c.title, lang)}`))
    );
  }

  if (FORMAT_GAMES.includes(state.mode)) {
    const meta = GAMES[state.mode].meta;
    $('#planPreview').append(
      el('p', { class: 'muted', style: 'margin-top:8px' }, pick(meta.how, lang))
    );
  }

  // В режиме расследования план урока заменяется описанием дела
  if (state.mode === 'investigation') {
    const meta = CASES.find((c) => c.id === state.caseId) || CASES[0];
    state.caseId = meta?.id || null;
    state.topic = meta?.topic || state.topic;
    $('#planPreview').replaceChildren(
      el('div', { class: 'label' }, t('inv_title')),
      el('p', {}, `${t('inv_case_n', { n: meta?.number })} — ${pick(meta?.title, lang)}`),
      el('p', { class: 'muted' }, pick(InvestigationGame.meta.how, lang))
    );
  }

  $('#lessonTitle').textContent = topic ? pick(topic.title, lang) : '—';
  $('#lessonSub').textContent = topic
    ? `${pick(getSubject(topic.subject)?.title, lang)} · ${t('grade', { n: topic.grade })}`
    : '';
  renderStages();
}

function renderStages() {
  $('#stages').replaceChildren(...state.plan.map((st, i) => el('li', {
    class: i === state.stageIndex ? 'on' : (i < state.stageIndex ? 'done' : ''),
    'aria-current': i === state.stageIndex ? 'step' : null
  }, t(st.key))));
}

// ─── 2. Комната и подключение учеников ────────────────────────────────────────

async function openRoom() {
  show('lobbyScreen');
  $('#roomCode').textContent = '····';
  $('#playersList').replaceChildren();
  $('#playerCount').textContent = '0';

  try {
    state.room = await createRoom({
      onJoin: async (player) => {
        state.players.set(player.id, { ...player, team: null });
        renderPlayers();
        sfx.tap();
        pushToPhones();
        // Синхронизация без сервера: ученик получает задания учителя
        state.room?.send(player.id, { type: 'sync-assignments', ...(await packAssignments()) });
      },
      onLeave: () => renderPlayers(),
      onMessage: (playerId, msg) => {
        // Результаты домашки с телефона ученика попадают в аналитику учителя
        if (msg.type === 'sync-submissions') {
          mergeSubmissions(msg.submissions).then((n) => {
            if (n) toast(t('sync_received', { n }), { icon: '📥' });
          });
          return;
        }

        if (!state.game) return;

        // Обвинение из телефона: подозреваемый + доказательства
        if (msg.type === 'accuse') {
          state.game.submitAccusation?.(playerId, msg);
          return;
        }

        if (msg.type !== 'answer') return;
        const question = state.game.current;
        const res = state.game.handleAnswer(playerId, msg.value);
        // Сообщаем ученику итог ответа, чтобы он сохранился в его прогрессе
        if (res && !res.ignored && question) {
          state.room?.send(playerId, {
            type: 'result',
            correct: res.correct,
            topic: state.topic,
            skill: question.skill,
            questionId: question.raw.id,
            gameId: state.game.meta.id
          });
        }
      }
    });
  } catch (e) {
    console.error(e);
    toast(t('err_no_connection'), { icon: '⚠️', ms: 6000 });
    return;
  }

  const url = joinUrl(state.room.code);
  $('#roomCode').textContent = state.room.code;
  $('#joinUrlText').textContent = url.replace(/^https?:\/\//, '');
  const ok = await renderQR($('#qrBox'), url, 260);
  if (!ok) $('#joinHint').textContent = t('board_or_enter');
}

function renderPlayers() {
  const list = [...state.players.values()];
  $('#playerCount').textContent = String(list.length);
  $('#playersTitle').textContent = t('board_players_joined', { n: list.length });
  $('#playersList').replaceChildren(...list.map((p) => {
    const inGame = state.game?.players.get(p.id);
    const answered = state.game?.answers.has(p.id);
    return el('div', { class: `player-pill ${answered ? 'answered' : ''} ${inGame?.team ? 'team-' + inGame.team.toLowerCase() : ''}` },
      answered ? '✅ ' : '', p.name);
  }));
  $('#startGameBtn').disabled = list.length === 0;
}

/** Отправляет каждому телефону его персональный экран */
function pushToPhones() {
  if (!state.room) return;
  if (!state.game) {
    state.room.send(null, { type: 'screen', spec: { screen: 'wait' } });
    return;
  }
  state.room.sendEach((playerId) => ({ type: 'screen', spec: state.game.controllerSpec(playerId) }));
}

// ─── 3. Запуск этапа ──────────────────────────────────────────────────────────

async function startStage(stageIndex, customQuestions = null) {
  if (state.mode === 'investigation') return startInvestigation();

  state.stageIndex = stageIndex;
  const stage = state.plan[stageIndex];
  if (!stage) return finishLesson();

  const GameClass = GAMES[stage.game];
  let questions = customQuestions;

  if (!questions && state.review && stage.id === 'review') {
    // Повторение строится на реальных ошибках класса
    const wrong = state.review.ids.length
      ? await getQuestions({ topic: state.topic, ids: state.review.ids })
      : [];
    const extra = state.review.skills.length
      ? await getQuestions({ topic: state.topic, count: 4, skills: state.review.skills })
      : [];
    questions = [...new Map([...wrong, ...extra].map((q) => [q.id, q])).values()].slice(0, 12);
  }

  if (!questions) {
    questions = await getQuestions(GameClass.questionFilter
      ? { topic: state.topic, count: stage.questions, filter: GameClass.questionFilter, strict: true }
      : { topic: state.topic, count: stage.questions, difficulty: stage.difficulty });
  }

  if (!questions.length) {
    toast('Суроолор табылган жок', { icon: '⚠️' });
    return;
  }

  state.game?.destroy();
  state.game = new GameClass({
    questions,
    topic: state.topic,
    lang: getLang(),
    perQuestionSec: stage.game === 'territory' ? 30 : 25,
    cellCount: Math.min(12, stage.questions),
    onUpdate: (game, kind) => {
      renderGame(game, kind);
      if (kind !== 'tick') pushToPhones();
      else if (game.timeLeft <= 5) pushToPhones();
    }
  });

  state.players.forEach((p) => state.game.addPlayer({ id: p.id, name: p.name }));
  if (GameClass.meta.teamBased) {
    state.game.splitTeams();
    state.players.forEach((p) => { p.team = state.game.players.get(p.id)?.team || null; });
  }

  $('#gameName').textContent = `${GameClass.meta.icon} ${pick(GameClass.meta.title, getLang())}`;
  renderStages();
  show('gameScreen');
  await state.game.start();
  pushToPhones();
}

// ─── 3b. Расследование ────────────────────────────────────────────────────────

async function startInvestigation() {
  const data = await loadCase(state.caseId);
  if (!data) return toast(t('empty_none'), { icon: '⚠️' });

  state.game?.destroy();
  state.game = new InvestigationGame({
    investigation: data,
    lang: getLang(),
    perQuestionSec: 40,
    onUpdate: (game, kind) => {
      renderGame(game, kind);
      if (kind !== 'tick') pushToPhones();
    }
  });

  state.players.forEach((p) => state.game.addPlayer({ id: p.id, name: p.name }));
  state.game.splitTeams();
  state.players.forEach((p) => { p.team = state.game.players.get(p.id)?.team || null; });

  $('#gameName').textContent = `🔍 ${t('inv_case_n', { n: data.number })}`;
  $('#lessonTitle').textContent = pick(data.title, getLang());
  show('gameScreen');
  await state.game.start();
  pushToPhones();
}

/** Экраны расследования на доске: вступление, улика, обвинение, вердикт */
function renderInvestigation(game) {
  const lang = getLang();
  const phase = game.phase;
  const options = $('#options');
  const explain = $('#explain');

  $('#questionCounter').textContent = `${t('inv_clues')}: ${game.unlocked.size}/${game.clues.length}`;
  $('#answeredCount').textContent = phase === PHASE.ACCUSE
    ? t('game_waiting_answers', { answered: game.votes.size, total: game.players.size })
    : (game.statusText ? game.statusText() : '');

  if (phase === PHASE.INTRO) {
    $('#prompt').textContent = pick(game.case.intro, lang);
    explain.classList.add('hidden');
    options.replaceChildren(el('button', {
      class: 'btn primary big', type: 'button',
      onclick: () => game.beginInvestigation()
    }, `🔍 ${t('inv_start')}`));
    return;
  }

  if (phase === PHASE.ACCUSE) {
    $('#prompt').textContent = pick(game.case.final.question, lang);
    explain.classList.remove('hidden');
    explain.replaceChildren(el('span', {}, t('inv_accuse_hint', { n: game.case.final.requiredEvidence })));
    options.replaceChildren(...game.suspects.map((sus) => {
      const votes = [...game.votes.values()].filter((v) => v.suspect === sus.id).length;
      return el('div', { class: 'option' },
        el('span', { class: 'key', 'aria-hidden': 'true' }, sus.letter),
        el('span', {}, `${sus.emoji} ${pick(sus.name, lang)}`),
        votes ? el('span', { class: 'match-tag' }, String(votes)) : null
      );
    }));
    return;
  }

  if (phase === PHASE.VERDICT) {
    const v = game.verdict;
    $('#prompt').textContent = v?.solved ? t('inv_solved') : t('inv_failed');
    explain.classList.remove('hidden');
    explain.replaceChildren(el('b', {}, `💡 `), el('span', {}, pick(game.case.final.solution, lang)));
    options.replaceChildren();
    return;
  }

  // Фаза улики: вопрос рисуется базовой логикой, а после ответа — содержание улики
  const clue = game.currentClue;
  $('#prompt').textContent = game.current?.prompt || '';
  const reveal = game.state === 'reveal';

  options.replaceChildren(...(game.current?.options || []).map((text, i) => el('div', {
    class: `option ${reveal && i === game.current.correctIndex ? 'correct' : ''}`
  },
    el('span', { class: 'key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)),
    el('span', {}, text)
  )));

  explain.classList.toggle('hidden', !reveal);
  if (reveal && clue) {
    explain.replaceChildren(
      el('b', {}, `${clue.icon} ${pick(clue.title, lang)}: `),
      el('span', {}, pick(clue.content, lang)),
      el('div', { class: 'small muted', style: 'margin-top:6px' }, `🔎 ${pick(clue.insight, lang)}`)
    );
  }
}

/** Карта расследования: улики и подозреваемые — крупно, для доски */
function renderInvestigationBoard(game, container) {
  const lang = getLang();
  container.replaceChildren(
    el('div', { class: 'row between' },
      el('b', {}, `🔍 ${t('inv_progress')}`),
      el('span', { class: 'muted' }, `${game.unlocked.size}/${game.clues.length}`)
    ),
    el('div', { class: 'bar thick' }, el('i', { style: `width:${game.progress}%` })),
    el('div', { class: 'clue-grid' }, game.clues.map((c) => {
      const open = game.unlocked.has(c.id);
      const key = game.case.final.keyClues.includes(c.id);
      return el('div', {
        class: `clue-cell ${open ? 'open' : ''} ${open && key ? 'key' : ''}`,
        title: open ? pick(c.title, lang) : '?'
      },
        el('span', { class: 'clue-icon' }, open ? c.icon : '🔒'),
        el('span', { class: 'clue-name' }, open ? pick(c.title, lang) : '?')
      );
    })),
    el('div', { class: 'label', style: 'margin-top:10px' }, t('inv_suspects')),
    el('div', { class: 'suspects' }, game.suspects.map((sus) => {
      const votes = [...game.votes.values()].filter((v) => v.suspect === sus.id).length;
      const shown = game.phase === PHASE.VERDICT && sus.id === game.case.final.guilty;
      return el('div', { class: `suspect ${shown ? 'guilty' : ''}` },
        el('span', { class: 'suspect-emoji' }, sus.emoji),
        el('span', { class: 'suspect-letter' }, sus.letter),
        el('span', { class: 'suspect-name' }, pick(sus.name, lang)),
        el('span', { class: 'small muted' }, pick(sus.statement, lang)),
        votes ? el('span', { class: 'match-tag' }, String(votes)) : null
      );
    }))
  );
}

// ─── 4. Отрисовка игры на доске ───────────────────────────────────────────────

function renderGame(game, kind) {
  const timeEl = $('#timerValue');
  timeEl.textContent = String(Math.max(0, game.timeLeft));
  $('#timer').classList.toggle('low', game.timeLeft <= 5 && game.state === 'running');
  if (kind === 'tick') {
    if (game.timeLeft <= 3) sfx.tick();
    return; // при тике перерисовываем только таймер
  }

  if (game.state === 'finished') return showResults(game);

  // Расследование рисуется по-своему: улики, подозреваемые, обвинение
  if (state.mode === 'investigation' && game.case) {
    renderInvestigation(game);
    renderInvestigationBoard(game, $('#gameExtra'));
    renderPlayers();
    if (game.state === 'reveal' && !game._revealTimer) {
      game._revealTimer = setTimeout(() => {
        game._revealTimer = null;
        game.nextQuestion();
      }, 6000);
    }
    return;
  }

  $('#questionCounter').textContent = t('game_question', { n: `${game.current?.number || 0}/${game.questionCount}` });
  $('#answeredCount').textContent = game.statusText ? game.statusText() : '';
  $('#prompt').textContent = game.current?.prompt || '';

  const reveal = game.state === 'reveal';

  // Варианты ответа — крупные, читаются с задней парты
  if (game.renderOptions) {
    game.renderOptions($('#options'), reveal);
  } else if (game.current && game.current.type !== 'choice') {
    // Ввод, сопоставление, сортировка — ученики отвечают на телефонах,
    // доска показывает задание, а после — правильный ответ
    const hint = { input: '⌨️', match: '🔗', sort: '↕️', multiple: '☑️' }[game.current.type] || '📱';
    const preview = game.current.type === 'match'
      ? el('div', { class: 'match-box' },
        el('div', { class: 'match-col' }, game.current.pairs.left.map((x) => el('div', { class: 'option' }, x))),
        el('div', { class: 'match-col' }, game.current.pairs.right.map((x) => el('div', { class: 'option' }, x.text))))
      : game.current.type === 'sort'
        ? el('div', { class: 'sort-box' }, game.current.items.map((x) => el('div', { class: 'option' }, x.text)))
        : game.current.type === 'multiple'
          ? el('div', { class: 'options' }, game.current.options.map((x, i) => el('div', {
            class: `option ${reveal && game.current.correctSet.has(i) ? 'correct' : ''}`
          }, el('span', { class: 'key' }, String.fromCharCode(65 + i)), el('span', {}, x))))
          : null;

    $('#options').replaceChildren(el('div', { class: 'input-note' },
      preview,
      reveal
        ? el('div', { class: 'answer-big', style: 'font-size:clamp(1.2rem,3vw,2rem);margin-top:10px' }, `${t('game_correct_answer')}: ${game.correctText()}`)
        : el('div', { class: 'muted center', style: 'margin-top:10px' }, `${hint} 📱`)
    ));
  } else {
    const lines = !!game.current?.errorHunt;
    $('#options').replaceChildren(el('div', { class: lines ? 'options solution-lines' : 'options' },
      (game.current?.options || []).map((text, i) => el('div', {
        class: `option ${reveal && i === game.current.correctIndex ? (lines ? 'wrong-line' : 'correct') : ''}`
      },
        el('span', { class: 'key', 'aria-hidden': 'true' }, lines ? String(i + 1) : String.fromCharCode(65 + i)),
        el('span', { class: lines ? 'line-text' : '' }, text)
      ))));
  }

  const explain = $('#explain');
  explain.classList.toggle('hidden', !reveal || !game.current?.explain);
  if (reveal && game.current?.explain) {
    explain.replaceChildren(
      el('b', {}, `💡 ${t('game_explanation')}: `),
      el('span', {}, game.current.explain)
    );
  }

  if (game.renderBoardExtra) game.renderBoardExtra($('#gameExtra'));
  renderPlayers();

  // После показа ответа — автоматически следующий вопрос
  if (reveal && !game._revealTimer) {
    game._revealTimer = setTimeout(() => {
      game._revealTimer = null;
      game.nextQuestion();
    }, 4500);
  }
}

// ─── 5. Результаты этапа и разбор ошибок ──────────────────────────────────────

function showResults(game) {
  const r = game.results;
  if (!r) return;
  show('resultScreen');
  sfx.win();
  if (r.accuracy >= 70) confetti();

  // Копим статистику всего урока
  state.lessonStats.answered += r.totalAnswers;
  state.lessonStats.correct += r.correctAnswers;
  Object.entries(r.bySkill).forEach(([skill, s]) => {
    const acc = state.lessonStats.bySkill[skill] || (state.lessonStats.bySkill[skill] = { ok: 0, total: 0 });
    acc.ok += s.ok; acc.total += s.total;
  });

  const isCase = !!r.caseId;

  const title = isCase
    ? (r.verdict?.solved ? t('inv_solved') : t('inv_failed'))
    : r.lock
      ? (r.lock.opened === r.lock.total ? t('cl_opened', { code: r.lock.code }) : t('cl_partly', { n: r.lock.opened, total: r.lock.total }))
      : (r.teams
      ? (r.winner === 'draw' ? t('results_draw') : t('results_team_won', { team: r.winner === 'A' ? t('board_team_a') : t('board_team_b') }))
      : t('results_title'));
  $('#resultTitle').textContent = title;

  $('#resultStats').replaceChildren(...(isCase
    ? [
      stat(`${r.cluesFound}/${r.cluesTotal}`, t('inv_clues')),
      stat(`${r.correctAnswers}/${r.totalAnswers}`, t('results_correct')),
      stat(`${r.accuracy}%`, t('accuracy')),
      stat(r.players[0]?.score || 0, 'XP'),
      stat(fmtTime(r.durationSec), t('game_time'))
    ]
    : [
      ...(r.lock ? [stat(`🔐 ${r.lock.opened}/${r.lock.total}`, t('cl_digits'))] : []),
      stat(r.correctAnswers, t('results_correct')),
      stat(r.totalAnswers - r.correctAnswers, t('results_wrong')),
      stat(`${r.accuracy}%`, t('analytics_class_average')),
      stat(fmtTime(r.durationSec), t('game_time'))
    ]));

  // Разбор дела: логическая цепочка доказательств
  if (isCase) {
    const lang = getLang();
    $('#leaderboard').replaceChildren(
      el('p', {}, `💡 ${pick(r.solution, lang)}`),
      el('div', { class: 'small muted' },
        `${t('inv_evidence')}: ${r.verdict?.matchedClues?.length || 0}/${r.verdict?.clues?.length || 0}`)
    );
  }

  // Разбор по навыкам: видно, что именно не усвоено
  const rows = Object.entries(r.bySkill).map(([skill, s]) => {
    const pct = Math.round((s.ok / s.total) * 100);
    const weak = pct < 70;
    return el('div', { class: 'skill-row' },
      el('div', { class: 'row between' },
        el('b', {}, skillTitle(state.topic, skill, getLang())),
        el('span', { class: `state ${weak ? 'review' : 'learned'}` },
          weak ? '⚠️' : '✅', ` ${s.ok}/${s.total}`)
      ),
      el('div', { class: `bar ${weak ? '' : 'ok'}` }, el('i', { style: `width:${pct}%` }))
    );
  });
  $('#skillBreakdown').replaceChildren(...(rows.length ? rows : [el('p', { class: 'muted' }, t('results_nothing_wrong'))]));

  // Лучшие ученики (в расследовании там показан разбор дела)
  const top = r.players.slice(0, 5);
  if (!isCase) $('#leaderboard').replaceChildren(...(top.length
    ? top.map((p, i) => el('div', { class: 'row between lead-row' },
      el('span', {}, `${['🥇', '🥈', '🥉'][i] || `${i + 1}.`} ${p.name}`),
      el('b', {}, `${p.score}`)))
    : [el('p', { class: 'muted' }, t('board_waiting'))]));


  const wrongIds = game.wrongQuestionIds();
  $('#repeatBtn').disabled = wrongIds.length === 0;
  $('#repeatBtn').textContent = isCase ? `🔁 ${t('inv_repeat_mistakes')}` : t('results_repeat_topic');

  if (isCase) {
    // Повтор ошибок расследования — обычная викторина по тем же заданиям
    $('#repeatBtn').onclick = async () => {
      const wrongClues = game.case.clues.filter((c) => wrongIds.includes(c.id));
      const questions = wrongClues.map((c) => ({
        id: c.id, skill: c.skill, difficulty: game.case.difficulty || 2, ...c.question
      }));
      if (!questions.length) return;

      state.mode = 'lesson';
      state.topic = game.case.topic;
      state.plan = [{ id: 'review', key: 'lesson_stage_practice', game: 'quickvote', questions: questions.length, minutes: 5, difficulty: [1, 2, 3] }];
      state.stageIndex = 0;
      toast(t('inv_repeat_mistakes'), { icon: '🔁' });
      startStage(0, questions);
    };
    $('#nextStageBtn').textContent = t('lesson_finish');
    $('#nextStageBtn').onclick = () => finishLesson();
    pushToPhones();
    return;
  }

  $('#repeatBtn').onclick = async () => {
    // Новая игра ровно по тем вопросам, где класс ошибся
    const all = await getQuestions({ topic: state.topic, count: 50 });
    const wrong = all.filter((q) => wrongIds.includes(q.id));
    const weakSkills = r.weakSkills.map((w) => w.skill);
    const extra = weakSkills.length
      ? await getQuestions({ topic: state.topic, count: 4, skills: weakSkills })
      : [];
    const fits = GAMES[state.plan[state.stageIndex]?.game]?.questionFilter || (() => true);
    const set = [...new Map([...wrong, ...extra].filter(fits).map((q) => [q.id, q])).values()];
    toast(t('results_repeat_topic'), { icon: '🔁' });
    startStage(state.stageIndex, set.slice(0, 8));
  };

  const isLast = state.stageIndex >= state.plan.length - 1;
  $('#nextStageBtn').textContent = isLast ? t('lesson_finish') : t('lesson_next_stage');
  $('#nextStageBtn').onclick = () => (isLast ? finishLesson() : startStage(state.stageIndex + 1));

  pushToPhones();
}

const stat = (value, label) => el('div', { class: 'stat' }, el('b', {}, String(value)), el('span', {}, label));

// ─── 6. Итог урока ────────────────────────────────────────────────────────────

function finishLesson() {
  show('summaryScreen');
  const s = state.lessonStats;
  const acc = s.answered ? Math.round((s.correct / s.answered) * 100) : 0;

  $('#summaryStats').replaceChildren(
    stat(state.players.size, t('nav_class')),
    stat(s.correct, t('results_correct')),
    stat(s.answered - s.correct, t('results_wrong')),
    stat(`${acc}%`, t('analytics_class_average'))
  );

  const weak = Object.entries(s.bySkill)
    .map(([skill, x]) => ({ skill, pct: Math.round((x.ok / x.total) * 100), ...x }))
    .filter((x) => x.pct < 70)
    .sort((a, b) => a.pct - b.pct);

  $('#summaryReview').replaceChildren(
    el('h2', {}, weak.length ? t('analytics_need_review') : t('results_nothing_wrong')),
    ...weak.map((w) => el('div', { class: 'row between' },
      el('span', {}, `⚠️ ${skillTitle(state.topic, w.skill, getLang())}`),
      el('b', {}, `${w.pct}%`)
    ))
  );

  state.room?.send(null, { type: 'screen', spec: { screen: 'end', score: 0, correct: s.correct, total: s.answered } });
  confetti();
}

// ─── Запуск страницы ──────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();

  // Параметры из панели учителя: board.html?subject=math&topic=...&duration=30
  const params = new URLSearchParams(location.search);
  if (params.get('subject')) state.subject = params.get('subject');
  if (params.get('topic')) state.topic = params.get('topic');
  if (params.get('duration')) state.duration = Number(params.get('duration')) || 30;
  if (params.get('mode') === 'review') {
    state.review = {
      ids: (params.get('questions') || '').split(',').filter(Boolean),
      skills: (params.get('skills') || '').split(',').filter(Boolean)
    };
  }
  if (FORMAT_GAMES.includes(params.get('game'))) state.mode = params.get('game');
  if (params.get('case')) {
    state.mode = 'investigation';
    state.caseId = params.get('case');
  }

  renderSetup();
  show('setupScreen');

  $('#startLessonBtn').onclick = () => { state.stageIndex = 0; openRoom(); };
  $('#startGameBtn').onclick = () => startStage(0);
  $('#skipBtn').onclick = () => {
    if (!state.game) return;
    clearTimeout(state.game._revealTimer);
    state.game._revealTimer = null;
    state.game.nextQuestion();
  };
  $('#finishBtn').onclick = () => state.game?.finish('manual');
  $('#pauseBtn').onclick = (e) => {
    if (!state.game) return;
    if (state.game.state === 'paused') { state.game.resume(); e.currentTarget.textContent = '⏸'; }
    else { state.game.pause(); e.currentTarget.textContent = '▶'; }
  };
  $('#exitBtn').onclick = () => {
    if (confirm(t('lesson_finish') + '?')) finishLesson();
  };
  $('#newLessonBtn').onclick = () => location.reload();

  // Учитель может управлять с клавиатуры: пробел — дальше, P — пауза
  document.addEventListener('keydown', (e) => {
    if (!state.game || $('#gameScreen').classList.contains('hidden')) return;
    if (e.code === 'Space') { e.preventDefault(); $('#skipBtn').click(); }
    if (e.key.toLowerCase() === 'p') $('#pauseBtn').click();
  });

  // Комната живёт в этой вкладке — предупреждаем о закрытии
  window.addEventListener('beforeunload', (e) => {
    const active = navigator.userActivation ? navigator.userActivation.hasBeenActive : true;
    if (active && state.room && state.players.size > 0) { e.preventDefault(); e.returnValue = ''; }
  });
})();
