/** Орус адабияты, 6-класс — Орус классикасы / Русская классика */
const L = (ky, ru, en) => ({ ky, ru, en });

export default [
  {
    id: 'rl01', skill: 'authors', difficulty: 1, type: 'choice',
    prompt: L('«Балыкчы жана балык жөнүндө жомокту» ким жазган?', 'Кто написал «Сказку о рыбаке и рыбке»?', 'Who wrote "The Tale of the Fisherman and the Fish"?'),
    options: ['А. С. Пушкин', 'Л. Н. Толстой', 'А. П. Чехов', 'И. А. Крылов'], correct: 0,
    explain: L('Жомокту А. С. Пушкин 1833-жылы жазган.', 'Сказку написал А. С. Пушкин в 1833 году.', 'A. S. Pushkin wrote it in 1833.')
  },
  {
    id: 'rl02', skill: 'authors', difficulty: 1, type: 'choice',
    prompt: L('«Муму» аңгемесинин автору ким?', 'Кто автор рассказа «Муму»?', 'Who wrote the story "Mumu"?'),
    options: ['И. С. Тургенев', 'Н. В. Гоголь', 'М. Ю. Лермонтов', 'А. П. Чехов'], correct: 0,
    explain: L('«Муму» — И. С. Тургеневдин аңгемеси.', '«Муму» — рассказ И. С. Тургенева.', '"Mumu" is a story by I. S. Turgenev.')
  },
  {
    id: 'rl03', skill: 'authors', difficulty: 2, type: 'match',
    prompt: L('Чыгарманы автору менен жупташтырыңыз', 'Соедините произведение с автором', 'Match each work with its author'),
    pairs: [['«Бородино»', 'М. Ю. Лермонтов'], ['«Каштанка»', 'А. П. Чехов'], ['«Тарас Бульба»', 'Н. В. Гоголь']],
    explain: L('«Бородино» — Лермонтов, «Каштанка» — Чехов, «Тарас Бульба» — Гоголь.', '«Бородино» — Лермонтов, «Каштанка» — Чехов, «Тарас Бульба» — Гоголь.', '"Borodino" — Lermontov, "Kashtanka" — Chekhov, "Taras Bulba" — Gogol.')
  },
  {
    id: 'rl04', skill: 'genres', difficulty: 1, type: 'choice',
    prompt: L('И. А. Крыловдун «Карга жана Түлкү» чыгармасы кайсы жанрда?', 'К какому жанру относится «Ворона и Лисица» И. А. Крылова?', 'What genre is Krylov\'s "The Crow and the Fox"?'),
    options: [L('Тамсил', 'Басня', 'Fable'), L('Роман', 'Роман', 'Novel'), L('Поэма', 'Поэма', 'Long poem'), L('Пьеса', 'Пьеса', 'Play')], correct: 0,
    explain: L('Тамсилде жаныбарлар аркылуу адамдын кемчиликтери күлкүгө алынат.', 'В басне через животных высмеиваются человеческие недостатки.', 'A fable mocks human faults through animals.')
  },
  {
    id: 'rl05', skill: 'genres', difficulty: 2, type: 'choice',
    prompt: L('Тамсилдин аягындагы кыска корутунду эмне деп аталат?', 'Как называется вывод в конце басни?', 'What is the short lesson at the end of a fable called?'),
    options: [L('Мораль (насыят)', 'Мораль', 'The moral'), L('Эпилог', 'Эпилог', 'An epilogue'), L('Рифма', 'Рифма', 'A rhyme'), L('Сюжет', 'Сюжет', 'The plot')], correct: 0,
    explain: L('Мораль — тамсилдин негизги сабагы.', 'Мораль — главный урок басни.', 'The moral is the main lesson of the fable.')
  },
  {
    id: 'rl06', skill: 'works', difficulty: 2, type: 'choice',
    prompt: L('«Муму» аңгемесинде Муму ким болгон?', 'Кем была Муму в рассказе Тургенева?', 'Who was Mumu in Turgenev\'s story?'),
    options: [L('Ит', 'Собака', 'A dog'), L('Мышык', 'Кошка', 'A cat'), L('Ат', 'Лошадь', 'A horse'), L('Кыз', 'Девушка', 'A girl')], correct: 0,
    explain: L('Муму — Герасимдин сүйүктүү ити.', 'Муму — любимая собака Герасима.', 'Mumu is Gerasim\'s beloved dog.')
  },
  {
    id: 'rl07', skill: 'works', difficulty: 2, type: 'choice',
    prompt: L('«Бородино» ыры кайсы окуя жөнүндө?', 'О каком событии стихотворение «Бородино»?', 'What event is the poem "Borodino" about?'),
    options: [
      L('1812-жылкы Наполеон менен согуш', 'Война 1812 года с Наполеоном', 'The war of 1812 against Napoleon'),
      L('Экинчи дүйнөлүк согуш', 'Вторая мировая война', 'World War II'),
      L('Кавказ согушу', 'Кавказская война', 'The Caucasian War'),
      L('Космоско учуу', 'Полёт в космос', 'A space flight')
    ], correct: 0,
    explain: L('Бородино салгылашы — 1812-жылы орус армиясы менен Наполеондун ортосунда.', 'Бородинское сражение 1812 года — битва русской армии с Наполеоном.', 'The Battle of Borodino (1812) was fought against Napoleon.')
  },
  {
    id: 'rl08', skill: 'authors', difficulty: 3, type: 'sort',
    prompt: L('Жазуучуларды туулган жылы боюнча иреттеңиз (эң эртесинен)', 'Расставьте писателей по году рождения (от самого раннего)', 'Order the writers by year of birth (earliest first)'),
    items: ['И. А. Крылов', 'А. С. Пушкин', 'М. Ю. Лермонтов', 'Л. Н. Толстой', 'А. П. Чехов'],
    explain: L('Крылов — 1769, Пушкин — 1799, Лермонтов — 1814, Толстой — 1828, Чехов — 1860.', 'Крылов — 1769, Пушкин — 1799, Лермонтов — 1814, Толстой — 1828, Чехов — 1860.', 'Krylov 1769, Pushkin 1799, Lermontov 1814, Tolstoy 1828, Chekhov 1860.')
  },
  {
    id: 'rl09', skill: 'works', difficulty: 1, type: 'choice',
    prompt: L('Чехов кайсы жанрдагы кыска чыгармалары менен белгилүү?', 'Какими произведениями особенно известен Чехов?', 'What kind of works is Chekhov especially famous for?'),
    options: [L('Кыска аңгемелер', 'Короткими рассказами', 'Short stories'), L('Тамсилдер', 'Баснями', 'Fables'), L('Эпостор', 'Эпосами', 'Epics'), L('Ода', 'Одами', 'Odes')], correct: 0,
    explain: L('Чехов — кыска, күлкүлүү жана терең аңгемелердин устасы («Каштанка», «Лошадиная фамилия»).', 'Чехов — мастер коротких рассказов («Каштанка», «Лошадиная фамилия»).', 'Chekhov is a master of the short story ("Kashtanka", "A Horsey Name").')
  },
  {
    id: 'rl-err-01', skill: 'authors', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: L('Мугалим чыгармаларды жана авторлорду жазды. Кайсы сапта ката?', 'Учитель выписал произведения и авторов. Где ошибка?', 'The teacher listed works and authors. Which line is wrong?'),
    options: ['«Муму» — И. С. Тургенев', '«Ворона и Лисица» — И. А. Крылов', '«Тарас Бульба» — А. С. Пушкин', '«Каштанка» — А. П. Чехов'],
    correct: 2,
    explain: L('«Тарас Бульба» — Н. В. Гоголдун повести.', '«Тарас Бульба» — повесть Н. В. Гоголя.', '"Taras Bulba" is by N. V. Gogol.')
  }
];
