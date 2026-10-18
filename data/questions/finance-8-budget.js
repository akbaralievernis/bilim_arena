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
  },
  {
    id: "fi11", skill: "budget", difficulty: 1, type: "choice",
    prompt: {"ky": "Кайсысы милдеттүү чыгаша?", "ru": "Какой расход — обязательный?", "en": "Which expense is essential?"},
    options: [
      {"ky": "Коммуналдык төлөмдөр", "ru": "Коммунальные платежи", "en": "Utility bills"},
      {"ky": "Жаңы видео оюн", "ru": "Новая видеоигра", "en": "A new video game"},
      {"ky": "Кафеге баруу", "ru": "Поход в кафе", "en": "Going to a café"},
      {"ky": "Сувенир", "ru": "Сувенир", "en": "A souvenir"}
    ], correct: 0,
    explain: {"ky": "Үй, жарык, суу үчүн төлөм — биринчи кезекте.", "ru": "Плата за жильё, свет и воду — в первую очередь.", "en": "Rent, electricity and water come first."}
  },
  {
    id: "fi12", skill: "budget", difficulty: 2, type: "input", numeric: true,
    prompt: {"ky": "Айлык киреше 30 000 сом, чыгаша 26 500 сом. Айдын аягында канча сом калат?", "ru": "Доход за месяц — 30 000 сомов, расходы — 26 500 сомов. Сколько останется?", "en": "Monthly income is 30,000 som and spending is 26,500 som. How much is left?"},
    answer: ["3500"],
    explain: {"ky": "30 000 − 26 500 = 3 500.", "ru": "30 000 − 26 500 = 3 500.", "en": "30,000 − 26,500 = 3,500."}
  },
  {
    id: "fi13", skill: "budget", difficulty: 2, type: "choice",
    prompt: {"ky": "Чыгаша кирешеден көп болсо, бюджет кандай деп аталат?", "ru": "Как называется бюджет, где расходы больше доходов?", "en": "What is a budget called when spending is greater than income?"},
    options: [
      {"ky": "Дефициттүү (тартыш)", "ru": "Дефицитный", "en": "In deficit"},
      {"ky": "Профициттүү (ашыкча)", "ru": "Профицитный", "en": "In surplus"},
      {"ky": "Тең салмактуу", "ru": "Сбалансированный", "en": "Balanced"},
      {"ky": "Салыктык", "ru": "Налоговый", "en": "A tax budget"}
    ], correct: 0,
    explain: {"ky": "Дефицитте акча жетишпейт — чыгашаны кыскартуу керек.", "ru": "При дефиците денег не хватает — нужно сокращать расходы.", "en": "In a deficit there is not enough money, so spending must be cut."}
  },
  {
    id: "fi14", skill: "saving", difficulty: 1, type: "choice",
    prompt: {"ky": "Акча чогултуунун эң пайдалуу адаты кайсы?", "ru": "Какая привычка лучше всего помогает копить?", "en": "Which habit helps most with saving money?"},
    options: [
      {"ky": "Ар бир кирешеден бир бөлүгүн четке коюу", "ru": "Откладывать часть каждого дохода", "en": "Putting aside part of every income"},
      {"ky": "Баарын дароо коротуу", "ru": "Тратить всё сразу", "en": "Spending everything at once"},
      {"ky": "Карызга алып коротуу", "ru": "Тратить в долг", "en": "Spending borrowed money"},
      {"ky": "Акчаны эсептебей коротуу", "ru": "Тратить, не считая", "en": "Spending without counting"}
    ], correct: 0,
    explain: {"ky": "Мисалы, ар бир кирешенин 10%ын жыйноо.", "ru": "Например, откладывать 10% каждого дохода.", "en": "For example, save 10% of every income."}
  },
  {
    id: "fi15", skill: "saving", difficulty: 2, type: "choice",
    prompt: {"ky": "Банктагы депозит эмне берет?", "ru": "Что даёт вклад (депозит) в банке?", "en": "What does a bank deposit give you?"},
    options: [
      {"ky": "Пайыз түрүндө кошумча киреше", "ru": "Доход в виде процентов", "en": "Extra income as interest"},
      {"ky": "Бекер товарлар", "ru": "Бесплатные товары", "en": "Free goods"},
      {"ky": "Салыктан бошотуу", "ru": "Освобождение от налогов", "en": "Freedom from taxes"},
      {"ky": "Кредит алуу милдети", "ru": "Обязанность взять кредит", "en": "A duty to take a loan"}
    ], correct: 0,
    explain: {"ky": "Банк акчаңызды колдонгону үчүн пайыз төлөйт.", "ru": "Банк платит проценты за то, что пользуется вашими деньгами.", "en": "The bank pays interest for using your money."}
  },
  {
    id: "fi18", skill: "safety", difficulty: 2, type: "choice",
    prompt: {"ky": "«Сиз утуп алдыңыз! Картаңыздын маалыматын жибериңиз» деген билдирүү келди. Эмне кылуу керек?", "ru": "Пришло сообщение: «Вы выиграли! Пришлите данные карты». Что делать?", "en": "You get a message: \"You have won! Send your card details.\" What should you do?"},
    options: [
      {"ky": "Жооп бербей, өчүрүү — бул алдамчылык", "ru": "Не отвечать и удалить — это мошенничество", "en": "Ignore and delete it — it is a scam"},
      {"ky": "Маалыматты жиберүү", "ru": "Отправить данные", "en": "Send the details"},
      {"ky": "Шилтемени басуу", "ru": "Перейти по ссылке", "en": "Click the link"},
      {"ky": "Досторго жөнөтүү", "ru": "Переслать друзьям", "en": "Forward it to friends"}
    ], correct: 0,
    explain: {"ky": "Алдамчылар «утуш» менен алдашат. Карта маалыматын эч кимге бербеңиз.", "ru": "Мошенники обманывают «выигрышами». Не сообщайте данные карты никому.", "en": "Scammers use fake prizes. Never share your card details."}
  },
  {
    id: "fi30", skill: "budget", difficulty: 1, type: "choice",
    prompt: {"ky": "Кайсысы киреше?", "ru": "Что из этого — доход?", "en": "Which of these is income?"},
    options: [
      {"ky": "Ата-эненин айлык акысы", "ru": "Зарплата родителей", "en": "The parents’ salary"},
      {"ky": "Коммуналдык төлөм", "ru": "Коммунальный платёж", "en": "A utility bill"},
      {"ky": "Дүкөндөн алынган азык", "ru": "Продукты из магазина", "en": "Groceries from a shop"},
      {"ky": "Жол кире", "ru": "Плата за проезд", "en": "A bus fare"}
    ], correct: 0,
    explain: {"ky": "Киреше — үй-бүлөгө келген акча, калгандары — чыгаша.", "ru": "Доход — деньги, которые приходят в семью, остальное — расходы.", "en": "Income is money coming into the family; the rest are expenses."}
  },
  {
    id: "fi31", skill: "saving", difficulty: 2, type: "input", numeric: true,
    prompt: {"ky": "Айбек ай сайын 500 сом топтойт. 6 айда канча сом топтойт?", "ru": "Айбек каждый месяц откладывает 500 сомов. Сколько он отложит за 6 месяцев?", "en": "Aibek saves 500 som every month. How much will he save in 6 months?"},
    answer: ["3000"],
    explain: {"ky": "500 × 6 = 3000.", "ru": "500 × 6 = 3000.", "en": "500 × 6 = 3000."}
  },
  {
    id: "fi32", skill: "safety", difficulty: 2, type: "choice",
    prompt: {"ky": "Интернеттен сатып алганда сайттын коопсуздугун эмнеден байкаса болот?", "ru": "Как понять, что сайт для покупок в интернете безопасен?", "en": "How can you tell that an online shop is safe?"},
    options: [
      {"ky": "Дарек https менен башталат жана сайт белгилүү", "ru": "Адрес начинается с https, сайт известный", "en": "The address starts with https and the shop is well known"},
      {"ky": "Баасы шектүү арзан", "ru": "Цена подозрительно низкая", "en": "The price is suspiciously low"},
      {"ky": "Сайт картанын PIN-кодун сурайт", "ru": "Сайт просит PIN-код карты", "en": "The site asks for your card PIN"},
      {"ky": "Жарнамада «Тез бол, шашыл!» деп жазылган", "ru": "В рекламе написано «Скорее, успей!»", "en": "The ad says “Hurry, last chance!”"}
    ], correct: 0,
    explain: {"ky": "PIN-кодду эч бир сайт сурабайт; ашыкча арзан баа жана шаштыруу — алдамчылыктын белгиси.", "ru": "PIN-код не спрашивает ни один сайт; слишком низкая цена и спешка — признаки мошенничества.", "en": "No real site asks for a PIN; very low prices and pressure to hurry are signs of fraud."}
  },
  {
    id: "fi33", skill: "budget", difficulty: 2, type: "choice",
    prompt: {"ky": "Чыгашаны азайтуунун пайдалуу жолу кайсы?", "ru": "Какой полезный способ сократить расходы?", "en": "What is a useful way to cut spending?"},
    options: [
      {"ky": "Сатып ала турган нерселердин тизмесин алдын ала жазуу", "ru": "Заранее составлять список покупок", "en": "Writing a shopping list in advance"},
      {"ky": "Карыз алуу", "ru": "Брать в долг", "en": "Borrowing money"},
      {"ky": "Баарын кредитке алуу", "ru": "Покупать всё в кредит", "en": "Buying everything on credit"},
      {"ky": "Чектерди ыргытып салуу", "ru": "Выбрасывать чеки", "en": "Throwing away receipts"}
    ], correct: 0,
    explain: {"ky": "Тизме керексиз сатып алууларды азайтат.", "ru": "Список помогает не покупать лишнего.", "en": "A list helps you avoid buying things you do not need."}
  }
];
