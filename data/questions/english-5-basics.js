/** English, 5-класс — Everyday words */
export default [
  {
    id: 'e01', skill: 'animals', difficulty: 1, type: 'choice',
    prompt: { ky: '«Мышык» англисче кандай?', ru: 'Как по-английски «кошка»?', en: 'How do you say "кошка" in English?' },
    options: ['cat', 'dog', 'cow', 'fox'], correct: 0,
    explain: { ky: 'cat — мышык', ru: 'cat — кошка', en: 'cat = мышык / кошка' }
  },
  {
    id: 'e02', skill: 'animals', difficulty: 1, type: 'choice',
    prompt: { ky: '«Eagle» деген эмне?', ru: 'Что означает «eagle»?', en: 'What does "eagle" mean?' },
    options: [
      { ky: 'Бүркүт', ru: 'Орёл', en: 'A large bird of prey' },
      { ky: 'Тоок', ru: 'Курица', en: 'A chicken' },
      { ky: 'Балык', ru: 'Рыба', en: 'A fish' },
      { ky: 'Коён', ru: 'Заяц', en: 'A rabbit' }
    ], correct: 0,
    explain: { ky: 'eagle — бүркүт', ru: 'eagle — орёл', en: 'An eagle is a large bird of prey.' }
  },
  {
    id: 'e03', skill: 'animals', difficulty: 2, type: 'choice',
    prompt: { ky: '«Horse» сөзүнүн котормосу', ru: 'Перевод слова «horse»', en: 'Translate "horse"' },
    options: [
      { ky: 'Ат', ru: 'Лошадь', en: 'A riding animal' },
      { ky: 'Уй', ru: 'Корова', en: 'A cow' },
      { ky: 'Кой', ru: 'Овца', en: 'A sheep' },
      { ky: 'Төө', ru: 'Верблюд', en: 'A camel' }
    ], correct: 0,
    explain: { ky: 'horse — ат', ru: 'horse — лошадь', en: 'A horse is a riding animal.' }
  },
  {
    id: 'e04', skill: 'food', difficulty: 1, type: 'choice',
    prompt: { ky: '«Нан» англисче кандай?', ru: 'Как по-английски «хлеб»?', en: 'How do you say "хлеб" in English?' },
    options: ['bread', 'milk', 'meat', 'water'], correct: 0,
    explain: { ky: 'bread — нан', ru: 'bread — хлеб', en: 'bread = нан / хлеб' }
  },
  {
    id: 'e05', skill: 'food', difficulty: 1, type: 'choice',
    prompt: { ky: '«Apple» — бул кайсы мөмө?', ru: '«Apple» — это какой фрукт?', en: 'What fruit is an "apple"?' },
    options: [
      { ky: 'Алма', ru: 'Яблоко', en: 'A round red or green fruit' },
      { ky: 'Алмурут', ru: 'Груша', en: 'A pear' },
      { ky: 'Жүзүм', ru: 'Виноград', en: 'Grapes' },
      { ky: 'Дарбыз', ru: 'Арбуз', en: 'A watermelon' }
    ], correct: 0,
    explain: { ky: 'apple — алма', ru: 'apple — яблоко', en: 'An apple is a round fruit.' }
  },
  {
    id: 'e06', skill: 'food', difficulty: 2, type: 'choice',
    prompt: { ky: '«Суу» англисче кандай?', ru: 'Как по-английски «вода»?', en: 'How do you say "вода" in English?' },
    options: ['water', 'winter', 'weather', 'wonder'], correct: 0,
    explain: { ky: 'water — суу', ru: 'water — вода', en: 'water = суу / вода' }
  },
  {
    id: 'e07', skill: 'school', difficulty: 1, type: 'choice',
    prompt: { ky: '«Китеп» англисче кандай?', ru: 'Как по-английски «книга»?', en: 'How do you say "книга" in English?' },
    options: ['book', 'pen', 'desk', 'bag'], correct: 0,
    explain: { ky: 'book — китеп', ru: 'book — книга', en: 'book = китеп / книга' }
  },
  {
    id: 'e08', skill: 'school', difficulty: 2, type: 'choice',
    prompt: { ky: '«Teacher» деген ким?', ru: 'Кто такой «teacher»?', en: 'Who is a "teacher"?' },
    options: [
      { ky: 'Мугалим', ru: 'Учитель', en: 'A person who teaches' },
      { ky: 'Окуучу', ru: 'Ученик', en: 'A person who studies' },
      { ky: 'Дарыгер', ru: 'Врач', en: 'A doctor' },
      { ky: 'Айдоочу', ru: 'Водитель', en: 'A driver' }
    ], correct: 0,
    explain: { ky: 'teacher — мугалим', ru: 'teacher — учитель', en: 'A teacher teaches students.' }
  },
  {
    id: 'e09', skill: 'verbs', difficulty: 1, type: 'choice',
    prompt: { ky: '«Окуу» этишинин англисчеси', ru: 'Английский глагол «читать»', en: 'The verb for "читать"' },
    options: ['to read', 'to write', 'to run', 'to sleep'], correct: 0,
    explain: { ky: 'to read — окуу', ru: 'to read — читать', en: 'to read = окуу / читать' }
  },
  {
    id: 'e10', skill: 'verbs', difficulty: 2, type: 'choice',
    prompt: { ky: '«I ___ to school every day» — кайсы сөз туура келет?', ru: '«I ___ to school every day» — какое слово подходит?', en: 'Complete: "I ___ to school every day"' },
    options: ['go', 'goes', 'going', 'gone'], correct: 0,
    explain: {
      ky: 'I менен этиштин негизги формасы колдонулат: I go.',
      ru: 'С «I» используется начальная форма глагола: I go.',
      en: 'With "I" we use the base form: I go.'
    }
  },
  // ─── «Ошибка учителя»: найдите предложение с ошибкой ──────────────────────
  {
    id: 'e-err-01', skill: 'animals', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: 'Мугалим ит жөнүндө текст жазды. Кайсы сүйлөмдө ката бар?', ru: 'Учитель написал текст о собаке. В каком предложении ошибка?', en: 'The teacher wrote about a dog. Which sentence has a mistake?' },
    options: ['I have a dog.', 'My dog is big.', 'It like bones.', 'We play in the park.'],
    correct: 2,
    explain: { ky: 'he / she / it менен этишке -s кошулат: It likes bones.', ru: 'С he / she / it к глаголу добавляется -s: It likes bones.', en: 'With he / she / it the verb takes -s: It likes bones.' }
  },
  {
    id: 'e-err-02', skill: 'school', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: 'Мектеп жөнүндө текст. Ката кайсы сүйлөмдө?', ru: 'Текст о школе. В каком предложении ошибка?', en: 'A text about school. Which sentence is wrong?' },
    options: ['This is my school.', 'There are many classroom.', 'My teacher is kind.'],
    correct: 1,
    explain: { ky: 'many дегенден кийин көптүк сан керек: many classrooms.', ru: 'После many нужно множественное число: many classrooms.', en: 'After "many" use the plural: many classrooms.' }
  },
  {
    id: 'e-err-03', skill: 'food', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: 'Тамак-аш жөнүндө текст. Кайсы сүйлөмдө ката бар?', ru: 'Текст о еде. В каком предложении ошибка?', en: 'A text about food. Which sentence has a mistake?' },
    options: ['I like apples.', 'She eat an apple every day.', 'Bananas are yellow.'],
    correct: 1,
    explain: { ky: 'She менен этишке -s кошулат: She eats an apple every day.', ru: 'С she глагол получает -s: She eats an apple every day.', en: 'With "she" the verb takes -s: She eats an apple every day.' }
  },
  {
    id: 'e-err-04', skill: 'verbs', difficulty: 3, type: 'choice', errorHunt: true,
    prompt: { ky: 'Мугалим ар кандай чактагы сүйлөмдөрдү жазды. Ката кайсында?', ru: 'Учитель написал предложения о разном времени. Где ошибка?', en: 'The teacher wrote sentences about different times. Where is the mistake?' },
    options: ['Every day I go to school.', 'Yesterday I go to the park.', 'Tomorrow I will read a book.'],
    correct: 1,
    explain: { ky: 'Yesterday — өткөн чак: Yesterday I went to the park.', ru: 'Yesterday — прошедшее время: Yesterday I went to the park.', en: '"Yesterday" needs the past tense: Yesterday I went to the park.' }
  },
  {
    id: "e31", skill: "food", difficulty: 1, type: "choice",
    prompt: {"ky": "«Milk» деген эмне?", "ru": "Что означает «milk»?", "en": "What does \"milk\" mean?"},
    options: [
      {"ky": "Сүт", "ru": "Молоко", "en": "A white drink from cows"},
      {"ky": "Суу", "ru": "Вода", "en": "Water"},
      {"ky": "Чай", "ru": "Чай", "en": "Tea"},
      {"ky": "Ширин суусундук", "ru": "Сок", "en": "Juice"}
    ], correct: 0,
    explain: {"ky": "milk — сүт", "ru": "milk — молоко", "en": "Milk is a white drink we get from cows."}
  },
  {
    id: "e40", skill: "animals", difficulty: 1, type: "choice",
    prompt: {"ky": "«Ит» англисче кандай?", "ru": "Как по-английски «собака»?", "en": "How do you say \"ит / собака\" in English?"},
    options: [
      "dog",
      "cat",
      "cow",
      "fox"
    ], correct: 0,
    explain: {"ky": "dog — ит", "ru": "dog — собака", "en": "dog = ит / собака"}
  },
  {
    id: "e41", skill: "food", difficulty: 2, type: "choice",
    prompt: {"ky": "«Egg» деген эмне?", "ru": "Что означает «egg»?", "en": "What does \"egg\" mean?"},
    options: [
      {"ky": "Жумуртка", "ru": "Яйцо", "en": "Something a hen lays"},
      {"ky": "Сүт", "ru": "Молоко", "en": "Milk"},
      {"ky": "Нан", "ru": "Хлеб", "en": "Bread"},
      {"ky": "Алма", "ru": "Яблоко", "en": "An apple"}
    ], correct: 0,
    explain: {"ky": "egg — жумуртка", "ru": "egg — яйцо", "en": "An egg is laid by a hen."}
  },
  {
    id: "e42", skill: "school", difficulty: 1, type: "choice",
    prompt: {"ky": "«Парта» англисче кандай?", "ru": "Как по-английски «парта»?", "en": "How do you say \"парта\" (a school desk) in English?"},
    options: [
      "desk",
      "chair",
      "board",
      "door"
    ], correct: 0,
    explain: {"ky": "desk — парта", "ru": "desk — парта", "en": "desk = парта"}
  },
  {
    id: "e43", skill: "verbs", difficulty: 1, type: "choice",
    prompt: {"ky": "«Жазуу» англисче кандай?", "ru": "Как по-английски «писать»?", "en": "How do you say \"жазуу / писать\" in English?"},
    options: [
      "write",
      "read",
      "run",
      "swim"
    ], correct: 0,
    explain: {"ky": "write — жазуу", "ru": "write — писать", "en": "write = жазуу / писать"}
  },
  {
    id: "e44", skill: "verbs", difficulty: 2, type: "choice",
    prompt: {"ky": "Туура сөздү тандаңыз: «She ___ English.»", "ru": "Выберите правильное слово: «She ___ English.»", "en": "Choose the right word: \"She ___ English.\""},
    options: [
      "speaks",
      "speak",
      "speaking",
      "to speak"
    ], correct: 0,
    explain: {"ky": "He/she/it менен учур чакта этишке -s кошулат: speaks.", "ru": "С he/she/it в настоящем времени к глаголу добавляется -s: speaks.", "en": "With he/she/it the present simple adds -s: speaks."}
  }
];
