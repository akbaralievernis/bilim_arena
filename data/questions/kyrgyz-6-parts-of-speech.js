/** Кыргыз тили, 6-класс — Сөз түркүмдөрү */
export default [
  {
    id: 'k01', skill: 'noun', difficulty: 1, type: 'choice',
    prompt: { ky: 'Зат атооч кайсы суроолорго жооп берет?', ru: 'На какие вопросы отвечает имя существительное?', en: 'Which questions does a noun answer?' },
    options: [
      { ky: 'Ким? Эмне?', ru: 'Кто? Что?', en: 'Who? What?' },
      { ky: 'Кандай? Кайсы?', ru: 'Какой? Который?', en: 'Which? What kind?' },
      { ky: 'Эмне кылды?', ru: 'Что сделал?', en: 'What did it do?' },
      { ky: 'Канча? Нече?', ru: 'Сколько?', en: 'How many?' }
    ], correct: 0,
    explain: { ky: 'Зат атооч предметти билдирет: ким? эмне?', ru: 'Существительное обозначает предмет: кто? что?', en: 'A noun names a thing: who? what?' }
  },
  {
    id: 'k02', skill: 'noun', difficulty: 1, type: 'choice',
    prompt: { ky: 'Кайсы сөз зат атооч?', ru: 'Какое слово — существительное?', en: 'Which word is a noun?' },
    options: ['китеп', 'кызыл', 'жазды', 'беш'], correct: 0,
    explain: { ky: '«Китеп» — предмет, демек зат атооч.', ru: '«Китеп» (книга) — предмет, значит существительное.', en: '"Китеп" (book) is a thing, so it is a noun.' }
  },
  {
    id: 'k03', skill: 'noun', difficulty: 2, type: 'choice',
    prompt: { ky: '«Окуучу» сөзүнүн көптүк түрү кандай?', ru: 'Как выглядит множественное число слова «окуучу»?', en: 'What is the plural of "окуучу"?' },
    options: ['окуучулар', 'окуучулор', 'окуучудар', 'окуучутар'], correct: 0,
    explain: { ky: 'Үндөштүк закону боюнча -лар мүчөсү жалганат.', ru: 'По закону сингармонизма добавляется аффикс -лар.', en: 'Vowel harmony gives the suffix -лар.' }
  },
  {
    id: 'k04', skill: 'adjective', difficulty: 1, type: 'choice',
    prompt: { ky: 'Кайсы сөз сын атооч?', ru: 'Какое слово — прилагательное?', en: 'Which word is an adjective?' },
    options: ['бийик', 'тоо', 'чуркады', 'он'], correct: 0,
    explain: { ky: '«Бийик» — заттын белгисин билдирет.', ru: '«Бийик» (высокий) обозначает признак предмета.', en: '"Бийик" (tall) describes a quality.' }
  },
  {
    id: 'k05', skill: 'adjective', difficulty: 2, type: 'choice',
    prompt: { ky: 'Сын атооч кайсы суроолорго жооп берет?', ru: 'На какие вопросы отвечает прилагательное?', en: 'Which questions does an adjective answer?' },
    options: [
      { ky: 'Кандай? Кайсы?', ru: 'Какой? Который?', en: 'Which? What kind?' },
      { ky: 'Ким? Эмне?', ru: 'Кто? Что?', en: 'Who? What?' },
      { ky: 'Качан?', ru: 'Когда?', en: 'When?' },
      { ky: 'Канча?', ru: 'Сколько?', en: 'How many?' }
    ], correct: 0,
    explain: { ky: 'Сын атооч заттын сапатын көрсөтөт.', ru: 'Прилагательное указывает на качество предмета.', en: 'An adjective shows a quality of a thing.' }
  },
  {
    id: 'k06', skill: 'verb', difficulty: 1, type: 'choice',
    prompt: { ky: 'Кайсы сөз этиш?', ru: 'Какое слово — глагол?', en: 'Which word is a verb?' },
    options: ['жазды', 'калем', 'сары', 'үч'], correct: 0,
    explain: { ky: '«Жазды» — аракетти билдирет.', ru: '«Жазды» (написал) обозначает действие.', en: '"Жазды" (wrote) expresses an action.' }
  },
  {
    id: 'k07', skill: 'verb', difficulty: 2, type: 'choice',
    prompt: { ky: '«Окуйм» этиши кайсы жакта турат?', ru: 'В каком лице стоит глагол «окуйм»?', en: 'Which person is the verb "окуйм" in?' },
    options: [
      { ky: 'I жак, жекелик', ru: '1-е лицо, единственное', en: 'First person singular' },
      { ky: 'II жак, жекелик', ru: '2-е лицо, единственное', en: 'Second person singular' },
      { ky: 'III жак', ru: '3-е лицо', en: 'Third person' },
      { ky: 'I жак, көптүк', ru: '1-е лицо, множественное', en: 'First person plural' }
    ], correct: 0,
    explain: { ky: '-м мүчөсү I жакты билдирет: мен окуйм.', ru: 'Аффикс -м указывает на 1-е лицо: я читаю.', en: 'The suffix -м marks first person: I read.' }
  },
  {
    id: 'k08', skill: 'verb', difficulty: 2, type: 'choice',
    prompt: { ky: 'Кайсы сөз өткөн чактагы этиш?', ru: 'Какое слово — глагол прошедшего времени?', en: 'Which word is a past tense verb?' },
    options: ['келди', 'келет', 'келе жатат', 'келүү'], correct: 0,
    explain: { ky: '-ди мүчөсү өткөн чакты билдирет.', ru: 'Аффикс -ди указывает на прошедшее время.', en: 'The suffix -ди marks the past tense.' }
  },
  {
    id: 'k09', skill: 'numeral', difficulty: 1, type: 'choice',
    prompt: { ky: 'Кайсы сөз сан атооч?', ru: 'Какое слово — числительное?', en: 'Which word is a numeral?' },
    options: ['жети', 'жетим', 'жетти', 'жетик'], correct: 0,
    explain: { ky: '«Жети» — сан, ошондуктан сан атооч.', ru: '«Жети» (семь) — число, значит числительное.', en: '"Жети" (seven) is a number, so a numeral.' }
  },
  {
    id: 'k10', skill: 'numeral', difficulty: 2, type: 'choice',
    prompt: { ky: '«Бешинчи» кайсы сан атоочко кирет?', ru: 'К какому разряду относится «бешинчи»?', en: 'Which type of numeral is "бешинчи"?' },
    options: [
      { ky: 'Ирет сан атооч', ru: 'Порядковое', en: 'Ordinal' },
      { ky: 'Эсептик сан атооч', ru: 'Количественное', en: 'Cardinal' },
      { ky: 'Бөлчөк сан атооч', ru: 'Дробное', en: 'Fractional' },
      { ky: 'Топтоо сан атооч', ru: 'Собирательное', en: 'Collective' }
    ], correct: 0,
    explain: { ky: '-нчы мүчөсү иретти билдирет: бешинчи.', ru: 'Аффикс -нчы указывает на порядок: пятый.', en: 'The suffix -нчы marks order: fifth.' }
  },
  // ─── «Ошибка учителя»: найдите неверный разбор ────────────────────────────
  {
    id: 'k-err-01', skill: 'verb', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: 'Мугалим сөздөрдү сөз түркүмү боюнча талдады. Кайсы сапта ката?', ru: 'Учитель разобрал слова по частям речи. В какой строке ошибка?', en: 'The teacher labelled the parts of speech. Which line is wrong?' },
    options: [
      { ky: 'китеп — зат атооч', ru: 'китеп (книга) — существительное', en: 'китеп (book) — noun' },
      { ky: 'кызыл — сын атооч', ru: 'кызыл (красный) — прилагательное', en: 'кызыл (red) — adjective' },
      { ky: 'жазды — сан атооч', ru: 'жазды (написал) — числительное', en: 'жазды (wrote) — numeral' },
      { ky: 'беш — сан атооч', ru: 'беш (пять) — числительное', en: 'беш (five) — numeral' }
    ],
    correct: 2,
    explain: { ky: '«Жазды» — эмне кылды? деген суроого жооп берет, демек этиш.', ru: '«Жазды» отвечает на вопрос «что сделал?» — это глагол.', en: '"Жазды" answers "what did it do?" — it is a verb.' }
  },
  {
    id: 'k-err-02', skill: 'noun', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: 'Сөз түркүмдөрүнүн талдоосу. Ката кайсы сапта?', ru: 'Разбор частей речи. Где ошибка?', en: 'Parts of speech. Where is the mistake?' },
    options: [
      { ky: 'ак — сын атооч', ru: 'ак (белый) — прилагательное', en: 'ак (white) — adjective' },
      { ky: 'бийик — сын атооч', ru: 'бийик (высокий) — прилагательное', en: 'бийик (tall) — adjective' },
      { ky: 'тоо — сын атооч', ru: 'тоо (гора) — прилагательное', en: 'тоо (mountain) — adjective' },
      { ky: 'чуркады — этиш', ru: 'чуркады (побежал) — глагол', en: 'чуркады (ran) — verb' }
    ],
    correct: 2,
    explain: { ky: '«Тоо» — эмне? деген суроого жооп берет, демек зат атооч.', ru: '«Тоо» отвечает на вопрос «что?» — это существительное.', en: '"Тоо" answers "what?" — it is a noun.' }
  },
  {
    id: 'k-err-03', skill: 'numeral', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: 'Мугалим сан атоочторду тандады. Кайсы сапта ката?', ru: 'Учитель выписал числительные. В какой строке ошибка?', en: 'The teacher listed numerals. Which line is wrong?' },
    options: [
      { ky: 'он — сан атооч', ru: 'он (десять) — числительное', en: 'он (ten) — numeral' },
      { ky: 'биринчи — сан атооч', ru: 'биринчи (первый) — числительное', en: 'биринчи (first) — numeral' },
      { ky: 'окуучу — сан атооч', ru: 'окуучу (ученик) — числительное', en: 'окуучу (pupil) — numeral' },
      { ky: 'жети — сан атооч', ru: 'жети (семь) — числительное', en: 'жети (seven) — numeral' }
    ],
    correct: 2,
    explain: { ky: '«Окуучу» — ким? деген суроого жооп берет, демек зат атооч.', ru: '«Окуучу» отвечает на вопрос «кто?» — это существительное.', en: '"Окуучу" answers "who?" — it is a noun.' }
  },
  {
    id: "k40", skill: "noun", difficulty: 1, type: "choice",
    prompt: {"ky": "Кайсы сөз көптүк санда турат?", "ru": "Какое слово стоит во множественном числе?", "en": "Which word is plural?"},
    options: [
      "китептер",
      "китеп",
      "китепке",
      "китептин"
    ], correct: 0,
    explain: {"ky": "-тер мүчөсү көптүктү билдирет: китеп → китептер.", "ru": "Окончание -тер обозначает множественное число: китеп → китептер.", "en": "The ending -тер makes a plural: китеп → китептер."}
  },
  {
    id: "k41", skill: "adjective", difficulty: 2, type: "choice",
    prompt: {"ky": "«Бийик тоо» сөз айкашындагы сын атооч кайсы?", "ru": "Какое слово — прилагательное в сочетании «бийик тоо»?", "en": "Which word is the adjective in «бийик тоо» (high mountain)?"},
    options: [
      "бийик",
      "тоо",
      {"ky": "экөө тең", "ru": "оба слова", "en": "both words"},
      {"ky": "бири да эмес", "ru": "ни одно", "en": "neither"}
    ], correct: 0,
    explain: {"ky": "Бийик — тоонун белгиси, «кандай?» суроосуна жооп берет.", "ru": "«Бийик» — признак горы, отвечает на вопрос «кандай?».", "en": "«Бийик» describes the mountain and answers «кандай?» (what kind?)."}
  },
  {
    id: "k42", skill: "verb", difficulty: 2, type: "choice",
    prompt: {"ky": "Буйрук ыңгайдагы этиш кайсы?", "ru": "Какой глагол стоит в повелительном наклонении?", "en": "Which verb is in the imperative?"},
    options: [
      "жаз",
      "жазды",
      "жазат",
      "жазган"
    ], correct: 0,
    explain: {"ky": "«Жаз!» — буйрук: этиштин уңгусу эч мүчөсүз.", "ru": "«Жаз!» — приказ: основа глагола без окончаний.", "en": "«Жаз!» is a command: the bare verb stem."}
  },
  {
    id: "k43", skill: "numeral", difficulty: 2, type: "choice",
    prompt: {"ky": "«Экөө» сан атоочтун кайсы түрүнө кирет?", "ru": "К какому разряду относится числительное «экөө» (двое)?", "en": "What kind of numeral is «экөө» (the two of them)?"},
    options: [
      {"ky": "Жамдама", "ru": "Собирательное", "en": "Collective"},
      {"ky": "Эсептик", "ru": "Количественное", "en": "Cardinal"},
      {"ky": "Иреттик", "ru": "Порядковое", "en": "Ordinal"},
      {"ky": "Бөлчөк", "ru": "Дробное", "en": "Fractional"}
    ], correct: 0,
    explain: {"ky": "Экөө, үчөө, бешөө — жамдама сан атоочтор.", "ru": "Экөө, үчөө, бешөө — собирательные числительные.", "en": "Экөө, үчөө, бешөө are collective numerals."}
  },
  {
    id: "k44", skill: "numeral", difficulty: 2, type: "choice",
    prompt: {"ky": "«Үчүнчү» сөзүнүн уңгусу кайсы?", "ru": "Какой корень у слова «үчүнчү» (третий)?", "en": "What is the root of «үчүнчү» (third)?"},
    options: [
      "үч",
      "үчүн",
      "-үнчү",
      "үчүнчү"
    ], correct: 0,
    explain: {"ky": "Уңгу — үч, ал эми -үнчү — иреттик сан атоочтун мүчөсү.", "ru": "Корень — «үч», а -үнчү — окончание порядкового числительного.", "en": "The root is «үч»; -үнчү is the ordinal ending."}
  },
  {
    id: "k45", skill: "noun", difficulty: 2, type: "choice",
    prompt: {"ky": "Кайсы сөз энчилүү зат атооч?", "ru": "Какое слово — имя собственное?", "en": "Which word is a proper noun?"},
    options: [
      "Бишкек",
      "шаар",
      "тоо",
      "дарыя"
    ], correct: 0,
    explain: {"ky": "Энчилүү аттар бир гана нерсени атайт жана чоң тамга менен жазылат.", "ru": "Имена собственные называют единственный предмет и пишутся с большой буквы.", "en": "Proper nouns name one particular thing and start with a capital letter."}
  },
  {
    id: "k46", skill: "adjective", difficulty: 3, type: "choice",
    prompt: {"ky": "«Сулуураак» — сын атоочтун кайсы даражасы?", "ru": "Какая степень прилагательного в слове «сулуураак» (красивее)?", "en": "Which degree of the adjective is «сулуураак» (more beautiful)?"},
    options: [
      {"ky": "Салыштырма даража", "ru": "Сравнительная степень", "en": "Comparative"},
      {"ky": "Күчөтмө даража", "ru": "Превосходная (усилительная) степень", "en": "Superlative"},
      {"ky": "Жай даража", "ru": "Положительная степень", "en": "Positive"},
      {"ky": "Басаңдатма даража", "ru": "Ослабительная степень", "en": "Diminutive"}
    ], correct: 0,
    explain: {"ky": "-раак/-рээк мүчөсү салыштырма даражаны түзөт.", "ru": "Окончание -раак/-рээк образует сравнительную степень.", "en": "The ending -раак/-рээк forms the comparative."}
  }
];
