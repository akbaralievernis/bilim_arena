// Focus Duel — default question sets
// You can edit/extend these arrays. The editor in the game can also create custom sets saved in localStorage.

window.FD_DEFAULT_SETS = {
  basic: [
    { "id": "b001", "type": "article", "main": "Sonnenschirm", "correct": "der", "hint": "зонтик" },
    { "id": "b002", "type": "article", "main": "Tasse", "correct": "die", "hint": "чашка" },
    { "id": "b003", "type": "article", "main": "Stühle (Pl.)", "correct": "die", "hint": "стулья" },
    { "id": "b004", "type": "article", "main": "Untertasse", "correct": "die", "hint": "блюдце" },
    { "id": "b005", "type": "article", "main": "Blumen (Pl.)", "correct": "die", "hint": "цветы" },
    { "id": "b006", "type": "article", "main": "Glas", "correct": "das", "hint": "стакан/стекло" },
    { "id": "b007", "type": "article", "main": "Aschenbecher", "correct": "der", "hint": "пепельница" },
    { "id": "b008", "type": "article", "main": "Tablett", "correct": "das", "hint": "поднос" },
    { "id": "b009", "type": "article", "main": "Spielplatz", "correct": "der", "hint": "игровая площадка" },
    { "id": "b010", "type": "article", "main": "Espressobar", "correct": "die", "hint": "эспрессо-бар" },
    { "id": "b011", "type": "article", "main": "Fußboden", "correct": "der", "hint": "пол" },
    { "id": "b012", "type": "article", "main": "Rasen", "correct": "der", "hint": "газон" },
    { "id": "b013", "type": "article", "main": "Landkarte", "correct": "die", "hint": "карта" },
    { "id": "b014", "type": "article", "main": "Hochstühle (Pl.)", "correct": "die", "hint": "детские стульчики" },
    { "id": "b015", "type": "article", "main": "Straßenschilder (Pl.)", "correct": "die", "hint": "дорожные знаки" },
    { "id": "b016", "type": "article", "main": "Gästecounter", "correct": "der", "hint": "гостевая стойка" },
    { "id": "b017", "type": "article", "main": "Sonnensegel", "correct": "das", "hint": "тент" },
    { "id": "b018", "type": "article", "main": "Grill", "correct": "der", "hint": "гриль" },
    { "id": "b019", "type": "article", "main": "Eiswürfel (Pl.)", "correct": "die", "hint": "кубики льда" },
    { "id": "b020", "type": "article", "main": "Kühlbox", "correct": "die", "hint": "холодильная сумка" },

    { "id": "b021", "type": "article", "main": "Brot", "correct": "das", "hint": "хлеб" },
    { "id": "b022", "type": "article", "main": "Butter", "correct": "die", "hint": "масло" },
    { "id": "b023", "type": "article", "main": "Käse", "correct": "der", "hint": "сыр" },
    { "id": "b024", "type": "article", "main": "Wasser", "correct": "das", "hint": "вода" },
    { "id": "b025", "type": "article", "main": "Saft", "correct": "der", "hint": "сок" },

    { "id": "b026", "type": "article", "main": "Fenster", "correct": "das", "hint": "окно" },
    { "id": "b027", "type": "article", "main": "Tür", "correct": "die", "hint": "дверь" },
    { "id": "b028", "type": "article", "main": "Tisch", "correct": "der", "hint": "стол" },
    { "id": "b029", "type": "article", "main": "Stuhl", "correct": "der", "hint": "стул" },
    { "id": "b030", "type": "article", "main": "Bett", "correct": "das", "hint": "кровать" },

    /* ... (оставь остальную твою большую базу как была) ... */

    { "id": "b157", "type": "article", "main": "Erholung", "correct": "die", "hint": "отдых" },
    { "id": "b158", "type": "article", "main": "Tourist", "correct": "der", "hint": "турист" }
  ],

  hard: [
    {
      id:"h1", type:"case",
      main:"Ich gebe ___ Mann das Buch.",
      correct:"dem",
      options:["dem","den","der"],
      hint:"Dativ • der Mann → dem Mann"
    },
    {
      id:"h2", type:"case",
      main:"Sie hilft ___ Frau.",
      correct:"der",
      options:["die","der","den"],
      hint:"Dativ • die Frau → der Frau"
    }
  ],

  expert: [
    // VERB (пример): всегда варианты, без ввода
    {
      id:"v1", type:"verb",
      main:"er ___ nach Hause (gehen)",
      correct:"geht",
      options:["geht","gehst","gehen"],
      hint:"Präsens • er → geht"
    },
    {
      id:"v2", type:"verb",
      main:"wir ___ heute (lernen)",
      correct:"lernen",
      options:["lernt","lerne","lernen"],
      hint:"wir → lernen"
    },

    // EXPERT case/article mix examples
    {
      id:"e1", type:"case",
      main:"Ich sehe ___ Hund.",
      correct:"den",
      options:["den","dem","der"],
      hint:"Akkusativ • der Hund → den Hund"
    }
  ]
};