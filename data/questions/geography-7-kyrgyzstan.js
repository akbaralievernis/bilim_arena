/** География, 7-класс — Кыргызстандын географиясы */
export default [
  {
    id: 'g01', skill: 'relief', difficulty: 1, type: 'choice',
    prompt: { ky: 'Кыргызстандын аймагынын басымдуу бөлүгүн эмне ээлейт?', ru: 'Что занимает большую часть территории Кыргызстана?', en: 'What covers most of the territory of Kyrgyzstan?' },
    options: [
      { ky: 'Тоолор', ru: 'Горы', en: 'Mountains' },
      { ky: 'Чөлдөр', ru: 'Пустыни', en: 'Deserts' },
      { ky: 'Токойлор', ru: 'Леса', en: 'Forests' },
      { ky: 'Түздүктөр', ru: 'Равнины', en: 'Plains' }
    ], correct: 0,
    explain: { ky: 'Кыргызстан — тоолуу өлкө: аймагынын 90%тен ашыгы тоолор.', ru: 'Кыргызстан — горная страна: более 90% территории занимают горы.', en: 'Kyrgyzstan is mountainous: over 90% of it is mountains.' }
  },
  {
    id: 'g02', skill: 'relief', difficulty: 1, type: 'choice',
    prompt: { ky: 'Кыргызстандын эң бийик чокусу кайсы?', ru: 'Какая вершина Кыргызстана самая высокая?', en: 'Which is the highest peak of Kyrgyzstan?' },
    options: [
      { ky: 'Жеңиш чокусу', ru: 'Пик Победы', en: 'Jengish Chokusu (Victory Peak)' },
      { ky: 'Ленин чокусу', ru: 'Пик Ленина', en: 'Lenin Peak' },
      { ky: 'Хан-Теңири', ru: 'Хан-Тенгри', en: 'Khan Tengri' },
      { ky: 'Ала-Арча', ru: 'Ала-Арча', en: 'Ala-Archa' }
    ], correct: 0,
    explain: { ky: 'Жеңиш чокусунун бийиктиги — 7439 м.', ru: 'Высота пика Победы — 7439 м.', en: 'Victory Peak is 7439 m high.' }
  },
  {
    id: 'g03', skill: 'relief', difficulty: 2, type: 'choice',
    prompt: { ky: 'Кыргызстандын негизги тоо системасы кайсы?', ru: 'Какая главная горная система Кыргызстана?', en: 'What is the main mountain system of Kyrgyzstan?' },
    options: [
      { ky: 'Теңир-Тоо', ru: 'Тянь-Шань', en: 'Tian Shan' },
      { ky: 'Урал', ru: 'Урал', en: 'Urals' },
      { ky: 'Кавказ', ru: 'Кавказ', en: 'Caucasus' },
      { ky: 'Альп тоолору', ru: 'Альпы', en: 'Alps' }
    ], correct: 0,
    explain: { ky: 'Өлкөнүн көбү Теңир-Тоодо, түштүгү — Памир-Алайда.', ru: 'Большая часть страны лежит в Тянь-Шане, юг — в Памиро-Алае.', en: 'Most of the country lies in the Tian Shan, the south in the Pamir-Alay.' }
  },
  {
    id: 'g04', skill: 'water', difficulty: 1, type: 'choice',
    prompt: { ky: 'Кыргызстандын эң чоң көлү кайсы?', ru: 'Какое озеро в Кыргызстане самое большое?', en: 'Which is the largest lake in Kyrgyzstan?' },
    options: [
      { ky: 'Ысык-Көл', ru: 'Иссык-Куль', en: 'Issyk-Kul' },
      { ky: 'Соң-Көл', ru: 'Сон-Куль', en: 'Son-Kul' },
      { ky: 'Чатыр-Көл', ru: 'Чатыр-Куль', en: 'Chatyr-Kul' },
      { ky: 'Сары-Челек', ru: 'Сары-Челек', en: 'Sary-Chelek' }
    ], correct: 0,
    explain: { ky: 'Ысык-Көл — дүйнөдөгү эң чоң тоо көлдөрүнүн бири.', ru: 'Иссык-Куль — одно из крупнейших горных озёр мира.', en: 'Issyk-Kul is one of the largest mountain lakes in the world.' }
  },
  {
    id: 'g05', skill: 'water', difficulty: 2, type: 'choice',
    prompt: { ky: '«Ысык-Көл» деген ат эмнени билдирет?', ru: 'Что означает название «Иссык-Куль»?', en: 'What does the name "Issyk-Kul" mean?' },
    options: [
      { ky: 'Жылуу көл', ru: 'Тёплое озеро', en: 'Warm lake' },
      { ky: 'Кара көл', ru: 'Чёрное озеро', en: 'Black lake' },
      { ky: 'Туздуу көл', ru: 'Солёное озеро', en: 'Salt lake' },
      { ky: 'Терең көл', ru: 'Глубокое озеро', en: 'Deep lake' }
    ], correct: 0,
    explain: { ky: 'Көл терең жана бир аз туздуу болгондуктан кышында тоңбойт — ошондуктан «жылуу көл».', ru: 'Озеро глубокое и слегка солёное, зимой не замерзает — отсюда «тёплое озеро».', en: 'The deep, slightly salty lake does not freeze in winter — hence "warm lake".' }
  },
  {
    id: 'g06', skill: 'water', difficulty: 2, type: 'choice',
    prompt: { ky: 'Кыргызстандын эң узун дарыясы кайсы?', ru: 'Какая река Кыргызстана самая длинная?', en: 'Which is the longest river in Kyrgyzstan?' },
    options: [
      { ky: 'Нарын', ru: 'Нарын', en: 'Naryn' },
      { ky: 'Чүй', ru: 'Чу', en: 'Chui' },
      { ky: 'Талас', ru: 'Талас', en: 'Talas' },
      { ky: 'Кара-Дарыя', ru: 'Карадарья', en: 'Kara-Darya' }
    ], correct: 0,
    explain: { ky: 'Нарын Кара-Дарыя менен кошулуп, Сыр-Дарыяны түзөт.', ru: 'Нарын, сливаясь с Карадарьёй, образует Сырдарью.', en: 'The Naryn joins the Kara-Darya to form the Syr Darya.' }
  },
  {
    id: 'g07', skill: 'water', difficulty: 3, type: 'choice',
    prompt: { ky: 'Токтогул суу сактагычы кайсы дарыяда курулган?', ru: 'На какой реке построено Токтогульское водохранилище?', en: 'On which river is the Toktogul reservoir built?' },
    options: [
      { ky: 'Нарын', ru: 'Нарын', en: 'Naryn' },
      { ky: 'Чүй', ru: 'Чу', en: 'Chui' },
      { ky: 'Талас', ru: 'Талас', en: 'Talas' },
      { ky: 'Сары-Жаз', ru: 'Сарыджаз', en: 'Sary-Jaz' }
    ], correct: 0,
    explain: { ky: 'Токтогул ГЭСи Нарын дарыясында — өлкөнүн негизги электр булагы.', ru: 'Токтогульская ГЭС стоит на Нарыне — главный источник электроэнергии страны.', en: 'The Toktogul hydro plant on the Naryn is the main power source of the country.' }
  },
  {
    id: 'g08', skill: 'regions', difficulty: 1, type: 'choice',
    prompt: { ky: 'Кыргызстанда канча облус бар?', ru: 'Сколько областей в Кыргызстане?', en: 'How many regions (oblasts) does Kyrgyzstan have?' },
    options: ['7', '5', '9', '12'], correct: 0,
    explain: { ky: 'Баткен, Жалал-Абад, Ысык-Көл, Нарын, Ош, Талас жана Чүй облустары.', ru: 'Баткенская, Джалал-Абадская, Иссык-Кульская, Нарынская, Ошская, Таласская и Чуйская области.', en: 'Batken, Jalal-Abad, Issyk-Kul, Naryn, Osh, Talas and Chui regions.' }
  },
  {
    id: 'g09', skill: 'regions', difficulty: 2, type: 'choice',
    prompt: { ky: 'Кыргызстан кайсы өлкө менен чектешпейт?', ru: 'С какой страной Кыргызстан НЕ граничит?', en: 'Which country does NOT border Kyrgyzstan?' },
    options: [
      { ky: 'Түркмөнстан', ru: 'Туркменистан', en: 'Turkmenistan' },
      { ky: 'Казакстан', ru: 'Казахстан', en: 'Kazakhstan' },
      { ky: 'Кытай', ru: 'Китай', en: 'China' },
      { ky: 'Тажикстан', ru: 'Таджикистан', en: 'Tajikistan' }
    ], correct: 0,
    explain: { ky: 'Кошуналар: Казакстан, Өзбекстан, Тажикстан жана Кытай.', ru: 'Соседи: Казахстан, Узбекистан, Таджикистан и Китай.', en: 'Neighbours: Kazakhstan, Uzbekistan, Tajikistan and China.' }
  },
  {
    id: 'g10', skill: 'regions', difficulty: 2, type: 'choice',
    prompt: { ky: 'Соң-Көл кайсы облуста жайгашкан?', ru: 'В какой области находится озеро Сон-Куль?', en: 'In which region is Lake Son-Kul?' },
    options: [
      { ky: 'Нарын', ru: 'Нарынская', en: 'Naryn' },
      { ky: 'Талас', ru: 'Таласская', en: 'Talas' },
      { ky: 'Баткен', ru: 'Баткенская', en: 'Batken' },
      { ky: 'Чүй', ru: 'Чуйская', en: 'Chui' }
    ], correct: 0,
    explain: { ky: 'Соң-Көл Нарын облусунда, деңиз деңгээлинен 3000 мден бийик.', ru: 'Сон-Куль — в Нарынской области, выше 3000 м над уровнем моря.', en: 'Son-Kul is in Naryn region, above 3000 m.' }
  },
  {
    id: 'g11', skill: 'nature', difficulty: 2, type: 'choice',
    prompt: { ky: 'Дүйнөдөгү эң чоң жаңгак токою кайсы жерде?', ru: 'Где находится крупнейший в мире орехоплодный лес?', en: 'Where is the largest walnut forest in the world?' },
    options: [
      { ky: 'Арстанбап (Жалал-Абад)', ru: 'Арсланбоб (Джалал-Абад)', en: 'Arslanbob (Jalal-Abad)' },
      { ky: 'Ала-Арча (Чүй)', ru: 'Ала-Арча (Чуй)', en: 'Ala-Archa (Chui)' },
      { ky: 'Каракол (Ысык-Көл)', ru: 'Каракол (Иссык-Куль)', en: 'Karakol (Issyk-Kul)' },
      { ky: 'Ат-Башы (Нарын)', ru: 'Ат-Баши (Нарын)', en: 'At-Bashy (Naryn)' }
    ], correct: 0,
    explain: { ky: 'Арстанбаптын жаңгак токою — Жалал-Абад облусунда.', ru: 'Орехоплодный лес Арсланбоба — в Джалал-Абадской области.', en: 'The Arslanbob walnut forest is in Jalal-Abad region.' }
  },
  {
    id: 'g12', skill: 'nature', difficulty: 1, type: 'choice',
    prompt: { ky: 'Бишкекке жакын жайгашкан улуттук парк кайсы?', ru: 'Какой национальный парк находится рядом с Бишкеком?', en: 'Which national park is close to Bishkek?' },
    options: [
      { ky: 'Ала-Арча', ru: 'Ала-Арча', en: 'Ala-Archa' },
      { ky: 'Сары-Челек', ru: 'Сары-Челек', en: 'Sary-Chelek' },
      { ky: 'Беш-Таш', ru: 'Беш-Таш', en: 'Besh-Tash' },
      { ky: 'Кара-Шоро', ru: 'Кара-Шоро', en: 'Kara-Shoro' }
    ], correct: 0,
    explain: { ky: 'Ала-Арча улуттук паркы Бишкектен 40 чакырымдай түштүктө.', ru: 'Национальный парк Ала-Арча — примерно в 40 км к югу от Бишкека.', en: 'Ala-Archa national park is about 40 km south of Bishkek.' }
  },
  // ─── Иреттөө ─────────────────────────────────────────────────────────────
  {
    id: 'g-sort-01', skill: 'relief', difficulty: 2, type: 'sort',
    prompt: { ky: 'Чокуларды бийиктиги боюнча иреттеңиз (эң бийигинен баштап)', ru: 'Расставьте вершины по высоте (от самой высокой)', en: 'Order the peaks by height (highest first)' },
    items: [
      { ky: 'Жеңиш чокусу — 7439 м', ru: 'Пик Победы — 7439 м', en: 'Victory Peak — 7439 m' },
      { ky: 'Ленин чокусу', ru: 'Пик Ленина', en: 'Lenin Peak' },
      { ky: 'Хан-Теңири', ru: 'Хан-Тенгри', en: 'Khan Tengri' }
    ],
    explain: { ky: 'Жеңиш — 7439 м, Ленин — 7134 м, Хан-Теңири — 6995 м.', ru: 'Победа — 7439 м, Ленина — 7134 м, Хан-Тенгри — 6995 м.', en: 'Victory 7439 m, Lenin 7134 m, Khan Tengri 6995 m.' }
  },
  {
    id: 'g-sort-02', skill: 'water', difficulty: 3, type: 'sort',
    prompt: { ky: 'Көлдөрдү аянты боюнча иреттеңиз (эң чоңунан баштап)', ru: 'Расставьте озёра по площади (от самого большого)', en: 'Order the lakes by area (largest first)' },
    items: [
      { ky: 'Ысык-Көл', ru: 'Иссык-Куль', en: 'Issyk-Kul' },
      { ky: 'Соң-Көл', ru: 'Сон-Куль', en: 'Son-Kul' },
      { ky: 'Чатыр-Көл', ru: 'Чатыр-Куль', en: 'Chatyr-Kul' }
    ],
    explain: { ky: 'Ысык-Көл ≈ 6236 км², Соң-Көл ≈ 270 км², Чатыр-Көл ≈ 175 км².', ru: 'Иссык-Куль ≈ 6236 км², Сон-Куль ≈ 270 км², Чатыр-Куль ≈ 175 км².', en: 'Issyk-Kul ≈ 6236 km², Son-Kul ≈ 270 km², Chatyr-Kul ≈ 175 km².' }
  },
  // ─── «Ошибка учителя» ────────────────────────────────────────────────────
  {
    id: 'g-err-01', skill: 'regions', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: 'Мугалим облустарды жана алардын жерлерин жазды. Кайсы сапта ката?', ru: 'Учитель выписал области и места в них. В какой строке ошибка?', en: 'The teacher listed regions and places in them. Which line is wrong?' },
    options: [
      { ky: 'Нарын облусу — Соң-Көл', ru: 'Нарынская область — Сон-Куль', en: 'Naryn region — Son-Kul' },
      { ky: 'Жалал-Абад облусу — Арстанбап', ru: 'Джалал-Абадская область — Арсланбоб', en: 'Jalal-Abad region — Arslanbob' },
      { ky: 'Талас облусу — Ысык-Көл', ru: 'Таласская область — Иссык-Куль', en: 'Talas region — Issyk-Kul' },
      { ky: 'Чүй облусу — Ала-Арча', ru: 'Чуйская область — Ала-Арча', en: 'Chui region — Ala-Archa' }
    ],
    correct: 2,
    explain: { ky: 'Ысык-Көл өзүнчө Ысык-Көл облусунда жайгашкан.', ru: 'Иссык-Куль находится в своей, Иссык-Кульской области.', en: 'Issyk-Kul lies in its own region, Issyk-Kul region.' }
  }
];
