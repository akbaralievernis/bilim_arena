/**
 * Bilim Arena — жалпы сөздүк (кыргызча / орусча / англисче)
 * Бардык тил оюндары ушул сөздүктү колдонот.
 * Жаңы сөз кошуу үчүн тиешелүү категорияга бир сап кошуңуз:
 *   [emoji, кыргызча, орусча, англисче]
 */
(function () {
  'use strict';

  const RAW = {
    animals: {
      title: 'Жаныбарлар', icon: '🐾',
      words: [
        ['🐕', 'ит', 'собака', 'dog'],
        ['🐈', 'мышык', 'кошка', 'cat'],
        ['🐎', 'ат', 'лошадь', 'horse'],
        ['🐄', 'уй', 'корова', 'cow'],
        ['🐑', 'кой', 'овца', 'sheep'],
        ['🐐', 'эчки', 'коза', 'goat'],
        ['🐫', 'төө', 'верблюд', 'camel'],
        ['🐔', 'тоок', 'курица', 'chicken'],
        ['🐺', 'бөрү', 'волк', 'wolf'],
        ['🦊', 'түлкү', 'лиса', 'fox'],
        ['🐻', 'аюу', 'медведь', 'bear'],
        ['🐇', 'коён', 'заяц', 'rabbit'],
        ['🦅', 'бүркүт', 'орёл', 'eagle'],
        ['🐟', 'балык', 'рыба', 'fish'],
        ['🐦', 'куш', 'птица', 'bird'],
        ['🐭', 'чычкан', 'мышь', 'mouse'],
        ['🦁', 'арстан', 'лев', 'lion'],
        ['🐯', 'жолборс', 'тигр', 'tiger'],
      ]
    },
    food: {
      title: 'Тамак-аш', icon: '🍎',
      words: [
        ['🍞', 'нан', 'хлеб', 'bread'],
        ['🥛', 'сүт', 'молоко', 'milk'],
        ['💧', 'суу', 'вода', 'water'],
        ['🍎', 'алма', 'яблоко', 'apple'],
        ['🥩', 'эт', 'мясо', 'meat'],
        ['🍯', 'бал', 'мёд', 'honey'],
        ['🍵', 'чай', 'чай', 'tea'],
        ['🥚', 'жумуртка', 'яйцо', 'egg'],
        ['🧅', 'пияз', 'лук', 'onion'],
        ['🥕', 'сабиз', 'морковь', 'carrot'],
        ['🥔', 'картошка', 'картофель', 'potato'],
        ['🍉', 'дарбыз', 'арбуз', 'watermelon'],
        ['🍇', 'жүзүм', 'виноград', 'grapes'],
        ['🧂', 'туз', 'соль', 'salt'],
        ['🍬', 'кант', 'сахар', 'sugar'],
        ['🧀', 'сыр', 'сыр', 'cheese'],
      ]
    },
    colors: {
      title: 'Түстөр', icon: '🎨',
      words: [
        ['🔴', 'кызыл', 'красный', 'red'],
        ['🔵', 'көк', 'синий', 'blue'],
        ['🟢', 'жашыл', 'зелёный', 'green'],
        ['🟡', 'сары', 'жёлтый', 'yellow'],
        ['⚫', 'кара', 'чёрный', 'black'],
        ['⚪', 'ак', 'белый', 'white'],
        ['🟠', 'кызгылт сары', 'оранжевый', 'orange'],
        ['🟣', 'кызгылт көк', 'фиолетовый', 'purple'],
        ['🟤', 'күрөң', 'коричневый', 'brown'],
        ['🩶', 'боз', 'серый', 'grey'],
      ]
    },
    family: {
      title: 'Үй-бүлө', icon: '👨‍👩‍👧',
      words: [
        ['👩', 'апа', 'мама', 'mother'],
        ['👨', 'ата', 'папа', 'father'],
        ['👦', 'ага', 'старший брат', 'older brother'],
        ['👧', 'эже', 'старшая сестра', 'older sister'],
        ['🧒', 'ини', 'младший брат', 'younger brother'],
        ['👵', 'чоң апа', 'бабушка', 'grandmother'],
        ['👴', 'чоң ата', 'дедушка', 'grandfather'],
        ['👶', 'бала', 'ребёнок', 'child'],
        ['🤝', 'дос', 'друг', 'friend'],
        ['👨‍👩‍👧', 'үй-бүлө', 'семья', 'family'],
      ]
    },
    body: {
      title: 'Дене мүчөлөрү', icon: '🖐️',
      words: [
        ['👁️', 'көз', 'глаз', 'eye'],
        ['👂', 'кулак', 'ухо', 'ear'],
        ['👃', 'мурун', 'нос', 'nose'],
        ['👄', 'ооз', 'рот', 'mouth'],
        ['✋', 'кол', 'рука', 'hand'],
        ['🦶', 'бут', 'нога', 'foot'],
        ['🗣️', 'баш', 'голова', 'head'],
        ['🦷', 'тиш', 'зуб', 'tooth'],
        ['❤️', 'жүрөк', 'сердце', 'heart'],
        ['💇', 'чач', 'волосы', 'hair'],
      ]
    },
    school: {
      title: 'Мектеп', icon: '🏫',
      words: [
        ['🏫', 'мектеп', 'школа', 'school'],
        ['📕', 'китеп', 'книга', 'book'],
        ['✏️', 'калем', 'карандаш', 'pencil'],
        ['📓', 'дептер', 'тетрадь', 'notebook'],
        ['👩‍🏫', 'мугалим', 'учитель', 'teacher'],
        ['🧑‍🎓', 'окуучу', 'ученик', 'student'],
        ['📚', 'сабак', 'урок', 'lesson'],
        ['🪑', 'отургуч', 'стул', 'chair'],
        ['📄', 'кагаз', 'бумага', 'paper'],
        ['🎒', 'сумка', 'портфель', 'schoolbag'],
        ['🔤', 'сөздүк', 'словарь', 'dictionary'],
        ['🧮', 'эсеп', 'счёт', 'counting'],
      ]
    },
    nature: {
      title: 'Табият', icon: '🏔️',
      words: [
        ['☀️', 'күн', 'солнце', 'sun'],
        ['🌙', 'ай', 'луна', 'moon'],
        ['⭐', 'жылдыз', 'звезда', 'star'],
        ['🏔️', 'тоо', 'гора', 'mountain'],
        ['🌊', 'дарыя', 'река', 'river'],
        ['🏞️', 'көл', 'озеро', 'lake'],
        ['🌳', 'дарак', 'дерево', 'tree'],
        ['🌸', 'гүл', 'цветок', 'flower'],
        ['🌧️', 'жамгыр', 'дождь', 'rain'],
        ['❄️', 'кар', 'снег', 'snow'],
        ['☁️', 'булут', 'облако', 'cloud'],
        ['💨', 'шамал', 'ветер', 'wind'],
        ['🔥', 'от', 'огонь', 'fire'],
        ['🌍', 'жер', 'земля', 'earth'],
        ['🌌', 'асман', 'небо', 'sky'],
      ]
    },
    numbers: {
      title: 'Сандар', icon: '🔢',
      words: [
        ['1️⃣', 'бир', 'один', 'one'],
        ['2️⃣', 'эки', 'два', 'two'],
        ['3️⃣', 'үч', 'три', 'three'],
        ['4️⃣', 'төрт', 'четыре', 'four'],
        ['5️⃣', 'беш', 'пять', 'five'],
        ['6️⃣', 'алты', 'шесть', 'six'],
        ['7️⃣', 'жети', 'семь', 'seven'],
        ['8️⃣', 'сегиз', 'восемь', 'eight'],
        ['9️⃣', 'тогуз', 'девять', 'nine'],
        ['🔟', 'он', 'десять', 'ten'],
        ['💯', 'жүз', 'сто', 'hundred'],
        ['🔢', 'миң', 'тысяча', 'thousand'],
      ]
    },
    verbs: {
      title: 'Этиштер', icon: '🏃',
      words: [
        ['📖', 'окуу', 'читать', 'to read'],
        ['✍️', 'жазуу', 'писать', 'to write'],
        ['🏃', 'чуркоо', 'бегать', 'to run'],
        ['🚶', 'басуу', 'ходить', 'to walk'],
        ['😋', 'жеш', 'есть', 'to eat'],
        ['🥤', 'ичүү', 'пить', 'to drink'],
        ['😴', 'уктоо', 'спать', 'to sleep'],
        ['🎤', 'ырдоо', 'петь', 'to sing'],
        ['💃', 'бийлөө', 'танцевать', 'to dance'],
        ['🏊', 'сүзүү', 'плавать', 'to swim'],
        ['👀', 'көрүү', 'видеть', 'to see'],
        ['🎧', 'угуу', 'слышать', 'to hear'],
        ['🎮', 'ойноо', 'играть', 'to play'],
        ['🧠', 'билүү', 'знать', 'to know'],
      ]
    },
    home: {
      title: 'Үй жана буюмдар', icon: '🏠',
      words: [
        ['🏠', 'үй', 'дом', 'house'],
        ['🚪', 'эшик', 'дверь', 'door'],
        ['🪟', 'терезе', 'окно', 'window'],
        ['🛏️', 'керебет', 'кровать', 'bed'],
        ['🍽️', 'табак', 'тарелка', 'plate'],
        ['🥄', 'кашык', 'ложка', 'spoon'],
        ['🔑', 'ачкыч', 'ключ', 'key'],
        ['⌚', 'саат', 'часы', 'clock'],
        ['📱', 'телефон', 'телефон', 'phone'],
        ['🚗', 'унаа', 'машина', 'car'],
        ['⛺', 'боз үй', 'юрта', 'yurt'],
        ['🎻', 'комуз', 'комуз', 'komuz'],
      ]
    }
  };

  const LANGS = {
    ky: { name: 'Кыргызча', flag: 'KY', speech: 'ky-KG' },
    ru: { name: 'Русский', flag: 'RU', speech: 'ru-RU' },
    en: { name: 'English', flag: 'EN', speech: 'en-US' }
  };

  const CATEGORIES = {};
  const ALL = [];
  Object.keys(RAW).forEach((key) => {
    const c = RAW[key];
    CATEGORIES[key] = { key, title: c.title, icon: c.icon, count: c.words.length };
    c.words.forEach(([emoji, ky, ru, en], i) => {
      ALL.push({ id: `${key}_${i}`, cat: key, emoji, ky, ru, en });
    });
  });

  /**
   * Набор учителя по ссылке: «…/index.html#w=…» (wordset.html). В адресе после «#» —
   * { n: название, w: [[кыргызча, орусча, англисче, эмодзи?], …] }; на сервер не уходит.
   * Тогда все тил оюндары берут только эти сөздөр.
   */
  const TEACHER = (function readTeacherSet() {
    const m = /(?:^#|&)w=([A-Za-z0-9_-]+)/.exec(location.hash || '');
    if (!m) return null;
    try {
      const bin = atob(m[1].replace(/-/g, '+').replace(/_/g, '/'));
      const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
      // Текст из ссылки попадает в игры, в том числе в разметку: убираем всё, что может стать HTML
      // (апостроф заменяем типографским — «don’t» остаётся читаемым)
      const clean = (v) => String(v == null ? '' : v).replace(/'/g, '’').replace(/[<>"`&\\]/g, '')
        .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').trim().slice(0, 40);
      const words = (Array.isArray(data.w) ? data.w : []).slice(0, 80)
        .map((r) => (Array.isArray(r) ? r.map(clean) : []))
        .filter((r) => r[0] && (r[1] || r[2]));
      return words.length >= 2 ? { title: clean(data.n) || 'Мугалимдин сөздөрү', words } : null;
    } catch (e) { return null; }
  })();
  if (TEACHER) {
    ALL.length = 0;
    Object.keys(CATEGORIES).forEach((k) => delete CATEGORIES[k]);
    CATEGORIES.custom = { key: 'custom', title: TEACHER.title, icon: '📝', count: TEACHER.words.length };
    TEACHER.words.forEach(([ky, ru, en, emoji], i) => {
      // Без эмодзи — показываем само слово, чтобы пары «эмодзи → слово» оставались различимыми
      ALL.push({ id: `t_${ky}_${i}`, cat: 'custom', emoji: emoji || ky, ky, ru: ru || en, en: en || ru });
    });
    // Плашка на странице игры: видно, что идёт вариант учителя
    const badge = () => {
      if (document.getElementById('baTeacherSet')) return;
      const b = document.createElement('div');
      b.id = 'baTeacherSet';
      b.setAttribute('role', 'status');
      b.textContent = '📝 ' + TEACHER.title + ' · ' + TEACHER.words.length;
      b.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:60;padding:8px 14px;border-radius:999px;background:#202B46;color:#fff;font:700 14px/1.2 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:90vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      document.body.appendChild(b);
    };
    if (document.body) badge(); else document.addEventListener('DOMContentLoaded', badge);
  }

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  window.BA_VOCAB = {
    LANGS,
    CATEGORIES,
    ALL,
    shuffle,
    /** Мугалимдин топтому ачылганбы (шилтеме #w=…) */
    teacherSet: TEACHER ? { title: TEACHER.title, count: TEACHER.words.length } : null,
    /** cat: категориянын ачкычы же 'all'. Мугалимдин топтому болсо — дайыма ошол сөздөр */
    words(cat) {
      if (TEACHER) return ALL.slice();
      return !cat || cat === 'all' ? ALL.slice() : ALL.filter((w) => w.cat === cat);
    },
    /** Кокус n сөз (кайталанбайт) — алгач көрүлбөгөндөр (бардык оюндарда) */
    pick(n, cat) {
      return this.fresh(cat).slice(0, n);
    },
    /**
     * Сөздөр «жаңы» тартипте: бул түзмөктө эч бир тил оюнунда көрсөтүлө электери алгач,
     * андан кийин эң мурун көрүлгөндөрү (shared/fresh.js). Мурда ар бир оюн кокус тандачу —
     * ошол эле сөздөр кайра-кайра чыгып турчу.
     */
    fresh(cat, list) {
      const pool = list || this.words(cat);
      return window.BA_FRESH ? window.BA_FRESH.order('words', pool) : shuffle(pool);
    },
    /** Сөз көрсөтүлдү (бир же бир нече) — кийинки оюндарда ал кийинчерээк чыгат */
    seen(words) {
      if (!window.BA_FRESH) return;
      window.BA_FRESH.mark('words', (Array.isArray(words) ? words : [words]).map((w) => (w && w.id) || w));
    },
    /** Туура эмес варианттар: ошол эле категориядан артыкчылык менен */
    distractors(word, n, lang) {
      const seen = new Set([word[lang]]);
      const same = shuffle(ALL.filter((w) => w.cat === word.cat));
      const other = shuffle(ALL.filter((w) => w.cat !== word.cat));
      const out = [];
      for (const w of same.concat(other)) {
        if (out.length >= n) break;
        if (seen.has(w[lang])) continue;
        seen.add(w[lang]);
        out.push(w);
      }
      return out;
    }
  };
})();
