import { useState, useEffect } from 'react';

const translations = {
  ky: {
    // Home
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

    // Lobby
    lobby_title: 'Бөлмөнүн коду:',
    players: 'Оюнчулар',
    invite_friends: 'QR-кодду сканерлеңиз же кодду досторуңузга бериңиз!',
    waiting_host: 'Алып баруучу оюнду баштаганын күтүңүз...',
    start_game: 'Оюнду баштоо',
    host_badge: 'Алып баруучу',
    copy_link: '🔗 Шилтемени көчүрүү',
    link_copied: 'Шилтеме көчүрүлдү!',
    kick: 'Чыгаруу',
    need_players: 'Кеминде 4 оюнчу керек (жетишпесе робот кошулат)',

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
    desc_don: '🔍 Мафиянын башчысы. Түнкүсүн биринчи ойгонуп Комиссарды издейсиз, андан соң мафия менен бирге курмандык тандайсыз.',
    desc_mafia: '🔪 Сиз мафиясыз. Түнкүсүн шериктериңиз менен бир курмандык тандайсыз. Күндүз тынч жарандай көрүнүүгө аракет кылыңыз.',
    desc_doctor: '🛡️ Сиздин милдетиңиз — адамдарды сактоо. Ар түнү бир оюнчуну тандап, аны өлүмдөн куткарасыз.',
    desc_detective: '🔎 Сиз мыйзам өкүлүсүз. Ар түнү бир оюнчуну текшерип, анын мафия экенин билесиз. Күндүз шаарга жардам бериңиз!',
    desc_maniac: '🩸 Жалгыз киши өлтүргүч. Өзүңүз үчүн ойнойсуз. Ар түнү бир курмандык тандайсыз. Максат — эң акыркы болуп калуу!',
    desc_citizen: '🧑‍🌾 Тынч жаран. Түнкүсүн уктайсыз. Максатыңыз — күндүз сүйлөшүп, мафияны табуу!',
    desc_spectator: '👁️ Сиз оюнду алып барасыз: фазаларды башкарасыз, бирок оюнга кийлигишпейсиз.',
    desc_putana: '💫 Түнү бир оюнчуну уктатасыз — ал түнү анын ролу иштебейт.',
    desc_bodyguard: '🛡️ Бир оюнчуну коргойсуз. Ага кол салса, соккуну өзүңүз аласыз.',

    // Game Phases
    phase_night: 'Түн',
    phase_vote: 'Добуш берүү',
    phase_day: 'Күн',
    round: 'Раунд',
    time_left: '⏳ Калды:',
    transition_in: '⏭ Өтүү:',
    sec: 'сек',

    // Game Actions
    action_required: 'Аракет талап кылынат',
    action_night: 'Бул түнгө максатыңызды тандаңыз.',
    action_vote: 'Кимди шаардан чыгарууну тандаңыз.',
    confirm_choice: 'Тандоону ырастоо',
    action_accepted: 'Аракет кабыл алынды. Башкаларды күтөбүз...',
    confirm_prefix: 'Ырастоо:',
    chat_placeholder: 'Талкуу...',

    // System Messages
    city_sleeps: 'Шаар уйкуда...',
    city_sleeps_desc: 'Ролдор тандоосун жасаганча тынч болуңуз.',
    revote: 'Кайра добуш берүү!',
    in_game: 'Оюнда',
    exiled: 'Чыгарылды',
    nobody_died: '☀️ Жаңы күн! Бул түнү эч ким өлгөн жок.',
    killed_players: '💀 Түнү өлгөндөр:',
    exiled_player: '⚖️ Шаардын чечими менен чыгарылды:',
    nobody_exiled: '⚖️ Эч ким чыгарылган жок.',
    events_title: 'Окуялар',
    you_are_dead: 'Сиз оюндан чыктыңыз, бирок көрүп тура аласыз.',

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
    winners_mafia: 'Мафия жеңди 🩸',
    winners_citizens: 'Тынч жарандар шаарды сактап калды 🛡️',
    winners_maniac: 'Маньяк жеңди! 🔪',
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
    role_putana: 'Гипнотизёр',
    role_bodyguard: 'Телохранитель',
    desc_putana: '💫 Ночью вы усыпляете одного игрока — его роль в эту ночь не сработает.',
    desc_bodyguard: '🛡️ Вы защищаете игрока. Если на него нападут, вы примете удар на себя.',
    connecting: 'Подключение...',
    back_to_game: 'Вернуться в игру',
    host_hint: 'Создавая комнату, вы становитесь ведущим и сами не играете.',
    copy_link: '🔗 Скопировать ссылку',
    link_copied: 'Ссылка скопирована!',
    kick: 'Удалить',
    need_players: 'Нужно минимум 4 игрока (недостающих заменят боты)',
    confirm_prefix: 'Подтвердить:',
    chat_placeholder: 'Обсуждение...',
    nobody_died: '☀️ Новый день! Этой ночью никто не погиб.',
    killed_players: '💀 Ночью погибли:',
    exiled_player: '⚖️ Город изгнал:',
    nobody_exiled: '⚖️ Никто не изгнан.',
    events_title: 'События',
    you_are_dead: 'Вы выбыли, но можете наблюдать за игрой.',
    conn_online: 'Связь есть',
    conn_offline: 'Связь потеряна — переподключаемся...',
    err_room_not_found: 'Комната не найдена. Проверьте код.',
    err_no_connection: 'Нет соединения или комната закрыта.',
    err_name_taken: 'Это имя занято, выберите другое.',
    err_room_full: 'Комната переполнена.',
    err_game_started: 'Игра уже началась.',
    err_host_no_answer: 'Ведущий не отвечает.',
    err_create_failed: 'Не удалось создать комнату. Попробуйте ещё раз.',
    err_kicked: 'Ведущий удалил вас из комнаты.',
    err_enter_name: 'Введите имя!',
    host_panel: 'Ведущий',
    host_next_role: 'Следующая роль',
    host_start_vote: 'Начать голосование',
    host_end_day: 'Завершить день',
    host_players_status: 'Статус игроков',
    host_alive: 'Жив',
    host_dead: 'Мёртв',
    host_autovoice: 'Авто-озвучка',
    host_in_game: 'игроков в игре',
    msg_win_citizens: 'Все злодеи уничтожены! Мирные жители спасли свой город.',
    msg_win_mafia: 'Мафия захватила контроль над городом.',
    msg_win_maniac: 'Маньяк остался последним выжившим злодеем.',
    roles_summary: 'Итоги ролей',
    waiting_host_lobby: 'Ожидайте, пока ведущий вернёт всех в лобби...',
    leave_confirm: 'Выйти из игры?',
    // Home
    home_title: 'Город засыпает.',
    home_subtitle: 'Вам нужно выжить или обмануть всех.',
    join_button: 'Присоединиться по коду',
    create_button: 'Создать свою игру',
    avatar_upload: 'Загрузить аватар',
    enter_name: 'Введите ваше имя...',
    enter_code: 'Например: M4F1A',
    join_game: 'Присоединиться к игре',
    create_room_btn: 'Создать комнату',
    close: 'Закрыть',

    // Lobby
    lobby_title: 'Код комнаты:',
    players: 'Игроки',
    invite_friends: 'Приглашайте друзей по этому коду!',
    waiting_host: 'Ожидание запуска игры хостом...',
    start_game: 'Начать игру',
    host_badge: 'Ведущий',

    // Game Roles
    role_don: 'Дон мафии',
    role_mafia: 'Мафия',
    role_doctor: 'Доктор',
    role_detective: 'Комиссар',
    role_maniac: 'Маньяк',
    role_citizen: 'Мирный ',
    role_spectator: 'Зритель',
    hidden: 'Скрыто',
    your_role: 'Ваша роль',
    dead: 'Убит',

    // Role Descriptions
    desc_don: '🔍 Глава мафии. Ночью вы просыпаетесь первым и ищете Комиссара, чтобы узнать его личность. Днем голосуйте как мирный, чтобы отвести подозрения.',
    desc_mafia: '🔪 Вы в клане мафии. Ночью вы просыпаетесь вместе со своими и выбираете одну жертву. Днем притворяйтесь мирным, чтобы вас не повесили.',
    desc_doctor: '🛡️ Ваша задача — спасать людей. Каждую ночь вы выбираете одного игрока, чтобы вылечить его от нападения. Спасите тех, кто важен городу!',
    desc_detective: '🔎 Вы представитель закона. Каждую ночь вы проверяете одного игрока, чтобы узнать, мафия он или нет. Помогите мирным вычислить бандитов днем!',
    desc_maniac: '🩸 Одинокий убийца. Вы играете сами за себя. Каждую ночь вы выходите на охоту и убиваете жертву. Ваша цель — остаться последним выжившим!',
    desc_citizen: '🧑‍🌾 Мирный житель. У вас нет ночных действий (спите крепко). Ваша цель — днем анализировать поведение других и вычислить мафию!',
    desc_spectator: '👁️ Наблюдатель. Вы видите всю картину игры, следите за ночными действиями и обсуждениями, но не можете влиять на игру напрямую.',

    // Game Phases
    phase_night: 'Ночь',
    phase_vote: 'Голосование',
    phase_day: 'День',
    round: 'Раунд',
    time_left: '⏳ Осталось:',
    transition_in: '⏭ Переход через:',
    sec: 'сек',

    // Game Actions
    action_required: 'Действие требуется',
    action_night: 'Выберите вашу цель на эту ночь.',
    action_vote: 'Выберите, кого изгнать на дневном голосовании.',
    confirm_choice: 'Подтвердить выбор',
    action_accepted: 'Действие принято. Ожидаем остальных...',

    // System Messages
    city_sleeps: 'Город засыпает...',
    city_sleeps_desc: 'Подождите, пока активные роли сделают свой выбор. Сохраняйте тишину.',
    revote: 'Переголосование!',
    in_game: 'В игре',
    exiled: 'Исключен',

    // Spectator Screen
    spectator_title_night: 'Ночь: Город засыпает',
    spectator_title_vote: 'Дневное голосование',
    spectator_title_day: 'День: Обсуждение',
    spectator_main_screen: 'Главный Экран',
    spectator_active_roles: 'Активные роли делают свой выбор...',
    spectator_don_chooses: '— 🕴️ Дон ищет комиссара',
    spectator_mafia_chooses: '— 🗡️ Мафия выбирает жертву',
    spectator_doctor_chooses: '— 🛡️ Доктор спешит на помощь',
    spectator_detective_chooses: '— 🔍 Комиссар ищет мафию',
    spectator_maniac_chooses: '— 🔪 Маньяк вышел на охоту',
    spectator_discussion: 'Идет обсуждение. Выслушайте каждого!',

    // Game Over
    game_over: 'ИГРА ОКОНЧЕНА',
    winners_mafia: 'Победила Мафия 🩸',
    winners_citizens: 'Мирные жители спасли город 🛡️',
    winners_maniac: 'Выживших больше нет. Победил Маньяк! 🔪',
    return_to_lobby: 'Вернуться в лобби',
    home: 'На главную',

    // TTS Fallbacks
    tts_night_starts: 'Наступает ночь. Город засыпает.',
    tts_don_wakes: 'Просыпается Дон мафии и ищет комиссара.',
    tts_mafia_wakes: 'Просыпается мафия.',
    tts_mafia_attacks: 'Мафия выбирает жертву.',
    tts_doctor_wakes: 'Просыпается доктор и делает выбор.',
    tts_detective_wakes: 'Просыпается комиссар полици и ищет мафию.',
    tts_maniac_wakes: 'Просыпается маньяк и выходит на охоту.',
    tts_day_starts: 'Наступил день. Город просыпается.',
    tts_voting_time: 'Время голосования! Кого посадим в тюрьму?'
  },
  de: {
    // Home
    home_title: 'Die Stadt schläft ein.',
    home_subtitle: 'Du musst überleben oder alle täuschen.',
    join_button: 'Mit Code beitreten',
    create_button: 'Neues Spiel erstellen',
    avatar_upload: 'Avatar hochladen',
    enter_name: 'Gib deinen Namen ein...',
    enter_code: 'Zum Beispiel: M4F1A',
    join_game: 'Spiel beitreten',
    create_room_btn: 'Raum erstellen',
    close: 'Schließen',

    // Lobby
    lobby_title: 'Raumcode:',
    players: 'Spieler',
    invite_friends: 'Lade deine Freunde mit diesem Code ein!',
    waiting_host: 'Warten auf den Spielleiter...',
    start_game: 'Spiel starten',
    host_badge: 'Spielleiter',

    // Game Roles
    role_don: 'Don Mafia',
    role_mafia: 'Mafia',
    role_doctor: 'Arzt',
    role_detective: 'Kommissar',
    role_maniac: 'Maniac',
    role_citizen: 'Bürger',
    role_spectator: 'Zuschauer',
    hidden: 'Versteckt',
    your_role: 'Deine Rolle',
    dead: 'Getötet',

    // Role Descriptions
    desc_don: '🔍 Der Anführer der Mafia. Nachts suchen Sie als Erster nach dem Kommissar. Stimmen Sie am Tag wie ein Bürger ab, um keinen Verdacht zu erregen.',
    desc_mafia: '🔪 Du bist im Clan der Mafia. Nachts wählt ihr gemeinsam ein Opfer. Täusche am Tag alle, damit sie denken, du seist ein Bürger.',
    desc_doctor: '🛡️ Deine Aufgabe ist es, Leben zu retten. Wähle jede Nacht einen Spieler, um ihn vor einem Angriff zu schützen.',
    desc_detective: '🔎 Du bist das Gesetz. Überprüfe jede Nacht einen Spieler, um zu sehen, ob er zur Mafia gehört. Hilf der Stadt am Tag, die Banditen zu finden!',
    desc_maniac: '🩸 Ein einsamer Mörder. Du spielst nur für dich. Wähle jede Nacht ein Opfer. Dein Ziel: als Letzter am Leben zu bleiben!',
    desc_citizen: '🧑‍🌾 Ein friedlicher Bürger. Du hast nachts keine Aktionen. Dein Ziel ist es, das Verhalten der anderen am Tag zu analysieren und die Mafia zu finden!',
    desc_spectator: '👁️ Beobachter. Du siehst alles, was im Spiel passiert, kannst aber nicht direkt eingreifen.',

    // Game Phases
    phase_night: 'Nacht',
    phase_vote: 'Abstimmung',
    phase_day: 'Tag',
    round: 'Runde',
    time_left: '⏳ Übrig:',
    transition_in: '⏭ Wechsel in:',
    sec: 'sek',

    // Game Actions
    action_required: 'Aktion erforderlich',
    action_night: 'Wähle dein Ziel für diese Nacht.',
    action_vote: 'Wähle, wen du bei der Wahl ausschließen möchtest.',
    confirm_choice: 'Auswahl bestätigen',
    action_accepted: 'Aktion akzeptiert. Warten auf die anderen...',

    // System Messages
    city_sleeps: 'Die Stadt schläft ein...',
    city_sleeps_desc: 'Warte, bis die aktiven Rollen ihre Wahl treffen. Bleib ruhig.',
    revote: 'Neuabstimmung!',
    in_game: 'Im Spiel',
    exiled: 'Ausgeschlossen',

    // Spectator Screen
    spectator_title_night: 'Nacht: Die Stadt schläft',
    spectator_title_vote: 'Tagesabstimmung',
    spectator_title_day: 'Tag: Diskussion',
    spectator_main_screen: 'Hauptbildschirm',
    spectator_active_roles: 'Aktive Rollen treffen ihre Wahl...',
    spectator_don_chooses: '— 🕴️ Don sucht den Kommissar',
    spectator_mafia_chooses: '— 🗡️ Mafia wählt ein Opfer',
    spectator_doctor_chooses: '— 🛡️ Arzt eilt zur Hilfe',
    spectator_detective_chooses: '— 🔍 Kommissar sucht die Mafia',
    spectator_maniac_chooses: '— 🔪 Maniac geht auf die Jagd',
    spectator_discussion: 'Die Diskussion läuft. Hör jedem zu!',

    // Game Over
    game_over: 'SPIEL BEENDET',
    winners_mafia: 'Die Mafia gewinnt 🩸',
    winners_citizens: 'Die Bürger haben die Stadt gerettet 🛡️',
    winners_maniac: 'Keine Überlebenden. Der Maniac gewinnt! 🔪',
    return_to_lobby: 'Zurück zur Lobby',
    home: 'Hauptmenü',

    // TTS Fallbacks
    tts_night_starts: 'Die Nacht beginnt. Die Stadt schläft ein.',
    tts_don_wakes: 'Der Don erwacht und sucht den Kommissar.',
    tts_mafia_wakes: 'Die Mafia erwacht.',
    tts_mafia_attacks: 'Die Mafia wählt ein Opfer.',
    tts_doctor_wakes: 'Der Arzt erwacht und trifft seine Wahl.',
    tts_detective_wakes: 'Der Kommissar erwacht und sucht die Mafia.',
    tts_maniac_wakes: 'Der Maniac erwacht und geht auf die Jagd.',
    tts_day_starts: 'Der Tag ist gekommen. Die Stadt erwacht.',
    tts_voting_time: 'Zeit zur Abstimmung! Wen schicken wir ins Gefängnis?'
  }
};

let currentLang = localStorage.getItem('mafia_lang') || 'ky';
const listeners = new Set();

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('mafia_lang', lang);
    listeners.forEach(listener => listener(lang));
  }
}

export function getLanguage() { return currentLang; }

export function t(key) {
  return translations[currentLang]?.[key] || translations.ky[key] || translations.ru[key] || key;
}

/** Название роли на выбранном языке */
export function roleName(role) {
  return role ? t('role_' + role) : '';
}

export function useTranslation() {
  const [lang, setLangState] = useState(currentLang);

  useEffect(() => {
    const handleLangChange = (newLang) => {
      setLangState(newLang);
    };
    listeners.add(handleLangChange);
    return () => {
      listeners.delete(handleLangChange);
    };
  }, []);

  return { t, lang, setLanguage };
}

export const i18nTranslations = translations;
