/** Кыргыз адабияты, 7-класс — «Манас» эпосу жана акындар */
const L = (ky, ru, en) => ({ ky, ru, en });

export default [
  {
    id: 'kl01', skill: 'characters', difficulty: 1, type: 'choice',
    prompt: L('Манастын аялынын аты ким?', 'Как зовут жену Манаса?', "What is the name of Manas's wife?"),
    options: ['Каныкей', 'Чыйырды', 'Айчүрөк', 'Жамийла'], correct: 0,
    explain: L('Каныкей — акылман, Манастын жубайы жана Семетейдин энеси.', 'Каныкей — мудрая жена Манаса и мать Семетея.', 'Kanykei is the wise wife of Manas and mother of Semetei.')
  },
  {
    id: 'kl02', skill: 'characters', difficulty: 1, type: 'choice',
    prompt: L('Манастын тулпарынын аты кандай?', 'Как зовут коня Манаса?', "What is the name of Manas's horse?"),
    options: ['Аккула', 'Тайбуурул', 'Кара-Жорго', 'Сары-Ат'], correct: 0,
    explain: L('Манастын сүйүктүү тулпары — Аккула.', 'Любимый скакун Манаса — Аккула.', "Manas's beloved steed is Akkula.")
  },
  {
    id: 'kl03', skill: 'characters', difficulty: 1, type: 'input', numeric: true,
    prompt: L('Манастын жанында канча чоро болгон?', 'Сколько было дружинников (чоро) у Манаса?', 'How many companions (choro) did Manas have?'),
    answer: ['40'],
    explain: L('«Кырк чоро» — Манастын кырк жоокер досу.', '«Кырк чоро» — сорок верных воинов Манаса.', '"Kyrk choro" — the forty loyal warriors of Manas.')
  },
  {
    id: 'kl04', skill: 'characters', difficulty: 2, type: 'choice',
    prompt: L('Манастын атасы ким?', 'Кто отец Манаса?', 'Who is the father of Manas?'),
    options: ['Жакып', 'Бакай', 'Алманбет', 'Кошой'], correct: 0,
    explain: L('Манастын атасы — Жакып бай, энеси — Чыйырды.', 'Отец Манаса — Жакып, мать — Чыйырды.', 'His father is Jakyp and his mother is Chyiyrdy.')
  },
  {
    id: 'kl05', skill: 'characters', difficulty: 2, type: 'choice',
    prompt: L('Манастын акылман кеңешчиси, «акылы терең» карыя ким?', 'Кто мудрый советник Манаса?', 'Who is the wise adviser of Manas?'),
    options: ['Бакай', 'Көкөтөй', 'Жолой', 'Конурбай'], correct: 0,
    explain: L('Бакай — Манастын эң жакын кеңешчиси.', 'Бакай — самый близкий советник Манаса.', 'Bakai is the closest adviser of Manas.')
  },
  {
    id: 'kl06', skill: 'epic', difficulty: 1, type: 'sort',
    prompt: L('Трилогиянын бөлүктөрүн иреттеңиз', 'Расставьте части трилогии по порядку', 'Put the parts of the trilogy in order'),
    items: ['Манас', 'Семетей', 'Сейтек'],
    explain: L('Манас → уулу Семетей → небереси Сейтек.', 'Манас → его сын Семетей → внук Сейтек.', 'Manas → his son Semetei → grandson Seitek.')
  },
  {
    id: 'kl07', skill: 'epic', difficulty: 2, type: 'choice',
    prompt: L('«Манас» трилогиясы ЮНЕСКОнун адамзаттын материалдык эмес маданий мурастар тизмесине качан кирген?', 'Когда трилогия «Манас» внесена в список нематериального наследия ЮНЕСКО?', 'When was the Manas trilogy inscribed on the UNESCO intangible heritage list?'),
    options: ['2013', '1995', '2001', '2020'], correct: 0,
    explain: L('2013-жылы «Манас, Семетей, Сейтек» трилогиясы тизмеге кирген.', 'В 2013 году трилогия «Манас, Семетей, Сейтек» внесена в список.', 'In 2013 the trilogy Manas, Semetei, Seitek was inscribed.')
  },
  {
    id: 'kl08', skill: 'narrators', difficulty: 1, type: 'choice',
    prompt: L('Эпосту жатка айтып берген адамды эмне деп аташат?', 'Как называют сказителя эпоса «Манас»?', 'What is a performer of the Manas epic called?'),
    options: ['Манасчы', 'Акын', 'Комузчу', 'Жомокчу'], correct: 0,
    explain: L('Манасчы — эпосту жатка айтуучу.', 'Манасчы — сказитель, исполняющий эпос наизусть.', 'A manaschy recites the epic from memory.')
  },
  {
    id: 'kl09', skill: 'narrators', difficulty: 2, type: 'multiple',
    prompt: L('Белгилүү манасчыларды тандаңыз', 'Выберите известных манасчы', 'Choose the famous manaschy'),
    options: ['Сагымбай Орозбаков', 'Саякбай Каралаев', 'Токтогул Сатылганов', 'Чыңгыз Айтматов'],
    correct: [0, 1],
    explain: L('Сагымбай Орозбаков жана Саякбай Каралаев — улуу манасчылар. Токтогул — акын, Айтматов — жазуучу.', 'Сагымбай Орозбаков и Саякбай Каралаев — великие манасчы. Токтогул — акын, Айтматов — писатель.', 'Sagymbai Orozbakov and Sayakbai Karalaev are great manaschy; Toktogul was a poet, Aitmatov a writer.')
  },
  {
    id: 'kl10', skill: 'poets', difficulty: 1, type: 'choice',
    prompt: L('Токтогул Сатылганов ким болгон?', 'Кем был Токтогул Сатылганов?', 'Who was Toktogul Satylganov?'),
    options: [L('Акын, ырчы', 'Акын, народный поэт-певец', 'A poet and singer (akyn)'), L('Манасчы', 'Манасчы', 'A manaschy'), L('Хан', 'Хан', 'A khan'), L('Саякатчы', 'Путешественник', 'A traveller')],
    correct: 0,
    explain: L('Токтогул — улуу төкмө акын, анын атында шаар жана суу сактагыч бар.', 'Токтогул — великий акын-импровизатор, его имя носят город и водохранилище.', 'Toktogul was a great improvising poet; a town and a reservoir bear his name.')
  },
  {
    id: 'kl-err-01', skill: 'characters', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: L('Мугалим каармандардын туугандыгын жазды. Кайсы сапта ката?', 'Учитель записал родство героев. В какой строке ошибка?', 'The teacher listed family ties of the heroes. Which line is wrong?'),
    options: [
      L('Жакып — Манастын атасы', 'Жакып — отец Манаса', 'Jakyp — father of Manas'),
      L('Каныкей — Манастын жубайы', 'Каныкей — жена Манаса', 'Kanykei — wife of Manas'),
      L('Сейтек — Манастын уулу', 'Сейтек — сын Манаса', 'Seitek — son of Manas'),
      L('Семетей — Каныкейдин уулу', 'Семетей — сын Каныкей', 'Semetei — son of Kanykei')
    ],
    correct: 2,
    explain: L('Сейтек — Манастын небереси, Семетейдин уулу.', 'Сейтек — внук Манаса, сын Семетея.', 'Seitek is the grandson of Manas, son of Semetei.')
  }
];
