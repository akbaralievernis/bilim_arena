/**
 * Bilim Arena — живость интерфейса.
 *
 *  • разделы и карточки мягко появляются, когда до них доходит прокрутка
 *    (в сетках — по очереди);
 *  • шапка при прокрутке получает тень и «стекло»;
 *  • полосы прогресса заполняются, когда их видно.
 *
 * Без JS, при «уменьшить движение» и в браузерах без IntersectionObserver
 * ничего не прячется — всё видно сразу. Содержимое, которое уже на экране при
 * загрузке, не мигает: анимируется только то, что ниже первого экрана.
 */

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Что оживляем: разделы страницы и карточки в сетках
const TARGETS = [
  'main > section', 'main .wrap > section',
  '.game-grid > *', '.cat-grid > *', '.stat-grid > *', '.grid.auto > *', '.badge-grid > *'
].join(', ');

let observer = null;

function watch(root = document) {
  if (!observer) return;
  const fold = window.innerHeight * 0.92;
  root.querySelectorAll(TARGETS).forEach((node) => {
    if (node.dataset.fx || node.classList.contains('hidden')) return;
    node.dataset.fx = '1';
    // Уже на первом экране — показываем сразу, без анимации
    if (node.getBoundingClientRect().top < fold) return;
    const siblings = node.parentElement ? [...node.parentElement.children] : [];
    node.style.setProperty('--fx-i', String(Math.min(6, Math.max(0, siblings.indexOf(node)) % 4)));
    node.classList.add('fx-wait');
    observer.observe(node);
  });
}

function watchBars(root = document) {
  if (!observer) return;
  root.querySelectorAll('.bar:not([data-fx])').forEach((bar) => {
    const fill = bar.querySelector(':scope > i');
    if (!fill || bar.getBoundingClientRect().top < window.innerHeight) { bar.dataset.fx = '1'; return; }
    bar.dataset.fx = '1';
    bar.classList.add('fx-bar');
    bar.dataset.fxWidth = fill.style.width;
    fill.style.width = '0%';
    observer.observe(bar);
  });
}

function revealAll() {
  document.querySelectorAll('.fx-wait').forEach((n) => { n.classList.remove('fx-wait'); observer?.unobserve(n); });
}

export function startFx() {
  // Шапка: тень и «стекло», когда страница прокручена
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      document.querySelector('.topbar')?.classList.toggle('scrolled', window.scrollY > 8);
      // Страховка: дошли до самого низа — показать всё, что ещё ждёт
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) revealAll();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (reduced() || !('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const node = e.target;
      observer.unobserve(node);
      if (node.classList.contains('fx-bar')) {
        const fill = node.querySelector(':scope > i');
        // Если страница сама уже поменяла ширину — её значение главнее
        requestAnimationFrame(() => { if (fill && fill.style.width === '0%') fill.style.width = node.dataset.fxWidth || '0%'; });
        return;
      }
      node.classList.add('fx-show');
      node.classList.remove('fx-wait');
      // После анимации — убрать служебные классы (не мешать hover-эффектам)
      setTimeout(() => node.classList.remove('fx-show'), 1200);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  watch();
  watchBars();
  // Страницы дорисовывают разделы позже (данные, облако) — следим за новыми
  const mo = new MutationObserver((records) => {
    if (records.some((r) => r.addedNodes.length)) { watch(); watchBars(); }
  });
  mo.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
}
