/**
 * Bilim Arena - Focus Duel (Фокус Дуэль)
 *
 * Встроенный набор (data.js) всегда берётся из кода и не копируется в
 * localStorage — так исправления вопросов доходят до всех. В хранилище
 * лежат только наборы учителя.
 */
(function() {
  'use strict';

  // Constants
  const LS_DB = "focus_duel_db_v1";
  const LEVELS = ["basic", "hard", "expert"];
  const DEFAULT_ID = "default";
  const $ = (id) => document.getElementById(id);
  const T = (s, v) => (window.BALang ? window.BALang.t(s, v) : s.replace(/\{(\w+)\}/g, (m, k) => (v && v[k] !== undefined ? v[k] : m)));

  // UI Elements
  const UI = {
    btnReset: $("btnReset"),
    btnTeacher: $("btnTeacher"),
    btnOpenSetup: $("btnOpenSetup"),
    btnOpenSetup2: $("btnOpenSetup2"),
    pillMode: $("pillMode"),
    pillLevel: $("pillLevel"),
    pillSet: $("pillSet"),
    turnInfo: $("turnInfo"),
    timeLeft: $("timeLeft"),
    progressFill: $("progressFill"),
    qPrompt: $("qPrompt"),
    qHint: $("qHint"),
    badgeInfo: $("badgeInfo"),
    status: $("status"),
    roundNum: $("roundNum"),
    roundsMax: $("roundsMax"),
    btnStartNow: $("btnStartNow"),
    duelGrid: $("duelGrid"),
    scoreA: $("scoreA"),
    scoreB: $("scoreB"),
    streakA: $("streakA"),
    streakB: $("streakB"),
    choicesA: $("choicesA"),
    choicesB: $("choicesB"),
    answers: $("answers"),
    setupModal: $("setupModal"),
    btnCloseSetup: $("btnCloseSetup"),
    selMode: $("selMode"),
    selLevel: $("selLevel"),
    inpTime: $("inpTime"),
    inpRounds: $("inpRounds"),
    selSet: $("selSet"),
    btnNewSet: $("btnNewSet"),
    btnDeleteSet: $("btnDeleteSet"),
    btnOpenEditor: $("btnOpenEditor"),
    edMain: $("edMain"),
    edCorrect: $("edCorrect"),
    edOptions: $("edOptions"),
    btnAdd: $("btnAdd"),
    btnOnlyConfirm: $("btnOnlyConfirm"),
    btnConfirmStart: $("btnConfirmStart"),
    winModal: $("winModal"),
    winTitle: $("winTitle"),
    winSub: $("winSub"),
    btnPlayAgain: $("btnPlayAgain"),
    btnCloseWin: $("btnCloseWin"),
    drawer: $("drawer"),
    drawerLevel: $("drawerLevel"),
    btnCloseEditor: $("btnCloseEditor"),
    edList: $("edList"),
    ioBox: $("ioBox"),
    btnExport: $("btnExport"),
    btnImport: $("btnImport"),
  };

  // State
  const State = {
    mode: "duel",
    level: "basic",
    timeSec: 8,
    rounds: 10,
    round: 0,
    turn: "A", // A|B
    scoreA: 0,
    scoreB: 0,
    streakA: 0,
    streakB: 0,
    activeQ: null,
    deck: [],
    locked: false,
    timerRAF: 0,
    timerStart: 0,
    db: null,
    teacherOn: false,
  };

  /* ---------- Наборы вопросов ---------- */
  const emptyLevels = () => ({ basic: [], hard: [], expert: [] });
  const defaultSet = () => ({ id: DEFAULT_ID, name: T("Базалык топтом"), data: window.FD_DEFAULT_SETS || emptyLevels() });

  function cleanQuestion(q) {
    if (!q || typeof q !== "object") return null;
    const main = String(q.main || "").trim().slice(0, 200);
    const correct = String(q.correct || "").trim().slice(0, 80);
    if (!main || !correct) return null;
    const options = (Array.isArray(q.options) ? q.options : [])
      .map((o) => String(o).trim().slice(0, 80)).filter(Boolean).slice(0, 6);
    return { id: String(q.id || uid()), type: "custom", main, correct, options, hint: String(q.hint || "").slice(0, 80) };
  }

  function loadDB() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(LS_DB) || "null"); } catch (e) { raw = null; }
    const db = { activeSetId: DEFAULT_ID, sets: [] };
    if (!raw || !Array.isArray(raw.sets)) return db;
    raw.sets.forEach((s) => {
      if (!s || !s.data) return;
      if (s.id === DEFAULT_ID) {
        // Раньше встроенный набор сохранялся целиком; переносим из него только вопросы учителя
        const own = emptyLevels();
        LEVELS.forEach((l) => { own[l] = (s.data[l] || []).filter((q) => q && q.type === "custom").map(cleanQuestion).filter(Boolean); });
        if (LEVELS.some((l) => own[l].length)) db.sets.push({ id: uid(), name: T("Менин суроолорум"), data: own });
        return;
      }
      const data = emptyLevels();
      LEVELS.forEach((l) => { data[l] = (s.data[l] || []).map(cleanQuestion).filter(Boolean); });
      db.sets.push({ id: String(s.id), name: String(s.name || T("Топтом")).slice(0, 60), data });
    });
    if (db.sets.some((s) => s.id === raw.activeSetId)) db.activeSetId = raw.activeSetId;
    return db;
  }

  function saveDB() {
    try { localStorage.setItem(LS_DB, JSON.stringify(State.db)); } catch (e) { toast(T("Сактоо мүмкүн болгон жок")); }
  }

  const allSets = () => [defaultSet(), ...State.db.sets];
  function getActiveSet() {
    return allSets().find(s => s.id === State.db.activeSetId) || defaultSet();
  }
  const isDefault = (set) => set.id === DEFAULT_ID;

  /** Набор учителя для изменений: если выбран встроенный — создаётся «Менин суроолорум» */
  function editableSet() {
    let set = getActiveSet();
    if (!isDefault(set)) return set;
    set = State.db.sets.find((s) => s.name === T("Менин суроолорум")) || null;
    if (!set) {
      set = { id: uid(), name: T("Менин суроолорум"), data: emptyLevels() };
      State.db.sets.push(set);
    }
    State.db.activeSetId = set.id;
    fillSetSelect();
    renderPills();
    toast(T("Суроолор «{name}» топтомуна кошулат", { name: set.name }));
    return set;
  }

  function getActivePool() {
    return getActiveSet().data[State.level] || [];
  }

  /* ---------- Utils ---------- */
  function uid() { return Math.random().toString(16).slice(2) + Date.now().toString(16); }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.add("hidden"), 2200);
  }

  /* ---------- UI Sync ---------- */
  function showModal(modal, show) {
    modal.classList.toggle("show", show);
    document.body.classList.toggle("modalOpen", show);
  }

  const LEVEL_LABEL = { basic: "Базалык", hard: "Кыйын", expert: "Эксперт" };

  function renderPills() {
    UI.pillMode.textContent = State.mode === "solo" ? T("СОЛО") : T("ДУЭЛЬ");
    UI.pillLevel.textContent = T(LEVEL_LABEL[State.level]);
    UI.pillSet.textContent = getActiveSet().name;
    UI.roundsMax.textContent = State.rounds;
    document.body.classList.toggle("solo", State.mode === "solo");
  }

  function updateHUD() {
    UI.scoreA.textContent = State.scoreA;
    UI.scoreB.textContent = State.scoreB;
    UI.streakA.textContent = State.streakA;
    UI.streakB.textContent = State.streakB;
    UI.roundNum.textContent = State.round;
    UI.turnInfo.textContent = State.mode === "duel" ? T("Кезек: {team}", { team: State.turn }) : "";
    UI.turnInfo.style.color = State.turn === "A" ? "var(--accent)" : "var(--accent2)";
  }

  /* ---------- Game Core ---------- */
  function resetMatch() {
    stopTimer();
    State.round = 0;
    State.scoreA = State.scoreB = 0;
    State.streakA = State.streakB = 0;
    State.turn = "A";
    State.locked = false;
    State.deck = [];
    updateHUD();
    UI.qPrompt.textContent = T("Даярсызбы?");
    UI.qHint.textContent = "";
    UI.answers.innerHTML = "";
    UI.choicesA.innerHTML = "";
    UI.choicesB.innerHTML = "";
    UI.badgeInfo.textContent = T("Даяр");
    UI.status.textContent = "";
    UI.timeLeft.textContent = State.timeSec.toFixed(1);
    UI.progressFill.style.width = "100%";
  }

  function startRound() {
    if (State.round >= State.rounds) {
      endMatch();
      return;
    }
    State.round++;
    updateHUD();
    pickAndShowQuestion();
  }

  /** Вопросы не повторяются, пока не закончится весь уровень */
  function nextQuestion() {
    if (!State.deck.length) State.deck = shuffle(getActivePool());
    return State.deck.pop();
  }

  function pickAndShowQuestion() {
    const q = nextQuestion();
    if (!q) {
      toast(T("Бул деңгээлде суроолор жок!"));
      State.round = Math.max(0, State.round - 1);
      updateHUD();
      return;
    }
    State.activeQ = q;
    State.locked = false;
    UI.badgeInfo.textContent = State.mode === "duel" ? T("Команда {team} жооп берет", { team: State.turn }) : T("Жооп бериңиз");
    UI.status.textContent = "";
    UI.qPrompt.textContent = q.main;
    UI.qHint.textContent = q.hint ? T(q.hint) : "";
    renderOptions(generateOptions(q));
    startTimer();
  }

  function generateOptions(q) {
    const opts = q.options ? [...q.options] : [];
    if (!opts.some((o) => o.trim().toLowerCase() === q.correct.trim().toLowerCase())) opts.push(q.correct);
    // Правильный ответ всегда среди показанных вариантов
    const wrong = shuffle(opts.filter((o) => o.trim().toLowerCase() !== q.correct.trim().toLowerCase())).slice(0, 5);
    return shuffle([q.correct, ...wrong]);
  }

  function renderOptions(opts) {
    const makeBtn = (side, text) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = side === "solo" ? "answerBtn" : "sideChoiceBtn";
      btn.textContent = text;
      btn.onclick = () => handleAnswer(side, text, btn);
      return btn;
    };

    UI.answers.innerHTML = "";
    UI.choicesA.innerHTML = "";
    UI.choicesB.innerHTML = "";

    if (State.mode === "solo") {
      opts.forEach(o => UI.answers.appendChild(makeBtn("solo", o)));
    } else {
      opts.forEach(o => {
        UI.choicesA.appendChild(makeBtn("A", o));
        UI.choicesB.appendChild(makeBtn("B", o));
      });
      // Отвечает только команда, чья очередь
      [...UI.choicesA.children].forEach((b) => { b.disabled = State.turn !== "A"; });
      [...UI.choicesB.children].forEach((b) => { b.disabled = State.turn !== "B"; });
    }
  }

  function handleAnswer(side, val, btn) {
    if (State.locked) return;
    if (State.mode === "duel" && side !== State.turn) return;

    State.locked = true;
    stopTimer();

    const ok = val.trim().toLowerCase() === State.activeQ.correct.trim().toLowerCase();
    btn.classList.add(ok ? "good" : "bad");
    markCorrect();

    if (ok) {
      if (side === "A" || side === "solo") { State.scoreA++; State.streakA++; }
      else { State.scoreB++; State.streakB++; }
      UI.status.textContent = T("Туура!");
    } else {
      if (side === "A" || side === "solo") State.streakA = 0;
      else State.streakB = 0;
      UI.status.textContent = T("Ката. Жооп: {answer}", { answer: State.activeQ.correct });
    }
    updateHUD();

    setTimeout(() => {
      if (State.mode === "duel") State.turn = State.turn === "A" ? "B" : "A";
      startRound();
    }, 1400);
  }

  function markCorrect() {
    const btns = document.querySelectorAll(".answerBtn, .sideChoiceBtn");
    btns.forEach(b => {
      if (b.textContent.trim().toLowerCase() === State.activeQ.correct.trim().toLowerCase()) {
        b.classList.add("good");
      }
      b.disabled = true;
    });
  }

  /* ---------- Timer ---------- */
  function startTimer() {
    stopTimer();
    State.timerStart = performance.now();
    const duration = State.timeSec * 1000;

    const tick = (now) => {
      const elapsed = now - State.timerStart;
      const left = Math.max(0, duration - elapsed);
      UI.timeLeft.textContent = (left / 1000).toFixed(1);
      UI.progressFill.style.width = `${(left / duration) * 100}%`;
      if (left <= 0) onTimeUp();
      else State.timerRAF = requestAnimationFrame(tick);
    };
    State.timerRAF = requestAnimationFrame(tick);
  }

  function stopTimer() {
    if (State.timerRAF) cancelAnimationFrame(State.timerRAF);
    State.timerRAF = 0;
  }

  function onTimeUp() {
    if (State.locked) return;
    State.locked = true;
    if (State.mode === "duel") { if (State.turn === "A") State.streakA = 0; else State.streakB = 0; }
    else State.streakA = 0;
    UI.status.textContent = T("Убакыт бүттү!");
    markCorrect();
    updateHUD();
    setTimeout(() => {
      if (State.mode === "duel") State.turn = State.turn === "A" ? "B" : "A";
      startRound();
    }, 1500);
  }

  function endMatch() {
    stopTimer();
    showModal(UI.winModal, true);
    if (State.mode === "solo") {
      UI.winTitle.textContent = T("Соло бүттү!");
      UI.winSub.textContent = T("Сиздин упайыңыз: {n} / {total}", { n: State.scoreA, total: State.rounds });
    } else {
      const winner = State.scoreA > State.scoreB ? T("Команда A жеңди!") :
                     (State.scoreB > State.scoreA ? T("Команда B жеңди!") : T("Тең чыгуу!"));
      UI.winTitle.textContent = winner;
      UI.winSub.textContent = T("Эсеп: {a} : {b}", { a: State.scoreA, b: State.scoreB });
    }
  }

  /* ---------- Setup & Editor ---------- */
  function fillSetSelect() {
    UI.selSet.innerHTML = "";
    allSets().forEach(s => UI.selSet.appendChild(new Option(s.name, s.id)));
    UI.selSet.value = getActiveSet().id;
    UI.btnDeleteSet.disabled = isDefault(getActiveSet());
  }

  function renderEditor() {
    const set = getActiveSet();
    const level = UI.drawerLevel.value || State.level;
    const list = set.data[level] || [];
    UI.edList.replaceChildren();
    const head = document.createElement("div");
    head.className = "muted small";
    head.textContent = isDefault(set)
      ? T("Базалык топтомду өзгөртүүгө болбойт. Жаңы суроолор өзүңүздүн топтомуңузга кошулат.")
      : T("{set}: {n} суроо", { set: set.name, n: list.length });
    UI.edList.appendChild(head);
    list.forEach((q) => {
      const row = document.createElement("div");
      row.className = "edItem";
      const text = document.createElement("div");
      text.className = "edText";
      text.setAttribute("translate", "no");
      const main = document.createElement("b");
      main.textContent = q.main;
      const ans = document.createElement("span");
      ans.className = "muted small";
      ans.textContent = "→ " + q.correct;
      text.append(main, ans);
      row.appendChild(text);
      if (!isDefault(set)) {
        const del = document.createElement("button");
        del.type = "button";
        del.className = "btn small danger";
        del.textContent = T("Өчүрүү");
        del.onclick = () => {
          set.data[level] = list.filter((x) => x.id !== q.id);
          saveDB(); State.deck = []; renderEditor();
        };
        row.appendChild(del);
      }
      UI.edList.appendChild(row);
    });
  }

  function openEditor() {
    UI.drawerLevel.value = State.level;
    renderEditor();
    UI.drawer.classList.add("show");
  }

  function exportSet() {
    const set = getActiveSet();
    const data = {};
    LEVELS.forEach((l) => { data[l] = (set.data[l] || []).map(({ main, correct, options, hint }) => ({ main, correct, options, hint })); });
    UI.ioBox.value = JSON.stringify(data, null, 2);
    UI.ioBox.select();
    if (navigator.clipboard) navigator.clipboard.writeText(UI.ioBox.value).then(() => toast(T("Көчүрүлдү!")), () => {});
  }

  /** Импорт: массив вопросов (в текущий уровень) или {basic, hard, expert} */
  function importSet() {
    let parsed;
    try { parsed = JSON.parse(UI.ioBox.value); } catch (e) { toast(T("JSON туура эмес")); return; }
    const byLevel = emptyLevels();
    if (Array.isArray(parsed)) byLevel[UI.drawerLevel.value || State.level] = parsed;
    else if (parsed && typeof parsed === "object") LEVELS.forEach((l) => { if (Array.isArray(parsed[l])) byLevel[l] = parsed[l]; });
    const set = editableSet();
    let added = 0;
    LEVELS.forEach((l) => {
      const qs = byLevel[l].map(cleanQuestion).filter(Boolean).slice(0, 500);
      set.data[l] = (set.data[l] || []).concat(qs);
      added += qs.length;
    });
    if (!added) { toast(T("Кошула турган суроо табылган жок")); return; }
    saveDB(); State.deck = []; renderEditor(); renderPills();
    toast(T("Кошулду: {n}", { n: added }));
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    UI.btnReset.onclick = () => { if (confirm(T("Азыркы оюнду токтотобузбу?"))) resetMatch(); };

    // Режим учителя показывает инструменты для своих вопросов. Данные хранятся
    // только на этом устройстве, поэтому пароль не нужен.
    UI.btnTeacher.onclick = () => {
      State.teacherOn = !State.teacherOn;
      document.body.classList.toggle("teacher-on", State.teacherOn);
      UI.btnTeacher.setAttribute("aria-pressed", String(State.teacherOn));
      toast(State.teacherOn ? T("Мугалим режими иштетилди") : T("Мугалим режими өчүрүлдү"));
      if (State.teacherOn) openEditor(); else UI.drawer.classList.remove("show");
    };

    UI.btnOpenSetup.onclick = UI.btnOpenSetup2.onclick = () => {
      UI.selMode.value = State.mode;
      UI.selLevel.value = State.level;
      UI.inpTime.value = State.timeSec;
      UI.inpRounds.value = State.rounds;
      fillSetSelect();
      showModal(UI.setupModal, true);
    };

    UI.btnCloseSetup.onclick = () => showModal(UI.setupModal, false);
    $("setupBackdrop").onclick = () => showModal(UI.setupModal, false);
    $("winBackdrop").onclick = () => showModal(UI.winModal, false);

    UI.btnConfirmStart.onclick = () => {
      applySetup();
      showModal(UI.setupModal, false);
      resetMatch();
      startRound();
    };

    UI.btnOnlyConfirm.onclick = () => {
      applySetup();
      showModal(UI.setupModal, false);
      resetMatch();
    };

    function applySetup() {
      State.mode = UI.selMode.value === "solo" ? "solo" : "duel";
      State.level = LEVELS.includes(UI.selLevel.value) ? UI.selLevel.value : "basic";
      State.timeSec = Math.min(30, Math.max(3, parseInt(UI.inpTime.value, 10) || 8));
      State.rounds = Math.min(100, Math.max(1, parseInt(UI.inpRounds.value, 10) || 10));
      State.db.activeSetId = UI.selSet.value;
      State.deck = [];
      saveDB();
      renderPills();
    }

    UI.selSet.onchange = () => { UI.btnDeleteSet.disabled = UI.selSet.value === DEFAULT_ID; };

    UI.btnNewSet.onclick = () => {
      const name = (prompt(T("Жаңы топтомдун аты:")) || "").trim().slice(0, 60);
      if (!name) return;
      const set = { id: uid(), name, data: emptyLevels() };
      State.db.sets.push(set);
      State.db.activeSetId = set.id;
      State.deck = [];
      saveDB(); fillSetSelect(); renderPills();
      toast(T("Топтом түзүлдү"));
    };

    UI.btnDeleteSet.onclick = () => {
      const set = allSets().find((s) => s.id === UI.selSet.value);
      if (!set || isDefault(set)) return;
      if (!confirm(T("«{name}» топтомун өчүрөсүзбү?", { name: set.name }))) return;
      State.db.sets = State.db.sets.filter((s) => s.id !== set.id);
      State.db.activeSetId = DEFAULT_ID;
      State.deck = [];
      saveDB(); fillSetSelect(); renderPills();
    };

    UI.btnAdd.onclick = () => {
      const q = cleanQuestion({
        main: UI.edMain.value,
        correct: UI.edCorrect.value,
        options: UI.edOptions.value.split(",")
      });
      if (!q) { toast(T("Сөз жана жооп керек!")); return; }
      const level = LEVELS.includes(UI.selLevel.value) ? UI.selLevel.value : State.level;
      const set = editableSet();
      set.data[level] = (set.data[level] || []).concat(q);
      saveDB();
      State.deck = [];
      UI.edMain.value = UI.edCorrect.value = UI.edOptions.value = "";
      toast(T("Кошулду!"));
    };

    UI.btnOpenEditor.onclick = () => { showModal(UI.setupModal, false); openEditor(); };
    UI.btnCloseEditor.onclick = () => UI.drawer.classList.remove("show");
    UI.drawerLevel.onchange = renderEditor;
    UI.btnExport.onclick = exportSet;
    UI.btnImport.onclick = importSet;

    UI.btnStartNow.onclick = () => { resetMatch(); startRound(); };
    UI.btnPlayAgain.onclick = () => { showModal(UI.winModal, false); resetMatch(); startRound(); };
    UI.btnCloseWin.onclick = () => showModal(UI.winModal, false);
  }

  /* ---------- Init ---------- */
  function init() {
    State.db = loadDB();
    document.body.dataset.theme = "light"; // платформа использует один светлый интерфейс
    renderPills();
    resetMatch();
    bindEvents();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
