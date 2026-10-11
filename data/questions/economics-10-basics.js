/** Экономика, 10-класс — Экономиканын негиздери / Основы экономики */
const L = (ky, ru, en) => ({ ky, ru, en });

export default [
  {
    id: 'ec01', skill: 'market', difficulty: 1, type: 'choice',
    prompt: L('Товардын баасы көтөрүлсө, ага суроо-талап адатта кандай өзгөрөт?', 'Если цена товара растёт, как обычно меняется спрос?', 'When a price rises, what usually happens to demand?'),
    options: [L('Азаят', 'Снижается', 'It falls'), L('Көбөйөт', 'Растёт', 'It rises'), L('Өзгөрбөйт', 'Не меняется', 'It stays the same')], correct: 0,
    explain: L('Суроо-талап мыйзамы: баа жогору — сатып алуучулар азыраак алат.', 'Закон спроса: чем выше цена, тем меньше покупают.', 'Law of demand: higher price, less bought.')
  },
  {
    id: 'ec02', skill: 'market', difficulty: 2, type: 'choice',
    prompt: L('Товардын баасы көтөрүлсө, сатуучулардын сунушу адатта кандай өзгөрөт?', 'Если цена растёт, как обычно меняется предложение?', 'When a price rises, what usually happens to supply?'),
    options: [L('Көбөйөт', 'Растёт', 'It rises'), L('Азаят', 'Снижается', 'It falls'), L('Нөлгө түшөт', 'Падает до нуля', 'It drops to zero')], correct: 0,
    explain: L('Сунуш мыйзамы: баа жогору — сатуучулар көбүрөөк сатууну каалайт.', 'Закон предложения: чем выше цена, тем больше хотят продать.', 'Law of supply: higher price, more offered.')
  },
  {
    id: 'ec03', skill: 'money', difficulty: 1, type: 'choice',
    prompt: L('Инфляция деген эмне?', 'Что такое инфляция?', 'What is inflation?'),
    options: [
      L('Баалардын жалпы өсүшү', 'Общий рост цен', 'A general rise in prices'),
      L('Баалардын түшүшү', 'Снижение цен', 'Falling prices'),
      L('Айлыктын өсүшү', 'Рост зарплат', 'Rising wages'),
      L('Жаңы акча басуу', 'Печать новых денег', 'Printing new money')
    ], correct: 0,
    explain: L('Инфляцияда ошол эле акчага азыраак нерсе сатып алууга болот.', 'При инфляции на те же деньги можно купить меньше.', 'With inflation the same money buys less.')
  },
  {
    id: 'ec04', skill: 'money', difficulty: 1, type: 'choice',
    prompt: L('Кыргызстанда улуттук акчаны (сомду) ким чыгарат?', 'Кто выпускает национальную валюту Кыргызстана (сом)?', 'Who issues the national currency of Kyrgyzstan (the som)?'),
    options: [L('Улуттук банк', 'Национальный банк', 'The National Bank'), L('Жогорку Кеңеш', 'Жогорку Кенеш', 'The parliament'), L('Каалаган коммерциялык банк', 'Любой коммерческий банк', 'Any commercial bank'), L('Салык кызматы', 'Налоговая служба', 'The tax service')], correct: 0,
    explain: L('Кыргыз Республикасынын Улуттук банкы акча чыгарат жана инфляцияны көзөмөлдөйт.', 'Национальный банк КР выпускает деньги и следит за инфляцией.', 'The National Bank issues money and watches inflation.')
  },
  {
    id: 'ec05', skill: 'business', difficulty: 1, type: 'input', numeric: true,
    prompt: L('Дүкөндүн кирешеси 500 сом, чыгымы 320 сом. Пайдасы канча сом?', 'Выручка магазина 500 сомов, затраты 320 сомов. Какова прибыль в сомах?', 'A shop earns 500 som and spends 320 som. What is the profit in som?'),
    answer: ['180'],
    explain: L('Пайда = киреше − чыгым = 500 − 320 = 180.', 'Прибыль = выручка − затраты = 500 − 320 = 180.', 'Profit = revenue − costs = 500 − 320 = 180.')
  },
  {
    id: 'ec06', skill: 'business', difficulty: 2, type: 'choice',
    prompt: L('Кайсынысы товар эмес, кызмат көрсөтүү?', 'Что из этого — услуга, а не товар?', 'Which of these is a service, not a good?'),
    options: [L('Чач тарач', 'Стрижка в парикмахерской', 'A haircut'), L('Нан', 'Хлеб', 'Bread'), L('Телефон', 'Телефон', 'A phone'), L('Китеп', 'Книга', 'A book')], correct: 0,
    explain: L('Кызмат — сатылып алынган аракет, аны колго кармай албайсың.', 'Услуга — это действие, его нельзя подержать в руках.', 'A service is an action you cannot hold.')
  },
  {
    id: 'ec07', skill: 'market', difficulty: 2, type: 'choice',
    prompt: L('Салыктар эмнеге жумшалат?', 'На что идут налоги?', 'What are taxes used for?'),
    options: [
      L('Мектеп, оорукана, жол сыяктуу коомдук кызматтарга', 'На общественные услуги: школы, больницы, дороги', 'Public services such as schools, hospitals and roads'),
      L('Бир гана компаниялардын пайдасына', 'Только на прибыль компаний', 'Only company profits'),
      L('Эч нерсеге', 'Ни на что', 'Nothing'),
      L('Жарнамага гана', 'Только на рекламу', 'Only advertising')
    ], correct: 0,
    explain: L('Мамлекеттик бюджет негизинен салыктардан түзүлөт.', 'Государственный бюджет в основном формируется из налогов.', 'The state budget comes mainly from taxes.')
  },
  {
    id: 'ec08', skill: 'business', difficulty: 3, type: 'input', numeric: true,
    prompt: L('Товар 800 сом турат. 25% арзандатуудан кийин баасы канча сом болот?', 'Товар стоит 800 сомов. Какой будет цена после скидки 25%?', 'An item costs 800 som. What is the price after a 25% discount?'),
    answer: ['600'],
    explain: L('800 · 25% = 200; 800 − 200 = 600.', '800 · 25% = 200; 800 − 200 = 600.', '800 · 25% = 200; 800 − 200 = 600.')
  },
  {
    id: 'ec09', skill: 'money', difficulty: 2, type: 'multiple',
    prompt: L('Акчанын милдеттерин тандаңыз', 'Выберите функции денег', 'Choose the functions of money'),
    options: [L('Алмашуу каражаты', 'Средство обмена', 'Medium of exchange'), L('Баанын өлчөмү', 'Мера стоимости', 'Measure of value'), L('Топтоо каражаты', 'Средство сбережения', 'Store of value'), L('Тамак-аш', 'Продукт питания', 'Food')],
    correct: [0, 1, 2],
    explain: L('Акча менен алмашабыз, баа өлчөйбүз жана топтойбуз.', 'Деньгами обмениваются, измеряют стоимость и копят.', 'Money is used to exchange, to measure value and to save.')
  },
  {
    id: 'ec-err-01', skill: 'business', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: L('Ишкер пайдасын эсептеди. Кайсы сапта ката?', 'Предприниматель посчитал прибыль. Где ошибка?', 'An entrepreneur computed the profit. Where is the mistake?'),
    options: [
      L('Киреше: 1200 сом', 'Выручка: 1200 сомов', 'Revenue: 1200 som'),
      L('Чыгым: 700 сом', 'Затраты: 700 сомов', 'Costs: 700 som'),
      L('Пайда = 1200 + 700 = 1900 сом', 'Прибыль = 1200 + 700 = 1900 сомов', 'Profit = 1200 + 700 = 1900 som')
    ],
    correct: 2,
    explain: L('Чыгым кемитилет: 1200 − 700 = 500 сом.', 'Затраты вычитаются: 1200 − 700 = 500 сомов.', 'Costs are subtracted: 1200 − 700 = 500 som.')
  },
  {
    id: "ec10", skill: "market", difficulty: 1, type: "choice",
    prompt: {"ky": "Товардын баасы көтөрүлсө, адатта, ага суроо-талап кандай өзгөрөт?", "ru": "Если цена товара растёт, как обычно меняется спрос?", "en": "When the price of a good rises, what usually happens to demand?"},
    options: [
      {"ky": "Азаят", "ru": "Снижается", "en": "It falls"},
      {"ky": "Көбөйөт", "ru": "Растёт", "en": "It rises"},
      {"ky": "Өзгөрбөйт", "ru": "Не меняется", "en": "It stays the same"},
      {"ky": "Нөлгө барабар болот", "ru": "Становится нулевым", "en": "It drops to zero"}
    ], correct: 0,
    explain: {"ky": "Суроо-талап мыйзамы: баа өскөн сайын сатып алуучулар азыраак алышат.", "ru": "Закон спроса: чем выше цена, тем меньше покупают.", "en": "The law of demand: the higher the price, the less people buy."}
  },
  {
    id: "ec11", skill: "market", difficulty: 2, type: "choice",
    prompt: {"ky": "Сунуш суроо-талаптан көп болсо, баа кандай болот?", "ru": "Если предложение больше спроса, что происходит с ценой?", "en": "If supply is greater than demand, what happens to the price?"},
    options: [
      {"ky": "Төмөндөйт", "ru": "Снижается", "en": "It falls"},
      {"ky": "Көтөрүлөт", "ru": "Растёт", "en": "It rises"},
      {"ky": "Өзгөрбөйт", "ru": "Не меняется", "en": "It stays the same"},
      {"ky": "Эки эсе өсөт", "ru": "Удваивается", "en": "It doubles"}
    ], correct: 0,
    explain: {"ky": "Товар ашыкча болсо, сатуучулар бааны түшүрүшөт.", "ru": "Когда товара в избытке, продавцы снижают цены.", "en": "When there is too much of a good, sellers cut prices."}
  },
  {
    id: "ec12", skill: "market", difficulty: 2, type: "choice",
    prompt: {"ky": "Рынокто бир гана сатуучу болгон абал эмне деп аталат?", "ru": "Как называется рынок, где только один продавец?", "en": "What is a market with only one seller called?"},
    options: [
      {"ky": "Монополия", "ru": "Монополия", "en": "A monopoly"},
      {"ky": "Атаандаштык", "ru": "Конкуренция", "en": "Competition"},
      {"ky": "Инфляция", "ru": "Инфляция", "en": "Inflation"},
      {"ky": "Бартер", "ru": "Бартер", "en": "Barter"}
    ], correct: 0,
    explain: {"ky": "Монополист бааны өзү белгилей алат.", "ru": "Монополист может сам назначать цену.", "en": "A monopolist can set the price on its own."}
  },
  {
    id: "ec13", skill: "money", difficulty: 1, type: "choice",
    prompt: {"ky": "Кыргызстандын улуттук валютасы кайсы?", "ru": "Какая национальная валюта Кыргызстана?", "en": "What is the national currency of Kyrgyzstan?"},
    options: [
      {"ky": "Сом", "ru": "Сом", "en": "The som"},
      {"ky": "Теңге", "ru": "Тенге", "en": "The tenge"},
      {"ky": "Рубль", "ru": "Рубль", "en": "The rouble"},
      {"ky": "Доллар", "ru": "Доллар", "en": "The dollar"}
    ], correct: 0,
    explain: {"ky": "Сом 1993-жылдан бери колдонулат.", "ru": "Сом используется с 1993 года.", "en": "The som has been used since 1993."}
  },
  {
    id: "ec14", skill: "money", difficulty: 2, type: "choice",
    prompt: {"ky": "Инфляция деген эмне?", "ru": "Что такое инфляция?", "en": "What is inflation?"},
    options: [
      {"ky": "Баалардын жалпы деңгээлинин өсүшү", "ru": "Рост общего уровня цен", "en": "A rise in the general level of prices"},
      {"ky": "Баалардын төмөндөшү", "ru": "Снижение цен", "en": "Falling prices"},
      {"ky": "Айлык акынын өсүшү", "ru": "Рост зарплат", "en": "Rising wages"},
      {"ky": "Салыктардын жоюлушу", "ru": "Отмена налогов", "en": "Abolishing taxes"}
    ], correct: 0,
    explain: {"ky": "Инфляцияда ошол эле акчага азыраак товар сатып алууга болот.", "ru": "При инфляции на те же деньги можно купить меньше.", "en": "With inflation, the same money buys less."}
  },
  {
    id: "ec15", skill: "money", difficulty: 2, type: "choice",
    prompt: {"ky": "Акчасыз, товарды товарга алмашуу эмне деп аталат?", "ru": "Как называется обмен товара на товар без денег?", "en": "What is swapping goods for goods without money called?"},
    options: [
      {"ky": "Бартер", "ru": "Бартер", "en": "Barter"},
      {"ky": "Кредит", "ru": "Кредит", "en": "Credit"},
      {"ky": "Депозит", "ru": "Депозит", "en": "A deposit"},
      {"ky": "Лизинг", "ru": "Лизинг", "en": "Leasing"}
    ], correct: 0,
    explain: {"ky": "Акча пайда болгонго чейин адамдар бартер менен алмашышкан.", "ru": "До появления денег люди обменивались бартером.", "en": "Before money existed, people traded by barter."}
  },
  {
    id: "ec16", skill: "money", difficulty: 3, type: "input", numeric: true,
    prompt: {"ky": "Товар 500 сом турчу, баасы 10%га көтөрүлдү. Жаңы баасы канча сом?", "ru": "Товар стоил 500 сомов, цена выросла на 10%. Сколько сомов стоит теперь?", "en": "A product cost 500 som and the price rose by 10%. What is the new price in som?"},
    answer: ["550"],
    explain: {"ky": "500 × 10% = 50; 500 + 50 = 550.", "ru": "500 × 10% = 50; 500 + 50 = 550.", "en": "500 × 10% = 50; 500 + 50 = 550."}
  },
  {
    id: "ec17", skill: "business", difficulty: 1, type: "choice",
    prompt: {"ky": "Ишкананын пайдасы кантип эсептелет?", "ru": "Как считается прибыль предприятия?", "en": "How is the profit of a business calculated?"},
    options: [
      {"ky": "Түшкөн акча минус чыгымдар", "ru": "Выручка минус расходы", "en": "Revenue minus costs"},
      {"ky": "Түшкөн акча плюс чыгымдар", "ru": "Выручка плюс расходы", "en": "Revenue plus costs"},
      {"ky": "Чыгымдар гана", "ru": "Только расходы", "en": "Costs only"},
      {"ky": "Айлык акылардын суммасы", "ru": "Сумма зарплат", "en": "The sum of wages"}
    ], correct: 0,
    explain: {"ky": "Пайда = киреше − чыгым.", "ru": "Прибыль = выручка − расходы.", "en": "Profit = revenue − costs."}
  },
  {
    id: "ec18", skill: "business", difficulty: 2, type: "input", numeric: true,
    prompt: {"ky": "Дүкөн 12 000 сом түшүрдү, чыгымдары 9 500 сом. Пайдасы канча сом?", "ru": "Магазин получил 12 000 сомов выручки, расходы — 9 500 сомов. Какая прибыль?", "en": "A shop took 12,000 som and spent 9,500 som. What is the profit in som?"},
    answer: ["2500"],
    explain: {"ky": "12 000 − 9 500 = 2 500.", "ru": "12 000 − 9 500 = 2 500.", "en": "12,000 − 9,500 = 2,500."}
  },
  {
    id: "ec19", skill: "business", difficulty: 2, type: "choice",
    prompt: {"ky": "Өз ишин ачып, тобокелге барган адам ким деп аталат?", "ru": "Как называется человек, который открывает своё дело и рискует?", "en": "What do we call a person who starts their own business and takes risks?"},
    options: [
      {"ky": "Ишкер", "ru": "Предприниматель", "en": "An entrepreneur"},
      {"ky": "Кызматкер", "ru": "Служащий", "en": "An employee"},
      {"ky": "Пенсионер", "ru": "Пенсионер", "en": "A pensioner"},
      {"ky": "Студент", "ru": "Студент", "en": "A student"}
    ], correct: 0,
    explain: {"ky": "Ишкер өз акчасын жана убактысын бизнеске салат.", "ru": "Предприниматель вкладывает в дело свои деньги и время.", "en": "An entrepreneur puts their own money and time into a business."}
  }
];
