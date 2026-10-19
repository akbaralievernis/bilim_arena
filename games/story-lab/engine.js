/**
 * Story Lab — движок ветвящейся истории (без DOM, проверяется тестами).
 *
 * История: { id, level, start, nodes: { id: { ..., choices: [{ text, quality, next, reply, why, meaning, phrases }] } },
 *            endings: { id: { good, title, text } } }
 * quality: best | ok | poor — насколько реплика подходит к ситуации.
 * next — id следующего узла или концовки. Циклов нет: каждая дорога ведёт к концовке.
 */

export const POINTS = { best: 10, ok: 5, poor: 0 };

export function createRun(story) {
  return { storyId: story.id, nodeId: story.start, history: [], score: 0, ending: null };
}

export const currentNode = (run, story) => story.nodes[run.nodeId] || null;

/** Выбор реплики: очки, запись в историю, переход */
export function choose(run, story, index) {
  const node = currentNode(run, story);
  const choice = node?.choices?.[index];
  if (!choice || run.ending) return null;
  const best = node.choices.find((c) => c.quality === 'best');
  run.score += POINTS[choice.quality] ?? 0;
  run.history.push({ nodeId: run.nodeId, index, quality: choice.quality, next: choice.next, changedPath: !!best && best.next !== choice.next });
  if (story.endings[choice.next]) run.ending = choice.next;
  else run.nodeId = choice.next;
  return { choice, ending: run.ending ? story.endings[run.ending] : null, changedPath: run.history.at(-1).changedPath };
}

export function result(run) {
  const steps = run.history.length;
  const max = steps * POINTS.best;
  const best = run.history.filter((h) => h.quality === 'best').length;
  return { steps, best, score: run.score, max, accuracy: max ? Math.round((run.score / max) * 100) : 0, ending: run.ending };
}

/** Все пути от начала до концовок (для проверки данных) */
export function allPaths(story, limit = 5000) {
  const out = [];
  const walk = (id, path, onPath) => {
    if (out.length >= limit) return;
    if (story.endings[id]) { out.push({ path, ending: id }); return; }
    const node = story.nodes[id];
    if (!node || onPath.has(id)) return; // цикл — о нём сообщит validateStory, здесь просто не идём по кругу
    const next = new Set(onPath).add(id);
    node.choices.forEach((c, i) => walk(c.next, [...path, `${id}:${i}`], next));
  };
  walk(story.start, [], new Set());
  return out;
}

/** Проверка истории: переходы, достижимость, отсутствие циклов, разнообразие концовок */
export function validateStory(story, langs = ['ky', 'ru', 'en']) {
  const errors = [];
  const ids = Object.keys(story.nodes);
  if (!story.nodes[story.start]) errors.push(`${story.id}: start node ${story.start} missing`);
  if (ids.length < 5 || ids.length > 7) errors.push(`${story.id}: ${ids.length} nodes (5–7 needed)`);
  ids.forEach((id) => {
    const n = story.nodes[id];
    if (!n.line || !n.speaker) errors.push(`${story.id}/${id}: no line or speaker`);
    if (!n.choices || n.choices.length < 2 || n.choices.length > 4) errors.push(`${story.id}/${id}: needs 2–4 choices`);
    langs.forEach((l) => { if (!n.context?.[l] || !n.lineT?.[l]) errors.push(`${story.id}/${id}: missing ${l} context/translation`); });
    (n.choices || []).forEach((c, i) => {
      if (!story.nodes[c.next] && !story.endings[c.next]) errors.push(`${story.id}/${id}:${i}: next ${c.next} does not exist`);
      if (!(c.quality in POINTS)) errors.push(`${story.id}/${id}:${i}: bad quality ${c.quality}`);
      if (!c.text || !c.reply) errors.push(`${story.id}/${id}:${i}: no text or reply`);
      langs.forEach((l) => { if (!c.why?.[l] || !c.meaning?.[l]) errors.push(`${story.id}/${id}:${i}: missing ${l} feedback`); });
    });
    if (!(n.choices || []).some((c) => c.quality === 'best')) errors.push(`${story.id}/${id}: no best choice`);
  });
  Object.entries(story.endings).forEach(([id, e]) => langs.forEach((l) => { if (!e.title?.[l] || !e.text?.[l]) errors.push(`${story.id}/ending ${id}: missing ${l}`); }));

  // Достижимость и циклы (поиск в глубину с цветами)
  const color = {};
  const reached = new Set();
  const dfs = (id) => {
    if (story.endings[id]) { reached.add(id); return; }
    if (!story.nodes[id]) return;
    if (color[id] === 1) { errors.push(`${story.id}: cycle through ${id}`); return; }
    if (color[id] === 2) return;
    color[id] = 1;
    reached.add(id);
    story.nodes[id].choices.forEach((c) => dfs(c.next));
    color[id] = 2;
  };
  dfs(story.start);
  ids.forEach((id) => { if (!reached.has(id)) errors.push(`${story.id}: node ${id} is unreachable`); });
  const endings = new Set(allPaths(story).map((p) => p.ending));
  if (endings.size < 2) errors.push(`${story.id}: fewer than 2 reachable endings`);
  Object.keys(story.endings).forEach((id) => { if (!endings.has(id)) errors.push(`${story.id}: ending ${id} is unreachable`); });
  return errors;
}
