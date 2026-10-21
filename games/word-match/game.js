/* Перенесено из index.html, чтобы страница работала с политикой безопасности (CSP) */
  (function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const V = window.BA_VOCAB;
    const S = window.BAShell;
    const SIZES = [
      { value: '6', label: '6 жуп' },
      { value: '8', label: '8 жуп' },
      { value: '10', label: '10 жуп' }
    ];
    const cfg = { pair: S.recall('wm_pair', 'ky-ru'), cat: S.recall('wm_cat', 'all'), size: S.recall('wm_size', '6') };
    let st = null, timerId = 0;

    S.chipGroup($('pairChips'), S.PAIRS, cfg.pair, (v) => { cfg.pair = v; S.remember('wm_pair', v); });
    S.chipGroup($('catChips'), S.categoryItems(), cfg.cat, (v) => { cfg.cat = v; S.remember('wm_cat', v); });
    S.chipGroup($('sizeChips'), SIZES, cfg.size, (v) => { cfg.size = v; S.remember('wm_size', v); });

    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const flag = (l) => (l === 'emoji' ? '' : V.LANGS[l].flag);

    function faceHTML(word, lang) {
      if (lang === 'emoji') return `<span class="emo">${word.emoji}</span>`;
      return `<span class="lang">${flag(lang)}</span>${word[lang]}`;
    }

    function start() {
      const n = +cfg.size;
      const [from, to] = cfg.pair.split('-');
      let pool = V.words(cfg.cat);
      if (pool.length < n) pool = V.words('all');
      // Бир эле котормосу бар сөздөрдү кайталабайбыз
      // (бир карточка эки жупка туура келбеши үчүн)
      const seenFrom = new Set(), seenTo = new Set();
      const words = V.fresh(null, pool).filter((w) => {
        if (seenFrom.has(w[from]) || seenTo.has(w[to])) return false;
        seenFrom.add(w[from]); seenTo.add(w[to]); return true;
      }).slice(0, n);

      const cards = V.shuffle(words.flatMap((w) => [
        { id: w.id, html: faceHTML(w, from), word: w },
        { id: w.id, html: faceHTML(w, to), word: w }
      ]));

      V.seen(words);
      st = { cards, open: [], done: 0, total: words.length, moves: 0, secs: 0, lock: false, words, misses: {} };
      const board = $('board');
      board.style.setProperty('--cols', window.innerWidth < 560 ? 4 : (n >= 10 ? 5 : 4));
      board.innerHTML = '';
      cards.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mcard';
        b.setAttribute('aria-label', 'Карточка ' + (i + 1));
        b.innerHTML = `<div class="inner"><div class="face front">?</div><div class="face back">${c.html}</div></div>`;
        b.addEventListener('click', () => flip(i, b));
        c.el = b;
        board.appendChild(b);
      });

      $('setup').classList.add('hidden');
      $('endModal').classList.add('hidden');
      $('game').classList.remove('hidden');
      updateHud();
      clearInterval(timerId);
      timerId = setInterval(() => { st.secs++; $('time').textContent = fmt(st.secs); }, 1000);
    }

    function updateHud() {
      $('pairsLeft').textContent = st.total - st.done;
      $('moves').textContent = st.moves;
      $('time').textContent = fmt(st.secs);
    }

    function flip(i, el) {
      if (st.lock || el.classList.contains('open') || el.classList.contains('done')) return;
      window.BA.sfx.tap();
      el.classList.add('open');
      st.open.push(i);
      if (st.open.length < 2) return;

      st.moves++;
      const [a, b] = st.open.map((k) => st.cards[k]);
      if (a.id === b.id) {
        a.el.classList.add('done'); b.el.classList.add('done');
        st.done++;
        st.open = [];
        window.BA.sfx.ok();
        window.BA.markWord(a.id, !st.misses[a.id]);
        // Котормону үн менен айтып берет (браузерде үн болсо)
        const [from, to] = cfg.pair.split('-');
        const sayLang = to !== 'emoji' && to !== 'ky' ? to : (from !== 'emoji' && from !== 'ky' ? from : 'ky');
        window.BA.speak(a.word[sayLang], sayLang);
        if (st.done === st.total) finish();
      } else {
        st.lock = true;
        st.misses[a.id] = (st.misses[a.id] || 0) + 1;
        st.misses[b.id] = (st.misses[b.id] || 0) + 1;
        a.el.classList.add('wrong'); b.el.classList.add('wrong');
        window.BA.sfx.bad();
        setTimeout(() => {
          [a, b].forEach((c) => c.el.classList.remove('open', 'wrong'));
          st.open = []; st.lock = false;
        }, 850);
      }
      updateHud();
    }

    function finish() {
      clearInterval(timerId);
      const ratio = st.total / st.moves; // 1 = мыкты
      const stars = ratio >= 0.75 ? 3 : ratio >= 0.5 ? 2 : 1;
      const score = Math.max(10, Math.round(st.total * 100 * ratio - st.secs));
      const xp = st.total * 4 + stars * 5;
      const record = window.BA.saveBest('word-match', score);
      window.BA.addXP('word-match', xp);
      window.BA.sfx.win();
      window.BA.confetti();
      $('endStars').innerHTML = [0, 1, 2].map((i) => { const f = i < stars ? '#FFB547' : 'none'; return '<svg width="28" height="28" viewBox="0 0 24 24" fill="' + f + '" stroke="#E0A100" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z"/></svg>'; }).join('');
      $('endStars').setAttribute('aria-label', `${stars}/3`);
      const T = BALang.t;
      $('endText').innerHTML = [T('{n} аракет', { n: st.moves }), fmt(st.secs), T('<b>{n}</b> упай', { n: score })]
        .concat(record ? [T('Жаңы рекорд!')] : []).join(' · ');
      const [from, to] = cfg.pair.split('-');
      $('learnedList').innerHTML = st.words.map((w) =>
        `<span>${w.emoji} ${from === 'emoji' ? '' : w[from] + ' — '}${w[to]}</span>`).join('');
      setTimeout(() => $('endModal').classList.remove('hidden'), 600);
    }

    $('startBtn').addEventListener('click', start);
    $('againBtn').addEventListener('click', start);
    $('menuBtn').addEventListener('click', () => {
      $('endModal').classList.add('hidden');
      $('game').classList.add('hidden');
      $('setup').classList.remove('hidden');
    });
  })();
