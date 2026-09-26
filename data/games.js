/**
 * Bilim Arena — каталог всех игр платформы.
 *
 * Один источник для главной страницы и каталога (games.html).
 * Поля:
 *   category   languages | logic | team | camera — раздел каталога
 *   subjects   предметы (any — подходит к любому предмету учителя)
 *   type       quiz | puzzle | words | strategy | action | speech | creative
 *   difficulty 1 — оңой, 2 — орто, 3 — татаал
 *   players    solo | pair | class
 *   devices    phone | computer | board | camera (нужна веб-камера)
 *   minutes    примерное время одной игры
 *   added      дата появления на платформе (для сортировки «новые»)
 *   rank       редакционная популярность (0–100); к ней добавляются ваши сыгранные игры
 *   art        иллюстрация: иконка из core/icons.js и тон из core/art.js
 */

const L = (ky, ru, en) => ({ ky, ru, en });

export const CATEGORIES = [
  {
    id: 'languages', art: { icon: 'language', tone: 'violet' },
    title: L('Тил үйрөнүү', 'Изучение языков', 'Language learning'),
    desc: L('Сөздөр, айтылыш, жазуу жана сүйлөм түзүү — кыргыз, англис жана орус тилдери',
      'Слова, произношение, письмо и предложения — кыргызский, английский и русский',
      'Words, pronunciation, spelling and sentences in Kyrgyz, English and Russian')
  },
  {
    id: 'logic', art: { icon: 'logic', tone: 'teal' },
    title: L('Логика жана ой жүгүртүү', 'Логика и мышление', 'Logic and thinking'),
    desc: L('Катаны табуу, далилдер, тажрыйбалар жана ырааттуулук', 'Поиск ошибок, улики, опыты и последовательности',
      'Finding mistakes, clues, experiments and sequences')
  },
  {
    id: 'team', art: { icon: 'team', tone: 'amber' },
    title: L('Командалык оюндар', 'Командные игры', 'Team games'),
    desc: L('Бүт класс доскада ойнойт, окуучулар телефондон жооп берет', 'Весь класс играет у доски, ученики отвечают с телефонов',
      'The whole class plays on the board and answers from phones')
  },
  {
    id: 'camera', art: { icon: 'camera', tone: 'ink' },
    title: L('Камера менен интерактивдүү', 'Интерактивные с камерой', 'Camera games'),
    desc: L('Колдун кыймылы менен башкаруу — веб-камера керек', 'Управление движением руки — нужна веб-камера',
      'Control with hand gestures — a webcam is required')
  }
];

export const SUBJECT_FILTERS = [
  { id: 'languages', title: L('Тилдер', 'Языки', 'Languages') },
  { id: 'math', title: L('Математика', 'Математика', 'Maths') },
  { id: 'science', title: L('Табигый илимдер', 'Естественные науки', 'Science') },
  { id: 'history', title: L('Тарых', 'История', 'History') },
  { id: 'informatics', title: L('Информатика', 'Информатика', 'Computer science') },
  { id: 'economics', title: L('Экономика жана финансы', 'Экономика и финансы', 'Economics and finance') }
];

export const TYPES = {
  quiz: L('Викторина', 'Викторина', 'Quiz'),
  puzzle: L('Табышмак', 'Головоломка', 'Puzzle'),
  words: L('Сөз оюну', 'Игра со словами', 'Word game'),
  strategy: L('Стратегия', 'Стратегия', 'Strategy'),
  action: L('Кыймыл', 'Динамика', 'Action'),
  speech: L('Сүйлөө', 'Речь', 'Speaking'),
  creative: L('Чыгармачылык', 'Творчество', 'Creative')
};

export const DIFFICULTY = {
  1: L('Оңой', 'Легко', 'Easy'),
  2: L('Орто', 'Средне', 'Medium'),
  3: L('Татаал', 'Сложно', 'Hard')
};

export const PLAYERS = {
  solo: L('Жалгыз', 'Один игрок', 'Solo'),
  pair: L('Экөө', 'Двое', 'Two players'),
  class: L('Бүт класс', 'Весь класс', 'Whole class')
};

export const DEVICES = {
  phone: L('Телефон', 'Телефон', 'Phone'),
  computer: L('Компьютер', 'Компьютер', 'Computer'),
  board: L('Интерактивдүү доска', 'Интерактивная доска', 'Interactive board'),
  camera: L('Веб-камера', 'Веб-камера', 'Webcam')
};

const board = (params) => `./board.html${params ? '?' + params : ''}`;

export const GAMES = [
  // ─── Тил үйрөнүү ─────────────────────────────────────────────────────────
  {
    id: 'speak', category: 'languages', subjects: ['languages'], type: 'speech', difficulty: 2, players: 'solo',
    devices: ['phone', 'computer'], minutes: 5, added: '2026-09-25', rank: 80, href: './speak.html', art: { icon: 'mic', tone: 'rose' },
    title: L('Айт!', 'Говори!', 'Speak!'),
    desc: L('Англисче сөздөрдү үнүң менен айт — браузер угуп, айтылышын текшерет', 'Произноси английские слова вслух — браузер проверит произношение',
      'Say English words aloud — the browser checks your pronunciation')
  },
  {
    id: 'flashcards', category: 'languages', subjects: ['languages'], type: 'words', difficulty: 1, players: 'solo',
    devices: ['phone', 'computer'], minutes: 5, added: '2025-10-01', rank: 85, href: './games/flashcards/index.html', art: { icon: 'cards', tone: 'violet' },
    title: L('Сөз карточкалары', 'Карточки слов', 'Flashcards'),
    desc: L('Сөздү көр, ук жана эсте — акылдуу кайталоо менен', 'Смотри, слушай и запоминай слова с интервальным повторением', 'See, hear and remember words with spaced repetition')
  },
  {
    id: 'word-match', category: 'languages', subjects: ['languages'], type: 'words', difficulty: 1, players: 'solo',
    devices: ['phone', 'computer'], minutes: 4, added: '2025-10-01', rank: 70, href: './games/word-match/index.html', art: { icon: 'grid', tone: 'teal' },
    title: L('Жупташтыр', 'Найди пару', 'Match pairs'),
    desc: L('Сөз менен котормосун жупташтыр — эс тутумга машыгуу', 'Сопоставь слово и перевод — тренировка памяти', 'Match a word with its translation — memory practice')
  },
  {
    id: 'wordle', category: 'languages', subjects: ['languages'], type: 'puzzle', difficulty: 2, players: 'solo',
    devices: ['phone', 'computer'], minutes: 5, added: '2025-10-01', rank: 90, href: './games/wordle/index.html', art: { icon: 'letters', tone: 'amber' },
    title: L('Сөз табышмак', 'Угадай слово', 'Word puzzle'),
    desc: L('5 тамгалуу кыргыз сөзүн 6 аракетте тап', 'Угадай кыргызское слово из 5 букв за 6 попыток', 'Guess the 5-letter Kyrgyz word in 6 tries')
  },
  {
    id: 'word-rain', category: 'languages', subjects: ['languages'], type: 'action', difficulty: 2, players: 'solo',
    devices: ['phone', 'computer'], minutes: 3, added: '2025-10-01', rank: 65, href: './games/word-rain/index.html', art: { icon: 'rain', tone: 'sky' },
    title: L('Сөз жамгыры', 'Словопад', 'Word rain'),
    desc: L('Сөз жерге жеткиче котормосун тап — ылдамдыкка машыгуу', 'Успей перевести слово, пока оно не упало', 'Translate the word before it hits the ground')
  },
  {
    id: 'balloons', category: 'languages', subjects: ['languages'], type: 'words', difficulty: 1, players: 'solo',
    devices: ['phone', 'computer'], minutes: 4, added: '2025-10-01', rank: 60, href: './games/balloons/index.html', art: { icon: 'balloon', tone: 'rose' },
    title: L('Шарлар', 'Шарики', 'Balloons'),
    desc: L('Сөздү тамга-тамга тап — орфографияга машыгуу', 'Угадай слово по буквам — тренировка правописания', 'Guess the word letter by letter — spelling practice')
  },
  {
    id: 'sentence', category: 'languages', subjects: ['languages'], type: 'words', difficulty: 2, players: 'pair',
    devices: ['computer', 'board'], minutes: 10, added: '2025-09-01', rank: 55, href: './games/sentence/index.html', art: { icon: 'sentence', tone: 'violet' },
    title: L('Сүйлөмдү түз', 'Собери предложение', 'Build the sentence'),
    desc: L('Сөздөрдү туура тартипте коюп сүйлөм кур — эки команда мелдешет', 'Собери предложение из слов — соревнуются две команды', 'Build a sentence from words — two teams compete')
  },

  // ─── Логика жана ой жүгүртүү ─────────────────────────────────────────────
  {
    id: 'errorhunt', category: 'logic', subjects: ['math', 'languages', 'informatics', 'science', 'history', 'economics'], type: 'puzzle', difficulty: 2, players: 'class',
    devices: ['board', 'phone'], minutes: 10, added: '2026-09-24', rank: 75, href: board('game=errorhunt&subject=math&topic=math-6-fractions'), art: { icon: 'pen', tone: 'rose' },
    title: L('Мугалимдин катасы', 'Ошибка учителя', "Teacher's mistake"),
    desc: L('Чечимдеги, коддогу же тексттеги ката сапты тап', 'Найди строку с ошибкой в решении, коде или тексте', 'Find the wrong line in a solution, code or text')
  },
  {
    id: 'investigation', category: 'logic', subjects: ['math'], type: 'strategy', difficulty: 3, players: 'class',
    devices: ['board', 'phone'], minutes: 25, added: '2026-09-23', rank: 88, href: board('case=case-001-museum'), art: { icon: 'lens', tone: 'ink' },
    title: L('Тергөө: №001 иш', 'Расследование: Дело №001', 'Investigation: Case 001'),
    desc: L('Тапшырмаларды чечип, далилдерди ач жана күнөөлүүнү тап', 'Решай задания, открывай улики и найди виновного', 'Solve tasks, unlock clues and find the culprit')
  },
  {
    id: 'lab', category: 'logic', subjects: ['science'], type: 'strategy', difficulty: 2, players: 'class',
    devices: ['board', 'phone'], minutes: 15, added: '2026-09-25', rank: 72, href: board('lab=lab-ice'), art: { icon: 'flask', tone: 'teal' },
    title: L('Лаборатория', 'Лаборатория', 'Science lab'),
    desc: L('Божомолдо, тажрыйба жаса, корутунду чыгар', 'Предскажи, проведи опыт, сделай вывод', 'Predict, experiment, conclude')
  },
  {
    id: 'timeline', category: 'logic', subjects: ['history'], type: 'puzzle', difficulty: 2, players: 'class',
    devices: ['board', 'phone'], minutes: 10, added: '2026-09-24', rank: 58, href: board('game=timeline&subject=kg-history&topic=kg-history-8-independence'), art: { icon: 'hourglass', tone: 'amber' },
    title: L('Тарых картасы', 'Карта истории', 'History map'),
    desc: L('Окуяларды убакыт боюнча иретте жана линияны кур', 'Расставь события по времени и построй линию', 'Put events in order and build the timeline')
  },
  {
    id: 'odd', category: 'logic', subjects: ['languages'], type: 'puzzle', difficulty: 1, players: 'pair',
    devices: ['computer', 'board'], minutes: 8, added: '2025-09-01', rank: 50, href: './games/odd-one-out/index.html', art: { icon: 'odd', tone: 'sky' },
    title: L('Ашыкчаны тап', 'Найди лишнее', 'Odd one out'),
    desc: L('Эрежеге туура келбеген элементти тап', 'Найди элемент, который не подходит под правило', 'Find the element that breaks the rule')
  },
  {
    id: 'focus', category: 'logic', subjects: ['languages'], type: 'action', difficulty: 2, players: 'pair',
    devices: ['computer', 'board'], minutes: 5, added: '2025-09-01', rank: 45, href: './games/focus-duel/index.html', art: { icon: 'bolt', tone: 'violet' },
    title: L('Фокус дуэль', 'Фокус-дуэль', 'Focus duel'),
    desc: L('Керектүү жоопту атаандаштан тез тап', 'Найди нужный ответ быстрее соперника', 'Find the right answer faster than your rival')
  },

  // ─── Командалык оюндар ───────────────────────────────────────────────────
  {
    id: 'quickvote', category: 'team', subjects: ['any'], type: 'quiz', difficulty: 1, players: 'class',
    devices: ['board', 'phone'], minutes: 10, added: '2026-09-20', rank: 82, href: board(''), art: { icon: 'quiz', tone: 'violet' },
    title: L('Тез сурамжылоо', 'Быстрый опрос', 'Quick poll'),
    desc: L('Класс телефондон жооп берет, доска натыйжаны көрсөтөт', 'Класс отвечает с телефонов, доска показывает результат', 'The class answers from phones, the board shows the result')
  },
  {
    id: 'territory', category: 'team', subjects: ['any'], type: 'strategy', difficulty: 2, players: 'class',
    devices: ['board', 'phone'], minutes: 15, added: '2026-09-20', rank: 86, href: board(''), art: { icon: 'map', tone: 'teal' },
    title: L('Аймакты басып алуу', 'Захват территории', 'Capture the territory'),
    desc: L('Эки команда туура жооптор менен картаны ээлейт', 'Две команды захватывают карту верными ответами', 'Two teams capture the map with correct answers')
  },
  {
    id: 'formula', category: 'team', subjects: ['math', 'science', 'economics'], type: 'action', difficulty: 2, players: 'class',
    devices: ['board', 'phone'], minutes: 10, added: '2026-09-25', rank: 78, href: board('game=formula&subject=math&topic=math-5-numbers'), art: { icon: 'swords', tone: 'rose' },
    title: L('Формула-беттеш', 'Формула-бой', 'Formula battle'),
    desc: L('Командалар аркан тартат: тез жана так эсептегендер жеңет', 'Команды перетягивают канат: побеждает точный и быстрый счёт', 'Teams play tug of war: accurate, fast counting wins')
  },
  {
    id: 'codelock', category: 'team', subjects: ['any'], type: 'puzzle', difficulty: 2, players: 'class',
    devices: ['board', 'phone'], minutes: 12, added: '2026-09-24', rank: 68, href: board('game=codelock'), art: { icon: 'lock', tone: 'ink' },
    title: L('Коддуу кулпу', 'Кодовый замок', 'Code lock'),
    desc: L('Бүт класс кулпунун сандарын ачат, каталар аягында кайра келет', 'Весь класс открывает цифры замка, ошибки возвращаются в конце', 'The class opens the lock digit by digit; mistakes come back at the end')
  },
  {
    id: 'city', category: 'team', subjects: ['economics'], type: 'strategy', difficulty: 3, players: 'class',
    devices: ['board', 'phone'], minutes: 15, added: '2026-09-25', rank: 62, href: board('game=city&subject=economics&topic=economics-10-basics'), art: { icon: 'city', tone: 'amber' },
    title: L('Шаар экономикасы', 'Экономика города', 'City economy'),
    desc: L('Туура жооптор казынаны толтурат, класс эмне курууну чечет', 'Верные ответы пополняют казну, класс решает, что строить', 'Correct answers fill the treasury, the class decides what to build')
  },
  {
    id: 'citadel', category: 'team', subjects: ['languages', 'history'], type: 'strategy', difficulty: 2, players: 'class',
    devices: ['computer', 'board'], minutes: 15, added: '2025-09-01', rank: 52, href: './games/citadel/index.html', art: { icon: 'castle', tone: 'sky' },
    title: L('Цитаделди ээлөө', 'Захват цитадели', 'Citadel'),
    desc: L('Суроолорго жооп берип, аймактарды ээле', 'Отвечай на вопросы и захватывай территории', 'Answer questions and capture territory')
  },
  {
    id: 'mafia', category: 'team', subjects: ['languages'], type: 'speech', difficulty: 3, players: 'class',
    devices: ['phone', 'computer'], minutes: 30, added: '2026-09-18', rank: 76, href: './games/mafia/index.html', art: { icon: 'mask', tone: 'ink' },
    title: L('Мафия', 'Мафия', 'Mafia'),
    desc: L('Класс менен онлайн: логика, далилдөө жана сүйлөө', 'Онлайн классом: логика, аргументация и речь', 'Online with the class: logic, arguing and speaking')
  },

  // ─── Камера менен ────────────────────────────────────────────────────────
  {
    id: 'eagle', category: 'camera', subjects: [], type: 'action', difficulty: 2, players: 'solo',
    devices: ['computer', 'camera'], minutes: 5, added: '2025-06-01', rank: 66, href: './games/eagle/index.html', art: { icon: 'bird', tone: 'teal' },
    title: L('Кыргыз бүркүтү', 'Кыргызский беркут', 'Kyrgyz eagle'),
    desc: L('Бүркүттү колдун кыймылы менен башкарып, тоскоолдуктардан өт', 'Управляй беркутом движением руки и облетай препятствия', 'Steer the eagle with your hand and dodge obstacles')
  },
  {
    id: 'reaction', category: 'camera', subjects: [], type: 'action', difficulty: 1, players: 'solo',
    devices: ['computer', 'camera'], minutes: 3, added: '2025-06-01', rank: 54, href: './games/reaction/index.html', art: { icon: 'target', tone: 'amber' },
    title: L('Ылдамдык сыноо', 'Проверка реакции', 'Reaction test'),
    desc: L('Түшкөн объекттерди камера аркылуу кармап кал', 'Лови падающие предметы через камеру', 'Catch falling objects through the camera')
  },
  {
    id: 'neon-draw', category: 'camera', subjects: [], type: 'creative', difficulty: 1, players: 'solo',
    devices: ['computer', 'camera'], minutes: 5, added: '2025-06-01', rank: 48, href: './web/neon-draw.html', art: { icon: 'brush', tone: 'violet' },
    title: L('Неон сүрөт', 'Неоновый рисунок', 'Neon drawing'),
    desc: L('Колдун кыймылы менен абада неон сызыктарын тарт', 'Рисуй в воздухе неоновыми линиями движением руки', 'Draw neon lines in the air with your hand')
  },
  {
    id: 'hand-shooter', category: 'camera', subjects: [], type: 'action', difficulty: 2, players: 'solo',
    devices: ['computer', 'camera'], minutes: 4, added: '2025-06-01', rank: 46, href: './web/hand-shooter.html', art: { icon: 'pointer', tone: 'rose' },
    title: L('Виртуалдык тир', 'Виртуальный тир', 'Virtual shooting range'),
    desc: L('Колуңду бутага багыттап, буталарды тез кулат', 'Целься рукой и сбивай мишени на скорость', 'Aim with your hand and hit the targets fast')
  },
  {
    id: 'build-3d', category: 'camera', subjects: [], type: 'creative', difficulty: 3, players: 'solo',
    devices: ['computer', 'camera'], minutes: 10, added: '2025-06-01', rank: 44, href: './web/build-3d.html', art: { icon: 'cube', tone: 'sky' },
    title: L('3D курулуш', '3D-конструктор', '3D builder'),
    desc: L('Колдор менен кубдардан виртуалдык дүйнө кур', 'Строй виртуальный мир из кубиков руками', 'Build a virtual world from cubes with your hands')
  }
];

export const getGame = (id) => GAMES.find((g) => g.id === id) || null;
export const getCategory = (id) => CATEGORIES.find((c) => c.id === id) || null;
