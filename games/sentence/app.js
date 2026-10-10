(() => {
  "use strict";

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

  // Язык — общий для сайта (shared/lang.js); строки без таблицы I18N — через tr()
  const tr = (s, v) => (window.BALang ? window.BALang.t(s, v) : s);

  /* ========= Тексты раундов на трёх языках ========= */
  const PRESETS = {
    ky: {
      text_easy: "Мышык уктап жатат. Биз үйгө бара жатабыз. Ит катуу үрүп жатат. Асман абдан ачык. Апам нан жапты.",
      text_medium: "Бүгүн биз кунт коюп көңүл бурууну жана эс тутумду машыктырабыз. Ылдамдык маанилүү бирок тактык андан да маанилүүрөөк. Көңүл топтоп ишенимдүү аракет кыл.",
      text_expert: "Интегралдык эсептөө математикалык анализдин маанилүү бөлүгү болуп саналат. Заманбап тиркемелерди иштеп чыгуу архитектураны кылдат пландаштырууну талап кылат."
    },
    ru: {
      text_easy: "Кошка спит на диване. Мы идём домой. Собака громко лает. Небо сегодня ясное. Мама испекла хлеб.",
      text_medium: "Сегодня мы тренируем внимание и память. Скорость важна, но точность ещё важнее. Сосредоточься и действуй уверенно.",
      text_expert: "Интегральное исчисление является важной частью математического анализа. Разработка современных приложений требует тщательного планирования архитектуры."
    },
    en: {
      text_easy: "The cat is sleeping. We are going home. The dog is barking loudly. The sky is very clear. Mom baked fresh bread.",
      text_medium: "Today we train attention and memory. Speed matters but accuracy matters even more. Stay focused and act with confidence.",
      text_expert: "Integral calculus is an important part of mathematical analysis. Building modern applications requires careful planning of the architecture."
    }
  };
  const presetText = (key) => (PRESETS[getLang()] || PRESETS.ky)[key] || PRESETS.ky[key];

  /* ========= ИСПРАВЛЕННЫЙ I18N ========= */
  const I18N = {
    ru: {
      subtitle: "Собери предложение · Нажимай слова снизу",
      pause: "Пауза",
      resume: "Продолжить",
      startBtn: "Старт",
      timeUp: "Время вышло!",
      winnerA: "Победитель: Команда A",
      winnerB: "Победитель: Команда B",
      draw: "Ничья!",
      noteReady: (n) => `Готово: ${n} раунд(ов). Жми «Старт».`,
      notePlayText: "Нажимай слова по порядку: 1 → 2 → 3…",
      noteRoundsOver: "Раунды завершены.",
      themeDark: "Темная",
      themeLight: "Светлая"
    },
    en: {
      subtitle: "Build the sentence · Tap the words",
      pause: "Pause",
      resume: "Resume",
      startBtn: "Start",
      timeUp: "Time is up!",
      winnerA: "Winner: Team A",
      winnerB: "Winner: Team B",
      draw: "Draw!",
      noteReady: (n) => `Ready: ${n} rounds. Press «Start».`,
      notePlayText: "Tap words in order: 1 → 2 → 3…",
      noteRoundsOver: "Rounds finished.",
      themeDark: "Dark",
      themeLight: "Light"
    },
    ky: {
      subtitle: "Сүйлөмдү түз · Сөздөрдү бас",
      pause: "Тыным",
      resume: "Улантуу",
      startBtn: "Башта",
      timeUp: "Убакыт бүттү!",
      winnerA: "Жеңүүчү: Команда A",
      winnerB: "Жеңүүчү: Команда B",
      draw: "Тең чыгышты!",
      noteReady: (n) => `Даяр: ${n} раунд. «Башта» бас.`,
      notePlayText: "Сөздөрдү тартип менен бас...",
      noteRoundsOver: "Раунддар бүттү.",
      themeDark: "Караңгы",
      themeLight: "Жарык"
    }
  };

  function getLang() {
    const lang = window.BALang ? window.BALang.lang : "ky";
    return I18N[lang] ? lang : "ky";
  }

  function getTheme() {
    return "light"; // платформа использует один светлый интерфейс
  }
  function setTheme(theme) {
    const t = (theme === "light") ? "light" : "dark";
    localStorage.setItem("BA_PORTAL_THEME", t);
    document.body.classList.toggle("dark", t === "dark");
    document.body.classList.toggle("light", t === "light");
    applyI18n();
  }

  function applyI18n() {
    const lang = getLang();
    const T = I18N[lang];
    if (UI.subtitle) UI.subtitle.textContent = T.subtitle;
    if (UI.pauseBtn) UI.pauseBtn.textContent = Game.paused ? T.resume : T.pause;
    if (UI.startBtn) UI.startBtn.textContent = T.startBtn;
    if (UI.themeBtn) UI.themeBtn.textContent = getTheme() === "dark" ? T.themeDark : T.themeLight;
    if (UI.openSetupBtn) UI.openSetupBtn.textContent = tr('Жөндөөлөр');
  }

  /* ========= UI Elements ========= */
  let UI = {};

  const showOverlay = (el) => {
    if (!el) return;
    el.classList.add("show");
    el.setAttribute("aria-hidden", "false");
    // Optionally focus the first focusable element
    const firstBtn = el.querySelector("button, select, textarea");
    if (firstBtn) firstBtn.focus();
  };

  const hideOverlay = (el) => {
    if (!el) return;
    el.classList.remove("show");
    el.setAttribute("aria-hidden", "true");
  };

  const Sound = {
    enabled: true, ctx: null,
    unlock() {
      if (Sound.ctx) return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) Sound.ctx = new Ctx();
    },
    beep(freq, dur = 0.12, gainVal = 0.08, type = "sine") {
      if (!Sound.enabled || !Sound.ctx) return;
      const t0 = Sound.ctx.currentTime;
      const osc = Sound.ctx.createOscillator();
      const gain = Sound.ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(gainVal, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain); gain.connect(Sound.ctx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    },
    correct() { Sound.beep(700, 0.10, 0.08, "triangle"); },
    wrong() { Sound.beep(190, 0.12, 0.10, "sawtooth"); },
    penalty() { Sound.beep(130, 0.20, 0.12, "square"); },
    roundWin() { Sound.beep(760, 0.08, 0.08, "triangle"); setTimeout(() => Sound.beep(980, 0.10, 0.08, "triangle"), 90); },
    gameEnd() { Sound.beep(520, 0.10, 0.08, "triangle"); setTimeout(() => Sound.beep(390, 0.12, 0.08, "triangle"), 110); setTimeout(() => Sound.beep(260, 0.14, 0.08, "triangle"), 240); }
  };

  function mkTeamState(key) {
    return { key, idx: 0, phase: "idle", words: [], placed: [], score: 0, sentenceStartAt: 0, lastActionAt: 0, perSentencePoints: 1000, hintAvailable: false, decayTickId: 0, flashTimerId: 0, flashIndex: 0, wrongStreak: 0, comboStreak: 0, comboMultiplier: 1.0, pausedElapsedMs: 0 };
  }

  const Game = {
    config: { baseFlashMs: 800, globalSeconds: 60, penaltyOn3Wrong: 150, comboEnabled: true, comboEvery: 3, comboAdd: 0.1, comboMax: 2.0, hiddenMode: false, hideMs: 2000, soloMode: false, mode: "text" },
    sentences: [], mathRounds: [], seedBase: 123456789, running: false, globalEndAt: 0, globalTickId: 0, globalFrozen: false, frozenRemainingMs: 0, paused: false, pausedAt: 0,
    teams: { A: mkTeamState("A"), B: mkTeamState("B") }
  };

  function isMathMode() { return Game.config.mode === "math"; }
  function totalRounds() { return isMathMode() ? Game.mathRounds.length : Game.sentences.length; }
  function getRoundAt(i) { return isMathMode() ? Game.mathRounds[i] : Game.sentences[i]; }

  function buildMathRounds(count) {
    const rounds = [];
    const seed = (Date.now() ^ (count * 97531)) >>> 0;
    const rand = mulberry32(seed);
    for (let i = 0; i < count; i++) {
      const a = randInt(rand, 1, 20); const b = randInt(rand, 1, 20);
      const ans = a + b;
      const opts = new Set([ans]);
      while (opts.size < 3) opts.add(ans + randInt(rand, -5, 5) || 1);
      rounds.push({ type: "math", expr: `${a} + ${b}`, answer: ans, options: shuffle([...opts], rand) });
    }
    return rounds;
  }
  function randInt(rand, min, max) { return Math.floor(rand() * (max - min + 1)) + min; }

  function zFor(k) { 
    const z = (k === "A") ? UI.teamA : UI.teamB;
    if (!z) {
      console.error(`UI Error: team${k} is undefined!`, UI);
      // Fallback attempt to re-select if missing (unlikely but safe)
      return (k === "A") ? { note: {}, score: {}, round: {}, combo: {}, hintBtn: {}, flash: {}, slots: {}, tiles: {}, mathArea: {}, mathOptions: {} } : { note: {}, score: {}, round: {}, combo: {}, hintBtn: {}, flash: {}, slots: {}, tiles: {}, mathArea: {}, mathOptions: {} };
    }
    return z;
  }

  function updateVsBar() {
    const scoreA = Game.teams.A.score;
    const scoreB = Game.teams.B.score;
    const total = scoreA + scoreB;
    const fillA = document.getElementById('vsFillA');
    const fillB = document.getElementById('vsFillB');

    if (total === 0) {
      fillA.style.width = '50%';
      fillB.style.width = '50%';
    } else {
      fillA.style.width = `${(scoreA / total) * 100}%`;
      fillB.style.width = `${(scoreB / total) * 100}%`;
    }
  }

  function setScore(k) {
    zFor(k).score.textContent = fmtInt(Game.teams[k].score);
    const vsScore = document.getElementById(`vsScore${k}`);
    if (vsScore) vsScore.textContent = fmtInt(Game.teams[k].score);
    updateVsBar();
  }

  function setRound(k) { zFor(k).round.textContent = totalRounds() ? `${Game.teams[k].idx + 1}/${totalRounds()}` : "—"; }
  function setCombo(k) { zFor(k).combo.textContent = fmtMult(Game.teams[k].comboMultiplier); }
  function setNote(k, txt) { zFor(k).note.textContent = txt; }
  function showHintButton(k, show) { const btn = zFor(k).hintBtn; show ? btn.classList.remove("disabled") : btn.classList.add("disabled"); }

  function clearZone(k) {
    const z = zFor(k); z.flash.textContent = ""; z.flash.classList.remove("show");
    z.slots.innerHTML = ""; z.tiles.innerHTML = ""; z.tiles.classList.remove("hiddenTemp"); showHintButton(k, false);
  }

  function buildSlots(k, words) {
    const z = zFor(k); z.slots.innerHTML = "";
    words.forEach((_, i) => {
      const slot = document.createElement("div"); slot.className = "slot"; slot.dataset.slotIndex = String(i); slot.textContent = "—"; z.slots.appendChild(slot);
    });
  }

  function buildTiles(k, scrambledWords) {
    const z = zFor(k); z.tiles.innerHTML = "";
    scrambledWords.forEach(w => {
      const tile = document.createElement("button"); tile.className = "tile"; tile.textContent = w; tile.dataset.word = w; z.tiles.appendChild(tile);
    });
  }

  function stopTeamTimers(k) { clearInterval(Game.teams[k].decayTickId); clearTimeout(Game.teams[k].flashTimerId); }

  function tickGlobalTimer() {
    if (!Game.running) return;
    if (Game.globalFrozen || Game.paused) return;
    const remainingMs = Game.globalEndAt - now();
    UI.globalTimer.textContent = fmtInt(Math.ceil(remainingMs / 1000));
    if (remainingMs <= 0) endGame();
  }

  function resetCombo(k) { Game.teams[k].comboStreak = 0; Game.teams[k].comboMultiplier = 1.0; setCombo(k); }
  function addCombo(k) {
    if (!Game.config.comboEnabled) return;
    const t = Game.teams[k]; t.comboStreak++;
    if (t.comboStreak % Game.config.comboEvery === 0) {
      t.comboMultiplier = clamp(t.comboMultiplier + Game.config.comboAdd, 1.0, Game.config.comboMax); setCombo(k); Sound.beep(900, 0.06, 0.06, "triangle");
    }
  }

  function startGame() {
    if (Game.running) return;
    if (!totalRounds()) { UI.setupOverlay.classList.add("show"); return; }
    Sound.unlock(); Game.running = true; Game.paused = false;
    UI.startBtn.classList.add("disabled"); 
    hideOverlay(UI.endOverlay);

    for (const k of ["A", "B"]) {
      Game.teams[k] = mkTeamState(k); setScore(k); setRound(k); resetCombo(k); clearZone(k);
    }
    Game.globalEndAt = now() + Game.config.globalSeconds * 1000;
    tickGlobalTimer(); Game.globalTickId = setInterval(tickGlobalTimer, 200);
    startSentence("A");
    if (Game.config.soloMode) { stopTeamTimers("B"); clearZone("B"); setNote("B", tr("Соло режим: Команда A ойнойт.")); } else { startSentence("B"); }
  }

  // Вспомогательная функция: плавно накручивает счет от start до end
  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      // Вычисляем прогресс от 0 до 1
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Функция плавности (ease-out cubic) - вначале быстро, в конце замедляется
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentVal = Math.floor(easeProgress * (end - start) + start);
      obj.textContent = fmtInt(currentVal);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        // Гарантируем точное финальное число
        obj.textContent = fmtInt(end);
        // Небольшой "пульс" в конце
        obj.style.transform = "scale(1.15)";
        obj.style.color = "var(--cyan)";
        setTimeout(() => {
          obj.style.transform = "scale(1)";
          obj.style.color = "";
        }, 250);
      }
    };
    window.requestAnimationFrame(step);
  }

  function endGame(){
    // 1. Защита от двойного срабатывания
    if (!Game.running) return; 
    Game.running = false; 
    clearInterval(Game.globalTickId); // Останавливаем таймер
    
    // 2. Блокируем команды
    for(const k of ["A","B"]){ 
      stopTeamTimers(k); 
      showHintButton(k, false); 
      Game.teams[k].phase = "done"; // Гарантируем, что клики больше не пройдут
    }
    
    UI.startBtn.classList.remove("disabled"); 
    UI.openSetupBtn.classList.remove("disabled");
    
    const T = I18N[getLang()];
    const a = Game.teams.A.score; 
    const b = Game.teams.B.score;
    const winnerLine = document.getElementById("winnerLine");
    const endCardEl = document.querySelector(".endCard"); // Надежный поиск карточки
    
    // 3. Определяем текст победителя
    if(Game.config.soloMode) {
      winnerLine.textContent = tr("Соло режим бүттү");
    } else {
      winnerLine.textContent = (a > b) ? T.winnerA : (b > a) ? T.winnerB : T.draw;
    }
    
    // 4. ИСПРАВЛЕНИЕ БАГА: Безопасное добавление классов
    if (endCardEl) {
      endCardEl.classList.remove("winnerA", "winnerB", "draw");
      if (!Game.config.soloMode) {
        if (a > b) {
          endCardEl.classList.add("winnerA");
        } else if (b > a) {
          endCardEl.classList.add("winnerB");
        } else {
          endCardEl.classList.add("draw");
        }
      }
    }

    // 5. Подготавливаем цифры для анимации
    UI.finalA.textContent = "0"; 
    UI.finalB.textContent = "0";

    // 6. Вызываем финальный экран
    Sound.gameEnd(); 
    showOverlay(UI.endOverlay);

    // 7. Запускаем красивую анимацию цифр
    setTimeout(() => {
      animateValue(UI.finalA, 0, a, 1500); 
      if (!Game.config.soloMode) {
        animateValue(UI.finalB, 0, b, 1500);
      }
    }, 400);
  }

  function startSentence(k) {
    if (!Game.running) return;
    const t = Game.teams[k]; const round = getRoundAt(t.idx);
    if (!round) { t.phase = "done"; clearZone(k); setNote(k, I18N[getLang()].noteRoundsOver); return; }

    stopTeamTimers(k); clearZone(k); t.phase = "flash"; t.flashIndex = 0; t.placed = [];
    t.sentenceStartAt = now(); t.lastActionAt = now(); setRound(k);

    if (isMathMode()) {
      t.words = round.expr.split(" ");
      setNote(k, tr('Раунд {n}: Туура жоопту танда.', { n: t.idx + 1 }));
    } else {
      t.words = tokenize(String(round));
      t.placed = new Array(t.words.length).fill(null);
      setNote(k, tr('Раунд {n}: Сөздөрдү ирети менен бас.', { n: t.idx + 1 }));
    }
    runFlash(k, t.words);
  }

  function runFlash(k, words) {
    const z = zFor(k), t = Game.teams[k], flashMs = Game.config.baseFlashMs;
    const step = () => {
      if (!Game.running || Game.paused || t.phase !== "flash") return;
      if (t.flashIndex >= words.length) {
        z.flash.classList.remove("show"); z.flash.textContent = "";
        isMathMode() ? startMathChoices(k) : startScramble(k); return;
      }
      z.flash.textContent = words[t.flashIndex]; z.flash.classList.add("show");
      setTimeout(() => z.flash.classList.remove("show"), Math.max(120, flashMs - 120));
      t.flashIndex++; t.flashTimerId = setTimeout(step, flashMs);
    };
    step();
  }

  function startScramble(k) {
    const t = Game.teams[k]; t.phase = "scramble";
    buildSlots(k, t.words);
    const rand = mulberry32((Game.seedBase ^ (t.idx + 1)) >>> 0);
    buildTiles(k, shuffle(t.words.slice(), rand));
    attachClickMode(k);
    showHintButton(k, true);
  }

  /** Слово встало на место: в скрытом режиме через 2 с его не видно */
  function placeWord(k, index, word) {
    const t = Game.teams[k];
    t.placed[index] = word;
    const slot = zFor(k).slots.querySelector(`.slot[data-slot-index="${index}"]`);
    if (!slot) return;
    slot.textContent = word; slot.classList.add("filled", "correct");
    if (Game.config.hiddenMode) setTimeout(() => slot.classList.add("masked"), Game.config.hideMs);
  }

  /** 3 ошибки подряд — штраф (настройка «Каталар үчүн айып») */
  function registerWrong(k) {
    const t = Game.teams[k];
    t.wrongStreak++;
    if (t.wrongStreak < 3 || !Game.config.penaltyOn3Wrong) return;
    t.wrongStreak = 0;
    t.score = Math.max(0, t.score - Game.config.penaltyOn3Wrong);
    setScore(k); Sound.penalty();
    setNote(k, tr('Айып: −{n} упай', { n: Game.config.penaltyOn3Wrong }));
  }

  /** Подсказка ставит следующее слово, но раунд приносит на 250 очков меньше */
  function useHint(k) {
    const t = Game.teams[k];
    if (!Game.running || Game.paused || t.phase !== "scramble" || isMathMode()) return;
    const index = t.placed.findIndex((v) => v === null);
    if (index === -1) return;
    const word = t.words[index];
    const tile = [...zFor(k).tiles.querySelectorAll(".tile")].find((el) => el.dataset.word === word);
    if (tile) tile.remove();
    placeWord(k, index, word);
    t.perSentencePoints = Math.max(250, t.perSentencePoints - 250);
    setNote(k, tr('Кыйытма: «{w}»', { w: word }));
    resetCombo(k);
    checkComplete(k);
  }

  function startMathChoices(k) {
    const t = Game.teams[k]; t.phase = "scramble";
    const z = zFor(k); z.mathOptions.innerHTML = "";
    Game.mathRounds[t.idx].options.forEach(val => {
      const b = document.createElement("button"); b.className = "mathBtn"; b.dataset.value = val; b.textContent = val; z.mathOptions.appendChild(b);
    });
    attachMathMode(k);
  }

  function attachClickMode(k) {
    const z = zFor(k); if (z.tiles.dataset.bound === "1") return;
    z.tiles.dataset.bound = "1";
    z.tiles.addEventListener("pointerdown", (ev) => {
      if (!Game.running || Game.paused || Game.teams[k].phase !== "scramble") return;
      const tile = ev.target.closest(".tile"); if (!tile) return;
      ev.preventDefault(); Sound.unlock();

      const t = Game.teams[k];
      const nextIndex = t.placed.findIndex(v => v === null);
      if (nextIndex === -1) return;

      if (tile.dataset.word === t.words[nextIndex]) {
        placeWord(k, nextIndex, tile.dataset.word);
        t.wrongStreak = 0;
        tile.remove(); Sound.correct(); addCombo(k);
        checkComplete(k);
      } else {
        tile.classList.add("wrong"); Sound.wrong(); resetCombo(k); registerWrong(k);
        setTimeout(() => tile.classList.remove("wrong"), 250);
      }
    });
  }

  function attachMathMode(k) {
    const z = zFor(k); if (!z.mathOptions || z.mathOptions.dataset.bound === "1") return;
    z.mathOptions.dataset.bound = "1";
    z.mathOptions.addEventListener("pointerdown", (ev) => {
      if (!Game.running || Game.paused || Game.teams[k].phase !== "scramble") return;
      const btn = ev.target.closest(".mathBtn"); if (!btn) return;
      ev.preventDefault(); Sound.unlock();

      if(Number(btn.dataset.value) === Game.mathRounds[Game.teams[k].idx].answer){
        Game.teams[k].wrongStreak = 0;
        Sound.correct(); 
        addCombo(k); 
        
        Game.teams[k].phase = "done"; // БЛОКИРУЕМ ДВОЙНОЙ КЛИК
        finishSentence(k);
      } else {
        Sound.wrong(); resetCombo(k); registerWrong(k);
        btn.style.background = "var(--error)"; setTimeout(() => btn.style.background = "", 200);
      }
    });
  }

  // Быстрая проверка завершения
  function checkComplete(k){
    const t = Game.teams[k];
    if(t.placed.every(v => v !== null)){
      stopTeamTimers(k);
      showHintButton(k, false);
      
      t.phase = "done"; // БЛОКИРУЕМ ЛИШНИЕ КЛИКИ
      
      setTimeout(() => {
        if(!Game.running || Game.paused) return;
        finishSentence(k);
      }, 50); 
    }
  }

  // Моментальный переход или конец игры
  function finishSentence(k){
    const t = Game.teams[k];
    t.score += Math.floor(t.perSentencePoints * t.comboMultiplier); 
    setScore(k);
    Sound.roundWin(); 
    t.idx++;
    
    // БЕЗ ЗАДЕРЖЕК: сразу вызываем endGame(), если раунды кончились
    if (Game.config.soloMode && t.idx >= totalRounds()) { 
      endGame(); 
      return; 
    }
    if (!Game.config.soloMode && Game.teams.A.idx >= totalRounds() && Game.teams.B.idx >= totalRounds()) { 
      endGame(); 
      return; 
    }
    
    startSentence(k);
  }

  // ─── Управление ходом игры ────────────────────────────────────────────────
  /** Пауза: стоят общий таймер, показ слов и ответы обеих команд */
  function togglePause() {
    if (!Game.running) return;
    if (!Game.paused) {
      Game.paused = true; Game.pausedAt = now();
      for (const k of ["A", "B"]) stopTeamTimers(k);
    } else {
      const shift = now() - Game.pausedAt;
      Game.paused = false;
      if (!Game.globalFrozen) Game.globalEndAt += shift;
      for (const k of ["A", "B"]) {
        const t = Game.teams[k];
        if (t.phase === "flash") runFlash(k, t.words);
      }
    }
    document.body.classList.toggle("paused", Game.paused);
    applyI18n();
  }

  /** Заморозка общего времени — команды продолжают играть */
  function toggleFreeze() {
    if (!Game.running) return;
    if (!Game.globalFrozen) {
      Game.frozenRemainingMs = Math.max(0, Game.globalEndAt - now());
      Game.globalFrozen = true;
    } else {
      Game.globalEndAt = now() + Game.frozenRemainingMs;
      Game.globalFrozen = false;
    }
    UI.freezeBtn.textContent = tr(Game.globalFrozen ? "Убакытты улантуу" : "Убакытты токтотуу");
  }

  function skipRound(k) {
    if (!Game.running || (Game.config.soloMode && k === "B")) return;
    const t = Game.teams[k];
    if (t.idx >= totalRounds()) return;
    stopTeamTimers(k);
    t.idx++;
    resetCombo(k);
    if (t.idx >= totalRounds()) {
      t.phase = "done"; clearZone(k); setNote(k, I18N[getLang()].noteRoundsOver);
      const doneA = Game.teams.A.idx >= totalRounds();
      const doneB = Game.config.soloMode || Game.teams.B.idx >= totalRounds();
      if (doneA && doneB) endGame();
      return;
    }
    startSentence(k);
    setNote(k, tr("Раунд өткөрүлдү."));
  }

  function restartRound() {
    if (!Game.running) return;
    for (const k of Game.config.soloMode ? ["A"] : ["A", "B"]) {
      const t = Game.teams[k];
      if (t.idx < totalRounds()) { t.perSentencePoints = 1000; t.wrongStreak = 0; startSentence(k); }
    }
  }

  /** Полный сброс: игра останавливается, очки обнуляются */
  function hardReset() {
    clearInterval(Game.globalTickId);
    Game.running = false; Game.paused = false; Game.globalFrozen = false;
    document.body.classList.remove("paused");
    for (const k of ["A", "B"]) {
      stopTeamTimers(k);
      Game.teams[k] = mkTeamState(k); setScore(k); setRound(k); resetCombo(k); clearZone(k);
      setNote(k, tr("Оюн тазаланды. Жөндөөлөрдү ырастап, «Башта» басыңыз."));
    }
    UI.globalTimer.textContent = String(Game.config.globalSeconds);
    UI.freezeBtn.textContent = tr("Убакытты токтотуу");
    UI.startBtn.classList.remove("disabled"); UI.openSetupBtn.classList.remove("disabled");
    hideOverlay(UI.endOverlay);
    applyI18n();
  }

  function applySetup() {
    // Во время игры тексты раундов не меняются — применяются только правила
    if (Game.running) { hideOverlay(UI.setupOverlay); return; }
    if (isMathMode()) { Game.mathRounds = buildMathRounds(10); Game.sentences = []; }
    else {
      const text = UI.textInput.value.trim();
      Game.sentences = splitIntoSentences(text).filter(s => tokenize(s).length >= 2);
    }
    hideOverlay(UI.setupOverlay);
    const T = I18N[getLang()];
    setNote("A", T.noteReady(totalRounds())); setNote("B", T.noteReady(totalRounds()));
  }

  function initUI() {
    UI = {
      globalTimer: $("#globalTimer"), startBtn: $("#startBtn"), resetBtn: $("#resetBtn"), openSetupBtn: $("#openSetupBtn"),
      pauseBtn: $("#pauseBtn"), freezeBtn: $("#freezeBtn"), skipA: $("#skipA"), skipB: $("#skipB"),
      setupOverlay: $("#setupOverlay"), closeSetupBtn: $("#closeSetupBtn"), applyBtn: $("#applyBtn"),
      presetSelect: $("#presetSelect"), textInput: $("#textInput"), speedRange: $("#speedRange"), speedVal: $("#speedVal"),
      timeRange: $("#timeRange"), timeVal: $("#timeVal"), penaltyRange: $("#penaltyRange"), penaltyVal: $("#penaltyVal"),
      comboBtn: $("#comboBtn"), hiddenBtn: $("#hiddenBtn"), soundBtn: $("#soundBtn"), soloBtn: $("#soloBtn"),
      langSelect: $("#langSelect"), themeBtn: $("#themeBtn"), modeSelect: $("#modeSelect"), subtitle: $("#subtitle"),
      endOverlay: $("#endOverlay"), closeEndBtn: $("#closeEndBtn"), replayBtn: $("#replayBtn"), hardResetBtn: $("#hardResetBtn"),
      finalA: $("#finalA"), finalB: $("#finalB"), winnerText: $("#winnerText"), endCard: $(".endCard"),
      teamA: {
        flash: $("#flashA"), slots: $("#slotsA"), tiles: $("#tilesA"), score: $("#scoreA"), round: $("#roundA"), combo: $("#comboA"),
        hintBtn: $("#hintA"), note: $("#noteA"), mathArea: $("#mathAreaA"), mathOptions: $("#mathOptionsA")
      },
      teamB: {
        flash: $("#flashB"), slots: $("#slotsB"), tiles: $("#tilesB"), score: $("#scoreB"), round: $("#roundB"), combo: $("#comboB"),
        hintBtn: $("#hintB"), note: $("#noteB"), mathArea: $("#mathAreaB"), mathOptions: $("#mathOptionsB")
      }
    };

    applyI18n();
    showOverlay(UI.setupOverlay);

    UI.speedRange.addEventListener("input", () => { Game.config.baseFlashMs = Number(UI.speedRange.value); UI.speedVal.textContent = UI.speedRange.value; });
    UI.timeRange.addEventListener("input", () => { Game.config.globalSeconds = Number(UI.timeRange.value); UI.timeVal.textContent = UI.timeRange.value; });

    UI.presetSelect.addEventListener("change", () => { if (UI.presetSelect.value !== "custom") UI.textInput.value = presetText(UI.presetSelect.value); });
    UI.penaltyRange.addEventListener("input", () => { Game.config.penaltyOn3Wrong = Number(UI.penaltyRange.value); UI.penaltyVal.textContent = UI.penaltyRange.value; });

    // Переключатели: подпись «Күйүк / Өчүк» и класс .on
    const toggle = (btn, on) => { btn.classList.toggle("on", on); btn.textContent = tr(on ? "Күйүк" : "Өчүк"); btn.setAttribute("aria-pressed", String(on)); };
    UI.soloBtn.addEventListener("click", () => { Game.config.soloMode = !Game.config.soloMode; toggle(UI.soloBtn, Game.config.soloMode); document.body.classList.toggle("solo", Game.config.soloMode); });
    UI.comboBtn.addEventListener("click", () => {
      Game.config.comboEnabled = !Game.config.comboEnabled; toggle(UI.comboBtn, Game.config.comboEnabled);
      if (!Game.config.comboEnabled) { resetCombo("A"); resetCombo("B"); }
    });
    UI.hiddenBtn.addEventListener("click", () => { Game.config.hiddenMode = !Game.config.hiddenMode; toggle(UI.hiddenBtn, Game.config.hiddenMode); });
    UI.soundBtn.addEventListener("click", () => { Sound.enabled = !Sound.enabled; toggle(UI.soundBtn, Sound.enabled); });
    [[UI.soloBtn, Game.config.soloMode], [UI.comboBtn, Game.config.comboEnabled], [UI.hiddenBtn, Game.config.hiddenMode], [UI.soundBtn, Sound.enabled]]
      .forEach(([btn, on]) => toggle(btn, on));

    UI.teamA.hintBtn.addEventListener("click", () => useHint("A"));
    UI.teamB.hintBtn.addEventListener("click", () => useHint("B"));
    UI.pauseBtn.addEventListener("click", togglePause);
    UI.freezeBtn.addEventListener("click", toggleFreeze);
    UI.skipA.addEventListener("click", () => skipRound("A"));
    UI.skipB.addEventListener("click", () => skipRound("B"));
    UI.resetBtn.addEventListener("click", restartRound);
    UI.hardResetBtn.addEventListener("click", hardReset);
    UI.modeSelect.addEventListener("change", () => { Game.config.mode = UI.modeSelect.value; document.body.classList.toggle("mode-math", isMathMode()); });

    UI.applyBtn.addEventListener("click", applySetup);
    UI.startBtn.addEventListener("click", startGame);
    // Панель открывается и во время игры: там пропуск раунда, заморозка времени и сброс
    UI.openSetupBtn.addEventListener("click", () => showOverlay(UI.setupOverlay));
    UI.closeSetupBtn.addEventListener("click", () => hideOverlay(UI.setupOverlay));
    UI.closeEndBtn.addEventListener("click", () => hideOverlay(UI.endOverlay));
    UI.replayBtn.addEventListener("click", () => { hideOverlay(UI.endOverlay); startGame(); });

    UI.themeBtn.addEventListener("click", () => {
      const next = getTheme() === "dark" ? "light" : "dark";
      setTheme(next);
    });

    setTheme(getTheme()); applyI18n();
  }

  initUI();
})();