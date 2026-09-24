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
  }
];
