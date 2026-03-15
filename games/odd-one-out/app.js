/**
 * Bilim Arena - Odd One Out (Ашыкчаны тап)
 * Modern Refactored logic
 */

(function() {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const LS_KEY = "BA_ODD_TESTS_V1";

  const UI = {
    // start
    screenStart: $("screenStart"),
    selTypeSingle: $("selTypeSingle"),
    selTestSingle: $("selTestSingle"),
    inpRoundsSingle: $("inpRoundsSingle"),
    btnStartSingle: $("btnStartSingle"),

    selTypeTeams: $("selTypeTeams"),
    selTestTeams: $("selTestTeams"),
    inpRoundsTeams: $("inpRoundsTeams"),
    inpTimeTeams: $("inpTimeTeams"),
    btnStartTeams: $("btnStartTeams"),

    // editor
    editorType: $("editorType"),
    editorTitle: $("editorTitle"),
    editorText: $("editorText"),
    previewBox: $("previewBox"),
    btnSaveTest: $("btnSaveTest"),
    savedList: $("savedList"),
    btnDeleteAll: $("btnDeleteAll"),
    editorHint: $("editorHint"),

    // game
    screenGame: $("screenGame"),
    btnBackToMenu: $("btnBackToMenu"),
    roundNow: $("roundNow"),
    roundMax: $("roundMax"),
    scoreNow: $("scoreNow"),
    pillTime: $("pillTime"),
    timeNow: $("timeNow"),

    singleWrap: $("singleWrap"),
    gridSingle: $("gridSingle"),

    teamsWrap: $("teamsWrap"),
    gridA: $("gridA"),
    gridB: $("gridB"),
    scoreA: $("scoreA"),
    scoreB: $("scoreB"),
    statusA: $("statusA"),
    statusB: $("statusB"),
    btnSkipA: $("btnSkipA"),
    btnSkipB: $("btnSkipB"),

    // end
    screenEnd: $("screenEnd"),
    endTitle: $("endTitle"),
    endSubtitle: $("endSubtitle"),
    endStats: $("endStats"),
    btnPlayAgain: $("btnPlayAgain"),
    btnToStart: $("btnToStart"),

    toast: $("toast"),
  };

  const State = {
    mode: "single", // single|teams
    type: "text", // text|image
    testId: "",
    roundsMax: 12,
    timePerRound: 10,
    roundNow: 1,
    score: 0,
    A: { score: 0, done: false },
    B: { score: 0, done: false },
    timer: 10,
    timerHandle: null,
    current: null,
    deck: [],
    deckIndex: 0,
  };

  /* ---------- Storage ---------- */
  function loadTests() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return seedDefaultTests();
      return JSON.parse(raw);
    } catch {
      return seedDefaultTests();
    }
  }

  function saveTests(obj) { localStorage.setItem(LS_KEY, JSON.stringify(obj)); }

  function seedDefaultTests() {
    const obj = {
      text: [{
        id: "ky-basic",
        title: "Кыргыз тили (базалык)",
        sets: [
          setFrom(["алыш", "күрөш", "эр эңиш", "*футбол"]),
          setFrom(["ит", "мышык", "*тоок", "карышкыр"]),
          setFrom(["кызыл", "сары", "жашыл", "*китеп"]),
          setFrom(["алма", "өрүк", "алча", "*бадыраң"]),
        ]
      }],
      image: [{
        id: "demo-img",
        title: "Демо (сүрөттөр)",
        sets: [
          { items: ["https://picsum.photos/seed/1/400/300", "https://picsum.photos/seed/2/400/300", "https://picsum.photos/seed/3/400/300", "https://picsum.photos/seed/4/400/300"], oddIndex: 2 },
        ]
      }]
    };
    saveTests(obj);
    return obj;
  }

  function setFrom(arr) {
    const items = arr.map(s => s.trim());
    let oddIndex = items.findIndex(x => x.startsWith("*"));
    if (oddIndex === -1) oddIndex = 0;
    const clean = items.map(x => x.replace(/^\*/, "").trim());
    return { items: clean, oddIndex };
  }

  /* ---------- Utils ---------- */
  function toast(msg) {
    UI.toast.textContent = msg;
    UI.toast.classList.remove("hidden");
    clearTimeout(UI.toast._t);
    UI.toast._t = setTimeout(() => UI.toast.classList.add("hidden"), 2000);
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  /* ---------- UI Updates ---------- */
  function fillSelects() {
    const tests = loadTests();
    const populate = (sel, type) => {
      sel.innerHTML = "";
      tests[type].forEach(t => {
        const opt = new Option(`${t.title} (${t.sets.length})`, t.id);
        sel.appendChild(opt);
      });
    };
    populate(UI.selTestSingle, UI.selTypeSingle.value);
    populate(UI.selTestTeams, UI.selTypeTeams.value);
    renderSavedList();
  }

  function renderSavedList() {
    const tests = loadTests();
    const type = UI.editorType.value;
    UI.savedList.innerHTML = "";
    tests[type].forEach(t => {
      const div = document.createElement("div");
      div.className = "savedItem";
      div.innerHTML = `
        <div class="savedMeta">
          <div class="savedName">${escapeHtml(t.title)}</div>
          <div class="savedSmall">${t.sets.length} топтом</div>
        </div>
        <div class="savedBtns">
          <button class="btn small primary" onclick="window.baa_useTest('${type}', '${t.id}')">Тандоо</button>
          <button class="btn small danger" onclick="window.baa_delTest('${type}', '${t.id}')">Өчүрүү</button>
        </div>
      `;
      UI.savedList.appendChild(div);
    });
  }

  window.baa_useTest = (type, id) => {
    if (type === "text") { UI.selTypeSingle.value = "text"; UI.selTypeTeams.value = "text"; }
    else { UI.selTypeSingle.value = "image"; UI.selTypeTeams.value = "image"; }
    fillSelects();
    UI.selTestSingle.value = id;
    UI.selTestTeams.value = id;
    toast("Тест тандалды.");
  };

  window.baa_delTest = (type, id) => {
    if (!confirm("Өчүрүүгө макулсузбу?")) return;
    const tests = loadTests();
    tests[type] = tests[type].filter(t => t.id !== id);
    saveTests(tests);
    fillSelects();
    toast("Тест өчүрүлдү.");
  };

  /* ---------- Game Flow ---------- */
  function buildDeck(type, testId, rounds) {
    const tests = loadTests();
    const bank = tests[type].find(t => t.id === testId) || tests[type][0];
    const pool = bank.sets;
    const deck = [];
    for (let i = 0; i < rounds; i++) {
        deck.push({ ...pool[i % pool.length] });
    }
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function showScreen(name) {
    [UI.screenStart, UI.screenGame, UI.screenEnd].forEach(s => s.classList.add("hidden"));
    if (name === "start") UI.screenStart.classList.remove("hidden");
    if (name === "game") UI.screenGame.classList.remove("hidden");
    if (name === "end") UI.screenEnd.classList.remove("hidden");
  }

  function startRound() {
    if (State.roundNow > State.roundsMax) {
      endGame();
      return;
    }
    State.current = State.deck[State.roundNow - 1];
    UI.roundNow.textContent = State.roundNow;
    UI.roundMax.textContent = State.roundsMax;

    if (State.mode === "single") {
      UI.scoreNow.textContent = State.score;
      renderGrid(UI.gridSingle, (idx, btn) => onPick("single", idx, btn));
    } else {
      State.A.done = State.B.done = false;
      UI.scoreA.textContent = State.A.score;
      UI.scoreB.textContent = State.B.score;
      UI.statusA.textContent = "Тандаңыз";
      UI.statusB.textContent = "Тандаңыз";
      renderGrid(UI.gridA, (idx, btn) => onPick("A", idx, btn));
      renderGrid(UI.gridB, (idx, btn) => onPick("B", idx, btn));
      startTimer();
    }
  }

  function renderGrid(container, callback) {
    container.innerHTML = "";
    const items = State.current.items.map((val, idx) => ({ val, idx }));
    // Shuffle positions
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }

    items.forEach(item => {
      const btn = document.createElement("button");
      btn.className = "cardBtn";
      if (State.type === "image") {
        const img = document.createElement("img");
        img.src = item.val;
        btn.appendChild(img);
      } else {
        btn.textContent = item.val;
      }
      btn.onclick = () => callback(item.idx, btn);
      container.appendChild(btn);
    });
  }

  function onPick(who, idx, btn) {
    const isCorrect = idx === State.current.oddIndex;
    btn.classList.add(isCorrect ? "good" : "bad");

    if (who === "single") {
      if (isCorrect) State.score++;
      disableAll(UI.gridSingle);
      setTimeout(() => { State.roundNow++; startRound(); }, 800);
    } else {
      const team = who === "A" ? State.A : State.B;
      if (team.done) return;
      team.done = true;
      if (isCorrect) team.score++;
      UI[`status${who}`].textContent = isCorrect ? "✅ Туура" : "❌ Ката";
      disableAll(UI[`grid${who}`]);

      if (State.A.done && State.B.done) {
        stopTimer();
        setTimeout(() => { State.roundNow++; startRound(); }, 800);
      }
    }
  }

  function disableAll(container) {
    [...container.children].forEach(c => c.style.pointerEvents = "none");
  }

  function startTimer() {
    stopTimer();
    State.timer = State.timePerRound;
    UI.timeNow.textContent = State.timer;
    State.timerHandle = setInterval(() => {
      State.timer--;
      UI.timeNow.textContent = Math.max(0, State.timer);
      if (State.timer <= 0) {
        stopTimer();
        if (!State.A.done) { State.A.done = true; UI.statusA.textContent = "⏱ Убакыт бүттү"; disableAll(UI.gridA); }
        if (!State.B.done) { State.B.done = true; UI.statusB.textContent = "⏱ Убакыт бүттү"; disableAll(UI.gridB); }
        setTimeout(() => { State.roundNow++; startRound(); }, 800);
      }
    }, 1000);
  }

  function stopTimer() { clearInterval(State.timerHandle); }

  function endGame() {
    showScreen("end");
    UI.endStats.innerHTML = "";
    if (State.mode === "single") {
      UI.endSubtitle.textContent = `Сиз ${State.roundsMax} раунддан ${State.score} упай алдыңыз.`;
      addStat("Жалпы упай", State.score, `максимум ${State.roundsMax}`);
    } else {
      UI.endSubtitle.textContent = `${State.roundsMax} раунддук таймаш бүттү.`;
      addStat("Команда A", State.A.score, `упай`);
      addStat("Команда B", State.B.score, `упай`);
      UI.winnerText.textContent = State.A.score > State.B.score ? "🎉 Команда A жеңди!" : 
                                 State.B.score > State.A.score ? "🎉 Команда B жеңди!" : "🤝 Тең чыгуу!";
    }
  }

  function addStat(label, val, desc) {
    const div = document.createElement("div");
    div.className = "stat";
    div.innerHTML = `<div class="statDesc">${label}</div><div class="statVal">${val}</div><div class="statDesc">${desc}</div>`;
    UI.endStats.appendChild(div);
  }

  /* ---------- Events ---------- */
  function init() {
    UI.btnStartSingle.onclick = () => {
      State.mode = "single";
      State.type = UI.selTypeSingle.value;
      State.testId = UI.selTestSingle.value;
      State.roundsMax = parseInt(UI.inpRoundsSingle.value) || 12;
      State.score = 0;
      State.roundNow = 1;
      State.deck = buildDeck(State.type, State.testId, State.roundsMax);
      UI.singleWrap.classList.remove("hidden");
      UI.teamsWrap.classList.add("hidden");
      UI.pillTime.hidden = true;
      showScreen("game");
      startRound();
    };

    UI.btnStartTeams.onclick = () => {
      State.mode = "teams";
      State.type = UI.selTypeTeams.value;
      State.testId = UI.selTestTeams.value;
      State.roundsMax = parseInt(UI.inpRoundsTeams.value) || 12;
      State.timePerRound = parseInt(UI.inpTimeTeams.value) || 10;
      State.A.score = State.B.score = 0;
      State.roundNow = 1;
      State.deck = buildDeck(State.type, State.testId, State.roundsMax);
      UI.singleWrap.classList.add("hidden");
      UI.teamsWrap.classList.remove("hidden");
      UI.pillTime.hidden = false;
      showScreen("game");
      startRound();
    };

    UI.btnSaveTest.onclick = () => {
      const type = UI.editorType.value;
      const title = UI.editorTitle.value.trim() || (type === "text" ? "Жаңы тест" : "Жаңы сүрөт тести");
      const lines = UI.editorText.value.split("\n").filter(l => l.trim());
      const sets = lines.map(line => {
        const parts = line.split(",").map(p => p.trim());
        if (parts.length !== 4) return null;
        return setFrom(parts);
      }).filter(Boolean);

      if (!sets.length) return toast("Жарактуу топтомдор табылган жок!");
      const tests = loadTests();
      tests[type].push({ id: Date.now().toString(), title, sets });
      saveTests(tests);
      UI.editorTitle.value = UI.editorText.value = "";
      fillSelects();
      toast("Сакталды!");
    };

    UI.btnDeleteAll.onclick = () => {
      if (!confirm("Баарын өчүрүүгө макулсузбу?")) return;
      localStorage.removeItem(LS_KEY);
      fillSelects();
      toast("Бардык тесттер өчүрүлдү.");
    };

    UI.btnBackToMenu.onclick = UI.btnToStart.onclick = () => { stopTimer(); showScreen("start"); };
    UI.btnPlayAgain.onclick = () => { UI.btnToStart.onclick(); };
    UI.btnSkipA.onclick = () => onPick("A", -1, { classList: { add: () => {} } }); // Simulated miss
    UI.btnSkipB.onclick = () => onPick("B", -1, { classList: { add: () => {} } });

    UI.selTypeSingle.onchange = UI.selTypeTeams.onchange = UI.editorType.onchange = fillSelects;
    
    fillSelects();
  }

  init();
})();