// editor.js — teacher test storage + parser (backward compatible)
(function(){
  // New language-agnostic keys
  const LS_KEY_V2 = "BA_ODD_ONE_OUT_TESTS_V2";
  const ACTIVE_KEY_V2 = "BA_ODD_ONE_OUT_ACTIVE_V2";

  // Legacy keys (RU V1)
  const LEGACY_LS_KEY = "BA_ODD_ONE_OUT_TESTS_RU_V1";
  const LEGACY_ACTIVE_KEY = "BA_ODD_ONE_OUT_ACTIVE_RU_V1";

  function safeJsonParse(str){
    try { return JSON.parse(str); } catch { return null; }
  }

  function migrateOnce(){
    // If V2 already exists -> do nothing
    const hasV2 = !!localStorage.getItem(LS_KEY_V2);
    if (hasV2) return;

    const legacyRaw = localStorage.getItem(LEGACY_LS_KEY);
    const legacyParsed = legacyRaw ? safeJsonParse(legacyRaw) : null;
    if (legacyParsed && Array.isArray(legacyParsed.tests)){
      localStorage.setItem(LS_KEY_V2, JSON.stringify({ tests: legacyParsed.tests }));
    }

    const legacyActiveRaw = localStorage.getItem(LEGACY_ACTIVE_KEY);
    const legacyActive = legacyActiveRaw ? safeJsonParse(legacyActiveRaw) : null;
    if (legacyActive && typeof legacyActive === "object"){
      localStorage.setItem(ACTIVE_KEY_V2, JSON.stringify(legacyActive));
    }
  }

  function getSaved(){
    migrateOnce();
    const raw = localStorage.getItem(LS_KEY_V2);
    const parsed = raw ? safeJsonParse(raw) : null;
    if (!parsed || typeof parsed !== "object") return [];
    if (!Array.isArray(parsed.tests)) return [];
    return parsed.tests;
  }

  function setSaved(tests){
    migrateOnce();
    localStorage.setItem(LS_KEY_V2, JSON.stringify({ tests }));
  }

  function cryptoId(){
    if (window.crypto && crypto.getRandomValues){
      const a = new Uint32Array(2);
      crypto.getRandomValues(a);
      return "t_" + a[0].toString(16) + a[1].toString(16);
    }
    return "t_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  // Format (per block):
  // - Empty line separates blocks
  // - One item must contain '*'
  // - Optional meta lines:
  //   # topic: Animals
  //   # explain: Because ...
  //   @topic: Animals
  //   @explain: Because ...
  function parseTeacherText(title, type, text){
    const normalized = (text || "").replace(/\r/g, "").trim();
    if (!normalized) return { ok:false, error:"Текст пустой. Добавьте наборы." };

    const blocks = normalized.split(/\n\s*\n/g).map(b => b.trim()).filter(Boolean);
    const sets = [];

    for (const block of blocks){
      const rawLines = block.split("\n").map(l => l.trim()).filter(l => l.length > 0);

      let topic = "";
      let explain = "";
      const lines = [];

      for (const l of rawLines){
        const low = l.toLowerCase();
        const isHash = l.startsWith("#");
        const isAt = l.startsWith("@");

        const topicMatch = (isHash || isAt) && low.match(/(?:#|@)\s*topic\s*:\s*(.+)$/i);
        const explainMatch = (isHash || isAt) && low.match(/(?:#|@)\s*explain\s*:\s*(.+)$/i);
        if (topicMatch){ topic = l.replace(/^(?:#|@)\s*topic\s*:\s*/i, "").trim(); continue; }
        if (explainMatch){ explain = l.replace(/^(?:#|@)\s*explain\s*:\s*/i, "").trim(); continue; }

        // regular comments are ignored
        if (isHash) continue;
        lines.push(l);
      }

      if (lines.length < 4){
        return { ok:false, error:"В каждом наборе минимум 4 элемента." };
      }

      let oddIndex = -1;
      const items = lines.map((line, idx) => {
        if (line.includes("*")){
          if (oddIndex !== -1) oddIndex = -2;
          else oddIndex = idx;
          return line.replace(/\*/g, "").trim();
        }
        return line;
      });

      if (oddIndex === -2) return { ok:false, error:"В наборе должен быть только один символ '*' ." };
      if (oddIndex < 0) return { ok:false, error:"В каждом наборе отметьте один лишний элемент звездочкой '*' ." };

      sets.push({ id: cryptoId(), title: title || "Тест", type, topic, explain, items, oddIndex });
    }

    return { ok:true, sets };
  }

  function setActiveFlat(pkg){
    migrateOnce();
    localStorage.setItem(ACTIVE_KEY_V2, JSON.stringify(pkg));
  }
  function getActiveFlat(){
    migrateOnce();
    const raw = localStorage.getItem(ACTIVE_KEY_V2);
    const parsed = raw ? safeJsonParse(raw) : null;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  }

  window.EditorStore = {
    LS_KEY: LS_KEY_V2,
    ACTIVE_KEY: ACTIVE_KEY_V2,
    LEGACY_LS_KEY,
    LEGACY_ACTIVE_KEY,
    safeJsonParse,
    getSaved,
    setSaved,
    parseTeacherText,
    setActiveFlat,
    getActiveFlat
  };
})();
