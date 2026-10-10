(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const LS_KEY = "BA_ODD_TESTS_V1";
  const SCORE_KEY = "BA_ODD_HIGHSCORES";
  const BUILTIN = "builtin";

  // Язык сайта (shared/lang.js) и перевод строк интерфейса
  const LANG = window.BALang ? window.BALang.lang : "ky";
  const T = (s, v) => (window.BALang ? window.BALang.t(s, v) : s.replace(/\{(\w+)\}/g, (m, k) => (v && v[k] !== undefined ? v[k] : m)));

  /* ---------- Sound Engine (Web Audio API) ---------- */
  const Sound = {
    ctx: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    play(freq, type, duration) {
      try {
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
      } catch (e) { /* звука нет — игра продолжается */ }
    },
    success() {
      this.play(880, 'sine', 0.1);
      setTimeout(() => this.play(1320, 'sine', 0.15), 100);
    },
    error() { this.play(110, 'sawtooth', 0.3); }
  };

  /* ---------- State ---------- */
  const State = {
    mode: "single", // "single" or "teams"
    roundsMax: 10,
    roundNow: 1,
    score: 0,
    scoreA: 0,
    scoreB: 0,
    startTime: 0,
    timer: 10,
    timerTotal: 10,
    timerHandle: null,
    deck: [],
    current: null,
    highScores: [],
    difficulty: 'progressive',
    custom: false,
    teamStatus: { a: false, b: false }
  };

  /* ---------- Встроенные раунды на языке сайта (data.js) ---------- */
  const DATA = {};
  Object.entries(window.ODD_DATA || {}).forEach(([level, list]) => {
    DATA[level] = list.map((q) => q[LANG] || q.ky);
  });

  /* ---------- Тесты учителя (localStorage) ---------- */
  function loadTests() {
    try {
      const list = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      return Array.isArray(list) ? list.filter((t) => t && t.id && Array.isArray(t.rounds)) : [];
    } catch (e) { return []; }
  }
  function saveTests(list) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) { toast(T("Сактоо мүмкүн болгон жок")); }
  }

  /**
   * Строка редактора: «алма, өрүк, *бадыраң | Бадыраң — жашылча».
   * Нужно 3–8 элементов и ровно один со звёздочкой.
   */
  function parseEditor(text) {
    const rounds = [];
    const errors = [];
    String(text || "").split(/\r?\n/).forEach((line, i) => {
      const raw = line.trim();
      if (!raw) return;
      const [itemsPart, logicPart] = raw.split("|");
      const items = itemsPart.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);
      const odd = items.filter((s) => s.startsWith("*") && s.length > 1).length;
      if (items.length < 3 || odd !== 1) { errors.push(i + 1); return; }
      rounds.push({ items, logic: (logicPart || "").trim().slice(0, 200) });
    });
    return { rounds, errors };
  }

  function renderPreview() {
    const box = $("previewBox");
    const { rounds, errors } = parseEditor($("editorText").value);
    box.replaceChildren();
    if (!rounds.length && !errors.length) {
      const hint = document.createElement("div");
      hint.className = "hint";
      hint.textContent = T("Алдын ала көрүү бул жерде болот...");
      box.appendChild(hint);
      return;
    }
    rounds.forEach((r, i) => {
      const row = document.createElement("div");
      row.className = "previewRow";
      row.setAttribute("translate", "no");
      const n = document.createElement("b");
      n.textContent = `${i + 1}.`;
      row.appendChild(n);
      r.items.forEach((item) => {
        const chip = document.createElement("span");
        chip.className = "previewChip" + (item.startsWith("*") ? " odd" : "");
        chip.textContent = item.replace(/^\*/, "");
        row.appendChild(chip);
      });
      box.appendChild(row);
    });
    if (errors.length) {
      const err = document.createElement("div");
      err.className = "previewError";
      err.textContent = T("Текшериңиз: {lines}-сап(тар)", { lines: errors.join(", ") });
      box.appendChild(err);
    }
  }

  function renderSaved() {
    const tests = loadTests();
    const list = $("savedList");
    list.replaceChildren();
    if (!tests.length) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = T("Азырынча тест жок");
      list.appendChild(empty);
    }
    tests.forEach((test) => {
      const row = document.createElement("div");
      row.className = "savedItem";
      const name = document.createElement("span");
      name.setAttribute("translate", "no");
      name.textContent = test.title;
      const count = document.createElement("span");
      count.className = "mini";
      count.textContent = T("{n} раунд", { n: test.rounds.length });
      const del = document.createElement("button");
      del.type = "button";
      del.className = "btn small danger";
      del.textContent = T("Өчүрүү");
      del.addEventListener("click", () => {
        saveTests(loadTests().filter((t) => t.id !== test.id));
        renderSaved();
      });
      row.append(name, count, del);
      list.appendChild(row);
    });
    // Выбор теста в обоих режимах
    ["selTestSingle", "selTestTeams"].forEach((id) => {
      const sel = $(id);
      const prev = sel.value;
      sel.replaceChildren();
      const builtin = document.createElement("option");
      builtin.value = BUILTIN;
      builtin.textContent = T("Билим Арена топтому");
      sel.appendChild(builtin);
      tests.forEach((t) => {
        const o = document.createElement("option");
        o.value = t.id;
        o.textContent = t.title;
        sel.appendChild(o);
      });
      sel.value = [...sel.options].some((o) => o.value === prev) ? prev : BUILTIN;
    });
    $("btnDeleteAll").disabled = !tests.length;
  }

  function saveFromEditor() {
    const title = $("editorTitle").value.trim().slice(0, 60);
    const { rounds, errors } = parseEditor($("editorText").value);
    if (!title) { toast(T("Тесттин аталышын жазыңыз")); $("editorTitle").focus(); return; }
    if (!rounds.length) { toast(T("Кеминде бир туура сап керек")); $("editorText").focus(); return; }
    const tests = loadTests().filter((t) => t.title !== title);
    tests.push({ id: "t" + Date.now().toString(36), title, rounds });
    saveTests(tests);
    renderSaved();
    toast(errors.length ? T("Сакталды. Ката саптар кошулган жок: {lines}", { lines: errors.join(", ") }) : T("Сакталды!"));
  }

  /* ---------- High Scores ---------- */
  function loadHighScores() {
    try { State.highScores = JSON.parse(localStorage.getItem(SCORE_KEY) || "[]"); } catch (e) { State.highScores = []; }
    renderHighScores();
  }

  function saveHighScore(score) {
    State.highScores.push({ score, date: new Date().toLocaleDateString() });
    State.highScores.sort((a, b) => b.score - a.score);
    State.highScores = State.highScores.slice(0, 3);
    try { localStorage.setItem(SCORE_KEY, JSON.stringify(State.highScores)); } catch (e) { /* хранилище недоступно */ }
    renderHighScores();
  }

  function renderHighScores() {
    const list = $("highScoreList");
    if (!list) return;
    list.innerHTML = State.highScores.length
      ? State.highScores.map(s => `<div class="highScoreItem"><span class="name">${s.date}</span><span class="val">${T('{n} упай', { n: s.score })}</span></div>`).join('')
      : `<div class="highScoreItem">${T('Рекорддор жок')}</div>`;
  }

  /* ---------- Theme Management ---------- */
  window.setTheme = (t) => {
    let className = 'theme-midnight';
    if (t === 'deepspace') className = 'theme-deep-space';
    if (t === 'auralight') className = 'theme-aura-light';
    document.body.className = className;
  };

  /* ---------- Helper Utils ---------- */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  let toastTimer = 0;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add("hidden"), 2200);
  }

  function showScreen(name) {
    [$("screenStart"), $("screenGame"), $("screenEnd")].forEach(s => s.classList.add("hidden"));
    $(name === "game" ? "screenGame" : name === "end" ? "screenEnd" : "screenStart").classList.remove("hidden");
  }

  /* ---------- Game Flow ---------- */
  function customRounds(testId) {
    const test = loadTests().find((t) => t.id === testId);
    return test ? test.rounds.slice() : [];
  }

  /** count раундов из пула; если раундов меньше — пул повторяется в новом порядке */
  function takeRounds(pool, count) {
    const out = [];
    while (pool.length && out.length < count) out.push(...shuffle(pool.slice()));
    return out.slice(0, count);
  }

  function buildDeck(mode, testId) {
    State.custom = testId !== BUILTIN;
    if (State.custom) {
      const pool = customRounds(testId);
      return mode === 'single' ? shuffle(pool).slice(0, 10) : takeRounds(pool, State.roundsMax);
    }
    const getItems = (cat, count) => shuffle([...(DATA[cat] || [])]).slice(0, count);
    if (mode === 'single') {
      if (State.difficulty === 'progressive') {
        return [...getItems('easy', 3), ...getItems('medium', 4), ...getItems('hard', 3)];
      }
      return getItems(State.difficulty, 10);
    }
    // Команды: каждый раунд — случайный уровень, без повторов, пока хватает раундов
    const all = [...DATA.easy, ...DATA.medium, ...DATA.hard];
    return takeRounds(all, State.roundsMax);
  }

  function itemCount(items) {
    if (State.custom) return items.length;
    let n = 4;
    if (State.mode === "single") {
      if (State.difficulty === 'progressive') n = State.roundNow <= 3 ? 3 : (State.roundNow <= 7 ? 4 : 6);
      else n = State.difficulty === 'easy' ? 3 : (State.difficulty === 'medium' ? 4 : 6);
    }
    return Math.min(n, items.length);
  }

  function startRound() {
    if (State.roundNow > State.roundsMax || !State.deck[State.roundNow - 1]) {
      endGame();
      return;
    }

    State.current = State.deck[State.roundNow - 1];
    $("roundNow").textContent = State.roundNow;
    $("roundMax").textContent = State.roundsMax;

    if (State.mode === "single") {
      $("scoreNow").textContent = State.score;
      $("singleWrap").classList.remove("hidden");
      $("teamsWrap").classList.add("hidden");
      renderGrid("gridSingle", itemCount(State.current.items));
      State.startTime = Date.now();
      startTimer();
    } else {
      $("singleWrap").classList.add("hidden");
      $("teamsWrap").classList.remove("hidden");
      State.teamStatus = { a: false, b: false };
      $("statusA").textContent = T("Ойлонуп жатат...");
      $("statusB").textContent = T("Ойлонуп жатат...");
      renderGrid("gridA", itemCount(State.current.items));
      renderGrid("gridB", itemCount(State.current.items));
      startTimer();
    }
  }

  function renderGrid(containerId, count) {
    const container = $(containerId);
    container.innerHTML = "";

    const allItems = [...State.current.items];
    const oddItem = allItems.find(x => x.startsWith('*'));
    const normalItems = shuffle(allItems.filter(x => !x.startsWith('*')));
    const itemsToDisplay = [oddItem, ...normalItems.slice(0, count - 1)];
    const items = shuffle(itemsToDisplay.map(val => ({ val: val.replace(/^\*/, ''), isOdd: val.startsWith('*') })));

    items.forEach(item => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cardBtn";
      btn.textContent = item.val;
      btn.onclick = () => {
        if (State.mode === "single") onPickSingle(item.isOdd, btn);
        else onPickTeam(containerId.replace('grid', '').toLowerCase(), item.isOdd, btn);
      };
      container.appendChild(btn);
    });
  }

  function onPickSingle(isCorrect, btn) {
    stopTimer();
    const responseTime = Date.now() - State.startTime;
    [...$("gridSingle").children].forEach(c => { c.style.pointerEvents = "none"; });

    if (isCorrect) {
      Sound.success();
      btn.classList.add("good");
      let points = 10;
      if (responseTime < 2000) {
        points += 5; // быстрый ответ
        toast(T("КОМБО! +5 упай"));
      }
      State.score += points;
      $("scoreNow").textContent = State.score;
      showPlaque(State.current.logic);
    } else {
      Sound.error();
      btn.classList.add("bad");
      setTimeout(() => { State.roundNow++; startRound(); }, 1200);
    }
  }

  function teamDone(team) {
    State.teamStatus[team] = true;
    [...$(team === 'a' ? "gridA" : "gridB").children].forEach(c => { c.style.pointerEvents = "none"; });
    if (State.teamStatus.a && State.teamStatus.b) {
      stopTimer();
      setTimeout(() => { State.roundNow++; startRound(); }, 1500);
    }
  }

  function onPickTeam(team, isCorrect, btn) {
    if (State.teamStatus[team]) return;
    $(team === 'a' ? "statusA" : "statusB").textContent = isCorrect ? T("ТУУРА") : T("КАТА");
    btn.classList.add(isCorrect ? "good" : "bad");

    if (isCorrect) {
      if (team === 'a') { State.scoreA += 10; $("scoreA").textContent = State.scoreA; }
      else { State.scoreB += 10; $("scoreB").textContent = State.scoreB; }
      Sound.success();
    } else {
      Sound.error();
    }
    teamDone(team);
  }

  /** Команда пропускает раунд: очков нет, ждём вторую команду */
  function onSkipTeam(team) {
    if (State.mode !== "teams" || State.teamStatus[team]) return;
    $(team === 'a' ? "statusA" : "statusB").textContent = T("Өткөрүлдү");
    teamDone(team);
  }

  function showPlaque(text) {
    const plaque = $("logicPlaque");
    $("logicText").textContent = text || T("Туура жооп!");
    plaque.classList.add("show");
    setTimeout(() => {
      plaque.classList.remove("show");
      State.roundNow++;
      startRound();
    }, text ? 2400 : 1200);
  }

  function startTimer() {
    stopTimer();
    const teamSeconds = Math.min(30, Math.max(5, parseInt($("inpTimeTeams").value, 10) || 10));
    State.timer = State.timerTotal = State.mode === "single" ? 10 : teamSeconds;
    $("timerBar").hidden = false;
    const bar = $("timerProgress");
    bar.style.width = "100%";
    bar.classList.remove("danger");

    State.timerHandle = setInterval(() => {
      State.timer--;
      bar.style.width = (State.timer / State.timerTotal * 100) + "%";
      if (State.timer < 3) bar.classList.add("danger");

      if (State.timer <= 0) {
        stopTimer();
        Sound.error();
        if (State.mode === "single") {
          toast(T("Убакыт бүттү!"));
          [...$("gridSingle").children].forEach(c => { c.style.pointerEvents = "none"; });
          setTimeout(() => { State.roundNow++; startRound(); }, 1000);
        } else {
          State.teamStatus = { a: true, b: true };
          setTimeout(() => { State.roundNow++; startRound(); }, 1500);
        }
      }
    }, 1000);
  }

  function stopTimer() { clearInterval(State.timerHandle); }

  function endGame() {
    stopTimer();
    showScreen("end");
    const stats = $("endStats");

    if (State.mode === "single") {
      $("endSubtitle").textContent = T("Сиз {n} упай топтодуңуз!", { n: State.score });
      if (!State.custom) saveHighScore(State.score);
      stats.innerHTML = `<div class="stat"><div class="statDesc">${T("Жалпы упай")}</div><div class="statVal">${State.score}</div></div>`;
    } else {
      const winner = State.scoreA > State.scoreB ? T("Команда A жеңди!") : (State.scoreB > State.scoreA ? T("Команда B жеңди!") : T("Достук жеңди!"));
      $("endSubtitle").textContent = winner;
      stats.innerHTML = `
        <div class="stat"><div class="statDesc">${T("Команда A")}</div><div class="statVal">${State.scoreA}</div></div>
        <div class="stat"><div class="statDesc">${T("Команда B")}</div><div class="statVal">${State.scoreB}</div></div>
      `;
    }
  }

  function start(mode) {
    const testId = $(mode === "single" ? "selTestSingle" : "selTestTeams").value || BUILTIN;
    if (testId !== BUILTIN && !customRounds(testId).length) { toast(T("Бул тестте раунд жок")); return; }
    State.mode = mode;
    State.roundNow = 1;
    if (mode === "single") {
      State.score = 0;
      State.difficulty = $("selDifficulty").value;
      State.roundsMax = 10;
    } else {
      State.scoreA = 0; State.scoreB = 0;
      $("scoreA").textContent = "0"; $("scoreB").textContent = "0";
      State.roundsMax = Math.min(60, Math.max(5, parseInt($("inpRoundsTeams").value, 10) || 12));
    }
    State.deck = buildDeck(mode, testId);
    if (mode === "single") State.roundsMax = Math.min(State.roundsMax, State.deck.length);
    showScreen("game");
    startRound();
  }

  /* ---------- Events ---------- */
  function init() {
    loadHighScores();
    renderSaved();
    renderPreview();
    setTheme('auralight'); // платформа использует один светлый интерфейс

    $("btnStartSingle").onclick = () => start("single");
    $("btnStartTeams").onclick = () => start("teams");
    $("btnSkipA").onclick = () => onSkipTeam("a");
    $("btnSkipB").onclick = () => onSkipTeam("b");

    $("btnBackToMenu").onclick = $("btnToStart").onclick = () => {
      stopTimer();
      showScreen("start");
    };

    $("btnPlayAgain").onclick = () => start(State.mode);

    $("editorText").addEventListener("input", renderPreview);
    $("btnSaveTest").onclick = saveFromEditor;
    $("btnDeleteAll").onclick = () => {
      if (!confirm(T("Бардык сакталган тесттерди өчүрөсүзбү?"))) return;
      saveTests([]);
      renderSaved();
    };
  }

  init();
})();
