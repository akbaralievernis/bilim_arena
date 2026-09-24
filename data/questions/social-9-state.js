/** Коомдук таануу, 9-класс — Мамлекет жана укук / Государство и право */
const L = (ky, ru, en) => ({ ky, ru, en });

export default [
  {
    id: 'so01', skill: 'state', difficulty: 1, type: 'choice',
    prompt: L('Мамлекеттин негизги мыйзамы кайсы?', 'Какой закон является основным в государстве?', 'What is the main law of a state?'),
    options: [L('Конституция', 'Конституция', 'The Constitution'), L('Кодекс', 'Кодекс', 'A code'), L('Буйрук', 'Приказ', 'An order'), L('Устав', 'Устав', 'A charter')], correct: 0,
    explain: L('Конституция — эң жогорку юридикалык күчкө ээ мыйзам.', 'Конституция имеет высшую юридическую силу.', 'The Constitution has the highest legal force.')
  },
  {
    id: 'so02', skill: 'state', difficulty: 1, type: 'choice',
    prompt: L('Кыргыз Республикасынын парламенти кандай аталат?', 'Как называется парламент Кыргызской Республики?', 'What is the parliament of the Kyrgyz Republic called?'),
    options: [L('Жогорку Кеңеш', 'Жогорку Кенеш', 'Jogorku Kenesh'), L('Курултай', 'Курултай', 'Kurultai'), L('Сенат', 'Сенат', 'Senate'), L('Дума', 'Дума', 'Duma')], correct: 0,
    explain: L('Жогорку Кеңеш — мыйзам чыгаруучу бийлик.', 'Жогорку Кенеш — законодательная власть.', 'The Jogorku Kenesh is the legislature.')
  },
  {
    id: 'so03', skill: 'state', difficulty: 2, type: 'multiple',
    prompt: L('Бийликтин үч бутагын тандаңыз', 'Выберите три ветви власти', 'Choose the three branches of power'),
    options: [L('Мыйзам чыгаруучу', 'Законодательная', 'Legislative'), L('Аткаруучу', 'Исполнительная', 'Executive'), L('Сот', 'Судебная', 'Judicial'), L('Соода', 'Торговая', 'Trade')],
    correct: [0, 1, 2],
    explain: L('Бийлик бөлүштүрүлөт: мыйзам чыгаруу, аткаруу жана сот.', 'Власть разделена на законодательную, исполнительную и судебную.', 'Power is split into legislative, executive and judicial.')
  },
  {
    id: 'so04', skill: 'state', difficulty: 2, type: 'match',
    prompt: L('Бийлик бутагын анын ишмердүүлүгү менен жупташтырыңыз', 'Соедините ветвь власти с её работой', 'Match each branch with what it does'),
    pairs: [
      [L('Мыйзам чыгаруучу', 'Законодательная', 'Legislative'), L('Мыйзамдарды кабыл алат', 'Принимает законы', 'Passes laws')],
      [L('Аткаруучу', 'Исполнительная', 'Executive'), L('Мыйзамдарды аткарат', 'Исполняет законы', 'Carries out laws')],
      [L('Сот', 'Судебная', 'Judicial'), L('Талаш-тартыштарды чечет', 'Разрешает споры', 'Settles disputes')]
    ],
    explain: L('Ар бир бутак өз милдетин аткарып, бири-бирин тең салмакта кармайт.', 'Каждая ветвь выполняет свою задачу и уравновешивает другие.', 'Each branch has its job and balances the others.')
  },
  {
    id: 'so05', skill: 'citizenship', difficulty: 1, type: 'input', numeric: true,
    prompt: L('Кыргызстанда жаран шайлоодо канча жаштан добуш бере алат?', 'С какого возраста гражданин Кыргызстана может голосовать на выборах?', 'From what age can a citizen of Kyrgyzstan vote?'),
    answer: ['18'],
    explain: L('18 жаштан баштап жаран шайлоого катыша алат.', 'С 18 лет гражданин может участвовать в выборах.', 'From the age of 18.')
  },
  {
    id: 'so06', skill: 'rights', difficulty: 2, type: 'choice',
    prompt: L('БУУнун Бала укуктары жөнүндө конвенциясы качан кабыл алынган?', 'Когда принята Конвенция ООН о правах ребёнка?', 'When was the UN Convention on the Rights of the Child adopted?'),
    options: ['1989', '1945', '1975', '2001'], correct: 0,
    explain: L('Конвенция 1989-жылы кабыл алынган; Кыргызстан ага 1994-жылы кошулган.', 'Конвенция принята в 1989 году; Кыргызстан присоединился в 1994 году.', 'It was adopted in 1989; Kyrgyzstan joined in 1994.')
  },
  {
    id: 'so07', skill: 'rights', difficulty: 1, type: 'multiple',
    prompt: L('Баланын укуктарын тандаңыз', 'Выберите права ребёнка', 'Choose the rights of the child'),
    options: [L('Билим алуу укугу', 'Право на образование', 'Right to education'), L('Ден соолукту коргоо укугу', 'Право на охрану здоровья', 'Right to health care'), L('Өз пикирин айтуу укугу', 'Право выражать своё мнение', 'Right to express views'), L('Мектепке барбоо укугу', 'Право не ходить в школу', 'Right to skip school')],
    correct: [0, 1, 2],
    explain: L('Негизги билим алуу — укук эле эмес, милдет да.', 'Основное образование — не только право, но и обязанность.', 'Basic education is both a right and a duty.')
  },
  {
    id: 'so08', skill: 'citizenship', difficulty: 2, type: 'choice',
    prompt: L('Кыргызстанда Конституция күнү качан белгиленет?', 'Когда в Кыргызстане отмечается День Конституции?', 'When is Constitution Day celebrated in Kyrgyzstan?'),
    options: [L('5-май', '5 мая', 'May 5'), L('31-август', '31 августа', 'August 31'), L('1-январь', '1 января', 'January 1'), L('21-март', '21 марта', 'March 21')], correct: 0,
    explain: L('1993-жылдын 5-майында биринчи Конституция кабыл алынган.', '5 мая 1993 года принята первая Конституция.', 'The first Constitution was adopted on May 5, 1993.')
  },
  {
    id: 'so09', skill: 'rights', difficulty: 2, type: 'choice',
    prompt: L('Укук менен милдеттин айырмасы эмнеде?', 'Чем право отличается от обязанности?', 'How does a right differ from a duty?'),
    options: [
      L('Укук — мүмкүнчүлүк, милдет — сөзсүз аткарылуучу нерсе', 'Право — возможность, обязанность — то, что нужно выполнить', 'A right is a possibility; a duty must be fulfilled'),
      L('Айырмасы жок', 'Разницы нет', 'There is no difference'),
      L('Укук балдарга гана тиешелүү', 'Права есть только у детей', 'Only children have rights'),
      L('Милдет — сыйлык', 'Обязанность — это награда', 'A duty is a reward')
    ], correct: 0,
    explain: L('Мисалы: шайлоо — укук, мыйзамды сактоо — милдет.', 'Например: голосовать — право, соблюдать законы — обязанность.', 'E.g. voting is a right; obeying the law is a duty.')
  },
  {
    id: 'so-err-01', skill: 'state', difficulty: 2, type: 'choice', errorHunt: true,
    prompt: L('Мугалим бийлик бутактарын жазды. Кайсы сапта ката?', 'Учитель описал ветви власти. В какой строке ошибка?', 'The teacher described the branches of power. Which line is wrong?'),
    options: [
      L('Жогорку Кеңеш мыйзамдарды кабыл алат', 'Жогорку Кенеш принимает законы', 'The Jogorku Kenesh passes laws'),
      L('Соттор мыйзамдарды кабыл алат', 'Суды принимают законы', 'Courts pass laws'),
      L('Өкмөт мыйзамдарды аткарат', 'Правительство исполняет законы', 'The government carries out laws')
    ],
    correct: 1,
    explain: L('Соттор мыйзамдарды колдонуп, талаштарды чечет — мыйзамды кабыл алышпайт.', 'Суды применяют законы и решают споры, но не принимают законы.', 'Courts apply laws and settle disputes; they do not pass laws.')
  }
];
