/**
 * Bilim Arena — көрүнүш эффекттери (толкундар, сандардын өсүшү, параллакс, бөлүкчөлөр).
 * Баары жөн гана кооздук: prefers-reduced-motion күйгүзүлгөндө кыймыл болбойт.
 */

const SVGNS = 'http://www.w3.org/2000/svg';
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Мезгилдүү толкун: 720 бирдикте кайталанат, ошондуктан -720 жылыш үзгүлтүксүз көрүнөт */
function wavePath(y, amp) {
  let d = `M0 ${y} Q180 ${y - amp} 360 ${y} T720 ${y}`;
  for (let x = 1080; x <= 2160; x += 360) d += ` T${x} ${y}`;
  return `${d} V140 H0Z`;
}

/**
 * Үч катмар толкун: акыркы катмар барактын түсү менен бирдей, блок фонго «агып» кетет.
 * @param {string} fill акыркы катмардын түсү
 */
export function waveBand(fill = '#F7F8FC', { height = 70, tint = '#ffffff' } = {}) {
  const box = document.createElement('div');
  box.className = 'wave-band';
  box.setAttribute('aria-hidden', 'true');
  box.style.height = `${height}px`;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 1440 140');
  svg.setAttribute('preserveAspectRatio', 'none');
  [[60, 26, tint, 0.18, 'wv1'], [80, 20, tint, 0.28, 'wv2'], [100, 16, fill, 1, 'wv3']].forEach(([y, amp, color, op, cls]) => {
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', wavePath(y, amp));
    p.setAttribute('fill', color);
    p.setAttribute('fill-opacity', String(op));
    p.setAttribute('class', cls);
    svg.append(p);
  });
  box.append(svg);
  return box;
}

/** Сан 0дөн көрүнгөнгө чейин өсөт (блок экранга киргенде) */
export function countUp(node, to, { duration = 1400, suffix = '' } = {}) {
  const set = (v) => { node.textContent = `${Math.round(v)}${suffix}`; };
  if (reducedMotion() || !('IntersectionObserver' in window)) { set(to); return; }
  set(0);
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / duration);
      set(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  io.observe(node);
}

/** Чычкан менен параллакс: блокко --mx, --my (-1…1) берет */
export function parallax(area) {
  if (reducedMotion() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let raf = 0;
  area.addEventListener('pointermove', (e) => {
    const r = area.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const my = ((e.clientY - r.top) / r.height) * 2 - 1;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      area.style.setProperty('--mx', mx.toFixed(3));
      area.style.setProperty('--my', my.toFixed(3));
    });
  });
  area.addEventListener('pointerleave', () => {
    area.style.setProperty('--mx', '0');
    area.style.setProperty('--my', '0');
  });
}

/** Карточка чычканды ээрчип бир аз кыйшаят (3D) */
export function tilt(card, max = 7) {
  if (reducedMotion() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateY(-6px)`;
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
}

/** Жылтыраган майда бөлүкчөлөр */
export function particles(host, n = 22) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    const size = 2 + Math.random() * 4;
    s.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;animation-duration:${(6 + Math.random() * 8).toFixed(1)}s;animation-delay:${(-Math.random() * 10).toFixed(1)}s`;
    frag.append(s);
  }
  host.replaceChildren(frag);
}
