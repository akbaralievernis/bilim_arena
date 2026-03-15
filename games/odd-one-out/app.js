(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const LS_KEY = "BA_ODD_TESTS_V1";
  const SCORE_KEY = "BA_ODD_HIGHSCORES";

  /* ---------- Sound Engine (Web Audio API) ---------- */
  const Sound = {
    ctx: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    play(freq, type, duration) {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    },
    success() { 
      this.play(880, 'sine', 0.1); 
      setTimeout(() => this.play(1320, 'sine', 0.15), 100);
    },
    error() { this.play(110, 'sawtooth', 0.3); }
  };

  /* ---------- State ---------- */
  const State = {
    mode: "single",
    type: "text",
    testId: "",
    roundsMax: 10,
    roundNow: 1,
    score: 0,
    startTime: 0,
    timer: 10,
    timerHandle: null,
    deck: [],
    current: null,
    highScores: [],
    quizBank: null,
    theme: 'midnight',
    difficulty: 'progressive'
  };

  /* ---------- Initialization & Data ---------- */
  async function loadData() {
    try {
      const resp = await fetch('./questions.json');
      State.quizBank = await resp.json();
    } catch (e) {
      console.error("Failed to load questions.json", e);
      // Fallback
      State.quizBank = { easy: [{ items: ["алма", "өрүк", "алча", "*бадыраң"], logic: "Жемиштер vs Жашылча" }] };
    }
  }

  function loadHighScores() {
    State.highScores = JSON.parse(localStorage.getItem(SCORE_KEY) || "[]");
    renderHighScores();
  }

  function saveHighScore(score) {
    State.highScores.push({ score, date: new Date().toLocaleDateString() });
    State.highScores.sort((a, b) => b.score - a.score);
    State.highScores = State.highScores.slice(0, 3);
    localStorage.setItem(SCORE_KEY, JSON.stringify(State.highScores));
    renderHighScores();
  }

  function renderHighScores() {
    const list = $("highScoreList");
    if (!list) return;
    list.innerHTML = State.highScores.length 
      ? State.highScores.map(s => `<div class="highScoreItem"><span class="name">${s.date}</span><span class="val">${s.score} упай</span></div>`).join('')
      : `<div class="highScoreItem">Рекорддор жок</div>`;
  }

  window.setTheme = (t) => {
    let className = 'theme-midnight';
    if (t === 'deepspace') className = 'theme-deep-space';
    if (t === 'auralight') className = 'theme-aura-light';
    
    document.body.className = className;
    document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
    const activeDot = document.querySelector(`.dot.${t}`);
    if (activeDot) activeDot.classList.add('active');
    State.theme = t;
  };

  /* ---------- Game Flow ---------- */
  function buildDeck() {
    const deck = [];
    const getItems = (cat, count) => {
      let pool = [...(State.quizBank[cat] || [])];
      shuffle(pool);
      return pool.slice(0, count);
    };

    if (State.difficulty === 'progressive') {
      deck.push(...getItems('easy', 3));
      deck.push(...getItems('medium', 4));
      deck.push(...getItems('hard', 3));
    } else {
      deck.push(...getItems(State.difficulty, 10));
    }

    return deck;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function showScreen(name) {
    [$("screenStart"), $("screenGame"), $("screenEnd")].forEach(s => s.classList.add("hidden"));
    if (name === "start") $("screenStart").classList.remove("hidden");
    if (name === "game") $("screenGame").classList.remove("hidden");
    if (name === "end") $("screenEnd").classList.remove("hidden");
  }

  function startRound() {
    if (State.roundNow > State.roundsMax) {
      endGame();
      return;
    }
    
    State.current = State.deck[State.roundNow - 1];
    $("roundNow").textContent = State.roundNow;
    $("roundMax").textContent = State.roundsMax;
    $("scoreNow").textContent = State.score;

    // Progression logic for item count
    let allItems = [...State.current.items];
    let itemCount = 3;
    
    if (State.difficulty === 'progressive') {
      itemCount = State.roundNow <= 3 ? 3 : (State.roundNow <= 7 ? 4 : 6);
    } else {
      itemCount = State.difficulty === 'easy' ? 3 : (State.difficulty === 'medium' ? 4 : 6);
    }
    let itemsToDisplay = [];
    const oddItem = allItems.find(x => x.startsWith('*'));
    const normalItems = allItems.filter(x => !x.startsWith('*'));
    
    shuffle(normalItems);
    itemsToDisplay = [oddItem, ...normalItems.slice(0, itemCount - 1)];
    
    renderGrid(itemsToDisplay);
    State.startTime = Date.now();
    startTimer();
  }

  function renderGrid(itemsRaw) {
    const container = $("gridSingle");
    container.innerHTML = "";
    
    const items = itemsRaw.map((val, idx) => ({ val: val.replace(/^\*/, ''), isOdd: val.startsWith('*') }));
    shuffle(items);

    items.forEach(item => {
      const btn = document.createElement("button");
      btn.className = "cardBtn";
      btn.textContent = item.val;
      btn.onclick = () => onPick(item.isOdd, btn);
      container.appendChild(btn);
    });
  }

  function onPick(isCorrect, btn) {
    stopTimer();
    const responseTime = Date.now() - State.startTime;
    
    if (isCorrect) {
      Sound.success();
      btn.classList.add("good");
      let points = 10;
      if (responseTime < 2000) {
        points += 5; // Combo bonus
        toast("⚡ КОМБО! +5 упай");
      }
      State.score += points;
      showPlaque(State.current.logic);
    } else {
      Sound.error();
      btn.classList.add("bad");
      setTimeout(() => { State.roundNow++; startRound(); }, 1000);
    }
    
    [...$("gridSingle").children].forEach(c => c.style.pointerEvents = "none");
  }

  function showPlaque(text) {
    const plaque = $("logicPlaque");
    $("logicText").textContent = text || "Туура жооп!";
    plaque.classList.add("show");
    setTimeout(() => {
      plaque.classList.remove("show");
      State.roundNow++;
      startRound();
    }, 1800);
  }

  function startTimer() {
    stopTimer();
    State.timer = 10;
    $("timerBar").hidden = false;
    const bar = $("timerProgress");
    bar.style.width = "100%";
    bar.classList.remove("danger");

    State.timerHandle = setInterval(() => {
      State.timer--;
      bar.style.width = (State.timer * 10) + "%";
      if (State.timer < 3) bar.classList.add("danger");
      
      if (State.timer <= 0) {
        stopTimer();
        Sound.error();
        toast("Убакыт бүттү!");
        setTimeout(() => { State.roundNow++; startRound(); }, 1000);
      }
    }, 1000);
  }

  function stopTimer() { clearInterval(State.timerHandle); }

  function endGame() {
    showScreen("end");
    $("endSubtitle").textContent = `Сиз ${State.score} упай топтодуңуз!`;
    saveHighScore(State.score);
  }

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), 2000);
  }

  /* ---------- Events ---------- */
  async function init() {
    await loadData();
    loadHighScores();

    $("btnStartSingle").onclick = () => {
      State.score = 0;
      State.roundNow = 1;
      State.difficulty = $("selDifficulty").value;
      State.deck = buildDeck();
      showScreen("game");
      startRound();
    };

    $("btnBackToMenu").onclick = $("btnToStart").onclick = () => {
      stopTimer();
      showScreen("start");
    };

    $("btnPlayAgain").onclick = () => $("btnStartSingle").click();
  }

  init();
})();
