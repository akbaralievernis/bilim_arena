/** Дүйнө тарыхы, 5-класс — Байыркы дүйнө / Древний мир */
const L = (ky, ru, en) => ({ ky, ru, en });

export default [
  {
    id: 'wh01', skill: 'civilizations', difficulty: 1, type: 'choice',
    prompt: L('Гиза пирамидалары кайсы өлкөдө?', 'В какой стране находятся пирамиды Гизы?', 'In which country are the pyramids of Giza?'),
    options: [L('Египет', 'Египет', 'Egypt'), L('Греция', 'Греция', 'Greece'), L('Кытай', 'Китай', 'China'), L('Индия', 'Индия', 'India')], correct: 0,
    explain: L('Пирамидалар — байыркы Египеттин фараондорунун мүрзөлөрү.', 'Пирамиды — гробницы фараонов Древнего Египта.', 'The pyramids are tombs of ancient Egyptian pharaohs.')
  },
  {
    id: 'wh02', skill: 'civilizations', difficulty: 1, type: 'choice',
    prompt: L('Олимпиада оюндары кайсы жерде башталган?', 'Где зародились Олимпийские игры?', 'Where did the Olympic Games begin?'),
    options: [L('Байыркы Грецияда', 'В Древней Греции', 'In ancient Greece'), L('Байыркы Римде', 'В Древнем Риме', 'In ancient Rome'), L('Египетте', 'В Египте', 'In Egypt'), L('Персияда', 'В Персии', 'In Persia')], correct: 0,
    explain: L('Биринчи белгилүү Олимпиада б. з. ч. 776-жылы Олимпияда өткөн.', 'Первые известные игры прошли в Олимпии в 776 году до н. э.', 'The first recorded Games were held at Olympia in 776 BC.')
  },
  {
    id: 'wh03', skill: 'civilizations', difficulty: 1, type: 'choice',
    prompt: L('Улуу Кытай дубалы эмне үчүн курулган?', 'Зачем построили Великую Китайскую стену?', 'Why was the Great Wall of China built?'),
    options: [
      L('Түндүктөгү көчмөндөрдөн коргонуу үчүн', 'Для защиты от кочевников с севера', 'To defend against northern nomads'),
      L('Дарыяны тосуу үчүн', 'Чтобы перегородить реку', 'To dam a river'),
      L('Храм катары', 'Как храм', 'As a temple'),
      L('Соода базары катары', 'Как рынок', 'As a market')
    ], correct: 0,
    explain: L('Дубал көп кылымдар бою түндүк чек араны коргоо үчүн курулган.', 'Стену веками строили для защиты северных границ.', 'It was built over centuries to guard the northern frontier.')
  },
  {
    id: 'wh04', skill: 'culture', difficulty: 2, type: 'match',
    prompt: L('Жазууну анын мекени менен жупташтырыңыз', 'Соедините письменность с её родиной', 'Match each writing system with its homeland'),
    pairs: [
      [L('Иероглифтер', 'Иероглифы', 'Hieroglyphs'), L('Египет', 'Египет', 'Egypt')],
      [L('Сына жазуу', 'Клинопись', 'Cuneiform'), L('Месопотамия', 'Месопотамия', 'Mesopotamia')],
      [L('Грек алфавити', 'Греческий алфавит', 'Greek alphabet'), L('Греция', 'Греция', 'Greece')]
    ],
    explain: L('Сына жазууну шумерлер Месопотамияда ойлоп тапкан.', 'Клинопись придумали шумеры в Месопотамии.', 'Cuneiform was invented by the Sumerians in Mesopotamia.')
  },
  {
    id: 'wh05', skill: 'culture', difficulty: 2, type: 'choice',
    prompt: L('Демократия кайсы шаарда пайда болгон?', 'В каком городе зародилась демократия?', 'In which city was democracy born?'),
    options: [L('Афина', 'Афины', 'Athens'), L('Спарта', 'Спарта', 'Sparta'), L('Рим', 'Рим', 'Rome'), L('Вавилон', 'Вавилон', 'Babylon')], correct: 0,
    explain: L('«Демократия» — гректерче «элдин бийлиги», Афинада пайда болгон.', '«Демократия» — по-гречески «власть народа», возникла в Афинах.', '"Democracy" means "rule of the people" in Greek; it began in Athens.')
  },
  {
    id: 'wh06', skill: 'culture', difficulty: 1, type: 'choice',
    prompt: L('Колизей кайсы шаарда?', 'В каком городе находится Колизей?', 'In which city is the Colosseum?'),
    options: [L('Рим', 'Рим', 'Rome'), L('Афина', 'Афины', 'Athens'), L('Каир', 'Каир', 'Cairo'), L('Париж', 'Париж', 'Paris')], correct: 0,
    explain: L('Колизей — Байыркы Римдин амфитеатры.', 'Колизей — амфитеатр Древнего Рима.', 'The Colosseum is an amphitheatre of ancient Rome.')
  },
  {
    id: 'wh07', skill: 'civilizations', difficulty: 2, type: 'choice',
    prompt: L('Улуу Жибек жолу эмнени байланыштырган?', 'Что связывал Великий шёлковый путь?', 'What did the Great Silk Road connect?'),
    options: [
      L('Кытайды Жер Ортолук деңизи менен', 'Китай со Средиземноморьем', 'China with the Mediterranean'),
      L('Египетти Индия менен гана', 'Только Египет с Индией', 'Only Egypt with India'),
      L('Америка менен Европаны', 'Америку с Европой', 'America with Europe'),
      L('Африка менен Австралияны', 'Африку с Австралией', 'Africa with Australia')
    ], correct: 0,
    explain: L('Жибек жолунун бир бөлүгү азыркы Кыргызстандын аймагы аркылуу өткөн.', 'Часть Шёлкового пути проходила по территории нынешнего Кыргызстана.', 'Part of the Silk Road ran through present-day Kyrgyzstan.')
  },
  {
    id: 'wh08', skill: 'dates', difficulty: 2, type: 'sort',
    prompt: L('Окуяларды убакыт боюнча иреттеңиз (эң эртесинен)', 'Расставьте события по времени (от самого раннего)', 'Put the events in order (earliest first)'),
    items: [
      L('Гизадагы Улуу пирамиданын курулушу', 'Строительство Великой пирамиды в Гизе', 'Building of the Great Pyramid of Giza'),
      L('Биринчи Олимпиада оюндары', 'Первые Олимпийские игры', 'The first Olympic Games'),
      L('Римдин негизделиши (уламыш боюнча)', 'Основание Рима (по преданию)', 'The founding of Rome (by legend)'),
      L('Батыш Рим империясынын кулашы', 'Падение Западной Римской империи', 'Fall of the Western Roman Empire')
    ],
    explain: L('≈ б. з. ч. 2560 → б. з. ч. 776 → б. з. ч. 753 → б. з. 476.', '≈ 2560 до н. э. → 776 до н. э. → 753 до н. э. → 476 н. э.', '≈ 2560 BC → 776 BC → 753 BC → AD 476.')
  },
  {
    id: 'wh09', skill: 'dates', difficulty: 2, type: 'choice',
    prompt: L('«Б. з. ч. 776-жыл» менен «б. з. ч. 753-жыл» — кайсынысы эртерээк?', 'Что раньше: 776 год до н. э. или 753 год до н. э.?', 'Which is earlier: 776 BC or 753 BC?'),
    options: [L('Б. з. ч. 776-жыл', '776 год до н. э.', '776 BC'), L('Б. з. ч. 753-жыл', '753 год до н. э.', '753 BC'), L('Бир убакта', 'Одновременно', 'The same time')], correct: 0,
    explain: L('Биздин заманга чейин сан канча чоң болсо, окуя ошончо эрте болгон.', 'До нашей эры: чем больше число, тем раньше событие.', 'Before Christ: the larger the number, the earlier the event.')
  },
  {
    id: 'wh-err-01', skill: 'civilizations', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: L('Мугалим эстеликтерди жана өлкөлөрдү жазды. Кайсы сапта ката?', 'Учитель выписал памятники и страны. Где ошибка?', 'The teacher listed monuments and countries. Which line is wrong?'),
    options: [
      L('Пирамидалар — Египет', 'Пирамиды — Египет', 'Pyramids — Egypt'),
      L('Колизей — Греция', 'Колизей — Греция', 'Colosseum — Greece'),
      L('Улуу дубал — Кытай', 'Великая стена — Китай', 'Great Wall — China'),
      L('Парфенон — Греция', 'Парфенон — Греция', 'Parthenon — Greece')
    ],
    correct: 1,
    explain: L('Колизей Римде — Италияда.', 'Колизей находится в Риме, в Италии.', 'The Colosseum is in Rome, Italy.')
  },
  {
    id: "wh20", skill: "civilizations", difficulty: 1, type: "choice",
    prompt: {"ky": "Гиза пирамидалары кайсы байыркы өлкөдө курулган?", "ru": "В какой древней стране построены пирамиды Гизы?", "en": "In which ancient country were the pyramids of Giza built?"},
    options: [
      {"ky": "Египет", "ru": "Египет", "en": "Egypt"},
      {"ky": "Рим", "ru": "Рим", "en": "Rome"},
      {"ky": "Кытай", "ru": "Китай", "en": "China"},
      {"ky": "Греция", "ru": "Греция", "en": "Greece"}
    ], correct: 0,
    explain: {"ky": "Пирамидалар — Египет фараондорунун мүрзөлөрү.", "ru": "Пирамиды — гробницы египетских фараонов.", "en": "The pyramids are tombs of Egyptian pharaohs."}
  },
  {
    id: "wh21", skill: "civilizations", difficulty: 1, type: "choice",
    prompt: {"ky": "Байыркы Египеттин падышасы кандай аталган?", "ru": "Как называли правителя Древнего Египта?", "en": "What was the ruler of ancient Egypt called?"},
    options: [
      {"ky": "Фараон", "ru": "Фараон", "en": "A pharaoh"},
      {"ky": "Император", "ru": "Император", "en": "An emperor"},
      {"ky": "Хан", "ru": "Хан", "en": "A khan"},
      {"ky": "Консул", "ru": "Консул", "en": "A consul"}
    ], correct: 0,
    explain: {"ky": "Египеттиктер фараонду кудайдын уулу деп эсептешкен.", "ru": "Египтяне считали фараона сыном бога.", "en": "Egyptians thought the pharaoh was the son of a god."}
  },
  {
    id: "wh22", skill: "civilizations", difficulty: 2, type: "choice",
    prompt: {"ky": "Олимпиада оюндары кайсы өлкөдө пайда болгон?", "ru": "Где появились Олимпийские игры?", "en": "Where did the Olympic Games begin?"},
    options: [
      {"ky": "Байыркы Грецияда", "ru": "В Древней Греции", "en": "Ancient Greece"},
      {"ky": "Байыркы Римде", "ru": "В Древнем Риме", "en": "Ancient Rome"},
      {"ky": "Египетте", "ru": "В Египте", "en": "Egypt"},
      {"ky": "Персияда", "ru": "В Персии", "en": "Persia"}
    ], correct: 0,
    explain: {"ky": "Алгачкы оюндар Олимпия шаарында өткөн.", "ru": "Первые игры прошли в городе Олимпия.", "en": "The first games were held at Olympia."}
  },
  {
    id: "wh23", skill: "civilizations", difficulty: 2, type: "choice",
    prompt: {"ky": "Улуу Кытай дубалы эмне үчүн курулган?", "ru": "Зачем построили Великую Китайскую стену?", "en": "Why was the Great Wall of China built?"},
    options: [
      {"ky": "Көчмөндөрдүн чабуулунан коргонуу үчүн", "ru": "Для защиты от набегов кочевников", "en": "To defend against raids by nomads"},
      {"ky": "Сууну токтотуу үчүн", "ru": "Чтобы остановить воду", "en": "To hold back water"},
      {"ky": "Жолду кыскартуу үчүн", "ru": "Чтобы сократить путь", "en": "To make journeys shorter"},
      {"ky": "Мал багуу үчүн", "ru": "Чтобы пасти скот", "en": "To keep livestock"}
    ], correct: 0,
    explain: {"ky": "Дубал түндүк чек араны коргогон.", "ru": "Стена защищала северную границу.", "en": "The wall protected the northern border."}
  },
  {
    id: "wh24", skill: "culture", difficulty: 1, type: "choice",
    prompt: {"ky": "Байыркы Египеттин жазуусу кандай аталат?", "ru": "Как называется письменность Древнего Египта?", "en": "What is the writing of ancient Egypt called?"},
    options: [
      {"ky": "Иероглифтер", "ru": "Иероглифы", "en": "Hieroglyphs"},
      {"ky": "Кириллица", "ru": "Кириллица", "en": "Cyrillic"},
      {"ky": "Латын арибы", "ru": "Латиница", "en": "The Latin alphabet"},
      {"ky": "Руналар", "ru": "Руны", "en": "Runes"}
    ], correct: 0,
    explain: {"ky": "Иероглифтер — сүрөт белгилер.", "ru": "Иероглифы — знаки-рисунки.", "en": "Hieroglyphs are picture signs."}
  },
  {
    id: "wh25", skill: "culture", difficulty: 2, type: "choice",
    prompt: {"ky": "Байыркы гректердин эң башкы кудайы ким?", "ru": "Кто главный бог древних греков?", "en": "Who was the chief god of the ancient Greeks?"},
    options: [
      {"ky": "Зевс", "ru": "Зевс", "en": "Zeus"},
      {"ky": "Юпитер", "ru": "Юпитер", "en": "Jupiter"},
      {"ky": "Ра", "ru": "Ра", "en": "Ra"},
      {"ky": "Один", "ru": "Один", "en": "Odin"}
    ], correct: 0,
    explain: {"ky": "Зевс Олимп тоосунда жашаган деп эсептелген. Юпитер — римдиктердин кудайы.", "ru": "Считалось, что Зевс жил на Олимпе. Юпитер — бог римлян.", "en": "Zeus was believed to live on Mount Olympus; Jupiter was the Roman god."}
  },
  {
    id: "wh26", skill: "culture", difficulty: 2, type: "choice",
    prompt: {"ky": "Рим империясынын борбору кайсы шаар болгон?", "ru": "Какой город был столицей Римской империи?", "en": "Which city was the capital of the Roman Empire?"},
    options: [
      {"ky": "Рим", "ru": "Рим", "en": "Rome"},
      {"ky": "Афина", "ru": "Афины", "en": "Athens"},
      {"ky": "Каир", "ru": "Каир", "en": "Cairo"},
      {"ky": "Вавилон", "ru": "Вавилон", "en": "Babylon"}
    ], correct: 0,
    explain: {"ky": "Империя өз аталышын Рим шаарынан алган.", "ru": "Империя получила название от города Рим.", "en": "The empire was named after the city of Rome."}
  },
  {
    id: "wh27", skill: "dates", difficulty: 1, type: "choice",
    prompt: {"ky": "Кайсы жыл эртерээк болгон?", "ru": "Какой год был раньше?", "en": "Which year came earlier?"},
    options: [
      {"ky": "б.з.ч. 500-жыл", "ru": "500 год до н. э.", "en": "500 BC"},
      {"ky": "б.з. 500-жылы", "ru": "500 год н. э.", "en": "AD 500"},
      {"ky": "б.з. 1000-жылы", "ru": "1000 год н. э.", "en": "AD 1000"},
      {"ky": "б.з. 2000-жылы", "ru": "2000 год н. э.", "en": "AD 2000"}
    ], correct: 0,
    explain: {"ky": "Биздин заманга чейинки жылдар биздин замандагы жылдардан мурун.", "ru": "Годы до нашей эры были раньше лет нашей эры.", "en": "Years BC come before years AD."}
  },
  {
    id: "wh28", skill: "dates", difficulty: 2, type: "input", numeric: true,
    prompt: {"ky": "б.з.ч. 300-жылдан б.з.ч. 100-жылга чейин канча жыл өткөн?", "ru": "Сколько лет прошло с 300 года до н. э. до 100 года до н. э.?", "en": "How many years passed from 300 BC to 100 BC?"},
    answer: ["200"],
    explain: {"ky": "Б.з.ч. жылдар азаят: 300 − 100 = 200.", "ru": "Годы до н. э. убывают: 300 − 100 = 200.", "en": "BC years count down: 300 − 100 = 200."}
  },
  {
    id: "wh29", skill: "civilizations", difficulty: 2, type: "choice",
    prompt: {"ky": "Месопотамия кайсы эки дарыянын ортосунда жайгашкан?", "ru": "Между какими реками находилась Месопотамия?", "en": "Which two rivers was Mesopotamia between?"},
    options: [
      {"ky": "Тигр жана Евфрат", "ru": "Тигр и Евфрат", "en": "The Tigris and the Euphrates"},
      {"ky": "Нил жана Конго", "ru": "Нил и Конго", "en": "The Nile and the Congo"},
      {"ky": "Хуанхэ жана Янцзы", "ru": "Хуанхэ и Янцзы", "en": "The Yellow River and the Yangtze"},
      {"ky": "Дунай жана Рейн", "ru": "Дунай и Рейн", "en": "The Danube and the Rhine"}
    ], correct: 0,
    explain: {"ky": "«Месопотамия» — «дарыялар аралыгы» деген сөз.", "ru": "«Месопотамия» значит «междуречье».", "en": "\"Mesopotamia\" means \"between the rivers\"."}
  }
];
