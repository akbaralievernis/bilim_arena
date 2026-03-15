(() => {
  "use strict";

  // --- UTILS ---
  const $ = (sel, root = document) => root.querySelector(sel);
  const now = () => performance.now();
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const fmtInt = (n) => String(Math.max(0, Math.floor(n)));
  const fmtMult = (x) => `x${x.toFixed(1)}`;

  function splitIntoSentences(text) {
    const t = (text || "").replace(/\s+/g, " ").trim();
    if (!t) return [];
    const raw = t.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    return raw.length ? raw : [t];
  }

  function tokenize(sentence) {
    const parts = sentence.split(/\s+/).filter(Boolean);
    return parts
      .map(w => w.replace(/^[^\wА-Яа-яЁёÀ-ž']+|[^\wА-Яа-яЁёÀ-ž']+$/g, ""))
      .filter(Boolean);
  }

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rand) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // --- CONFIG & CONSTANTS ---
  const PRESETS = {
    text_easy: "Кот спит. Мы идем домой. Собака громко лает. Небо очень синее. Мама мыла раму.",
    text_medium: "Сегодня мы тренируем внимание и память. Скорость важна, но точность гораздо важнее. Сосредоточься и действуй уверенно.",
    text_expert: "Интегральное исчисление является важной частью математического анализа. Разработка современных приложений требует тщательного планирования архитектуры."
  };

  const I18N = {
    ru: {
      subtitle: "🧩 Собери предложение • 👆 Нажимай слова снизу",
      pause: "⏸ Пауза",
      resume: "▶ Продолжить",
      startBtn: "🚀 Старт",
      timeUp: "⏰ Время вышло!",
      winnerA: "👑 Победитель: Команда A",
      winnerB: "👑 Победитель: Команда B",
      draw: "🤝 Ничья!",
      noteReady: (n) => `✅ Готово: ${n} раунд(ов). Жми «🚀 Старт».`,
      notePlayText: "👆 Нажимай слова по порядку: 1 → 2 → 3…",
      noteRoundsOver: "🏁 Раунды завершены."
    },
    en: {
      subtitle: "🧩 Build the sentence • 👆 Tap the words",
      pause: "⏸ Pause",
      resume: "▶ Resume",
      startBtn: "🚀 Start",
      timeUp: "⏰ Time is up!",
      winnerA: "👑 Winner: Team A",
      winnerB: "👑 Winner: Team B",
      draw: "🤝 Draw!",
      noteReady: (n) => `✅ Ready: ${n} rounds. Press «🚀 Start».`,
      notePlayText: "👆 Tap words in order: 1 → 2 → 3…",
      noteRoundsOver: "🏁 Rounds finished."
    },
    ky: {
      subtitle: "🧩 Сүйлөмдү түз • 👆 Сөздөрдү бас",
      pause: "⏸ Тыным",
      resume: "▶ Улантуу",
      startBtn: "🚀 Башта",
      timeUp: "⏰ Убакыт бүттү!",
      winnerA: "👑 Жеңүүчү: Команда A",
      winnerB: "👑 Жеңүүчү: Команда B",
      draw: "🤝 Тең чыгышты!",
      noteReady: (n) => `✅ Даяр: ${n} раунд. «🚀 Башта» бас.`,
      notePlayText: "👆 Сөздөрдү тартип менен бас...",
      noteRoundsOver: "🏁 Раунддар бүттү."
    }
  };

  // --- STATE ---
  let UI = {}; // Инициализируем пустым объектом сразу

  const Game = {
    config: { baseFlashMs: 800, globalSeconds: 60, penaltyOn3Wrong: 150, comboEnabled: true, comboEvery: 3, comboAdd: 0.1, comboMax: 2.0, hiddenMode: false, hideMs: 2000, soloMode: false, mode: "text" },
    sentences: [], mathRounds: [], seedBase: 123456789, running: false, globalEndAt: 0, globalTickId: 0, paused: false,
    teams: { A: mkTeamState("A"), B: mkTeamState("B") }
  };

  function mkTeamState(key) {
    return { key, idx: 0, phase: "idle", words: [], placed: [], score: 0, comboStreak: 0, comboMultiplier: 1.0, flashIndex: 0, flashTimerId: 0, decayTickId: 0 };
  }

  // --- CORE FUNCTIONS ---
  function getLang() { return localStorage.getItem("ld_lang") || "ky"; }
  function getTheme() { return localStorage.getItem("BA_PORTAL_THEME") || "dark"; }

  function zFor(k) { 
    const team = (k === "A") ? UI.teamA : UI.teamB;
    // Если UI еще не готов, возвращаем заглушки, чтобы не было TypeError
    if (!team) return { note: {}, score: {}, round: {}, combo: {}, hintBtn: {}, flash: {}, slots: {}, tiles: {}, mathArea: {}, mathOptions: {} };
    return team;
  }

  function setNote(k, txt) { if (zFor(k).note) zFor(k).note.textContent = txt; }
  function setScore(k) { 
    const t = Game.teams[k];
    if (zFor(k).score) zFor(k).score.textContent = fmtInt(t.score);
    const vsS = $(`#vsScore${k}`);
    if (vsS) vsS.textContent = fmtInt(t.score);
    updateVsBar();
  }
  function setRound(k) { if (zFor(k).round) zFor(k).round.textContent = totalRounds() ? `${Game.teams[k].idx + 1}/${totalRounds()}` : "—"; }
  function setCombo(k) { if (zFor(k).combo) zFor(k).combo.textContent = fmtMult(Game.teams[k].comboMultiplier); }

  function updateVsBar() {
    const a = Game.teams.A.score, b = Game.teams.B.score, total = a + b;
    const fA = $("#vsFillA"), fB = $("#vsFillB");
    if (!fA || !fB) return;
    const pA = total === 0 ? 50 : (a / total) * 100;
    fA.style.width = `${pA}%`; fB.style.width = `${100 - pA}%`;
  }

  function totalRounds() { return Game.config.mode === "math" ? Game.mathRounds.length : Game.sentences.length; }
  function getRoundAt(i) { return Game.config.mode === "math" ? Game.mathRounds[i] : Game.sentences[i]; }

  function applyI18n() {
    const T = I18N[getLang()];
    if (UI.subtitle) UI.subtitle.textContent = T.subtitle;
    if (UI.startBtn) UI.startBtn.textContent = T.startBtn;
    if (UI.pauseBtn) UI.pauseBtn.textContent = Game.paused ? T.resume : T.pause;
  }

  function applySetup() {
    if (Game.config.mode === "math") {
      Game.mathRounds = buildMathRounds(10); Game.sentences = [];
    } else {
      const txt = UI.textInput ? UI.textInput.value.trim() : "";
      Game.sentences = splitIntoSentences(txt).filter(s => tokenize(s).length >= 2);
    }
    if (UI.setupOverlay) UI.setupOverlay.classList.remove("show");
    const T = I18N[getLang()];
    setNote("A", T.noteReady(totalRounds())); setNote("B", T.noteReady(totalRounds()));
  }

  function buildMathRounds(count) {
    const r = []; const rand = mulberry32(Date.now());
    for (let i = 0; i < count; i++) {
      const a = Math.floor(rand() * 20) + 1, b = Math.floor(rand() * 20) + 1;
      const ans = a + b; const opts = new Set([ans]);
      while (opts.size < 3) opts.add(ans + (Math.floor(rand() * 10) - 5) || 1);
      r.push({ expr: `${a} + ${b}`, answer: ans, options: shuffle([...opts], rand) });
    }
    return r;
  }

  function startGame() {
    if (Game.running || totalRounds() === 0) return;
    Game.running = true; Game.paused = false;
    UI.startBtn.classList.add("disabled");
    
    for (const k of ["A", "B"]) {
      Game.teams[k] = mkTeamState(k);
      setScore(k); setRound(k); setCombo(k);
    }
    Game.globalEndAt = now() + Game.config.globalSeconds * 1000;
    Game.globalTickId = setInterval(() => {
      const rem = Game.globalEndAt - now();
      if (UI.globalTimer) UI.globalTimer.textContent = fmtInt(Math.ceil(rem / 1000));
      if (rem <= 0) endGame();
    }, 200);
    
    startSentence("A");
    if (!Game.config.soloMode) startSentence("B");
  }

  function endGame() {
    Game.running = false; clearInterval(Game.globalTickId);
    UI.startBtn.classList.remove("disabled");
    if (UI.endOverlay) UI.endOverlay.classList.add("show");
    if (UI.finalA) UI.finalA.textContent = Game.teams.A.score;
    if (UI.finalB) UI.finalB.textContent = Game.teams.B.score;
    const T = I18N[getLang()];
    const winnerLine = $("#winnerLine");
    if (winnerLine) {
       const a = Game.teams.A.score, b = Game.teams.B.score;
       winnerLine.textContent = a > b ? T.winnerA : b > a ? T.winnerB : T.draw;
    }
  }

  function startSentence(k) {
    const t = Game.teams[k]; const round = getRoundAt(t.idx);
    if (!round) { setNote(k, "🏁"); return; }
    t.phase = "flash"; t.words = Game.config.mode === "math" ? round.expr.split(" ") : tokenize(round);
    t.placed = new Array(t.words.length).fill(null);
    renderFlash(k);
  }

  function renderFlash(k) {
    const t = Game.teams[k], z = zFor(k);
    if (t.flashIndex >= t.words.length) {
      z.flash.textContent = ""; t.phase = "scramble";
      Game.config.mode === "math" ? renderMath(k) : renderScramble(k);
      return;
    }
    z.flash.textContent = t.words[t.flashIndex];
    z.flash.classList.add("show");
    setTimeout(() => {
      z.flash.classList.remove("show");
      t.flashIndex++;
      renderFlash(k);
    }, Game.config.baseFlashMs);
  }

  function renderScramble(k) {
    const z = zFor(k), t = Game.teams[k];
    z.slots.innerHTML = t.words.map((_, i) => `<div class="slot" data-idx="${i}">—</div>`).join("");
    const rand = mulberry32(Date.now() + t.idx);
    const shuffled = shuffle(t.words, rand);
    z.tiles.innerHTML = shuffled.map(w => `<button class="tile" data-word="${w}">${w}</button>`).join("");
    
    z.tiles.onclick = (e) => {
      const btn = e.target.closest(".tile"); if (!btn || t.phase !== "scramble") return;
      const nextIdx = t.placed.findIndex(p => p === null);
      if (btn.dataset.word === t.words[nextIdx]) {
        t.placed[nextIdx] = btn.dataset.word;
        const slot = z.slots.querySelector(`[data-idx="${nextIdx}"]`);
        slot.textContent = btn.dataset.word; slot.classList.add("filled", "correct");
        btn.remove();
        if (t.placed.every(p => p !== null)) {
          t.score += 100 * t.comboMultiplier; t.idx++; setScore(k); setRound(k);
          setTimeout(() => startSentence(k), 500);
        }
      }
    };
  }

  function renderMath(k) {
    const z = zFor(k), t = Game.teams[k], round = getRoundAt(t.idx);
    z.mathOptions.innerHTML = round.options.map(opt => `<button class="mathBtn" data-val="${opt}">${opt}</button>`).join("");
    z.mathOptions.onclick = (e) => {
      const btn = e.target.closest(".mathBtn"); if (!btn) return;
      if (parseInt(btn.dataset.val) === round.answer) {
        t.score += 150; t.idx++; setScore(k); setRound(k);
        startSentence(k);
      }
    };
  }

  // --- INITIALIZATION ---
  function initUI() {
    UI = {
      globalTimer: $("#globalTimer"), startBtn: $("#startBtn"), openSetupBtn: $("#openSetupBtn"),
      setupOverlay: $("#setupOverlay"), textInput: $("#textInput"), subtitle: $("#subtitle"),
      pauseBtn: $("#pauseBtn"), applyBtn: $("#applyBtn"), endOverlay: $("#endOverlay"),
      finalA: $("#finalA"), finalB: $("#finalB"),
      teamA: {
        flash: $("#flashA"), slots: $("#slotsA"), tiles: $("#tilesA"), score: $("#scoreA"), 
        round: $("#roundA"), combo: $("#comboA"), note: $("#noteA"), mathOptions: $("#mathOptionsA")
      },
      teamB: {
        flash: $("#flashB"), slots: $("#slotsB"), tiles: $("#tilesB"), score: $("#scoreB"), 
        round: $("#roundB"), combo: $("#comboB"), note: $("#noteB"), mathOptions: $("#mathOptionsB")
      }
    };

    if (UI.applyBtn) UI.applyBtn.onclick = applySetup;
    if (UI.startBtn) UI.startBtn.onclick = startGame;
    if (UI.openSetupBtn) UI.openSetupBtn.onclick = () => UI.setupOverlay.classList.add("show");
    
    // Пресеты
    const pSel = $("#presetSelect");
    if (pSel) pSel.onchange = () => { if (pSel.value !== "custom") UI.textInput.value = PRESETS[pSel.value]; };

    applyI18n();
    applySetup(); // Первичная настройка
  }

  // Запуск только после полной загрузки DOM
  document.addEventListener("DOMContentLoaded", initUI);

})();
