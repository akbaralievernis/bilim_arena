/** Финансылык сабаттуулук, 8-класс — Жеке бюджет жана коопсуздук / Личный бюджет и безопасность */
const L = (ky, ru, en) => ({ ky, ru, en });

export default [
  {
    id: 'fi01', skill: 'budget', difficulty: 1, type: 'choice',
    prompt: L('Бюджет деген эмне?', 'Что такое бюджет?', 'What is a budget?'),
    options: [
      L('Кирешелердин жана чыгымдардын планы', 'План доходов и расходов', 'A plan of income and spending'),
      L('Банктагы акча гана', 'Только деньги в банке', 'Only money in a bank'),
      L('Карыз', 'Долг', 'A debt'),
      L('Айлык', 'Зарплата', 'A salary')
    ], correct: 0,
    explain: L('Бюджет акчаны алдын ала пландоого жардам берет.', 'Бюджет помогает заранее планировать деньги.', 'A budget helps you plan money in advance.')
  },
  {
    id: 'fi02', skill: 'budget', difficulty: 1, type: 'input', numeric: true,
    prompt: L('Үй-бүлөнүн айлык кирешеси 8000 сом, чыгымы 6500 сом. Канча сом калат?', 'Доход семьи за месяц 8000 сомов, расходы 6500 сомов. Сколько остаётся?', 'A family earns 8000 som a month and spends 6500 som. How much is left?'),
    answer: ['1500'],
    explain: L('8000 − 6500 = 1500 сом — муну топтоого болот.', '8000 − 6500 = 1500 сомов — их можно отложить.', '8000 − 6500 = 1500 som, which can be saved.')
  },
  {
    id: 'fi03', skill: 'saving', difficulty: 1, type: 'input', numeric: true,
    prompt: L('Айбек 5000 сомдун 10%ын топтойт. Канча сом топтойт?', 'Айбек откладывает 10% от 5000 сомов. Сколько он откладывает?', 'Aibek saves 10% of 5000 som. How much does he save?'),
    answer: ['500'],
    explain: L('5000 · 0,1 = 500 сом.', '5000 · 0,1 = 500 сомов.', '5000 · 0.1 = 500 som.')
  },
  {
    id: 'fi04', skill: 'budget', difficulty: 2, type: 'choice',
    prompt: L('Кайсынысы муктаждык (зарыл нерсе), каалоо эмес?', 'Что из этого — потребность, а не желание?', 'Which is a need rather than a want?'),
    options: [L('Кышкы бут кийим', 'Зимняя обувь', 'Winter shoes'), L('Жаңы оюн', 'Новая игра', 'A new game'), L('Экинчи телефон', 'Второй телефон', 'A second phone'), L('Таттуу', 'Сладости', 'Sweets')], correct: 0,
    explain: L('Муктаждыктар — жашоо үчүн зарыл нерселер: тамак, кийим, турак жай.', 'Потребности необходимы для жизни: еда, одежда, жильё.', 'Needs are essential: food, clothes, housing.')
  },
  {
    id: 'fi05', skill: 'saving', difficulty: 2, type: 'input', numeric: true,
    prompt: L('Банкка 10 000 сом жылдык 10% менен салынды. Бир жылдан кийин канча пайыз (сом) кошулат?', 'В банк положили 10 000 сомов под 10% годовых. Сколько сомов процентов начислят за год?', '10,000 som is deposited at 10% a year. How much interest (som) after one year?'),
    answer: ['1000'],
    explain: L('10 000 · 10% = 1000 сом.', '10 000 · 10% = 1000 сомов.', '10,000 · 10% = 1,000 som.')
  },
  {
    id: 'fi06', skill: 'budget', difficulty: 2, type: 'choice',
    prompt: L('Кайсы сатып алуу пайдалуураак: 2 кг 180 сомго же 1 кг 95 сомго?', 'Что выгоднее: 2 кг за 180 сомов или 1 кг за 95 сомов?', 'Which is better value: 2 kg for 180 som or 1 kg for 95 som?'),
    options: [L('2 кг 180 сомго', '2 кг за 180 сомов', '2 kg for 180 som'), L('1 кг 95 сомго', '1 кг за 95 сомов', '1 kg for 95 som'), L('Бирдей', 'Одинаково', 'The same')], correct: 0,
    explain: L('180 : 2 = 90 сом/кг, бул 95 сомдон арзан.', '180 : 2 = 90 сомов за кг — дешевле, чем 95.', '180 ÷ 2 = 90 som/kg, cheaper than 95.')
  },
  {
    id: 'fi07', skill: 'safety', difficulty: 1, type: 'choice',
    prompt: L('«Банктан» чалып, SMS-кодду айтууну суранышты. Эмне кылуу керек?', 'Звонят «из банка» и просят назвать код из SMS. Что делать?', 'Someone calls "from the bank" asking for your SMS code. What should you do?'),
    options: [
      L('Кодду эч кимге айтпай, байланышты үзүү', 'Никому не называть код и прекратить разговор', 'Never share the code and hang up'),
      L('Кодду тез айтуу', 'Быстро назвать код', 'Say the code quickly'),
      L('Карта номерин айтуу', 'Назвать номер карты', 'Give the card number'),
      L('PIN-кодду айтуу', 'Назвать PIN-код', 'Give the PIN')
    ], correct: 0,
    explain: L('Чыныгы банк SMS-кодду же PIN-кодду эч качан сурабайт.', 'Настоящий банк никогда не спрашивает код из SMS или PIN.', 'A real bank never asks for SMS codes or your PIN.')
  },
  {
    id: 'fi08', skill: 'safety', difficulty: 2, type: 'multiple',
    prompt: L('Кайсы маалыматты эч кимге айтууга болбойт?', 'Какие данные нельзя сообщать никому?', 'Which details must never be shared?'),
    options: [L('PIN-код', 'PIN-код', 'PIN'), L('SMS-код', 'Код из SMS', 'SMS code'), L('Картанын артындагы CVV', 'CVV на обороте карты', 'CVV on the back of the card'), L('Мектебиңдин аты', 'Название твоей школы', 'The name of your school')],
    correct: [0, 1, 2],
    explain: L('PIN, SMS-код жана CVV — акчаңдын ачкычтары.', 'PIN, код из SMS и CVV — ключи к твоим деньгам.', 'PIN, SMS code and CVV are keys to your money.')
  },
  {
    id: 'fi09', skill: 'saving', difficulty: 2, type: 'choice',
    prompt: L('«Кыйын күнгө» топтолгон акча эмне деп аталат?', 'Как называются деньги, отложенные «на чёрный день»?', 'What is money saved "for a rainy day" called?'),
    options: [L('Коопсуздук жаздыгы (резерв)', 'Финансовая подушка безопасности', 'An emergency fund'), L('Карыз', 'Долг', 'A debt'), L('Салык', 'Налог', 'A tax'), L('Айып', 'Штраф', 'A fine')], correct: 0,
    explain: L('Бир нече айлык чыгымга барабар резерв күтүлбөгөн учурдан коргойт.', 'Запас на несколько месяцев расходов защищает от неожиданностей.', 'A reserve of a few months of spending protects you from surprises.')
  },
  {
    id: 'fi-err-01', skill: 'budget', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: L('Окуучу айлык бюджетин түздү. Кайсы сапта ката?', 'Ученик составил бюджет на месяц. В какой строке ошибка?', 'A student made a monthly budget. Which line is wrong?'),
    options: [
      L('Киреше: 2000 сом', 'Доход: 2000 сомов', 'Income: 2000 som'),
      L('Чыгым: 1200 + 300 = 1500 сом', 'Расходы: 1200 + 300 = 1500 сомов', 'Spending: 1200 + 300 = 1500 som'),
      L('Калганы: 2000 − 1500 = 700 сом', 'Остаток: 2000 − 1500 = 700 сомов', 'Left: 2000 − 1500 = 700 som')
    ],
    correct: 2,
    explain: L('2000 − 1500 = 500 сом, 700 эмес.', '2000 − 1500 = 500 сомов, а не 700.', '2000 − 1500 = 500 som, not 700.')
  }
];
