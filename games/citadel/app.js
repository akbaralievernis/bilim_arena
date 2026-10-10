/**
 * Bilim Arena - Citadel (Цитаделди ээлөө)
 * Вопросы — в data.js, перевод интерфейса — shared/lang.js
 */

(function() {
  'use strict';

  // --- Банки вопросов (data.js): история и география — на языке сайта ---
  const LANG = window.BALang ? window.BALang.lang : "ky";
  const T = (s, v) => (window.BALang ? window.BALang.t(s, v) : s.replace(/\{(\w+)\}/g, (m, k) => (v && v[k] !== undefined ? v[k] : m)));
  const toQuestion = ([q, options]) => ({ q, options, correct: 0 });
  const QUIZ_BANKS = {
    kyrgyz_lang_lit: window.CITADEL_DATA.kyrgyz_lang_lit.map(toQuestion),
    kyrgyz_history_geo: window.CITADEL_DATA.kyrgyz_history_geo.map((item) => toQuestion(item[LANG] || item.ky))
  };

  // Initial empty array, will be populated on game start
  let currentQuestions = []; 

  // Constants & State
  const $ = (id) => document.getElementById(id);
  const state = {
    teamA: T("Команда A"),
    teamB: T("Команда B"),
    timerSec: 15,
    matchSec: 180,
    board: []
  };

  const activePick = { A: null, B: null };
  const timers = { A: { left: 15, interval: null }, B: { left: 15, interval: null } };
  const match = { left: 180, interval: null, running: false };

  // --- Theme Logic ---
  const initTheme = () => {
    // Платформа использует один светлый интерфейс
    document.body.className = 'light';
    $('themeBtn').hidden = true;
  };

  const toggleTheme = () => {
    const isDark = document.body.classList.contains('dark');
    const nextTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('BA_PORTAL_THEME', nextTheme);
    initTheme();
  };

  // --- UI Elements ---
  const UI = {
    setup: $("setup"), game: $("game"),
    teamAName: $("teamAName"), teamBName: $("teamBName"), diffSelect: $("diffSelect"),
    btnStart: $("btnStart"),
    matchTimer: $("matchTimer"),
    fillA: $("fillA"), fillB: $("fillB"),
    boardN: $("boardN"),
    topTeamA: $("topTeamA"), topTeamB: $("topTeamB"),
    topScoreA: $("topScoreA"), topScoreB: $("topScoreB"),
    timerA: $("timerA"), timerB: $("timerB"),
    qTextA: $("qTextA"), qTextB: $("qTextB"),
    answersA: $("answersA"), answersB: $("answersB"),
    winBackdrop: $("winBackdrop"), winTitle: $("winTitle"), winSub: $("winSub"),
    toast: $("toast")
  };

  function toast(msg, good = false) {
    UI.toast.textContent = msg;
    UI.toast.classList.remove("hidden");
    UI.toast.style.background = good ? "var(--good)" : "var(--bad)";
    setTimeout(() => UI.toast.classList.add("hidden"), 2000);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // --- Game Mechanics ---
  function initBoard(difficulty) {
    // Берем базу вопросов по выбранной сложности
    const baseBank = [...(QUIZ_BANKS[difficulty] || QUIZ_BANKS.kyrgyz_history_geo)];
    for (let i = baseBank.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [baseBank[i], baseBank[j]] = [baseBank[j], baseBank[i]];
    }
    
    // Перемешиваем вопросы случайным образом
    // (перемешано выше, без sort со случайным компаратором)

    // Берем ровно 30 штук и перемешиваем варианты ответов
    // (в банке правильный ответ всегда стоит первым)
    currentQuestions = baseBank.slice(0, 30).map(q => {
      const order = q.options.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      return { q: q.q, options: order.map(i => q.options[i]), correct: order.indexOf(q.correct) };
    });

    // Создаем 30 плиток на доске
    state.board = Array.from({ length: 30 }, () => ({ owner: "N" }));
  }

  function renderBoard() {
    UI.boardN.innerHTML = "";
    state.board.forEach((t, i) => {
      const el = document.createElement("div");
      el.className = "tile";
      el.dataset.owner = t.owner;
      el.innerHTML = `<span class="id">${i + 1}</span>`;
      
      const isLocked = (activePick.A === i || activePick.B === i);
      if (isLocked) el.classList.add("locked");

      el.onclick = (e) => onTileClick(i, e);
      UI.boardN.appendChild(el);
    });
    updateStats();
  }

  function onTileClick(id, e) {
    if (!match.running) return;
    
    // Left side of screen = Team A, Right = Team B
    const team = e.clientX < window.innerWidth / 2 ? "A" : "B";
    
    if (activePick[team] !== null) return;
    if (state.board[id].owner !== "N") return;
    if (activePick.A === id || activePick.B === id) return;

    activePick[team] = id;
    openQuestion(team, id);
    renderBoard();
  }

  function openQuestion(team, id) {
    const q = currentQuestions[id];
    const textEl = team === "A" ? UI.qTextA : UI.qTextB;
    const ansEl = team === "A" ? UI.answersA : UI.answersB;

    textEl.textContent = q.q;
    ansEl.innerHTML = "";

    q.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "ansBtn";
      btn.textContent = opt;
      btn.onclick = () => solveQuestion(team, id, idx);
      ansEl.appendChild(btn);
    });

    startTeamTimer(team);
  }

  function solveQuestion(team, id, idx) {
    const q = currentQuestions[id];
    const isCorrect = idx === q.correct;

    if (isCorrect) {
      state.board[id].owner = team;
      toast(T("{team}: Туура жооп!", { team: team === "A" ? state.teamA : state.teamB }), true);
    } else {
      toast(T("{team}: Ката!", { team: team === "A" ? state.teamA : state.teamB }), false);
    }

    activePick[team] = null;
    stopTeamTimer(team);
    
    // Reset side
    const textEl = team === "A" ? UI.qTextA : UI.qTextB;
    const ansEl = team === "A" ? UI.answersA : UI.answersB;
    textEl.textContent = T("Кезектеги плитканы тандаңыз");
    ansEl.innerHTML = "";

    renderBoard();
    checkWinCondition();
  }

  function startTeamTimer(team) {
    stopTeamTimer(team);
    timers[team].left = state.timerSec;
    const el = team === "A" ? UI.timerA : UI.timerB;
    
    timers[team].interval = setInterval(() => {
      timers[team].left--;
      el.textContent = T("{n} сек", { n: timers[team].left });
      el.classList.toggle("danger", timers[team].left <= 5);

      if (timers[team].left <= 0) {
        toast(T("Убакыт бүттү!"), false);
        solveQuestion(team, activePick[team], -1);
      }
    }, 1000);
  }

  function stopTeamTimer(team) {
    if (timers[team].interval) clearInterval(timers[team].interval);
    const el = team === "A" ? UI.timerA : UI.timerB;
    el.textContent = T("{n} сек", { n: state.timerSec });
    el.classList.remove("danger");
  }

  function updateStats() {
    let a = 0, b = 0;
    state.board.forEach(t => {
      if (t.owner === "A") a++;
      else if (t.owner === "B") b++;
    });

    UI.topScoreA.textContent = a;
    UI.topScoreB.textContent = b;

    const total = state.board.length || 1;
    UI.fillA.style.width = `${(a / total) * 100}%`;
    UI.fillB.style.width = `${(b / total) * 100}%`;
  }

  function startMatch() {
    match.left = state.matchSec;
    match.running = true;
    UI.matchTimer.textContent = formatTime(match.left);

    match.interval = setInterval(() => {
      match.left--;
      UI.matchTimer.textContent = formatTime(match.left);
      if (match.left <= 0) endMatch();
    }, 1000);
  }

  function checkWinCondition() {
    const unowned = state.board.filter(t => t.owner === "N").length;
    if (unowned === 0) endMatch();
  }

  function endMatch() {
    if (match.interval) clearInterval(match.interval);
    match.running = false;
    stopTeamTimer("A");
    stopTeamTimer("B");
    activePick.A = activePick.B = null;
    
    let a = 0, b = 0;
    state.board.forEach(t => {
      if (t.owner === "A") a++; else if (t.owner === "B") b++;
    });

    if (a > b) {
        UI.winTitle.textContent = T("{team} жеңди!", { team: state.teamA });
        fireConfetti();
    } else if (b > a) {
        UI.winTitle.textContent = T("{team} жеңди!", { team: state.teamB });
        fireConfetti();
    } else {
        UI.winTitle.textContent = T("Тең чыгуу!");
    }

    UI.winSub.textContent = T("Жыйынтык эсеп: {a} — {b}", { a, b });
    UI.winBackdrop.classList.remove("hidden");
  }

  function fireConfetti() {
    if (typeof window.confetti !== "function") return; // библиотека не загрузилась — без конфетти
    var duration = 3000;
    var end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff2e63', '#5c6df5']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#0099ff', '#10b981']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }

  // --- Events ---
  function bindEvents() {
    $('themeBtn').addEventListener('click', toggleTheme);

    UI.btnStart.onclick = () => {
      state.teamA = UI.teamAName.value.trim() || T("Команда A");
      state.teamB = UI.teamBName.value.trim() || T("Команда B");
      const diff = UI.diffSelect.value;
      
      initBoard(diff);

      UI.setup.classList.add("hidden");
      UI.game.classList.remove("hidden");
      
      UI.topTeamA.textContent = state.teamA;
      $("teamNameA").textContent = state.teamA;
      
      UI.topTeamB.textContent = state.teamB;
      $("teamNameB").textContent = state.teamB;
      
      renderBoard();
      startMatch();
    };

    $("btnPlayAgain").onclick = () => location.reload();
  }

  // --- Init ---
  initTheme();
  bindEvents();

})();
