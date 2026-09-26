/**
 * Bilim Arena — тил оюндарынын жалпы кабыгы:
 * тема, үн которгуч жана тил/категория тандоо.
 */
(function () {
  'use strict';

  // Тема (порталдагы тандоо менен бирдей ачкыч)
  function applyTheme() {
    // Платформа использует один светлый интерфейс
    const t = 'light';
    document.body.classList.toggle('light', t === 'light');
    document.body.classList.toggle('dark', t !== 'light');
    const b = document.getElementById('themeBtn');
    if (b) b.hidden = true;
  }

  // Иконки в стиле платформы (core/icons.js) — вместо эмодзи
  const SVG = (d) => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  const ICON_SOUND = SVG('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>');
  const ICON_MUTE = SVG('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>');
  const ICON_BACK = SVG('<path d="M15 5l-7 7 7 7"/>');

  function soundLabel() {
    const b = document.getElementById('soundBtn');
    if (!b) return;
    const off = localStorage.getItem('BA_SOUND') === 'off';
    b.innerHTML = off ? ICON_MUTE : ICON_SOUND;
    b.setAttribute('aria-pressed', String(!off));
  }

  /** Кнопка «назад» ведёт в каталог игр: иконка вместо стрелки-символа */
  function backButtons() {
    document.querySelectorAll('a.iconBtn[href$="games.html"]').forEach((a) => {
      a.innerHTML = ICON_BACK;
      a.setAttribute('aria-label', 'Оюндар');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    soundLabel();
    backButtons();
    const tb = document.getElementById('themeBtn');
    if (tb) tb.addEventListener('click', () => {
      const light = document.body.classList.contains('light');
      localStorage.setItem('BA_PORTAL_THEME', light ? 'dark' : 'light');
      applyTheme();
    });
    const sb = document.getElementById('soundBtn');
    if (sb) sb.addEventListener('click', () => {
      localStorage.setItem('BA_SOUND', localStorage.getItem('BA_SOUND') === 'off' ? 'on' : 'off');
      soundLabel();
    });
  });

  /**
   * Тандоо чиптерин түзөт.
   * items: [{value, label}], onChange(value)
   */
  function chipGroup(container, items, value, onChange) {
    container.innerHTML = '';
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chipBtn' + (it.value === value ? ' on' : '');
      b.textContent = it.label;
      b.addEventListener('click', () => {
        container.querySelectorAll('.chipBtn').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        onChange(it.value);
      });
      container.appendChild(b);
    });
  }

  /** Тил жуптары: кайсы тилден кайсы тилге */
  const PAIRS = [
    { value: 'ky-ru', label: 'Кыргызча → Орусча' },
    { value: 'ky-en', label: 'Кыргызча → Англисче' },
    { value: 'ru-ky', label: 'Орусча → Кыргызча' },
    { value: 'en-ky', label: 'Англисче → Кыргызча' },
    { value: 'emoji-ky', label: 'Сүрөт → Кыргызча' },
    { value: 'emoji-en', label: 'Сүрөт → Англисче' }
  ];

  function categoryItems() {
    const C = window.BA_VOCAB.CATEGORIES;
    return [{ value: 'all', label: 'Баары' }].concat(
      Object.values(C).map((c) => ({ value: c.key, label: c.title }))
    );
  }

  function remember(key, val) { try { localStorage.setItem('BA_G_' + key, val); } catch (e) { /* */ } }
  function recall(key, def) { try { return localStorage.getItem('BA_G_' + key) || def; } catch (e) { return def; } }

  /** Иконки итогового экрана (вместо эмодзи) */
  const END = {
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8.5 20h7"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23"/>'
  };
  function endIcon(name) {
    return '<svg class="end-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (END[name] || END.star) + '</svg>';
  }

  window.BAShell = { chipGroup, PAIRS, categoryItems, remember, recall, endIcon };
})();
