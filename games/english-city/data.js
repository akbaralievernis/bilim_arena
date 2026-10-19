/**
 * English City — сцены и задания. Учебный текст — по-английски; названия сцен — на трёх языках.
 * Логика проверки — в engine.js. Поле solution нужно только тестам (на экран не выводится).
 *
 * Навыки (skills) заданий: colors, numbers, prepositions, multi-step — для итогового разбора.
 */

const L = (ky, ru, en) => ({ ky, ru, en });
const o = (id, kind, color, zone, groups = []) => ({ id, kind, color, zone, groups });

export const SCENES = [
  // ─── Класс ───────────────────────────────────────────────────────────────
  {
    id: 'classroom',
    title: L('Класс', 'Класс', 'Classroom'),
    desc: L('Парталар, китептер жана мугалим', 'Парты, книги и учитель', 'Desks, books and the teacher'),
    zones: [
      { id: 'floor', label: 'floor', art: 'floor', start: true },
      { id: 'desk', label: 'desk', art: 'desk' },
      { id: 'under-desk', label: 'under the desk', art: 'under' },
      { id: 'next-desk', label: 'next to the desk', art: 'next' },
      { id: 'chair', label: 'chair', art: 'chair' },
      { id: 'shelf', label: 'shelf', art: 'shelf' },
      { id: 'teacher', label: 'teacher', art: 'teacher' }
    ],
    objects: [
      o('book-red', 'book', 'red', 'floor', ['school']), o('book-blue', 'book', 'blue', 'floor', ['school']),
      o('book-green', 'book', 'green', 'shelf', ['school']),
      o('bag-blue', 'bag', 'blue', 'floor'), o('bag-red', 'bag', 'red', 'chair'),
      o('pencil-yellow', 'pencil', 'yellow', 'floor', ['school']), o('pencil-red', 'pencil', 'red', 'floor', ['school']),
      o('ruler-green', 'ruler', 'green', 'floor', ['school'])
    ],
    tasks: {
      beginner: [
        { id: 'c-b1', text: 'Put the red book on the desk.', skills: ['colors'], conditions: [{ obj: 'book-red', zone: 'desk', part: 'the red book on the desk' }], solution: [['book-red', 'desk']] },
        { id: 'c-b2', text: 'Put the blue bag on the chair.', skills: ['colors'], conditions: [{ obj: 'bag-blue', zone: 'chair', part: 'the blue bag on the chair' }], solution: [['bag-blue', 'chair']] },
        { id: 'c-b3', text: 'Give the teacher a pencil.', skills: ['numbers'], conditions: [{ match: { kind: 'pencil' }, zone: 'teacher', count: 1, part: 'a pencil for the teacher' }], solution: [['pencil-yellow', 'teacher']] },
        { id: 'c-b4', text: 'Put the green ruler on the shelf.', skills: ['colors'], conditions: [{ obj: 'ruler-green', zone: 'shelf', part: 'the green ruler on the shelf' }], solution: [['ruler-green', 'shelf']] }
      ],
      intermediate: [
        { id: 'c-i1', text: 'Put the blue book under the desk.', skills: ['prepositions', 'colors'], conditions: [{ obj: 'book-blue', zone: 'under-desk', part: 'the blue book under the desk' }], solution: [['book-blue', 'under-desk']] },
        { id: 'c-i2', text: 'Take the red bag off the chair and put it next to the desk.', skills: ['prepositions', 'multi-step'], conditions: [{ obj: 'bag-red', zone: 'next-desk', part: 'the red bag next to the desk' }], solution: [['bag-red', 'next-desk']] },
        { id: 'c-i3', text: 'Put the green book on the desk and the red pencil on the shelf.', skills: ['multi-step', 'colors'], conditions: [{ obj: 'book-green', zone: 'desk', part: 'the green book on the desk' }, { obj: 'pencil-red', zone: 'shelf', part: 'the red pencil on the shelf' }], solution: [['book-green', 'desk'], ['pencil-red', 'shelf']] },
        { id: 'c-i4', text: 'Give the teacher the yellow pencil and the ruler.', skills: ['multi-step', 'colors'], conditions: [{ obj: 'pencil-yellow', zone: 'teacher', part: 'the yellow pencil for the teacher' }, { obj: 'ruler-green', zone: 'teacher', part: 'the ruler for the teacher' }], solution: [['pencil-yellow', 'teacher'], ['ruler-green', 'teacher']] }
      ],
      advanced: [
        { id: 'c-a1', text: 'Put all the books on the shelf, except the red one — it goes on the desk.', skills: ['multi-step', 'colors'], conditions: [{ match: { kind: 'book', notColor: 'red' }, zone: 'shelf', all: true, part: 'all the books (not the red one) on the shelf' }, { obj: 'book-red', zone: 'desk', part: 'the red book on the desk' }], solution: [['book-blue', 'shelf'], ['book-red', 'desk']] },
        { id: 'c-a2', text: 'Put both pencils under the desk and give the green ruler to the teacher.', skills: ['prepositions', 'numbers', 'multi-step'], conditions: [{ match: { kind: 'pencil' }, zone: 'under-desk', count: 2, part: 'both pencils under the desk' }, { obj: 'ruler-green', zone: 'teacher', part: 'the green ruler for the teacher' }], solution: [['pencil-yellow', 'under-desk'], ['pencil-red', 'under-desk'], ['ruler-green', 'teacher']] },
        { id: 'c-a3', text: 'Put the bag that is not blue next to the desk, and put the blue bag on the chair.', skills: ['prepositions', 'colors', 'multi-step'], conditions: [{ obj: 'bag-red', zone: 'next-desk', part: 'the bag that is not blue next to the desk' }, { obj: 'bag-blue', zone: 'chair', part: 'the blue bag on the chair' }], solution: [['bag-red', 'next-desk'], ['bag-blue', 'chair']] }
      ]
    }
  },

  // ─── Кухня ───────────────────────────────────────────────────────────────
  {
    id: 'kitchen',
    title: L('Ашкана', 'Кухня', 'Kitchen'),
    desc: L('Чөйчөктөр, жемиштер жана муздаткыч', 'Чашки, фрукты и холодильник', 'Cups, fruit and the fridge'),
    zones: [
      { id: 'counter', label: 'counter', art: 'counter', start: true },
      { id: 'table', label: 'table', art: 'table' },
      { id: 'next-plate', label: 'next to the plate', art: 'plate' },
      { id: 'under-table', label: 'under the table', art: 'under' },
      { id: 'fridge', label: 'fridge', art: 'fridge' },
      { id: 'shelf', label: 'shelf', art: 'shelf' },
      { id: 'sink', label: 'sink', art: 'sink' }
    ],
    objects: [
      o('cup-green', 'cup', 'green', 'counter'), o('cup-white', 'cup', 'white', 'counter'), o('cup-red', 'cup', 'red', 'counter'),
      o('apple-red-1', 'apple', 'red', 'counter', ['fruit', 'food']), o('apple-red-2', 'apple', 'red', 'counter', ['fruit', 'food']), o('apple-red-3', 'apple', 'red', 'counter', ['fruit', 'food']),
      o('apple-green-1', 'apple', 'green', 'counter', ['fruit', 'food']), o('apple-green-2', 'apple', 'green', 'counter', ['fruit', 'food']),
      o('banana', 'banana', 'yellow', 'counter', ['fruit', 'food']),
      o('milk', 'milk', 'white', 'counter', ['drink']), o('bread', 'bread', 'brown', 'counter', ['food'])
    ],
    tasks: {
      beginner: [
        { id: 'k-b1', text: 'Put the green cup on the table.', skills: ['colors'], conditions: [{ obj: 'cup-green', zone: 'table', part: 'the green cup on the table' }], solution: [['cup-green', 'table']] },
        { id: 'k-b2', text: 'Put the milk in the fridge.', skills: [], conditions: [{ obj: 'milk', zone: 'fridge', part: 'the milk in the fridge' }], solution: [['milk', 'fridge']] },
        { id: 'k-b3', text: 'Put two red apples on the table.', skills: ['numbers', 'colors'], conditions: [{ match: { kind: 'apple', color: 'red' }, zone: 'table', count: 2, part: 'two red apples on the table' }], solution: [['apple-red-1', 'table'], ['apple-red-2', 'table']] },
        { id: 'k-b4', text: 'Put the banana on the shelf.', skills: [], conditions: [{ obj: 'banana', zone: 'shelf', part: 'the banana on the shelf' }], solution: [['banana', 'shelf']] }
      ],
      intermediate: [
        { id: 'k-i1', text: 'Move the green cup next to the plate.', skills: ['prepositions', 'colors'], conditions: [{ obj: 'cup-green', zone: 'next-plate', part: 'the green cup next to the plate' }], solution: [['cup-green', 'next-plate']] },
        { id: 'k-i2', text: 'Put the white cup in the sink and the milk in the fridge.', skills: ['multi-step', 'colors'], conditions: [{ obj: 'cup-white', zone: 'sink', part: 'the white cup in the sink' }, { obj: 'milk', zone: 'fridge', part: 'the milk in the fridge' }], solution: [['cup-white', 'sink'], ['milk', 'fridge']] },
        { id: 'k-i3', text: 'Put three apples on the shelf: two red apples and one green apple.', skills: ['numbers', 'colors', 'multi-step'], conditions: [{ match: { kind: 'apple', color: 'red' }, zone: 'shelf', count: 2, part: 'two red apples on the shelf' }, { match: { kind: 'apple', color: 'green' }, zone: 'shelf', count: 1, part: 'one green apple on the shelf' }], solution: [['apple-red-1', 'shelf'], ['apple-red-2', 'shelf'], ['apple-green-1', 'shelf']] },
        { id: 'k-i4', text: 'Put the bread next to the plate and the red cup under the table.', skills: ['prepositions', 'multi-step'], conditions: [{ obj: 'bread', zone: 'next-plate', part: 'the bread next to the plate' }, { obj: 'cup-red', zone: 'under-table', part: 'the red cup under the table' }], solution: [['bread', 'next-plate'], ['cup-red', 'under-table']] }
      ],
      advanced: [
        { id: 'k-a1', text: 'Put all the fruit that is not red in the fridge.', skills: ['colors', 'multi-step'], conditions: [{ match: { group: 'fruit', notColor: 'red' }, zone: 'fridge', all: true, part: 'all the fruit that is not red in the fridge' }], solution: [['apple-green-1', 'fridge'], ['apple-green-2', 'fridge'], ['banana', 'fridge']] },
        { id: 'k-a2', text: 'Put every cup on the table, but the white cup goes next to the plate.', skills: ['prepositions', 'multi-step'], conditions: [{ match: { kind: 'cup', notColor: 'white' }, zone: 'table', all: true, part: 'every cup (not the white one) on the table' }, { obj: 'cup-white', zone: 'next-plate', part: 'the white cup next to the plate' }], solution: [['cup-green', 'table'], ['cup-red', 'table'], ['cup-white', 'next-plate']] },
        { id: 'k-a3', text: 'Put one red apple next to the plate and the other red apples in the fridge.', skills: ['numbers', 'prepositions', 'multi-step'], conditions: [{ match: { kind: 'apple', color: 'red' }, zone: 'next-plate', count: 1, part: 'one red apple next to the plate' }, { match: { kind: 'apple', color: 'red' }, zone: 'fridge', count: 2, part: 'the other red apples in the fridge' }], solution: [['apple-red-1', 'next-plate'], ['apple-red-2', 'fridge'], ['apple-red-3', 'fridge']] }
      ]
    }
  },

  // ─── Парк ────────────────────────────────────────────────────────────────
  {
    id: 'park',
    title: L('Парк', 'Парк', 'Park'),
    desc: L('Отургуч, дарак жана жаныбарлар', 'Скамейка, дерево и животные', 'A bench, a tree and animals'),
    zones: [
      { id: 'path', label: 'path', art: 'path', start: true },
      { id: 'bench', label: 'bench', art: 'bench' },
      { id: 'next-bench', label: 'next to the bench', art: 'next' },
      { id: 'under-tree', label: 'under the tree', art: 'tree' },
      { id: 'basket', label: 'basket', art: 'basket' },
      { id: 'girl', label: 'girl', art: 'girl' }
    ],
    objects: [
      o('ball-red', 'ball', 'red', 'path', ['toy']), o('ball-blue', 'ball', 'blue', 'path', ['toy']),
      o('hat-yellow', 'hat', 'yellow', 'path'), o('hat-green', 'hat', 'green', 'path'),
      o('sandwich', 'sandwich', 'brown', 'path', ['food']), o('apple-green', 'apple', 'green', 'path', ['food', 'fruit']),
      o('water', 'water', 'blue', 'path', ['drink']),
      o('dog', 'dog', 'brown', 'path', ['animal']), o('cat', 'cat', 'black', 'path', ['animal'])
    ],
    tasks: {
      beginner: [
        { id: 'p-b1', text: 'Put the red ball under the tree.', skills: ['colors', 'prepositions'], conditions: [{ obj: 'ball-red', zone: 'under-tree', part: 'the red ball under the tree' }], solution: [['ball-red', 'under-tree']] },
        { id: 'p-b2', text: 'Give the girl the yellow hat.', skills: ['colors'], conditions: [{ obj: 'hat-yellow', zone: 'girl', part: 'the yellow hat for the girl' }], solution: [['hat-yellow', 'girl']] },
        { id: 'p-b3', text: 'Put the dog on the bench.', skills: [], conditions: [{ obj: 'dog', zone: 'bench', part: 'the dog on the bench' }], solution: [['dog', 'bench']] },
        { id: 'p-b4', text: 'Put the sandwich in the basket.', skills: [], conditions: [{ obj: 'sandwich', zone: 'basket', part: 'the sandwich in the basket' }], solution: [['sandwich', 'basket']] }
      ],
      intermediate: [
        { id: 'p-i1', text: 'Put the blue ball next to the bench.', skills: ['prepositions', 'colors'], conditions: [{ obj: 'ball-blue', zone: 'next-bench', part: 'the blue ball next to the bench' }], solution: [['ball-blue', 'next-bench']] },
        { id: 'p-i2', text: 'Put the cat under the tree and the dog next to the bench.', skills: ['prepositions', 'multi-step'], conditions: [{ obj: 'cat', zone: 'under-tree', part: 'the cat under the tree' }, { obj: 'dog', zone: 'next-bench', part: 'the dog next to the bench' }], solution: [['cat', 'under-tree'], ['dog', 'next-bench']] },
        { id: 'p-i3', text: 'Give the girl a hat and put the other hat on the bench.', skills: ['numbers', 'multi-step'], conditions: [{ match: { kind: 'hat' }, zone: 'girl', count: 1, part: 'a hat for the girl' }, { match: { kind: 'hat' }, zone: 'bench', count: 1, part: 'the other hat on the bench' }], solution: [['hat-green', 'girl'], ['hat-yellow', 'bench']] },
        { id: 'p-i4', text: 'Put the water and the sandwich in the basket.', skills: ['multi-step'], conditions: [{ obj: 'water', zone: 'basket', part: 'the water in the basket' }, { obj: 'sandwich', zone: 'basket', part: 'the sandwich in the basket' }], solution: [['water', 'basket'], ['sandwich', 'basket']] }
      ],
      advanced: [
        { id: 'p-a1', text: 'Put both balls in the basket, but the dog must stay on the path.', skills: ['numbers', 'multi-step'], conditions: [{ match: { kind: 'ball' }, zone: 'basket', count: 2, part: 'both balls in the basket' }, { obj: 'dog', zone: 'path', part: 'the dog stays on the path' }], solution: [['ball-red', 'basket'], ['ball-blue', 'basket']] },
        { id: 'p-a2', text: 'Give the girl the hat that is not green, and put the green hat under the tree.', skills: ['colors', 'prepositions', 'multi-step'], conditions: [{ obj: 'hat-yellow', zone: 'girl', part: 'the hat that is not green for the girl' }, { obj: 'hat-green', zone: 'under-tree', part: 'the green hat under the tree' }], solution: [['hat-yellow', 'girl'], ['hat-green', 'under-tree']] },
        { id: 'p-a3', text: 'Put the animals under the tree and all the food in the basket.', skills: ['prepositions', 'multi-step'], conditions: [{ match: { group: 'animal' }, zone: 'under-tree', all: true, part: 'the animals under the tree' }, { match: { group: 'food' }, zone: 'basket', all: true, part: 'all the food in the basket' }], solution: [['dog', 'under-tree'], ['cat', 'under-tree'], ['sandwich', 'basket'], ['apple-green', 'basket']] }
      ]
    }
  },

  // ─── Магазин ─────────────────────────────────────────────────────────────
  {
    id: 'shop',
    title: L('Дүкөн', 'Магазин', 'Shop'),
    desc: L('Текчелер, себет жана кассир', 'Полки, корзина и кассир', 'Shelves, a basket and the cashier'),
    zones: [
      { id: 'box', label: 'box', art: 'box', start: true },
      { id: 'top-shelf', label: 'top shelf', art: 'shelf' },
      { id: 'bottom-shelf', label: 'bottom shelf', art: 'shelf' },
      { id: 'basket', label: 'basket', art: 'basket' },
      { id: 'counter', label: 'counter', art: 'counter' },
      { id: 'cashier', label: 'cashier', art: 'cashier' }
    ],
    objects: [
      o('bread', 'bread', 'brown', 'box', ['food']), o('milk', 'milk', 'white', 'box', ['drink']), o('juice', 'juice', 'orange', 'box', ['drink']),
      o('apple-red-1', 'apple', 'red', 'box', ['fruit', 'food']), o('apple-red-2', 'apple', 'red', 'box', ['fruit', 'food']),
      o('banana', 'banana', 'yellow', 'box', ['fruit', 'food']),
      o('car-red', 'car', 'red', 'box', ['toy']), o('car-blue', 'car', 'blue', 'box', ['toy'])
    ],
    tasks: {
      beginner: [
        { id: 's-b1', text: 'Put the bread in the basket.', skills: [], conditions: [{ obj: 'bread', zone: 'basket', part: 'the bread in the basket' }], solution: [['bread', 'basket']] },
        { id: 's-b2', text: 'Put the orange juice on the top shelf.', skills: ['colors'], conditions: [{ obj: 'juice', zone: 'top-shelf', part: 'the orange juice on the top shelf' }], solution: [['juice', 'top-shelf']] },
        { id: 's-b3', text: 'Put two apples in the basket.', skills: ['numbers'], conditions: [{ match: { kind: 'apple' }, zone: 'basket', count: 2, part: 'two apples in the basket' }], solution: [['apple-red-1', 'basket'], ['apple-red-2', 'basket']] },
        { id: 's-b4', text: 'Put the blue toy car on the counter.', skills: ['colors'], conditions: [{ obj: 'car-blue', zone: 'counter', part: 'the blue toy car on the counter' }], solution: [['car-blue', 'counter']] }
      ],
      intermediate: [
        { id: 's-i1', text: 'Put the milk on the bottom shelf and the bread on the counter.', skills: ['multi-step'], conditions: [{ obj: 'milk', zone: 'bottom-shelf', part: 'the milk on the bottom shelf' }, { obj: 'bread', zone: 'counter', part: 'the bread on the counter' }], solution: [['milk', 'bottom-shelf'], ['bread', 'counter']] },
        { id: 's-i2', text: 'Put the banana and the orange juice in the basket.', skills: ['multi-step'], conditions: [{ obj: 'banana', zone: 'basket', part: 'the banana in the basket' }, { obj: 'juice', zone: 'basket', part: 'the orange juice in the basket' }], solution: [['banana', 'basket'], ['juice', 'basket']] },
        { id: 's-i3', text: 'Put both toy cars on the top shelf.', skills: ['numbers'], conditions: [{ match: { kind: 'car' }, zone: 'top-shelf', count: 2, part: 'both toy cars on the top shelf' }], solution: [['car-red', 'top-shelf'], ['car-blue', 'top-shelf']] },
        { id: 's-i4', text: 'Give the cashier the milk and one apple.', skills: ['numbers', 'multi-step'], conditions: [{ obj: 'milk', zone: 'cashier', part: 'the milk for the cashier' }, { match: { kind: 'apple' }, zone: 'cashier', count: 1, part: 'one apple for the cashier' }], solution: [['milk', 'cashier'], ['apple-red-1', 'cashier']] }
      ],
      advanced: [
        { id: 's-a1', text: 'Put everything you can drink in the basket and everything you can eat on the counter.', skills: ['multi-step'], conditions: [{ match: { group: 'drink' }, zone: 'basket', all: true, part: 'everything you can drink in the basket' }, { match: { group: 'food' }, zone: 'counter', all: true, part: 'everything you can eat on the counter' }], solution: [['milk', 'basket'], ['juice', 'basket'], ['bread', 'counter'], ['apple-red-1', 'counter'], ['apple-red-2', 'counter'], ['banana', 'counter']] },
        { id: 's-a2', text: 'Put the red toy car on the bottom shelf, the blue one on the top shelf, and give the cashier one apple.', skills: ['colors', 'numbers', 'multi-step'], conditions: [{ obj: 'car-red', zone: 'bottom-shelf', part: 'the red toy car on the bottom shelf' }, { obj: 'car-blue', zone: 'top-shelf', part: 'the blue one on the top shelf' }, { match: { kind: 'apple' }, zone: 'cashier', count: 1, part: 'one apple for the cashier' }], solution: [['car-red', 'bottom-shelf'], ['car-blue', 'top-shelf'], ['apple-red-2', 'cashier']] },
        { id: 's-a3', text: 'Put only the yellow fruit in the basket and put all the apples back in the box.', skills: ['colors', 'multi-step'], conditions: [{ obj: 'banana', zone: 'basket', part: 'only the yellow fruit in the basket' }, { match: { kind: 'apple' }, zone: 'box', all: true, part: 'all the apples back in the box' }], solution: [['banana', 'basket'], ['apple-red-1', 'box'], ['apple-red-2', 'box']] }
      ]
    }
  }
];

export const getScene = (id) => SCENES.find((s) => s.id === id) || null;
