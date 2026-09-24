/**
 * «Айт! / Говори» — наборы для тренировки произношения.
 *
 * Данные отдельно от игры. Каждый элемент привязан к навыку темы,
 * поэтому ошибки произношения попадают в общую аналитику по навыкам.
 *   text  — что нужно произнести (на языке набора)
 *   sound — примерное звучание кириллицей (подсказка, не транскрипция)
 *   hint  — перевод / значение на языке интерфейса
 *   tip   — на что обратить внимание (необязательно)
 *   accept — омофоны: распознавание может вернуть их вместо верно сказанного слова
 */

const W = (id, skill, text, sound, ky, ru, en, tip = null, accept = []) => ({ id, skill, text, sound, hint: { ky, ru, en }, tip, accept });

export const SPEAK_SETS = [
  {
    id: 'en-words',
    icon: '🔤',
    lang: 'en-US',
    topic: 'english-5-basics',
    title: { ky: 'Англисче сөздөр', ru: 'Английские слова', en: 'English words' },
    items: [
      W('sp-en-01', 'animals', 'cat', '[кэт]', 'мышык', 'кошка', 'a small pet that says "meow"'),
      W('sp-en-02', 'animals', 'dog', '[дог]', 'ит', 'собака', 'a pet that barks'),
      W('sp-en-03', 'animals', 'horse', '[хо:с]', 'ат', 'лошадь', 'a large animal people ride',
        { ky: 'r тыбышы дээрлик угулбайт: [хо:с].', ru: 'Звук r почти не слышен: [хо:с].', en: 'The r is almost silent in British English.' }, ['hoarse']),
      W('sp-en-04', 'animals', 'sheep', '[ши:п]', 'кой', 'овца', 'a farm animal with wool',
        { ky: 'ee — узун [и:].', ru: 'ee — долгий звук [и:].', en: '"ee" is a long [i:] sound.' }),
      W('sp-en-05', 'animals', 'eagle', '[и:гл]', 'бүркүт', 'орёл', 'a large bird of prey'),
      W('sp-en-06', 'food', 'apple', '[эпл]', 'алма', 'яблоко', 'a round red or green fruit'),
      W('sp-en-07', 'food', 'bread', '[брэд]', 'нан', 'хлеб', 'food baked from flour',
        { ky: 'ea бул жерде кыска [э].', ru: 'ea здесь читается как короткое [э].', en: '"ea" sounds like a short [e] here.' }),
      W('sp-en-08', 'food', 'water', '[уо:тэ]', 'суу', 'вода', 'the drink we need every day',
        { ky: 'w — эриндер тегеректелип айтылат, «в» эмес.', ru: 'w — губы округлены, это не «в».', en: '"w" is made with rounded lips.' }),
      W('sp-en-09', 'food', 'milk', '[милк]', 'сүт', 'молоко', 'a white drink from cows'),
      W('sp-en-10', 'school', 'teacher', '[ти:чэ]', 'мугалим', 'учитель', 'a person who teaches'),
      W('sp-en-11', 'school', 'book', '[бук]', 'китеп', 'книга', 'you read it'),
      W('sp-en-12', 'school', 'pencil', '[пэнсл]', 'карандаш', 'карандаш', 'you write and draw with it'),
      W('sp-en-13', 'verbs', 'read', '[ри:д]', 'окуу', 'читать', 'to look at words and understand them', null, ['reed']),
      W('sp-en-14', 'verbs', 'write', '[райт]', 'жазуу', 'писать', 'to put words on paper',
        { ky: 'w жазылат, бирок окулбайт.', ru: 'w пишется, но не читается.', en: 'The "w" is silent.' }, ['right', 'rite']),
      W('sp-en-15', 'verbs', 'think', '[сынк]', 'ойлонуу', 'думать', 'to use your mind',
        { ky: 'th — тилдин учу тиштердин ортосунда.', ru: 'th — кончик языка между зубами.', en: '"th" — tongue tip between the teeth.' })
    ]
  },
  {
    id: 'en-phrases',
    icon: '💬',
    lang: 'en-US',
    topic: 'english-5-basics',
    title: { ky: 'Англисче сүйлөмдөр', ru: 'Английские фразы', en: 'English phrases' },
    items: [
      W('sp-ph-01', 'school', 'Good morning, teacher!', '[гуд мо:нин, ти:чэ]', 'Кутман таң, мугалим!', 'Доброе утро, учитель!', 'a morning greeting'),
      W('sp-ph-02', 'food', 'I like apples.', '[ай лайк эплз]', 'Мен алма жакшы көрөм.', 'Я люблю яблоки.', 'saying what you like'),
      W('sp-ph-03', 'school', 'This is my school.', '[зис из май ску:л]', 'Бул менин мектебим.', 'Это моя школа.', 'showing your school',
        { ky: 'this — th жумшак, тил тиштердин ортосунда.', ru: 'this — мягкое th, язык между зубами.', en: '"this" has a soft voiced "th".' }),
      W('sp-ph-04', 'animals', 'My dog is big.', '[май дог из биг]', 'Менин итим чоң.', 'Моя собака большая.', 'describing a pet'),
      W('sp-ph-05', 'verbs', 'I go to school every day.', '[ай гоу ту ску:л эври дэй]', 'Мен күн сайын мектепке барам.', 'Я хожу в школу каждый день.', 'a daily routine'),
      W('sp-ph-06', 'food', 'Can I have some water?', '[кэн ай хэв сам уо:тэ]', 'Мага суу берсеңиз?', 'Можно мне воды?', 'a polite request'),
      W('sp-ph-07', 'animals', 'The cat is sleeping.', '[зэ кэт из сли:пин]', 'Мышык уктап жатат.', 'Кошка спит.', 'what is happening now'),
      W('sp-ph-08', 'school', 'Open your books.', '[оупэн йо: букс]', 'Китептериңерди ачкыла.', 'Откройте книги.', 'a classroom instruction'),
      W('sp-ph-09', 'verbs', 'She reads a book.', '[ши ри:дз э бук]', 'Ал китеп окуйт.', 'Она читает книгу.', 'he / she + verb with -s',
        { ky: 'She менен этиш -s алат: reads.', ru: 'После she глагол получает -s: reads.', en: 'After "she" the verb takes -s.' }),
      W('sp-ph-10', 'animals', 'I have a horse.', '[ай хэв э хо:с]', 'Менин атым бар.', 'У меня есть лошадь.', 'saying what you have')
    ]
  }
];

export const getSet = (id) => SPEAK_SETS.find((s) => s.id === id);

/** Элемент по id — для разбора ошибок на странице прогресса */
export function findSpeakItem(id) {
  for (const set of SPEAK_SETS) {
    const item = set.items.find((x) => x.id === id);
    if (item) return { ...item, set };
  }
  return null;
}
