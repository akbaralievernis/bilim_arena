/* Перенесено из index.html, чтобы страница работала с политикой безопасности (CSP) */
  (function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const V = window.BA_VOCAB, S = window.BAShell, BA = window.BA;
    const cfg = { pair: S.recall('wr_pair', 'ky-en'), cat: S.recall('wr_cat', 'all') };
    S.chipGroup($('pairChips'), S.PAIRS, cfg.pair, (v) => { cfg.pair = v; S.remember('wr_pair', v); });
    S.chipGroup($('catChips'), S.categoryItems(), cfg.cat, (v) => { cfg.cat = v; S.remember('wr_cat', v); });
    const ICON_PAUSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>';
    const ICON_PLAY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg>';
    const showBest = () => { const b = BA.best('word-rain'); $('bestLine').textContent = b ? `Рекорд: ${b}` : ''; };
    showBest();

    let st = null, raf = 0;

    function label(w, lang) {
      return lang === 'emoji' ? `<span class="e">${w.emoji}</span>` : w[lang];
    }

    function start() {
      const [from, to] = cfg.pair.split('-');
      let pool = V.words(cfg.cat);
      if (pool.length < 6) pool = V.words('all');
      st = { from, to, pool, queue: V.fresh(null, pool).reverse(), score: 0, combo: 0, lives: 3, right: 0, level: 1,
             drop: null, paused: false, last: 0, mistakes: [], total: 0 };
      $('sky').querySelectorAll('.drop, .pauseCover').forEach((x) => x.remove());
      $('pauseBtn').innerHTML = ICON_PAUSE;
      $('setup').classList.add('hidden');
      $('endModal').classList.add('hidden');
      $('game').classList.remove('hidden');
      $('pauseBtn').classList.remove('hidden');
      hud();
      nextDrop();
      cancelAnimationFrame(raf);
      st.last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function speed() { return 38 + st.level * 12; } // px/сек

    function nextDrop() {
      if (!st.queue.length) st.queue = V.fresh(null, st.pool).reverse(); // pop() берёт с конца — самые свежие там
      const w = st.queue.pop();
      V.seen(w);
      const el = document.createElement('div');
      el.className = 'drop';
      el.innerHTML = label(w, st.from);
      el.style.left = (20 + Math.random() * 60) + '%';
      $('sky').appendChild(el);
      st.drop = { w, el, y: -10, done: false };

      // Жооптор: 1 туура + 3 туура эмес (котормосу башка)
      const wrong = V.distractors(w, 3, st.to === 'emoji' ? 'emoji' : st.to);
      const opts = V.shuffle([w].concat(wrong));
      const box = $('answers'); box.innerHTML = '';
      opts.forEach((o, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'ans'; b.dataset.id = o.id;
        b.innerHTML = `<kbd>${i + 1}</kbd>${st.to === 'emoji' ? `<span style="font-size:1.8rem">${o.emoji}</span>` : o[st.to]}`;
        b.addEventListener('click', () => answer(o, b));
        box.appendChild(b);
      });
    }

    function answer(o, btn) {
      const d = st.drop;
      if (!d || d.done || st.paused) return;
      const ok = o.id === d.w.id || o[st.to] === d.w[st.to];
      st.total++;
      if (ok) {
        d.done = true;
        btn.classList.add('ok');
        d.el.classList.add('hit');
        st.combo++; st.right++;
        const mult = Math.min(5, 1 + Math.floor(st.combo / 3));
        // бийиктикке жараша бонус: канчалык тез болсо, ошончолук көп
        const h = $('sky').clientHeight;
        const bonus = Math.round(10 * (1 - d.y / h));
        st.score += (10 + bonus) * mult;
        if (st.right % 5 === 0) st.level++;
        BA.sfx.ok();
        BA.markWord(d.w.id, true);
        if (st.to !== 'emoji' && st.to !== 'ky') BA.speak(d.w[st.to], st.to);
        setTimeout(() => { d.el.remove(); if (st && st.lives > 0) nextDrop(); }, 280);
      } else {
        // Ката: туура жоопту көрсөтүп, кийинки сөзгө өтөбүз (бир жан кетет)
        btn.classList.add('no');
        st.score = Math.max(0, st.score - 5);
        loseLife(true);
      }
      hud();
    }

    function loseLife(landed) {
      const d = st.drop;
      st.lives--;
      BA.markWord(d.w.id, false);
      if (!st.mistakes.find((m) => m.id === d.w.id)) st.mistakes.push(d.w);
      if (landed) {
        d.done = true;
        // Туура жоопту көрсөтөбүз — окуучу ошол замат үйрөнсүн
        [...$('answers').children].forEach((b) => {
          b.disabled = true;
          if (b.dataset.id === d.w.id) b.classList.add('ok');
        });
        d.el.classList.add('miss');
        d.el.innerHTML = `${label(d.w, st.from)} = ${label(d.w, st.to)}`;
        st.combo = 0;
        BA.sfx.bad();
        setTimeout(() => { d.el.remove(); if (st.lives > 0) nextDrop(); }, 1200);
      }
      hud();
      if (st.lives <= 0) setTimeout(end, landed ? 1200 : 300);
    }

    function hud() {
      $('score').textContent = st.score;
      $('combo').textContent = 'x' + Math.min(5, 1 + Math.floor(st.combo / 3));
      $('level').textContent = st.level;
      $('lives').innerHTML = [0, 1, 2].map((i) => { const f = i < Math.max(0, st.lives) ? '#EF5350' : 'none'; return '<svg width="20" height="20" viewBox="0 0 24 24" fill="' + f + '" stroke="#EF5350" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>'; }).join('');
      $('lives').setAttribute('aria-label', `${Math.max(0, st.lives)}/3`);
    }

    function loop(t) {
      if (!st) return;
      const dt = Math.min(0.05, (t - st.last) / 1000);
      st.last = t;
      const d = st.drop;
      if (!st.paused && d && !d.done && st.lives > 0) {
        d.y += speed() * dt;
        d.el.style.top = d.y + 'px';
        const floor = $('sky').clientHeight - d.el.offsetHeight - 10;
        if (d.y >= floor) { d.y = floor; loseLife(true); }
      }
      raf = requestAnimationFrame(loop);
    }

    function end() {
      if (!st || st.ended) return;
      st.ended = true;
      cancelAnimationFrame(raf);
      $('pauseBtn').classList.add('hidden');
      const record = BA.saveBest('word-rain', st.score);
      BA.addXP('word-rain', Math.round(st.right * 3 + st.score / 20));
      if (record && st.score > 0) { BA.sfx.win(); BA.confetti(); } else BA.sfx.lose();
      const T = BALang.t;
      $('endScore').textContent = T('{n} упай', { n: st.score });
      $('endText').textContent = T('{a} туура жооп · деңгээл {b}', { a: st.right, b: st.level }) + (record && st.score > 0 ? ' · ' + T('Жаңы рекорд!') : '');
      $('mistakes').innerHTML = st.mistakes.length
        ? '<div class="fieldLabel">' + T('Кайталап ал:') + '</div>' + st.mistakes.map((w) =>
            `<div translate="no">${w.emoji} <b>${w.ky}</b> — ${w.ru} — ${w.en}</div>`).join('')
        : '';
      $('endModal').classList.remove('hidden');
      showBest();
    }

    function togglePause() {
      if (!st || st.ended) return;
      st.paused = !st.paused;
      $('pauseBtn').innerHTML = st.paused ? ICON_PLAY : ICON_PAUSE;
      const sky = $('sky');
      const c = sky.querySelector('.pauseCover');
      if (st.paused && !c) { const p = document.createElement('div'); p.className = 'pauseCover'; p.textContent = BALang.t('Тыным'); sky.appendChild(p); }
      if (!st.paused && c) c.remove();
    }

    document.addEventListener('keydown', (e) => {
      if (!st || st.ended) return;
      if (e.key === ' ' || e.key === 'Escape' || e.key === 'p') { e.preventDefault(); togglePause(); return; }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) { const b = $('answers').children[n - 1]; if (b) b.click(); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && st && !st.paused && !st.ended) togglePause(); });

    $('pauseBtn').addEventListener('click', togglePause);
    $('startBtn').addEventListener('click', start);
    $('againBtn').addEventListener('click', start);
    $('menuBtn').addEventListener('click', () => {
      $('endModal').classList.add('hidden'); $('game').classList.add('hidden'); $('setup').classList.remove('hidden');
      $('sky').querySelectorAll('.drop').forEach((x) => x.remove());
    });
  })();
