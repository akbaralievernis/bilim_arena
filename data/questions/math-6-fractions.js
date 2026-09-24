/**
 * Математика, 6-класс — Бөлчөктөр (дроби).
 *
 * Формат вопроса:
 *   id         — уникальный в рамках темы
 *   skill      — навык из curriculum.js (по нему разбираются ошибки)
 *   difficulty — 1 лёгкий, 2 средний, 3 сложный
 *   type       — 'choice' (варианты) | 'input' (ввод) | 'truefalse'
 *   prompt     — текст вопроса на трёх языках
 *   options    — варианты (для choice). correct — индекс правильного
 *   explain    — короткое объяснение, показывается после ответа
 */
export default [
  {
    id: 'f01', skill: 'compare', difficulty: 1, type: 'choice',
    prompt: { ky: 'Кайсы бөлчөк чоң: 3/5 же 2/5?', ru: 'Какая дробь больше: 3/5 или 2/5?', en: 'Which fraction is greater: 3/5 or 2/5?' },
    options: ['3/5', '2/5', { ky: 'Тең', ru: 'Равны', en: 'Equal' }, { ky: 'Салыштырууга болбойт', ru: 'Нельзя сравнить', en: 'Cannot compare' }], correct: 0,
    explain: {
      ky: 'Бөлүмдөрү бирдей болсо, алымы чоң бөлчөк чоң болот.',
      ru: 'При одинаковых знаменателях больше та дробь, у которой больше числитель.',
      en: 'With equal denominators, the fraction with the bigger numerator is greater.'
    }
  },
  {
    id: 'f02', skill: 'compare', difficulty: 1, type: 'choice',
    prompt: { ky: '1/2 жана 3/4 — кайсынысы чоң?', ru: 'Что больше: 1/2 или 3/4?', en: 'Which is greater: 1/2 or 3/4?' },
    options: ['3/4', '1/2', { ky: 'Тең', ru: 'Равны', en: 'Equal' }, { ky: 'Салыштырууга болбойт', ru: 'Нельзя сравнить', en: 'Cannot compare' }], correct: 0,
    explain: {
      ky: '1/2 = 2/4, ал эми 3/4 > 2/4.',
      ru: '1/2 = 2/4, а 3/4 больше 2/4.',
      en: '1/2 equals 2/4, and 3/4 is greater than 2/4.'
    }
  },
  {
    id: 'f03', skill: 'compare', difficulty: 2, type: 'choice',
    prompt: { ky: 'Кайсы бөлчөк кичине: 2/3 же 5/6?', ru: 'Какая дробь меньше: 2/3 или 5/6?', en: 'Which fraction is smaller: 2/3 or 5/6?' },
    options: ['2/3', '5/6', { ky: 'Тең', ru: 'Равны', en: 'Equal' }, { ky: 'Салыштырууга болбойт', ru: 'Нельзя сравнить', en: 'Cannot compare' }], correct: 0,
    explain: {
      ky: '2/3 = 4/6, 4/6 < 5/6.',
      ru: '2/3 = 4/6, а 4/6 меньше 5/6.',
      en: '2/3 = 4/6, and 4/6 is less than 5/6.'
    }
  },
  {
    id: 'f04', skill: 'compare', difficulty: 2, type: 'choice',
    prompt: { ky: 'Кайсы чоң: 7/10 же 3/4?', ru: 'Что больше: 7/10 или 3/4?', en: 'Which is greater: 7/10 or 3/4?' },
    options: ['3/4', '7/10', { ky: 'Тең', ru: 'Равны', en: 'Equal' }, { ky: 'Салыштырууга болбойт', ru: 'Нельзя сравнить', en: 'Cannot compare' }], correct: 0,
    explain: {
      ky: '7/10 = 14/20, 3/4 = 15/20. Демек 3/4 чоң.',
      ru: '7/10 = 14/20, 3/4 = 15/20. Значит, 3/4 больше.',
      en: '7/10 = 14/20 and 3/4 = 15/20, so 3/4 is greater.'
    }
  },
  {
    id: 'f05', skill: 'compare', difficulty: 1, type: 'choice',
    prompt: { ky: '5/8 менен 1/2 салыштырыңыз', ru: 'Сравните 5/8 и 1/2', en: 'Compare 5/8 and 1/2' },
    options: ['5/8 > 1/2', '5/8 < 1/2', '5/8 = 1/2', { ky: 'Салыштырууга болбойт', ru: 'Нельзя сравнить', en: 'Cannot compare' }], correct: 0,
    explain: {
      ky: '1/2 = 4/8, 5/8 андан чоң.',
      ru: '1/2 = 4/8, а 5/8 больше.',
      en: '1/2 = 4/8, so 5/8 is bigger.'
    }
  },

  {
    id: 'f06', skill: 'common-denominator', difficulty: 1, type: 'choice',
    prompt: { ky: '1/4 жана 1/6 үчүн эң кичине жалпы бөлүм кайсы?', ru: 'Наименьший общий знаменатель для 1/4 и 1/6?', en: 'Least common denominator for 1/4 and 1/6?' },
    options: ['12', '24', '10', '6'], correct: 0,
    explain: {
      ky: '4 жана 6 сандарынын эң кичине жалпы эселиги — 12.',
      ru: 'Наименьшее общее кратное чисел 4 и 6 равно 12.',
      en: 'The least common multiple of 4 and 6 is 12.'
    }
  },
  {
    id: 'f07', skill: 'common-denominator', difficulty: 2, type: 'choice',
    prompt: { ky: '2/3 бөлчөгүн 12 бөлүмүнө келтириңиз', ru: 'Приведите 2/3 к знаменателю 12', en: 'Write 2/3 with denominator 12' },
    options: ['8/12', '6/12', '4/12', '9/12'], correct: 0,
    explain: {
      ky: '12 : 3 = 4, ошондуктан алымын да 4кө көбөйтөбүз: 2·4 = 8.',
      ru: '12 : 3 = 4, значит числитель тоже умножаем на 4: 2·4 = 8.',
      en: '12 ÷ 3 = 4, so multiply the numerator by 4 as well: 2·4 = 8.'
    }
  },
  {
    id: 'f08', skill: 'common-denominator', difficulty: 1, type: 'choice',
    prompt: { ky: '5 жана 10 сандарынын эң кичине жалпы эселиги', ru: 'Наименьшее общее кратное чисел 5 и 10', en: 'Least common multiple of 5 and 10' },
    options: ['10', '5', '50', '15'], correct: 0,
    explain: {
      ky: '10 саны 5ке бөлүнөт, демек ЭКЖЭ = 10.',
      ru: '10 делится на 5, поэтому НОК = 10.',
      en: '10 is divisible by 5, so the LCM is 10.'
    }
  },
  {
    id: 'f09', skill: 'common-denominator', difficulty: 3, type: 'choice',
    prompt: { ky: 'Кайсы сан 1/3 жана 1/4 үчүн жалпы бөлүм БОЛА АЛБАЙТ?', ru: 'Какое число НЕ может быть общим знаменателем для 1/3 и 1/4?', en: 'Which number can NOT be a common denominator for 1/3 and 1/4?' },
    options: ['10', '12', '24', '36'], correct: 0,
    explain: {
      ky: '10 саны 3кө бөлүнбөйт, ошондуктан жалпы бөлүм боло албайт.',
      ru: '10 не делится на 3, поэтому не может быть общим знаменателем.',
      en: '10 is not divisible by 3, so it cannot be a common denominator.'
    }
  },

  {
    id: 'f10', skill: 'add-sub', difficulty: 1, type: 'choice',
    prompt: { ky: '1/5 + 2/5 = ?', ru: '1/5 + 2/5 = ?', en: '1/5 + 2/5 = ?' },
    options: ['3/5', '3/10', '2/5', '1/5'], correct: 0,
    explain: {
      ky: 'Бөлүмдөр бирдей — алымдарын кошобуз: 1 + 2 = 3.',
      ru: 'Знаменатели одинаковые — складываем числители: 1 + 2 = 3.',
      en: 'Same denominators — just add the numerators: 1 + 2 = 3.'
    }
  },
  {
    id: 'f11', skill: 'add-sub', difficulty: 2, type: 'choice',
    prompt: { ky: '1/2 + 1/3 = ?', ru: '1/2 + 1/3 = ?', en: '1/2 + 1/3 = ?' },
    options: ['5/6', '2/5', '1/6', '2/6'], correct: 0,
    explain: {
      ky: 'Жалпы бөлүм 6: 3/6 + 2/6 = 5/6.',
      ru: 'Общий знаменатель 6: 3/6 + 2/6 = 5/6.',
      en: 'Common denominator 6: 3/6 + 2/6 = 5/6.'
    }
  },
  {
    id: 'f12', skill: 'add-sub', difficulty: 1, type: 'choice',
    prompt: { ky: '3/4 − 1/4 = ?', ru: '3/4 − 1/4 = ?', en: '3/4 − 1/4 = ?' },
    options: ['1/2', '2/4', '1/4', '3/8'], correct: 0,
    explain: {
      ky: '3/4 − 1/4 = 2/4, кыскартсак 1/2 болот.',
      ru: '3/4 − 1/4 = 2/4, после сокращения получается 1/2.',
      en: '3/4 − 1/4 = 2/4, which simplifies to 1/2.'
    }
  },
  {
    id: 'f13', skill: 'add-sub', difficulty: 2, type: 'choice',
    prompt: { ky: '5/6 − 1/3 = ?', ru: '5/6 − 1/3 = ?', en: '5/6 − 1/3 = ?' },
    options: ['1/2', '4/3', '1/3', '2/3'], correct: 0,
    explain: {
      ky: '1/3 = 2/6. 5/6 − 2/6 = 3/6 = 1/2.',
      ru: '1/3 = 2/6. Тогда 5/6 − 2/6 = 3/6 = 1/2.',
      en: '1/3 = 2/6, so 5/6 − 2/6 = 3/6 = 1/2.'
    }
  },
  {
    id: 'f14', skill: 'add-sub', difficulty: 2, type: 'choice',
    prompt: { ky: '2/3 + 1/6 = ?', ru: '2/3 + 1/6 = ?', en: '2/3 + 1/6 = ?' },
    options: ['5/6', '3/9', '1/2', '3/6'], correct: 0,
    explain: {
      ky: '2/3 = 4/6, анан 4/6 + 1/6 = 5/6.',
      ru: '2/3 = 4/6, затем 4/6 + 1/6 = 5/6.',
      en: '2/3 = 4/6, then 4/6 + 1/6 = 5/6.'
    }
  },
  {
    id: 'f15', skill: 'add-sub', difficulty: 3, type: 'input',
    prompt: { ky: '3/8 + 1/4 = ? (жоопту a/b түрүндө жазыңыз)', ru: '3/8 + 1/4 = ? (ответ в виде a/b)', en: '3/8 + 1/4 = ? (answer as a/b)' },
    answer: ['5/8'],
    explain: {
      ky: '1/4 = 2/8, демек 3/8 + 2/8 = 5/8.',
      ru: '1/4 = 2/8, поэтому 3/8 + 2/8 = 5/8.',
      en: '1/4 = 2/8, so 3/8 + 2/8 = 5/8.'
    }
  },

  {
    id: 'f16', skill: 'multiply-divide', difficulty: 1, type: 'choice',
    prompt: { ky: '1/2 × 2/3 = ?', ru: '1/2 × 2/3 = ?', en: '1/2 × 2/3 = ?' },
    options: ['1/3', '2/5', '3/4', '2/6'], correct: 0,
    explain: {
      ky: 'Алымдарды жана бөлүмдөрдү өз-өзүнчө көбөйтөбүз: 2/6 = 1/3.',
      ru: 'Числители и знаменатели перемножаем отдельно: 2/6 = 1/3.',
      en: 'Multiply numerators and denominators: 2/6 = 1/3.'
    }
  },
  {
    id: 'f17', skill: 'multiply-divide', difficulty: 2, type: 'choice',
    prompt: { ky: '3/4 × 2 = ?', ru: '3/4 × 2 = ?', en: '3/4 × 2 = ?' },
    options: ['3/2', '6/8', '3/8', '5/4'], correct: 0,
    explain: {
      ky: '3/4 × 2 = 6/4 = 3/2 (бул 1 1/2).',
      ru: '3/4 × 2 = 6/4 = 3/2 (то есть 1 1/2).',
      en: '3/4 × 2 = 6/4 = 3/2 (that is 1 1/2).'
    }
  },
  {
    id: 'f18', skill: 'multiply-divide', difficulty: 2, type: 'choice',
    prompt: { ky: '1/2 : 1/4 = ?', ru: '1/2 : 1/4 = ?', en: '1/2 ÷ 1/4 = ?' },
    options: ['2', '1/8', '1/2', '4'], correct: 0,
    explain: {
      ky: 'Бөлүү — тескери бөлчөккө көбөйтүү: 1/2 × 4/1 = 2.',
      ru: 'Деление — это умножение на перевёрнутую дробь: 1/2 × 4 = 2.',
      en: 'Dividing means multiplying by the reciprocal: 1/2 × 4 = 2.'
    }
  },
  {
    id: 'f19', skill: 'multiply-divide', difficulty: 2, type: 'choice',
    prompt: { ky: '2/5 : 2 = ?', ru: '2/5 : 2 = ?', en: '2/5 ÷ 2 = ?' },
    options: ['1/5', '4/5', '2/10', '5/2'], correct: 0,
    explain: {
      ky: '2/5 : 2 = 2/10 = 1/5.',
      ru: '2/5 : 2 = 2/10 = 1/5.',
      en: '2/5 ÷ 2 = 2/10 = 1/5.'
    }
  },
  {
    id: 'f20', skill: 'multiply-divide', difficulty: 3, type: 'choice',
    prompt: { ky: '2/3 × 3/4 = ?', ru: '2/3 × 3/4 = ?', en: '2/3 × 3/4 = ?' },
    options: ['1/2', '6/7', '5/12', '6/12'], correct: 0,
    explain: {
      ky: '2×3 = 6, 3×4 = 12, 6/12 = 1/2.',
      ru: '2×3 = 6, 3×4 = 12, значит 6/12 = 1/2.',
      en: '2×3 = 6 and 3×4 = 12, so 6/12 = 1/2.'
    }
  },
  // ─── «Ошибка учителя»: найдите неверную строку решения ────────────────────
  {
    id: 'f-err-01', skill: 'add-sub', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: 'Мугалим 1/2 + 1/3 эсептеди. Кайсы сапта ката бар?', ru: 'Учитель вычислил 1/2 + 1/3. В какой строке ошибка?', en: 'The teacher computed 1/2 + 1/3. Which line has the mistake?' },
    options: [
      { ky: 'Жалпы бөлүм — 6', ru: 'Общий знаменатель — 6', en: 'Common denominator is 6' },
      '1/2 = 3/6,  1/3 = 2/6',
      '3/6 + 2/6 = 5/12'
    ],
    correct: 2,
    explain: { ky: 'Бөлүмдөр кошулбайт: 3/6 + 2/6 = 5/6.', ru: 'Знаменатели не складываются: 3/6 + 2/6 = 5/6.', en: 'Denominators are not added: 3/6 + 2/6 = 5/6.' }
  },
  {
    id: 'f-err-02', skill: 'compare', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: 'Мугалим 2/3 менен 3/4ту салыштырды. Ката кайсы сапта?', ru: 'Учитель сравнил 2/3 и 3/4. Где ошибка?', en: 'The teacher compared 2/3 and 3/4. Where is the mistake?' },
    options: ['2/3 = 8/12', '3/4 = 9/12', '8/12 > 9/12  ⇒  2/3 > 3/4'],
    correct: 2,
    explain: { ky: '8/12 < 9/12, демек 2/3 < 3/4.', ru: '8/12 < 9/12, значит 2/3 < 3/4.', en: '8/12 < 9/12, so 2/3 < 3/4.' }
  },
  {
    id: 'f-err-03', skill: 'multiply-divide', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: '2/5 × 3 чечилди. Кайсы сапта ката бар?', ru: 'Решили 2/5 × 3. В какой строке ошибка?', en: '2/5 × 3 was solved. Which line is wrong?' },
    options: ['3 = 3/1', '2/5 × 3/1 = 6/15', { ky: 'Жооп: 1 1/5', ru: 'Ответ: 1 1/5', en: 'Answer: 1 1/5' }],
    correct: 1,
    explain: { ky: 'Бөлүмдөр: 5 × 1 = 5, демек 6/5 болот, 6/15 эмес.', ru: 'Знаменатели: 5 × 1 = 5, получается 6/5, а не 6/15.', en: 'Denominators: 5 × 1 = 5, so it is 6/5, not 6/15.' }
  },
  {
    id: 'f-err-04', skill: 'multiply-divide', difficulty: 3, type: 'choice', errorHunt: true,
    prompt: { ky: '1/2 : 1/4 чечилди. Ката кайсы сапта?', ru: 'Решили 1/2 : 1/4. Где ошибка?', en: '1/2 ÷ 1/4 was solved. Where is the mistake?' },
    options: [
      { ky: 'Бөлүү — тескери бөлчөккө көбөйтүү', ru: 'Деление — умножение на перевёрнутую дробь', en: 'Division means multiplying by the reciprocal' },
      '1/2 × 4/1 = 4/2',
      '4/2 = 1/2'
    ],
    correct: 2,
    explain: { ky: '4/2 = 2, 1/2 эмес.', ru: '4/2 = 2, а не 1/2.', en: '4/2 = 2, not 1/2.' }
  }
];
