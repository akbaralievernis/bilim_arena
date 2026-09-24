/**
 * Bilim Arena — панель учителя.
 *
 * Главное действие — «Начать урок»: учитель выбирает предмет, тему и время,
 * а система сама собирает структуру урока и открывает режим доски.
 * Здесь же классы, журнал уроков и разбор частых ошибок.
 */

import { bootstrap, mountHeader, el, $, toast } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { SUBJECTS, TOPICS, topicsOf, getTopic, getSubject, skillTitle } from './core/curriculum.js';
import { store, KEYS } from './core/store.js';
import { SUPABASE } from './core/config.js';
import { setRole } from './core/profile.js';

const state = { subject: null, topic: null, duration: 30, classes: [], lessons: [] };

const PLAN_PREVIEW = {
  20: [['lesson_stage_warmup', 5], ['lesson_stage_practice', 8], ['lesson_stage_arena', 7]],
  30: [['lesson_stage_warmup', 5], ['lesson_stage_practice', 10], ['lesson_stage_arena', 15]],
  45: [['lesson_stage_warmup', 7], ['lesson_stage_practice', 13], ['lesson_stage_arena', 20]]
};

// ─── Настройка урока ──────────────────────────────────────────────────────────

function renderLessonSetup() {
  const lang = getLang();
  const withContent = [...new Set(TOPICS.map((x) => x.subject))];
  const subjects = SUBJECTS.filter((s) => withContent.includes(s.id));
  if (!state.subject) state.subject = subjects[0]?.id;

  $('#subjectChips').replaceChildren(...subjects.map((s) => el('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(s.id === state.subject),
    onclick: () => { state.subject = s.id; state.topic = null; renderLessonSetup(); }
  }, `${s.icon} ${pick(s.title, lang)}`)));

  const topics = topicsOf(state.subject);
  if (!state.topic) state.topic = topics[0]?.id;

  $('#topicChips').replaceChildren(...topics.map((tp) => el('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(tp.id === state.topic),
    onclick: () => { state.topic = tp.id; renderLessonSetup(); }
  }, `${t('grade', { n: tp.grade })} · ${pick(tp.title, lang)}`)));

  $('#durationChips').replaceChildren(...[20, 30, 45].map((d) => el('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(d === state.duration),
    onclick: () => { state.duration = d; renderLessonSetup(); }
  }, `${d} ${t('minutes')}`)));

  const topic = getTopic(state.topic);
  const skills = topic?.skills || [];

  $('#planBox').replaceChildren(
    el('div', { class: 'label' }, t('lesson_plan')),
    el('ol', { class: 'plan-list' }, (PLAN_PREVIEW[state.duration] || []).map(([key, min]) =>
      el('li', {}, el('b', {}, t(key)), el('span', { class: 'muted' }, ` — ${min} ${t('minutes')}`))
    )),
    el('div', { class: 'label', style: 'margin-top:12px' }, t('lesson_skills')),
    el('div', { class: 'chips' }, skills.map((sk) => el('span', { class: 'chip' }, pick(sk.title, lang))))
  );

  $('#lessonIntro').textContent = topic
    ? `${pick(getSubject(topic.subject)?.title, lang)} · ${t('grade', { n: topic.grade })} · ${pick(topic.title, lang)}`
    : '';
  $('#startHint').textContent = t('board_scan_qr');
}

function startLesson() {
  const params = new URLSearchParams({
    subject: state.subject, topic: state.topic, duration: String(state.duration)
  });
  // Сохраняем урок в журнал — потом он попадёт в «Сабактар»
  store.push(KEYS.lessons, {
    at: Date.now(), subject: state.subject, topic: state.topic, duration: state.duration
  }, 50);
  location.href = `./board.html?${params}`;
}

// ─── Классы ───────────────────────────────────────────────────────────────────

/** Облачный модуль — только если облако настроено */
const cloud = () => (SUPABASE.url ? import('./core/cloud.js') : Promise.resolve(null));
const cloudError = (e) => (/fetch|network/i.test(String(e?.message)) ? t('acc_err_network') : t('acc_err_generic'));

async function renderClasses() {
  state.classes = await store.get(KEYS.classes, []);
  const lang = getLang();

  const cards = state.classes.map((c) => el('div', { class: 'card stack' },
    el('div', { class: 'row between' },
      el('h3', { style: 'margin:0' }, `${c.cloud ? '☁️ ' : ''}${c.name}`),
      el('button', {
        class: 'btn ghost', type: 'button', 'aria-label': t('close'),
        onclick: async () => {
          if (!confirm(`${c.name}?`)) return;
          if (c.cloud) {
            try { await (await cloud()).deleteClass(c.id); } catch (e) { return toast(cloudError(e), { icon: '⚠️' }); }
          } else {
            state.classes = state.classes.filter((x) => x.id !== c.id);
            await store.set(KEYS.classes, state.classes);
          }
          renderClasses();
        }
      }, '✕')
    ),
    el('div', { class: 'muted small' }, `${t('grade', { n: c.grade })} · ${c.students.length} ${t('role_student').toLowerCase()}`),
    // Облачный класс: ученики входят сами по коду
    c.cloud ? el('div', { class: 'class-code' },
      el('span', { class: 'muted small' }, t('acc_class_code')),
      el('b', {}, c.code),
      el('span', { class: 'muted small' }, t('acc_class_code_hint'))
    ) : null,
    el('div', { class: 'players' }, (c.members || c.students.map((name) => ({ name }))).map((s) => el('span', { class: 'player-pill' },
      s.name,
      c.cloud && s.id ? el('button', {
        class: 'pill-x', type: 'button', 'aria-label': `${t('close')}: ${s.name}`,
        onclick: async () => {
          if (!confirm(`${s.name}?`)) return;
          try { await (await cloud()).removeStudent(c.id, s.id); } catch (e) { return toast(cloudError(e), { icon: '⚠️' }); }
          renderClasses();
        }
      }, '×') : null
    ))),
    el('div', { class: 'row' },
      c.cloud ? null : el('button', {
        class: 'btn', type: 'button',
        onclick: async () => {
          const name = prompt(t('profile_name'));
          if (!name) return;
          c.students.push(name.slice(0, 20));
          await store.set(KEYS.classes, state.classes);
          renderClasses();
        }
      }, `➕ ${t('role_student')}`),
      el('a', {
        class: 'btn primary',
        href: `./board.html?subject=${state.subject}&topic=${state.topic}&duration=${state.duration}&class=${c.id}`
      }, `▶️ ${t('lesson_start')}`)
    )
  ));

  $('#classList').replaceChildren(...(cards.length ? cards : [
    el('p', { class: 'muted' }, t('classes_empty'))
  ]));
  void lang;
}

async function addClass() {
  const name = prompt(t('nav_classes'), '6-А');
  if (!name) return;
  const grade = Math.min(11, Math.max(1, Number(prompt(t('lesson_grade'), '6')) || 6));

  // Учитель вошёл в облако — класс создаётся там и получает код для учеников
  const c = await cloud();
  if (c && c.cloudStatus().role === 'teacher') {
    try {
      await c.createClass({ name, grade });
      toast(t('save'), { icon: '✅' });
    } catch (e) {
      toast(cloudError(e), { icon: '⚠️' });
    }
    return renderClasses();
  }

  state.classes.push({ id: `c_${Date.now()}`, name: name.slice(0, 20), grade, students: [] });
  await store.set(KEYS.classes, state.classes);
  toast(t('save'), { icon: '✅' });
  renderClasses();
}

// ─── Результаты и частые ошибки ───────────────────────────────────────────────

async function renderResults() {
  const lang = getLang();
  const errors = await store.get(KEYS.errors, []);
  const history = await store.get(KEYS.history, []);
  const lessons = await store.get(KEYS.lessons, []);

  const answered = history.reduce((s, h) => s + (h.total || 0), 0);
  const correct = history.reduce((s, h) => s + (h.correct || 0), 0);
  const avg = answered ? Math.round((correct / answered) * 100) : 0;

  $('#resultStats').replaceChildren(
    stat(lessons.length, t('nav_lessons')),
    stat(history.length, t('nav_games')),
    stat(`${avg}%`, t('analytics_class_average')),
    stat(errors.length, t('results_wrong'))
  );

  // Частые ошибки по навыкам — именно это нужно учителю для повторения
  const counts = {};
  errors.forEach((e) => {
    const key = `${e.topic}::${e.skill}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  $('#mistakeList').replaceChildren(...(top.length ? top.map(([key, n]) => {
    const [topicId, skillId] = key.split('::');
    const topic = getTopic(topicId);
    return el('div', { class: 'row between lead-row', style: 'padding:.5em 0;border-bottom:1px solid var(--line)' },
      el('span', {}, `⚠️ ${skillTitle(topicId, skillId, lang)}`),
      el('span', { class: 'muted small' }, topic ? pick(topic.title, lang) : ''),
      el('b', {}, `${n}`)
    );
  }) : [el('p', { class: 'muted' }, t('results_nothing_wrong'))]));

  // Кнопка «Создать игру по ошибкам» — запускает урок по самой слабой теме
  $('#reviewGameBtn').disabled = top.length === 0;
  $('#reviewGameBtn').onclick = () => {
    const [key] = top[0];
    const [topicId] = key.split('::');
    const topic = getTopic(topicId);
    if (!topic) return;
    location.href = `./board.html?subject=${topic.subject}&topic=${topicId}&duration=20&mode=review`;
  };

  $('#lessonHistory').replaceChildren(...(lessons.length
    ? lessons.slice(-6).reverse().map((l) => {
      const topic = getTopic(l.topic);
      return el('div', { class: 'row between', style: 'padding:.4em 0' },
        el('span', {}, topic ? `${getSubject(topic.subject)?.icon || ''} ${pick(topic.title, lang)}` : l.topic),
        el('span', { class: 'muted small' }, new Date(l.at).toLocaleDateString())
      );
    })
    : [el('p', { class: 'muted' }, t('empty_none'))]));
}

const stat = (value, label) => el('div', { class: 'stat' }, el('b', {}, String(value)), el('span', {}, label));

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  await setRole('teacher');
  mountHeader($('#header'), { role: 'teacher', active: 'teacher.html' });

  renderLessonSetup();
  await renderClasses();
  await renderResults();
  window.addEventListener('ba:synced', () => { renderClasses(); renderResults(); });

  $('#startBtn').addEventListener('click', startLesson);
  $('#addClassBtn').addEventListener('click', addClass);
})();
