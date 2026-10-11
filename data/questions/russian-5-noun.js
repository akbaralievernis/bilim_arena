/** Орус тили, 5-класс — Зат атооч жана жазуу эрежелери / Имя существительное и орфография */
const L = (ky, ru, en) => ({ ky, ru, en });

export default [
  {
    id: 'ru01', skill: 'gender', difficulty: 1, type: 'choice',
    prompt: L('«Тетрадь» сөзүнүн жынысы кандай?', 'Какого рода слово «тетрадь»?', 'What gender is the word «тетрадь»?'),
    options: [L('Аялдык', 'Женского', 'Feminine'), L('Эркектик', 'Мужского', 'Masculine'), L('Орто', 'Среднего', 'Neuter')], correct: 0,
    explain: L('Моя тетрадь — аялдык жыныс.', 'Моя тетрадь — женский род.', '«Моя тетрадь» — feminine.')
  },
  {
    id: 'ru02', skill: 'gender', difficulty: 2, type: 'choice',
    prompt: L('«Кофе» сөзүнүн жынысы кандай?', 'Какого рода слово «кофе»?', 'What gender is the word «кофе»?'),
    options: [L('Эркектик', 'Мужского', 'Masculine'), L('Орто', 'Среднего', 'Neuter'), L('Аялдык', 'Женского', 'Feminine')], correct: 0,
    explain: L('Туура: «горячий кофе» — эркектик жыныс.', 'Правильно: «горячий кофе» — мужской род.', 'Correct usage: «горячий кофе» — masculine.')
  },
  {
    id: 'ru03', skill: 'cases', difficulty: 1, type: 'input', numeric: true,
    prompt: L('Орус тилинде канча жөндөмө (падеж) бар?', 'Сколько падежей в русском языке?', 'How many cases are there in Russian?'),
    answer: ['6'],
    explain: L('Именительный, родительный, дательный, винительный, творительный, предложный — 6.', 'Именительный, родительный, дательный, винительный, творительный, предложный — 6.', 'Six: nominative, genitive, dative, accusative, instrumental, prepositional.')
  },
  {
    id: 'ru04', skill: 'cases', difficulty: 2, type: 'choice',
    prompt: L('Родительный падеж кайсы суроолорго жооп берет?', 'На какие вопросы отвечает родительный падеж?', 'Which questions does the genitive case answer?'),
    options: ['кого? чего?', 'кому? чему?', 'кем? чем?', 'о ком? о чём?'], correct: 0,
    explain: L('Родительный: нет (кого? чего?) — книги.', 'Родительный: нет (кого? чего?) — книги.', 'Genitive: нет (кого? чего?) — книги.')
  },
  {
    id: 'ru05', skill: 'cases', difficulty: 3, type: 'match',
    prompt: L('Падежди анын суроосу менен жупташтырыңыз', 'Соедините падеж с его вопросом', 'Match each case with its question'),
    pairs: [['Дательный', 'кому? чему?'], ['Творительный', 'кем? чем?'], ['Предложный', 'о ком? о чём?']],
    explain: L('Дательный — кому? чему?; творительный — кем? чем?; предложный — о ком? о чём?', 'Дательный — кому? чему?; творительный — кем? чем?; предложный — о ком? о чём?', 'Dative — кому? чему?; instrumental — кем? чем?; prepositional — о ком? о чём?')
  },
  {
    id: 'ru06', skill: 'spelling', difficulty: 1, type: 'choice',
    prompt: L('Кайсы сөз туура жазылган?', 'Какое слово написано правильно?', 'Which word is spelled correctly?'),
    options: ['машина', 'машына', 'мащина', 'машинна'], correct: 0,
    explain: L('Эреже: жи-ши «и» менен жазылат.', 'Правило: жи-ши пиши с буквой «и».', 'Rule: жи and ши are written with «и».')
  },
  {
    id: 'ru07', skill: 'spelling', difficulty: 2, type: 'choice',
    prompt: L('Кайсы сөздүн аягында ь жазылат?', 'В каком слове на конце пишется ь?', 'Which word ends with a soft sign ь?'),
    options: ['ночь', 'ключ', 'врач', 'мяч'], correct: 0,
    explain: L('Ысчуу тыбыштан кийин аялдык жыныстагы сөздөрдө ь жазылат: ночь. Эркектик жыныста — жок: ключ, врач.', 'После шипящих у существительных женского рода пишется ь (ночь), у мужского — нет (ключ, врач).', 'After hushing consonants, feminine nouns take ь (ночь); masculine ones do not (ключ, врач).')
  },
  {
    id: 'ru08', skill: 'spelling', difficulty: 2, type: 'input',
    prompt: L('Тамгасы түшүп калган: «в_да». Кайсы тамга жазылат? (о же а)', 'Вставьте букву: «в_да» (о или а)', 'Fill in the letter: «в_да» (о or а)'),
    answer: ['о', 'o'],
    explain: L('Текшерүү сөзү: «воды» — басым о тамгасына түшөт.', 'Проверочное слово: «воды» — под ударением «о».', 'Check word «воды» has a stressed «о».')
  },
  {
    id: 'ru09', skill: 'spelling', difficulty: 3, type: 'choice',
    prompt: L('«Подводный» сөзүнүн уңгусу кайсы?', 'Какой корень в слове «подводный»?', 'What is the root of «подводный»?'),
    options: ['вод', 'под', 'подвод', 'водн'], correct: 0,
    explain: L('под- — приставка, -вод- — уңгу, -н- — суффикс, -ый — мүчө.', 'под- — приставка, -вод- — корень, -н- — суффикс, -ый — окончание.', 'под- prefix, -вод- root, -н- suffix, -ый ending.')
  },
  {
    id: 'ru-err-01', skill: 'spelling', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: L('Мугалим текст жазды. Кайсы сүйлөмдө ката бар?', 'Учитель написал текст. В каком предложении ошибка?', 'The teacher wrote a text. Which sentence has a mistake?'),
    options: ['Мы живём в Бишкеке.', 'Летом я читал много книг.', 'У нас в классе тридцать учеников.', 'Мама купила вкусную пищю.'],
    correct: 3,
    explain: L('чу-щу «у» менен жазылат: пищу.', 'Правило: чу-щу пиши с буквой «у» — пищу.', 'Rule: чу/щу are written with «у» — пищу.')
  },
  {
    id: 'ru-err-02', skill: 'gender', difficulty: 3, type: 'choice', errorHunt: true,
    prompt: L('Сын атооч менен зат атоочтун айкашы. Кайсы сапта ката?', 'Сочетания прилагательных с существительными. Где ошибка?', 'Adjective + noun pairs. Where is the mistake?'),
    options: ['новая тетрадь', 'горячий кофе', 'большое окно', 'красивый площадь'],
    correct: 3,
    explain: L('«Площадь» — аялдык жыныс: красивая площадь.', '«Площадь» — женского рода: красивая площадь.', '«Площадь» is feminine: красивая площадь.')
  },
  {
    id: "ru30", skill: "gender", difficulty: 1, type: "choice",
    prompt: {"ky": "«Окно» сөзүнүн тегин аныктаңыз", "ru": "Определите род слова «окно»", "en": "What is the gender of the Russian word «окно» (window)?"},
    options: [
      {"ky": "Орто тек", "ru": "Средний род", "en": "Neuter"},
      {"ky": "Эркек тек", "ru": "Мужской род", "en": "Masculine"},
      {"ky": "Аял тек", "ru": "Женский род", "en": "Feminine"},
      {"ky": "Жалпы тек", "ru": "Общий род", "en": "Common"}
    ], correct: 0,
    explain: {"ky": "Окно — оно, мое: орто тек.", "ru": "Окно — оно, моё: средний род.", "en": "«Окно» — «оно, моё»: neuter."}
  },
  {
    id: "ru31", skill: "gender", difficulty: 1, type: "choice",
    prompt: {"ky": "«Ночь» сөзүнүн теги кайсы?", "ru": "Какого рода слово «ночь»?", "en": "What is the gender of «ночь» (night)?"},
    options: [
      {"ky": "Аял тек", "ru": "Женский род", "en": "Feminine"},
      {"ky": "Эркек тек", "ru": "Мужской род", "en": "Masculine"},
      {"ky": "Орто тек", "ru": "Средний род", "en": "Neuter"},
      {"ky": "Жалпы тек", "ru": "Общий род", "en": "Common"}
    ], correct: 0,
    explain: {"ky": "Ночь — она, моя: аял тек.", "ru": "Ночь — она, моя: женский род.", "en": "«Ночь» — «она, моя»: feminine."}
  },
  {
    id: "ru32", skill: "gender", difficulty: 2, type: "choice",
    prompt: {"ky": "«Кофе» сөзүнүн теги кайсы?", "ru": "Какого рода слово «кофе»?", "en": "What is the gender of «кофе» (coffee)?"},
    options: [
      {"ky": "Эркек тек", "ru": "Мужской род", "en": "Masculine"},
      {"ky": "Орто тек", "ru": "Средний род", "en": "Neuter"},
      {"ky": "Аял тек", "ru": "Женский род", "en": "Feminine"},
      {"ky": "Жалпы тек", "ru": "Общий род", "en": "Common"}
    ], correct: 0,
    explain: {"ky": "Кофе — он, мой: эркек тек (бул эрежеден тышкары сөз).", "ru": "Кофе — он, мой: мужской род (слово-исключение).", "en": "«Кофе» is masculine: «он, мой» — an exception worth remembering."}
  },
  {
    id: "ru33", skill: "cases", difficulty: 1, type: "choice",
    prompt: {"ky": "«Кого? Что?» суроосу кайсы жөндөмөнүкү?", "ru": "Какому падежу соответствует вопрос «Кого? Что?»?", "en": "Which case answers the questions «Кого? Что?» (whom? what?)?"},
    options: [
      {"ky": "Винительный", "ru": "Винительный", "en": "Accusative"},
      {"ky": "Родительный", "ru": "Родительный", "en": "Genitive"},
      {"ky": "Дательный", "ru": "Дательный", "en": "Dative"},
      {"ky": "Предложный", "ru": "Предложный", "en": "Prepositional"}
    ], correct: 0,
    explain: {"ky": "Вижу (кого? что?) — винительный.", "ru": "Вижу (кого? что?) — винительный падеж.", "en": "«Вижу (кого? что?)» — accusative."}
  },
  {
    id: "ru34", skill: "cases", difficulty: 2, type: "choice",
    prompt: {"ky": "«О книге» — «книге» сөзү кайсы жөндөмөдө?", "ru": "В каком падеже слово «книге» в сочетании «о книге»?", "en": "Which case is «книге» in the phrase «о книге» (about the book)?"},
    options: [
      {"ky": "Предложный", "ru": "Предложный", "en": "Prepositional"},
      {"ky": "Дательный", "ru": "Дательный", "en": "Dative"},
      {"ky": "Творительный", "ru": "Творительный", "en": "Instrumental"},
      {"ky": "Родительный", "ru": "Родительный", "en": "Genitive"}
    ], correct: 0,
    explain: {"ky": "Предлог «о» + (о ком? о чём?) — предложный.", "ru": "Предлог «о» + (о ком? о чём?) — предложный падеж.", "en": "The preposition «о» with «о ком? о чём?» — prepositional."}
  },
  {
    id: "ru35", skill: "cases", difficulty: 2, type: "choice",
    prompt: {"ky": "«Без сахара» — «сахара» сөзү кайсы жөндөмөдө?", "ru": "В каком падеже слово «сахара» в сочетании «без сахара»?", "en": "Which case is «сахара» in «без сахара» (without sugar)?"},
    options: [
      {"ky": "Родительный", "ru": "Родительный", "en": "Genitive"},
      {"ky": "Винительный", "ru": "Винительный", "en": "Accusative"},
      {"ky": "Дательный", "ru": "Дательный", "en": "Dative"},
      {"ky": "Творительный", "ru": "Творительный", "en": "Instrumental"}
    ], correct: 0,
    explain: {"ky": "«Без» (кого? чего?) — родительный.", "ru": "«Без» (кого? чего?) — родительный падеж.", "en": "«Без» with «кого? чего?» — genitive."}
  },
  {
    id: "ru36", skill: "spelling", difficulty: 1, type: "choice",
    prompt: {"ky": "Кайсы сөз туура жазылган?", "ru": "Какое слово написано правильно?", "en": "Which word is spelled correctly?"},
    options: [
      "жираф",
      "жыраф",
      "жирафф",
      "жераф"
    ], correct: 0,
    explain: {"ky": "ЖИ — И тамгасы менен жазылат: жираф.", "ru": "ЖИ пиши с буквой И: жираф.", "en": "In Russian «жи» is always written with «и»: «жираф»."}
  },
  {
    id: "ru37", skill: "spelling", difficulty: 2, type: "choice",
    prompt: {"ky": "Кайсы сөздүн аягында жумшартуу белгиси (ь) жазылат?", "ru": "В каком слове на конце пишется мягкий знак?", "en": "Which word ends with a soft sign (ь)?"},
    options: [
      {"ky": "ноч_ (түн)", "ru": "ноч_", "en": "ноч_ (night)"},
      {"ky": "мяч_ (топ)", "ru": "мяч_", "en": "мяч_ (ball)"},
      {"ky": "врач_ (дарыгер)", "ru": "врач_", "en": "врач_ (doctor)"},
      {"ky": "ключ_ (ачкыч)", "ru": "ключ_", "en": "ключ_ (key)"}
    ], correct: 0,
    explain: {"ky": "Аял тектеги сөз ч, щ, ш, ж менен бүтсө, ь жазылат: ночь. Эркек тектегилерде — жок.", "ru": "У существительных женского рода на шипящий пишется ь: ночь. У мужского рода — нет.", "en": "Feminine nouns ending in a hushing sound take ь («ночь»); masculine ones do not."}
  },
  {
    id: "ru38", skill: "spelling", difficulty: 2, type: "choice",
    prompt: {"ky": "Туура жазылышын тандаңыз", "ru": "Выберите правильное написание", "en": "Choose the correct spelling"},
    options: [
      "чудо",
      "чюдо",
      "чьудо",
      "чуда"
    ], correct: 0,
    explain: {"ky": "ЧУ — У тамгасы менен: чудо.", "ru": "ЧУ пиши с буквой У: чудо.", "en": "In Russian «чу» is written with «у»: «чудо»."}
  }
];
