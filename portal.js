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
      img: "./assets/mafia.png",
      desc: "Шектенүү жана алдоо! Психологиялык мафия оюнун досторуңуз менен ойноңуз."
    },
    {
      id: "sentence",
      title: "Сүйлөмдү түз",
      tag: "Текст",
      difficulty: "easy",
      difficultyText: "Оңой",
      href: "./games/sentence/index.html",
      img: "./assets/suilom.png",
      desc: "Сөздөрдү туура тартипте тандап, сүйлөмдү чогултасыз."
    },
    {
      id: "odd",
      title: "Ашыкчаны тап",
      tag: "Логика",
      difficulty: "medium",
      difficultyText: "Орто",
      href: "./games/odd-one-out/index.html",
      img: "./assets/ashykcha.png",
      desc: "Төрт варианттын ичинен эрежеге туура келбеген бирөөнү табыңыз."
    },
    {
      id: "focus",
      title: "Фокус Дуэль",
      tag: "Реакция",
      difficulty: "medium",
      difficultyText: "Орто",
      href: "./games/focus-duel/index.html",
      img: "./assets/fokus.png",
      desc: "Экрандагы керектүү элементти атаандаштан тезирээк табыңыз."
    },
    {
      id: "citadel",
      title: "Цитаделди ээлөө",
      tag: "Тактика",
      difficulty: "hard",
      difficultyText: "Татаал",
      href: "./games/citadel/index.html",
      img: "./assets/sitadeli.png",
      desc: "Суроолорго туура жооп берип, аймактарды басып алыңыз."
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
      img: "./assets/berkut.png",
      desc: "Веб-камера аркылуу колдун кыймылы менен бүркүттү башкарып, тоскоолдуктардан өтүңүз."
    },
    {
      id: "stick-catch",
      title: "Ылдамдык сыноо",
      tag: "Реакция / AI",
      difficulty: "easy",
      difficultyText: "Оңой",
      href: "./games/reaction/index.html",
      img: "./assets/catch.png",
      desc: "Жогорудан түшкөн объекттерди веб-камеранын жардамы менен виртуалдуу түрдө кармап калыңыз."
    },
    {
      id: "neon-draw",
      title: "Неоновое Рисование AI",
      tag: "Творчество / AI",
      difficulty: "easy",
      difficultyText: "Оңой",
      href: "./web/neon-draw.html",
      img: "./assets/3.jpg",
      desc: "Рисуйте в воздухе неоновыми линиями с помощью жестов рук."
    },
    {
      id: "hand-shooter",
      title: "Виртуальный Тир",
      tag: "Игра / Камера",
      difficulty: "medium",
      difficultyText: "Орто",
      href: "./web/hand-shooter.html",
      img: "./assets/2.jpg",
      desc: "Используйте свою руку как пистолет и сбивайте цели на скорости."
    },
    {
      id: "build-3d",
      title: "3D Строительство",
      tag: "3D / Жесты",
      difficulty: "hard",
      difficultyText: "Татаал",
      href: "./web/build-3d.html",
      img: "./assets/1.jpg",
      desc: "Стройте виртуальные миры из кубов, управляя пространством руками."
    }
  ];

  // --- STATE ---
  const state = {
    searchQuery: '',
    currentFilter: 'all',
    favorites: JSON.parse(localStorage.getItem('BA_FAVORITES') || '[]')
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

    card.innerHTML = `
      <div class="cardImageWrapper">
        <div class="shimmer"></div>
        <img src="${game.img}" alt="${game.title}" class="gameImg" loading="lazy" 
             onload="const shimmer = this.parentElement.querySelector('.shimmer'); if(shimmer) shimmer.remove()"
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzMzMiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4='">
        <div class="gameMeta">
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <span class="chip">${game.tag}</span>
            <span class="difficulty ${game.difficulty}">${game.difficultyText}</span>
          </div>
          <button class="favBtn ${isFav ? 'active' : ''}" aria-label="Сүйүктүү">★</button>
        </div>
      </div>
      <div class="cardContent">
        <h3 class="gameTitle">${game.title}</h3>
        <p class="gameDesc">${game.desc}</p>
        <div class="cardFooter" style="margin-top: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
           <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em; text-transform: uppercase;">Ойноо →</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => startGame(game.href));
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
      const matchSearch = g.title.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchFilter = state.currentFilter === 'all' || g.tag === state.currentFilter;
      return matchSearch && matchFilter;
    });

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

  const renderFilters = () => {
    const container = $('filterButtons');
    if (!container) return;
    const tags = ['all', ...new Set(GAMES.map(g => g.tag))];
    container.innerHTML = '';

    tags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = `filterBtn ${state.currentFilter === tag ? 'active' : ''}`;
      btn.textContent = tag === 'all' ? 'Баары' : tag;
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
    renderWebcamGrid();
    initAnimations();
  };

  document.addEventListener('DOMContentLoaded', init);

})();
