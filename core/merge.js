/** Bilim Arena — объединение списков при синхронизации с облаком (core/cloud.js). */

/**
 * Объединение журналов без дублей, по времени, не длиннее 500 записей.
 * Запись с id (урок, вопрос) — одна, берётся более свежая версия:
 * урок на доске дописывается после каждого этапа, вопрос можно изменить.
 */
const freshness = (x) => Math.max(x?.updatedAt || 0, x?.endedAt || 0, x?.at || 0, x?.createdAt || 0);
export function mergeLog(a, b) {
  const byId = new Map();
  const seen = new Set();
  const out = [];
  for (const item of [...a, ...b]) {
    if (item && typeof item === 'object' && item.id) {
      const prev = byId.get(item.id);
      if (!prev) { byId.set(item.id, item); out.push(item); } else if (freshness(item) > freshness(prev)) {
        out[out.indexOf(prev)] = item;
        byId.set(item.id, item);
      }
      continue;
    }
    const key = JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  out.sort((x, y) => (x?.at || x?.createdAt || 0) - (y?.at || y?.createdAt || 0));
  return out.slice(-500);
}
