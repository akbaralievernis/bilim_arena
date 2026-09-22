/**
 * Bilim Arena - Quantum Glass Portal Logic
 */

(function () {
  'use strict';

  // --- CONFIG & CONSTANTS ---
  const GAMES = [
    {
      id: "mafia",
      title: "Мафия",
      tag: "Ролдук",
      difficulty: "hard",
      difficultyText: "Татаал",
      href: "./games/mafia/index.html",
      img: "./assets/mafia.webp",
      desc: "Класс менен онлайн: QR-код аркылуу телефондон кошулуп, ролдорду ойноңуз. Мугалим — алып баруучу."
    },
    {
      id: "sentence",
      title: "Сүйлөмдү түз",
      tag: "Текст",
      difficulty: "easy",
      difficultyText: "Оңой",
      href: "./games/sentence/index.html",
      img: "./assets/suilom.webp",
      desc: "Сөздөрдү туура тартипте тандап, сүйлөмдү чогултасыз."
    },
    {
      id: "odd",
      title: "Ашыкчаны тап",
      tag: "Логика",
      difficulty: "medium",
      difficultyText: "Орто",
      href: "./games/odd-one-out/index.html",
      img: "./assets/ashykcha.webp",
      desc: "Төрт варианттын ичинен эрежеге туура келбеген бирөөнү табыңыз."
    },
    {
      id: "focus",
      title: "Фокус Дуэль",
      tag: "Реакция",
      difficulty: "medium",
      difficultyText: "Орто",
      href: "./games/focus-duel/index.html",
      img: "./assets/fokus.webp",
      desc: "Экрандагы керектүү элементти атаандаштан тезирээк табыңыз."
    },
    {
      id: "citadel",
      title: "Цитаделди ээлөө",
      tag: "Тактика",
      difficulty: "hard",
      difficultyText: "Татаал",
      href: "./games/citadel/index.html",
      img: "./assets/sitadeli.webp",
      desc: "Суроолорго туура жооп берип, аймактарды басып алыңыз."
    }
  ];

  // Тил үйрөнүү оюндары (сүрөт ордуна эмодзи жана градиент)
  const LANG_GAMES = [
    {
      id: "flashcards", title: "Сөз карточкалары", tag: "Сөздүк",
      difficulty: "easy", difficultyText: "Оңой", href: "./games/flashcards/index.html",
      emoji: "📇", grad: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      desc: "Сөздү көр, котормосун ук жана эсте. Акылдуу кайталоо системасы унутулган сөздөрдү кайра чыгарат."
    },
    {
      id: "word-match", title: "Жупташтыр", tag: "Эс тутум",
      difficulty: "easy", difficultyText: "Оңой", href: "./games/word-match/index.html",
      emoji: "🃏", grad: "linear-gradient(135deg,#ec4899,#f43f5e)",
      desc: "Карточкаларды ачып, сөз менен анын котормосун жупташтыр. Кыргызча, орусча, англисче."
    },
    {
      id: "wordle", title: "Сөз табышмак", tag: "Табышмак",
      difficulty: "medium", difficultyText: "Орто", href: "./games/wordle/index.html",
      emoji: "🔤", grad: "linear-gradient(135deg,#22c55e,#0ea5e9)",
      desc: "5 тамгалуу кыргыз сөзүн 6 аракетте тап. Күн сайын жаңы сөз!"
    },
    {
      id: "word-rain", title: "Сөз жамгыры", tag: "Аркада",
      difficulty: "medium", difficultyText: "Орто", href: "./games/word-rain/index.html",
      emoji: "🌧️", grad: "linear-gradient(135deg,#0ea5e9,#6366f1)",
      desc: "Сөздөр асмандан түшөт — жерге жеткенче туура котормосун бас. Ылдамдык өсө берет!"
    },
    {
      id: "balloons", title: "Шарлар", tag: "Орфография",
      difficulty: "easy", difficultyText: "Оңой", href: "./games/balloons/index.html",
      emoji: "🎈", grad: "linear-gradient(135deg,#f59e0b,#ef4444)",
      desc: "Сүрөт жана котормо боюнча кыргыз сөзүн тамга-тамга тап. Ар бир ката — бир шар жарылат!"
    }
  ];

  const WEBCAM_GAMES = [
    {
      id: "eagle-flappy",
      title: "Кыргыз Бүркүтү",
      tag: "Камера / Жест",
      difficulty: "medium",
      difficultyText: "Орто",
      href: "./games/eagle/index.html",
      img: "./assets/berkut.webp",
      desc: "Веб-камера аркылуу колдун кыймылы менен бүркүттү башкарып, тоскоолдуктардан өтүңүз."
    },
    {
      id: "stick-catch",
      title: "Ылдамдык сыноо",
      tag: "Реакция / AI",
      difficulty: "easy",
      difficultyText: "Оңой",
      href: "./games/reaction/index.html",
      img: "./assets/catch.webp",
      desc: "Жогорудан түшкөн объекттерди веб-камеранын жардамы менен виртуалдуу түрдө кармап калыңыз."
    },
    {
      id: "neon-draw",
      title: "Неон сүрөт AI",
      tag: "Чыгармачылык / AI",
      difficulty: "easy",
      difficultyText: "Оңой",
      href: "./web/neon-draw.html",
      img: "./assets/3.webp",
      desc: "Колдун кыймылынын жардамы менен абада неон сызыктары менен сүрөт тартыңыз."
    },
    {
      id: "hand-shooter",
      title: "Виртуалдык Тир",
      tag: "Оюн / Камера",
      difficulty: "medium",
      difficultyText: "Орто",
      href: "./web/hand-shooter.html",
      img: "./assets/2.webp",
      desc: "Колуңузду тапанча катары колдонуп, буталарды ылдамдыкта атып кулатыңыз."
    },
    {
      id: "build-3d",
      title: "3D Курулуш",
      tag: "3D / Жесттер",
      difficulty: "hard",
      difficultyText: "Татаал",
      href: "./web/build-3d.html",
      img: "./assets/1.webp",
      desc: "Колдор менен мейкиндикти башкарып, кубдардан виртуалдык дүйнөлөрдү куруңуз."
    }
  ];

  // --- STATE ---
  const state = {
    searchQuery: '',
    currentFilter: 'all',
    favorites: (() => {
      try { return JSON.parse(localStorage.getItem('BA_FAVORITES') || '[]'); } catch (e) { return []; }
    })()
  };

  // --- UTILITIES ---
  const $ = (id) => document.getElementById(id);
  const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  const showToast = (message) => {
    const container = $('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast glass'; // Using the new glass utility
    toast.style.cssText = `
        padding: 12px 24px;
        margin-bottom: 10px;
        color: #fff;
        border-radius: 12px;
        font-weight: 600;
        animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  };

  // --- THEME ---
  const initTheme = () => {
    const saved = localStorage.getItem('BA_PORTAL_THEME');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (systemDark ? 'dark' : 'light');

    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('light', theme === 'light');
    const btn = $('themeBtn');
    if (btn) btn.querySelector('.themeIcon').textContent = theme === 'dark' ? '🌙' : '☀️';
  };

  const toggleTheme = () => {
    const isDark = document.body.classList.contains('dark');
    const nextTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('BA_PORTAL_THEME', nextTheme);
    initTheme();
    showToast(`${nextTheme === 'dark' ? 'Түнкү' : 'Күндүзгү'} тема иштетилди`);
  };

  // --- ACTIONS ---
  const toggleFavorite = (e, gameId) => {
    e.stopPropagation();
    const idx = state.favorites.indexOf(gameId);
    if (idx > -1) {
      state.favorites.splice(idx, 1);
      showToast('Сүйүктүүлөрдөн өчүрүлдү');
    } else {
      state.favorites.push(gameId);
      showToast('Сүйүктүүлөргө кошулду');
    }
    localStorage.setItem('BA_FAVORITES', JSON.stringify(state.favorites));
    renderGrid();
    renderLangGrid();
    renderWebcamGrid();
  };

  const startGame = (href) => {
    const pageFade = $('pageFade');
    if (pageFade) {
      pageFade.classList.add('on');
      setTimeout(() => {
        window.location.href = href;
      }, 400);
    } else {
      window.location.href = href;
    }
  };

  // --- UI RENDERING ---
  const createGameCard = (game) => {
    const isFav = state.favorites.includes(game.id);
    const card = document.createElement('div');
    card.className = 'gameCard reveal';
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.setAttribute('aria-label', `${game.title} — ойноо`);
    const best = window.BA ? window.BA.best(game.id) : 0;

    card.innerHTML = `
      <div class="cardImageWrapper">
        ${game.img ? `<div class="shimmer"></div>
        <img src="${game.img}" alt="" class="gameImg" loading="lazy" decoding="async" width="800" height="600"
             onload="const shimmer = this.parentElement.querySelector('.shimmer'); if(shimmer) shimmer.remove()"
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzMzMiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4='">`
        : `<div class="emojiCover" style="background:${game.grad}"><span>${game.emoji}</span></div>`}
        <div class="gameMeta">
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <span class="chip">${game.tag}</span>
            <span class="difficulty ${game.difficulty}">${game.difficultyText}</span>
          </div>
          <button class="favBtn ${isFav ? 'active' : ''}" type="button" aria-pressed="${isFav}" aria-label="Сүйүктүүлөргө кошуу">★</button>
        </div>
      </div>
      <div class="cardContent">
        <h3 class="gameTitle">${game.title}</h3>
        <p class="gameDesc">${game.desc}</p>
        <div class="cardFooter" style="margin-top: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
           <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em; text-transform: uppercase;">Ойноо →</span>
           ${best ? `<span class="bestTag">🏆 ${best}</span>` : ''}
        </div>
      </div>
    `;

    card.addEventListener('click', () => startGame(game.href));
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); startGame(game.href); }
    });
    const favBtn = card.querySelector('.favBtn');
    if (favBtn) {
      favBtn.addEventListener('click', (event) => toggleFavorite(event, game.id));
    }

    return card;
  };

  const renderGrid = () => {
    const grid = $('gameGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = GAMES.filter(g => {
      const q = state.searchQuery.trim().toLowerCase();
      const matchSearch = !q || (g.title + ' ' + g.desc + ' ' + g.tag).toLowerCase().includes(q);
      const matchFilter = state.currentFilter === 'all' ||
        (state.currentFilter === 'fav' ? state.favorites.includes(g.id) : g.tag === state.currentFilter);
      return matchSearch && matchFilter;
    }).sort((a, b) => state.favorites.includes(b.id) - state.favorites.includes(a.id));

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="emptyState">Оюн табылган жок.</div>`;
      return;
    }

    filtered.forEach(g => grid.appendChild(createGameCard(g)));
    initAnimations();
  };

  const renderWebcamGrid = () => {
    const grid = $('webcamGrid');
    if (!grid) return;
    grid.innerHTML = '';

    WEBCAM_GAMES.forEach(g => {
      const card = createGameCard(g);
      card.classList.add('webcam-card');
      grid.appendChild(card);
    });
    initAnimations();
  };

  const renderLangGrid = () => {
    const grid = $('langGrid');
    if (!grid) return;
    grid.innerHTML = '';
    LANG_GAMES.forEach(g => {
      const card = createGameCard(g);
      card.classList.add('lang-card');
      grid.appendChild(card);
    });
    initAnimations();
  };

  // --- PROFILE / PROGRESS ---
  const renderProfile = () => {
    if (!window.BA) return;
    const p = window.BA.get();
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('topLevel', p.level);
    set('topStreak', p.streak);
    set('profTitle', p.title);
    set('profLevel', `${p.level}-деңгээл`);
    set('profXP', `${p.xp} XP`);
    set('xpNote', `Кийинки деңгээлге ${p.levelNeed - p.levelInto} XP калды`);
    set('statStreak', p.streak);
    set('statLearned', p.learned);
    set('statGames', Object.keys(p.games).length);
    const bar = $('xpBar');
    if (bar) bar.style.width = p.levelPct + '%';
    const wrap = $('xpBarWrap');
    if (wrap) wrap.setAttribute('aria-valuenow', p.levelPct);

    const goalPct = Math.min(100, Math.round((p.dayXP / p.dailyGoal) * 100));
    const ring = $('goalRing');
    if (ring) ring.style.setProperty('--p', goalPct);
    set('goalNum', Math.min(p.dayXP, 999));
    set('goalText', goalPct >= 100 ? '🎉 Бүгүнкү максат аткарылды!' :
      p.dayXP > 0 ? `Дагы ${p.dailyGoal - p.dayXP} XP — алга!` : 'Бүгүн ойной баштаңыз!');

    const badges = $('badges');
    if (badges) {
      badges.innerHTML = window.BA.BADGES.map(b => {
        const on = p.badges.includes(b.id);
        return `<div class="badge ${on ? 'on' : ''}" title="${b.title}${on ? '' : ' (жабык)'}"><span>${b.icon}</span><small>${b.title}</small></div>`;
      }).join('');
    }
  };

  // Күндүн сөзү — күн сайын сөздүктөн башка сөз
  const renderWordOfDay = () => {
    const V = window.BA_VOCAB;
    if (!V) return;
    const d = new Date();
    const n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    const w = V.ALL[(n * 2654435761 >>> 0) % V.ALL.length];
    $('wodEmoji').textContent = w.emoji;
    $('wodWord').textContent = w.ky;
    $('wodTr').textContent = `🇷🇺 ${w.ru} · 🇬🇧 ${w.en}`;
    const say = $('wodSay');
    say.onclick = () => {
      if (!window.BA || !window.BA.speak(w.en, 'en')) showToast('Бул браузерде үн менен окуу жок');
    };
  };

  const renderFilters = () => {
    const container = $('filterButtons');
    if (!container) return;
    const tags = ['all', ...new Set(GAMES.map(g => g.tag)), 'fav'];
    container.innerHTML = '';

    tags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = `filterBtn ${state.currentFilter === tag ? 'active' : ''}`;
      btn.type = 'button';
      btn.setAttribute('aria-pressed', state.currentFilter === tag);
      btn.textContent = tag === 'all' ? 'Баары' : tag === 'fav' ? '★ Сүйүктүүлөр' : tag;
      btn.addEventListener('click', () => {
        state.currentFilter = tag;
        renderFilters();
        renderGrid();
      });
      container.appendChild(btn);
    });
  };

  const initAnimations = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  };

  // --- INIT ---
  const init = () => {
    initTheme();
    renderFilters();

    const themeBtn = $('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    const searchInput = $('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        state.searchQuery = e.target.value;
        renderGrid();
      }, 300));
    }

    renderGrid();
    renderLangGrid();
    renderWebcamGrid();
    renderProfile();
    renderWordOfDay();
    initAnimations();

    const resetBtn = $('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      if (confirm('Бардык XP, деңгээл жана үйрөнгөн сөздөр өчүрүлөт. Уланталыбы?')) {
        window.BA.reset();
        renderProfile();
        showToast('Прогресс тазаланды');
      }
    });

    // Офлайн режим (сайт http/https аркылуу ачылганда гана)
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  };

  // Оюндан «Артка» басып кайтканда бет караңгы бойдон калбашы үчүн
  window.addEventListener('pageshow', () => {
    const fade = $('pageFade');
    if (fade) fade.classList.remove('on');
    renderProfile();
  });

  document.addEventListener('DOMContentLoaded', init);

})();
