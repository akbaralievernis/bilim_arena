/**
 * Список расследований платформы.
 *
 * Новое дело добавляется одной строкой — игровой движок менять не нужно.
 */
export const CASES = [
  {
    id: 'case-001-museum',
    number: '001',
    subject: 'kg-history',
    grade: 8,
    topic: 'kg-history-8-independence',
    duration: 30,
    title: {
      ky: 'Музейдин жоголгон экспонаты',
      ru: 'Пропавший экспонат музея',
      en: 'The missing museum exhibit'
    },
    load: () => import('./case-001-museum.js')
  }
];

export const getCaseMeta = (id) => CASES.find((c) => c.id === id) || null;

/** Загружает данные дела по требованию */
export async function loadCase(id) {
  const meta = getCaseMeta(id) || CASES[0];
  if (!meta) return null;
  const mod = await meta.load();
  return mod.default;
}

/** Дела, подходящие к предмету и классу (для подсказки учителю) */
export const casesFor = ({ subject, grade, topic } = {}) => CASES.filter((c) =>
  (!subject || c.subject === subject) &&
  (!grade || c.grade === grade) &&
  (!topic || c.topic === topic));
