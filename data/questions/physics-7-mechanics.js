/** Физика, 7-класс — Механиканын негиздери / Основы механики */
const L = (ky, ru, en) => ({ ky, ru, en });

export default [
  {
    id: 'ph01', skill: 'motion', difficulty: 1, type: 'choice',
    prompt: L('Ылдамдык кайсы формула менен табылат?', 'По какой формуле находят скорость?', 'Which formula gives speed?'),
    options: ['v = s / t', 'v = s · t', 'v = t / s', 'v = m / V'], correct: 0,
    explain: L('Ылдамдык = жол : убакыт.', 'Скорость = путь : время.', 'Speed = distance ÷ time.')
  },
  {
    id: 'ph02', skill: 'motion', difficulty: 1, type: 'input', numeric: true,
    prompt: L('Машина 2 саатта 120 км жүрдү. Ылдамдыгы канча км/саат?', 'Машина проехала 120 км за 2 часа. Какова скорость в км/ч?', 'A car travels 120 km in 2 hours. What is its speed in km/h?'),
    answer: ['60'],
    explain: L('120 : 2 = 60 км/саат.', '120 : 2 = 60 км/ч.', '120 ÷ 2 = 60 km/h.')
  },
  {
    id: 'ph03', skill: 'motion', difficulty: 2, type: 'input', numeric: true,
    prompt: L('Велосипедчи 5 м/с ылдамдык менен 10 секунд жүрдү. Канча метр жол басты?', 'Велосипедист ехал 10 с со скоростью 5 м/с. Какой путь он проехал (в метрах)?', 'A cyclist rides at 5 m/s for 10 s. How many metres does he cover?'),
    answer: ['50'],
    explain: L('s = v · t = 5 · 10 = 50 м.', 's = v · t = 5 · 10 = 50 м.', 's = v · t = 5 · 10 = 50 m.')
  },
  {
    id: 'ph04', skill: 'force', difficulty: 1, type: 'choice',
    prompt: L('Күчтүн өлчөө бирдиги кайсы?', 'В каких единицах измеряется сила?', 'What is the unit of force?'),
    options: [L('Ньютон', 'Ньютон', 'Newton'), L('Килограмм', 'Килограмм', 'Kilogram'), L('Паскаль', 'Паскаль', 'Pascal'), L('Джоуль', 'Джоуль', 'Joule')], correct: 0,
    explain: L('Күч ньютон (Н) менен өлчөнөт.', 'Сила измеряется в ньютонах (Н).', 'Force is measured in newtons (N).')
  },
  {
    id: 'ph05', skill: 'force', difficulty: 1, type: 'choice',
    prompt: L('Күчтү кайсы прибор менен өлчөйт?', 'Каким прибором измеряют силу?', 'Which instrument measures force?'),
    options: [L('Динамометр', 'Динамометр', 'Dynamometer'), L('Термометр', 'Термометр', 'Thermometer'), L('Барометр', 'Барометр', 'Barometer'), L('Спидометр', 'Спидометр', 'Speedometer')], correct: 0,
    explain: L('Динамометр — пружиналуу күч өлчөгүч.', 'Динамометр — пружинный измеритель силы.', 'A dynamometer is a spring force meter.')
  },
  {
    id: 'ph06', skill: 'force', difficulty: 2, type: 'input', numeric: true,
    prompt: L('Массасы 2 кг дененин салмагы канча ньютон? (g = 10 Н/кг)', 'Каков вес тела массой 2 кг в ньютонах? (g = 10 Н/кг)', 'What is the weight of a 2 kg body in newtons? (g = 10 N/kg)'),
    answer: ['20'],
    explain: L('P = m · g = 2 · 10 = 20 Н.', 'P = m · g = 2 · 10 = 20 Н.', 'P = m · g = 2 · 10 = 20 N.')
  },
  {
    id: 'ph07', skill: 'density', difficulty: 2, type: 'choice',
    prompt: L('Тыгыздык кайсы формула менен эсептелет?', 'По какой формуле вычисляют плотность?', 'Which formula gives density?'),
    options: ['ρ = m / V', 'ρ = m · V', 'ρ = V / m', 'ρ = F / S'], correct: 0,
    explain: L('Тыгыздык = масса : көлөм.', 'Плотность = масса : объём.', 'Density = mass ÷ volume.')
  },
  {
    id: 'ph08', skill: 'density', difficulty: 2, type: 'choice',
    prompt: L('Суунун тыгыздыгы болжол менен канча?', 'Какова плотность воды?', 'What is the density of water?'),
    options: ['1000 кг/м³', '100 кг/м³', '10 кг/м³', '7800 кг/м³'], correct: 0,
    explain: L('Суу — 1000 кг/м³ (1 литр суу ≈ 1 кг). 7800 кг/м³ — болот.', 'Вода — 1000 кг/м³ (1 литр ≈ 1 кг). 7800 кг/м³ — сталь.', 'Water is 1000 kg/m³ (1 litre ≈ 1 kg); 7800 kg/m³ is steel.')
  },
  {
    id: 'ph09', skill: 'units', difficulty: 1, type: 'sort',
    prompt: L('Узундук бирдиктерин кичинесинен чоңуна карай иреттеңиз', 'Расставьте единицы длины от меньшей к большей', 'Order the units of length from smallest to largest'),
    items: ['мм', 'см', 'дм', 'м', 'км'],
    explain: L('1 см = 10 мм, 1 дм = 10 см, 1 м = 10 дм, 1 км = 1000 м.', '1 см = 10 мм, 1 дм = 10 см, 1 м = 10 дм, 1 км = 1000 м.', '1 cm = 10 mm, 1 dm = 10 cm, 1 m = 10 dm, 1 km = 1000 m.')
  },
  {
    id: 'ph10', skill: 'units', difficulty: 2, type: 'match',
    prompt: L('Чоңдукту анын бирдиги менен жупташтырыңыз', 'Соедините величину с единицей измерения', 'Match each quantity with its unit'),
    pairs: [[L('Масса', 'Масса', 'Mass'), 'кг'], [L('Басым', 'Давление', 'Pressure'), 'Па'], [L('Убакыт', 'Время', 'Time'), 'с']],
    explain: L('Масса — килограмм, басым — паскаль, убакыт — секунд.', 'Масса — килограмм, давление — паскаль, время — секунда.', 'Mass — kilogram, pressure — pascal, time — second.')
  },
  {
    id: 'ph-err-01', skill: 'motion', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: L('Маселе: s = 100 м, t = 20 с. Ылдамдыкты тап. Кайсы сапта ката?', 'Задача: s = 100 м, t = 20 с. Найти скорость. Где ошибка?', 'Problem: s = 100 m, t = 20 s. Find the speed. Where is the mistake?'),
    options: ['s = 100 м, t = 20 с', 'v = s · t', 'v = 2000 м/с'],
    correct: 1,
    explain: L('Ылдамдык = жол : убакыт: v = 100 : 20 = 5 м/с.', 'Скорость = путь : время: v = 100 : 20 = 5 м/с.', 'Speed = distance ÷ time: v = 100 ÷ 20 = 5 m/s.')
  }
];
