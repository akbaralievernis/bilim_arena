/**
 * Story Lab — сценарии. Реплики — по-английски; контекст, перевод и пояснения — на трёх языках.
 * Структура и проверки — в engine.js (validateStory).
 */

const L = (ky, ru, en) => ({ ky, ru, en });
/** Вариант ответа: текст, качество, переход, реакция персонажа, почему, что значит, что запомнить */
const C = (text, quality, next, reply, why, meaning, phrases = []) => ({ text, quality, next, reply, why, meaning, phrases });

// ═══ 1. First Day at School (Beginner) ═══════════════════════════════════════
const FIRST_DAY = {
  id: 'first-day', level: 'beginner', art: 'school',
  title: L('Мектептеги биринчи күн', 'Первый день в школе', 'First Day at School'),
  desc: L('Таанышуу, жардам суроо, класстагылар менен сүйлөшүү', 'Знакомство, просьбы о помощи, общение с одноклассниками', 'Meeting people, asking for help, talking to classmates'),
  start: 'n1',
  nodes: {
    n1: {
      art: 'school', speaker: 'Aida',
      context: L('Бүгүн жаңы мектептеги биринчи күнүң. Сенин жаныңдагы бош орунга бир кыз келди.', 'Сегодня твой первый день в новой школе. К свободному месту рядом с тобой подходит девочка.', 'It is your first day at a new school. A girl comes to the empty seat next to you.'),
      line: 'Hi! Is this seat taken?',
      lineT: L('Салам! Бул орун бошпу?', 'Привет! Это место занято?', 'Hi! Is someone sitting here?'),
      choices: [
        C("No, it's free. Please sit down.", 'best', 'n2', "Thanks! I'm Aida.",
          L('Суроого так жооп бердиң жана сылык чакырдың.', 'Ты ответил точно на вопрос и вежливо пригласил сесть.', 'You answered the question and invited her politely.'),
          L('Жок, бош. Отуруңуз.', 'Нет, свободно. Садись, пожалуйста.', 'No, nobody is here. Please sit.'), ['It\'s free', 'Please sit down']),
        C("Hmm, I don't know.", 'ok', 'n2', "Oh, okay. I'll sit here, then. I'm Aida.",
          L('Жооп сылык, бирок так эмес — ал «орун бошпу?» деп сурады.', 'Ответ вежливый, но неясный — она спросила, свободно ли место.', 'Polite, but not clear — she asked if the seat is free.'),
          L('Ммм, билбейм.', 'Хм, не знаю.', 'Hmm, I am not sure.'), ["I don't know"]),
        C('Go away.', 'poor', 'n2b', 'Oh... sorry.',
          L('Орой жооп: адам кетип калды, сен жалгыз калдың.', 'Грубый ответ: человек ушёл, и ты остался один.', 'A rude answer: she left and you are alone.'),
          L('Кет.', 'Уходи.', 'Leave.'), [])
      ]
    },
    n2: {
      art: 'school', speaker: 'Aida',
      context: L('Аида сенин жаныңа отурду.', 'Аида садится рядом.', 'Aida sits next to you.'),
      line: "What's your name? Are you new here?",
      lineT: L('Атың ким? Сен бул жерде жаңысыңбы?', 'Как тебя зовут? Ты здесь новенький?', 'What is your name? Is this your first time here?'),
      choices: [
        C("I'm Timur. Yes, it's my first day.", 'best', 'n3', 'Welcome, Timur! Come with me, I can show you the school.',
          L('Эки суроого тең жооп бердиң — сүйлөшүү уланат.', 'Ты ответил на оба вопроса — разговор продолжается.', 'You answered both questions, so the talk goes on.'),
          L('Мен Тимурмун. Ооба, бул менин биринчи күнүм.', 'Я Тимур. Да, это мой первый день.', 'My name is Timur. Yes, today is my first day.'), ["I'm ...", "It's my first day"]),
        C('Timur.', 'ok', 'n3', 'Nice to meet you, Timur. Come with me!',
          L('Туура, бирок кыска: толук сүйлөм достукту жеңилдетет.', 'Верно, но коротко: полное предложение звучит дружелюбнее.', 'Correct but short: a full sentence sounds friendlier.'),
          L('Тимур.', 'Тимур.', 'Timur.'), []),
        C('Why do you ask?', 'poor', 'n2b', "I'm just being friendly... Never mind.",
          L('Бул суроо шектүү угулат — ал жөн гана таанышкысы келген.', 'Звучит подозрительно — она просто хотела познакомиться.', 'It sounds suspicious — she only wanted to meet you.'),
          L('Эмнеге сурайсың?', 'Почему ты спрашиваешь?', 'Why are you asking?'), [])
      ]
    },
    n2b: {
      art: 'school', speaker: 'Mr. Brown',
      context: L('Сен жалгыз отурасың. Мугалим Браун мырза сага келди.', 'Ты сидишь один. К тебе подходит учитель, мистер Браун.', 'You are sitting alone. The teacher, Mr. Brown, comes to you.'),
      line: 'Good morning! You look lost. Can I help you?',
      lineT: L('Кутман таң! Адашып калгандайсың. Жардам берейинби?', 'Доброе утро! Ты, кажется, растерялся. Тебе помочь?', 'Good morning! You seem confused. Do you need help?'),
      choices: [
        C('Yes, please. Where is room 12?', 'best', 'n3', "It's on the second floor. Aida is going there too — she can show you.",
          L('Жардамды кабыл алып, так суроо бердиң.', 'Ты принял помощь и задал точный вопрос.', 'You accepted help and asked a clear question.'),
          L('Ооба, сураныч. 12-бөлмө кайда?', 'Да, пожалуйста. Где кабинет 12?', 'Yes, please. Where is room 12?'), ['Yes, please', 'Where is ...?']),
        C('No.', 'poor', 'n6', 'All right. Lunch is at twelve.',
          L('Жардамдан баш тарттың — түшкү тамакта да жалгыз калдың.', 'Ты отказался от помощи — и на обед пошёл один.', 'You refused help — and went to lunch alone.'),
          L('Жок.', 'Нет.', 'No.'), [])
      ]
    },
    n3: {
      art: 'book', speaker: 'Aida',
      context: L('Англис тили сабагы башталат.', 'Начинается урок английского.', 'The English lesson is starting.'),
      line: 'We have a test today. Do you have a pen?',
      lineT: L('Бүгүн тест болот. Сенде калем барбы?', 'Сегодня тест. У тебя есть ручка?', 'There is a test today. Have you got a pen?'),
      choices: [
        C("No, I don't. Can I borrow one, please?", 'best', 'n4', 'Sure, here you are!',
          L('Сылык суроо: «Can I borrow…, please?»', 'Вежливая просьба: «Can I borrow…, please?»', 'A polite request: "Can I borrow…, please?"'),
          L('Жок. Бирөөнү убактылуу берип турасыңбы?', 'Нет. Можно одолжить одну?', 'No. May I use one of yours?'), ['Can I borrow ...?', 'Here you are']),
        C('Give me a pen.', 'ok', 'n4', "Um... okay. You can say 'please', you know!",
          L('Түшүнүктүү, бирок буйрук сыяктуу угулат — «please» кошуңуз.', 'Понятно, но звучит как приказ — добавьте «please».', 'Clear, but it sounds like an order — add "please".'),
          L('Мага калем бер.', 'Дай мне ручку.', 'Give me a pen.'), ['please']),
        C("I don't need a pen.", 'poor', 'n4', 'But how will you write the test?',
          L('Логикасыз жооп: тестке калем керек.', 'Нелогично: на тесте нужна ручка.', 'Not logical: you need a pen for the test.'),
          L('Мага калем керек эмес.', 'Мне не нужна ручка.', 'I do not need a pen.'), [])
      ]
    },
    n4: {
      art: 'quiz', speaker: 'Mr. Brown',
      context: L('Мугалим класска суроо берет.', 'Учитель задаёт классу вопрос.', 'The teacher asks the class a question.'),
      line: 'Who can tell me: what day is it today?',
      lineT: L('Ким айтат: бүгүн кайсы күн?', 'Кто скажет: какой сегодня день?', 'Who knows what day it is today?'),
      choices: [
        C("It's Monday.", 'best', 'n5', 'Correct! Well done.',
          L('Толук жана туура жооп: «It\'s + күн».', 'Полный и верный ответ: «It\'s + день».', 'A full, correct answer: "It\'s + day".'),
          L('Бүгүн дүйшөмбү.', 'Сегодня понедельник.', 'Today is Monday.'), ["It's Monday"]),
        C('Monday is day.', 'ok', 'n5', "Good try! We say: It's Monday.",
          L('Маани туура, бирок сүйлөм туура эмес түзүлгөн.', 'Смысл верный, но предложение построено неправильно.', 'The meaning is right, but the sentence is wrong.'),
          L('Дүйшөмбү — күн.', 'Понедельник — день.', 'Monday is a day.'), []),
        C("I don't know.", 'poor', 'n5', "That's okay. It's Monday.",
          L('Жооп бербей койдуң — мындай суроолорго жооп бергенге аракет кыл.', 'Ты не попробовал ответить — в следующий раз попробуй.', 'You did not try — have a go next time.'),
          L('Билбейм.', 'Не знаю.', 'I am not sure.'), [])
      ]
    },
    n5: {
      art: 'smile', speaker: 'Aida',
      context: L('Танапис. Аида досторунун жанында турат.', 'Перемена. Аида стоит со своими друзьями.', 'Break time. Aida is with her friends.'),
      line: 'Do you want to sit with us at lunch?',
      lineT: L('Түшкү тамакта биз менен отурасыңбы?', 'Хочешь сесть с нами на обеде?', 'Would you like to eat lunch with us?'),
      choices: [
        C("Yes, I'd love to! Thank you.", 'best', 'friends', 'Great! See you at twelve.',
          L('Чакырууну жылуу кабыл алдың.', 'Ты тепло принял приглашение.', 'You accepted the invitation warmly.'),
          L('Ооба, абдан кубанычтамын! Рахмат.', 'Да, с удовольствием! Спасибо.', 'Yes, with pleasure! Thanks.'), ["I'd love to"]),
        C('Maybe tomorrow.', 'ok', 'polite', 'Okay! Tomorrow, then.',
          L('Сылык, бирок бүгүн жалгыз калдың.', 'Вежливо, но сегодня ты обедаешь один.', 'Polite, but today you eat alone.'),
          L('Балким, эртең.', 'Может быть, завтра.', 'Maybe tomorrow.'), ['Maybe']),
        C('No, I want to eat alone.', 'poor', 'alone', 'Oh. Okay.',
          L('Чакыруудан кескин баш тарттың.', 'Ты резко отказался от приглашения.', 'You refused the invitation sharply.'),
          L('Жок, мен жалгыз тамактангым келет.', 'Нет, хочу поесть один.', 'No, I want to eat by myself.'), [])
      ]
    },
    n6: {
      art: 'users', speaker: 'Daniel',
      context: L('Ашканада жалгыз отурасың. Бир бала тамак көтөрүп келди.', 'Ты сидишь в столовой один. Подходит мальчик с подносом.', 'You sit alone in the canteen. A boy comes with a tray.'),
      line: 'Hi! Can I sit here?',
      lineT: L('Салам! Бул жерге отурсам болобу?', 'Привет! Можно здесь сесть?', 'Hi! May I sit here?'),
      choices: [
        C("Of course! I'm Timur. I'm new.", 'best', 'new-friend', "Cool, I'm Daniel. Welcome!",
          L('Ачык жооп берип, өзүңдү тааныштырдың.', 'Ты открыто ответил и представился.', 'You answered openly and introduced yourself.'),
          L('Албетте! Мен Тимурмун. Мен жаңымын.', 'Конечно! Я Тимур. Я новенький.', 'Sure! I am Timur. I am new here.'), ['Of course']),
        C('No.', 'poor', 'alone', 'Oh... okay.',
          L('Дагы бир мүмкүнчүлүктү колдон чыгардың.', 'Ты упустил ещё одну возможность подружиться.', 'You missed another chance to make a friend.'),
          L('Жок.', 'Нет.', 'No.'), [])
      ]
    }
  },
  endings: {
    friends: { good: true, title: L('Жаңы достор', 'Новые друзья', 'New friends'), text: L('Сен Аида жана анын достору менен түшкү тамак ичтиң. Биринчи күн сонун өттү!', 'Ты обедаешь с Аидой и её друзьями. Первый день прошёл отлично!', 'You have lunch with Aida and her friends. A great first day!') },
    polite: { good: true, title: L('Сылык баштама', 'Вежливое начало', 'A polite start'), text: L('Бүгүн жалгыз тамактандың, бирок эртең Аида сени күтөт.', 'Сегодня ты обедал один, но завтра Аида тебя ждёт.', 'You ate alone today, but Aida is waiting for you tomorrow.') },
    'new-friend': { good: true, title: L('Күтүлбөгөн дос', 'Неожиданный друг', 'An unexpected friend'), text: L('Дэниел экөөңөр сүйлөшүп кеттиңер. Кээде экинчи мүмкүнчүлүк да жакшы!', 'Вы с Дэниелом разговорились. Иногда второй шанс тоже хорош!', 'You and Daniel start talking. Sometimes a second chance works too!') },
    alone: { good: false, title: L('Жалгыз күн', 'Одинокий день', 'A lonely day'), text: L('Сен күнү бою жалгыз болдуң. Кайра ойноп, башка жоопторду байкап көр.', 'Ты весь день был один. Сыграй ещё раз и попробуй другие ответы.', 'You were alone all day. Play again and try other answers.') }
  }
};

// ═══ 2. A Day at the Café (Intermediate) ═════════════════════════════════════
const CAFE = {
  id: 'cafe', level: 'intermediate', art: 'coin',
  title: L('Кафеде бир күн', 'День в кафе', 'A Day at the Café'),
  desc: L('Тамак буйрутмалоо, баасын тактоо, көйгөйдү чечүү', 'Заказ еды, уточнение цены, решение проблемы с заказом', 'Ordering food, checking the price, solving a problem with your order'),
  start: 'c1',
  nodes: {
    c1: {
      art: 'coin', speaker: 'Waiter',
      context: L('Сен кафеге келип, үстөлгө отурдуң. Официант келди.', 'Ты пришёл в кафе и сел за столик. Подходит официант.', 'You come into a café and sit down. The waiter comes over.'),
      line: 'Good afternoon! Are you ready to order?',
      lineT: L('Кутман күн! Буйрутма бересизби?', 'Добрый день! Готовы сделать заказ?', 'Good afternoon! Would you like to order now?'),
      choices: [
        C("Yes, I'd like a cheese sandwich and an orange juice, please.", 'best', 'c2', 'One cheese sandwich and an orange juice. Coming right up!',
          L('«I\'d like…, please» — буйрутманын эң сылык жана так жолу.', '«I\'d like…, please» — самый вежливый и точный способ заказать.', '"I\'d like…, please" is the politest, clearest way to order.'),
          L('Ооба, сыр кошулган сэндвич жана апельсин ширесин алайын.', 'Да, мне сэндвич с сыром и апельсиновый сок, пожалуйста.', 'Yes, a cheese sandwich and an orange juice for me.'), ["I'd like ..., please"]),
        C('Sandwich. Juice.', 'ok', 'c1b', 'Sure — which juice would you like? We have apple and orange.',
          L('Түшүнүктүү, бирок өтө кыска — официант тактоого аргасыз болду.', 'Понятно, но слишком коротко — официанту пришлось уточнять.', 'Understandable, but too short — the waiter had to ask again.'),
          L('Сэндвич. Шире.', 'Сэндвич. Сок.', 'Sandwich. Juice.'), []),
        C('Wait.', 'poor', 'c1c', 'Of course. Take your time.',
          L('Бир сөз кескин угулат; «Just a minute, please» деп айтса болот.', 'Одно слово звучит резко; лучше «Just a minute, please».', 'One word sounds sharp; "Just a minute, please" is better.'),
          L('Күт.', 'Подожди.', 'Wait.'), ['Just a minute, please'])
      ]
    },
    c1b: {
      art: 'coin', speaker: 'Waiter',
      context: L('Официант ширени тактап жатат.', 'Официант уточняет сок.', 'The waiter checks which juice.'),
      line: 'We have apple and orange juice. Which one would you like?',
      lineT: L('Бизде алма жана апельсин ширеси бар. Кайсынысын каалайсыз?', 'У нас есть яблочный и апельсиновый сок. Какой хотите?', 'There is apple juice and orange juice. Which do you want?'),
      choices: [
        C('Orange, please.', 'best', 'c2', 'Great choice!',
          L('Кыска, так жана сылык.', 'Коротко, точно и вежливо.', 'Short, clear and polite.'),
          L('Апельсинди, сураныч.', 'Апельсиновый, пожалуйста.', 'The orange one, please.'), ['..., please']),
        C('Whatever.', 'poor', 'c2', 'Okay... orange, then.',
          L('«Whatever» кайдыгер угулат.', '«Whatever» звучит равнодушно.', '"Whatever" sounds rude and careless.'),
          L('Баары бир.', 'Всё равно.', 'I do not care.'), [])
      ]
    },
    c1c: {
      art: 'coin', speaker: 'Waiter',
      context: L('Беш мүнөттөн кийин официант кайра келди.', 'Через пять минут официант возвращается.', 'Five minutes later the waiter comes back.'),
      line: 'Have you decided?',
      lineT: L('Тандадыңызбы?', 'Вы определились?', 'Do you know what you want now?'),
      choices: [
        C("Yes. Could I have the soup of the day and an orange juice, please? What's the soup today?", 'best', 'c2', "Tomato soup — it's very good. And an orange juice!",
          L('Сылык суроо менен буйрутма берип, кошумча маалымат сурадың.', 'Ты вежливо заказал и уточнил, что это за суп.', 'You ordered politely and asked for details.'),
          L('Ооба. Бүгүнкү шорпону жана апельсин ширесин алайын. Бүгүн кандай шорпо?', 'Да. Можно суп дня и апельсиновый сок? Какой сегодня суп?', 'Yes. The soup of the day and an orange juice, please. Which soup is it?'), ['Could I have ...?', "What's ...?"]),
        C('Soup.', 'ok', 'c2', 'One soup. Anything to drink? ...Orange juice? Okay!',
          L('Түшүнүктүү, бирок кыска жана суусундукту унуттуң.', 'Понятно, но коротко, и ты забыл про напиток.', 'Clear, but short, and you forgot the drink.'),
          L('Шорпо.', 'Суп.', 'Soup.'), [])
      ]
    },
    c2: {
      art: 'coin', speaker: 'Waiter',
      context: L('Тамак келди. Менюда сэндвичтин баасы 300 сом деп жазылган.', 'Еду принесли. В меню сэндвич стоит 300 сомов.', 'The food arrives. The menu says the sandwich costs 300 som.'),
      line: "Here you are. That's 350 som, please.",
      lineT: L('Мына. 350 сом болот.', 'Пожалуйста. С вас 350 сомов.', 'Here is your food. It is 350 som.'),
      choices: [
        C('Sorry, could you check the bill? I think the menu says 300 som.', 'best', 'c3', "Oh, let me check... You're right, I'm sorry!",
          L('Сылык түрдө көйгөйдү айттың жана далил келтирдиң.', 'Ты вежливо указал на проблему и объяснил почему.', 'You raised the problem politely and gave a reason.'),
          L('Кечиресиз, эсепти текшерип бересизби? Менюда 300 сом деп жазылган окшойт.', 'Извините, можете проверить счёт? Кажется, в меню 300 сомов.', 'Sorry, can you check the bill? I think the menu price is 300 som.'), ['Could you check ...?', 'I think ...']),
        C("Okay, here's 350.", 'ok', 'c4', 'Thank you! Enjoy your meal.',
          L('Сылык, бирок 50 сом ашык төлөдүң.', 'Вежливо, но ты переплатил 50 сомов.', 'Polite, but you paid 50 som too much.'),
          L('Макул, мына 350.', 'Хорошо, вот 350.', 'Okay, here is 350.'), []),
        C("That's wrong! I'm not paying!", 'poor', 'c3', "Please calm down. Let me check... Yes, it's 300. Sorry.",
          L('Сен туура элең, бирок кыйкырык менен — маселе чечилди, бирок маанай бузулду.', 'Ты был прав, но кричал — проблему решили, но настроение испорчено.', 'You were right, but shouting spoiled the mood.'),
          L('Бул туура эмес! Мен төлөбөйм!', 'Это неправильно! Я не буду платить!', 'That is wrong! I will not pay!'), [])
      ]
    },
    c3: {
      art: 'coin', speaker: 'Waiter',
      context: L('Официант эсепти оңдоп, кечирим сурады.', 'Официант исправил счёт и извиняется.', 'The waiter fixes the bill and says sorry.'),
      line: "I'm really sorry about that. It's 300 som.",
      lineT: L('Ал үчүн чындап кечирим сурайм. 300 сом.', 'Прошу прощения. С вас 300 сомов.', 'I am very sorry. It is 300 som.'),
      choices: [
        C('No problem. Thank you for checking.', 'best', 'c4', "You're welcome!",
          L('Кечиримди жылуу кабыл алып, ыраазычылык билдирдиң.', 'Ты принял извинения и поблагодарил.', 'You accepted the apology and said thank you.'),
          L('Эч нерсе эмес. Текшергениңизге рахмат.', 'Ничего страшного. Спасибо, что проверили.', 'That is fine. Thanks for checking.'), ['No problem', 'Thank you for ...']),
        C('Okay.', 'ok', 'c4', 'Enjoy your meal.',
          L('Туура, бирок кургак угулат.', 'Нормально, но звучит сухо.', 'Fine, but it sounds a bit cold.'),
          L('Макул.', 'Хорошо.', 'Okay.'), [])
      ]
    },
    c4: {
      art: 'coin', speaker: 'Waiter',
      context: L('Ширесин даамын татсаң — бул алма ширеси экен, апельсин эмес.', 'Ты пробуешь сок — это яблочный, а не апельсиновый.', 'You taste the juice — it is apple, not orange.'),
      line: 'Is everything okay with your order?',
      lineT: L('Буйрутмаңыз менен баары жакшыбы?', 'С заказом всё в порядке?', 'Is your order all right?'),
      choices: [
        C('Excuse me, I ordered orange juice, but this is apple juice. Could you change it, please?', 'best', 'happy',
          "Oh, I'm so sorry! I'll bring you an orange juice right away.",
          L('Көйгөйдү сылык жана так түшүндүрдүң: эмнени буйрутмаладың, эмне келди, эмне керек.', 'Ты чётко и вежливо объяснил: что заказал, что принесли и что нужно.', 'You explained clearly and politely: what you ordered, what came and what you need.'),
          L('Кечиресиз, мен апельсин ширесин буйрутмаладым, бирок бул алма ширеси. Алмаштырып бересизби?', 'Извините, я заказывал апельсиновый сок, а это яблочный. Можете заменить?', 'Sorry, I ordered orange juice, but this is apple juice. Can you change it?'), ['I ordered ..., but ...', 'Could you change it?']),
        C("It's fine.", 'ok', 'okay', 'Great! Have a nice day.',
          L('Көйгөйдү айткан жоксуң — каалаганыңды албай калдың.', 'Ты промолчал о проблеме и не получил то, что хотел.', 'You said nothing about the problem and did not get what you wanted.'),
          L('Баары жакшы.', 'Всё нормально.', 'Everything is fine.'), []),
        C('This café is terrible!', 'poor', 'bad',
          "I'm sorry you feel that way.",
          L('Ачууланып, көйгөйдү түшүндүрбөдүң — эч нерсе оңолгон жок.', 'Ты разозлился, но не объяснил проблему — ничего не исправили.', 'You got angry but did not explain the problem, so nothing was fixed.'),
          L('Бул кафе өтө жаман!', 'Это ужасное кафе!', 'This café is awful!'), [])
      ]
    }
  },
  endings: {
    happy: { good: true, title: L('Мыкты кызмат', 'Отличный сервис', 'Great service'), text: L('Сага апельсин ширесин алып келишти жана десерт белек кылышты!', 'Тебе принесли апельсиновый сок и угостили десертом!', 'They bring you orange juice and a free dessert!') },
    okay: { good: true, title: L('Жаман эмес', 'Неплохо', 'Not bad'), text: L('Тамак даамдуу болду, бирок шире башка экен. Кийинки жолу көйгөйдү айтып көр.', 'Еда вкусная, но сок не тот. В следующий раз скажи о проблеме.', 'The food was good, but the juice was wrong. Next time, say what the problem is.') },
    bad: { good: false, title: L('Начар күн', 'Неудачный день', 'A bad day'), text: L('Сен ачууланып кетип калдың, эч нерсе оңолгон жок. Кайра ойноп, сылык сүйлөп көр.', 'Ты ушёл злым, и ничего не исправили. Сыграй снова и попробуй вежливо.', 'You left angry and nothing was fixed. Play again and try being polite.') }
  }
};

// ═══ 3. Lost in the City (Advanced) ══════════════════════════════════════════
const LOST = {
  id: 'lost', level: 'advanced', art: 'map',
  title: L('Шаарда адашуу', 'Потерялся в городе', 'Lost in the City'),
  desc: L('Жол суроо, түшүнбөгөнүн тактоо, бейтааныштар менен сүйлөшүү', 'Спросить дорогу, уточнить непонятное, говорить с незнакомыми', 'Asking the way, checking what you did not understand, talking to strangers'),
  start: 'l1',
  nodes: {
    l1: {
      art: 'map', speaker: 'Woman',
      context: L('Сен Шаардык музейди издеп жүрөсүң, телефонуң өчүп калды. Бир аял сени карап калды.', 'Ты ищешь Городской музей, а телефон разрядился. Женщина замечает тебя.', 'You are looking for the City Museum and your phone is dead. A woman notices you.'),
      line: 'You look a bit lost. Do you need any help?',
      lineT: L('Бир аз адашып калгандайсыз. Жардам керекпи?', 'Вы, кажется, заблудились. Нужна помощь?', 'You seem a little lost. Can I help?'),
      choices: [
        C('Yes, please. Could you tell me how to get to the City Museum?', 'best', 'l2', 'Of course! Listen carefully.',
          L('Жардамды кабыл алып, кайда баратканыңды так айттың.', 'Ты принял помощь и чётко сказал, куда тебе нужно.', 'You accepted help and said clearly where you are going.'),
          L('Ооба, сураныч. Шаардык музейге кантип барарымды айтып бересизби?', 'Да, пожалуйста. Подскажите, как пройти к Городскому музею?', 'Yes, please. How do I get to the City Museum?'), ['Could you tell me how to get to ...?']),
        C('Museum. Where?', 'ok', 'l2', "The museum? It's not far. Listen.",
          L('Түшүнүктүү, бирок сылык сөздөр жок.', 'Понятно, но без вежливых слов.', 'Understandable, but there are no polite words.'),
          L('Музей. Кайда?', 'Музей. Где?', 'Museum. Where?'), []),
        C("No, I'm fine.", 'poor', 'l1b', 'Okay, good luck!',
          L('Чындыгында сага жардам керек болчу — ары-бери басып жүрдүң.', 'Тебе на самом деле нужна была помощь — ты ходишь кругами.', 'You really needed help — now you walk in circles.'),
          L('Жок, баары жакшы.', 'Нет, всё в порядке.', 'No, I am okay.'), [])
      ]
    },
    l1b: {
      art: 'map', speaker: 'Boy',
      context: L('Жарым сааттан кийин. Аялдамада бир бала сени байкады.', 'Через полчаса. На остановке тебя замечает мальчик.', 'Half an hour later. A boy at the bus stop notices you.'),
      line: "Excuse me, you've walked past this stop three times. Are you looking for something?",
      lineT: L('Кечиресиз, бул аялдамадан үч жолу өттүңүз. Бир нерсе издеп жатасызбы?', 'Извините, вы уже три раза прошли мимо этой остановки. Что-то ищете?', 'Sorry, you have passed this stop three times. Are you searching for something?'),
      choices: [
        C("Actually, yes. I'm trying to find the City Museum, but I think I'm going the wrong way.", 'best', 'l2', 'No worries — I know it. Listen.',
          L('Чынын айтып, кырдаалды толук түшүндүрдүң.', 'Ты честно и подробно объяснил ситуацию.', 'You admitted it honestly and explained the situation.'),
          L('Чындыгында, ооба. Шаардык музейди издеп жатам, бирок туура эмес жакка баратам окшойт.', 'Вообще-то да. Ищу Городской музей, но, кажется, иду не туда.', 'Yes, actually. I am looking for the City Museum, but I think I am lost.'), ['Actually, ...', "I'm trying to find ..."]),
        C('Mind your own business.', 'poor', 'lost',
          'Okay... sorry.',
          L('Орой жооп — жардам берүүгө даяр адамды жоготтуң.', 'Грубый ответ — ты оттолкнул человека, готового помочь.', 'A rude answer — you lost someone who wanted to help.'),
          L('Өз ишиң менен алек бол.', 'Не лезь не в своё дело.', 'It is none of your business.'), [])
      ]
    },
    l2: {
      art: 'map', speaker: 'Woman',
      context: L('Сага жолду түшүндүрүп жатышат.', 'Тебе объясняют дорогу.', 'Someone is explaining the way to you.'),
      line: 'Go straight on, turn left at the bank, and the museum is opposite the park. Or you can take bus number 5.',
      lineT: L('Түз барып, банктан солго буруласыз, музей парктын каршысында. Же 5-автобуска түшсөңүз болот.', 'Идите прямо, у банка поверните налево — музей напротив парка. Или можно сесть на автобус номер 5.', 'Walk straight, turn left at the bank; the museum is across from the park. Or take bus 5.'),
      choices: [
        C('Sorry, could you say that more slowly? Turn left at the bank, and then...?', 'best', 'l3', 'Sure. Left at the bank — then the museum is opposite the park.',
          L('Түшүнбөгөн жерди тактадың — бул туура стратегия.', 'Ты уточнил непонятное — это правильная стратегия.', 'You checked the part you did not catch — a smart strategy.'),
          L('Кечиресиз, жайыраак айтып бересизби? Банктан солго, андан кийин...?', 'Извините, можно помедленнее? У банка налево, а потом...?', 'Sorry, can you say it more slowly? Left at the bank, and then...?'), ['Could you say that more slowly?']),
        C('Which is faster, walking or the bus?', 'best', 'l3b', "The bus is faster — it stops right outside the museum.",
          L('Акылдуу суроо: эки вариантты салыштырдың.', 'Умный вопрос: ты сравнил два варианта.', 'A smart question: you compared two options.'),
          L('Кайсынысы тезирээк — жөө басуубу же автобуспу?', 'Что быстрее — пешком или на автобусе?', 'What is quicker, walking or the bus?'), ['Which is faster, ... or ...?']),
        C('Thanks!', 'ok', 'l4', 'Good luck!',
          L('Сылык, бирок жолду толук түшүнбөй калдың.', 'Вежливо, но ты так и не понял дорогу до конца.', 'Polite, but you did not fully understand the way.'),
          L('Рахмат!', 'Спасибо!', 'Thanks!'), [])
      ]
    },
    l3: {
      art: 'map', speaker: 'Woman',
      context: L('Аял жолду кайрадан түшүндүрдү.', 'Женщина повторила дорогу.', 'The woman repeats the directions.'),
      line: "That's right. You can't miss it — it's a big white building.",
      lineT: L('Туура. Таппай калбайсыз — ал чоң ак имарат.', 'Верно. Не пропустите — это большое белое здание.', 'Correct. You will see it — it is a big white building.'),
      choices: [
        C('Got it: straight on, left at the bank, opposite the park. Thank you so much!', 'best', 'l5', "You're welcome. Enjoy the museum!",
          L('Жолду кайталап текшердиң жана ыраазычылык билдирдиң.', 'Ты повторил маршрут, чтобы проверить, и поблагодарил.', 'You repeated the route to check it and said thank you.'),
          L('Түшүндүм: түз, банктан солго, парктын каршысында. Чоң рахмат!', 'Понял: прямо, у банка налево, напротив парка. Большое спасибо!', 'I see: straight, left at the bank, across from the park. Thanks a lot!'), ['Got it', 'Thank you so much']),
        C('Okay.', 'ok', 'l5', 'Bye!',
          L('Туура, бирок жолду текшербедиң.', 'Нормально, но ты не проверил маршрут.', 'Fine, but you did not check the route.'),
          L('Макул.', 'Хорошо.', 'Okay.'), [])
      ]
    },
    l3b: {
      art: 'bolt', speaker: 'Bus driver',
      context: L('Сен 5-автобуска түштүң.', 'Ты сел в автобус номер 5.', 'You get on bus number 5.'),
      line: 'This bus stops at the museum, but you need a ticket. It is 20 som.',
      lineT: L('Бул автобус музейге токтойт, бирок билет керек. 20 сом.', 'Этот автобус останавливается у музея, но нужен билет. 20 сомов.', 'This bus stops at the museum, but you must buy a ticket. 20 som.'),
      choices: [
        C("Here's 20 som. Could you tell me when we get to the museum, please?", 'best', 'l5', "Sure, I'll tell you. It's the fourth stop.",
          L('Төлөп, айдоочудан сылык жардам сурадың.', 'Ты заплатил и вежливо попросил водителя подсказать.', 'You paid and politely asked the driver for help.'),
          L('Мына 20 сом. Музейге жеткенде айтып коесузбу?', 'Вот 20 сомов. Подскажете, когда будет музей?', 'Here is 20 som. Can you tell me when we reach the museum?'), ['Could you tell me when ...?']),
        C("I don't have a ticket, but I'm getting on anyway.", 'poor', 'bus-trouble', "Sorry, you can't ride without a ticket.",
          L('Эрежени бузуу сылык эмес жана натыйжа бербейт.', 'Нарушать правила невежливо и бесполезно.', 'Breaking the rules is rude and does not work.'),
          L('Билетим жок, бирок баары бир түшөм.', 'У меня нет билета, но я всё равно сяду.', 'I have no ticket, but I am getting on.'), [])
      ]
    },
    l4: {
      art: 'map', speaker: 'Shopkeeper',
      context: L('Сен туура эмес жакка бурулуп кеттиң. Дүкөнчү сени карап турат.', 'Ты свернул не туда. На тебя смотрит продавец.', 'You took a wrong turn. A shopkeeper looks at you.'),
      line: 'Hello! Can I help you? You look confused.',
      lineT: L('Саламатсызбы! Жардам берейинби? Түшүнбөй турган окшойсуз.', 'Здравствуйте! Вам помочь? Вы, похоже, запутались.', 'Hello! Can I help? You seem confused.'),
      choices: [
        C('Yes — I think I took a wrong turn. Is the City Museum near here?', 'best', 'l5', "It's back that way, opposite the park. Five minutes.",
          L('Каталыгыңды мойнуна алып, так суроо бердиң.', 'Ты признал ошибку и задал точный вопрос.', 'You admitted the mistake and asked a precise question.'),
          L('Ооба — туура эмес бурулуп кеттим окшойт. Шаардык музей бул жакта жакынбы?', 'Да — кажется, я свернул не туда. Городской музей где-то рядом?', 'Yes — I think I turned the wrong way. Is the City Museum close?'), ['I took a wrong turn', 'Is ... near here?']),
        C('Never mind.', 'poor', 'lost', 'Okay. Have a nice day.',
          L('Жардамдан баш тартып, жолду таппай калдың.', 'Ты отказался от помощи и так и не нашёл дорогу.', 'You refused help and never found the way.'),
          L('Эч нерсе эмес.', 'Неважно.', 'Forget it.'), [])
      ]
    },
    l5: {
      art: 'museum', speaker: 'Guard',
      context: L('Акыры музейге жеттиң, бирок кеч болуп калды.', 'Ты наконец дошёл до музея, но уже поздно.', 'You finally reach the museum, but it is late.'),
      line: "I'm sorry, the museum closes in fifteen minutes. We are not selling tickets any more.",
      lineT: L('Кечиресиз, музей он беш мүнөттөн кийин жабылат. Билет сатпай калдык.', 'Извините, музей закрывается через пятнадцать минут. Билеты больше не продаём.', 'Sorry, the museum closes in fifteen minutes. No more tickets today.'),
      choices: [
        C('I understand. I came a long way — could I see just the main hall for a few minutes, or should I come back tomorrow?', 'best', 'great',
          "Well... since you asked so nicely — ten minutes in the main hall. And here's a free ticket for tomorrow!",
          L('Эрежени түшүнгөнүңдү көрсөтүп, сылык суроо бердиң жана альтернатива сунуштадың.', 'Ты показал, что понимаешь правила, вежливо попросил и предложил выход.', 'You showed you understand the rules, asked politely and offered an alternative.'),
          L('Түшүнөм. Алыстан келдим — негизги залды бир нече мүнөт көрсөм болобу, же эртең келейинби?', 'Понимаю. Я издалека — можно хоть пару минут посмотреть главный зал, или прийти завтра?', 'I see. I came from far away — may I see the main hall for a few minutes, or come back tomorrow?'), ['I understand', 'Could I ...?', 'or should I ...?']),
        C("Okay, I'll come back tomorrow.", 'ok', 'tomorrow', 'See you tomorrow!',
          L('Сылык, бирок мүмкүнчүлүк сураган жоксуң.', 'Вежливо, но ты даже не попробовал попросить.', 'Polite, but you did not even try to ask.'),
          L('Макул, эртең келем.', 'Хорошо, приду завтра.', 'Okay, I will come tomorrow.'), []),
        C("That's ridiculous! Let me in!", 'poor', 'turned-away', 'I am sorry, the museum is closed.',
          L('Кыйкырык менен эч нерсеге жетишкен жоксуң.', 'Криком ты ничего не добился.', 'Shouting got you nothing.'),
          L('Бул акылга сыйбайт! Мени киргизиңиз!', 'Это нелепо! Впустите меня!', 'This is silly! Let me in!'), [])
      ]
    }
  },
  endings: {
    great: { good: true, title: L('Сылык сөз эшикти ачат', 'Вежливость открывает двери', 'Politeness opens doors'), text: L('Сен негизги залды көрдүң жана эртеңкиге бекер билет алдың!', 'Ты увидел главный зал и получил бесплатный билет на завтра!', 'You saw the main hall and got a free ticket for tomorrow!') },
    tomorrow: { good: true, title: L('Эртең кайра', 'Завтра снова', 'Back tomorrow'), text: L('Музейге жеттиң, бирок кечигип калдың. Эртең кайра келесиң.', 'Ты нашёл музей, но опоздал. Придёшь завтра.', 'You found the museum but were late. You will come back tomorrow.') },
    'turned-away': { good: false, title: L('Эшик жабык', 'Дверь закрыта', 'Door closed'), text: L('Кыйкырганың үчүн сени киргизишкен жок. Кайра ойноп, сылык сүйлөп көр.', 'Из-за крика тебя не пустили. Сыграй снова и попробуй вежливо.', 'You were not let in because you shouted. Try again, politely.') },
    'bus-trouble': { good: false, title: L('Автобустан түшүрүштү', 'Высадили из автобуса', 'Off the bus'), text: L('Билетсиз сени автобуска киргизишкен жок, музейге жетпей калдың.', 'Без билета тебя не пустили в автобус, и до музея ты не добрался.', 'Without a ticket you could not ride, so you never reached the museum.') },
    lost: { good: false, title: L('Адашып калдың', 'Ты заблудился', 'Still lost'), text: L('Жардамдан баш тартып, музейди таппай калдың. Кайра ойноп, жардам сурап көр.', 'Ты отказался от помощи и не нашёл музей. Сыграй снова и попроси помощи.', 'You refused help and never found the museum. Play again and ask for help.') }
  }
};

export const STORIES = [FIRST_DAY, CAFE, LOST];
export const getStory = (id) => STORIES.find((s) => s.id === id) || null;
