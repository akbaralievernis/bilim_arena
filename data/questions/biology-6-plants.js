/** Биология, 6-класс — Клетка жана өсүмдүктөр / Клетка и растения */
const L = (ky, ru, en) => ({ ky, ru, en });

export default [
  {
    id: 'bi01', skill: 'cell', difficulty: 1, type: 'choice',
    prompt: L('Бардык тирүү организмдердин түзүлүшүнүн негизги бирдиги эмне?', 'Что является основной единицей строения всех живых организмов?', 'What is the basic unit of all living organisms?'),
    options: [L('Клетка', 'Клетка', 'The cell'), L('Атом', 'Атом', 'The atom'), L('Орган', 'Орган', 'An organ'), L('Ткань', 'Ткань', 'A tissue')], correct: 0,
    explain: L('Бардык тирүү организмдер клеткалардан турат.', 'Все живые организмы состоят из клеток.', 'All living things are made of cells.')
  },
  {
    id: 'bi02', skill: 'cell', difficulty: 2, type: 'choice',
    prompt: L('Клетканын кайсы бөлүгүндө тукум куучулук маалымат сакталат?', 'В какой части клетки хранится наследственная информация?', 'Which part of the cell stores hereditary information?'),
    options: [L('Ядро', 'Ядро', 'The nucleus'), L('Кабык', 'Оболочка', 'The membrane'), L('Вакуоль', 'Вакуоль', 'The vacuole'), L('Цитоплазма', 'Цитоплазма', 'The cytoplasm')], correct: 0,
    explain: L('Ядродо хромосомалар — тукум куучулук маалымат.', 'В ядре находятся хромосомы — наследственная информация.', 'The nucleus holds the chromosomes.')
  },
  {
    id: 'bi03', skill: 'cell', difficulty: 2, type: 'choice',
    prompt: L('«Клетка» деген терминди биринчи ким колдонгон?', 'Кто впервые ввёл термин «клетка»?', 'Who first used the term "cell"?'),
    options: ['Роберт Гук', 'Чарлз Дарвин', 'Грегор Мендель', 'Луи Пастер'], correct: 0,
    explain: L('Роберт Гук 1665-жылы микроскоп менен тыгынды карап, «клетка» деп атаган.', 'Роберт Гук в 1665 году рассмотрел пробку под микроскопом и ввёл слово «клетка».', 'Robert Hooke named cells in 1665 after looking at cork.')
  },
  {
    id: 'bi04', skill: 'photosynthesis', difficulty: 1, type: 'choice',
    prompt: L('Фотосинтез клетканын кайсы бөлүгүндө жүрөт?', 'Где в клетке происходит фотосинтез?', 'Where in the cell does photosynthesis happen?'),
    options: [L('Хлоропласттарда', 'В хлоропластах', 'In chloroplasts'), L('Ядродо', 'В ядре', 'In the nucleus'), L('Вакуолдо', 'В вакуоли', 'In the vacuole'), L('Кабыкта', 'В оболочке', 'In the membrane')], correct: 0,
    explain: L('Хлоропласттарда хлорофилл бар — ал жарыкты кармайт.', 'В хлоропластах есть хлорофилл, он улавливает свет.', 'Chloroplasts contain chlorophyll, which captures light.')
  },
  {
    id: 'bi05', skill: 'photosynthesis', difficulty: 2, type: 'multiple',
    prompt: L('Фотосинтез үчүн эмне керек?', 'Что нужно для фотосинтеза?', 'What is needed for photosynthesis?'),
    options: [L('Жарык', 'Свет', 'Light'), L('Суу', 'Вода', 'Water'), L('Көмүр кычкыл газы', 'Углекислый газ', 'Carbon dioxide'), L('Кычкылтек', 'Кислород', 'Oxygen')],
    correct: [0, 1, 2],
    explain: L('Жарык, суу жана CO₂ колдонулат. Кычкылтек — фотосинтездин натыйжасы.', 'Используются свет, вода и CO₂. Кислород — результат фотосинтеза.', 'Light, water and CO₂ are used; oxygen is produced.')
  },
  {
    id: 'bi06', skill: 'photosynthesis', difficulty: 1, type: 'choice',
    prompt: L('Фотосинтез учурунда өсүмдүк абага эмне бөлүп чыгарат?', 'Что растение выделяет в воздух при фотосинтезе?', 'What does a plant release into the air during photosynthesis?'),
    options: [L('Кычкылтек', 'Кислород', 'Oxygen'), L('Көмүр кычкыл газы', 'Углекислый газ', 'Carbon dioxide'), L('Азот', 'Азот', 'Nitrogen'), L('Суутек', 'Водород', 'Hydrogen')], correct: 0,
    explain: L('Өсүмдүктөр CO₂ сиңирип, кычкылтек бөлүп чыгарат.', 'Растения поглощают CO₂ и выделяют кислород.', 'Plants take in CO₂ and release oxygen.')
  },
  {
    id: 'bi07', skill: 'plants', difficulty: 1, type: 'choice',
    prompt: L('Тамыр эмне үчүн керек?', 'Зачем растению корень?', 'What is a root for?'),
    options: [
      L('Сууну жана минералдарды сиңирүү, өсүмдүктү кармоо', 'Всасывать воду и минералы, удерживать растение', 'To absorb water and minerals and anchor the plant'),
      L('Фотосинтез жасоо', 'Для фотосинтеза', 'For photosynthesis'),
      L('Гүл ачуу', 'Для цветения', 'For flowering'),
      L('Чаңдашуу', 'Для опыления', 'For pollination')
    ], correct: 0,
    explain: L('Тамыр өсүмдүктү топуракта кармайт жана суу менен минералдарды сиңирет.', 'Корень удерживает растение в почве и всасывает воду с минералами.', 'Roots anchor the plant and absorb water and minerals.')
  },
  {
    id: 'bi08', skill: 'plants', difficulty: 2, type: 'choice',
    prompt: L('Гүлдүн кайсы бөлүгүндө чаңча пайда болот?', 'В какой части цветка образуется пыльца?', 'Which part of a flower produces pollen?'),
    options: [L('Эркек кыпчык (тычинка)', 'Тычинка', 'The stamen'), L('Уруучу (пестик)', 'Пестик', 'The pistil'), L('Желекче', 'Лепесток', 'A petal'), L('Сабак', 'Стебель', 'The stem')], correct: 0,
    explain: L('Чаңча тычинканын чаңдыгында пайда болот.', 'Пыльца образуется в пыльниках тычинок.', 'Pollen forms in the anthers of the stamens.')
  },
  {
    id: 'bi09', skill: 'plants', difficulty: 2, type: 'sort',
    prompt: L('Өсүмдүктүн өнүгүү баскычтарын иреттеңиз', 'Расставьте этапы развития растения', 'Put the stages of plant growth in order'),
    items: [
      L('Үрөн', 'Семя', 'Seed'),
      L('Өнүп чыгуу', 'Прорастание', 'Germination'),
      L('Жаш өсүмдүк', 'Молодое растение', 'Young plant'),
      L('Гүлдөө', 'Цветение', 'Flowering'),
      L('Үрөнү бар мөмө', 'Плод с семенами', 'Fruit with seeds')
    ],
    explain: L('Үрөндөн өсүмдүк чыгат, гүлдөйт жана жаңы үрөндөрү бар мөмө берет.', 'Из семени вырастает растение, цветёт и даёт плод с новыми семенами.', 'A seed grows into a plant that flowers and makes fruit with new seeds.')
  },
  {
    id: 'bi10', skill: 'plants', difficulty: 2, type: 'multiple',
    prompt: L('Үрөн өнүп чыгышы үчүн эмне керек?', 'Что нужно семени для прорастания?', 'What does a seed need to germinate?'),
    options: [L('Суу', 'Вода', 'Water'), L('Аба', 'Воздух', 'Air'), L('Жылуулук', 'Тепло', 'Warmth'), L('Жер семирткич сөзсүз', 'Обязательно удобрение', 'Fertiliser, always')],
    correct: [0, 1, 2],
    explain: L('Суу, аба жана жылуулук керек. Азык үрөндүн өзүндө бар.', 'Нужны вода, воздух и тепло. Питание есть в самом семени.', 'Water, air and warmth; the seed carries its own food.')
  },
  {
    id: 'bi-err-01', skill: 'photosynthesis', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: L('Мугалим фотосинтезди сүрөттөдү. Кайсы сапта ката?', 'Учитель описал фотосинтез. В какой строке ошибка?', 'The teacher described photosynthesis. Which line is wrong?'),
    options: [
      L('Жарык хлорофилл аркылуу кармалат', 'Свет улавливается хлорофиллом', 'Light is captured by chlorophyll'),
      L('Өсүмдүк кычкылтекти сиңирет', 'Растение поглощает кислород', 'The plant absorbs oxygen'),
      L('Органикалык зат (кант) пайда болот', 'Образуется органическое вещество (сахар)', 'Organic matter (sugar) is formed')
    ],
    correct: 1,
    explain: L('Фотосинтезде өсүмдүк CO₂ сиңирет, кычкылтекти бөлүп чыгарат.', 'При фотосинтезе растение поглощает CO₂, а кислород выделяет.', 'In photosynthesis the plant absorbs CO₂ and releases oxygen.')
  }
];
