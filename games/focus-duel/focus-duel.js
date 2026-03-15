/**
 * Bilim Arena - Focus Duel (Фокус Дуэль)
 * Refactored modular logic
 */

(function() {
  'use strict';

  // Constants
  const LS_DB = "focus_duel_db_v1";
  const LS_STATS = "focus_duel_wordstats_v1";
  const LS_THEME = "focus_duel_theme_v1";
  const TEACHER_PIN = "1234";

  const $ = (id) => document.getElementById(id);

  // UI Elements
  const UI = {
    // top
    btnTheme: $("btnTheme"),
    btnReset: $("btnReset"),
    btnTeacher: $("btnTeacher"),
    btnOpenSetup: $("btnOpenSetup"),
    btnOpenSetup2: $("btnOpenSetup2"),
    
    // arena
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

    // duel
    duelGrid: $("duelGrid"),
    teamA: $("teamA"),
    teamB: $("teamB"),
    scoreA: $("scoreA"),
    scoreB: $("scoreB"),
    streakA: $("streakA"),
    streakB: $("streakB"),
    choicesA: $("choicesA"),
    choicesB: $("choicesB"),
    msgA: $("msgA"),
    msgB: $("msgB"),

    // solo
    answers: $("answers"),

    // setup modal
    setupModal: $("setupModal"),
    btnCloseSetup: $("btnCloseSetup"),
    selMode: $("selMode"),
    selLevel: $("selLevel"),
    inpTime: $("inpTime"),
    inpRounds: $("inpRounds"),
    selTopic: $("selTopic"),
    selSet: $("selSet"),
    btnNewSet: $("btnNewSet"),
    btnDeleteSet: $("btnDeleteSet"),
    edMain: $("edMain"),
    edCorrect: $("edCorrect"),
    edOptions: $("edOptions"),
    btnAdd: $("btnAdd"),
    btnOnlyConfirm: $("btnOnlyConfirm"),
    btnConfirmStart: $("btnConfirmStart"),

    // win modal
    winModal: $("winModal"),
    winTitle: $("winTitle"),
    winSub: $("winSub"),
    btnPlayAgain: $("btnPlayAgain"),
    btnCloseWin: $("btnCloseWin"),

    // drawer
    drawer: $("drawer"),
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
    rounds: 10,
    timeSec: 8,
    topic: "all",
    
    // runtime
    round: 0,
    turn: "A", // A|B
    scoreA: 0,
    scoreB: 0,
    streakA: 0,
    streakB: 0,
    activeQ: null,
    locked: false,
    
    timerRAF: 0,
    timerStart: 0,

    db: null,
    stats: null,
    teacherOn: false,
  };

  /* ---------- Initialization & DB ---------- */
  function loadDB() {
    const raw = localStorage.getItem(LS_DB);
    if (!raw) return {
      activeSetId: "default",
      sets: [{ id: "default", name: "Базалык топтом", data: window.FD_DEFAULT_SETS }]
    };
    return JSON.parse(raw);
  }

  function saveDB() { localStorage.setItem(LS_DB, JSON.stringify(State.db)); }

  function getActiveSet() {
    return State.db.sets.find(s => s.id === State.db.activeSetId) || State.db.sets[0];
  }

  function getActivePool() {
    const set = getActiveSet();
    return set.data[State.level] || [];
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
    t._tm = setTimeout(() => t.classList.add("hidden"), 2000);
  }

  /* ---------- UI Sync ---------- */
  function applyTheme(isDark) {
    document.body.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem(LS_THEME, isDark ? "dark" : "light");
  }

  function showModal(modal, show) {
    modal.classList.toggle("show", show);
    document.body.classList.toggle("modalOpen", show);
  }

  function renderPills() {
    UI.pillMode.textContent = State.mode.toUpperCase();
    UI.pillLevel.textContent = State.level.toUpperCase();
    UI.pillSet.textContent = getActiveSet().name;
    UI.roundsMax.textContent = State.rounds;
  }

  function updateHUD() {
    UI.scoreA.textContent = State.scoreA;
    UI.scoreB.textContent = State.scoreB;
    UI.streakA.textContent = State.streakA;
    UI.streakB.textContent = State.streakB;
    UI.roundNum.textContent = State.round;
    UI.turnInfo.textContent = State.mode === "duel" ? `Кезек: ${State.turn}` : "";
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
    updateHUD();
    UI.qPrompt.textContent = "Даярсызбы?";
    UI.qHint.textContent = "";
    UI.answers.innerHTML = "";
    UI.choicesA.innerHTML = "";
    UI.choicesB.innerHTML = "";
    UI.badgeInfo.textContent = "Даяр";
    UI.status.textContent = "";
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

  function pickAndShowQuestion() {
    const pool = getActivePool();
    if (!pool.length) {
      toast("Суроолор жок!");
      return;
    }
    
    // Simple random pick (can be improved with spaced repetition later)
    State.activeQ = pool[Math.floor(Math.random() * pool.length)];
    State.locked = false;
    UI.qPrompt.textContent = State.activeQ.main;
    UI.qHint.textContent = State.activeQ.hint || "";
    
    const options = generateOptions(State.activeQ);
    renderOptions(options);
    startTimer();
  }

  function generateOptions(q) {
    let opts = q.options ? [...q.options] : [];
    if (!opts.includes(q.correct)) opts.push(q.correct);
    
    // Default options for common types if missing
    if (opts.length < 2) {
      if (q.type === "article") opts = ["der", "die", "das"];
      else if (q.type === "case") opts = ["dem", "den", "der", "die"];
      else if (q.type === "verb") opts = ["bin", "bist", "ist", "sind"];
    }
    
    return shuffle(opts).slice(0, 6);
  }

  function renderOptions(opts) {
    const makeBtn = (side, text) => {
      const btn = document.createElement("button");
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
    }
  }

  function handleAnswer(side, val, btn) {
    if (State.locked) return;
    if (State.mode === "duel" && side !== State.turn) return;

    State.locked = true;
    stopTimer();

    const ok = val.trim().toLowerCase() === State.activeQ.correct.trim().toLowerCase();
    
    // Visual feedback
    btn.classList.add(ok ? "good" : "bad");
    markCorrect();

    if (ok) {
      if (side === "A" || side === "solo") { State.scoreA++; State.streakA++; State.streakB = 0; }
      else { State.scoreB++; State.streakB++; State.streakA = 0; }
      UI.status.textContent = "Туура! ✅";
    } else {
      if (side === "A" || side === "solo") State.streakA = 0;
      else State.streakB = 0;
      UI.status.textContent = `Ката ❌ (Жооп: ${State.activeQ.correct})`;
    }

    // Next turn or round
    setTimeout(() => {
      if (State.mode === "duel") {
        State.turn = State.turn === "A" ? "B" : "A";
        // Start round only after both teams had a chance if needed, or simple alternate
        startRound();
      } else {
        startRound();
      }
    }, 1200);
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
      const p = (left / duration) * 100;

      UI.timeLeft.textContent = (left / 1000).toFixed(1);
      UI.progressFill.style.width = `${p}%`;

      if (left <= 0) {
        onTimeUp();
      } else {
        State.timerRAF = requestAnimationFrame(tick);
      }
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
    UI.status.textContent = "Убакыт бүттү! ⏱";
    markCorrect();
    setTimeout(() => {
      if (State.mode === "duel") State.turn = State.turn === "A" ? "B" : "A";
      startRound();
    }, 1500);
  }

  function endMatch() {
    stopTimer();
    showModal(UI.winModal, true);
    if (State.mode === "solo") {
      UI.winTitle.textContent = "Соло бүткөн!";
      UI.winSub.textContent = `Сиздин упайыңыз: ${State.scoreA}`;
    } else {
      const winner = State.scoreA > State.scoreB ? "Команда A жеңди!" : 
                     (State.scoreB > State.scoreA ? "Команда B жеңди!" : "Тең чыгуу!");
      UI.winTitle.textContent = winner;
      UI.winSub.textContent = `Эсеп: ${State.scoreA} : ${State.scoreB}`;
    }
  }

  /* ---------- Setup & Editor ---------- */
  function fillTopicSelect() {
    UI.selTopic.innerHTML = '<option value="all">Баары</option>';
    const pool = getActivePool();
    const cats = [...new Set(pool.map(q => q.cat).filter(Boolean))];
    cats.forEach(c => {
      const opt = new Option(c, c);
      UI.selTopic.appendChild(opt);
    });
  }

  function fillSetSelect() {
    UI.selSet.innerHTML = "";
    State.db.sets.forEach(s => {
      UI.selSet.appendChild(new Option(s.name, s.id));
    });
    UI.selSet.value = State.db.activeSetId;
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    UI.btnTheme.onclick = () => applyTheme(document.body.dataset.theme !== "dark");
    UI.btnReset.onclick = () => { if(confirm("Азыркы оюнду токтотобузбу?")) resetMatch(); };
    
    UI.btnTeacher.onclick = () => {
        if (State.teacherOn) {
            State.teacherOn = false;
            document.body.classList.remove("teacher-on");
            toast("Мугалим режими өчүрүлдү");
        } else {
            const pin = prompt("ПИН-кодду жазыңыз:");
            if (pin === TEACHER_PIN) {
                State.teacherOn = true;
                document.body.classList.add("teacher-on");
                toast("Мугалим режими иштетилди");
            } else {
                toast("ПИН туура эмес!");
            }
        }
    };

    UI.btnOpenSetup.onclick = UI.btnOpenSetup2.onclick = () => {
      UI.selMode.value = State.mode;
      UI.selLevel.value = State.level;
      UI.inpTime.value = State.timeSec;
      UI.inpRounds.value = State.rounds;
      fillSetSelect();
      fillTopicSelect();
      showModal(UI.setupModal, true);
    };

    UI.btnCloseSetup.onclick = () => showModal(UI.setupModal, false);

    UI.btnConfirmStart.onclick = () => {
        applySetup();
        showModal(UI.setupModal, false);
        resetMatch();
        startRound();
    };

    UI.btnOnlyConfirm.onclick = () => {
        applySetup();
        showModal(UI.setupModal, false);
    };

    function applySetup() {
        State.mode = UI.selMode.value;
        State.level = UI.selLevel.value;
        State.timeSec = parseInt(UI.inpTime.value) || 8;
        State.rounds = parseInt(UI.inpRounds.value) || 10;
        State.db.activeSetId = UI.selSet.value;
        saveDB();
        renderPills();
    }

    UI.btnAdd.onclick = () => {
        const q = {
            id: uid(),
            main: UI.edMain.value.trim(),
            correct: UI.edCorrect.value.trim(),
            options: UI.edOptions.value.split(",").map(o => o.trim()).filter(Boolean),
            type: "custom"
        };
        if (!q.main || !q.correct) { toast("Сөз жана жооп керек!"); return; }
        
        const set = getActiveSet();
        if (!set.data[State.level]) set.data[State.level] = [];
        set.data[State.level].push(q);
        saveDB();
        UI.edMain.value = UI.edCorrect.value = UI.edOptions.value = "";
        toast("Кошулду!");
    };

    UI.btnStartNow.onclick = () => { resetMatch(); startRound(); };
    UI.btnPlayAgain.onclick = () => { showModal(UI.winModal, false); resetMatch(); startRound(); };
    UI.btnCloseWin.onclick = () => showModal(UI.winModal, false);
  }

  /* ---------- Init ---------- */
  function init() {
    State.db = loadDB();
    const savedTheme = localStorage.getItem(LS_THEME) || "dark";
    applyTheme(savedTheme === "dark");
    
    renderPills();
    resetMatch();
    bindEvents();
    
    // Initial UI state
    UI.roundsMax.textContent = State.rounds;
  }

  document.addEventListener("DOMContentLoaded", init);

})();