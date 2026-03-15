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
      if (typeof window === 'undefined') return;
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
    mode: "single", // "single" or "teams"
    roundsMax: 10,
    roundNow: 1,
    score: 0,
    scoreA: 0,
    scoreB: 0,
    startTime: 0,
    timer: 10,
    timerHandle: null,
    deck: [],
    current: null,
    highScores: [],
    theme: 'midnight',
    difficulty: 'progressive',
    teamStatus: { a: false, b: false }
  };

  /* ---------- Embedded Data (CORS Fix) ---------- */
  const DATA = {
    "easy": [
      { "items": ["алма", "өрүк", "алча", "*бадыраң"], "logic": "Баары мөмө-жемиштер, бадыраң — жашылча." },
      { "items": ["ит", "мышык", "уй", "*тоок"], "logic": "Баары сүт эмүүчүлөр, тоок — канаттуу." },
      { "items": ["кызыл", "сары", "жашыл", "*китеп"], "logic": "Баары түстөр, китеп — буюм." },
      { "items": ["Бишкек", "Ош", "Жалал-Абад", "*Ысык-Көл"], "logic": "Баары шаарлар, Ысык-Көл — көл." },
      { "items": ["кыш", "жаз", "жай", "*жамгыр"], "logic": "Баары жыл мезгилдери, жамгыр — табият кубулушу." },
      { "items": ["телефон", "ноутбук", "планшет", "*китеп"], "logic": "Баары электрондук түзүлүштөр, ал эми китеп — басылма." },
      { "items": ["бүркүт", "умтул", "шумкар", "*тоок"], "logic": "Баары алгыр жана жырткыч куштар, ал эми тоок — үй кушу." },
      { "items": ["Нарын", "Талас", "Баткен", "*Ош"], "logic": "Баары облус аттары, ал эми Ош — республикалык маанидеги шаар." },
      { "items": ["пияз", "сарымсак", "картошка", "*алма"], "logic": "Баары жер астында өсүүчү жашылчалар, ал эми алма — дарактагы мөмө." },
      { "items": ["кымыз", "максым", "чалап", "*чай"], "logic": "Баары кыргыздын улуттук суусундуктары, чай — кийин келген суусундук." }
    ],
    "medium": [
      { "items": ["комуз", "кыяк", "темир ооз комуз", "*гитара"], "logic": "Баары кыргыздын улуттук аспаптары, гитара — европалык аспап." },
      { "items": ["Манас", "Семетей", "Сейтек", "*Курманбек"], "logic": "Баары 'Манас' трилогиясынын каармандары, Курманбек — кенже эпостун каарманы." },
      { "items": ["ат", "төө", "уй", "*арстан"], "logic": "Баары үй жаныбарлары, ал эми арстан — жапайы жаныбар." },
      { "items": ["бөрү", "түлкү", "аюу", "*кой"], "logic": "Баары жырткычтар, ал эми кой — чөп жеген жаныбар." },
      { "items": ["зат атооч", "сын атооч", "сан атооч", "*чекит"], "logic": "Баары сөз түркүмдөрү, ал эми чекит — тыныш белгиси." },
      { "items": ["Python", "JavaScript", "C++", "*HTML"], "logic": "Баары программалоо тилдери, ал эми HTML — белгилөө тили (markup)." },
      { "items": ["Ч.Айтматов", "Т.Касымбеков", "А.Осмонов", "*С.Каралаев"], "logic": "Баары жазуучу-акындар, ал эми С.Каралаев — улуу манасчы." },
      { "items": ["CPU", "RAM", "GPU", "*Monitor"], "logic": "Баары системалык блоктун ички тетиктери, монитор — тышкы түзүлүш." },
      { "items": ["жүрөк", "өпкө", "бөйрөк", "*тери"], "logic": "Баары ички органдар, ал эми тери — тышкы орган." },
      { "items": ["антоним", "синоним", "омоним", "*фразеологизм"], "logic": "Баары лексикалык категориялар, фразеологизм — туруктуу сөз айкашы." }
    ],
    "hard": [
      { "items": ["алтын", "күмүш", "жез", "*жыгач"], "logic": "Баары металлдар, ал эми жыгач — органикалык материал." },
      { "items": ["суутек", "кычкылтек", "азот", "*темир"], "logic": "Баары газдар, ал эми темир — катуу металл." },
      { "items": ["Манас", "Бакай", "Алмамбет", "Кошой", "Чубак", "*Манасчы"], "logic": "Баары эпостун каармандары, манасчы — эпосту айтуучу." },
      { "items": ["ОшМУ", "КНУ", "БГУ", "КТУ", "АУЦА", "*МГУ"], "logic": "Баары Кыргызстандын ЖОЖдору, МГУ — Россияныкы." },
      { "items": ["Linux", "Windows", "macOS", "*Android"], "logic": "Баары ЖК үчүн операциялык системалар, Android — мобилдик платформа." },
      { "items": ["Манас", "Эр Төштүк", "Кожожаш", "*Чыңгыз хан"], "logic": "Баары кыргыз фольклорунун каармандары, Чыңгыз хан — тарыхый инсан." },
      { "items": ["Күн", "Сириус", "Вега", "*Ай"], "logic": "Баары жылдыздар, ал эми Ай — спутник." },
      { "items": ["Google", "Meta", "Amazon", "*OpenAI"], "logic": "Баары Big Tech компаниялары, OpenAI — изилдөө лабораториясы." },
      { "items": ["HTTP", "FTP", "SSH", "*SQL"], "logic": "Баары тармактык протоколдор, SQL — маалымат базасы үчүн тил." },
      { "items": ["Docker", "Kubernetes", "Jenkins", "*VS Code"], "logic": "Баары DevOps куралдары, VS Code — код редактору." }
    ]
  };

  /* ---------- High Scores ---------- */
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

  /* ---------- Theme Management ---------- */
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

  /* ---------- Helper Utils ---------- */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), 2000);
  }

  function showScreen(name) {
    [$("screenStart"), $("screenGame"), $("screenEnd")].forEach(s => s.classList.add("hidden"));
    if (name === "start") $("screenStart").classList.remove("hidden");
    if (name === "game") $("screenGame").classList.remove("hidden");
    if (name === "end") $("screenEnd").classList.remove("hidden");
  }

  /* ---------- Game Flow ---------- */
  function buildDeck(mode) {
    const deck = [];
    const getItems = (cat, count) => {
      let pool = [...(DATA[cat] || [])];
      shuffle(pool);
      return pool.slice(0, count);
    };

    if (mode === 'single') {
      if (State.difficulty === 'progressive') {
        deck.push(...getItems('easy', 3));
        deck.push(...getItems('medium', 4));
        deck.push(...getItems('hard', 3));
      } else {
        deck.push(...getItems(State.difficulty, 10));
      }
    } else {
      // Teams: Mixed random difficulty per round
      for (let i = 0; i < State.roundsMax; i++) {
        const cats = ['easy', 'medium', 'hard'];
        const cat = cats[Math.floor(Math.random() * 3)];
        deck.push(getItems(cat, 1)[0]);
      }
    }
    return deck;
  }

  function startRound() {
    if (State.roundNow > State.roundsMax) {
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
      
      let itemCount = 3;
      if (State.difficulty === 'progressive') {
        itemCount = State.roundNow <= 3 ? 3 : (State.roundNow <= 7 ? 4 : 6);
      } else {
        itemCount = State.difficulty === 'easy' ? 3 : (State.difficulty === 'medium' ? 4 : 6);
      }
      
      renderGrid("gridSingle", itemCount);
      State.startTime = Date.now();
      startTimer();
    } else {
      $("singleWrap").classList.add("hidden");
      $("teamsWrap").classList.remove("hidden");
      State.teamStatus = { a: false, b: false };
      $("statusA").textContent = "Ойлонуп жатат...";
      $("statusB").textContent = "Ойлонуп жатат...";
      renderGrid("gridA", 4);
      renderGrid("gridB", 4);
      startTimer();
    }
  }

  function renderGrid(containerId, count) {
    const container = $(containerId);
    container.innerHTML = "";
    
    const allItems = [...State.current.items];
    const oddItem = allItems.find(x => x.startsWith('*'));
    const normalItems = allItems.filter(x => !x.startsWith('*'));
    shuffle(normalItems);
    
    let itemsToDisplay = [oddItem, ...normalItems.slice(0, count - 1)];
    const items = itemsToDisplay.map(val => ({ val: val.replace(/^\*/, ''), isOdd: val.startsWith('*') }));
    shuffle(items);

    items.forEach(item => {
      const btn = document.createElement("button");
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
      setTimeout(() => { State.roundNow++; startRound(); }, 1200);
    }
    
    [...$("gridSingle").children].forEach(c => c.style.pointerEvents = "none");
  }

  function onPickTeam(team, isCorrect, btn) {
    if (State.teamStatus[team]) return;
    State.teamStatus[team] = true;
    
    $(team === 'a' ? "statusA" : "statusB").textContent = isCorrect ? "✅ ТУУРА" : "❌ КАТА";
    btn.classList.add(isCorrect ? "good" : "bad");
    
    if (isCorrect) {
      if (team === 'a') { State.scoreA += 10; $("scoreA").textContent = State.scoreA; }
      else { State.scoreB += 10; $("scoreB").textContent = State.scoreB; }
      Sound.success();
    } else {
      Sound.error();
    }

    [...$(team === 'a' ? "gridA" : "gridB").children].forEach(c => c.style.pointerEvents = "none");

    if (State.teamStatus.a && State.teamStatus.b) {
      stopTimer();
      setTimeout(() => { State.roundNow++; startRound(); }, 1500);
    }
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
    State.timer = State.mode === "single" ? 10 : parseInt($("inpTimeTeams").value || 10);
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
        if (State.mode === "single") {
          toast("Убакыт бүттү!");
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
    showScreen("end");
    const stats = $("endStats");
    
    if (State.mode === "single") {
      $("endSubtitle").textContent = `Сиз ${State.score} упай топтодуңуз!`;
      saveHighScore(State.score);
      stats.innerHTML = `<div class="stat"><div class="statDesc">Жалпы упай</div><div class="statVal">${State.score}</div></div>`;
    } else {
      const winner = State.scoreA > State.scoreB ? "Команда A жеңди!" : (State.scoreB > State.scoreA ? "Команда B жеңди!" : "Достук жеңди!");
      $("endSubtitle").textContent = winner;
      stats.innerHTML = `
        <div class="stat"><div class="statDesc">Команда A</div><div class="statVal">${State.scoreA}</div></div>
        <div class="stat"><div class="statDesc">Команда B</div><div class="statVal">${State.scoreB}</div></div>
      `;
    }
  }

  /* ---------- Events ---------- */
  function init() {
    loadHighScores();
    setTheme('midnight');

    $("btnStartSingle").onclick = () => {
      State.mode = "single";
      State.score = 0;
      State.roundNow = 1;
      State.difficulty = $("selDifficulty").value;
      State.roundsMax = 10;
      State.deck = buildDeck('single');
      showScreen("game");
      startRound();
    };

    $("btnStartTeams").onclick = () => {
      State.mode = "teams";
      State.scoreA = 0; State.scoreB = 0;
      State.roundNow = 1;
      State.roundsMax = parseInt($("inpRoundsTeams").value || 12);
      State.deck = buildDeck('teams');
      showScreen("game");
      startRound();
    };

    $("btnBackToMenu").onclick = $("btnToStart").onclick = () => {
      stopTimer();
      showScreen("start");
    };

    $("btnPlayAgain").onclick = () => {
      if (State.mode === "single") $("btnStartSingle").click();
      else $("btnStartTeams").click();
    };
  }

  init();
})();
