/** Информатика, 7-класс — Алгоритмдин негиздери */
export default [
  {
    id: 'a01', skill: 'sequence', difficulty: 1, type: 'choice',
    prompt: { ky: 'Алгоритм деген эмне?', ru: 'Что такое алгоритм?', en: 'What is an algorithm?' },
    options: [
      { ky: 'Максатка жеткирүүчү так кадамдардын ырааттуулугу', ru: 'Чёткая последовательность шагов для решения задачи', en: 'A clear sequence of steps that solves a task' },
      { ky: 'Компьютердин бөлүгү', ru: 'Часть компьютера', en: 'A part of a computer' },
      { ky: 'Программалоо тили', ru: 'Язык программирования', en: 'A programming language' },
      { ky: 'Файлдын түрү', ru: 'Тип файла', en: 'A file type' }
    ], correct: 0,
    explain: { ky: 'Алгоритм — кадам-кадам менен аткарылуучу так көрсөтмө.', ru: 'Алгоритм — точная пошаговая инструкция.', en: 'An algorithm is a precise step-by-step instruction.' }
  },
  {
    id: 'a02', skill: 'sequence', difficulty: 1, type: 'choice',
    prompt: { ky: 'Кадамдардын тартиби өзгөрсө, натыйжа өзгөрөбү?', ru: 'Изменится ли результат, если поменять порядок шагов?', en: 'Does the result change if you swap the steps?' },
    options: [
      { ky: 'Ооба, көпчүлүк учурда өзгөрөт', ru: 'Да, в большинстве случаев изменится', en: 'Yes, in most cases it changes' },
      { ky: 'Жок, эч качан өзгөрбөйт', ru: 'Нет, никогда не меняется', en: 'No, it never changes' },
      { ky: 'Компьютерде гана өзгөрөт', ru: 'Меняется только на компьютере', en: 'Only on a computer' },
      { ky: 'Циклде гана өзгөрөт', ru: 'Только в цикле', en: 'Only inside a loop' }
    ], correct: 0,
    explain: { ky: 'Мисалы: «отур» жана «тур» кадамдарын алмаштырсак, натыйжа башка болот.', ru: 'Например, поменяв шаги «сесть» и «встать», получим другой результат.', en: 'Swapping "sit" and "stand" gives a different outcome.' }
  },
  {
    id: 'a03', skill: 'sequence', difficulty: 2, type: 'choice',
    prompt: { ky: 'Блок-схемада алгоритмдин башталышы кандай фигура менен белгиленет?', ru: 'Какой фигурой обозначают начало алгоритма в блок-схеме?', en: 'Which shape marks the start of an algorithm in a flowchart?' },
    options: [
      { ky: 'Овал', ru: 'Овал', en: 'An oval' },
      { ky: 'Ромб', ru: 'Ромб', en: 'A diamond' },
      { ky: 'Тик бурчтук', ru: 'Прямоугольник', en: 'A rectangle' },
      { ky: 'Параллелограмм', ru: 'Параллелограмм', en: 'A parallelogram' }
    ], correct: 0,
    explain: { ky: 'Башталышы жана аягы овал менен белгиленет.', ru: 'Начало и конец обозначают овалом.', en: 'Start and end are drawn as ovals.' }
  },
  {
    id: 'a04', skill: 'condition', difficulty: 1, type: 'choice',
    prompt: { ky: 'Шарт (if) эмне үчүн керек?', ru: 'Зачем нужно условие (if)?', en: 'What is a condition (if) for?' },
    options: [
      { ky: 'Абалга жараша ар кандай аракет тандоо үчүн', ru: 'Чтобы выбрать действие в зависимости от ситуации', en: 'To choose an action depending on the situation' },
      { ky: 'Кадамды көп жолу кайталоо үчүн', ru: 'Чтобы много раз повторить шаг', en: 'To repeat a step many times' },
      { ky: 'Маалыматты сактоо үчүн', ru: 'Чтобы сохранить данные', en: 'To store data' },
      { ky: 'Программаны токтотуу үчүн', ru: 'Чтобы остановить программу', en: 'To stop the program' }
    ], correct: 0,
    explain: { ky: 'Шарт аткарылса — бир аракет, аткарылбаса — башка аракет.', ru: 'Если условие верно — одно действие, иначе — другое.', en: 'If the condition is true one action runs, otherwise another.' }
  },
  {
    id: 'a05', skill: 'condition', difficulty: 2, type: 'choice',
    prompt: { ky: 'Блок-схемада шарт кандай фигура менен белгиленет?', ru: 'Какой фигурой обозначается условие в блок-схеме?', en: 'Which shape represents a condition in a flowchart?' },
    options: [
      { ky: 'Ромб', ru: 'Ромб', en: 'A diamond' },
      { ky: 'Овал', ru: 'Овал', en: 'An oval' },
      { ky: 'Тик бурчтук', ru: 'Прямоугольник', en: 'A rectangle' },
      { ky: 'Тегерек', ru: 'Круг', en: 'A circle' }
    ], correct: 0,
    explain: { ky: 'Ромбдон эки жол чыгат: «ооба» жана «жок».', ru: 'Из ромба выходят две ветви: «да» и «нет».', en: 'Two branches leave the diamond: yes and no.' }
  },
  {
    id: 'a06', skill: 'condition', difficulty: 3, type: 'choice',
    prompt: { ky: 'x = 5 болсо, «эгер x > 3 болсо, "чоң" деп жаз» эмне чыгарат?', ru: 'Если x = 5, что выведет «если x > 3, напиши "большое"»?', en: 'If x = 5, what does "if x > 3 print big" output?' },
    options: [
      { ky: '«чоң» деп жазат', ru: 'Напишет «большое»', en: 'It prints "big"' },
      { ky: 'Эч нерсе жазбайт', ru: 'Ничего не напишет', en: 'It prints nothing' },
      { ky: 'Ката берет', ru: 'Выдаст ошибку', en: 'It shows an error' },
      { ky: 'x = 3 деп жазат', ru: 'Напишет x = 3', en: 'It prints x = 3' }
    ], correct: 0,
    explain: { ky: '5 > 3 туура, демек шарт аткарылат.', ru: '5 > 3 — истина, значит условие выполняется.', en: '5 > 3 is true, so the condition runs.' }
  },
  {
    id: 'a07', skill: 'loop', difficulty: 1, type: 'choice',
    prompt: { ky: 'Цикл эмне кылат?', ru: 'Что делает цикл?', en: 'What does a loop do?' },
    options: [
      { ky: 'Кадамдарды кайра-кайра аткарат', ru: 'Повторяет шаги много раз', en: 'Repeats steps many times' },
      { ky: 'Программаны жабат', ru: 'Закрывает программу', en: 'Closes the program' },
      { ky: 'Файл түзөт', ru: 'Создаёт файл', en: 'Creates a file' },
      { ky: 'Ката табат', ru: 'Ищет ошибку', en: 'Finds an error' }
    ], correct: 0,
    explain: { ky: 'Цикл бирдей кадамдарды кайталоо үчүн колдонулат.', ru: 'Цикл нужен, чтобы повторять одинаковые шаги.', en: 'A loop repeats the same steps.' }
  },
  {
    id: 'a08', skill: 'loop', difficulty: 2, type: 'choice',
    prompt: { ky: '«3 жолу кайтала: 2 кадам алга» — канча кадам жасалат?', ru: '«Повтори 3 раза: 2 шага вперёд» — сколько шагов получится?', en: '"Repeat 3 times: 2 steps forward" — how many steps in total?' },
    options: ['6', '3', '2', '5'], correct: 0,
    explain: { ky: '3 × 2 = 6 кадам.', ru: '3 × 2 = 6 шагов.', en: '3 × 2 = 6 steps.' }
  },
  {
    id: 'a09', skill: 'loop', difficulty: 3, type: 'choice',
    prompt: { ky: 'Цикл эч качан токтобой калса, ал кандай аталат?', ru: 'Как называется цикл, который никогда не заканчивается?', en: 'What is a loop that never ends called?' },
    options: [
      { ky: 'Чексиз цикл', ru: 'Бесконечный цикл', en: 'An infinite loop' },
      { ky: 'Кыска цикл', ru: 'Короткий цикл', en: 'A short loop' },
      { ky: 'Шарттуу цикл', ru: 'Условный цикл', en: 'A conditional loop' },
      { ky: 'Тез цикл', ru: 'Быстрый цикл', en: 'A fast loop' }
    ], correct: 0,
    explain: { ky: 'Токтотуу шарты жок болсо, цикл чексиз айланат.', ru: 'Без условия выхода цикл крутится бесконечно.', en: 'Without an exit condition the loop runs forever.' }
  },
  {
    id: 'a10', skill: 'sequence', difficulty: 2, type: 'choice',
    prompt: { ky: 'Төмөнкүлөрдүн кайсынысы алгоритмдин мисалы?', ru: 'Что из перечисленного является примером алгоритма?', en: 'Which of these is an example of an algorithm?' },
    options: [
      { ky: 'Тамак бышыруунун рецепти', ru: 'Рецепт приготовления блюда', en: 'A cooking recipe' },
      { ky: 'Сүрөт', ru: 'Картина', en: 'A painting' },
      { ky: 'Ыр', ru: 'Песня', en: 'A song' },
      { ky: 'Сан', ru: 'Число', en: 'A number' }
    ], correct: 0,
    explain: { ky: 'Рецепт — так кадамдардын ырааттуулугу, демек алгоритм.', ru: 'Рецепт — точная последовательность шагов, то есть алгоритм.', en: 'A recipe is a precise sequence of steps — an algorithm.' }
  },
  // ─── «Ошибка учителя»: найдите строку кода с ошибкой ──────────────────────
  {
    id: 'a-err-01', skill: 'loop', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: 'Программа 1ден 5ке чейинки сандардын суммасын табышы керек. Кайсы сапта ката?', ru: 'Программа должна найти сумму чисел от 1 до 5. В какой строке ошибка?', en: 'The program should sum the numbers 1 to 5. Which line is wrong?' },
    options: ['s = 0', 'for i in range(1, 6):', '    s = s * i', 'print(s)'],
    correct: 2,
    explain: { ky: 'Сумма үчүн кошуу керек: s = s + i. Көбөйтсөк, жооп 0 бойдон калат.', ru: 'Для суммы нужно сложение: s = s + i. При умножении ответ останется 0.', en: 'A sum needs addition: s = s + i. Multiplying keeps the result at 0.' }
  },
  {
    id: 'a-err-02', skill: 'condition', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: { ky: 'Программа жуп сандарды «жуп» деп жазышы керек. Ката кайсы сапта?', ru: 'Программа должна писать «чётное» для чётных чисел. Где ошибка?', en: 'The program should print "even" for even numbers. Where is the mistake?' },
    options: ['n = int(input())', 'if n % 2 == 1:', "    print('жуп / even')"],
    correct: 1,
    explain: { ky: 'Жуп сан 2ге калдыксыз бөлүнөт: n % 2 == 0.', ru: 'Чётное число делится на 2 без остатка: n % 2 == 0.', en: 'An even number has no remainder: n % 2 == 0.' }
  },
  // ─── Последовательность шагов алгоритма ───────────────────────────────────
  {
    id: 'a-seq-01', skill: 'sequence', difficulty: 1, type: 'sort',
    prompt: { ky: 'Чай даярдоо алгоритминин кадамдарын иреттеңиз', ru: 'Расставьте шаги алгоритма «Приготовить чай»', en: 'Order the steps of the "make tea" algorithm' },
    items: [
      { ky: 'Чайнекке суу куюу', ru: 'Налить воду в чайник', en: 'Pour water into the kettle' },
      { ky: 'Сууну кайнатуу', ru: 'Вскипятить воду', en: 'Boil the water' },
      { ky: 'Чыныга чай салуу', ru: 'Положить чай в чашку', en: 'Put tea in the cup' },
      { ky: 'Кайнак сууну куюу', ru: 'Залить кипятком', en: 'Pour in the boiling water' }
    ],
    explain: { ky: 'Ар бир кадам мурунку кадамдын жыйынтыгына таянат.', ru: 'Каждый шаг опирается на результат предыдущего.', en: 'Each step depends on the result of the previous one.' }
  }
];
