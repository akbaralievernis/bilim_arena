/**
 * Bilim Arena — тексты «Купуялык» (privacy.html) и «Колдонуу шарттары» (terms.html).
 * Описывают то, что сайт делает на самом деле: при изменении хранения данных
 * или сторонних сервисов обновите текст и дату UPDATED.
 */

export const UPDATED = '2026-10-11';
export const CONTACT_URL = 'https://github.com/akbaralievernis/bilim_arena/issues';

const L = (ky, ru, en) => ({ ky, ru, en });
const list = (...items) => ({ list: items });

export const PRIVACY = {
  title: L('Купуялык саясаты', 'Политика конфиденциальности', 'Privacy policy'),
  intro: L(
    'Билим Арена — окуучулар жана мугалимдер үчүн акысыз билим берүү долбоору. Бул бетте сайт кандай маалыматтарды колдонору, алар кайда сакталары жана аларды кантип өчүрүүгө болору жазылган.',
    'Билим Арена — бесплатный образовательный проект для учеников и учителей. Здесь написано, какие данные использует сайт, где они хранятся и как их удалить.',
    'Bilim Arena is a free educational project for students and teachers. This page explains which data the site uses, where it is stored and how to delete it.'
  ),
  sections: [
    {
      title: L('Кыскача', 'Коротко', 'In short'),
      body: [list(
        L('Жарнама жок, көз салуучу жана аналитика кызматтары жок.', 'Нет рекламы, систем слежения и аналитики.', 'No ads, no tracking and no analytics.'),
        L('Окуучуга почта да, сырсөз да керек эмес — аты жетиштүү.', 'Ученику не нужны ни почта, ни пароль — достаточно имени.', 'Students need no email and no password — a name is enough.'),
        L('Прогресс демейде ушул түзмөктө гана сакталат. Булут мектеп же мугалим аккаунттарды туташтырганда гана колдонулат.', 'По умолчанию прогресс хранится только на этом устройстве. Облако используется, только если школа или учитель подключили аккаунты.', 'By default progress stays on this device. The cloud is used only when a school or teacher sets up accounts.'),
        L('Камеранын сүрөтү түзмөктүн өзүндө иштетилет жана эч жакка жөнөтүлбөйт.', 'Изображение с камеры обрабатывается на самом устройстве и никуда не отправляется.', 'Camera images are processed on the device itself and are never sent anywhere.'),
        L('Маалыматтарды сатпайбыз жана жарнама үчүн бербейбиз.', 'Мы не продаём данные и не передаём их для рекламы.', 'We do not sell data or share it for advertising.')
      )]
    },
    {
      title: L('Кайсы маалыматтар колдонулат', 'Какие данные используются', 'What data is used'),
      body: [
        L('Окуучу:', 'Ученик:', 'Students:'),
        list(
          L('өзү жазган аты, классы жана тандаган сүрөтү (аватар);', 'имя, которое он сам ввёл, номер класса и выбранная картинка (аватар);', 'the name they type, their grade and the picture (avatar) they choose;'),
          L('жооптору, упайлары (XP), кайсы көндүмдөрдө ката кетиргени, үй тапшырмаларынын жыйынтыгы.', 'ответы, очки (XP), навыки, в которых были ошибки, результаты домашних заданий.', 'answers, points (XP), which skills had mistakes, homework results.')
        ),
        L('Мугалим:', 'Учитель:', 'Teachers:'),
        list(
          L('почта жана сырсөз — булут туташканда гана. Сырсөздү Supabase сактайт, Билим Арена аны көрбөйт;', 'почта и пароль — только при подключённом облаке. Пароль хранит Supabase, Билим Арена его не видит;', 'email and password — only when the cloud is connected. Supabase stores the password; Bilim Arena never sees it;'),
          L('класстар, түзгөн суроолор жана тапшырмалар, сабактардын журналы (окуучулардын аттары жана жыйынтыктары).', 'классы, созданные вопросы и задания, журнал уроков (имена учеников и их результаты).', 'classes, the questions and assignments they create, the lesson log (student names and results).')
        ),
        L('Техникалык маалыматтар:', 'Технические данные:', 'Technical data:'),
        list(
          L('телефон доскага туташканда серверлер IP-даректи көрөт — интернеттин кадимки касиети;', 'при подключении телефона к доске серверы видят IP-адрес — обычное свойство интернета;', 'when a phone connects to the board, servers see its IP address — an ordinary property of the internet;'),
          L('сайтта ката чыкса, ката журналына барак (дарек параметрлерисиз), катанын тексти, тил жана браузер жазылат. Ат, класс коду жана жооптор жазылбайт.', 'если на сайте случается сбой, в журнал ошибок записываются страница (без параметров адреса), текст ошибки, язык и браузер. Имена, коды комнат и ответы не записываются.', 'if something breaks, the error log records the page (without address parameters), the error text, the language and the browser. Names, room codes and answers are not recorded.')
        )
      ]
    },
    {
      title: L('Маалыматтар кайда сакталат', 'Где хранятся данные', 'Where data is stored'),
      body: [list(
        L('Ушул түзмөктө (браузердин сактагычында) — демейде бардыгы ушул жерде.', 'На этом устройстве (в хранилище браузера) — по умолчанию всё хранится здесь.', 'On this device (in the browser’s storage) — by default everything is kept here.'),
        L('Supabase булутунда — мектеп же мугалим аккаунттарды туташтырса: мугалимдин маалыматтары, класстар, тапшырмалар, жыйынтыктар жана окуучулардын прогресси. Эрежелер боюнча мугалим өз окуучуларын гана, окуучу өз маалыматын гана көрөт.', 'В облаке Supabase — если школа или учитель подключили аккаунты: данные учителя, классы, задания, результаты и прогресс учеников. По правилам доступа учитель видит только своих учеников, ученик — только своё.', 'In the Supabase cloud — if a school or teacher sets up accounts: teacher data, classes, assignments, results and student progress. Access rules let a teacher see only their own students and a student only their own data.'),
        L('Доскадагы сабакта жооптор телефондон доскага түз барат (WebRTC). Таанышуу сервери (Cloudflare) байланыш орнотуучу кызматтык билдирүүлөрдү гана өткөрөт. Түз байланыш мүмкүн болбосо, шифрленген трафик Metered ретранслятору (TURN) аркылуу өтөт.', 'На уроке с доской ответы идут с телефона прямо на доску (WebRTC). Сервер знакомства (Cloudflare) передаёт только служебные сообщения для установки связи. Если прямая связь невозможна, зашифрованный трафик идёт через ретранслятор Metered (TURN).', 'In a board lesson, answers go straight from the phone to the board (WebRTC). The connection server (Cloudflare) only passes the technical messages needed to connect. If a direct connection is impossible, encrypted traffic goes through the Metered relay (TURN).')
      )]
    },
    {
      title: L('Микрофон жана камера', 'Микрофон и камера', 'Microphone and camera'),
      body: [list(
        L('Микрофон — «Айт!» бөлүмүндө гана жана баскыч басылганда гана. Сөздү браузердин кызматы тааныйт (мисалы, Chrome’до — Google). Сайт жазууну сактабайт.', 'Микрофон — только в разделе «Айт!» и только по нажатию. Речь распознаёт служба браузера (например, в Chrome — Google). Сайт запись не сохраняет.', 'Microphone — only in the “Speak!” section and only when you press the button. Speech is recognised by the browser’s service (for example Google in Chrome). The site does not keep recordings.'),
        L('Камера — кол менен башкарылуучу оюндарда. Сүрөт түзмөктө (MediaPipe) иштетилет жана эч жакка жөнөтүлбөйт.', 'Камера — в играх с управлением рукой. Изображение обрабатывается на устройстве (MediaPipe) и никуда не отправляется.', 'Camera — in hand-controlled games. The image is processed on the device (MediaPipe) and is never sent anywhere.')
      )]
    },
    {
      title: L('Тышкы кызматтар', 'Сторонние сервисы', 'Third-party services'),
      body: [
        L('Сайт иштеши үчүн төмөнкү кызматтар колдонулат. Барак же байланыш ачылганда алар IP-даректи көрүшөт:', 'Для работы сайта используются эти сервисы. При загрузке страницы или подключении они видят IP-адрес:', 'The site relies on these services. When a page loads or a connection is made, they see the IP address:'),
        list(
          L('GitHub Pages — сайттын өзү;', 'GitHub Pages — сам сайт;', 'GitHub Pages — hosting the site;'),
          L('Supabase — булут (туташкан болсо) жана ката журналы;', 'Supabase — облако (если подключено) и журнал ошибок;', 'Supabase — the cloud (if connected) and the error log;'),
          L('Cloudflare — доска менен телефондордун таанышуу сервери; запаста — PeerJS’тин жалпы сервери;', 'Cloudflare — сервер знакомства доски и телефонов; запасной — общий сервер PeerJS;', 'Cloudflare — the board and phone connection server; the public PeerJS server as a backup;'),
          L('Metered — түз байланыш болбогондо ретранслятор (TURN);', 'Metered — ретранслятор (TURN), когда прямая связь невозможна;', 'Metered — a relay (TURN) when a direct connection is impossible;'),
          L('jsDelivr жана cdnjs — китепканалар; Google Fonts — айрым оюндардагы шрифттер;', 'jsDelivr и cdnjs — библиотеки; Google Fonts — шрифты в некоторых играх;', 'jsDelivr and cdnjs — libraries; Google Fonts — fonts in some games;'),
          L('Bilim Arena Race — Vercel’деги өзүнчө сайт.', 'Bilim Arena Race — отдельный сайт на Vercel.', 'Bilim Arena Race — a separate site on Vercel.')
        )
      ]
    },
    {
      title: L('Канча убакыт сакталат', 'Сколько хранятся данные', 'How long data is kept'),
      body: [list(
        L('Түзмөктө — өзүңүз өчүргөнчө (төмөнкү баскыч же браузердин тазалоосу).', 'На устройстве — пока вы их не удалите (кнопка ниже или очистка браузера).', 'On the device — until you delete it (the button below or clearing the browser).'),
        L('Сабактардын журналы — акыркы 100 сабак.', 'Журнал уроков — последние 100 уроков.', 'The lesson log — the last 100 lessons.'),
        L('Булутта — аккаунт же класс бар болгончо. Мугалим окуучуну же класстын өзүн өчүрө алат.', 'В облаке — пока существуют аккаунт или класс. Учитель может удалить ученика или весь класс.', 'In the cloud — as long as the account or class exists. A teacher can remove a student or the whole class.'),
        L('Ката журналы — 30 күн.', 'Журнал ошибок — 30 дней.', 'The error log — 30 days.')
      )]
    },
    {
      title: L('Балдар', 'Дети', 'Children'),
      body: [
        L('Долбоор мектептер үчүн жасалган. 14 жашка чейинки окуучулар сайтты мугалимдин жетекчилиги менен же ата-энесинин макулдугу менен колдонушу керек. Мугалимдерден окуучулардан ашыкча маалымат сурабоону суранабыз: аты же класстагы аты жетиштүү, толук фамилиянын, телефондун же даректин кереги жок.',
          'Проект создан для школ. Ученики младше 14 лет должны пользоваться сайтом под руководством учителя или с согласия родителей. Просим учителей не собирать у учеников лишние данные: достаточно имени, полная фамилия, телефон или адрес не нужны.',
          'The project is made for schools. Students under 14 should use the site with a teacher’s guidance or with their parents’ consent. We ask teachers not to collect unnecessary data: a first name is enough — no full surname, phone number or address is needed.')
      ]
    },
    {
      title: L('Сиздин укуктарыңыз', 'Ваши права', 'Your rights'),
      body: [
        L('Сиз өзүңүз тууралуу маалыматтарды билүүгө, оңдоого жана өчүрүүгө укуктуусуз. Биз Кыргыз Республикасынын «Жеке мүнөздөгү маалымат жөнүндө» мыйзамын сактоого аракет кылабыз.',
          'Вы вправе узнать, исправить и удалить данные о себе. Мы стремимся соблюдать Закон Кыргызской Республики «Об информации персонального характера».',
          'You have the right to know, correct and delete data about you. We aim to comply with the Law of the Kyrgyz Republic “On Personal Information”.'),
        list(
          L('Ушул түзмөктөгү маалыматтар — төмөнкү «Маалыматтарымды өчүрүү» баскычы.', 'Данные на этом устройстве — кнопка «Удалить мои данные» ниже.', 'Data on this device — the “Delete my data” button below.'),
          L('Булуттагы окуучунун маалыматы — мугалимге кайрылыңыз: ал окуучуну класстан өчүрө алат.', 'Данные ученика в облаке — обратитесь к учителю: он может удалить ученика из класса.', 'A student’s data in the cloud — ask the teacher: they can remove the student from the class.'),
          L('Мугалимдин аккаунтун өчүрүү же башка суроолор — төмөнкү байланыш аркылуу.', 'Удаление аккаунта учителя и другие вопросы — через контакт ниже.', 'Deleting a teacher account or any other question — through the contact below.')
        )
      ]
    },
    {
      title: L('Өзгөртүүлөр', 'Изменения', 'Changes'),
      body: [L('Бул бет өзгөрсө, жогорудагы жаңыртуу датасы да өзгөрөт. Маанилүү өзгөртүүлөр тууралуу сайтта кабарлайбыз.', 'Если эта страница изменится, изменится и дата обновления выше. О существенных изменениях мы сообщим на сайте.', 'If this page changes, the update date above changes too. We will announce important changes on the site.')]
    }
  ]
};

export const TERMS = {
  title: L('Колдонуу шарттары', 'Условия использования', 'Terms of use'),
  intro: L(
    'Билим Арена сайтын колдонуу менен сиз бул шарттарга макул болосуз. Алар кыска жана жөнөкөй.',
    'Пользуясь сайтом Билим Арена, вы соглашаетесь с этими условиями. Они короткие и простые.',
    'By using the Bilim Arena site you agree to these terms. They are short and simple.'
  ),
  sections: [
    {
      title: L('Бул эмне', 'Что это', 'What this is'),
      body: [L('Билим Арена — акысыз билим берүү платформасы: оюндар, машыгуу, доскадагы сабактар, үй тапшырмалары жана Bilim Arena Race жарышы.', 'Билим Арена — бесплатная образовательная платформа: игры, тренировки, уроки на доске, домашние задания и гонка Bilim Arena Race.', 'Bilim Arena is a free educational platform: games, practice, board lessons, homework and the Bilim Arena Race.')]
    },
    {
      title: L('Ким колдоно алат', 'Кто может пользоваться', 'Who can use it'),
      body: [L('Окуучулар, мугалимдер жана ата-энелер. 14 жашка чейинки окуучулар — мугалимдин жетекчилиги менен же ата-энесинин макулдугу менен.', 'Ученики, учителя и родители. Ученики младше 14 лет — под руководством учителя или с согласия родителей.', 'Students, teachers and parents. Students under 14 — with a teacher’s guidance or their parents’ consent.')]
    },
    {
      title: L('Жүрүм-турум эрежелери', 'Правила поведения', 'Rules of conduct'),
      body: [list(
        L('Өз атыңызды же мугалим берген атты жазыңыз — орой жана башкаларды кемсинткен аттар болбосун.', 'Вводите своё имя или имя, которое дал учитель, — без грубых и оскорбительных слов.', 'Use your own name or the one your teacher gave you — no rude or insulting names.'),
        L('Башка адамдын атынан кирбеңиз.', 'Не выдавайте себя за другого человека.', 'Do not pretend to be someone else.'),
        L('Сабакка тоскоолдук кылбаңыз: спам, бузуу аракеттери, башка окуучунун ордун ээлөө тыюу салынат.', 'Не мешайте уроку: спам, попытки взлома и попытки занять чужое место запрещены.', 'Do not disrupt lessons: spam, hacking attempts and taking someone else’s place are forbidden.'),
        L('Бөтөн же адепсиз материалдарды (сүрөт, суроо, текст) жүктөбөңүз.', 'Не загружайте чужие или неприличные материалы (картинки, вопросы, тексты).', 'Do not upload material that is not yours or that is inappropriate (pictures, questions, texts).')
      )]
    },
    {
      title: L('Мугалимдер үчүн', 'Для учителей', 'For teachers'),
      body: [L('Мугалим өзү түзгөн суроолор жана тапшырмалар үчүн, ошондой эле класска кимди чакырары үчүн жооп берет. Окуучулардын жыйынтыктарын окутуу үчүн гана колдонуңуз.', 'Учитель отвечает за вопросы и задания, которые создаёт, и за то, кого приглашает в класс. Используйте результаты учеников только для обучения.', 'Teachers are responsible for the questions and assignments they create and for who they invite to their class. Use student results only for teaching.')]
    },
    {
      title: L('Мазмун', 'Содержание', 'Content'),
      body: [L('Суроолор текшерилет, бирок ката кетиши мүмкүн — байкасаңыз, бизге жазыңыз. Сайттагы жыйынтыктар окутуу үчүн, расмий экзамен баасы эмес.', 'Вопросы проверяются, но ошибки возможны — если заметите, напишите нам. Результаты на сайте нужны для обучения и не являются официальной экзаменационной оценкой.', 'Questions are checked, but mistakes are possible — if you spot one, tell us. Results on the site are for learning and are not an official exam grade.')]
    },
    {
      title: L('Жеткиликтүүлүк', 'Доступность', 'Availability'),
      body: [L('Сайт акысыз жана «кандай болсо, ошондой» берилет. Анын ар дайым иштешине аракет кылабыз, бирок үзгүлтүксүз иштешине кепилдик бере албайбыз: мектептин интернети жана тышкы кызматтар да таасир этет. Түзмөктөгү маалымат браузерди тазалаганда жоголот — маанилүү жыйынтыктар үчүн булутту колдонуңуз.', 'Сайт бесплатный и предоставляется «как есть». Мы стараемся, чтобы он работал всегда, но не можем гарантировать бесперебойную работу: на неё влияют интернет школы и сторонние сервисы. Данные на устройстве пропадают при очистке браузера — для важных результатов используйте облако.', 'The site is free and provided “as is”. We try to keep it working at all times but cannot guarantee uninterrupted service: school internet and third-party services matter too. Data on a device is lost when the browser is cleared — use the cloud for important results.')]
    },
    {
      title: L('Купуялык', 'Конфиденциальность', 'Privacy'),
      body: [L('Маалыматтар кантип колдонулары «Купуялык саясаты» бетинде жазылган.', 'Как используются данные, описано на странице «Политика конфиденциальности».', 'How data is used is described on the Privacy policy page.')],
      link: { href: './privacy.html', text: L('Купуялык саясаты', 'Политика конфиденциальности', 'Privacy policy') }
    },
    {
      title: L('Өзгөртүүлөр', 'Изменения', 'Changes'),
      body: [L('Шарттар өзгөрсө, жогорудагы жаңыртуу датасы да өзгөрөт. Андан кийин сайтты колдонуу жаңы шарттарга макулдук дегенди билдирет.', 'Если условия изменятся, изменится и дата обновления выше. Дальнейшее использование сайта означает согласие с новыми условиями.', 'If the terms change, the update date above changes too. Continuing to use the site means you accept the new terms.')]
    }
  ]
};
