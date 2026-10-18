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
  },
  {
    id: "rl21", skill: "authors", difficulty: 1, type: "choice",
    prompt: {"ky": "Көп тамсилдери (басняларды) менен белгилүү орус жазуучусу ким?", "ru": "Какой русский писатель знаменит своими баснями?", "en": "Which Russian writer is famous for his fables?"},
    options: [
      {"ky": "И. А. Крылов", "ru": "И. А. Крылов", "en": "Ivan Krylov"},
      {"ky": "А. С. Пушкин", "ru": "А. С. Пушкин", "en": "Alexander Pushkin"},
      {"ky": "Н. В. Гоголь", "ru": "Н. В. Гоголь", "en": "Nikolai Gogol"},
      {"ky": "И. С. Тургенев", "ru": "И. С. Тургенев", "en": "Ivan Turgenev"}
    ], correct: 0,
    explain: {"ky": "Крылов 200дөн ашык тамсил жазган.", "ru": "Крылов написал более 200 басен.", "en": "Krylov wrote more than 200 fables."}
  },
  {
    id: "rl23", skill: "authors", difficulty: 2, type: "choice",
    prompt: {"ky": "«Бородино» ырын ким жазган?", "ru": "Кто написал стихотворение «Бородино»?", "en": "Who wrote the poem \"Borodino\"?"},
    options: [
      {"ky": "М. Ю. Лермонтов", "ru": "М. Ю. Лермонтов", "en": "Mikhail Lermontov"},
      {"ky": "А. С. Пушкин", "ru": "А. С. Пушкин", "en": "Alexander Pushkin"},
      {"ky": "Н. А. Некрасов", "ru": "Н. А. Некрасов", "en": "Nikolai Nekrasov"},
      {"ky": "И. А. Крылов", "ru": "И. А. Крылов", "en": "Ivan Krylov"}
    ], correct: 0,
    explain: {"ky": "Лермонтов «Бородинону» 1837-жылы жазган.", "ru": "Лермонтов написал «Бородино» в 1837 году.", "en": "Lermontov wrote \"Borodino\" in 1837."}
  },
  {
    id: "rl24", skill: "genres", difficulty: 1, type: "choice",
    prompt: {"ky": "Жаныбарлар катышкан, акырында адеп сабак берген кыска чыгарма кандай аталат?", "ru": "Как называется короткое произведение о животных с нравоучением в конце?", "en": "What is a short story with animals and a moral at the end called?"},
    options: [
      {"ky": "Тамсил (басня)", "ru": "Басня", "en": "A fable"},
      {"ky": "Роман", "ru": "Роман", "en": "A novel"},
      {"ky": "Поэма", "ru": "Поэма", "en": "A narrative poem"},
      {"ky": "Драма", "ru": "Драма", "en": "A drama"}
    ], correct: 0,
    explain: {"ky": "Тамсилдин аягындагы сабак «мораль» деп аталат.", "ru": "Нравоучение в конце басни называется моралью.", "en": "The lesson at the end of a fable is called the moral."}
  },
  {
    id: "rl25", skill: "genres", difficulty: 2, type: "choice",
    prompt: {"ky": "Сыйкырдуу окуялар болгон элдик же автордук чыгарма кандай аталат?", "ru": "Как называется народное или авторское произведение с волшебными событиями?", "en": "What is a folk or literary story full of magic called?"},
    options: [
      {"ky": "Жомок", "ru": "Сказка", "en": "A fairy tale"},
      {"ky": "Очерк", "ru": "Очерк", "en": "A sketch"},
      {"ky": "Ода", "ru": "Ода", "en": "An ode"},
      {"ky": "Хроника", "ru": "Хроника", "en": "A chronicle"}
    ], correct: 0,
    explain: {"ky": "Жомокто сыйкыр, жакшылык жана жамандык күрөшү болот.", "ru": "В сказке есть волшебство и борьба добра со злом.", "en": "Fairy tales have magic and good fighting evil."}
  },
  {
    id: "rl26", skill: "works", difficulty: 1, type: "choice",
    prompt: {"ky": "Пушкиндин «Руслан и Людмила» кандай чыгарма?", "ru": "Каким произведением является «Руслан и Людмила» Пушкина?", "en": "What kind of work is Pushkin’s \"Ruslan and Ludmila\"?"},
    options: [
      {"ky": "Поэма", "ru": "Поэма", "en": "A narrative poem"},
      {"ky": "Роман", "ru": "Роман", "en": "A novel"},
      {"ky": "Тамсил", "ru": "Басня", "en": "A fable"},
      {"ky": "Пьеса", "ru": "Пьеса", "en": "A play"}
    ], correct: 0,
    explain: {"ky": "Ыр менен жазылган чоң сюжеттүү чыгарма — поэма.", "ru": "Большое сюжетное произведение в стихах — поэма.", "en": "A long story told in verse is a narrative poem."}
  },
  {
    id: "rl27", skill: "works", difficulty: 2, type: "choice",
    prompt: {"ky": "«Каштанка» кимдин чыгармасы?", "ru": "Чьё произведение «Каштанка»?", "en": "Who wrote \"Kashtanka\"?"},
    options: [
      {"ky": "А. П. Чехов", "ru": "А. П. Чехов", "en": "Anton Chekhov"},
      {"ky": "Л. Н. Толстой", "ru": "Л. Н. Толстой", "en": "Leo Tolstoy"},
      {"ky": "И. С. Тургенев", "ru": "И. С. Тургенев", "en": "Ivan Turgenev"},
      {"ky": "Н. В. Гоголь", "ru": "Н. В. Гоголь", "en": "Nikolai Gogol"}
    ], correct: 0,
    explain: {"ky": "«Каштанка» — Чеховдун ит жөнүндөгү аңгемеси.", "ru": "«Каштанка» — рассказ Чехова о собаке.", "en": "\"Kashtanka\" is Chekhov’s story about a dog."}
  },
  {
    id: "rl28", skill: "works", difficulty: 2, type: "choice",
    prompt: {"ky": "«Вечера на хуторе близ Диканьки» чыгармасынын автору ким?", "ru": "Кто автор «Вечеров на хуторе близ Диканьки»?", "en": "Who wrote \"Evenings on a Farm Near Dikanka\"?"},
    options: [
      {"ky": "Н. В. Гоголь", "ru": "Н. В. Гоголь", "en": "Nikolai Gogol"},
      {"ky": "А. С. Пушкин", "ru": "А. С. Пушкин", "en": "Alexander Pushkin"},
      {"ky": "М. Ю. Лермонтов", "ru": "М. Ю. Лермонтов", "en": "Mikhail Lermontov"},
      {"ky": "Ф. М. Достоевский", "ru": "Ф. М. Достоевский", "en": "Fyodor Dostoevsky"}
    ], correct: 0,
    explain: {"ky": "Бул Гоголдун алгачкы аңгемелер жыйнагы.", "ru": "Это первый сборник повестей Гоголя.", "en": "It is Gogol’s first collection of stories."}
  },
  {
    id: "rl29", skill: "genres", difficulty: 2, type: "choice",
    prompt: {"ky": "«Евгений Онегин» кандай жанрда жазылган?", "ru": "В каком жанре написан «Евгений Онегин»?", "en": "What genre is \"Eugene Onegin\"?"},
    options: [
      {"ky": "Ыр менен жазылган роман", "ru": "Роман в стихах", "en": "A novel in verse"},
      {"ky": "Тамсил", "ru": "Басня", "en": "A fable"},
      {"ky": "Жомок", "ru": "Сказка", "en": "A fairy tale"},
      {"ky": "Аңгеме", "ru": "Рассказ", "en": "A short story"}
    ], correct: 0,
    explain: {"ky": "Пушкин аны «ыр менен жазылган роман» деп атаган.", "ru": "Пушкин сам называл его «романом в стихах».", "en": "Pushkin called it a \"novel in verse\"."}
  },
  {
    id: "rl30", skill: "works", difficulty: 2, type: "choice",
    prompt: {"ky": "«Бежин луг» аңгемесинин автору ким?", "ru": "Кто автор рассказа «Бежин луг»?", "en": "Who wrote the story \"Bezhin Meadow\"?"},
    options: [
      {"ky": "И. С. Тургенев", "ru": "И. С. Тургенев", "en": "Ivan Turgenev"},
      {"ky": "Л. Н. Толстой", "ru": "Л. Н. Толстой", "en": "Leo Tolstoy"},
      {"ky": "А. П. Чехов", "ru": "А. П. Чехов", "en": "Anton Chekhov"},
      {"ky": "Н. В. Гоголь", "ru": "Н. В. Гоголь", "en": "Nikolai Gogol"}
    ], correct: 0,
    explain: {"ky": "«Бежин луг» — Тургеневдин «Аңчынын жазмалары» жыйнагынан.", "ru": "«Бежин луг» — из цикла Тургенева «Записки охотника».", "en": "\"Bezhin Meadow\" is from Turgenev’s \"A Sportsman’s Sketches\"."}
  },
  {
    id: "rl31", skill: "genres", difficulty: 2, type: "choice",
    prompt: {"ky": "Пушкиндин «Зимнее утро» чыгармасы кандай жанрда?", "ru": "К какому жанру относится «Зимнее утро» Пушкина?", "en": "What genre is Pushkin’s \"Winter Morning\"?"},
    options: [
      {"ky": "Лирикалык ыр", "ru": "Лирическое стихотворение", "en": "A lyric poem"},
      {"ky": "Роман", "ru": "Роман", "en": "A novel"},
      {"ky": "Тамсил", "ru": "Басня", "en": "A fable"},
      {"ky": "Пьеса", "ru": "Пьеса", "en": "A play"}
    ], correct: 0,
    explain: {"ky": "Анда окуя эмес, акындын сезими жана жаратылыштын сүрөтү бар.", "ru": "В нём не сюжет, а чувства поэта и картина природы.", "en": "It shows the poet’s feelings and a picture of nature rather than a plot."}
  }
];
