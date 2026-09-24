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
  }
];
