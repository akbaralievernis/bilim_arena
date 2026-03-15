/**
 * Bilim Arena - Citadel (Цитаделди ээлөө)
 * Modern Logic with Pre-loaded Questions & Confetti
 */

(function() {
  'use strict';

  // --- PRE-LOADED QUESTION BANKS (35 questions each) ---
  const QUIZ_BANKS = {
    english_a1: [
      { q: "I ___ a student.", options: ["am", "is", "are", "be"], correct: 0 },
      { q: "He ___ from London.", options: ["am", "is", "are", "be"], correct: 1 },
      { q: "This is ___ apple.", options: ["a", "an", "two", "some"], correct: 1 },
      { q: "I have two ___ at home.", options: ["cat", "cats", "a cat", "cates"], correct: 1 },
      { q: "The sky is ___.", options: ["green", "red", "blue", "yellow"], correct: 2 },
      { q: "The day after Monday is ___.", options: ["Sunday", "Tuesday", "Friday", "Wednesday"], correct: 1 },
      { q: "___ is my best friend.", options: ["He", "His", "Him", "We"], correct: 0 },
      { q: "They ___ apples.", options: ["likes", "like", "liking", "is like"], correct: 1 },
      { q: "___ is your name?", options: ["How", "Who", "What", "Where"], correct: 2 },
      { q: "My mother's sister is my ___.", options: ["uncle", "aunt", "grandmother", "sister"], correct: 1 },
      { q: "Five plus three is ___.", options: ["seven", "eight", "nine", "ten"], correct: 1 },
      { q: "The book is ___ the table.", options: ["in", "on", "at", "with"], correct: 1 },
      { q: "___ is my pen (жакындагы нерсе).", options: ["This", "These", "Those", "There"], correct: 0 },
      { q: "The opposite of 'big' is ___.", options: ["small", "tall", "hot", "cold"], correct: 0 },
      { q: "I go to bed ___ 10 o'clock.", options: ["in", "on", "at", "to"], correct: 2 },
      { q: "We ___ happy today.", options: ["am", "is", "are", "do"], correct: 2 },
      { q: "She ___ got a new car.", options: ["have", "has", "is", "do"], correct: 1 },
      { q: "I ___ like fish. It's bad.", options: ["don't", "doesn't", "am not", "isn't"], correct: 0 },
      { q: "___ you speak English?", options: ["Are", "Does", "Is", "Do"], correct: 3 },
      { q: "Look at ___! She is dancing.", options: ["she", "her", "hers", "him"], correct: 1 },
      { q: "There ___ a book on the desk.", options: ["are", "am", "is", "be"], correct: 2 },
      { q: "How ___ are you? I am 15.", options: ["old", "many", "much", "long"], correct: 0 },
      { q: "My ___ name is John.", options: ["brother", "brothers", "brother's", "brother is"], correct: 2 },
      { q: "I usually get up ___ morning.", options: ["in the", "on the", "at the", "to"], correct: 0 },
      { q: "A dog has four ___.", options: ["arms", "hands", "legs", "heads"], correct: 2 },
      { q: "January is the ___ month of the year.", options: ["first", "second", "one", "last"], correct: 0 },
      { q: "We don't go to school ___ Sunday.", options: ["in", "at", "on", "by"], correct: 2 },
      { q: "___ are you from?", options: ["Who", "Where", "What", "When"], correct: 1 },
      { q: "What color ___ your eyes?", options: ["is", "am", "are", "do"], correct: 2 },
      { q: "The mouse is ___ than the elephant.", options: ["small", "smaller", "smallest", "more small"], correct: 1 },
      { q: "Can you ___?", options: ["swimming", "swims", "swim", "to swim"], correct: 2 },
      { q: "I am wearing a ___ shirt.", options: ["white", "whiter", "whites", "white's"], correct: 0 },
      { q: "Today ___ sunny.", options: ["am", "is", "are", "do"], correct: 1 },
      { q: "___ bag is this? It's mine.", options: ["Who", "Where", "Whose", "What"], correct: 2 },
      { q: "I have ___ brother and two sisters.", options: ["a", "an", "the", "some"], correct: 0 }
    ],

    english_a2: [
      { q: "She ___ to the park every weekend.", options: ["go", "goes", "going", "went"], correct: 1 },
      { q: "We ___ a great movie yesterday.", options: ["see", "saw", "seen", "seeing"], correct: 1 },
      { q: "My brother is ___ than me.", options: ["tall", "more tall", "taller", "the tallest"], correct: 2 },
      { q: "How ___ apples do we need for the pie?", options: ["much", "many", "some", "any"], correct: 1 },
      { q: "The English lesson is ___ Monday.", options: ["in", "at", "on", "for"], correct: 2 },
      { q: "Look! The baby ___ right now.", options: ["sleeps", "is sleeping", "sleeping", "slept"], correct: 1 },
      { q: "Can you help ___ with this heavy bag?", options: ["I", "my", "me", "mine"], correct: 2 },
      { q: "I bought ___ new car yesterday.", options: ["a", "an", "the", "some"], correct: 0 },
      { q: "They ___ visit London next year. They bought tickets.", options: ["will", "are going to", "going to", "are going"], correct: 1 },
      { q: "You ___ wear a uniform at our school. It's the rule.", options: ["must", "can", "would", "may"], correct: 0 },
      { q: "___ is your favorite actor?", options: ["What", "Where", "Who", "When"], correct: 2 },
      { q: "I ___ eat fast food. I hate it.", options: ["always", "often", "sometimes", "never"], correct: 3 },
      { q: "I was reading a book when the phone ___.", options: ["ring", "rings", "rang", "ringing"], correct: 2 },
      { q: "Russia is the ___ country in the world.", options: ["large", "larger", "largest", "most large"], correct: 2 },
      { q: "I need to ___ my homework before dinner.", options: ["make", "do", "take", "have"], correct: 1 },
      { q: "Have you ever ___ to Paris?", options: ["be", "was", "been", "went"], correct: 2 },
      { q: "If it rains, we ___ stay at home.", options: ["would", "will", "are", "do"], correct: 1 },
      { q: "I ___ my keys. I can't find them!", options: ["lost", "lose", "have lost", "am losing"], correct: 2 },
      { q: "She drives very ___.", options: ["careful", "carefully", "more careful", "care"], correct: 1 },
      { q: "There isn't ___ milk in the fridge.", options: ["some", "a", "many", "any"], correct: 3 },
      { q: "He is ___ boy in the class.", options: ["smart", "smarter", "the smartest", "most smart"], correct: 2 },
      { q: "I ___ a book at 8 o'clock yesterday.", options: ["read", "am reading", "was reading", "were reading"], correct: 2 },
      { q: "You ___ eat so much sugar. It's bad for you.", options: ["shouldn't", "don't", "mustn't", "haven't"], correct: 0 },
      { q: "How ___ water do you drink a day?", options: ["many", "much", "lots", "few"], correct: 1 },
      { q: "We have lived here ___ 2010.", options: ["for", "in", "since", "from"], correct: 2 },
      { q: "My car is ___ than yours.", options: ["expensive", "expensiver", "more expensive", "most expensive"], correct: 2 },
      { q: "Did you ___ TV last night?", options: ["watch", "watched", "watching", "watches"], correct: 0 },
      { q: "The room ___ cleaned every day.", options: ["is", "are", "was", "does"], correct: 0 },
      { q: "I am interested ___ learning French.", options: ["on", "at", "in", "about"], correct: 2 },
      { q: "She doesn't have ___ friends.", options: ["much", "many", "some", "a lot"], correct: 1 },
      { q: "___ you like a cup of tea?", options: ["Do", "Are", "Would", "Can"], correct: 2 },
      { q: "They ___ dinner when I arrived.", options: ["had", "were having", "have", "are having"], correct: 1 },
      { q: "I haven't finished my work ___.", options: ["already", "just", "yet", "still"], correct: 2 },
      { q: "Let's go to the cinema, ___?", options: ["will we", "shall we", "do we", "don't we"], correct: 1 },
      { q: "He usually ___ to work by bus.", options: ["go", "going", "goes", "is going"], correct: 2 }
    ]
  };

  // Initial empty array, will be populated on game start
  let currentQuestions = []; 

  // Constants & State
  const $ = (id) => document.getElementById(id);
  const state = {
    teamA: "Команда A",
    teamB: "Команда B",
    timerSec: 15,
    matchSec: 180,
    board: []
  };

  const activePick = { A: null, B: null };
  const timers = { A: { left: 15, interval: null }, B: { left: 15, interval: null } };
  const match = { left: 180, interval: null, running: false };

  // --- Theme Logic ---
  const initTheme = () => {
    const saved = localStorage.getItem('BA_PORTAL_THEME');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (systemDark ? 'dark' : 'light');
    
    document.body.className = theme;
    $('themeBtn').textContent = theme === 'dark' ? '🌙' : '☀️';
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
    let baseBank = [...QUIZ_BANKS[difficulty]];
    
    // Перемешиваем вопросы случайным образом
    baseBank.sort(() => Math.random() - 0.5);

    // Берем ровно 30 штук (чтобы заполнить поле без повторений)
    currentQuestions = baseBank.slice(0, 30); 

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
      toast(`${team === "A" ? state.teamA : state.teamB}: Туура жооп!`, true);
    } else {
      toast(`${team === "A" ? state.teamA : state.teamB}: Ката!`, false);
    }

    activePick[team] = null;
    stopTeamTimer(team);
    
    // Reset side
    const textEl = team === "A" ? UI.qTextA : UI.qTextB;
    const ansEl = team === "A" ? UI.answersA : UI.answersB;
    textEl.textContent = "Кезектеги плитканы тандаңыз";
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
      el.textContent = `⏱ ${timers[team].left}`;
      el.classList.toggle("danger", timers[team].left <= 5);

      if (timers[team].left <= 0) {
        toast("Убакыт бүттү!", false);
        solveQuestion(team, activePick[team], -1);
      }
    }, 1000);
  }

  function stopTeamTimer(team) {
    if (timers[team].interval) clearInterval(timers[team].interval);
    const el = team === "A" ? UI.timerA : UI.timerB;
    el.textContent = `⏱ ${state.timerSec}`;
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
    
    let a = 0, b = 0;
    state.board.forEach(t => {
      if (t.owner === "A") a++; else if (t.owner === "B") b++;
    });

    if (a > b) {
        UI.winTitle.textContent = `🏆 ${state.teamA} жеңди!`;
        fireConfetti();
    } else if (b > a) {
        UI.winTitle.textContent = `🏆 ${state.teamB} жеңди!`;
        fireConfetti();
    } else {
        UI.winTitle.textContent = "🤝 Тең чыгуу!";
    }

    UI.winSub.textContent = `Жыйынтык эсеп: ${a} — ${b}`;
    UI.winBackdrop.classList.remove("hidden");
  }

  function fireConfetti() {
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
      state.teamA = UI.teamAName.value.trim() || "Команда A";
      state.teamB = UI.teamBName.value.trim() || "Команда B";
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
