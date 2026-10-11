/** Химия, 8-класс — Химиянын баштапкы түшүнүктөрү / Первоначальные понятия */
const L = (ky, ru, en) => ({ ky, ru, en });

export default [
  {
    id: 'ch01', skill: 'symbols', difficulty: 1, type: 'choice',
    prompt: L('Суунун формуласы кандай?', 'Какова формула воды?', 'What is the formula of water?'),
    options: ['H₂O', 'CO₂', 'O₂', 'NaCl'], correct: 0,
    explain: L('Суу — эки суутек жана бир кычкылтек атому: H₂O.', 'Вода — два атома водорода и один кислорода: H₂O.', 'Water: two hydrogen atoms and one oxygen: H₂O.')
  },
  {
    id: 'ch02', skill: 'symbols', difficulty: 1, type: 'match',
    prompt: L('Белгини элемент менен жупташтырыңыз', 'Соедините символ с элементом', 'Match each symbol with its element'),
    pairs: [['O', L('Кычкылтек', 'Кислород', 'Oxygen')], ['Fe', L('Темир', 'Железо', 'Iron')], ['Na', L('Натрий', 'Натрий', 'Sodium')]],
    explain: L('O — кычкылтек, Fe — темир (ferrum), Na — натрий (natrium).', 'O — кислород, Fe — железо (ferrum), Na — натрий (natrium).', 'O — oxygen, Fe — iron (ferrum), Na — sodium (natrium).')
  },
  {
    id: 'ch03', skill: 'symbols', difficulty: 1, type: 'choice',
    prompt: L('Химиялык элементтердин мезгилдик системасын ким түзгөн?', 'Кто создал периодическую систему химических элементов?', 'Who created the periodic table of elements?'),
    options: ['Д. И. Менделеев', 'М. В. Ломоносов', 'И. Ньютон', 'А. Эйнштейн'], correct: 0,
    explain: L('Менделеев 1869-жылы мезгилдик законду ачкан.', 'Менделеев открыл периодический закон в 1869 году.', 'Mendeleev discovered the periodic law in 1869.')
  },
  {
    id: 'ch04', skill: 'formulas', difficulty: 2, type: 'input', numeric: true,
    prompt: L('H₂SO₄ молекуласында бардыгы канча атом бар?', 'Сколько всего атомов в молекуле H₂SO₄?', 'How many atoms in total are in H₂SO₄?'),
    answer: ['7'],
    explain: L('2 (H) + 1 (S) + 4 (O) = 7.', '2 (H) + 1 (S) + 4 (O) = 7.', '2 (H) + 1 (S) + 4 (O) = 7.')
  },
  {
    id: 'ch05', skill: 'formulas', difficulty: 2, type: 'input', numeric: true,
    prompt: L('H₂Oнун салыштырмалуу молекулалык массасы канча? (H = 1, O = 16)', 'Какова относительная молекулярная масса H₂O? (H = 1, O = 16)', 'What is the relative molecular mass of H₂O? (H = 1, O = 16)'),
    answer: ['18'],
    explain: L('2 · 1 + 16 = 18.', '2 · 1 + 16 = 18.', '2 · 1 + 16 = 18.')
  },
  {
    id: 'ch06', skill: 'formulas', difficulty: 1, type: 'choice',
    prompt: L('Ашкана тузунун формуласы кайсы?', 'Какая формула у поваренной соли?', 'What is the formula of table salt?'),
    options: ['NaCl', 'H₂O', 'CO₂', 'CaCO₃'], correct: 0,
    explain: L('Ашкана тузу — натрий хлориди, NaCl.', 'Поваренная соль — хлорид натрия, NaCl.', 'Table salt is sodium chloride, NaCl.')
  },
  {
    id: 'ch07', skill: 'phenomena', difficulty: 1, type: 'choice',
    prompt: L('Кайсынысы химиялык кубулуш?', 'Какое явление химическое?', 'Which is a chemical phenomenon?'),
    options: [L('Отундун күйүшү', 'Горение дров', 'Burning wood'), L('Муздун эриши', 'Таяние льда', 'Melting ice'), L('Суунун бууланышы', 'Испарение воды', 'Water evaporating'), L('Айнектин сынышы', 'Разбивание стекла', 'Breaking glass')], correct: 0,
    explain: L('Күйгөндө жаңы заттар пайда болот — бул химиялык кубулуш.', 'При горении образуются новые вещества — это химическое явление.', 'Burning forms new substances — a chemical change.')
  },
  {
    id: 'ch08', skill: 'phenomena', difficulty: 2, type: 'multiple',
    prompt: L('Физикалык кубулуштарды тандаңыз', 'Выберите физические явления', 'Choose the physical phenomena'),
    options: [L('Муздун эриши', 'Таяние льда', 'Melting ice'), L('Кантты сууда эритүү', 'Растворение сахара в воде', 'Dissolving sugar in water'), L('Темирдин датташы', 'Ржавление железа', 'Iron rusting'), L('Сүттүн ачышы', 'Скисание молока', 'Milk turning sour')],
    correct: [0, 1],
    explain: L('Муз жана кант өз курамын сактайт. Дат жана ачыган сүт — жаңы заттар, демек химиялык.', 'Лёд и сахар сохраняют состав. Ржавчина и прокисание дают новые вещества — это химия.', 'Ice and sugar keep their composition; rust and sour milk are new substances — chemical.')
  },
  {
    id: 'ch09', skill: 'phenomena', difficulty: 2, type: 'choice',
    prompt: L('Аба эмне?', 'Что такое воздух?', 'What is air?'),
    options: [L('Газдардын аралашмасы', 'Смесь газов', 'A mixture of gases'), L('Таза зат', 'Чистое вещество', 'A pure substance'), L('Бир элемент', 'Один элемент', 'A single element'), L('Суюктук', 'Жидкость', 'A liquid')], correct: 0,
    explain: L('Аба — азот (~78%), кычкылтек (~21%) жана башка газдардын аралашмасы.', 'Воздух — смесь азота (~78%), кислорода (~21%) и других газов.', 'Air is a mixture of nitrogen (~78%), oxygen (~21%) and other gases.')
  },
  {
    id: 'ch10', skill: 'formulas', difficulty: 2, type: 'choice',
    prompt: L('CO₂ кандай аталат?', 'Как называется CO₂?', 'What is CO₂ called?'),
    options: [L('Көмүр кычкыл газы', 'Углекислый газ', 'Carbon dioxide'), L('Ис газы', 'Угарный газ', 'Carbon monoxide'), L('Кычкылтек', 'Кислород', 'Oxygen'), L('Метан', 'Метан', 'Methane')], correct: 0,
    explain: L('CO₂ — көмүр кычкыл газы: биз аны дем чыгарабыз, өсүмдүктөр сиңирет.', 'CO₂ — углекислый газ: мы его выдыхаем, растения поглощают.', 'CO₂ is carbon dioxide: we breathe it out, plants absorb it.')
  },
  {
    id: 'ch-err-01', skill: 'formulas', difficulty: 3, type: 'choice', errorHunt: true,
    prompt: L('CO₂нун молекулалык массасы эсептелди. Ката кайсы сапта?', 'Посчитали молекулярную массу CO₂. Где ошибка?', 'The molecular mass of CO₂ was computed. Where is the mistake?'),
    options: ['Ar(C) = 12', 'Ar(O) = 16', 'Mr(CO₂) = 12 + 16 = 28'],
    correct: 2,
    explain: L('Кычкылтек эки атом: 12 + 2 · 16 = 44.', 'Атомов кислорода два: 12 + 2 · 16 = 44.', 'There are two oxygen atoms: 12 + 2 · 16 = 44.')
  },
  {
    id: "ch11", skill: "symbols", difficulty: 1, type: "choice",
    prompt: {"ky": "«Fe» символу кайсы элементти билдирет?", "ru": "Какой элемент обозначает символ «Fe»?", "en": "Which element has the symbol \"Fe\"?"},
    options: [
      {"ky": "Темир", "ru": "Железо", "en": "Iron"},
      {"ky": "Фтор", "ru": "Фтор", "en": "Fluorine"},
      {"ky": "Фосфор", "ru": "Фосфор", "en": "Phosphorus"},
      {"ky": "Күмүш", "ru": "Серебро", "en": "Silver"}
    ], correct: 0,
    explain: {"ky": "Fe — латынча ferrum, б.а. темир.", "ru": "Fe — от латинского ferrum, железо.", "en": "Fe comes from the Latin \"ferrum\", iron."}
  },
  {
    id: "ch12", skill: "symbols", difficulty: 1, type: "choice",
    prompt: {"ky": "Натрийдин химиялык символу кайсы?", "ru": "Какой химический символ у натрия?", "en": "What is the chemical symbol for sodium?"},
    options: [
      "Na",
      "N",
      "Ne",
      "S"
    ], correct: 0,
    explain: {"ky": "Na — латынча natrium.", "ru": "Na — от латинского natrium.", "en": "Na comes from the Latin \"natrium\"."}
  },
  {
    id: "ch13", skill: "symbols", difficulty: 2, type: "choice",
    prompt: {"ky": "Кайсы элемент асыл (инерттүү) газ?", "ru": "Какой элемент — благородный (инертный) газ?", "en": "Which element is a noble (inert) gas?"},
    options: [
      {"ky": "Гелий", "ru": "Гелий", "en": "Helium"},
      {"ky": "Кычкылтек", "ru": "Кислород", "en": "Oxygen"},
      {"ky": "Азот", "ru": "Азот", "en": "Nitrogen"},
      {"ky": "Хлор", "ru": "Хлор", "en": "Chlorine"}
    ], correct: 0,
    explain: {"ky": "Гелий башка заттар менен дээрлик реакцияга кирбейт.", "ru": "Гелий почти не вступает в реакции.", "en": "Helium hardly reacts with anything."}
  },
  {
    id: "ch14", skill: "formulas", difficulty: 1, type: "choice",
    prompt: {"ky": "Суунун химиялык формуласы кайсы?", "ru": "Какая химическая формула у воды?", "en": "What is the chemical formula of water?"},
    options: [
      "H₂O",
      "CO₂",
      "O₂",
      "NaCl"
    ], correct: 0,
    explain: {"ky": "Суу молекуласы: 2 суутек жана 1 кычкылтек атому.", "ru": "Молекула воды: 2 атома водорода и 1 атом кислорода.", "en": "A water molecule has 2 hydrogen atoms and 1 oxygen atom."}
  },
  {
    id: "ch15", skill: "formulas", difficulty: 2, type: "choice",
    prompt: {"ky": "Ашкана тузунун химиялык формуласы кайсы?", "ru": "Какая формула у поваренной соли?", "en": "What is the formula of table salt?"},
    options: [
      "NaCl",
      "KCl",
      "CaCO₃",
      "H₂O"
    ], correct: 0,
    explain: {"ky": "Ашкана тузу — натрий хлориди, NaCl.", "ru": "Поваренная соль — хлорид натрия, NaCl.", "en": "Table salt is sodium chloride, NaCl."}
  },
  {
    id: "ch16", skill: "formulas", difficulty: 2, type: "input", numeric: true,
    prompt: {"ky": "H₂SO₄ молекуласында канча кычкылтек атому бар?", "ru": "Сколько атомов кислорода в молекуле H₂SO₄?", "en": "How many oxygen atoms are in a molecule of H₂SO₄?"},
    answer: ["4"],
    explain: {"ky": "O₄ — төрт кычкылтек атому.", "ru": "O₄ — четыре атома кислорода.", "en": "O₄ means four oxygen atoms."}
  },
  {
    id: "ch17", skill: "formulas", difficulty: 3, type: "input", numeric: true,
    prompt: {"ky": "CO₂ молекуласында бардыгы канча атом бар?", "ru": "Сколько всего атомов в молекуле CO₂?", "en": "How many atoms in total are in a molecule of CO₂?"},
    answer: ["3"],
    explain: {"ky": "1 көмүртек + 2 кычкылтек = 3 атом.", "ru": "1 углерод + 2 кислорода = 3 атома.", "en": "1 carbon + 2 oxygen = 3 atoms."}
  },
  {
    id: "ch18", skill: "phenomena", difficulty: 1, type: "choice",
    prompt: {"ky": "Кайсысы химиялык кубулуш?", "ru": "Какое явление — химическое?", "en": "Which of these is a chemical change?"},
    options: [
      {"ky": "Темирдин дат басышы", "ru": "Ржавление железа", "en": "Iron rusting"},
      {"ky": "Муздун эриши", "ru": "Таяние льда", "en": "Ice melting"},
      {"ky": "Суунун кайнашы", "ru": "Кипение воды", "en": "Water boiling"},
      {"ky": "Айнектин сынышы", "ru": "Разбивание стекла", "en": "Glass breaking"}
    ], correct: 0,
    explain: {"ky": "Датта жаңы зат пайда болот, калгандарында зат ошол эле бойдон калат.", "ru": "При ржавлении образуется новое вещество, в остальных случаях вещество то же.", "en": "Rust is a new substance; in the others the substance stays the same."}
  },
  {
    id: "ch19", skill: "phenomena", difficulty: 2, type: "multiple",
    prompt: {"ky": "Химиялык реакция жүргөнүн эмнеден билүүгө болот?", "ru": "По каким признакам видно, что идёт химическая реакция?", "en": "Which signs show that a chemical reaction is happening?"},
    options: [
      {"ky": "Газ бөлүнөт", "ru": "Выделяется газ", "en": "A gas is given off"},
      {"ky": "Түсү өзгөрөт", "ru": "Меняется цвет", "en": "The colour changes"},
      {"ky": "Чөкмө пайда болот", "ru": "Выпадает осадок", "en": "A precipitate forms"},
      {"ky": "Нерсенин формасы гана өзгөрөт", "ru": "Меняется только форма предмета", "en": "Only the shape changes"}
    ], correct: [0, 1, 2],
    explain: {"ky": "Форманын өзгөрүшү — физикалык кубулуш.", "ru": "Изменение формы — физическое явление.", "en": "A change of shape is a physical change."}
  }
];
