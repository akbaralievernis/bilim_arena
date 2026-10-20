/**
 * Фразы ведущего, которые звучат вслух (панель ведущего на проекторе).
 *
 * Один источник и для игры, и для скрипта scripts/make-voice.mjs, который
 * заранее озвучивает их через ElevenLabs. Если текст фразы здесь изменить,
 * старая запись перестанет совпадать и игра будет читать текст голосом браузера,
 * пока озвучку не сделают заново — неверная запись не прозвучит.
 *
 * Имён игроков здесь нет: их нельзя записать заранее, поэтому имена — на экране.
 */
export const PHRASES = {
  ky: {
    night_start: 'Түн кирди. Шаар уйкуга кетти.',
    putana: 'Гипнозчу ойгонду. Ал бул түнү кимди уктатат?',
    don: 'Мафиянын Дону ойгонду. Ал Комиссарды издейт.',
    mafia: 'Мафия аңчылыкка чыкты. Алар кимди тандайт?',
    doctor: 'Дарыгер ойгонду. Ал кимди сактап калат?',
    bodyguard: 'Сакчы кароолго чыкты. Ал кимди коргойт?',
    detective: 'Комиссар ойгонду. Ал кимди текшерет?',
    maniac: 'Маньяк көлөкөдөн чыкты. Кийинки курмандык ким?',
    day_discussion: 'Таң атты. Шаар ойгонду. Ким ойгонбой калганын көрөлү...',
    night_victims: 'Бул түнү шаар жоготууга учурады. Курмандыктардын аттары экранда.',
    night_nobody: 'Бул түнү эч ким өлгөн жок.',
    voting: 'Адилеттиктин убагы келди. Шаар чечим чыгарсын.',
    revote: 'Добуштар тең болду. Кайра добуш бергиле.',
    exiled: 'Шаар чечим чыгарды. Чыгарылган оюнчунун аты экранда.',
    nobody_exiled: 'Бул жолу эч ким чыгарылган жок.',
    win_citizens: 'Оюн бүттү. Тынч жарандар шаарды сактап калды!',
    win_mafia: 'Оюн бүттү. Мафия шаарды ээледи.',
    win_maniac: 'Оюн бүттү. Маньяк жалгыз калды.'
  },
  ru: {
    night_start: 'Наступает ночь. Весь город засыпает.',
    putana: 'Просыпается Гипнотизёр. Кого он усыпит этой ночью?',
    don: 'Просыпается Дон мафии. Он ищет комиссара.',
    mafia: 'Мафия выходит на охоту. Кого они уберут?',
    doctor: 'Просыпается Доктор. Кого он будет лечить?',
    bodyguard: 'Телохранитель выходит на патруль. Кого он защитит?',
    detective: 'Просыпается Комиссар. Кого он проверит?',
    maniac: 'Маньяк выходит из тени. Кто станет жертвой?',
    day_discussion: 'Наступило утро. Посмотрим, кто не проснулся...',
    night_victims: 'Этой ночью город понёс потери. Имена — на экране.',
    night_nobody: 'Этой ночью никто не погиб.',
    voting: 'Пришло время правосудия. Городу пора сделать выбор.',
    revote: 'Голоса разделились поровну. Голосуем ещё раз.',
    exiled: 'Город принял решение. Имя изгнанного — на экране.',
    nobody_exiled: 'На этот раз никто не изгнан.',
    win_citizens: 'Игра окончена. Мирные жители спасли город!',
    win_mafia: 'Игра окончена. Мафия захватила город.',
    win_maniac: 'Игра окончена. Маньяк остался один.'
  },
  en: {
    night_start: 'Night falls. The whole city goes to sleep.',
    putana: 'The Hypnotist wakes up. Who will they put to sleep tonight?',
    don: 'The Mafia Don wakes up and looks for the Detective.',
    mafia: 'The mafia goes hunting. Who will they choose?',
    doctor: 'The Doctor wakes up. Who will they save?',
    bodyguard: 'The Bodyguard goes on patrol. Who will they protect?',
    detective: 'The Detective wakes up. Who will they check?',
    maniac: 'The Maniac steps out of the shadows. Who is next?',
    day_discussion: 'Morning has come. Let us see who did not wake up...',
    night_victims: 'The city lost someone tonight. The names are on the screen.',
    night_nobody: 'Nobody died tonight.',
    voting: 'It is time for justice. The city must decide.',
    revote: 'The votes are tied. Vote again.',
    exiled: 'The city has decided. The name is on the screen.',
    nobody_exiled: 'Nobody was exiled this time.',
    win_citizens: 'The game is over. The citizens saved their city!',
    win_mafia: 'The game is over. The mafia took over the city.',
    win_maniac: 'The game is over. The maniac is the last one standing.'
  }
};
