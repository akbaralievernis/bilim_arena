import { useState, useEffect } from 'react';

/**
 * Языки «Мафии» — те же, что на всём сайте: кыргызский, русский, английский.
 * Выбор хранится там же, где у сайта (localStorage BA2_lang), поэтому
 * игра открывается на языке, который ученик выбрал на главной странице.
 */
const translations = {
  ky: {
    // Home
    app_title: 'МАФИЯ',
    page_title: 'Мафия — Билим Арена',
    home_title: 'Шаар уйкуга кетти.',
    home_subtitle: 'Аман калыңыз же баарын алдаңыз.',
    join_button: 'Код менен кошулуу',
    create_button: 'Өз оюнуңду түз',
    avatar_upload: 'Сүрөт жүктөө',
    enter_name: 'Атыңызды жазыңыз...',
    enter_code: 'Мисалы: M4FA',
    join_game: 'Оюнга кошулуу',
    create_room_btn: 'Бөлмө түзүү',
    close: 'Жабуу',
    connecting: 'Байланышууда...',
    back_to_game: 'Оюнга кайтуу',
    host_hint: 'Бөлмө түзсөңүз — сиз алып баруучу болосуз жана өзүңүз ойнобойсуз.',
    file_too_large: 'Файл өтө чоң (5 МБдан ашпасын).',
    back_to_site: 'Билим Арена',
    language: 'Тил',
    theme: 'Тема',

    // Lobby
    lobby_title: 'Бөлмөнүн коду:',
    players: 'Оюнчулар',
    invite_friends: 'QR-кодду сканерлеңиз же кодду досторуңузга бериңиз!',
    waiting_host: 'Алып баруучу оюнду баштаганын күтүңүз...',
    start_game: 'Оюнду баштоо',
    host_badge: 'Алып баруучу',
    copy_link: 'Шилтемени көчүрүү',
    link_copied: 'Шилтеме көчүрүлдү!',
    kick: 'Чыгаруу',
    need_players: 'Кеминде 4 оюнчу керек (жетишпесе робот кошулат)',
    bot_name: 'Бот {n}',

    // Game Roles
    role_don: 'Мафиянын Дону',
    role_mafia: 'Мафия',
    role_doctor: 'Дарыгер',
    role_detective: 'Комиссар',
    role_maniac: 'Маньяк',
    role_citizen: 'Тынч жаран',
    role_spectator: 'Алып баруучу',
    role_putana: 'Гипнозчу',
    role_bodyguard: 'Сакчы',
    hidden: 'Жашыруун',
    your_role: 'Сиздин ролуңуз',
    dead: 'Өлдү',

    // Role Descriptions
    desc_don: 'Мафиянын башчысы. Түнкүсүн биринчи ойгонуп Комиссарды издейсиз, андан соң мафия менен бирге курмандык тандайсыз.',
    desc_mafia: 'Сиз мафиясыз. Түнкүсүн шериктериңиз менен бир курмандык тандайсыз. Күндүз тынч жарандай көрүнүүгө аракет кылыңыз.',
    desc_doctor: 'Сиздин милдетиңиз — адамдарды сактоо. Ар түнү бир оюнчуну тандап, аны өлүмдөн куткарасыз.',
    desc_detective: 'Сиз мыйзам өкүлүсүз. Ар түнү бир оюнчуну текшерип, анын мафия экенин билесиз. Күндүз шаарга жардам бериңиз!',
    desc_maniac: 'Жалгыз киши өлтүргүч. Өзүңүз үчүн ойнойсуз. Ар түнү бир курмандык тандайсыз. Максат — эң акыркы болуп калуу!',
    desc_citizen: 'Тынч жаран. Түнкүсүн уктайсыз. Максатыңыз — күндүз сүйлөшүп, мафияны табуу!',
    desc_spectator: 'Сиз оюнду алып барасыз: фазаларды башкарасыз, бирок оюнга кийлигишпейсиз.',
    desc_putana: 'Түнү бир оюнчуну уктатасыз — ал түнү анын ролу иштебейт.',
    desc_bodyguard: 'Бир оюнчуну коргойсуз. Ага кол салса, соккуну өзүңүз аласыз.',
    blocked_tonight: 'Сизди бул түнү гипнозчу уктатты — ролуңуз иштебейт.',

    // Game Phases
    phase_night: 'Түн',
    phase_vote: 'Добуш берүү',
    phase_day: 'Күн',
    round: 'Раунд',
    time_left: 'Калды:',
    transition_in: 'Өтүү:',
    sec: 'сек',

    // Game Actions
    action_required: 'Аракет талап кылынат',
    action_night: 'Бул түнгө максатыңызды тандаңыз.',
    action_vote: 'Кимди шаардан чыгарууну тандаңыз.',
    confirm_choice: 'Тандоону ырастоо',
    action_accepted: 'Аракет кабыл алынды. Башкаларды күтөбүз...',
    confirm_prefix: 'Ырастоо:',
    chat_placeholder: 'Талкуу...',
    send: 'Жөнөтүү',

    // System Messages
    city_sleeps: 'Шаар уйкуда...',
    city_sleeps_desc: 'Ролдор тандоосун жасаганча тынч болуңуз.',
    revote: 'Кайра добуш берүү!',
    in_game: 'Оюнда',
    exiled: 'Чыгарылды',
    nobody_died: 'Жаңы күн! Бул түнү эч ким өлгөн жок.',
    killed_players: 'Түнү өлгөндөр:',
    exiled_player: 'Шаардын чечими менен чыгарылды:',
    nobody_exiled: 'Эч ким чыгарылган жок.',
    events_title: 'Окуялар',
    you_are_dead: 'Сиз оюндан чыктыңыз, бирок көрүп тура аласыз.',
    is_mafia: 'мафия',
    not_mafia: 'мафия эмес',
    is_detective: 'комиссар',
    not_detective: 'комиссар эмес',

    // Connection
    conn_online: 'Байланыш бар',
    conn_offline: 'Байланыш үзүлдү — кайра кошулууда...',
    err_room_not_found: 'Мындай бөлмө табылган жок. Кодду текшериңиз.',
    err_no_connection: 'Интернет байланышы жок же бөлмө жабык.',
    err_name_taken: 'Бул ат ээленген, башкасын жазыңыз.',
    err_room_full: 'Бөлмө толуп калды.',
    err_game_started: 'Оюн башталып кеткен.',
    err_host_no_answer: 'Алып баруучу жооп бербей жатат.',
    err_create_failed: 'Бөлмө түзүлгөн жок. Кайра аракет кылыңыз.',
    err_kicked: 'Алып баруучу сизди бөлмөдөн чыгарды.',
    err_enter_name: 'Атыңызды жазыңыз!',
    err_not_enough_players: 'Оюнду баштоого оюнчулар жетишсиз (кеминде 4).',
    err_start_failed: 'Оюн башталган жок. Кайра аракет кылыңыз.',

    // Host
    host_panel: 'Алып баруучу',
    host_next_role: 'Кийинки рол',
    host_start_vote: 'Добуш берүүнү баштоо',
    host_end_day: 'Күндү аяктоо',
    host_players_status: 'Оюнчулардын абалы',
    host_alive: 'Тирүү',
    host_dead: 'Өлдү',
    host_autovoice: 'Авто-үн',
    host_in_game: 'оюнчу оюнда',

    // Game Over
    game_over: 'ОЮН БҮТТҮ',
    winners_mafia: 'Мафия жеңди',
    winners_citizens: 'Тынч жарандар шаарды сактап калды',
    winners_maniac: 'Маньяк жеңди!',
    msg_win_citizens: 'Бардык жамандар жок кылынды! Тынч жарандар шаарын сактап калды.',
    msg_win_mafia: 'Мафия шаарды ээледи. Каршылык көрсөтүүгө калгандар аз.',
    msg_win_maniac: 'Маньяк эң акыркы болуп калды жана аңчылыгын бүтүрдү.',
    roles_summary: 'Ролдордун жыйынтыгы',
    return_to_lobby: 'Лоббиге кайтуу',
    home: 'Башкы бетке',
    waiting_host_lobby: 'Алып баруучу баарын лоббиге кайтарганын күтүңүз...',
    leave_confirm: 'Оюндан чыгасызбы?'
  },
  ru: {
    app_title: 'МАФИЯ',
    page_title: 'Мафия — Билим Арена',
    home_title: 'Город засыпает.',
    home_subtitle: 'Выживите — или обманите всех.',
    join_button: 'Войти по коду',
    create_button: 'Создать свою игру',
    avatar_upload: 'Загрузить фото',
    enter_name: 'Введите имя...',
    enter_code: 'Например: M4FA',
    join_game: 'Присоединиться к игре',
    create_room_btn: 'Создать комнату',
    close: 'Закрыть',
    connecting: 'Подключение...',
    back_to_game: 'Вернуться в игру',
    host_hint: 'Создавая комнату, вы становитесь ведущим и сами не играете.',
    file_too_large: 'Файл слишком большой (не больше 5 МБ).',
    back_to_site: 'Билим Арена',
    language: 'Язык',
    theme: 'Тема',

    lobby_title: 'Код комнаты:',
    players: 'Игроки',
    invite_friends: 'Отсканируйте QR-код или продиктуйте код друзьям!',
    waiting_host: 'Ждём, когда ведущий начнёт игру...',
    start_game: 'Начать игру',
    host_badge: 'Ведущий',
    copy_link: 'Скопировать ссылку',
    link_copied: 'Ссылка скопирована!',
    kick: 'Удалить',
    need_players: 'Нужно минимум 4 игрока (недостающих заменят боты)',
    bot_name: 'Бот {n}',

    role_don: 'Дон мафии',
    role_mafia: 'Мафия',
    role_doctor: 'Доктор',
    role_detective: 'Комиссар',
    role_maniac: 'Маньяк',
    role_citizen: 'Мирный житель',
    role_spectator: 'Ведущий',
    role_putana: 'Гипнотизёр',
    role_bodyguard: 'Телохранитель',
    hidden: 'Скрыто',
    your_role: 'Ваша роль',
    dead: 'Убит',

    desc_don: 'Глава мафии. Ночью вы просыпаетесь первым и ищете Комиссара, затем вместе с мафией выбираете жертву.',
    desc_mafia: 'Вы мафия. Ночью вместе с сообщниками выбираете одну жертву. Днём притворяйтесь мирным жителем.',
    desc_doctor: 'Ваша задача — спасать людей. Каждую ночь вы выбираете игрока и спасаете его от смерти.',
    desc_detective: 'Вы представитель закона. Каждую ночь проверяете одного игрока и узнаёте, мафия ли он. Днём помогите городу!',
    desc_maniac: 'Одинокий убийца. Вы играете сами за себя и каждую ночь выбираете жертву. Цель — остаться последним!',
    desc_citizen: 'Мирный житель. Ночью вы спите. Цель — днём обсуждать и вычислить мафию!',
    desc_spectator: 'Вы ведёте игру: управляете фазами, но сами не играете.',
    desc_putana: 'Ночью вы усыпляете одного игрока — его роль в эту ночь не сработает.',
    desc_bodyguard: 'Вы защищаете игрока. Если на него нападут, удар примете вы.',
    blocked_tonight: 'Этой ночью вас усыпил гипнотизёр — ваша роль не действует.',

    phase_night: 'Ночь',
    phase_vote: 'Голосование',
    phase_day: 'День',
    round: 'Раунд',
    time_left: 'Осталось:',
    transition_in: 'Переход через:',
    sec: 'сек',

    action_required: 'Нужно действие',
    action_night: 'Выберите цель на эту ночь.',
    action_vote: 'Выберите, кого изгнать из города.',
    confirm_choice: 'Подтвердить выбор',
    action_accepted: 'Действие принято. Ждём остальных...',
    confirm_prefix: 'Подтвердить:',
    chat_placeholder: 'Обсуждение...',
    send: 'Отправить',

    city_sleeps: 'Город спит...',
    city_sleeps_desc: 'Сохраняйте тишину, пока активные роли делают выбор.',
    revote: 'Переголосование!',
    in_game: 'В игре',
    exiled: 'Изгнан',
    nobody_died: 'Новый день! Этой ночью никто не погиб.',
    killed_players: 'Ночью погибли:',
    exiled_player: 'Решением города изгнан:',
    nobody_exiled: 'Никто не изгнан.',
    events_title: 'События',
    you_are_dead: 'Вы выбыли, но можете наблюдать за игрой.',
    is_mafia: 'мафия',
    not_mafia: 'не мафия',
    is_detective: 'комиссар',
    not_detective: 'не комиссар',

    conn_online: 'Связь есть',
    conn_offline: 'Связь потеряна — переподключаемся...',
    err_room_not_found: 'Комната не найдена. Проверьте код.',
    err_no_connection: 'Нет соединения или комната закрыта.',
    err_name_taken: 'Это имя занято, выберите другое.',
    err_room_full: 'Комната заполнена.',
    err_game_started: 'Игра уже началась.',
    err_host_no_answer: 'Ведущий не отвечает.',
    err_create_failed: 'Не удалось создать комнату. Попробуйте ещё раз.',
    err_kicked: 'Ведущий удалил вас из комнаты.',
    err_enter_name: 'Введите имя!',
    err_not_enough_players: 'Недостаточно игроков для старта (нужно минимум 4).',
    err_start_failed: 'Игра не началась. Попробуйте ещё раз.',

    host_panel: 'Ведущий',
    host_next_role: 'Следующая роль',
    host_start_vote: 'Начать голосование',
    host_end_day: 'Завершить день',
    host_players_status: 'Статус игроков',
    host_alive: 'Жив',
    host_dead: 'Мёртв',
    host_autovoice: 'Авто-озвучка',
    host_in_game: 'игроков в игре',

    game_over: 'ИГРА ОКОНЧЕНА',
    winners_mafia: 'Победила мафия',
    winners_citizens: 'Мирные жители спасли город',
    winners_maniac: 'Победил маньяк!',
    msg_win_citizens: 'Все злодеи уничтожены! Мирные жители спасли свой город.',
    msg_win_mafia: 'Мафия захватила город. Сопротивляться почти некому.',
    msg_win_maniac: 'Маньяк остался последним и закончил свою охоту.',
    roles_summary: 'Итоги ролей',
    return_to_lobby: 'Вернуться в лобби',
    home: 'На главную',
    waiting_host_lobby: 'Ждём, пока ведущий вернёт всех в лобби...',
    leave_confirm: 'Выйти из игры?'
  },
  en: {
    app_title: 'MAFIA',
    page_title: 'Mafia — Bilim Arena',
    home_title: 'The city falls asleep.',
    home_subtitle: 'Survive — or fool everyone.',
    join_button: 'Join with a code',
    create_button: 'Create your own game',
    avatar_upload: 'Upload a photo',
    enter_name: 'Enter your name...',
    enter_code: 'For example: M4FA',
    join_game: 'Join the game',
    create_room_btn: 'Create a room',
    close: 'Close',
    connecting: 'Connecting...',
    back_to_game: 'Back to the game',
    host_hint: 'If you create a room, you become the host and do not play yourself.',
    file_too_large: 'The file is too large (5 MB at most).',
    back_to_site: 'Bilim Arena',
    language: 'Language',
    theme: 'Theme',

    lobby_title: 'Room code:',
    players: 'Players',
    invite_friends: 'Scan the QR code or share the code with your friends!',
    waiting_host: 'Waiting for the host to start the game...',
    start_game: 'Start the game',
    host_badge: 'Host',
    copy_link: 'Copy link',
    link_copied: 'Link copied!',
    kick: 'Remove',
    need_players: 'At least 4 players are needed (bots fill the empty seats)',
    bot_name: 'Bot {n}',

    role_don: 'Mafia Don',
    role_mafia: 'Mafia',
    role_doctor: 'Doctor',
    role_detective: 'Detective',
    role_maniac: 'Maniac',
    role_citizen: 'Citizen',
    role_spectator: 'Host',
    role_putana: 'Hypnotist',
    role_bodyguard: 'Bodyguard',
    hidden: 'Hidden',
    your_role: 'Your role',
    dead: 'Dead',

    desc_don: 'Head of the mafia. At night you wake up first and look for the Detective, then choose a victim together with the mafia.',
    desc_mafia: 'You are the mafia. At night you and your partners choose one victim. In the day, try to look like an ordinary citizen.',
    desc_doctor: 'Your job is to save people. Every night you choose a player and save them from death.',
    desc_detective: 'You represent the law. Every night you check one player to learn whether they are mafia. Help the city in the day!',
    desc_maniac: 'A lone killer. You play for yourself and choose a victim every night. Your goal is to be the last one standing!',
    desc_citizen: 'An ordinary citizen. You sleep at night. Your goal is to talk in the day and find the mafia!',
    desc_spectator: 'You run the game: you control the phases but do not play yourself.',
    desc_putana: 'At night you put one player to sleep — their role does not work that night.',
    desc_bodyguard: 'You protect a player. If they are attacked, you take the blow.',
    blocked_tonight: 'The hypnotist put you to sleep tonight — your role does not work.',

    phase_night: 'Night',
    phase_vote: 'Vote',
    phase_day: 'Day',
    round: 'Round',
    time_left: 'Left:',
    transition_in: 'Next in:',
    sec: 's',

    action_required: 'Action required',
    action_night: 'Choose your target for tonight.',
    action_vote: 'Choose who to send out of the city.',
    confirm_choice: 'Confirm choice',
    action_accepted: 'Action accepted. Waiting for the others...',
    confirm_prefix: 'Confirm:',
    chat_placeholder: 'Discussion...',
    send: 'Send',

    city_sleeps: 'The city is asleep...',
    city_sleeps_desc: 'Stay quiet while the active roles make their choice.',
    revote: 'Revote!',
    in_game: 'In the game',
    exiled: 'Exiled',
    nobody_died: 'A new day! Nobody died last night.',
    killed_players: 'Killed last night:',
    exiled_player: 'The city exiled:',
    nobody_exiled: 'Nobody was exiled.',
    events_title: 'Events',
    you_are_dead: 'You are out of the game, but you can keep watching.',
    is_mafia: 'mafia',
    not_mafia: 'not mafia',
    is_detective: 'the detective',
    not_detective: 'not the detective',

    conn_online: 'Connected',
    conn_offline: 'Connection lost — reconnecting...',
    err_room_not_found: 'Room not found. Check the code.',
    err_no_connection: 'No connection, or the room is closed.',
    err_name_taken: 'This name is taken, choose another one.',
    err_room_full: 'The room is full.',
    err_game_started: 'The game has already started.',
    err_host_no_answer: 'The host is not answering.',
    err_create_failed: 'Could not create the room. Try again.',
    err_kicked: 'The host removed you from the room.',
    err_enter_name: 'Enter your name!',
    err_not_enough_players: 'Not enough players to start (at least 4).',
    err_start_failed: 'The game did not start. Try again.',

    host_panel: 'Host',
    host_next_role: 'Next role',
    host_start_vote: 'Start the vote',
    host_end_day: 'End the day',
    host_players_status: 'Players',
    host_alive: 'Alive',
    host_dead: 'Dead',
    host_autovoice: 'Auto voice',
    host_in_game: 'players in the game',

    game_over: 'GAME OVER',
    winners_mafia: 'The mafia wins',
    winners_citizens: 'The citizens saved the city',
    winners_maniac: 'The maniac wins!',
    msg_win_citizens: 'All the villains are gone! The citizens saved their city.',
    msg_win_mafia: 'The mafia took over the city. Too few are left to resist.',
    msg_win_maniac: 'The maniac is the last one standing and has finished the hunt.',
    roles_summary: 'Roles',
    return_to_lobby: 'Back to the lobby',
    home: 'Home',
    waiting_host_lobby: 'Waiting for the host to bring everyone back to the lobby...',
    leave_confirm: 'Leave the game?'
  }
};

export const LANGS = ['ky', 'ru', 'en'];

function readLang() {
  try {
    // ?lang=ru в ссылке (как у остальных игр сайта)
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (LANGS.includes(fromUrl)) {
      localStorage.setItem('BA2_lang', JSON.stringify(fromUrl));
      return fromUrl;
    }
    const site = JSON.parse(localStorage.getItem('BA2_lang') || 'null');
    if (LANGS.includes(site)) return site;
    const old = localStorage.getItem('mafia_lang');
    if (LANGS.includes(old)) return old;
  } catch { /* хранилище недоступно */ }
  return 'ky';
}

let currentLang = readLang();
document.documentElement.lang = currentLang;
document.title = translations[currentLang].page_title;
const listeners = new Set();

export function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  document.documentElement.lang = lang;
  document.title = translations[lang].page_title;
  try { localStorage.setItem('BA2_lang', JSON.stringify(lang)); } catch { /* приватный режим */ }
  listeners.forEach((listener) => listener(lang));
}

export function getLanguage() { return currentLang; }

/** Перевод по ключу; {n} в строке заменяется значением из vars */
export function t(key, vars) {
  let str = translations[currentLang]?.[key] ?? translations.ky[key] ?? key;
  if (vars) str = str.replace(/\{(\w+)\}/g, (m, name) => (vars[name] !== undefined ? vars[name] : m));
  return str;
}

/** Название роли на выбранном языке */
export function roleName(role) {
  return role ? t('role_' + role) : '';
}

export function useTranslation() {
  const [lang, setLangState] = useState(currentLang);

  useEffect(() => {
    const handleLangChange = (newLang) => setLangState(newLang);
    listeners.add(handleLangChange);
    return () => { listeners.delete(handleLangChange); };
  }, []);

  return { t, lang, setLanguage };
}

export const i18nTranslations = translations;
