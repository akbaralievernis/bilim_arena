/**
 * ДЕЛО №001 — «Музейдин жоголгон экспонаты» / «Пропавший экспонат музея».
 *
 * Безопасный школьный формат расследования: никакого насилия, пропал
 * музейный экспонат. Ученики ищут противоречия в показаниях и открывают
 * улики, решая учебные задания по истории Кыргызстана.
 *
 * ВАЖНО: это только данные. Движок игры (games/investigation/game.js)
 * ничего не знает про этот сюжет — новая история добавляется отдельным файлом.
 */
export default {
  id: 'case-001-museum',
  number: '001',
  subject: 'kg-history',
  grade: 8,
  topic: 'kg-history-8-independence',
  difficulty: 2,
  duration: 30,

  title: {
    ky: 'Музейдин жоголгон экспонаты',
    ru: 'Пропавший экспонат музея',
    en: 'The missing museum exhibit'
  },

  intro: {
    ky: 'Мектеп музейинен «Эгемендүүлүк» көргөзмөсүнүн башкы экспонаты — кол менен согулган туу жоголду. Ошол күнү музейде төрт киши болгон. Уликаларды ачып, алардын көрсөтмөлөрүндөгү карама-каршылыкты табыңыз.',
    ru: 'Из школьного музея пропал главный экспонат выставки «Независимость» — флаг ручной работы. В тот день в музее были четыре человека. Открывайте улики и ищите противоречия в их показаниях.',
    en: 'The main exhibit of the "Independence" display — a handmade flag — has disappeared from the school museum. Four people were there that day. Unlock the clues and find the contradiction in their statements.'
  },

  // ─── Подозреваемые ─────────────────────────────────────────────────────────
  suspects: [
    {
      id: 'sus-a', letter: 'A', emoji: '🧹',
      name: { ky: 'Улан агай, кароолчу', ru: 'Улан, сторож', en: 'Ulan, the guard' },
      description: {
        ky: 'Музейде 5 жылдан бери иштейт. Ачкычтар анда турат.',
        ru: 'Работает в музее 5 лет. Ключи хранятся у него.',
        en: 'Has worked at the museum for 5 years. He keeps the keys.'
      },
      statement: {
        ky: '«Мен музейди саат 15:00дө жаап, ачкычты директордун кабинетине тапшырдым. Андан кийин имаратта болгон жокмун».',
        ru: '«Я закрыл музей в 15:00 и сдал ключ в кабинет директора. После этого в здании меня не было».',
        en: '"I locked the museum at 15:00 and handed the key to the head teacher. I was not in the building after that."'
      },
      linkedClues: ['clue-1', 'clue-6']
    },
    {
      id: 'sus-b', letter: 'B', emoji: '🎨',
      name: { ky: 'Айгүл эже, экскурсовод', ru: 'Айгуль, экскурсовод', en: 'Aigul, the guide' },
      description: {
        ky: 'Көргөзмөнү даярдаган, ар бир экспонатты жакшы билет.',
        ru: 'Готовила выставку, хорошо знает каждый экспонат.',
        en: 'Prepared the exhibition and knows every exhibit well.'
      },
      statement: {
        ky: '«Саат 14:30да акыркы экскурсияны бүтүрүп, туу ордунда турганын көрдүм».',
        ru: '«В 14:30 я закончила последнюю экскурсию и видела, что флаг был на месте».',
        en: '"At 14:30 I finished the last tour and saw the flag still in place."'
      },
      linkedClues: ['clue-2', 'clue-4']
    },
    {
      id: 'sus-c', letter: 'C', emoji: '🔌',
      name: { ky: 'Нурлан, электрик', ru: 'Нурлан, электрик', en: 'Nurlan, the electrician' },
      description: {
        ky: 'Ошол күнү музейдин жарыгын оңдогон.',
        ru: 'В тот день чинил освещение в музее.',
        en: 'Was repairing the museum lighting that day.'
      },
      statement: {
        ky: '«Мен музейге такыр кирген жокмун, жарыкты коридордон оңдодум».',
        ru: '«Я вообще не заходил в музей, чинил свет из коридора».',
        en: '"I never entered the museum, I fixed the light from the corridor."'
      },
      linkedClues: ['clue-3', 'clue-5', 'clue-8'],
      guilty: true
    },
    {
      id: 'sus-d', letter: 'D', emoji: '📚',
      name: { ky: 'Жамиля, окуучу-волонтёр', ru: 'Жамиля, ученица-волонтёр', en: 'Jamila, student volunteer' },
      description: {
        ky: 'Көргөзмөгө жардам берген, 8-класстын окуучусу.',
        ru: 'Помогала на выставке, ученица 8 класса.',
        en: 'Helped at the exhibition, an 8th grade student.'
      },
      statement: {
        ky: '«Саат 14:00дө сабакка кеттим, аны мугалим ырастай алат».',
        ru: '«В 14:00 я ушла на урок, это может подтвердить учитель».',
        en: '"At 14:00 I left for a lesson, the teacher can confirm it."'
      },
      linkedClues: ['clue-7']
    }
  ],

  // ─── Улики ─────────────────────────────────────────────────────────────────
  // Каждая улика открывается после учебного задания. skill — навык темы,
  // по нему ошибка попадает в аналитику платформы.
  clues: [
    {
      id: 'clue-1', type: 'document', icon: '📄',
      title: { ky: 'Музейдин журналы', ru: 'Журнал музея', en: 'Museum logbook' },
      content: {
        ky: 'Журналда жазылган: «Көргөзмө 1991-жылдын 31-августунун урматына ачылды». Акыркы жазуу саат 15:10.',
        ru: 'В журнале записано: «Выставка открыта в честь 31 августа 1991 года». Последняя запись — 15:10.',
        en: 'The log says: "Exhibition opened in honour of 31 August 1991." The last entry is at 15:10.'
      },
      insight: {
        ky: 'Кароолчу 15:00дө кеткен дейт, бирок журналдагы акыркы жазуу 15:10.',
        ru: 'Сторож говорит, что ушёл в 15:00, но последняя запись в журнале — 15:10.',
        en: 'The guard says he left at 15:00, but the last log entry is 15:10.'
      },
      skill: 'dates',
      question: {
        type: 'choice',
        prompt: {
          ky: 'Журналда аталган датада эмне болгон?',
          ru: 'Что произошло в дате, указанной в журнале?',
          en: 'What happened on the date mentioned in the log?'
        },
        options: [
          { ky: 'Эгемендүүлүк жарыяланган', ru: 'Провозглашена независимость', en: 'Independence was declared' },
          { ky: 'Конституция кабыл алынган', ru: 'Принята Конституция', en: 'The Constitution was adopted' },
          { ky: 'Сом киргизилген', ru: 'Введён сом', en: 'The som was introduced' },
          { ky: 'БУУга мүчө болгон', ru: 'Вступление в ООН', en: 'Joined the UN' }
        ],
        correct: 0,
        explain: {
          ky: '1991-жылы 31-августта Кыргызстандын эгемендүүлүгү жарыяланган.',
          ru: '31 августа 1991 года провозглашена независимость Кыргызстана.',
          en: 'On 31 August 1991 Kyrgyzstan declared its independence.'
        }
      }
    },
    {
      id: 'clue-2', type: 'photo', icon: '📷',
      title: { ky: 'Витринанын сүрөтү', ru: 'Фотография витрины', en: 'Photo of the display case' },
      content: {
        ky: 'Саат 14:30дагы сүрөттө туу ордунда, күндүн нурлары даана көрүнөт.',
        ru: 'На фотографии в 14:30 флаг на месте, лучи солнца хорошо видны.',
        en: 'In the 14:30 photo the flag is in place, the sun rays are clearly visible.'
      },
      insight: {
        ky: 'Демек, туу 14:30дан кийин жоголгон.',
        ru: 'Значит, флаг пропал после 14:30.',
        en: 'So the flag disappeared after 14:30.'
      },
      skill: 'symbols',
      question: {
        type: 'choice',
        prompt: {
          ky: 'Сүрөттөгү туунун күнүндө канча нур бар?',
          ru: 'Сколько лучей у солнца на флаге с фотографии?',
          en: 'How many rays does the sun on the flag have?'
        },
        options: ['40', '30', '24', '12'],
        correct: 0,
        explain: {
          ky: '40 нур — 40 кыргыз уруусунун символу.',
          ru: '40 лучей символизируют 40 кыргызских племён.',
          en: 'The 40 rays stand for the 40 Kyrgyz tribes.'
        }
      }
    },
    {
      id: 'clue-3', type: 'map', icon: '🗺️',
      title: { ky: 'Мектептин планы', ru: 'План школы', en: 'School floor plan' },
      content: {
        ky: 'Музейге эки эшик бар: башкы эшик жана электр щитинин жанындагы кызматтык эшик.',
        ru: 'В музей ведут две двери: главная и служебная — рядом с электрощитом.',
        en: 'Two doors lead into the museum: the main one and a service door next to the electrical panel.'
      },
      insight: {
        ky: 'Кызматтык эшик электр щитинин жанында — ал жерде электрик иштеген.',
        ru: 'Служебная дверь рядом с электрощитом — там работал электрик.',
        en: 'The service door is next to the panel where the electrician was working.'
      },
      skill: 'symbols',
      question: {
        type: 'choice',
        prompt: {
          ky: 'Кыргызстандын мамлекеттик гербинде кайсы куш бар?',
          ru: 'Какая птица изображена на гербе Кыргызстана?',
          en: 'Which bird is on the coat of arms of Kyrgyzstan?'
        },
        options: [
          { ky: 'Ак шумкар', ru: 'Белый сокол', en: 'White falcon' },
          { ky: 'Бүркүт', ru: 'Орёл', en: 'Eagle' },
          { ky: 'Каз', ru: 'Гусь', en: 'Goose' },
          { ky: 'Турна', ru: 'Журавль', en: 'Crane' }
        ],
        correct: 0,
        explain: {
          ky: 'Гербде ак шумкар жана Ала-Тоо тартылган.',
          ru: 'На гербе изображены белый сокол и горы Ала-Тоо.',
          en: 'The emblem shows a white falcon and the Ala-Too mountains.'
        }
      }
    },
    {
      id: 'clue-4', type: 'testimony', icon: '💬',
      title: { ky: 'Китепканачынын көрсөтмөсү', ru: 'Показания библиотекаря', en: 'Librarian testimony' },
      content: {
        ky: '«Саат 15:05те коридордо шаймандын үнүн уктум, бирок коридордо эч ким жок эле».',
        ru: '«В 15:05 я слышала звук инструмента в коридоре, но самого коридора никто не пересекал».',
        en: '"At 15:05 I heard a tool in the corridor, but nobody was crossing the corridor."'
      },
      insight: {
        ky: 'Үн болгон, бирок коридордо киши жок — демек, ал бөлмөдө болгон.',
        ru: 'Звук был, но в коридоре никого — значит, человек был внутри помещения.',
        en: 'There was a sound but nobody in the corridor — so the person was inside a room.'
      },
      skill: 'people',
      question: {
        type: 'choice',
        prompt: {
          ky: '«Жамийла» повестинин автору ким?',
          ru: 'Кто автор повести «Джамиля»?',
          en: 'Who wrote the novella "Jamila"?'
        },
        options: ['Чыңгыз Айтматов', 'Төлөгөн Касымбеков', 'Алыкул Осмонов', 'Касым Тыныстанов'],
        correct: 0,
        explain: {
          ky: 'Чыңгыз Айтматов — дүйнөгө белгилүү кыргыз жазуучусу.',
          ru: 'Чингиз Айтматов — всемирно известный кыргызский писатель.',
          en: 'Chingiz Aitmatov is a world-famous Kyrgyz writer.'
        }
      }
    },
    {
      id: 'clue-5', type: 'table', icon: '📊',
      title: { ky: 'Жумуш табели', ru: 'Табель работ', en: 'Work sheet' },
      content: {
        ky: 'Электриктин табелинде: «Музей залы — жарык оңдоо, 14:40–15:20».',
        ru: 'В табеле электрика: «Зал музея — ремонт освещения, 14:40–15:20».',
        en: 'The electrician sheet says: "Museum hall — lighting repair, 14:40–15:20."'
      },
      insight: {
        ky: 'Ал «музейге кирген жокмун» деген, бирок табелде «музей залы» деп жазылган.',
        ru: 'Он сказал «не заходил в музей», но в табеле записан «зал музея».',
        en: 'He said he never entered the museum, but the sheet says "museum hall".'
      },
      skill: 'dates',
      question: {
        type: 'choice',
        prompt: {
          ky: 'Кыргызстандын биринчи Конституциясы качан кабыл алынган?',
          ru: 'Когда была принята первая Конституция Кыргызстана?',
          en: 'When was the first Constitution of Kyrgyzstan adopted?'
        },
        options: ['1993', '1991', '1995', '1990'],
        correct: 0,
        explain: {
          ky: 'Биринчи Конституция 1993-жылы 5-майда кабыл алынган.',
          ru: 'Первая Конституция принята 5 мая 1993 года.',
          en: 'The first Constitution was adopted on 5 May 1993.'
        }
      }
    },
    {
      id: 'clue-6', type: 'date', icon: '📅',
      title: { ky: 'Ачкычтар журналы', ru: 'Журнал ключей', en: 'Key register' },
      content: {
        ky: 'Ачкыч 15:00дө тапшырылган, бирок 15:25те кайра алынган деп белгиленген.',
        ru: 'Ключ сдан в 15:00, но в 15:25 отмечено, что его снова брали.',
        en: 'The key was handed in at 15:00, but at 15:25 it is marked as taken again.'
      },
      insight: {
        ky: 'Ачкычты кайра ким алган — ошону тактоо керек.',
        ru: 'Нужно выяснить, кто снова взял ключ.',
        en: 'We need to find out who took the key again.'
      },
      skill: 'dates',
      question: {
        type: 'choice',
        prompt: {
          ky: 'Улуттук валюта — сом качан жүгүртүүгө киргизилген?',
          ru: 'Когда национальная валюта сом была введена в обращение?',
          en: 'When was the som introduced?'
        },
        options: ['1993', '1991', '1995', '1997'],
        correct: 0,
        explain: {
          ky: 'Сом 1993-жылы 10-майда киргизилген.',
          ru: 'Сом введён 10 мая 1993 года.',
          en: 'The som was introduced on 10 May 1993.'
        }
      }
    },
    {
      id: 'clue-7', type: 'quote', icon: '🗣️',
      title: { ky: 'Мугалимдин сөзү', ru: 'Слова учителя', en: 'Teacher note' },
      content: {
        ky: '«Жамиля 14:00дөн 16:00гө чейин менин сабагымда отурду».',
        ru: '«Жамиля с 14:00 до 16:00 была у меня на уроке».',
        en: '"Jamila was in my lesson from 14:00 to 16:00."'
      },
      insight: {
        ky: 'Жамилянын көрсөтмөсү ырасталды — ал шектүүлөрдөн чыгат.',
        ru: 'Показания Жамили подтверждены — её можно исключить.',
        en: 'Jamila statement is confirmed — she can be ruled out.'
      },
      skill: 'people',
      question: {
        type: 'choice',
        prompt: {
          ky: 'Кыргызстандын биринчи космонавту ким?',
          ru: 'Кто первый космонавт Кыргызстана?',
          en: 'Who is the first cosmonaut of Kyrgyzstan?'
        },
        options: ['Салижан Шарипов', 'Токтар Аубакиров', 'Юрий Гагарин', 'Алексей Леонов'],
        correct: 0,
        explain: {
          ky: 'Салижан Шарипов — Ош шаарынан чыккан космонавт.',
          ru: 'Салижан Шарипов — космонавт родом из Оша.',
          en: 'Salizhan Sharipov is a cosmonaut from Osh.'
        }
      }
    },
    {
      id: 'clue-8', type: 'object', icon: '🔦',
      title: { ky: 'Табылган буюм', ru: 'Найденный предмет', en: 'Found object' },
      content: {
        ky: 'Витринанын артынан изоляция ленинин калдыгы табылды — электрик колдонгон түрдөн.',
        ru: 'За витриной найден обрывок изоленты — такой же, какой использует электрик.',
        en: 'A piece of insulating tape was found behind the display — the same kind the electrician uses.'
      },
      insight: {
        ky: 'Буюм электриктин музей залында болгонун далилдейт.',
        ru: 'Предмет доказывает, что электрик был в зале музея.',
        en: 'The object proves the electrician was inside the museum hall.'
      },
      skill: 'symbols',
      question: {
        type: 'choice',
        prompt: {
          ky: 'Кыргыз туусунун ортосундагы белги кандай аталат?',
          ru: 'Как называется знак в центре кыргызского флага?',
          en: 'What is the symbol in the centre of the Kyrgyz flag called?'
        },
        options: [
          { ky: 'Түндүк', ru: 'Тюндюк', en: 'Tunduk' },
          { ky: 'Күмбөз', ru: 'Купол', en: 'Dome' },
          { ky: 'Жылдыз', ru: 'Звезда', en: 'Star' },
          { ky: 'Ай', ru: 'Луна', en: 'Moon' }
        ],
        correct: 0,
        explain: {
          ky: 'Түндүк — боз үйдүн чокусу, үй-бүлөнүн символу.',
          ru: 'Тюндюк — верхняя часть юрты, символ семьи и дома.',
          en: 'The tunduk is the crown of the yurt, a symbol of family and home.'
        }
      }
    }
  ],

  // ─── Финал расследования ───────────────────────────────────────────────────
  final: {
    guilty: 'sus-c',
    requiredEvidence: 3,
    // Улики, которые действительно доказывают вину (логическая цепочка)
    keyClues: ['clue-5', 'clue-8', 'clue-3'],
    question: {
      ky: 'Ким экспонатты алган жана муну кайсы уликалар далилдейт?',
      ru: 'Кто взял экспонат и какие улики это доказывают?',
      en: 'Who took the exhibit and which clues prove it?'
    },
    solution: {
      ky: 'Электрик Нурлан «музейге кирген жокмун» деген, бирок жумуш табелинде «музей залы, 14:40–15:20» деп жазылган, залдан анын изоляция лентасы табылган, ал эми кызматтык эшик түз электр щитинин жанында. Ушул үч улика чогуу анын сөзүн жокко чыгарат.',
      ru: 'Электрик Нурлан сказал, что не заходил в музей, но в табеле записано «зал музея, 14:40–15:20», в зале найдена его изолента, а служебная дверь ведёт прямо от электрощита. Эти три улики вместе опровергают его слова.',
      en: 'Nurlan the electrician said he never entered the museum, yet his work sheet says "museum hall, 14:40–15:20", his tape was found inside, and the service door leads straight from the electrical panel. Together these three clues disprove his statement.'
    }
  },

  scoring: {
    clueXP: 15,      // за открытую улику
    answerXP: 10,    // за верный учебный ответ
    evidenceXP: 20,  // за каждую верную улику в обвинении
    finalXP: 60      // за правильно названного виновного
  }
};
