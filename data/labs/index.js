/**
 * «Лаборатория» — опыты по научному методу: божомол → текшерүү → корутунду.
 *
 * Данные отдельно от игры. Каждый опыт:
 *   question   — исследовательский вопрос
 *   hypotheses — варианты гипотез (класс голосует до опыта)
 *   answer     — индекс верной гипотезы (открывается в конце)
 *   steps      — шаги опыта: задание + наблюдение, которое открывается после шага
 *   conclusion — научный вывод
 * Задания шагов привязаны к навыкам темы — ошибки идут в общую аналитику.
 */

const L = (ky, ru, en) => ({ ky, ru, en });

export const LABS = [
  {
    id: 'lab-ice',
    icon: '🧊',
    subject: 'physics',
    topic: 'physics-7-mechanics',
    title: L('Муз сууда чөгөбү?', 'Тонет ли лёд в воде?', 'Does ice sink in water?'),
    question: L('Муз сууга салынса эмне болот?', 'Что будет, если положить лёд в воду?', 'What happens if you put ice in water?'),
    hypotheses: [
      L('Муз калкып чыгат', 'Лёд будет плавать', 'The ice will float'),
      L('Муз түбүнө чөгөт', 'Лёд утонет', 'The ice will sink'),
      L('Муз ортодо илинип турат', 'Лёд зависнет посередине', 'The ice will hang in the middle')
    ],
    answer: 0,
    steps: [
      {
        id: 'lab-ice-1', skill: 'density', type: 'choice',
        prompt: L('Муздун тыгыздыгы ≈ 900 кг/м³, суунуку — 1000 кг/м³. Кайсынысы тыгызыраак?', 'Плотность льда ≈ 900 кг/м³, воды — 1000 кг/м³. Что плотнее?', 'Ice is ≈ 900 kg/m³, water is 1000 kg/m³. Which is denser?'),
        options: [L('Суу', 'Вода', 'Water'), L('Муз', 'Лёд', 'Ice'), L('Бирдей', 'Одинаково', 'The same')], correct: 0,
        explain: L('1000 > 900 — суу тыгызыраак.', '1000 > 900 — вода плотнее.', '1000 > 900 — water is denser.'),
        observation: L('Өлчөө: суу муздан тыгызыраак.', 'Измерение: вода плотнее льда.', 'Measurement: water is denser than ice.')
      },
      {
        id: 'lab-ice-2', skill: 'density', type: 'choice',
        prompt: L('Дененин тыгыздыгы суюктуктукунан аз болсо, дене эмне болот?', 'Если плотность тела меньше плотности жидкости, что с ним будет?', 'If a body is less dense than the liquid, what happens?'),
        options: [L('Калкып чыгат', 'Всплывёт', 'It floats'), L('Чөгөт', 'Утонет', 'It sinks'), L('Эрийт', 'Растворится', 'It dissolves')], correct: 0,
        explain: L('Архимед күчү салмактан чоң болуп, дене калкыйт.', 'Сила Архимеда больше веса — тело всплывает.', 'The buoyant force exceeds the weight, so it floats.'),
        observation: L('Эреже: тыгыздыгы аз денелер калкып чыгат.', 'Правило: тела с меньшей плотностью всплывают.', 'Rule: less dense bodies float.')
      },
      {
        id: 'lab-ice-3', skill: 'density', type: 'input', numeric: true,
        prompt: L('1 м³ муздун массасы канча кг? (ρ = 900 кг/м³)', 'Какова масса 1 м³ льда в кг? (ρ = 900 кг/м³)', 'What is the mass of 1 m³ of ice in kg? (ρ = 900 kg/m³)'),
        answer: ['900'],
        explain: L('m = ρ · V = 900 · 1 = 900 кг.', 'm = ρ · V = 900 · 1 = 900 кг.', 'm = ρ · V = 900 · 1 = 900 kg.'),
        observation: L('1 м³ муз ошол көлөмдөгү суудан 100 кг жеңил.', '1 м³ льда на 100 кг легче такого же объёма воды.', '1 m³ of ice is 100 kg lighter than the same volume of water.')
      }
    ],
    conclusion: L(
      'Муз калкыйт, анткени анын тыгыздыгы суунукунан аз. Ошондуктан кышында көлдөр үстүнөн тоңот, ал эми астындагы балыктар тирүү калат.',
      'Лёд плавает, потому что он менее плотный, чем вода. Поэтому зимой озёра замерзают сверху, а рыбы подо льдом остаются живы.',
      'Ice floats because it is less dense than water. That is why lakes freeze from the top and fish survive underneath.'
    )
  },
  {
    id: 'lab-rust',
    icon: '🔩',
    subject: 'chemistry',
    topic: 'chemistry-8-basics',
    title: L('Темир эмне үчүн дат басат?', 'Почему ржавеет железо?', 'Why does iron rust?'),
    question: L('Темир мык эмненин таасиринен дат басат?', 'Под действием чего ржавеет железный гвоздь?', 'What makes an iron nail rust?'),
    hypotheses: [
      L('Суу менен кычкылтектин', 'Воды и кислорода вместе', 'Water and oxygen together'),
      L('Жарыктын гана', 'Только света', 'Light only'),
      L('Суук абанын гана', 'Только холода', 'Cold air only'),
      L('Чаңдын', 'Пыли', 'Dust')
    ],
    answer: 0,
    steps: [
      {
        id: 'lab-rust-1', skill: 'phenomena', type: 'choice',
        prompt: L('Дат басуу — кандай кубулуш?', 'Ржавление — это какое явление?', 'What kind of phenomenon is rusting?'),
        options: [L('Химиялык', 'Химическое', 'Chemical'), L('Физикалык', 'Физическое', 'Physical')], correct: 0,
        explain: L('Жаңы зат — дат пайда болот, демек химиялык.', 'Образуется новое вещество — ржавчина, значит явление химическое.', 'A new substance forms — rust — so it is chemical.'),
        observation: L('1-пробирка (суу + аба): мык бир жумада дат басты.', 'Пробирка 1 (вода + воздух): гвоздь заржавел за неделю.', 'Tube 1 (water + air): the nail rusted within a week.')
      },
      {
        id: 'lab-rust-2', skill: 'phenomena', type: 'choice',
        prompt: L('Кургак абадагы (суусуз) мык дат басабы?', 'Заржавеет ли гвоздь в сухом воздухе (без воды)?', 'Will a nail rust in dry air (no water)?'),
        options: [L('Жок, дээрлик басбайт', 'Нет, почти не заржавеет', 'No, hardly at all'), L('Ооба, тез басат', 'Да, быстро', 'Yes, quickly')], correct: 0,
        explain: L('Суу жок болсо, дат дээрлик пайда болбойт.', 'Без воды ржавчина почти не образуется.', 'Without water, rust hardly forms.'),
        observation: L('2-пробирка (кургак аба): мык жаркырак бойдон калды.', 'Пробирка 2 (сухой воздух): гвоздь остался блестящим.', 'Tube 2 (dry air): the nail stayed shiny.')
      },
      {
        id: 'lab-rust-3', skill: 'phenomena', type: 'choice',
        prompt: L('Кайнатылган суу (кычкылтек жок), үстү май менен жабылган. Мык дат басабы?', 'Кипячёная вода (без кислорода) под слоем масла. Заржавеет ли гвоздь?', 'Boiled water (no oxygen) under a layer of oil. Will the nail rust?'),
        options: [L('Жок, дээрлик басбайт', 'Нет, почти не заржавеет', 'No, hardly at all'), L('Ооба, тез басат', 'Да, быстро', 'Yes, quickly')], correct: 0,
        explain: L('Кычкылтек жок болсо, темир дат баспайт.', 'Без кислорода железо не ржавеет.', 'Without oxygen iron does not rust.'),
        observation: L('3-пробирка (кычкылтексиз суу): мык дат баскан жок.', 'Пробирка 3 (вода без кислорода): гвоздь не заржавел.', 'Tube 3 (oxygen-free water): the nail did not rust.')
      }
    ],
    conclusion: L(
      'Темир суу жана кычкылтек бирге болгондо гана дат басат. Ошондуктан темирди боёп, майлап же цинк менен каптап коргойт.',
      'Железо ржавеет только при одновременном действии воды и кислорода. Поэтому его красят, смазывают или покрывают цинком.',
      'Iron rusts only when water and oxygen act together. That is why it is painted, oiled or zinc-coated.'
    )
  },
  {
    id: 'lab-light',
    icon: '🌱',
    subject: 'biology',
    topic: 'biology-6-plants',
    title: L('Өсүмдүккө жарык керекпи?', 'Нужен ли растению свет?', 'Do plants need light?'),
    question: L('Бир өсүмдүк жарыкта, экинчиси караңгыда турат. Бир жумадан кийин эмне болот?', 'Одно растение стоит на свету, другое — в темноте. Что будет через неделю?', 'One plant stands in the light, another in the dark. What happens after a week?'),
    hypotheses: [
      L('Караңгыдагысы саргайып, начарлайт', 'Растение в темноте пожелтеет и ослабнет', 'The one in the dark turns yellow and weakens'),
      L('Экөө бирдей өсөт', 'Оба вырастут одинаково', 'Both grow the same'),
      L('Караңгыдагысы жакшыраак өсөт', 'В темноте вырастет лучше', 'The one in the dark grows better')
    ],
    answer: 0,
    steps: [
      {
        id: 'lab-light-1', skill: 'photosynthesis', type: 'choice',
        prompt: L('Фотосинтезге энергияны эмне берет?', 'Что даёт энергию для фотосинтеза?', 'What gives energy for photosynthesis?'),
        options: [L('Жарык', 'Свет', 'Light'), L('Топурак', 'Почва', 'Soil'), L('Шамал', 'Ветер', 'Wind')], correct: 0,
        explain: L('Хлорофилл жарыктын энергиясын кармайт.', 'Хлорофилл улавливает энергию света.', 'Chlorophyll captures light energy.'),
        observation: L('3-күн: караңгыдагы өсүмдүктүн жалбырактары агара баштады.', 'День 3: у растения в темноте листья начали бледнеть.', 'Day 3: the leaves of the plant in the dark began to pale.')
      },
      {
        id: 'lab-light-2', skill: 'photosynthesis', type: 'choice',
        prompt: L('Хлорофилл кайсы түстө?', 'Какого цвета хлорофилл?', 'What colour is chlorophyll?'),
        options: [L('Жашыл', 'Зелёный', 'Green'), L('Кызыл', 'Красный', 'Red'), L('Көк', 'Синий', 'Blue')], correct: 0,
        explain: L('Жалбырактар жашыл, анткени аларда хлорофилл бар.', 'Листья зелёные, потому что в них хлорофилл.', 'Leaves are green because of chlorophyll.'),
        observation: L('5-күн: жарыктагы өсүмдүк жашыл, караңгыдагысы саргайды.', 'День 5: растение на свету зелёное, в темноте — пожелтело.', 'Day 5: the plant in the light is green; the one in the dark turned yellow.')
      },
      {
        id: 'lab-light-3', skill: 'photosynthesis', type: 'choice',
        prompt: L('Караңгыда өсүмдүк фотосинтез жасай алабы?', 'Может ли растение в темноте фотосинтезировать?', 'Can a plant photosynthesise in the dark?'),
        options: [L('Жок', 'Нет', 'No'), L('Ооба, күндүзгүдөй эле', 'Да, как днём', 'Yes, just like by day')], correct: 0,
        explain: L('Жарыксыз фотосинтез жүрбөйт.', 'Без света фотосинтез не идёт.', 'Without light there is no photosynthesis.'),
        observation: L('7-күн: караңгыдагы өсүмдүктүн сабагы ичке болуп, жарык издеп созулду.', 'День 7: стебель растения в темноте стал тонким и вытянулся в поисках света.', 'Day 7: the stem in the dark grew thin and long, searching for light.')
      }
    ],
    conclusion: L(
      'Өсүмдүккө жарык керек: жарыксыз фотосинтез жүрбөйт, хлорофилл бузулуп, өсүмдүк саргаят жана алсырайт.',
      'Растению нужен свет: без него нет фотосинтеза, хлорофилл разрушается, растение желтеет и слабеет.',
      'Plants need light: without it there is no photosynthesis, chlorophyll breaks down and the plant yellows and weakens.'
    )
  }
];

export const getLab = (id) => LABS.find((l) => l.id === id) || null;
export const labsFor = (subjectId) => LABS.filter((l) => !subjectId || l.subject === subjectId);

/** Шаг опыта по id — для разбора ошибок на странице прогресса */
export function findLabStep(id) {
  for (const lab of LABS) {
    const step = lab.steps.find((s) => s.id === id);
    if (step) return { ...step, lab };
  }
  return null;
}
