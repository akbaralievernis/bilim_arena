/**
 * English City — логика миссии (без DOM, проверяется тестами).
 *
 * Сцена: места (zones) и предметы (objects) с положением zone.
 * Задание: английская инструкция и условия на КОНЕЧНОЕ состояние сцены.
 * Условия:
 *   { obj, zone }                     — этот предмет в этом месте
 *   { match, zone, count }            — ровно count подходящих предметов в месте
 *   { match, zone, all: true }        — все подходящие предметы в месте
 *   match: { kind?, group?, color?, notColor? }
 * Каждое условие несёт part — кусок английской инструкции, который
 * показываем, если он ещё не выполнен (правильное действие не раскрываем).
 */

export const LEVELS = ['beginner', 'intermediate', 'advanced'];

/** Новая миссия: копия начальной раскладки сцены и задания нужного уровня */
export function createMission(scene, level) {
  const tasks = scene.tasks[level] || [];
  return {
    sceneId: scene.id,
    level,
    objects: scene.objects.map((o) => ({ ...o })),
    tasks,
    index: 0,
    attempts: 0,
    snapshot: null,
    results: [] // { taskId, firstTry, attempts, solved, skipped, hinted, skills }
  };
}

export const currentTask = (m) => m.tasks[m.index] || null;
export const isFinished = (m) => m.index >= m.tasks.length;

/** Запомнить раскладку в начале задания — «Сбросить» вернёт её */
export function beginTask(m) {
  m.attempts = 0;
  m.hinted = false;
  m.snapshot = m.objects.map((o) => ({ id: o.id, zone: o.zone }));
  return currentTask(m);
}

export function resetTask(m) {
  if (!m.snapshot) return;
  const byId = new Map(m.snapshot.map((s) => [s.id, s.zone]));
  m.objects.forEach((o) => { o.zone = byId.get(o.id) ?? o.zone; });
}

/** Переместить предмет; неподвижные (fixed) и несуществующие места не трогаем */
export function moveObject(m, objId, zoneId, scene) {
  const obj = m.objects.find((o) => o.id === objId);
  if (!obj || obj.fixed) return false;
  if (!scene.zones.some((z) => z.id === zoneId)) return false;
  obj.zone = zoneId;
  return true;
}

const fits = (o, match = {}) => (!match.kind || o.kind === match.kind)
  && (!match.group || (o.groups || []).includes(match.group))
  && (!match.color || o.color === match.color)
  && (!match.notColor || o.color !== match.notColor);

/** Выполнено ли одно условие на текущей сцене */
export function conditionMet(objects, c) {
  if (c.obj) return objects.some((o) => o.id === c.obj && o.zone === c.zone);
  const matching = objects.filter((o) => fits(o, c.match));
  const inZone = matching.filter((o) => o.zone === c.zone);
  if (c.all) return matching.length > 0 && inZone.length === matching.length;
  return inZone.length === c.count;
}

/** Проверка задания: какие части инструкции ещё не выполнены */
export function checkTask(objects, task) {
  const missing = task.conditions.filter((c) => !conditionMet(objects, c)).map((c) => c.part);
  return { ok: missing.length === 0, missing };
}

/** Ответ «Готово»: проверка, учёт попыток, переход к следующему заданию при успехе */
export function submit(m) {
  const task = currentTask(m);
  if (!task) return { ok: false, missing: [], done: true };
  m.attempts += 1;
  const res = checkTask(m.objects, task);
  if (res.ok) {
    m.results.push({ taskId: task.id, firstTry: m.attempts === 1 && !m.hinted, attempts: m.attempts, solved: true, skipped: false, hinted: !!m.hinted, skills: task.skills });
    m.index += 1;
  }
  return { ...res, attempts: m.attempts };
}

/** Пропустить задание (после нескольких неудачных попыток) — засчитывается как нерешённое */
export function skip(m) {
  const task = currentTask(m);
  if (!task) return;
  m.results.push({ taskId: task.id, firstTry: false, attempts: m.attempts, solved: false, skipped: true, hinted: !!m.hinted, skills: task.skills });
  m.index += 1;
}

/** Подсказка: какие предметы участвуют (места не раскрываем) */
export function hintObjects(m) {
  const task = currentTask(m);
  if (!task) return [];
  m.hinted = true;
  const ids = new Set();
  task.conditions.forEach((c) => {
    if (c.obj) ids.add(c.obj);
    else m.objects.filter((o) => fits(o, c.match)).forEach((o) => ids.add(o.id));
  });
  return [...ids];
}

/**
 * Итог миссии. Очки: 100 — с первой попытки, 60 — со 2–3-й или после подсказки, 30 — позже, 0 — пропуск.
 * Навыки: точность по тегам (colors, numbers, prepositions, multi-step, listening).
 */
export function summary(m) {
  const points = (r) => (!r.solved ? 0 : r.firstTry ? 100 : r.attempts <= 3 ? 60 : 30);
  const total = m.results.length;
  const solved = m.results.filter((r) => r.solved).length;
  const firstTry = m.results.filter((r) => r.firstTry).length;
  const skills = {};
  m.results.forEach((r) => (r.skills || []).forEach((s) => {
    const acc = skills[s] || (skills[s] = { ok: 0, total: 0 });
    acc.total += 1;
    if (r.firstTry) acc.ok += 1;
  }));
  return {
    total, solved, firstTry,
    accuracy: total ? Math.round((firstTry / total) * 100) : 0,
    score: m.results.reduce((s, r) => s + points(r), 0),
    skills
  };
}

/** Проверка данных сцены (тесты): места и предметы существуют, решения приводят к цели */
export function validateScene(scene) {
  const errors = [];
  const zones = new Set(scene.zones.map((z) => z.id));
  const ids = new Set();
  scene.objects.forEach((o) => {
    if (ids.has(o.id)) errors.push(`${scene.id}: duplicate object ${o.id}`);
    ids.add(o.id);
    if (!zones.has(o.zone)) errors.push(`${scene.id}: ${o.id} starts in unknown zone ${o.zone}`);
  });
  for (const level of LEVELS) {
    const m = createMission(scene, level);
    if (!m.tasks.length) errors.push(`${scene.id}: no ${level} tasks`);
    m.tasks.forEach((task) => {
      beginTask(m);
      task.conditions.forEach((c) => {
        if (!zones.has(c.zone)) errors.push(`${scene.id}/${task.id}: unknown zone ${c.zone}`);
        if (c.obj && !ids.has(c.obj)) errors.push(`${scene.id}/${task.id}: unknown object ${c.obj}`);
        if (!c.part) errors.push(`${scene.id}/${task.id}: condition without part`);
      });
      if (checkTask(m.objects, task).ok) errors.push(`${scene.id}/${task.id}: already solved before any move`);
      (task.solution || []).forEach(([obj, zone]) => { if (!moveObject(m, obj, zone, scene)) errors.push(`${scene.id}/${task.id}: bad solution move ${obj}→${zone}`); });
      const res = submit(m);
      if (!res.ok) errors.push(`${scene.id}/${task.id}: solution does not solve it (missing: ${res.missing.join('; ')})`);
    });
  }
  return errors;
}
