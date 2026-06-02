/**
 * Bilim Arena - Citadel (Цитаделди ээлөө)
 * Modern Logic with Pre-loaded Questions & Confetti
 */

(function() {
  'use strict';

  // --- PRE-LOADED QUESTION BANKS (35 questions each) ---
  const QUIZ_BANKS = {
    kyrgyz_lang_lit: [
      { q: "Кыргыз тили кайсы тилдер тобуна кирет?", options: ["Түрк тилдери", "Славян тилдери", "Роман тилдери", "Герман тилдери"], correct: 0 },
      { q: "Кыргыз алфавитинде канча тамга бар?", options: ["36", "39", "30", "32"], correct: 0 },
      { q: "Зат атоочтун канча жөндөмөсү бар?", options: ["6", "4", "5", "7"], correct: 0 },
      { q: "Манастын атасы ким?", options: ["Жакып", "Бакай", "Кошой", "Алооке"], correct: 0 },
      { q: "Улуу жазуучу Чыңгыз Айтматовдун эң алгачкы повести кайсы?", options: ["Бетме-бет", "Жамийла", "Ак кеме", "Биринчи мугалим"], correct: 0 },
      { q: "Кыргыз тили качан мамлекеттик тил болуп кабыл алынган?", options: ["1989-жылы 23-сентябрда", "1991-жылы 31-августта", "1993-жылы 5-майда", "1990-жылы 15-декабрда"], correct: 0 },
      { q: "Сөз түркүмдөрү жалпысынан канчага бөлүнөт?", options: ["12", "9", "6", "10"], correct: 0 },
      { q: "Кыргыздын эң биринчи профессору жана тилчиси ким?", options: ["Касым Тыныстанов", "Ишеналы Арабаев", "Жусуп Баласагын", "Токтогул Сатылганов"], correct: 0 },
      { q: "Сын атоочтун суроолору кайсылар?", options: ["Кандай? Кайсы?", "Ким? Эмне?", "Эмне кылды?", "Канча? Нечен?"], correct: 0 },
      { q: "Курманжан Датка ким болгон?", options: ["Алай ханышасы", "Манастын жубайы", "Баатыр кыз", "Жазуучу"], correct: 0 },
      { q: "'Ак кеме' повестиндеги чоң атанын аты ким?", options: ["Момун чоң ата", "Орозкул", "Сейдакмат", "Бакай"], correct: 0 },
      { q: "'Сынган кылыч' тарыхый романынын автору ким?", options: ["Төлөгөн Касымбеков", "Чыңгыз Айтматов", "Алыкул Осмонов", "Аалы Токомбаев"], correct: 0 },
      { q: "Кыргыздын улуттук куштарынын бири кайсы?", options: ["Шумкар", "Тоок", "Өрдөк", "Каз"], correct: 0 },
      { q: "Кыргыз улуттук театр искусствосунун негиздөөчүлөрүнүн бири", options: ["Болот Минжылкиев", "Сүймөнкул Чокморов", "Төлөмүш Океев", "Жамал Сейдакматова"], correct: 0 },
      { q: "Алыкул Осмоновдун эң белгилүү поэмаларынын бири", options: ["Ата журт", "Манас", "Келкел", "Каныкей"], correct: 0 },
      { q: "Кыргыз элинин залкар манасчысы ким болгон?", options: ["Саякбай Каралаев", "Токтогул Сатылганов", "Алымбек Датка", "Барпы Алыкулов"], correct: 0 },
      { q: "Жусуп Баласагындын белгилүү чыгармасы кайсы?", options: ["Кут алчу билим", "Диван лугат ат-турк", "Манас", "Сынган кылыч"], correct: 0 },
      { q: "Кыргыз адабиятында алгачкы роман кайсы?", options: ["Кандуу жылдар", "Сынган кылыч", "Жамийла", "Тоо арасында"], correct: 0 },
      { q: "Манастын чоросу, эң жакын досу ким?", options: ["Алмамбет", "Чубак", "Сыргак", "Коңурбай"], correct: 0 },
      { q: "'Жамийла' повестиндеги негизги каармандар кимдер?", options: ["Данияр жана Жамийла", "Сейит жана Алтынай", "Дүйшөн жана Алтынай", "Илияс жана Асел"], correct: 0 },
      { q: "Зат атоочтун мүчөлөрү кайсылар?", options: ["Жөндөмө, таандык, көптүк", "Чак, жак, ыңгай", "Салыштырма, күчөтмө", "Сан, ирет"], correct: 0 },
      { q: "Кайсы сөз туура жазылган?", options: ["Рахмат", "Рахмаат", "Рахматт", "Рохмат"], correct: 0 },
      { q: "Кыргыз тилинде канча созулма үндүү тамга бар?", options: ["6", "5", "8", "4"], correct: 0 },
      { q: "Кыргыз тилинин төл сөздөрүнүн өзгөчөлүгү эмнеде?", options: ["Үндөштүк законуна баш ийет", "Көп муундуу эмес", "Басым дайыма биринчи муунда болот", "Жалаң гана тар үндүүлөрдөн турат"], correct: 0 },
      { q: "'Каныкейдин жомогу' кайсы чыгармада кездешет?", options: ["Манас эпосунда", "Эр Төштүктө", "Кожожашта", "Курманбекте"], correct: 0 },
      { q: "Окуучулардын көптүк түрү кандай болот?", options: ["Окуучулар", "Окуучулор", "Окуучудор", "Окуучутар"], correct: 0 },
      { q: "Сан атоочтун канча маанилик топчосу бар?", options: ["6", "4", "5", "7"], correct: 0 },
      { q: "'Келкел' романынын автору ким?", options: ["Төлөгөн Касымбеков", "Алыкул Осмонов", "Чыңгыз Айтматов", "Касым Тыныстанов"], correct: 0 },
      { q: "Тарыхый инсан Алымбек датка кайсы аймакты башкарган?", options: ["Алай өрөөнүн", "Чүй өрөөнүн", "Талас өрөөнүн", "Ысык-Көл аймагын"], correct: 0 },
      { q: "Биринчи кыргыз алиппеси кайсы жылы жарык көргөн?", options: ["1924-жылы", "1918-жылы", "1930-жылы", "1991-жылы"], correct: 0 },
      { q: "Манастын Тайтору аттуу тулпары кайсы каарманга таандык болгон?", options: ["Каныкейге", "Семетейге", "Бакайга", "Сейтекке"], correct: 0 },
      { q: "Кыргыз тилиндеги тыбыш жана тамгалардын катышы кандай?", options: ["39 тамга, 36 тыбыш", "36 тамга, 39 тыбыш", "36 тамга, 36 тыбыш", "39 тамга, 39 тыбыш"], correct: 0 },
      { q: "Туруктуу сөз айкаштары эмне деп аталат?", options: ["Фразеологизмдер", "Антонимдер", "Синонимдер", "Диалектилер"], correct: 0 },
      { q: "Макалды толуктаңыз: 'Окуу — ине менен ___ казгандай.'", options: ["кудук", "тоо", "жер", "көмүр"], correct: 0 },
      { q: "Биз тоо___ чыктык. Сүйлөмдү толуктаңыз.", options: ["го", "ко", "до", "то"], correct: 0 }
    ],
    kyrgyz_history_geo: [
      { q: "Кыргызстандын эң бийик чокусу кайсы?", options: ["Жеңиш чокусу", "Ленин чокусу", "Хан-Теңири", "Музтаг-Ата"], correct: 0 },
      { q: "Кыргыз Республикасы качан эгемендүүлүккө ээ болгон?", options: ["1991-жылы 31-августта", "1989-жылы 23-сентябрда", "1993-жылы 5-майда", "1995-жылы 10-декабрда"], correct: 0 },
      { q: "Кыргызстандын эң чоң көлү кайсы?", options: ["Ысык-Көл", "Соң-Көл", "Сары-Челек", "Чатыр-Көл"], correct: 0 },
      { q: "Кыргызстандын борбор шаары кайсы?", options: ["Бишкек", "Ош", "Жалал-Абад", "Каракол"], correct: 0 },
      { q: "Бишкек шаары мурун кандай аталган?", options: ["Фрунзе", "Пишпек", "Ош", "Токмок"], correct: 0 },
      { q: "Кыргызстандагы эң узун дарыя кайсы?", options: ["Нарын дарыясы", "Чүй дарыясы", "Талас дарыясы", "Кара-Дарыя"], correct: 0 },
      { q: "Кыргызстан кайсы тоо системасында жайгашкан?", options: ["Тянь-Шань жана Памир-Алай", "Алтай жана Саян", "Кавказ", "Урал"], correct: 0 },
      { q: "Кыргызстандын эң терең көлү кайсы?", options: ["Ысык-Көл", "Соң-Көл", "Сары-Челек", "Кара-Суу"], correct: 0 },
      { q: "Кыргызстан кайсы өлкөлөр менен чектешет?", options: ["Казакстан, Кытай, Тажикстан, Өзбекстан", "Казакстан, Орусия, Кытай", "Өзбекстан, Тажикстан, Ооганстан", "Кытай, Казакстан, Монголия"], correct: 0 },
      { q: "Улуттук валюта — сом качан жүгүртүүгө киргизилген?", options: ["1993-жылы 10-майда", "1991-жылы 31-августта", "1994-жылы 5-июнда", "1995-жылы 10-ноябрда"], correct: 0 },
      { q: "Кыргызстандын биринчи Конституциясы качан кабыл алынган?", options: ["1993-жылы 5-майда", "1991-жылы 31-августта", "1995-жылы 15-октябрда", "1992-жылы 2-мартта"], correct: 0 },
      { q: "Сулайман-Тоо кайсы шаарда жайгашкан?", options: ["Ош шаарында", "Жалал-Абад шаарында", "Баткен шаарында", "Каракол шаарында"], correct: 0 },
      { q: "Тарыхый Таш-Рабат эстелиги кайсы облуста жайгашкан?", options: ["Нарын облусунда", "Иссык-Көл облусунда", "Талас облусунда", "Чүй облусунда"], correct: 0 },
      { q: "Кыргызстандын жалпы аянты канча?", options: ["199,9 миң чарчы км", "150 миң чарчы км", "250 миң чарчы км", "100 миң чарчы км"], correct: 0 },
      { q: "Кыргыз Республикасынын биринчи космонавты ким?", options: ["Салижан Шарипов", "Токтар Аубакиров", "Юрий Гагарин", "Алексей Леонов"], correct: 0 },
      { q: "Кыргызстандын эң кичинекей облусу кайсы?", options: ["Талас облусу", "Баткен облусу", "Ош облусу", "Нарын облусу"], correct: 0 },
      { q: "Ысык-Көлдүн максималдуу тереңдиги канча метр?", options: ["668 метр", "700 метр", "500 метр", "800 метр"], correct: 0 },
      { q: "Кыргызстандын кайсы шаарында эң чоң Токтогул ГЭСи жайгашкан?", options: ["Кара-Көл шаарында", "Токтогул шаарында", "Таш-Көмүр шаарында", "Ош шаарында"], correct: 0 },
      { q: "Бурана мунарасы кайсы тарыхый шаардын калдыгы болуп саналат?", options: ["Баласагын", "Суяб", "Өзгөн", "Ош"], correct: 0 },
      { q: "Кыргызстандын эң ири суу сактагычы кайсы?", options: ["Токтогул суу сактагычы", "Орто-Токой суу сактагычы", "Киров суу сактагычы", "Папан суу сактагычы"], correct: 0 },
      { q: "Кыргызстандын мамлекеттик туусунун автору кимдердин бири?", options: ["Маматбек Сыдыков", "Садырбек Абыкеев", "Кусеин Кольбаев", "Турсунбек Айтматов"], correct: 0 },
      { q: "Тарыхта белгилүү Өзгөн архитектуралык комплекси кайсы кылымга таандык?", options: ["XI-XII кылымдарга", "XV кылымга", "IX кылымга", "XVII кылымга"], correct: 0 },
      { q: "Кыргызстандын эң чоң облусу кайсы?", options: ["Нарын облусу", "Ош облусу", "Ысык-Көл облусу", "Жалал-Абад облусу"], correct: 0 },
      { q: "Кыргызстандын кайсы дарыясы Сир-Дарыяга барып куят?", options: ["Нарын", "Чүй", "Талас", "Сары-Жаз"], correct: 0 },
      { q: "Сары-Челек биосфералык коругу кайсы облуста?", options: ["Жалал-Абад облусунда", "Ош облусунда", "Талас облусунда", "Баткен облусунда"], correct: 0 },
      { q: "Кыргызстандын чек арасынын жалпы узундугу болжол менен канча?", options: ["4500 км", "3000 км", "6000 км", "2000 км"], correct: 0 },
      { q: "Кыргызстандын кайсы шаары мунай өндүрүүсү менен белгилүү болгон?", options: ["Кочкор-Ата", "Көк-Жаңгак", "Майлуу-Суу", "Сүлүктү"], correct: 0 },
      { q: "Тарыхтагы белгилүү 'Улуу Жибек Жолу' Кыргызстандын кайсы аймагынан өткөн?", options: ["Бардык аталган аймактардан", "Чүй өрөөнүнөн", "Ысык-Көлдөн", "Алай өрөөнүнөн"], correct: 0 },
      { q: "Кыргызстандагы эң бийик шаркыратма кайсы?", options: ["Шаар шаркыратмасы", "Арсланбоб шаркыратмасы", "Ысык-Ата шаркыратмасы", "Көгөчөн шаркыратмасы"], correct: 0 },
      { q: "Кыргызстандын кайсы тоо кыркасында жаңгак токойлору жайгашкан?", options: ["Арсланбоб (Бабаш-Ата)", "Кыргыз Ала-Тоосу", "Какшаал Ала-Тоосу", "Тескей Ала-Тоосу"], correct: 0 },
      { q: "Кыргызстан БУУга (ООН) качан мүчө болуп кирген?", options: ["1992-жылы 2-мартта", "1991-жылы 31-августта", "1993-жылы 5-майда", "1995-жылы 10-ноябрда"], correct: 0 },
      { q: "Талас облусундагы эң белгилүү тарыхый күмбөз кайсы?", options: ["Манастын күмбөзү", "Шах-Фазиль күмбөзү", "Таш-Рабат", "Өзгөн күмбөзү"], correct: 0 },
      { q: "Кыргыз Республикасынын мамлекеттик герби качан кабыл алынган?", options: ["1994-жылы 14-январда", "1992-жылы 18-декабрда", "1993-жылы 10-майда", "1991-жылы 31-августта"], correct: 0 },
      { q: "Кыргызстанда канча облус бар?", options: ["7 облус", "6 облус", "8 облус", "5 облус"], correct: 0 },
      { q: "Кыргызстандын эң бийик тоолуу көлү кайсы?", options: ["Чатыр-Көл", "Соң-Көл", "Ысык-Көл", "Сары-Челек"], correct: 0 }
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
