/**
 * Bilim Arena — иллюстрации в одном стиле.
 *
 *  cover(iconName, tone) — обложка игры или категории: мягкий градиент,
 *    крупная фигура-фон и иконка из core/icons.js
 *  avatar(variant)       — иллюстрация профиля (своя, плоский стиль,
 *    лёгкая анимация «дыхания» и моргания)
 *
 * Цвета — только из палитры платформы.
 */

/** [начало градиента, конец градиента, цвет иконки на белом круге] */
export const TONES = {
  violet: ['#635BFF', '#8F89FF', '#635BFF'],
  teal: ['#21B8A6', '#5CD3C4', '#0E9A8A'],
  amber: ['#FFB547', '#FFD08A', '#D98A10'],
  ink: ['#202B46', '#4A5A82', '#202B46'],
  rose: ['#F0607E', '#FF9AAE', '#E0456A'],
  sky: ['#3B8CFF', '#7CB3FF', '#2F74E0']
};

let uid = 0;
const svgFrom = (html) => {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstChild;
};

/** Обложка карточки: 16×10, иконка в круге, декоративные фигуры */
export function cover(iconSvg, tone = 'violet') {
  const [a, b, ink] = TONES[tone] || TONES.violet;
  const id = `g${++uid}`;
  const inner = iconSvg.innerHTML;
  return svgFrom(`
<svg class="art-cover" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </linearGradient>
  </defs>
  <rect width="320" height="200" fill="url(#${id})"/>
  <circle cx="268" cy="30" r="70" fill="#fff" opacity=".12"/>
  <circle cx="40" cy="188" r="56" fill="#fff" opacity=".10"/>
  <rect x="222" y="138" width="44" height="44" rx="12" fill="#fff" opacity=".14" transform="rotate(18 244 160)"/>
  <circle cx="74" cy="44" r="6" fill="#fff" opacity=".35"/>
  <circle cx="252" cy="112" r="4" fill="#fff" opacity=".4"/>
  <circle cx="160" cy="100" r="54" fill="#fff" opacity=".2"/>
  <circle cx="160" cy="100" r="40" fill="#fff" opacity=".95"/>
  <g transform="translate(136 76) scale(2)" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</g>
</svg>`);
}

/** Варианты иллюстрации профиля (цвет одежды) */
export const AVATAR_VARIANTS = ['violet', 'teal', 'amber', 'rose', 'sky', 'ink'];

/** Прежние эмодзи-аватары соответствуют вариантам по порядку */
const LEGACY = ['🦊', '🐨', '🐼', '🦁', '🐯', '🦉', '🐧', '🐝', '🦅', '🐺', '🐴', '🦋'];
export function avatarVariant(value) {
  if (AVATAR_VARIANTS.includes(value)) return value;
  const i = LEGACY.indexOf(value);
  return AVATAR_VARIANTS[i >= 0 ? i % AVATAR_VARIANTS.length : 0];
}

/** Иллюстрация профиля: человек в круге, плоский стиль */
export function avatar(value, { size = 96, animated = true } = {}) {
  const tone = TONES[avatarVariant(value)] || TONES.violet;
  const id = `a${++uid}`;
  return svgFrom(`
<svg class="art-avatar ${animated ? 'is-animated' : ''}" width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-hidden="true" focusable="false">
  <defs>
    <clipPath id="${id}"><circle cx="60" cy="60" r="58"/></clipPath>
  </defs>
  <circle cx="60" cy="60" r="58" fill="#EEEDFF"/>
  <g clip-path="url(#${id})">
    <circle cx="60" cy="60" r="44" fill="#fff" opacity=".7"/>
    <g class="av-body">
      <path d="M18 124c2-24 18-38 42-38s40 14 42 38z" fill="${tone[0]}"/>
      <path d="M48 88l12 12 12-12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
      <rect x="52" y="70" width="16" height="16" rx="6" fill="#F4C09A"/>
      <circle cx="60" cy="52" r="22" fill="#FFD7B5"/>
      <path d="M38 50c0-14 10-23 23-23 12 0 21 8 21 20-6-1-12-5-15-10-4 7-15 12-29 13z" fill="#202B46"/>
      <g class="av-eyes" fill="#202B46">
        <circle cx="52" cy="55" r="2.6"/><circle cx="68" cy="55" r="2.6"/>
      </g>
      <path d="M54 63.5c3.5 3 8.5 3 12 0" fill="none" stroke="#C0706A" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="47" cy="61" r="3" fill="${tone[1]}" opacity=".45"/><circle cx="73" cy="61" r="3" fill="${tone[1]}" opacity=".45"/>
    </g>
  </g>
  <circle cx="60" cy="60" r="58" fill="none" stroke="${tone[0]}" stroke-width="3" opacity=".25"/>
</svg>`);
}
