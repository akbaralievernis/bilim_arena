/**
 * Bilim Arena — язык отдельных игр (games/*, web/*).
 *
 * Язык берётся тот же, что выбран на сайте (localStorage BA2_lang).
 * Исходный текст игр — кыргызский. Каждая игра подключает свой словарь:
 *
 *   BALang.add({ 'Кыргызча сап': ['Русская строка', 'English line'] });
 *
 * Ключ — кыргызская строка как она написана в игре. Ключ с {n} работает как
 * шаблон: 'Упай: {n}' переведёт и «Упай: 5», и «Упай: 120».
 *
 * Страница переводится сама: текст и подписи (placeholder, title, aria-label,
 * alt) заменяются, в том числе у элементов, которые игра создаёт позже.
 * Строки, которые не попадают в DOM (canvas, alert, голос), игра берёт через
 * BALang.t('Кыргызча сап', { n: 5 }).
 *
 * Учебный материал, который нельзя переводить (слова для изучения), помечается
 * translate="no" — внутри такого элемента ничего не меняется.
 */
(function () {
  'use strict';

  const LANGS = [
    { code: 'ky', short: 'KY', label: 'Кыргызча' },
    { code: 'ru', short: 'RU', label: 'Русский' },
    { code: 'en', short: 'EN', label: 'English' }
  ];
  const codes = LANGS.map((l) => l.code);

  function save(code) {
    try { localStorage.setItem('BA2_lang', JSON.stringify(code)); } catch (e) { /* приватный режим */ }
  }

  function readLang() {
    try {
      const fromUrl = new URLSearchParams(location.search).get('lang');
      if (codes.includes(fromUrl)) { save(fromUrl); return fromUrl; }
      const saved = JSON.parse(localStorage.getItem('BA2_lang'));
      if (codes.includes(saved)) return saved;
    } catch (e) { /* нет доступа к хранилищу */ }
    return 'ky';
  }

  const lang = readLang();
  const col = lang === 'ru' ? 0 : 1;
  const exact = new Map();
  const patterns = [];
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE']);

  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function fill(text, vars) {
    return vars ? text.replace(/\{(\w+)\}/g, (m, name) => (vars[name] !== undefined ? vars[name] : m)) : text;
  }

  /** Перевод готовой строки со страницы; null — перевода нет */
  function lookup(text) {
    const key = norm(text);
    if (!key || !/[А-Яа-яЁёӨөҮүҢң]/.test(key)) return null;
    const hit = exact.get(key);
    if (hit) return hit[col] ?? null;
    for (const p of patterns) {
      const m = p.re.exec(key);
      if (!m) continue;
      const vars = {};
      p.names.forEach((name, i) => { vars[name] = lookup(m[i + 1]) ?? m[i + 1]; });
      return fill(p.out[col], vars);
    }
    return null;
  }

  /** Строка для кода игры: BALang.t('Упай: {n}', { n: 5 }) */
  function t(text, vars) {
    if (lang === 'ky') return fill(text, vars);
    const hit = exact.get(norm(text));
    if (hit && hit[col] != null) return fill(hit[col], vars);
    if (vars) return fill(text, vars);
    return lookup(text) ?? text;
  }

  /** {ky, ru, en} или строка → строка на текущем языке */
  function pick(value) {
    if (value == null) return '';
    if (typeof value !== 'object') return String(value);
    return value[lang] ?? value.ky ?? '';
  }

  // Как в HTML: решает ближайший предок с атрибутом translate
  const skipped = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (SKIP.has(n.tagName) || n.isContentEditable) return true;
      const attr = n.getAttribute('translate');
      if (attr === 'no') return true;
      if (attr === 'yes') return false;
    }
    return false;
  };

  function translateText(node) {
    const parent = node.parentElement;
    if (!parent || skipped(parent)) return;
    const out = lookup(node.data);
    if (out == null) return;
    const lead = node.data.match(/^\s*/)[0];
    const trail = node.data.match(/\s*$/)[0];
    const next = lead + out + trail;
    if (next !== node.data) node.data = next;
  }

  function translateAttrs(el) {
    if (skipped(el)) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (!v) continue;
      const out = lookup(v);
      if (out != null && out !== v) el.setAttribute(a, out);
    }
    if (el.tagName === 'INPUT' && /^(button|submit)$/i.test(el.type) && el.value) {
      const out = lookup(el.value);
      if (out != null && out !== el.value) el.value = out;
    }
  }

  function translateTree(root) {
    if (!root) return;
    if (root.nodeType === 3) { translateText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    const el = root.nodeType === 9 ? root.documentElement : root;
    if (!el) return;
    translateAttrs(el);
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.nodeType === 3) translateText(n); else translateAttrs(n);
    }
  }

  function add(dict) {
    for (const [key, value] of Object.entries(dict)) {
      const k = norm(key);
      exact.set(k, value);
      if (/\{\w+\}/.test(k)) {
        const names = [];
        const re = new RegExp('^' + escapeRe(k).replace(/\\\{(\w+)\\\}/g, (m, name) => { names.push(name); return '(.+?)'; }) + '$');
        patterns.push({ re, names, out: value });
      }
    }
    if (lang !== 'ky' && document.documentElement) translateTree(document.documentElement);
  }

  function setLang(code) {
    if (!codes.includes(code) || code === lang) return;
    save(code);
    const url = new URL(location.href);
    url.searchParams.delete('lang');
    location.replace(url.href);
  }

  // ─── Переключатель языка ──────────────────────────────────────────────────
  function switcher(floating) {
    const sel = document.createElement('select');
    sel.className = 'baLang' + (floating ? ' baLangFloat' : '');
    sel.setAttribute('aria-label', lang === 'ru' ? 'Язык' : lang === 'en' ? 'Language' : 'Тил');
    sel.setAttribute('translate', 'no');
    LANGS.forEach((l) => {
      const o = document.createElement('option');
      o.value = l.code;
      o.textContent = l.short;
      o.title = l.label;
      if (l.code === lang) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => setLang(sel.value));
    return sel;
  }

  const CSS = '.baLang{appearance:none;-webkit-appearance:none;font:700 13px/1 Inter,system-ui,sans-serif;letter-spacing:.04em;' +
    'height:42px;min-width:52px;padding:0 26px 0 12px;border-radius:12px;border:1px solid #E3E6F0;background:#fff ' +
    'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%235B6583%27 stroke-width=%273%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E") no-repeat right 9px center;' +
    'color:#202B46;cursor:pointer;flex:none}' +
    '.baLang:focus-visible{outline:3px solid #635BFF;outline-offset:2px}' +
    '.baLangFloat{position:fixed;top:12px;z-index:9999;height:44px;box-shadow:0 4px 14px rgba(32,43,70,.12)}';

  function mount() {
    if (document.querySelector('.baLang')) return;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const slot = document.querySelector('[data-ba-lang]');
    if (slot) { slot.appendChild(switcher(false)); return; }
    const top = document.querySelector('.gTop');
    if (top) {
      const before = top.querySelector('#soundBtn, #themeBtn');
      top.insertBefore(switcher(false), before || null);
      return;
    }
    // Полноэкранные игры: рядом с плавающей кнопкой «Оюндар»
    const back = document.querySelector('.ba-back');
    const sel = switcher(true);
    if (back && back.style.position === 'fixed') {
      const r = back.getBoundingClientRect();
      sel.style.left = Math.round(r.right + 8) + 'px';
    } else {
      sel.style.right = '12px';
    }
    document.body.appendChild(sel);
  }

  document.documentElement.lang = lang;
  if (lang !== 'ky') {
    new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'characterData') translateText(m.target);
        else if (m.type === 'attributes') translateAttrs(m.target);
        else m.addedNodes.forEach(translateTree);
      }
    }).observe(document.documentElement, {
      childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { mount(); if (lang !== 'ky') translateTree(document.documentElement); });
  } else {
    mount();
  }

  window.BALang = { lang, LANGS, add, t, pick, setLang, translate: translateTree };
})();
