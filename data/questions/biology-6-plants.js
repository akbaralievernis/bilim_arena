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
  },
  {
    id: "bi11", skill: "cell", difficulty: 1, type: "choice",
    prompt: {"ky": "Клетканын тукум куучулук маалыматы кайсы бөлүгүндө сакталат?", "ru": "В какой части клетки хранится наследственная информация?", "en": "Which part of the cell stores hereditary information?"},
    options: [
      {"ky": "Ядро", "ru": "Ядро", "en": "The nucleus"},
      {"ky": "Цитоплазма", "ru": "Цитоплазма", "en": "The cytoplasm"},
      {"ky": "Клетка кабыгы", "ru": "Клеточная оболочка", "en": "The cell wall"},
      {"ky": "Вакуоль", "ru": "Вакуоль", "en": "The vacuole"}
    ], correct: 0,
    explain: {"ky": "Ядродо ДНК бар — ал тукум куучулук маалыматты сактайт.", "ru": "В ядре находится ДНК — она хранит наследственную информацию.", "en": "The nucleus contains DNA, which carries hereditary information."}
  },
  {
    id: "bi12", skill: "cell", difficulty: 1, type: "choice",
    prompt: {"ky": "Өсүмдүк клеткасына жашыл түс берген органоиддер кайсылар?", "ru": "Какие органоиды придают клетке растения зелёный цвет?", "en": "Which organelles make plant cells green?"},
    options: [
      {"ky": "Хлоропласттар", "ru": "Хлоропласты", "en": "Chloroplasts"},
      {"ky": "Митохондриялар", "ru": "Митохондрии", "en": "Mitochondria"},
      {"ky": "Рибосомалар", "ru": "Рибосомы", "en": "Ribosomes"},
      {"ky": "Ядро", "ru": "Ядро", "en": "The nucleus"}
    ], correct: 0,
    explain: {"ky": "Хлоропласттарда жашыл пигмент — хлорофилл бар.", "ru": "В хлоропластах есть зелёный пигмент — хлорофилл.", "en": "Chloroplasts contain the green pigment chlorophyll."}
  },
  {
    id: "bi13", skill: "cell", difficulty: 1, type: "choice",
    prompt: {"ky": "Клетканы кайсы курал менен көрүүгө болот?", "ru": "С помощью какого прибора можно увидеть клетку?", "en": "Which instrument lets you see a cell?"},
    options: [
      {"ky": "Микроскоп", "ru": "Микроскоп", "en": "A microscope"},
      {"ky": "Телескоп", "ru": "Телескоп", "en": "A telescope"},
      {"ky": "Барометр", "ru": "Барометр", "en": "A barometer"},
      {"ky": "Термометр", "ru": "Термометр", "en": "A thermometer"}
    ], correct: 0,
    explain: {"ky": "Клетка өтө кичине, аны микроскоп чоңойтуп көрсөтөт.", "ru": "Клетка очень мала — её увеличивает микроскоп.", "en": "Cells are tiny; a microscope magnifies them."}
  },
  {
    id: "bi14", skill: "photosynthesis", difficulty: 2, type: "choice",
    prompt: {"ky": "Фотосинтез негизинен өсүмдүктүн кайсы органында жүрөт?", "ru": "В каком органе растения в основном идёт фотосинтез?", "en": "In which organ of a plant does photosynthesis mainly happen?"},
    options: [
      {"ky": "Жалбырак", "ru": "Лист", "en": "The leaf"},
      {"ky": "Тамыр", "ru": "Корень", "en": "The root"},
      {"ky": "Гүл", "ru": "Цветок", "en": "The flower"},
      {"ky": "Үрөн", "ru": "Семя", "en": "The seed"}
    ], correct: 0,
    explain: {"ky": "Жалбыракта хлоропласттар көп жана ал жарыкка ачык.", "ru": "В листе много хлоропластов, и он открыт свету.", "en": "Leaves have many chloroplasts and face the light."}
  },
  {
    id: "bi15", skill: "photosynthesis", difficulty: 2, type: "choice",
    prompt: {"ky": "Фотосинтездин натыйжасында өсүмдүктө кандай зат пайда болот?", "ru": "Какое вещество образуется в растении при фотосинтезе?", "en": "Which substance does a plant make during photosynthesis?"},
    options: [
      {"ky": "Глюкоза (кант)", "ru": "Глюкоза (сахар)", "en": "Glucose (sugar)"},
      {"ky": "Туз", "ru": "Соль", "en": "Salt"},
      {"ky": "Темир", "ru": "Железо", "en": "Iron"},
      {"ky": "Азот", "ru": "Азот", "en": "Nitrogen"}
    ], correct: 0,
    explain: {"ky": "Жарыктын энергиясы менен CO₂ жана суудан глюкоза жана кычкылтек пайда болот.", "ru": "С энергией света из CO₂ и воды образуются глюкоза и кислород.", "en": "Using light energy, CO₂ and water become glucose and oxygen."}
  },
  {
    id: "bi16", skill: "plants", difficulty: 1, type: "choice",
    prompt: {"ky": "Өсүмдүктү топурактан суу жана минералдар менен камсыз кылган орган?", "ru": "Какой орган снабжает растение водой и минералами из почвы?", "en": "Which organ takes in water and minerals from the soil?"},
    options: [
      {"ky": "Тамыр", "ru": "Корень", "en": "The root"},
      {"ky": "Жалбырак", "ru": "Лист", "en": "The leaf"},
      {"ky": "Гүл", "ru": "Цветок", "en": "The flower"},
      {"ky": "Мөмө", "ru": "Плод", "en": "The fruit"}
    ], correct: 0,
    explain: {"ky": "Тамыр топурактан суу соруп, өсүмдүктү бекемдейт.", "ru": "Корень всасывает воду из почвы и закрепляет растение.", "en": "The root absorbs water and anchors the plant."}
  },
  {
    id: "bi17", skill: "plants", difficulty: 1, type: "choice",
    prompt: {"ky": "Сабак өсүмдүктө кандай милдет аткарат?", "ru": "Какую работу выполняет стебель?", "en": "What does the stem do?"},
    options: [
      {"ky": "Суу жана заттарды өткөрөт, жалбырактарды кармайт", "ru": "Проводит воду и вещества, держит листья", "en": "Carries water and nutrients and holds up the leaves"},
      {"ky": "Үрөн пайда кылат", "ru": "Образует семена", "en": "Makes seeds"},
      {"ky": "Чаңдашат", "ru": "Опыляет цветки", "en": "Pollinates flowers"},
      {"ky": "Топурактан минерал гана алат", "ru": "Только берёт минералы из почвы", "en": "Only takes minerals from the soil"}
    ], correct: 0,
    explain: {"ky": "Сабак — тамыр менен жалбырактын ортосундагы «жол».", "ru": "Стебель — «дорога» между корнем и листьями.", "en": "The stem is the road between the roots and the leaves."}
  },
  {
    id: "bi18", skill: "plants", difficulty: 2, type: "choice",
    prompt: {"ky": "Үрөн өсүмдүктүн кайсы бөлүгүнөн пайда болот?", "ru": "Из какой части растения развиваются семена?", "en": "Which part of a plant do seeds develop from?"},
    options: [
      {"ky": "Гүлдөн", "ru": "Из цветка", "en": "The flower"},
      {"ky": "Тамырдан", "ru": "Из корня", "en": "The root"},
      {"ky": "Жалбырактан", "ru": "Из листа", "en": "The leaf"},
      {"ky": "Сабактан", "ru": "Из стебля", "en": "The stem"}
    ], correct: 0,
    explain: {"ky": "Чаңдашкандан кийин гүлдөн мөмө жана үрөн пайда болот.", "ru": "После опыления из цветка развиваются плод и семена.", "en": "After pollination the flower develops into fruit and seeds."}
  },
  {
    id: "bi19", skill: "photosynthesis", difficulty: 3, type: "choice",
    prompt: {"ky": "Өсүмдүктөр түнкүсүн, жарык жок кезде, эмне кылат?", "ru": "Что делают растения ночью, когда нет света?", "en": "What do plants do at night, when there is no light?"},
    options: [
      {"ky": "Дем алат: кычкылтек сиңирип, CO₂ бөлүп чыгарат", "ru": "Дышат: поглощают кислород и выделяют CO₂", "en": "They breathe: take in oxygen and give out CO₂"},
      {"ky": "Фотосинтез жүргүзөт", "ru": "Продолжают фотосинтез", "en": "They keep photosynthesising"},
      {"ky": "Эч нерсе кылбайт", "ru": "Ничего не делают", "en": "Nothing at all"},
      {"ky": "Кычкылтек гана бөлүп чыгарат", "ru": "Выделяют только кислород", "en": "They only give out oxygen"}
    ], correct: 0,
    explain: {"ky": "Дем алуу күнү-түнү жүрөт, фотосинтез — жарыкта гана.", "ru": "Дыхание идёт днём и ночью, фотосинтез — только на свету.", "en": "Plants breathe day and night; photosynthesis needs light."}
  }
];
