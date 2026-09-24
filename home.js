/**
 * Bilim Arena — главная страница платформы.
 *
 * Здесь сходятся три входа: ученик с телефона, интерактивная доска и учитель.
 * Ниже — прогресс ученика, предметы и все игры платформы
 * (в том числе прежние языковые игры, они сохранены и работают).
 */

import { bootstrap, mountHeader, el, $ } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { SUBJECTS, TOPICS, topicsOf } from './core/curriculum.js';
import { getProgress, knowledgeMap, migrateLegacy } from './core/progress.js';
import { getProfile } from './core/profile.js';

/**
 * Каталог игр. Новые игры движка открываются в режиме доски,
 * прежние языковые игры остаются самостоятельными страницами.
 */
const GAMES = [
  {
    id: 'territory', icon: '🗺️', kind: 'board',
    href: './board.html', grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    title: { ky: 'Аймакты басып алуу', ru: 'Захват территории', en: 'Capture the territory' },
    desc: {
      ky: 'Класс эки командага бөлүнүп, суроолорго жооп берип картаны ээлейт',
      ru: 'Класс делится на команды и захватывает карту верными ответами',
      en: 'The class splits into teams and captures the map with correct answers'
    },
    subject: { ky: 'Бардык предметтер', ru: 'Любой предмет', en: 'Any subject' }
  },
  {
    id: 'quickvote', icon: '📊', kind: 'board',
    href: './board.html', grad: 'linear-gradient(135deg,#0ea5e9,#22c55e)',
    title: { ky: 'Тез сурамжылоо', ru: 'Быстрый опрос', en: 'Quick poll' },
    desc: {
      ky: 'Мугалим суроо берет, класс телефондон жооп берет, доска жыйынтыкты көрсөтөт',
      ru: 'Учитель задаёт вопрос, класс отвечает с телефонов, доска показывает результат',
      en: 'The teacher asks, the class answers from phones, the board shows the result'
    },
    subject: { ky: 'Бардык предметтер', ru: 'Любой предмет', en: 'Any subject' }
  },
  {
    id: 'investigation', icon: '🔍', kind: 'board',
    href: './board.html?case=case-001-museum', grad: 'linear-gradient(135deg,#334155,#7c3aed)',
    title: { ky: 'Тергөө', ru: 'Расследование', en: 'Investigation' },
    desc: {
      ky: 'Музейде эмне болду? Тапшырмаларды чечип, далилдерди ачып, күнөөлүүнү табыңыз',
      ru: 'Что случилось в музее? Решайте задания, открывайте улики и найдите виновного',
      en: 'What happened at the museum? Solve tasks, unlock clues and find the culprit'
    },
    subject: { ky: 'Математика, логика', ru: 'Математика, логика', en: 'Maths, logic' }
  },
  {
    id: 'errorhunt', icon: '🖍️', kind: 'board',
    href: './board.html?game=errorhunt&subject=math&topic=math-6-fractions', grad: 'linear-gradient(135deg,#ef4444,#f59e0b)',
    title: { ky: 'Мугалимдин катасы', ru: 'Ошибка учителя', en: "Teacher's mistake" },
    desc: {
      ky: 'Мугалим чечимде ката кетирди — класс ката кеткен сапты табат',
      ru: 'Учитель ошибся в решении — класс ищет строку с ошибкой',
      en: 'The teacher made a mistake — the class finds the wrong line'
    },
    subject: { ky: 'Математика, тилдер, информатика', ru: 'Математика, языки, информатика', en: 'Maths, languages, computer science' }
  },
  {
    id: 'formula', icon: '⚔️', kind: 'board',
    href: './board.html?game=formula&subject=math&topic=math-5-numbers', grad: 'linear-gradient(135deg,#2563eb,#e11d48)',
    title: { ky: 'Формула-беттеш', ru: 'Формула-бой', en: 'Formula battle' },
    desc: {
      ky: 'Эки команда аркан тартат: ким тез жана так эсептесе, ошол тартат',
      ru: 'Две команды перетягивают канат: тянет тот, кто считает быстро и точно',
      en: 'Two teams play tug of war: accurate, fast counting pulls the rope'
    },
    subject: { ky: 'Математика', ru: 'Математика', en: 'Maths' }
  },
  {
    id: 'codelock', icon: '🔐', kind: 'board',
    href: './board.html?game=codelock', grad: 'linear-gradient(135deg,#0f766e,#22c55e)',
    title: { ky: 'Коддуу кулпу', ru: 'Кодовый замок', en: 'Code lock' },
    desc: {
      ky: 'Бүт класс болуп тапшырмаларды чечип, кулпунун сандарын ачыңыз — каталар аягында кайра келет',
      ru: 'Всем классом решайте задания и открывайте цифры замка — ошибки вернутся в конце',
      en: 'Solve tasks together to open the lock — mistakes come back at the end'
    },
    subject: { ky: 'Бардык предметтер', ru: 'Любой предмет', en: 'Any subject' }
  },
  {
    id: 'timeline', icon: '⏳', kind: 'board',
    href: './board.html?game=timeline&subject=kg-history&topic=kg-history-8-independence', grad: 'linear-gradient(135deg,#f97316,#b45309)',
    title: { ky: 'Тарых картасы', ru: 'Карта истории', en: 'History map' },
    desc: {
      ky: 'Окуяларды убакыт боюнча иреттеп, линияны бүт класс менен куруңуз',
      ru: 'Расставьте события по времени и постройте линию всем классом',
      en: 'Put events in order and build the timeline together'
    },
    subject: { ky: 'Тарых', ru: 'История', en: 'History' }
  },
  {
    id: 'flashcards', icon: '📇', kind: 'solo', href: './games/flashcards/index.html',
    grad: 'linear-gradient(135deg,#6366f1,#ec4899)',
    title: { ky: 'Сөз карточкалары', ru: 'Карточки слов', en: 'Flashcards' },
    desc: {
      ky: 'Сөздү көр, ук жана эсте — акылдуу кайталоо системасы менен',
      ru: 'Смотри, слушай и запоминай слова — с интервальным повторением',
      en: 'See, hear and memorise words with spaced repetition'
    },
    subject: { ky: 'Тилдер', ru: 'Языки', en: 'Languages' }
  },
  {
    id: 'word-match', icon: '🃏', kind: 'solo', href: './games/word-match/index.html',
    grad: 'linear-gradient(135deg,#ec4899,#f43f5e)',
    title: { ky: 'Жупташтыр', ru: 'Найди пару', en: 'Match pairs' },
    desc: {
      ky: 'Сөз менен котормосун жупташтыруу — эс тутумга машыгуу',
      ru: 'Сопоставь слово и перевод — тренировка памяти',
      en: 'Match a word with its translation — memory practice'
    },
    subject: { ky: 'Тилдер', ru: 'Языки', en: 'Languages' }
  },
  {
    id: 'wordle', icon: '🔤', kind: 'solo', href: './games/wordle/index.html',
    grad: 'linear-gradient(135deg,#22c55e,#0ea5e9)',
    title: { ky: 'Сөз табышмак', ru: 'Угадай слово', en: 'Word puzzle' },
    desc: {
      ky: '5 тамгалуу кыргыз сөзүн 6 аракетте тап',
      ru: 'Угадай кыргызское слово из 5 букв за 6 попыток',
      en: 'Guess the 5-letter Kyrgyz word in 6 tries'
    },
    subject: { ky: 'Кыргыз тили', ru: 'Кыргызский язык', en: 'Kyrgyz language' }
  },
  {
    id: 'word-rain', icon: '🌧️', kind: 'solo', href: './games/word-rain/index.html',
    grad: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
    title: { ky: 'Сөз жамгыры', ru: 'Словопад', en: 'Word rain' },
    desc: {
      ky: 'Сөз жерге жеткиче котормосун тап — ылдамдыкка машыгуу',
      ru: 'Успей перевести слово, пока оно не упало',
      en: 'Translate the word before it hits the ground'
    },
    subject: { ky: 'Тилдер', ru: 'Языки', en: 'Languages' }
  },
  {
    id: 'balloons', icon: '🎈', kind: 'solo', href: './games/balloons/index.html',
    grad: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    title: { ky: 'Шарлар', ru: 'Шарики', en: 'Balloons' },
    desc: {
      ky: 'Сүрөт боюнча сөздү тамга-тамга тап — орфографияга машыгуу',
      ru: 'Угадай слово по буквам — тренировка правописания',
      en: 'Guess the word letter by letter — spelling practice'
    },
    subject: { ky: 'Кыргыз тили', ru: 'Кыргызский язык', en: 'Kyrgyz language' }
  },
  {
    id: 'sentence', icon: '🧩', kind: 'class', href: './games/sentence/index.html',
    grad: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
    title: { ky: 'Сүйлөмдү түз', ru: 'Собери предложение', en: 'Build the sentence' },
    desc: {
      ky: 'Сөздөрдү туура тартипте коюп, сүйлөм кур — эки команда мелдешет',
      ru: 'Собери предложение из слов — соревнование двух команд',
      en: 'Build a sentence from words — two teams compete'
    },
    subject: { ky: 'Тилдер', ru: 'Языки', en: 'Languages' }
  },
  {
    id: 'odd', icon: '🔍', kind: 'class', href: './games/odd-one-out/index.html',
    grad: 'linear-gradient(135deg,#14b8a6,#22c55e)',
    title: { ky: 'Ашыкчаны тап', ru: 'Найди лишнее', en: 'Odd one out' },
    desc: {
      ky: 'Эрежеге туура келбеген элементти тап — логикага машыгуу',
      ru: 'Найди элемент, не подходящий под правило — логика',
      en: 'Find the element that breaks the rule — logic practice'
    },
    subject: { ky: 'Логика', ru: 'Логика', en: 'Logic' }
  },
  {
    id: 'citadel', icon: '🏰', kind: 'class', href: './games/citadel/index.html',
    grad: 'linear-gradient(135deg,#ef4444,#f59e0b)',
    title: { ky: 'Цитаделди ээлөө', ru: 'Захват цитадели', en: 'Citadel' },
    desc: {
      ky: 'Суроолорго жооп берип, аймактарды ээлөө — класстык мелдеш',
      ru: 'Отвечай на вопросы и захватывай территории — классное соревнование',
      en: 'Answer questions and capture territory — class competition'
    },
    subject: { ky: 'Кыргыз тили, тарых', ru: 'Кыргызский язык, история', en: 'Kyrgyz, history' }
  },
  {
    id: 'focus', icon: '⚡', kind: 'class', href: './games/focus-duel/index.html',
    grad: 'linear-gradient(135deg,#f43f5e,#8b5cf6)',
    title: { ky: 'Фокус дуэль', ru: 'Фокус-дуэль', en: 'Focus duel' },
    desc: {
      ky: 'Керектүү жоопту атаандаштан тез тап — көңүл топтоо',
      ru: 'Найди нужный ответ быстрее соперника — концентрация',
      en: 'Find the right answer faster than your rival — focus'
    },
    subject: { ky: 'Кыргыз тили', ru: 'Кыргызский язык', en: 'Kyrgyz language' }
  },
  {
    id: 'mafia', icon: '🕵️', kind: 'class', href: './games/mafia/index.html',
    grad: 'linear-gradient(135deg,#475569,#ef4444)',
    title: { ky: 'Мафия', ru: 'Мафия', en: 'Mafia' },
    desc: {
      ky: 'Класс менен онлайн ойноо: логика, ынандыруу жана сүйлөө көндүмү',
      ru: 'Онлайн-игра классом: логика, аргументация и речь',
      en: 'Play online with the class: logic, arguing and speaking'
    },
    subject: { ky: 'Сүйлөө', ru: 'Речь', en: 'Speaking' }
  },
  {
    id: 'eagle', icon: '🦅', kind: 'camera', href: './games/eagle/index.html',
    grad: 'linear-gradient(135deg,#0ea5e9,#14b8a6)',
    title: { ky: 'Кыргыз бүркүтү', ru: 'Кыргызский беркут', en: 'Kyrgyz eagle' },
    desc: {
      ky: 'Веб-камера жана кол кыймылы менен башкаруу',
      ru: 'Управление движением руки через веб-камеру',
      en: 'Control it with hand movement via webcam'
    },
    subject: { ky: 'Реакция', ru: 'Реакция', en: 'Reaction' }
  },
  {
    id: 'reaction', icon: '🎯', kind: 'camera', href: './games/reaction/index.html',
    grad: 'linear-gradient(135deg,#22c55e,#eab308)',
    title: { ky: 'Ылдамдык сыноо', ru: 'Проверка реакции', en: 'Reaction test' },
    desc: {
      ky: 'Объекттерди камера аркылуу кармоо',
      ru: 'Лови объекты через камеру',
      en: 'Catch the objects through the camera'
    },
    subject: { ky: 'Реакция', ru: 'Реакция', en: 'Reaction' }
  }
];

const KIND_LABEL = {
  all: { ky: 'Баары', ru: 'Все', en: 'All' },
  board: { ky: '🖥️ Доска', ru: '🖥️ Доска', en: '🖥️ Board' },
  class: { ky: '👥 Класс', ru: '👥 Класс', en: '👥 Class' },
  solo: { ky: '🙋 Өз алдынча', ru: '🙋 Самостоятельно', en: '🙋 Solo' },
  camera: { ky: '📷 Камера', ru: '📷 Камера', en: '📷 Camera' }
};

let filter = 'all';

function renderGames() {
  const lang = getLang();
  const list = GAMES.filter((g) => filter === 'all' || g.kind === filter);

  $('#gameFilters').replaceChildren(...Object.entries(KIND_LABEL).map(([kind, label]) =>
    el('button', {
      class: 'chip', type: 'button', 'aria-pressed': String(kind === filter),
      onclick: () => { filter = kind; renderGames(); }
    }, pick(label, lang))
  ));

  $('#gameGrid').replaceChildren(...list.map((g) => el('a', { class: 'game-card card', href: g.href },
    el('div', { class: 'game-cover', style: `background:${g.grad}` }, el('span', {}, g.icon)),
    el('div', { class: 'stack', style: 'gap:6px' },
      el('div', { class: 'row', style: 'gap:6px' },
        el('span', { class: 'chip small' }, pick(KIND_LABEL[g.kind], lang)),
        el('span', { class: 'small muted' }, pick(g.subject, lang))
      ),
      el('h3', { style: 'margin:0' }, pick(g.title, lang)),
      el('p', { class: 'muted small', style: 'margin:0' }, pick(g.desc, lang))
    )
  )));
}

async function renderSubjects() {
  const lang = getLang();
  const map = await knowledgeMap(TOPICS);
  const withTopics = SUBJECTS.filter((s) => TOPICS.some((x) => x.subject === s.id));

  $('#subjectGrid').replaceChildren(...withTopics.map((s) => {
    const m = map[s.id] || { percent: 0, learned: 0, total: topicsOf(s.id).length };
    return el('a', { class: 'subject-card card', href: `./practice.html?subject=${s.id}` },
      el('div', { class: 'row between' },
        el('b', {}, `${s.icon} ${pick(s.title, lang)}`),
        el('span', { class: 'small muted' }, `${m.percent}%`)
      ),
      el('div', { class: `bar ${m.percent >= 80 ? 'ok' : ''}` }, el('i', { style: `width:${m.percent}%` })),
      el('div', { class: 'small muted' }, t('mastery_of_topics', { done: m.learned, total: m.total }))
    );
  }));
}

async function renderProfile() {
  const p = await getProfile();
  const pr = await getProgress();
  const lang = getLang();

  $('#avatar').textContent = p.avatar || '🦊';
  $('#profileName').textContent = p.name || t('role_student');
  $('#profileLevel').textContent = `${t('profile_level', { level: pr.level })} · ${pick(pr.title, lang)}`;
  $('#xpBar').style.width = pr.levelPct + '%';

  const stat = (v, l) => el('div', { class: 'stat' }, el('b', {}, String(v)), el('span', {}, l));
  $('#quickStats').replaceChildren(
    stat(pr.xp, 'XP'),
    stat(pr.streak, '🔥'),
    stat(pr.badges.length, t('achievements')),
    stat(`${pr.dayXP}/${pr.dailyGoal}`, t('lesson_stage_now'))
  );
}

function renderTeacherTips() {
  const lang = getLang();
  const tips = [
    {
      icon: '1️⃣',
      title: { ky: 'Сабакты баштаңыз', ru: 'Начните урок', en: 'Start the lesson' },
      text: {
        ky: 'Панелде предметти, теманы жана убакытты тандаңыз — система планды өзү түзөт',
        ru: 'Выберите предмет, тему и время — система сама соберёт план',
        en: 'Pick subject, topic and time — the system builds the plan'
      }
    },
    {
      icon: '2️⃣',
      title: { ky: 'Окуучуларды кошуңуз', ru: 'Подключите учеников', en: 'Connect students' },
      text: {
        ky: 'Доскада QR-код чыгат, окуучулар телефондон кошулат — каттоо керек эмес',
        ru: 'На доске появится QR-код, ученики заходят с телефонов без регистрации',
        en: 'A QR code appears on the board, students join from phones without signing up'
      }
    },
    {
      icon: '3️⃣',
      title: { ky: 'Командалык мелдеш', ru: 'Командное соревнование', en: 'Team competition' },
      text: {
        ky: 'Класс эки командага бөлүнүп, суроолор аркылуу аймактарды ээлейт',
        ru: 'Класс делится на команды и захватывает территории верными ответами',
        en: 'The class splits into teams and captures territory with correct answers'
      }
    },
    {
      icon: '4️⃣',
      title: { ky: 'Каталарды кайталаңыз', ru: 'Повторите ошибки', en: 'Review the mistakes' },
      text: {
        ky: 'Сабактын аягында система кыйын темаларды көрсөтүп, кайталоо оюнун түзөт',
        ru: 'В конце система покажет трудные темы и создаст игру для повторения',
        en: 'At the end the system shows weak spots and builds a review game'
      }
    }
  ];

  $('#teacherTips').replaceChildren(...tips.map((tip) => el('div', { class: 'card stack', style: 'gap:6px' },
    el('div', { style: 'font-size:1.6rem' }, tip.icon),
    el('b', {}, pick(tip.title, lang)),
    el('p', { class: 'muted small', style: 'margin:0' }, pick(tip.text, lang))
  )));
}

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'index.html' });
  await migrateLegacy();

  await renderProfile();
  await renderSubjects();
  renderGames();
  renderTeacherTips();

  $('#footerNote').textContent = t('ai_offline');

  // Офлайн-режим: страницы и игры открываются без интернета
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();
