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

  function soundLabel() {
    const b = document.getElementById('soundBtn');
    if (b) b.textContent = localStorage.getItem('BA_SOUND') === 'off' ? '🔇' : '🔊';
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    soundLabel();
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
    { value: 'ky-ru', label: '🇰🇬 → 🇷🇺 Кыргызча → Орусча' },
    { value: 'ky-en', label: '🇰🇬 → 🇬🇧 Кыргызча → Англисче' },
    { value: 'ru-ky', label: '🇷🇺 → 🇰🇬 Орусча → Кыргызча' },
    { value: 'en-ky', label: '🇬🇧 → 🇰🇬 Англисче → Кыргызча' },
    { value: 'emoji-ky', label: '🖼️ → 🇰🇬 Сүрөт → Кыргызча' },
    { value: 'emoji-en', label: '🖼️ → 🇬🇧 Сүрөт → Англисче' }
  ];

  function categoryItems() {
    const C = window.BA_VOCAB.CATEGORIES;
    return [{ value: 'all', label: '🌈 Баары' }].concat(
      Object.values(C).map((c) => ({ value: c.key, label: `${c.icon} ${c.title}` }))
    );
  }

  function remember(key, val) { try { localStorage.setItem('BA_G_' + key, val); } catch (e) { /* */ } }
  function recall(key, def) { try { return localStorage.getItem('BA_G_' + key) || def; } catch (e) { return def; } }

  window.BAShell = { chipGroup, PAIRS, categoryItems, remember, recall };
})();
