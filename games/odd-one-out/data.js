// data.js — default question bank (supports topic + explanation)
(function(){
  window.ODD_DB = {
    version: 4,
    text: [
      {
        topic: "animals",
        title: { ky:"Жаныбарлар", ru:"Животные", en:"Animals" },
        items:["собака","кошка","корова","стол"],
        oddIndex:3,
        explain:{
          ky:"Үчөө жаныбар, ал эми «стол» — буюм.",
          ru:"Три слова — животные, а «стол» — предмет.",
          en:"Three are animals, but “table” is an object."
        }
      },
      {
        topic: "transport",
        title: { ky:"Транспорт", ru:"Транспорт", en:"Transport" },
        items:["машина","автобус","велосипед","яблоко"],
        oddIndex:3,
        explain:{
          ky:"Үчөө унаа, «яблоко» — жемиш.",
          ru:"Три слова — транспорт, «яблоко» — фрукт.",
          en:"Three are vehicles, “apple” is a fruit."
        }
      },
      {
        topic: "school",
        title: { ky:"Мектеп", ru:"Школа", en:"School" },
        items:["тетрадь","ручка","доска","гитара"],
        oddIndex:3,
        explain:{
          ky:"Үчөө мектепке тиешелүү, «гитара» — музыкалык аспап.",
          ru:"Три слова относятся к школе, «гитара» — музыкальный инструмент.",
          en:"Three are school items, “guitar” is a musical instrument."
        }
      },
      {
        topic: "colors",
        title: { ky:"Түстөр", ru:"Цвета", en:"Colors" },
        items:["красный","синий","зелёный","книга"],
        oddIndex:3,
        explain:{
          ky:"Үчөө түс, «книга» — предмет.",
          ru:"Три слова — цвета, «книга» — предмет.",
          en:"Three are colors, “book” is an object."
        }
      },
      {
        topic: "shapes",
        title: { ky:"Фигуралар", ru:"Фигуры", en:"Shapes" },
        items:["треугольник","круг","квадрат","банан"],
        oddIndex:3,
        explain:{
          ky:"Үчөө геометриялык фигура, «банан» — жемиш.",
          ru:"Три слова — геометрические фигуры, «банан» — фрукт.",
          en:"Three are shapes, “banana” is a fruit."
        }
      },
      {
        topic: "fruits",
        title: { ky:"Жемиштер", ru:"Фрукты", en:"Fruits" },
        items:["яблоко","банан","груша","кресло"],
        oddIndex:3,
        explain:{
          ky:"Үчөө жемиш, «кресло» — эмерек.",
          ru:"Три слова — фрукты, «кресло» — мебель.",
          en:"Three are fruits, “armchair” is furniture."
        }
      },
      {
        topic: "jobs",
        title: { ky:"Кесиптер", ru:"Профессии", en:"Jobs" },
        items:["учитель","врач","водитель","рыба"],
        oddIndex:3,
        explain:{
          ky:"Үчөө кесип, «рыба» — жаныбар.",
          ru:"Три слова — профессии, «рыба» — животное.",
          en:"Three are professions, “fish” is an animal."
        }
      },
      {
        topic: "nature",
        title: { ky:"Табият", ru:"Природа", en:"Nature" },
        items:["гора","озеро","море","клавиатура"],
        oddIndex:3,
        explain:{
          ky:"Үчөө табият объекти, «клавиатура» — техника.",
          ru:"Три слова — объекты природы, «клавиатура» — техника.",
          en:"Three are nature objects, “keyboard” is a device."
        }
      }
    ],
    image: [
      {
        topic: "images",
        title: { ky:"Сүрөт мисалы", ru:"Пример картинок", en:"Image sample" },
        items:[
          "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=60",
          "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=60",
          "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=60",
          "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=60"
        ],
        oddIndex: 3,
        explain:{
          ky:"Үчөө окшош сүрөт, акыркысы башка.",
          ru:"Три картинки одинаковые, последняя другая.",
          en:"Three images match, the last one is different."
        }
      }
    ]
  };
})();
