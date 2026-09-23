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
  }
];
