/**
 * Bilim Arena — иллюстрации в одном стиле.
 *
 *  cover(iconName, tone) — запасная обложка (если у игры нет своей сцены): плоский фон,
 *    крупная фигура-фон и иконка из core/icons.js
 *  avatar(variant)       — иллюстрация профиля (своя, плоский стиль,
 *    лёгкая анимация «дыхания» и моргания)
 *
 * Цвета — только из палитры платформы.
 */

/** [начало градиента, конец градиента, цвет иконки на белом круге] */
export const TONES = {
  violet: ['#D91E18', '#E8453C', '#A8160F'], // основной тон (красный бренда); имя оставлено ради сохранённых аватаров
  teal: ['#1A7F72', '#3FA597', '#0B6B60'],
  amber: ['#FFCE00', '#FFE066', '#7A5A00'],
  ink: ['#282828', '#4A4A4A', '#282828'],
  rose: ['#E8453C', '#F27A72', '#A8160F'],
  sky: ['#3367D6', '#6D93E3', '#1F4FB0']
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
  const inner = iconSvg.innerHTML;
  return svgFrom(`
<svg class="art-cover" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <rect width="320" height="200" fill="${a}"/>
  <path d="M0 200 L0 140 Q120 110 200 150 T320 130 V200z" fill="${b}" opacity=".55"/>
  <circle cx="268" cy="30" r="70" fill="#fff" opacity=".12"/>
  <circle cx="40" cy="188" r="56" fill="#fff" opacity=".10"/>
  <g transform="translate(206 150) scale(1.5)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".3">
    <path d="M32 21 V13"/><path d="M32 13 C32 6 26 3 21 4.5 C16.5 6 16 11.5 19.5 13 C22.5 14.3 25 12 24 9.5"/><path d="M32 13 C32 6 38 3 43 4.5 C47.5 6 48 11.5 44.5 13 C41.5 14.3 39 12 40 9.5"/>
  </g>
  <circle cx="74" cy="44" r="6" fill="#fff" opacity=".35"/>
  <circle cx="252" cy="112" r="4" fill="#fff" opacity=".4"/>
  <g class="cover-icon">
    <circle cx="160" cy="100" r="54" fill="#fff" opacity=".2"/>
    <circle cx="160" cy="100" r="40" fill="#fff" opacity=".95"/>
    <g transform="translate(136 76) scale(2)" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</g>
  </g>
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
  <circle cx="60" cy="60" r="58" fill="#FDECEB"/>
  <g clip-path="url(#${id})">
    <circle cx="60" cy="60" r="44" fill="#fff" opacity=".7"/>
    <g class="av-body">
      <path d="M18 124c2-24 18-38 42-38s40 14 42 38z" fill="${tone[0]}"/>
      <path d="M48 88l12 12 12-12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
      <rect x="52" y="70" width="16" height="16" rx="6" fill="#F4C09A"/>
      <circle cx="60" cy="52" r="22" fill="#FFD7B5"/>
      <path d="M38 50c0-14 10-23 23-23 12 0 21 8 21 20-6-1-12-5-15-10-4 7-15 12-29 13z" fill="#282828"/>
      <g class="av-eyes" fill="#282828">
        <circle cx="52" cy="55" r="2.6"/><circle cx="68" cy="55" r="2.6"/>
      </g>
      <path d="M54 63.5c3.5 3 8.5 3 12 0" fill="none" stroke="#C0706A" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="47" cy="61" r="3" fill="${tone[1]}" opacity=".45"/><circle cx="73" cy="61" r="3" fill="${tone[1]}" opacity=".45"/>
    </g>
  </g>
  <circle cx="60" cy="60" r="58" fill="none" stroke="${tone[0]}" stroke-width="3" opacity=".25"/>
</svg>`);
}
