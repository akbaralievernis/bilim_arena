/**
 * Bilim Arena — жалпы прогресс системасы (XP, деңгээл, күнүмдүк серия, сөздөр)
 * Бардык маалымат браузердин localStorage'ында сакталат.
 * Колдонуу:  BA.addXP('wordle', 30);  BA.saveBest('wordle', 120);  BA.markWord(id, true)
 */
(function () {
  'use strict';

  const KEY = 'BA_PROGRESS_V1';
  const DAILY_GOAL = 100; // күнүнө XP максаты

  const today = () => {
    const d = new Date(); // жергиликтүү убакыт (UTC эмес)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

  const blank = () => ({
    xp: 0,
    games: {},        // { gameId: { plays, best, xp } }
    words: {},        // { wordId: { ok, bad, box, due } }  — Лейтнер кутучалары
    streak: 0,
    lastDay: null,
    dayXP: 0,
    badges: []
  });

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      return d && typeof d === 'object' ? Object.assign(blank(), d) : blank();
    } catch (e) {
      return blank();
    }
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* толук же жабык */ }
  }

  // Деңгээл: ар бир кийинки деңгээлге көбүрөөк XP керек
  function levelInfo(xp) {
    let level = 1, need = 100, rest = xp;
    while (rest >= need) { rest -= need; level++; need = Math.round(need * 1.25); }
    return { level, into: rest, need, pct: Math.round((rest / need) * 100) };
  }

  const TITLES = ['Жаңы окуучу', 'Изденүүчү', 'Билимкана', 'Акылман', 'Чечен', 'Устат', 'Манасчы', 'Билим баатыры'];
  const titleFor = (lvl) => TITLES[Math.min(TITLES.length - 1, Math.floor((lvl - 1) / 2))];

  const BADGES = [
    { id: 'first', icon: '🎉', title: 'Биринчи кадам', test: (d) => d.xp > 0 },
    { id: 'xp500', icon: '⭐', title: '500 XP', test: (d) => d.xp >= 500 },
    { id: 'xp2000', icon: '🌟', title: '2000 XP', test: (d) => d.xp >= 2000 },
    { id: 'streak3', icon: '🔥', title: '3 күн катары менен', test: (d) => d.streak >= 3 },
    { id: 'streak7', icon: '🏆', title: 'Бир жума катары менен', test: (d) => d.streak >= 7 },
    { id: 'words25', icon: '📗', title: '25 сөз үйрөндүм', test: (d) => learnedCount(d) >= 25 },
    { id: 'words100', icon: '📚', title: '100 сөз үйрөндүм', test: (d) => learnedCount(d) >= 100 },
    { id: 'explorer', icon: '🧭', title: '5 түрдүү оюн ойноду', test: (d) => Object.keys(d.games).length >= 5 }
  ];

  function learnedCount(d) {
    return Object.values(d.words).filter((w) => w.box >= 3).length;
  }

  function touchDay(d) {
    const t = today();
    if (d.lastDay === t) return;
    if (d.lastDay && daysBetween(d.lastDay, t) === 1) d.streak += 1;
    else d.streak = 1;
    d.lastDay = t;
    d.dayXP = 0;
  }

  function checkBadges(d) {
    const fresh = [];
    BADGES.forEach((b) => {
      if (!d.badges.includes(b.id) && b.test(d)) { d.badges.push(b.id); fresh.push(b); }
    });
    return fresh;
  }

  // ---- Кичинекей билдирүү (toast) ----
  function toast(html) {
    let host = document.getElementById('baToastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'baToastHost';
      host.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.style.cssText = 'background:rgba(15,23,42,.92);color:#fff;padding:10px 18px;border-radius:14px;font:600 15px system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3);transition:opacity .4s,transform .4s;transform:translateY(10px);opacity:0';
    el.innerHTML = html;
    host.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 2600);
  }

  // ---- Үн эффекттери (файлсыз, Web Audio) ----
  let actx = null;
  const sfxOn = () => localStorage.getItem('BA_SOUND') !== 'off';
  function tone(freq, dur = 0.12, type = 'sine', vol = 0.07, delay = 0) {
    if (!sfxOn()) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = actx.currentTime + delay;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    } catch (e) { /* үн жок */ }
  }
  const sfx = {
    ok() { tone(660, 0.1, 'triangle'); tone(880, 0.12, 'triangle', 0.07, 0.08); },
    bad() { tone(200, 0.18, 'sawtooth', 0.05); },
    tap() { tone(520, 0.05, 'sine', 0.04); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.07, i * 0.11)); },
    lose() { [392, 330, 262].forEach((f, i) => tone(f, 0.2, 'triangle', 0.06, i * 0.14)); }
  };

  // ---- Үн менен окуу (Text-to-Speech) ----
  let voices = [];
  const loadVoices = () => { try { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (e) { voices = []; } };
  if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

  function voiceFor(lang) {
    const code = { ky: 'ky', ru: 'ru', en: 'en' }[lang] || lang;
    return voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(code));
  }
  /** Берилген тилде үн бар бекенин текшерет (кыргызча үн көп браузерлерде жок) */
  function canSpeak(lang) {
    if (!window.speechSynthesis) return false;
    if (!voices.length) loadVoices();
    return !!voiceFor(lang);
  }
  function speak(text, lang) {
    if (!window.speechSynthesis) return false;
    const v = voiceFor(lang);
    if (!v) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = v; u.lang = v.lang; u.rate = 0.85;
    speechSynthesis.speak(u);
    return true;
  }

  // ---- Конфетти (китепканасыз) ----
  function confetti(n = 120) {
    const c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99998';
    c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    const g = c.getContext('2d');
    const colors = ['#f43f5e', '#6366f1', '#22c55e', '#f59e0b', '#06b6d4', '#ec4899'];
    const ps = Array.from({ length: n }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight / 3,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4,
      s: 6 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0]
    }));
    let t = 0;
    (function frame() {
      g.clearRect(0, 0, c.width, c.height);
      ps.forEach((p) => {
        p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c;
        g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
      });
      if (++t < 150) requestAnimationFrame(frame); else c.remove();
    })();
  }

  // ---- Негизги API ----
  /**
   * Мост к прогрессу платформы (BA2_progress, core/progress.js).
   * Раньше XP из этих игр попадал в профиль только один раз — при первом
   * переносе. Теперь каждое начисление и каждая сыгранная игра отражаются
   * в профиле: XP, дневная цель, серия дней, счётчик игр.
   */
  const PLATFORM = 'BA2_progress';
  const MIGRATED = 'BA2_legacy_migrated';

  function toPlatform(gameId, { xp = 0, play = false, score = 0, legacyXpBefore = 0 } = {}) {
    try {
      const p = JSON.parse(localStorage.getItem(PLATFORM) || 'null') || {
        xp: 0, dayXP: 0, streak: 0, lastDay: null, skills: {}, topics: {}, games: {}, badges: [], dailyGoal: DAILY_GOAL
      };
      p.games = p.games || {};

      // Первый раз: переносим XP, накопленный здесь до появления моста
      if (!localStorage.getItem(MIGRATED)) {
        p.xp = (p.xp || 0) + Math.max(0, legacyXpBefore);
        localStorage.setItem(MIGRATED, '1');
      }

      const t = today();
      if (p.lastDay !== t) {
        p.streak = p.lastDay && daysBetween(p.lastDay, t) === 1 ? (p.streak || 0) + 1 : 1;
        p.lastDay = t;
        p.dayXP = 0;
      }
      const g = p.games[gameId] || (p.games[gameId] = { plays: 0, best: 0, xp: 0 });
      if (xp) { p.xp = (p.xp || 0) + xp; p.dayXP = (p.dayXP || 0) + xp; g.xp += xp; }
      if (play) { g.plays += 1; g.best = Math.max(g.best || 0, score || 0); }
      localStorage.setItem(PLATFORM, JSON.stringify(p));

      // Облачная синхронизация (если подключена) увидит, что прогресс изменился
      const meta = JSON.parse(localStorage.getItem('BA2_sync_meta') || '{}');
      meta.progress = Date.now();
      localStorage.setItem('BA2_sync_meta', JSON.stringify(meta));
    } catch (e) { /* хранилище недоступно — игра продолжает работать */ }
  }

  const BA = {
    DAILY_GOAL,
    BADGES,
    sfx, speak, canSpeak, confetti, toast,

    get() {
      const d = load();
      const lvl = levelInfo(d.xp);
      // Эгер кечээ ойнобосо, серия үзүлгөн болот
      let streak = d.streak;
      if (d.lastDay && daysBetween(d.lastDay, today()) > 1) streak = 0;
      const dayXP = d.lastDay === today() ? d.dayXP : 0;
      return {
        xp: d.xp, level: lvl.level, levelPct: lvl.pct, levelInto: lvl.into, levelNeed: lvl.need,
        title: titleFor(lvl.level), streak, dayXP, dailyGoal: DAILY_GOAL,
        learned: learnedCount(d), games: d.games, badges: d.badges
      };
    },

    /** XP кошот жана жаңы деңгээл/белгилерди билдирет */
    addXP(gameId, amount) {
      amount = Math.max(0, Math.round(amount || 0));
      if (!amount) return;
      const d = load();
      touchDay(d);
      const before = levelInfo(d.xp).level;
      d.xp += amount;
      d.dayXP += amount;
      const g = d.games[gameId] || (d.games[gameId] = { plays: 0, best: 0, xp: 0 });
      g.xp += amount;
      const fresh = checkBadges(d);
      save(d);
      toPlatform(gameId, { xp: amount, legacyXpBefore: d.xp - amount });
      const after = levelInfo(d.xp).level;
      toast(`✨ +${amount} XP`);
      if (after > before) { setTimeout(() => toast(`🎊 Жаңы деңгээл: <b>${after}</b> — ${titleFor(after)}`), 700); sfx.win(); }
      fresh.forEach((b, i) => setTimeout(() => toast(`${b.icon} Жаңы белги: <b>${b.title}</b>`), 1400 + i * 700));
    },

    /** Оюн бүткөндө чакырылат. Жаңы рекорд болсо true кайтарат */
    saveBest(gameId, score) {
      const d = load();
      const g = d.games[gameId] || (d.games[gameId] = { plays: 0, best: 0, xp: 0 });
      g.plays += 1;
      const record = score > g.best;
      if (record) g.best = score;
      checkBadges(d);
      save(d);
      toPlatform(gameId, { play: true, score, legacyXpBefore: d.xp });
      return record;
    },
    best(gameId) {
      const g = load().games[gameId];
      return g ? g.best : 0;
    },

    /** Сөздү туура/ката жооп берилди деп белгилейт (Лейтнер системасы, 0–5 кутуча) */
    markWord(wordId, correct) {
      const d = load();
      const w = d.words[wordId] || (d.words[wordId] = { ok: 0, bad: 0, box: 0, due: 0 });
      if (correct) { w.ok++; w.box = Math.min(5, w.box + 1); } else { w.bad++; w.box = Math.max(0, w.box - 2); }
      // Кийинки кайталоо: 0, 1, 2, 4, 7, 14 күндөн кийин
      const gap = [0, 1, 2, 4, 7, 14][w.box];
      w.due = Date.now() + gap * 86400000;
      save(d);
    },
    wordStats(wordId) {
      return load().words[wordId] || { ok: 0, bad: 0, box: 0, due: 0 };
    },
    allWordStats() {
      return load().words;
    },

    reset() { save(blank()); }
  };

  window.BA = BA;
})();
