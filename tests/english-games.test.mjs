// Три игры по английскому: логика без браузера.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const ec = await import('../games/english-city/engine.js');
const { SCENES, getScene } = await import('../games/english-city/data.js');
const sl = await import('../games/story-lab/engine.js');
const { STORIES, getStory } = await import('../games/story-lab/stories.js');
const pd = await import('../games/picture-detective/engine.js');
const { TASKS, getTask } = await import('../games/picture-detective/tasks.js');
const { SCENES: PICTURES } = await import('../games/picture-detective/scenes.js');

// ─── English City ────────────────────────────────────────────────────────────

test('English City: every scene, task and model solution is consistent', () => {
  assert.equal(SCENES.length, 4);
  for (const s of SCENES) assert.deepEqual(ec.validateScene(s), [], s.id);
});

test('English City: a one-step task is checked by the final state of the scene', () => {
  const scene = getScene('classroom');
  const m = ec.createMission(scene, 'beginner');
  ec.beginTask(m);
  assert.equal(ec.checkTask(m.objects, ec.currentTask(m)).ok, false);
  assert.ok(ec.moveObject(m, 'book-red', 'desk', scene));
  const r = ec.submit(m);
  assert.equal(r.ok, true);
  assert.equal(m.results[0].firstTry, true);
  assert.equal(m.index, 1, 'the next task opens');
});

test('English City: wrong action → the unfinished part is named, the answer is not; retry works', () => {
  const scene = getScene('kitchen');
  const m = ec.createMission(scene, 'intermediate');
  ec.beginTask(m); // Move the green cup next to the plate.
  ec.moveObject(m, 'cup-green', 'table', scene);
  const wrong = ec.submit(m);
  assert.equal(wrong.ok, false);
  assert.deepEqual(wrong.missing, ['the green cup next to the plate']);
  ec.resetTask(m);
  assert.equal(m.objects.find((o) => o.id === 'cup-green').zone, 'counter', 'reset returns the start of the task');
  ec.moveObject(m, 'cup-green', 'next-plate', scene);
  const right = ec.submit(m);
  assert.equal(right.ok, true);
  assert.equal(m.results[0].firstTry, false);
  assert.equal(m.results[0].attempts, 2);
});

test('English City: counts and "all except" conditions, fixed zones, hints, skip and score', () => {
  const objects = [
    { id: 'a1', kind: 'apple', color: 'red', groups: ['fruit'], zone: 'basket' },
    { id: 'a2', kind: 'apple', color: 'red', groups: ['fruit'], zone: 'basket' },
    { id: 'a3', kind: 'apple', color: 'red', groups: ['fruit'], zone: 'basket' },
    { id: 'b', kind: 'banana', color: 'yellow', groups: ['fruit'], zone: 'table' }
  ];
  assert.equal(ec.conditionMet(objects, { match: { kind: 'apple' }, zone: 'basket', count: 2 }), false, '"two apples" means exactly two');
  assert.equal(ec.conditionMet(objects, { match: { group: 'fruit', notColor: 'red' }, zone: 'table', all: true }), true);
  assert.equal(ec.conditionMet(objects, { match: { group: 'fruit' }, zone: 'basket', all: true }), false);

  const scene = getScene('park');
  assert.equal(ec.moveObject(ec.createMission(scene, 'beginner'), 'dog', 'nowhere', scene), false, 'unknown place is refused');
  const m = ec.createMission(scene, 'advanced');
  ec.beginTask(m);
  const hinted = ec.hintObjects(m);
  assert.ok(hinted.includes('ball-red') && hinted.includes('ball-blue') && hinted.includes('dog'));
  ec.moveObject(m, 'ball-red', 'basket', scene);
  ec.moveObject(m, 'ball-blue', 'basket', scene);
  assert.equal(ec.submit(m).ok, true);
  assert.equal(m.results[0].firstTry, false, 'a hint means not first try');
  ec.beginTask(m);
  ec.skip(m);
  const s = ec.summary(m);
  assert.equal(s.total, 2);
  assert.equal(s.solved, 1);
  assert.equal(s.score, 60, 'hinted solve 60 + skip 0');
});

// ─── Story Lab ───────────────────────────────────────────────────────────────

test('Story Lab: all stories load, links are valid, no cycles, every path reaches an ending', () => {
  assert.equal(STORIES.length, 3);
  for (const s of STORIES) {
    assert.deepEqual(sl.validateStory(s), [], s.id);
    const paths = sl.allPaths(s);
    assert.ok(paths.length > 0);
    paths.forEach((p) => assert.ok(s.endings[p.ending], `${s.id}: ${p.path.join(' > ')}`));
    assert.ok(new Set(paths.map((p) => p.ending)).size >= 2, `${s.id}: at least two endings`);
    assert.deepEqual(new Set(STORIES.map((x) => x.level)), new Set(['beginner', 'intermediate', 'advanced']));
  }
});

test('Story Lab: different answers really change the story; restart resets; no double play after the end', () => {
  const story = getStory('first-day');
  const a = sl.createRun(story);
  const b = sl.createRun(story);
  sl.choose(a, story, 0); // дружелюбно
  const res = sl.choose(b, story, 2); // грубо
  assert.notEqual(a.nodeId, b.nodeId, 'a rude answer leads to another scene');
  assert.equal(res.changedPath, true);

  // Лучшие ответы → хорошая концовка; грубые → плохая
  const play = (pickIndex) => {
    const run = sl.createRun(story);
    while (!run.ending) {
      const node = sl.currentNode(run, story);
      sl.choose(run, story, pickIndex(node));
    }
    return run;
  };
  const good = play((n) => n.choices.findIndex((c) => c.quality === 'best'));
  const bad = play((n) => { const i = n.choices.findIndex((c) => c.quality === 'poor'); return i >= 0 ? i : 0; });
  assert.equal(story.endings[good.ending].good, true);
  assert.equal(story.endings[bad.ending].good, false);
  assert.equal(sl.result(good).accuracy, 100);
  assert.ok(sl.result(bad).accuracy < 50);
  assert.equal(sl.choose(good, story, 0), null, 'nothing can be chosen after the ending');

  const again = sl.createRun(story);
  assert.deepEqual([again.nodeId, again.history.length, again.score, again.ending], [story.start, 0, 0, null]);
});

test('Story Lab: a broken story is caught by the validator', () => {
  const broken = { id: 'x', start: 'a', nodes: { a: { speaker: 'A', line: 'Hi', context: {}, lineT: {}, choices: [{ text: 'Hi', quality: 'best', next: 'a', reply: 'Hi', why: {}, meaning: {} }, { text: 'Go', quality: 'poor', next: 'nope', reply: '?', why: {}, meaning: {} }] } }, endings: {} };
  const errors = sl.validateStory(broken, []);
  assert.ok(errors.some((e) => e.includes('cycle')));
  assert.ok(errors.some((e) => e.includes('nope')));
});

// ─── Picture Detective ───────────────────────────────────────────────────────

test('Picture Detective: 12 tasks, each with a picture and a rubric that accepts its model answer', () => {
  assert.equal(TASKS.length, 12);
  for (const t of TASKS) {
    assert.ok(PICTURES[t.scene], `${t.id}: picture`);
    assert.deepEqual(pd.validateTask(t), [], t.id);
  }
});

test('Picture Detective: different correct wordings score the same; colour adds precision', () => {
  const t = getTask('classroom');
  const a = pd.evaluate(t, 'The blue bag is under the table. The boy is reading a book.');
  const b = pd.evaluate(t, 'A backpack lies beneath the desk. A student reads.');
  assert.equal(a.score, 100);
  assert.equal(b.score, 100);
  assert.ok(a.precision.includes('blue'));
  assert.ok(!b.precision.includes('blue'));
});

test('Picture Detective: missing details are reported; case, spaces and punctuation do not matter', () => {
  const t = getTask('classroom');
  const r = pd.evaluate(t, '   THE BAG ,is   UNDER the TABLE!!   ');
  assert.deepEqual(r.found, ['bag-place']);
  assert.deepEqual(r.missed, ['boy-reading']);
  assert.equal(r.tooShort, true);
  // Слова должны быть в одном предложении: «сумка» и «под» в разных — не засчитано
  const split = pd.evaluate(t, 'There is a bag. The book is under the table.');
  assert.ok(!split.found.includes('bag-place'));
  assert.equal(pd.evaluate(t, '').score, 0);
});

test('Picture Detective: prepared grammar hints and the retry summary', () => {
  assert.deepEqual(pd.grammarHints(pd.sentences('the boy reading a apple')).sort(), ['a-an', 'be-ing', 'capital', 'period'].sort());
  assert.deepEqual(pd.grammarHints(pd.sentences('The boy is reading.')), []);
  const s = pd.summary([
    { taskId: 'a', first: { score: 40 }, retry: { score: 90 } },
    { taskId: 'b', first: { score: 100 }, retry: null }
  ]);
  assert.deepEqual(s, { tasks: 2, average: 95, passed: 2, improved: 1 });
});
