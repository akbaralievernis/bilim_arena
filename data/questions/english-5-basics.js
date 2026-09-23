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
  }
];
