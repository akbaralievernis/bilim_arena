/* Перенесено из index.html, чтобы страница работала с политикой безопасности (CSP) */
  (function () {
    'use strict';
    const $ = (id) => document.getElementById(id);

    // [сөз, орусча, англисче] — баары так 5 тамга
    const WORDS = [
      ['китеп', 'книга', 'book'], ['балык', 'рыба', 'fish'], ['калем', 'карандаш', 'pencil'],
      ['дарак', 'дерево', 'tree'], ['шамал', 'ветер', 'wind'], ['булут', 'облако', 'cloud'],
      ['тамак', 'еда', 'food'], ['бакча', 'сад', 'garden'], ['кулак', 'ухо', 'ear'],
      ['асман', 'небо', 'sky'], ['дүйнө', 'мир', 'world'], ['мышык', 'кошка', 'cat'],
      ['короз', 'петух', 'rooster'], ['күчүк', 'щенок', 'puppy'], ['сабак', 'урок', 'lesson'],
      ['комуз', 'комуз', 'komuz'], ['чапан', 'халат', 'robe'], ['жарык', 'свет', 'light'],
      ['кагаз', 'бумага', 'paper'], ['бөлмө', 'комната', 'room'], ['тамыр', 'корень', 'root'],
      ['жемиш', 'фрукт', 'fruit'], ['сабиз', 'морковь', 'carrot'], ['карга', 'ворона', 'crow'],
      ['кулун', 'жеребёнок', 'foal'], ['дарыя', 'река', 'river'], ['булак', 'родник', 'spring'],
      ['талаа', 'поле', 'field'], ['өрөөн', 'долина', 'valley'], ['базар', 'рынок', 'market'],
      ['дүкөн', 'магазин', 'shop'], ['тилек', 'желание', 'wish'], ['тарых', 'история', 'history'],
      ['билим', 'знание', 'knowledge'], ['бийик', 'высокий', 'high'], ['кызыл', 'красный', 'red'],
      ['жашыл', 'зелёный', 'green'], ['күмүш', 'серебро', 'silver'], ['алтын', 'золото', 'gold'],
      ['темир', 'железо', 'iron'], ['жумуш', 'работа', 'work'], ['кашык', 'ложка', 'spoon'],
      ['табак', 'тарелка', 'plate'], ['казан', 'котёл', 'cauldron'], ['сүзмө', 'творог', 'cottage cheese'],
      ['кымыз', 'кумыс', 'kumis'], ['жибек', 'шёлк', 'silk'], ['кийиз', 'войлок', 'felt'],
      ['бутак', 'ветка', 'branch'], ['тамчы', 'капля', 'drop'], ['желек', 'флаг', 'flag'],
      ['жүзүм', 'виноград', 'grapes'], ['мүнөт', 'минута', 'minute'], ['жылкы', 'лошадь', 'horse'],
      ['чатыр', 'шатёр', 'tent'], ['сүрөт', 'картина', 'picture'], ['кабар', 'новость', 'news'],
      ['макал', 'пословица', 'proverb'], ['жомок', 'сказка', 'fairy tale'], ['бешик', 'колыбель', 'cradle'],
      ['чабан', 'пастух', 'shepherd'], ['ширин', 'сладкий', 'sweet'], ['жүрөк', 'сердце', 'heart'],
      ['билек', 'предплечье', 'forearm'], ['мурун', 'нос', 'nose'], ['сегиз', 'восемь', 'eight'],
      ['тогуз', 'девять', 'nine'], ['жылуу', 'тёплый', 'warm'], ['кесип', 'профессия', 'profession'], ['кыска', 'короткий', 'short'], ['сулуу', 'красивый', 'beautiful'],
      ['кубат', 'сила', 'power'], ['эркин', 'свободный', 'free'], ['кирпи', 'ёж', 'hedgehog'], ['аккуу', 'лебедь', 'swan'], ['төшөк', 'постель', 'mattress'], ['ачкыч', 'ключ', 'key'],
    ].filter((w) => [...w[0]].length === 5); // коопсуздук үчүн: так 5 тамга

    const ROWS = [
      ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х'],
      ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
      ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', 'ё'],
      ['ENTER', 'ң', 'ө', 'ү', 'ъ', 'BACK']
    ];
    const KG = new Set(['ң', 'ө', 'ү']);
    const ALLOWED = new Set(ROWS.flat().filter((k) => k.length === 1));

    let st = null;
    let daily = true;

    function dayIndex() {
      const d = new Date();
      const n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
      return (n * 7919) % WORDS.length; // ар күнү башка сөз
    }
    const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

    function buildGrid() {
      const g = $('grid'); g.innerHTML = '';
      for (let r = 0; r < 6; r++) {
        const row = document.createElement('div'); row.className = 'row';
        for (let c = 0; c < 5; c++) { const cell = document.createElement('div'); cell.className = 'cell'; row.appendChild(cell); }
        g.appendChild(row);
      }
    }
    function buildKb() {
      const kb = $('kb'); kb.innerHTML = '';
      ROWS.forEach((r) => {
        const row = document.createElement('div'); row.className = 'kbRow';
        r.forEach((k) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'key' + (k.length > 1 ? ' wide' : '') + (KG.has(k) ? ' kg' : '');
          b.dataset.k = k;
          b.textContent = k === 'ENTER' ? BALang.t('ТЕКШЕР') : k === 'BACK' ? '⌫' : k;
          b.setAttribute('aria-label', k === 'ENTER' ? BALang.t('Текшерүү') : k === 'BACK' ? BALang.t('Өчүрүү') : k);
          b.addEventListener('click', () => press(k));
          row.appendChild(b);
        });
        kb.appendChild(row);
      });
    }

    function newGame(isDaily) {
      daily = isDaily;
      $('dailyBtn').classList.toggle('on', daily);
      $('freeBtn').classList.toggle('on', !daily);
      // Свободная игра: сначала слова, которых на этом устройстве ещё не было (shared/fresh.js)
      const pickFree = () => (window.BA_FRESH
        ? WORDS.indexOf(window.BA_FRESH.order('wordle', WORDS, (w) => w[0])[0])
        : Math.floor(Math.random() * WORDS.length));
      const idx = daily ? dayIndex() : pickFree();
      const [word, ru, en] = WORDS[idx];
      if (!daily) window.BA_FRESH?.mark('wordle', word);
      st = { word: [...word], ru, en, row: 0, cur: [], over: false, hint: false, results: [] };
      buildGrid(); buildKb();
      $('msg').textContent = daily ? 'Бүгүнкү сөздү тап!' : 'Кокус сөз. Ийгилик!';
      $('endModal').classList.add('hidden');

      // Күндүн сөзү буга чейин чечилген болсо — кайра көрсөтөбүз
      if (daily) {
        try {
          const saved = JSON.parse(localStorage.getItem('BA_WORDLE_DAY') || 'null');
          if (saved && saved.day === dayKey()) {
            saved.guesses.forEach((g) => { st.cur = [...g]; paintRow(); submit(true); });
          }
        } catch (e) { /* */ }
      }
    }

    function paintRow() {
      const cells = $('grid').children[st.row].children;
      for (let i = 0; i < 5; i++) {
        cells[i].textContent = st.cur[i] || '';
        cells[i].classList.toggle('filled', !!st.cur[i]);
      }
    }

    function press(k) {
      if (!st || st.over) return;
      if (k === 'ENTER') return submit(false);
      if (k === 'BACK') { st.cur.pop(); paintRow(); return; }
      if (st.cur.length < 5) { st.cur.push(k); window.BA.sfx.tap(); paintRow(); }
    }

    function score(guess, answer) {
      const res = Array(5).fill('x');
      const left = {};
      answer.forEach((ch, i) => { if (guess[i] === ch) res[i] = 'g'; else left[ch] = (left[ch] || 0) + 1; });
      guess.forEach((ch, i) => { if (res[i] !== 'g' && left[ch]) { res[i] = 'y'; left[ch]--; } });
      return res;
    }

    function submit(replay) {
      if (st.cur.length < 5) {
        $('msg').textContent = '5 тамга жазыңыз';
        const row = $('grid').children[st.row];
        row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake');
        window.BA.sfx.bad();
        return;
      }
      const res = score(st.cur, st.word);
      const cells = $('grid').children[st.row].children;
      res.forEach((r, i) => {
        cells[i].style.animationDelay = (replay ? 0 : i * 0.15) + 's';
        cells[i].classList.add(r);
        const key = document.querySelector(`.key[data-k="${st.cur[i]}"]`);
        if (key) {
          const rank = { g: 3, y: 2, x: 1 };
          const prev = key.classList.contains('g') ? 'g' : key.classList.contains('y') ? 'y' : key.classList.contains('x') ? 'x' : null;
          if (!prev || rank[r] > rank[prev]) { key.classList.remove('g', 'y', 'x'); key.classList.add(r); }
        }
      });
      st.results.push(res);
      const guess = st.cur.join('');
      const won = res.every((r) => r === 'g');
      st.row++; st.cur = [];

      if (daily && !replay) {
        try {
          const saved = JSON.parse(localStorage.getItem('BA_WORDLE_DAY') || 'null');
          const guesses = saved && saved.day === dayKey() ? saved.guesses : [];
          guesses.push(guess);
          localStorage.setItem('BA_WORDLE_DAY', JSON.stringify({ day: dayKey(), guesses }));
        } catch (e) { /* */ }
      }

      if (won || st.row === 6) {
        st.over = true;
        setTimeout(() => end(won, replay), replay ? 50 : 900);
      } else if (!replay) {
        $('msg').textContent = ['Жакшы башталды!', 'Уланта бер!', 'Жакындап калдың!', 'Ойлон...', 'Акыркы аракет!'][st.row - 1] || '';
        window.BA.sfx.tap();
      }
    }

    function end(won, replay) {
      const word = st.word.join('');
      $('endEmoji').innerHTML = BAShell.endIcon(won ? 'trophy' : 'target');
      $('endTitle').textContent = won ? BALang.t('Таптың! ({n}/6)', { n: st.row }) : BALang.t('Бул жолу болгон жок');
      $('endWord').textContent = word.toUpperCase();
      $('endMeaning').textContent = `RU: ${st.ru} · EN: ${st.en}`;
      if (!replay) {
        if (won) {
          const pts = (7 - st.row) * 20 * (st.hint ? 0.5 : 1);
          window.BA.addXP('wordle', 10 + pts);
          window.BA.saveBest('wordle', pts);
          window.BA.sfx.win(); window.BA.confetti();
        } else {
          window.BA.addXP('wordle', 5);
          window.BA.saveBest('wordle', 0);
          window.BA.sfx.lose();
        }
        window.BA.speak(st.en, 'en');
      }
      $('endStats').textContent = daily ? 'Эртең жаңы күндүн сөзү чыгат! Азыр эркин оюн ойноп көр.' : '';
      $('msg').textContent = won ? BALang.t('Азаматсың!') : BALang.t('Сөз: {w}', { w: word.toUpperCase() });
      $('endModal').classList.remove('hidden');
    }

    function share() {
      const map = { g: '🟩', y: '🟨', x: '⬛' };
      const txt = `${BALang.t('Билим Арена — Сөз табышмак')} ${st.over && st.results[st.results.length - 1].every((r) => r === 'g') ? st.row : 'X'}/6\n` +
        st.results.map((r) => r.map((c) => map[c]).join('')).join('\n');
      const done = () => window.BA.toast('Көчүрүлдү!');
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, () => window.BA.toast(txt.replace(/\n/g, '<br>')));
      else window.BA.toast(txt.replace(/\n/g, '<br>'));
    }

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!$('helpModal').classList.contains('hidden')) return;
      if (e.key === 'Enter') { e.preventDefault(); press('ENTER'); }
      else if (e.key === 'Backspace') press('BACK');
      else if (ALLOWED.has(e.key.toLowerCase())) press(e.key.toLowerCase());
    });

    $('dailyBtn').addEventListener('click', () => newGame(true));
    $('freeBtn').addEventListener('click', () => newGame(false));
    $('nextBtn').addEventListener('click', () => newGame(false));
    $('shareBtn').addEventListener('click', share);
    $('hintBtn').addEventListener('click', () => {
      if (!st || st.over) return;
      st.hint = true;
      $('msg').textContent = BALang.t('Мааниси: RU: {a} · EN: {b}', { a: st.ru, b: st.en });
    });
    $('helpBtn').addEventListener('click', () => $('helpModal').classList.remove('hidden'));
    $('helpClose').addEventListener('click', () => $('helpModal').classList.add('hidden'));
    $('endModal').addEventListener('click', (e) => { if (e.target.id === 'endModal') $('endModal').classList.add('hidden'); });

    newGame(true);
    if (!localStorage.getItem('BA_WORDLE_SEEN')) {
      localStorage.setItem('BA_WORDLE_SEEN', '1');
      $('helpModal').classList.remove('hidden');
    }
  })();
