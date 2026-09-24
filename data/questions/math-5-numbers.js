/** Математика, 5-класс — Натурал сандар менен амалдар */
export default [
  {
    id: 'm5-01', skill: 'add-sub', difficulty: 1, type: 'input', numeric: true,
    prompt: { ky: '348 + 257 = ?', ru: '348 + 257 = ?', en: '348 + 257 = ?' },
    answer: ['605'],
    explain: { ky: '348 + 257 = 605 (8 + 7 = 15, 1ди эске сактайбыз).', ru: '348 + 257 = 605 (8 + 7 = 15, 1 запоминаем).', en: '348 + 257 = 605 (8 + 7 = 15, carry the 1).' }
  },
  {
    id: 'm5-02', skill: 'add-sub', difficulty: 1, type: 'input', numeric: true,
    prompt: { ky: '1000 − 364 = ?', ru: '1000 − 364 = ?', en: '1000 − 364 = ?' },
    answer: ['636'],
    explain: { ky: '364 + 636 = 1000 — текшерүү кошуу менен.', ru: 'Проверка сложением: 364 + 636 = 1000.', en: 'Check by adding: 364 + 636 = 1000.' }
  },
  {
    id: 'm5-03', skill: 'add-sub', difficulty: 2, type: 'input', numeric: true,
    prompt: { ky: '4507 − 2918 = ?', ru: '4507 − 2918 = ?', en: '4507 − 2918 = ?' },
    answer: ['1589'],
    explain: { ky: '4507 − 2918 = 1589. Текшерүү: 1589 + 2918 = 4507.', ru: '4507 − 2918 = 1589. Проверка: 1589 + 2918 = 4507.', en: '4507 − 2918 = 1589. Check: 1589 + 2918 = 4507.' }
  },
  {
    id: 'm5-04', skill: 'mul-div', difficulty: 1, type: 'input', numeric: true,
    prompt: { ky: '25 × 4 = ?', ru: '25 × 4 = ?', en: '25 × 4 = ?' },
    answer: ['100'],
    explain: { ky: '25 × 4 = 100 — муну жатка билүү пайдалуу.', ru: '25 × 4 = 100 — это полезно знать наизусть.', en: '25 × 4 = 100 — worth knowing by heart.' }
  },
  {
    id: 'm5-05', skill: 'mul-div', difficulty: 2, type: 'input', numeric: true,
    prompt: { ky: '36 × 15 = ?', ru: '36 × 15 = ?', en: '36 × 15 = ?' },
    answer: ['540'],
    explain: { ky: '36 × 10 = 360, 36 × 5 = 180, 360 + 180 = 540.', ru: '36 × 10 = 360, 36 × 5 = 180, 360 + 180 = 540.', en: '36 × 10 = 360, 36 × 5 = 180, 360 + 180 = 540.' }
  },
  {
    id: 'm5-06', skill: 'mul-div', difficulty: 2, type: 'input', numeric: true,
    prompt: { ky: '864 : 8 = ?', ru: '864 : 8 = ?', en: '864 ÷ 8 = ?' },
    answer: ['108'],
    explain: { ky: '8 × 108 = 864.', ru: '8 × 108 = 864.', en: '8 × 108 = 864.' }
  },
  {
    id: 'm5-07', skill: 'mul-div', difficulty: 3, type: 'input', numeric: true,
    prompt: { ky: '1248 : 24 = ?', ru: '1248 : 24 = ?', en: '1248 ÷ 24 = ?' },
    answer: ['52'],
    explain: { ky: '24 × 50 = 1200, калганы 48 = 24 × 2, демек 52.', ru: '24 × 50 = 1200, остаётся 48 = 24 × 2, значит 52.', en: '24 × 50 = 1200, 48 left = 24 × 2, so 52.' }
  },
  {
    id: 'm5-08', skill: 'order', difficulty: 1, type: 'input', numeric: true,
    prompt: { ky: '2 + 3 × 4 = ?', ru: '2 + 3 × 4 = ?', en: '2 + 3 × 4 = ?' },
    answer: ['14'],
    explain: { ky: 'Адегенде көбөйтүү: 3 × 4 = 12, анан 2 + 12 = 14.', ru: 'Сначала умножение: 3 × 4 = 12, потом 2 + 12 = 14.', en: 'Multiply first: 3 × 4 = 12, then 2 + 12 = 14.' }
  },
  {
    id: 'm5-09', skill: 'order', difficulty: 2, type: 'input', numeric: true,
    prompt: { ky: '(18 − 6) : 3 = ?', ru: '(18 − 6) : 3 = ?', en: '(18 − 6) ÷ 3 = ?' },
    answer: ['4'],
    explain: { ky: 'Кашаа биринчи: 18 − 6 = 12, анан 12 : 3 = 4.', ru: 'Сначала скобки: 18 − 6 = 12, потом 12 : 3 = 4.', en: 'Brackets first: 18 − 6 = 12, then 12 ÷ 3 = 4.' }
  },
  {
    id: 'm5-10', skill: 'order', difficulty: 3, type: 'input', numeric: true,
    prompt: { ky: '50 − 4 × (7 + 3) = ?', ru: '50 − 4 × (7 + 3) = ?', en: '50 − 4 × (7 + 3) = ?' },
    answer: ['10'],
    explain: { ky: '7 + 3 = 10, 4 × 10 = 40, 50 − 40 = 10.', ru: '7 + 3 = 10, 4 × 10 = 40, 50 − 40 = 10.', en: '7 + 3 = 10, 4 × 10 = 40, 50 − 40 = 10.' }
  },
  {
    id: 'm5-11', skill: 'order', difficulty: 2, type: 'input', numeric: true,
    prompt: { ky: '100 : 5 × 2 = ?', ru: '100 : 5 × 2 = ?', en: '100 ÷ 5 × 2 = ?' },
    answer: ['40'],
    explain: { ky: 'Көбөйтүү менен бөлүү солдон оңго: 100 : 5 = 20, 20 × 2 = 40.', ru: 'Умножение и деление — слева направо: 100 : 5 = 20, 20 × 2 = 40.', en: 'Multiply and divide left to right: 100 ÷ 5 = 20, 20 × 2 = 40.' }
  },
  {
    id: 'm5-12', skill: 'word', difficulty: 2, type: 'input', numeric: true,
    prompt: { ky: 'Китепте 120 бет бар. Айбек күнүнө 15 бет окуйт. Ал китепти канча күндө окуп бүтөт?', ru: 'В книге 120 страниц. Айбек читает 15 страниц в день. За сколько дней он прочитает книгу?', en: 'A book has 120 pages. Aibek reads 15 pages a day. How many days will it take him?' },
    answer: ['8'],
    explain: { ky: '120 : 15 = 8 күн.', ru: '120 : 15 = 8 дней.', en: '120 ÷ 15 = 8 days.' }
  },
  {
    id: 'm5-13', skill: 'word', difficulty: 1, type: 'input', numeric: true,
    prompt: { ky: 'Дүкөнгө 6 куту алма келди, ар бир кутуда 24 алма. Бардыгы канча алма?', ru: 'В магазин привезли 6 ящиков, в каждом по 24 яблока. Сколько всего яблок?', en: '6 boxes of apples arrived, 24 apples in each. How many apples in total?' },
    answer: ['144'],
    explain: { ky: '6 × 24 = 144 алма.', ru: '6 × 24 = 144 яблока.', en: '6 × 24 = 144 apples.' }
  },
  {
    id: 'm5-14', skill: 'word', difficulty: 3, type: 'input', numeric: true,
    prompt: { ky: 'Автобус 3 саатта 180 км жол жүрдү. Анын ылдамдыгы саатына канча км?', ru: 'Автобус проехал 180 км за 3 часа. Какова его скорость в км/ч?', en: 'A bus travelled 180 km in 3 hours. What is its speed in km/h?' },
    answer: ['60'],
    explain: { ky: 'Ылдамдык = жол : убакыт = 180 : 3 = 60 км/саат.', ru: 'Скорость = путь : время = 180 : 3 = 60 км/ч.', en: 'Speed = distance ÷ time = 180 ÷ 3 = 60 km/h.' }
  },
  {
    id: 'm5-15', skill: 'order', difficulty: 1, type: 'choice',
    prompt: { ky: '8 + 12 : 4 туюнтмасында кайсы амал биринчи аткарылат?', ru: 'Какое действие выполняется первым в 8 + 12 : 4?', en: 'Which operation comes first in 8 + 12 ÷ 4?' },
    options: [
      { ky: 'Бөлүү', ru: 'Деление', en: 'Division' },
      { ky: 'Кошуу', ru: 'Сложение', en: 'Addition' },
      { ky: 'Солдон оңго тартип менен', ru: 'По порядку слева направо', en: 'Simply left to right' }
    ],
    correct: 0,
    explain: { ky: 'Бөлүү кошуудан мурун: 12 : 4 = 3, 8 + 3 = 11.', ru: 'Деление раньше сложения: 12 : 4 = 3, 8 + 3 = 11.', en: 'Division before addition: 12 ÷ 4 = 3, 8 + 3 = 11.' }
  },
  // ─── «Ошибка учителя» ────────────────────────────────────────────────────
  {
    id: 'm5-err-01', skill: 'order', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: 'Мугалим 20 − 2 × 5 эсептеди. Кайсы сапта ката?', ru: 'Учитель вычислил 20 − 2 × 5. В какой строке ошибка?', en: 'The teacher computed 20 − 2 × 5. Which line is wrong?' },
    options: ['20 − 2 × 5', '= 18 × 5', '= 90'],
    correct: 1,
    explain: { ky: 'Адегенде көбөйтүү: 2 × 5 = 10, анан 20 − 10 = 10.', ru: 'Сначала умножение: 2 × 5 = 10, затем 20 − 10 = 10.', en: 'Multiply first: 2 × 5 = 10, then 20 − 10 = 10.' }
  },
  {
    id: 'm5-err-02', skill: 'mul-div', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: '36 × 15 бөлүктөп эсептелди. Ката кайсы сапта?', ru: '36 × 15 посчитали по частям. Где ошибка?', en: '36 × 15 was computed in parts. Where is the mistake?' },
    options: ['36 × 10 = 360', '36 × 5 = 180', '360 + 180 = 520'],
    correct: 2,
    explain: { ky: '360 + 180 = 540.', ru: '360 + 180 = 540.', en: '360 + 180 = 540.' }
  },
  {
    id: 'm5-sort-01', skill: 'order', difficulty: 2, type: 'sort',
    prompt: { ky: '5 + (8 − 2) × 3 эсептөөнүн кадамдарын иреттеңиз', ru: 'Расставьте шаги вычисления 5 + (8 − 2) × 3', en: 'Order the steps for 5 + (8 − 2) × 3' },
    items: ['8 − 2 = 6', '6 × 3 = 18', '5 + 18 = 23'],
    explain: { ky: 'Кашаа → көбөйтүү → кошуу.', ru: 'Скобки → умножение → сложение.', en: 'Brackets → multiplication → addition.' }
  }
];
