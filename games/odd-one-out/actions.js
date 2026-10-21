// Кнопки страницы: data-on="функция(аргументы)" вместо onclick — так работает политика безопасности (CSP).
// Аргументы: числа, строки в кавычках и this (сама кнопка).
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-on]');
  if (!el) return;
  const m = /^(\w+)\((.*)\)$/.exec(el.dataset.on);
  if (!m || typeof window[m[1]] !== 'function') return;
  const args = m[2].trim() === '' ? [] : m[2].split(/\s*,\s*/).map((raw) =>
    raw === 'this' ? el : /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw.replace(/^['"]|['"]$/g, ''));
  window[m[1]](...args);
});
