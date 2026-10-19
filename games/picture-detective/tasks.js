/**
 * Picture Detective — задания и рубрики. Рисунки — scenes.js (тот же id сцены).
 * need — группы слов, каждая должна встретиться в одном предложении (с синонимами);
 * extra — слова точности (цвет, число, место); label — какая это деталь (язык интерфейса);
 * tip — как её добавить. examples показываются только ПОСЛЕ ответа.
 */

const L = (ky, ru, en) => ({ ky, ru, en });
const E = (id, weight, need, extra, label, tip) => ({ id, weight, need, extra, label, tip });

const BAG = ['bag', 'backpack', 'schoolbag', 'rucksack'];
const BOY = ['boy', 'student', 'pupil', 'kid', 'child', 'he'];
const GIRL = ['girl', 'student', 'pupil', 'kid', 'child', 'she'];
const MAN = ['man', 'father', 'dad', 'he', 'customer', 'person'];
const WOMAN = ['woman', 'mother', 'mom', 'mum', 'she', 'lady', 'person'];
const TABLE = ['table', 'desk'];
const UNDER = ['under', 'below', 'beneath', 'underneath'];
const ON = ['on', 'on top of'];
const NEXT = ['next to', 'near', 'beside', 'by'];

export const TASKS = [
  // ─── Beginner ────────────────────────────────────────────────────────────
  {
    id: 'classroom', level: 'beginner', scene: 'classroom', minSentences: 2,
    title: L('Класс', 'Класс', 'Classroom'),
    prompt: 'Describe the classroom in two English sentences. Where is the bag? What is the boy doing?',
    elements: [
      E('bag-place', 2, [BAG, UNDER, TABLE.concat(['chair'])], [['blue']], L('сумка кайда турат', 'где находится сумка', 'where the bag is'), L('Сумка кайда экенин айт: under / on / next to.', 'Скажи, где сумка: under / on / next to.', 'Say where the bag is: under / on / next to.')),
      E('boy-reading', 2, [BOY, ['read', 'look at', 'study']], [['book']], L('бала эмне кылып жатат', 'что делает мальчик', 'what the boy is doing'), L('Баланын аракетин айт: The boy is …ing.', 'Скажи, что делает мальчик: The boy is …ing.', 'Say what the boy is doing: The boy is …ing.'))
    ],
    examples: ['The blue bag is under the table.', 'The boy is reading a book.']
  },
  {
    id: 'rain', level: 'beginner', scene: 'rain', minSentences: 2,
    title: L('Жаан', 'Дождь', 'Rain'),
    prompt: 'What is the weather like? What does the girl have?',
    elements: [
      E('weather', 2, [['rain', 'rainy', 'raining', 'wet']], [['cloud', 'cloudy', 'grey', 'gray']], L('аба ырайы', 'какая погода', 'the weather'), L('Аба ырайын айт: It is rainy / It is raining.', 'Скажи о погоде: It is rainy / It is raining.', 'Say what the weather is like: It is raining.')),
      E('umbrella', 2, [GIRL, ['umbrella']], [['red'], ['have', 'has', 'hold', 'holding']], L('кыздын колунда эмне бар', 'что у девочки', 'what the girl has'), L('Кыздын эмнеси бар экенин айт: The girl has a …', 'Скажи, что у девочки: The girl has a …', 'Say what the girl has: The girl has a …'))
    ],
    examples: ['It is raining today.', 'The girl has a red umbrella.']
  },
  {
    id: 'breakfast', level: 'beginner', scene: 'breakfast', minSentences: 2,
    title: L('Эртең мененки тамак', 'Завтрак', 'Breakfast'),
    prompt: 'What is on the table? Name at least two things.',
    elements: [
      E('food', 2, [['egg', 'eggs', 'bread', 'toast', 'cheese']], [['two', 'some', 'plate']], L('үстөлдөгү тамак', 'еда на столе', 'the food on the table'), L('Тамакты ата: There are eggs / There is bread.', 'Назови еду: There are eggs / There is bread.', 'Name the food: There are eggs / There is bread.')),
      E('drink', 2, [['milk', 'juice', 'cup', 'glass', 'tea']], [['white', 'glass']], L('суусундук', 'напиток', 'the drink'), L('Суусундукту ата: There is a glass of milk.', 'Назови напиток: There is a glass of milk.', 'Name the drink: There is a glass of milk.')),
      E('table', 1, [TABLE, ON.concat(['there'])], [], L('баары үстөлдө экени', 'что всё лежит на столе', 'that it is on the table'), L('«on the table» деп кош.', 'Добавь «on the table».', 'Add "on the table".'))
    ],
    examples: ['There are two eggs and some bread on the table.', 'There is a glass of milk on the table.']
  },
  {
    id: 'park', level: 'beginner', scene: 'park', minSentences: 2,
    title: L('Парк', 'Парк', 'Park'),
    prompt: 'Describe the dog and the ball.',
    elements: [
      E('dog-running', 2, [['dog', 'puppy'], ['run', 'play', 'jump', 'chase']], [['brown', 'small', 'big']], L('ит эмне кылып жатат', 'что делает собака', 'what the dog is doing'), L('Иттин аракетин айт: The dog is running.', 'Скажи, что делает собака: The dog is running.', 'Say what the dog is doing: The dog is running.')),
      E('ball', 2, [['ball'], NEXT.concat(UNDER, ['in', 'on', 'grass', 'tree'])], [['yellow']], L('топ кайда', 'где мяч', 'where the ball is'), L('Топ кайда экенин айт: The ball is under the tree.', 'Скажи, где мяч: The ball is under the tree.', 'Say where the ball is: The ball is under the tree.'))
    ],
    examples: ['The brown dog is running.', 'The yellow ball is under the tree.']
  },
  // ─── Intermediate ────────────────────────────────────────────────────────
  {
    id: 'family', level: 'intermediate', scene: 'family', minSentences: 3,
    title: L('Үйдөгү үй-бүлө', 'Семья дома', 'Family at home'),
    prompt: 'Describe the family at home in three sentences: who is there and what are they doing?',
    elements: [
      E('mother-cooking', 2, [WOMAN, ['cook', 'make', 'prepare', 'fry']], [['kitchen', 'soup', 'dinner']], L('апа эмне кылып жатат', 'что делает мама', 'what the mother is doing'), L('Апанын аракетин айт: The mother is cooking.', 'Скажи, что делает мама: The mother is cooking.', 'Say what the mother is doing: The mother is cooking.')),
      E('father-reading', 2, [MAN, ['read', 'sit']], [['newspaper', 'sofa', 'couch']], L('ата эмне кылып жатат', 'что делает папа', 'what the father is doing'), L('Атанын аракетин айт: The father is reading …', 'Скажи, что делает папа: The father is reading …', 'Say what the father is doing: The father is reading …')),
      E('cat', 1, [['cat', 'kitten'], ON.concat(NEXT, UNDER, ['sleep', 'sit', 'lie'])], [['sofa', 'black']], L('мышык', 'кошка', 'the cat'), L('Мышык жөнүндө айт: The cat is sleeping on the sofa.', 'Скажи про кошку: The cat is sleeping on the sofa.', 'Say something about the cat: The cat is sleeping on the sofa.'))
    ],
    examples: ['The mother is cooking dinner in the kitchen.', 'The father is reading a newspaper on the sofa.', 'The black cat is sleeping next to him.']
  },
  {
    id: 'shop', level: 'intermediate', scene: 'shop', minSentences: 3,
    title: L('Дүкөн', 'Магазин', 'Shop'),
    prompt: 'Describe the shop in three sentences: what is the man buying and who helps him?',
    elements: [
      E('man-buying', 2, [MAN, ['buy', 'pay', 'choose', 'shop']], [['apple', 'apples', 'fruit']], L('киши эмне сатып алып жатат', 'что покупает мужчина', 'what the man is buying'), L('Аракетти жана буюмду айт: The man is buying apples.', 'Скажи действие и предмет: The man is buying apples.', 'Say the action and the thing: The man is buying apples.')),
      E('cashier', 2, [['cashier', 'shop assistant', 'seller', 'woman', 'she'], ['help', 'stand', 'work', 'sell', 'smile', 'give']], [['counter', 'till']], L('кассир', 'кассир', 'the cashier'), L('Кассир жөнүндө айт: The cashier is helping him.', 'Скажи про кассира: The cashier is helping him.', 'Say something about the cashier: The cashier is helping him.')),
      E('basket', 1, [['basket'], ['red', 'full', 'apple', 'apples', 'in', 'has', 'hold', 'carry']], [['red']], L('себет', 'корзина', 'the basket'), L('Себеттеги нерселерди айт: His basket is full of …', 'Скажи, что в корзине: His basket is full of …', 'Say what is in the basket: His basket is full of …'))
    ],
    examples: ['The man is buying apples.', 'The cashier is helping him at the counter.', 'He is carrying a red basket.']
  },
  {
    id: 'cafe', level: 'intermediate', scene: 'cafe', minSentences: 3,
    title: L('Кафе', 'Кафе', 'Café'),
    prompt: 'Describe what is happening in the café in three sentences.',
    elements: [
      E('woman-drinking', 2, [WOMAN, ['drink', 'sit', 'have']], [['coffee', 'tea', 'cup']], L('аял эмне кылып жатат', 'что делает женщина', 'what the woman is doing'), L('Аялдын аракетин айт: The woman is drinking coffee.', 'Скажи, что делает женщина: The woman is drinking coffee.', 'Say what the woman is doing: The woman is drinking coffee.')),
      E('waiter', 2, [['waiter', 'man', 'he'], ['carry', 'bring', 'hold', 'serve', 'walk']], [['tray', 'cake']], L('официант эмне кылып жатат', 'что делает официант', 'what the waiter is doing'), L('Официант жөнүндө айт: The waiter is carrying a tray.', 'Скажи про официанта: The waiter is carrying a tray.', 'Say what the waiter is doing: The waiter is carrying a tray.')),
      E('cake', 1, [['cake', 'dessert'], ON.concat(['tray', 'table', 'plate'])], [['pink', 'chocolate']], L('торт', 'торт', 'the cake'), L('Торт кайда экенин айт.', 'Скажи, где торт.', 'Say where the cake is.'))
    ],
    examples: ['The woman is drinking coffee at a table.', 'The waiter is carrying a tray.', 'There is a pink cake on the tray.']
  },
  {
    id: 'street', level: 'intermediate', scene: 'street', minSentences: 3,
    title: L('Көчө жана транспорт', 'Улица и транспорт', 'Street and transport'),
    prompt: 'Describe the street in three sentences: transport, the traffic light and the people.',
    elements: [
      E('bus', 2, [['bus'], ['red', 'stop', 'drive', 'go', 'wait', 'is', 'there']], [['red', 'big']], L('автобус', 'автобус', 'the bus'), L('Автобус жөнүндө айт: There is a red bus.', 'Скажи про автобус: There is a red bus.', 'Say something about the bus: There is a red bus.')),
      E('light', 2, [['traffic light', 'light'], ['green', 'red']], [], L('светофор', 'светофор', 'the traffic light'), L('Светофордун түсүн айт: The traffic light is green.', 'Скажи цвет светофора: The traffic light is green.', 'Say the colour of the traffic light: The traffic light is green.')),
      E('crossing', 2, [['people', 'person', 'boy', 'girl', 'children', 'man', 'woman', 'they'], ['cross', 'walk']], [['road', 'street', 'zebra', 'crossing']], L('адамдар эмне кылып жатат', 'что делают люди', 'what the people are doing'), L('Адамдар жөнүндө айт: People are crossing the road.', 'Скажи про людей: People are crossing the road.', 'Say what the people are doing: People are crossing the road.')),
      E('bike', 1, [['bike', 'bicycle', 'cyclist']], [['blue']], L('велосипед', 'велосипед', 'the bicycle'), L('Велосипедди да айт.', 'Не забудь велосипед.', 'Mention the bicycle too.'))
    ],
    examples: ['There is a big red bus on the street.', 'The traffic light is green.', 'Two people are crossing the road, and a man is riding a blue bike.']
  },
  {
    id: 'morning', level: 'intermediate', scene: 'morning', minSentences: 3,
    title: L('Эртең мененки адат', 'Утренние дела', 'Morning routine'),
    prompt: 'What is the boy doing, and what time is it? Use three sentences.',
    elements: [
      E('brushing', 2, [BOY, ['brush', 'clean', 'wash']], [['teeth', 'toothbrush']], L('бала эмне кылып жатат', 'что делает мальчик', 'what the boy is doing'), L('Аракетти айт: The boy is brushing his teeth.', 'Скажи действие: The boy is brushing his teeth.', 'Say the action: The boy is brushing his teeth.')),
      E('time', 2, [['seven', '7', 'oclock', 'morning', 'time']], [['oclock', 'clock']], L('саат канча', 'который час', 'what time it is'), L('Убакытты айт: It is seven o\'clock.', 'Скажи время: It is seven o\'clock.', 'Say the time: It is seven o\'clock.')),
      E('place', 1, [['bathroom', 'mirror', 'sink']], [['mirror', 'in front of']], L('кайда турат', 'где он находится', 'where he is'), L('Жайды айт: He is in the bathroom.', 'Скажи место: He is in the bathroom.', 'Say the place: He is in the bathroom.'))
    ],
    examples: ['The boy is brushing his teeth.', 'It is seven o\'clock in the morning.', 'He is in the bathroom in front of the mirror.']
  },
  // ─── Advanced ────────────────────────────────────────────────────────────
  {
    id: 'winter', level: 'advanced', scene: 'winter', minSentences: 4,
    title: L('Тоодогу кыш', 'Зима в горах', 'Winter in the mountains'),
    prompt: 'Describe the winter scene in four sentences. Compare the two children and explain why they are wearing warm clothes.',
    elements: [
      E('snowman', 2, [['snowman'], ['build', 'make', 'next to', 'near', 'is', 'there']], [['big', 'carrot', 'hat']], L('кар киши', 'снеговик', 'the snowman'), L('Кар киши жөнүндө айт: The children are building a snowman.', 'Скажи про снеговика: The children are building a snowman.', 'Say something about the snowman: The children are building a snowman.')),
      E('weather', 1, [['snow', 'snowy', 'cold', 'winter', 'freezing']], [['white']], L('аба ырайы', 'погода', 'the weather'), L('Аба ырайын айт: It is cold and snowy.', 'Скажи о погоде: It is cold and snowy.', 'Say what the weather is like: It is cold and snowy.')),
      E('compare', 2, [['taller', 'shorter', 'bigger', 'smaller', 'older', 'younger', 'than', 'more']], [['than']], L('эки баланы салыштыруу', 'сравнение двух детей', 'a comparison of the two children'), L('Салыштыр: The boy is taller than the girl.', 'Сравни: The boy is taller than the girl.', 'Compare them: The boy is taller than the girl.')),
      E('reason', 2, [['because', 'so', 'since', 'as']], [['cold', 'warm']], L('себеп (эмне үчүн)', 'причина (почему)', 'a reason (why)'), L('Себебин айт: They wear hats because it is cold.', 'Объясни причину: They wear hats because it is cold.', 'Give a reason: They wear hats because it is cold.')),
      E('mountains', 1, [['mountain', 'mountains', 'hill', 'hills']], [['high', 'behind']], L('тоолор', 'горы', 'the mountains'), L('Фонду айт: There are mountains behind them.', 'Опиши фон: There are mountains behind them.', 'Describe the background: There are mountains behind them.'))
    ],
    examples: ['Two children are building a big snowman.', 'It is cold and snowy in the mountains.', 'The boy is taller than the girl.', 'They are wearing hats and scarves because it is very cold.']
  },
  {
    id: 'football', level: 'advanced', scene: 'football', minSentences: 4,
    title: L('Футбол', 'Футбол', 'Football'),
    prompt: 'Describe the match in four sentences: what is happening, who is winning, and how does the girl feel? Give a reason.',
    elements: [
      E('kicking', 2, [BOY.concat(['player', 'they', 'boys']), ['kick', 'play', 'score', 'run']], [['ball', 'football', 'goal']], L('ойнотулар эмне кылып жатат', 'что делают игроки', 'what the players are doing'), L('Аракетти айт: The boy is kicking the ball.', 'Скажи действие: The boy is kicking the ball.', 'Say the action: The boy is kicking the ball.')),
      E('goalkeeper', 1, [['goalkeeper', 'goalie', 'goal']], [['jump', 'jumping', 'catch']], L('дарбазачы', 'вратарь', 'the goalkeeper'), L('Дарбазачыны айт.', 'Скажи про вратаря.', 'Mention the goalkeeper.')),
      E('score', 2, [['winning', 'win', 'score', 'two', 'one', '2', '1', 'losing']], [['red', 'blue', 'team']], L('эсеп / ким утуп жатат', 'счёт / кто выигрывает', 'the score / who is winning'), L('Эсепти айт: The red team is winning two to one.', 'Скажи счёт: The red team is winning two to one.', 'Say the score: The red team is winning two to one.')),
      E('feeling', 2, [GIRL, ['happy', 'excited', 'sad', 'cheer', 'clap', 'smile', 'watch']], [['because', 'so']], L('кыздын маанайы жана себеби', 'чувства девочки и причина', 'how the girl feels and why'), L('Сезимди жана себепти айт: She is happy because her team is winning.', 'Назови чувство и причину: She is happy because her team is winning.', 'Say the feeling and the reason: She is happy because her team is winning.'))
    ],
    examples: ['A boy is kicking the ball towards the goal.', 'The goalkeeper is jumping.', 'The red team is winning two to one.', 'The girl is happy and she is cheering because her team is winning.']
  },
  {
    id: 'bazaar', level: 'advanced', scene: 'bazaar', minSentences: 4,
    title: L('Базар', 'Базар', 'Bazaar'),
    prompt: 'Describe the market in four sentences: the seller, the fruit, the prices, and which fruit you would buy and why.',
    elements: [
      E('seller', 2, [['seller', 'man', 'woman', 'trader', 'he', 'she'], ['sell', 'stand', 'smile', 'wear', 'give']], [['hat', 'kalpak', 'apron']], L('сатуучу', 'продавец', 'the seller'), L('Сатуучу жөнүндө айт: The seller is selling fruit.', 'Скажи про продавца: The seller is selling fruit.', 'Say something about the seller: The seller is selling fruit.')),
      E('fruit', 2, [['apple', 'apples', 'melon', 'melons', 'grape', 'grapes', 'apricot', 'apricots', 'fruit']], [['red', 'green', 'yellow', 'big']], L('жемиштер', 'фрукты', 'the fruit'), L('Жемиштерди ата: There are apples and melons.', 'Назови фрукты: There are apples and melons.', 'Name the fruit: There are apples and melons.')),
      E('price', 2, [['som', 'price', 'cost', 'costs', 'cheap', 'expensive', 'cheaper', 'more expensive']], [['than', '50', '100', 'fifty', 'hundred']], L('баалар', 'цены', 'the prices'), L('Бааны айт же салыштыр: Apples cost 50 som, melons are more expensive.', 'Скажи цену или сравни: Apples cost 50 som, melons are more expensive.', 'Say or compare the prices: Apples cost 50 som, melons are more expensive.')),
      E('opinion', 2, [['i would', 'id', 'i want', 'i like', 'buy'], ['because', 'so', 'since']], [], L('өз тандооң жана себеби', 'твой выбор и причина', 'your choice and why'), L('Тандооңду айт: I would buy apples because they are cheap.', 'Скажи свой выбор: I would buy apples because they are cheap.', 'Say your choice: I would buy apples because they are cheap.'))
    ],
    examples: ['The seller is smiling and selling fruit.', 'There are red apples, green melons and grapes.', 'Apples cost 50 som, but melons are more expensive.', 'I would buy apples because they are cheaper.']
  }
];

export const getTask = (id) => TASKS.find((t) => t.id === id) || null;
