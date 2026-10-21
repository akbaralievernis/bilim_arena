/* Перенесено из index.html, чтобы страница работала с политикой безопасности (CSP) */
  (function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const V = window.BA_VOCAB, S = window.BAShell, BA = window.BA;
    const LETTERS = 'а б в г д е ё ж з и й к л м н ң о ө п р с т у ү ф х ц ч ш щ ъ ы ь э ю я'.split(' ');
    const KG = new Set(['ң', 'ө', 'ү']);
    const COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#06b6d4', '#6366f1', '#ec4899'];
    const LIVES = 6;
    let cat = S.recall('bl_cat', 'all');
    const game = { round: 0, score: 0, streak: 0, used: new Set() };
    let st = null;

    S.chipGroup($('catChips'), S.categoryItems(), cat, (v) => { cat = v; S.remember('bl_cat', v); game.used.clear(); next(); });

    function pickWord() {
      // Кеминде 3 тамгалуу сөздөр, ушул сессияда кайталанбайт
      let pool = V.words(cat).filter((w) => w.ky.replace(/[\s-]/g, '').length >= 3 && !game.used.has(w.id));
      if (!pool.length) { game.used.clear(); pool = V.words(cat).filter((w) => w.ky.replace(/[\s-]/g, '').length >= 3); }
      const w = V.fresh(null, pool)[0]; // невиданное во всех играх — раньше
      game.used.add(w.id);
      V.seen(w);
      return w;
    }

    function next() {
      $('endModal').classList.add('hidden');
      const w = pickWord();
      st = { w, letters: [...w.ky], guessed: new Set(), lives: LIVES, over: false };
      game.round++;
      $('clueEmoji').textContent = w.emoji;
      $('clueTr').textContent = `RU: ${w.ru} · EN: ${w.en}`;
      $('balloons').innerHTML = Array.from({ length: LIVES }, (_, i) => `<div class="bl" style="--c:${COLORS[i]}"></div>`).join('');
      const kb = $('kb'); kb.innerHTML = '';
      LETTERS.forEach((l) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'key' + (KG.has(l) ? ' kg' : ''); b.textContent = l; b.dataset.l = l;
        b.addEventListener('click', () => guess(l));
        kb.appendChild(b);
      });
      renderSlots();
      hud();
    }

    function renderSlots(reveal) {
      $('slots').innerHTML = st.letters.map((ch) => {
        if (ch === ' ' || ch === '-') return `<div class="slot space">${ch === '-' ? '-' : ''}</div>`;
        const known = st.guessed.has(ch);
        if (known) return `<div class="slot show">${ch}</div>`;
        return reveal ? `<div class="slot missed">${ch}</div>` : '<div class="slot"></div>';
      }).join('');
    }

    function hud() {
      $('round').textContent = game.round;
      $('score').textContent = game.score;
      $('streak').textContent = game.streak;
    }

    function guess(l) {
      if (!st || st.over || st.guessed.has(l)) return;
      st.guessed.add(l);
      const key = document.querySelector(`.key[data-l="${l}"]`);
      if (st.letters.includes(l)) {
        key.classList.add('ok'); BA.sfx.ok();
        renderSlots();
        const solved = st.letters.every((ch) => ch === ' ' || ch === '-' || st.guessed.has(ch));
        if (solved) finish(true);
      } else {
        key.classList.add('no'); BA.sfx.bad();
        st.lives--;
        const alive = $('balloons').querySelectorAll('.bl:not(.pop)');
        if (alive.length) alive[alive.length - 1].classList.add('pop');
        if (st.lives <= 0) finish(false);
      }
      key.disabled = true;
    }

    function finish(won) {
      st.over = true;
      BA.markWord(st.w.id, won);
      if (won) {
        const pts = 10 + st.lives * 5;
        game.score += pts; game.streak++;
        BA.addXP('balloons', Math.round(pts / 2));
        BA.saveBest('balloons', game.score);
        BA.sfx.win();
        if (game.streak % 5 === 0) BA.confetti();
      } else {
        game.streak = 0;
        BA.sfx.lose();
        renderSlots(true);
      }
      hud();
      BA.speak(st.w.en, 'en');
      $('endEmoji').innerHTML = BAShell.endIcon(won ? (st.lives === LIVES ? 'trophy' : 'star') : 'target');
      $('endTitle').textContent = won ? (st.lives === LIVES ? 'Мыкты! Бир да ката жок!' : 'Таптың!') : 'Шарлар жарылды...';
      $('endWord').textContent = `${st.w.emoji} ${st.w.ky.toUpperCase()}`;
      $('endTr').textContent = `RU: ${st.w.ru} · EN: ${st.w.en}`;
      setTimeout(() => $('endModal').classList.remove('hidden'), won ? 500 : 900);
    }

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!$('endModal').classList.contains('hidden')) { if (e.key === 'Enter') next(); return; }
      const k = e.key.toLowerCase();
      if (LETTERS.includes(k)) guess(k);
    });
    $('nextBtn').addEventListener('click', next);
    next();
  })();
