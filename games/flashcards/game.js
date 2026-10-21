/* Перенесено из index.html, чтобы страница работала с политикой безопасности (CSP) */
  (function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const V = window.BA_VOCAB, S = window.BAShell, BA = window.BA;
    let cat = S.recall('fc_cat', 'animals');
    let st = null;

    function renderCats() {
      const stats = BA.allWordStats();
      const grid = $('catGrid'); grid.innerHTML = '';
      const items = [{ key: 'all', title: 'Баары' }].concat(Object.values(V.CATEGORIES));
      items.forEach((c) => {
        const ws = V.words(c.key);
        const learned = ws.filter((w) => stats[w.id] && stats[w.id].box >= 3).length;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'catCard' + (c.key === cat ? ' on' : '');
        b.innerHTML = `<div class="nm">${c.title}</div>
          <div class="bar"><i style="width:${Math.round(learned / ws.length * 100)}%"></i></div>
          <small>${learned}/${ws.length} үйрөнүлдү</small>`;
        b.addEventListener('click', () => { cat = c.key; S.remember('fc_cat', cat); renderCats(); });
        grid.appendChild(b);
      });
    }

    // Кайталоо мөөнөтү келген жана жаңы сөздөр биринчи чыгат
    function buildDeck() {
      const stats = BA.allWordStats();
      const now = Date.now();
      const ws = V.fresh(cat); // невиданные во всех играх — раньше
      const due = ws.filter((w) => stats[w.id] && stats[w.id].due <= now && stats[w.id].box < 5);
      const fresh = ws.filter((w) => !stats[w.id]);
      const rest = ws.filter((w) => !due.includes(w) && !fresh.includes(w))
                     .sort((a, b) => (stats[a.id].due) - (stats[b.id].due));
      return due.concat(fresh, rest).slice(0, 12);
    }

    function start() {
      st = { deck: buildDeck(), i: 0, knew: 0, again: 0, seen: new Set() };
      $('setup').classList.add('hidden');
      $('endModal').classList.add('hidden');
      $('deck').classList.remove('hidden');
      show();
    }

    function sayBtn(text, lang) {
      if (!BA.canSpeak(lang)) return '';
      const attr = String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      return `<button class="say" type="button" data-t="${attr}" data-l="${lang}" aria-label="Угуу"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg></button>`;
    }

    function show() {
      const w = st.deck[st.i];
      V.seen(w);
      const card = $('card');
      card.classList.remove('flipped');
      const stat = BA.wordStats(w.id);
      $('fEmoji').textContent = w.emoji;
      $('fWord').textContent = w.ky;
      $('fBoxes').innerHTML = [1, 2, 3, 4, 5].map((n) => `<i class="${stat.box >= n ? 'on' : ''}"></i>`).join('');
      $('bEmoji').textContent = w.emoji;
      $('bTr').innerHTML =
        `<div><span><small class="muted">KY</small> ${w.ky}</span>${sayBtn(w.ky, 'ky')}</div>` +
        `<div><span><small class="muted">RU</small> ${w.ru}</span>${sayBtn(w.ru, 'ru')}</div>` +
        `<div><span><small class="muted">EN</small> ${w.en}</span>${sayBtn(w.en, 'en')}</div>`;
      $('counter').textContent = `${Math.min(st.i + 1, st.deck.length)}/${st.deck.length}`;
      $('deckBar').style.width = (st.i / st.deck.length * 100) + '%';
    }

    function flip() {
      const card = $('card');
      card.classList.toggle('flipped');
      if (card.classList.contains('flipped')) {
        const w = st.deck[st.i];
        BA.speak(w.en, 'en');
      }
    }

    function rate(knew) {
      // После финиша (Enter на кнопке в фокусе) урок не завершается повторно — XP один раз
      if (!st || st.finished) return;
      const w = st.deck[st.i];
      BA.markWord(w.id, knew);
      if (knew) { st.knew++; BA.sfx.ok(); }
      else {
        st.again++; BA.sfx.tap();
        // Билбеген сөз ушул сабакта дагы бир жолу чыгат
        if (!st.seen.has(w.id)) st.deck.push(w);
      }
      st.seen.add(w.id);
      st.i++;
      if (st.i >= st.deck.length) finish(); else show();
    }

    function finish() {
      st.finished = true;
      $('deckBar').style.width = '100%';
      const xp = 10 + st.knew * 2;
      BA.addXP('flashcards', xp);
      BA.saveBest('flashcards', st.knew);
      BA.sfx.win();
      $('endEmoji').innerHTML = BAShell.endIcon(st.again ? 'book' : 'trophy');
      const T = BALang.t;
      $('endText').innerHTML = T('Билди: <b>{a}</b> · Кайталоо керек: <b>{b}</b>', { a: st.knew, b: st.again }) +
        `<br><span class="muted">${T('Эртең кайра кир — мөөнөтү келген сөздөр биринчи чыгат.')}</span>`;
      $('endModal').classList.remove('hidden');
    }

    $('card').addEventListener('click', (e) => {
      const s = e.target.closest('.say');
      if (s) { e.stopPropagation(); BA.speak(s.dataset.t, s.dataset.l); return; }
      flip();
    });
    $('knowBtn').addEventListener('click', () => rate(true));
    $('againBtn').addEventListener('click', () => rate(false));
    document.addEventListener('keydown', (e) => {
      if ($('deck').classList.contains('hidden') || !$('endModal').classList.contains('hidden')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      else if (e.key === '1' || e.key === 'ArrowLeft') rate(false);
      else if (e.key === '2' || e.key === 'ArrowRight') rate(true);
    });
    const toMenu = () => {
      $('endModal').classList.add('hidden'); $('deck').classList.add('hidden'); $('setup').classList.remove('hidden');
      renderCats();
    };
    $('quitBtn').addEventListener('click', toMenu);
    $('menuBtn').addEventListener('click', toMenu);
    $('moreBtn').addEventListener('click', start);
    $('startBtn').addEventListener('click', start);

    renderCats();
  })();
