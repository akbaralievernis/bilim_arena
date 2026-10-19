/**
 * Picture Detective — 12 сцен в SVG (без файлов-картинок). Подписей-слов на рисунках нет,
 * чтобы не подсказывать ответ. Каждая деталь рубрики (tasks.js) нарисована.
 */

const W = 400;
const H = 260;
const svg = (body, bg = '#EAF6FF') => `<svg viewBox="0 0 ${W} ${H}" class="pd-svg" aria-hidden="true" focusable="false"><rect width="${W}" height="${H}" fill="${bg}"/>${body}</svg>`;
const SK = '#F4C9A0';
const OUT = 'stroke="#202B46" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"';

/** Человек: x — центр, y — уровень ног; pose: stand | sit */
function person(x, y, { shirt = '#21B8A6', pants = '#3B4A6B', hair = '#4A2E1A', scale = 1, pose = 'stand', skirt = false, armUp = false, hat = null } = {}) {
  const s = scale;
  const hy = y - 92 * s;
  const legs = pose === 'sit'
    ? `<path d="M${x - 8 * s} ${y - 40 * s}h26M${x + 18 * s} ${y - 40 * s}v34" stroke="${pants}" stroke-width="${9 * s}" stroke-linecap="round"/>`
    : `<path d="M${x - 7 * s} ${y - 40 * s}v38M${x + 7 * s} ${y - 40 * s}v38" stroke="${pants}" stroke-width="${8 * s}" stroke-linecap="round"/>`;
  const body = skirt
    ? `<path d="M${x - 14 * s} ${y - 74 * s}h28l8 ${36 * s}h-44z" fill="${shirt}"/>`
    : `<rect x="${x - 14 * s}" y="${y - 76 * s}" width="${28 * s}" height="${38 * s}" rx="${8 * s}" fill="${shirt}"/>`;
  const arm = armUp
    ? `<path d="M${x + 12 * s} ${y - 70 * s}l18 -20" stroke="${shirt}" stroke-width="${7 * s}" stroke-linecap="round"/>`
    : `<path d="M${x + 12 * s} ${y - 70 * s}l10 22" stroke="${shirt}" stroke-width="${7 * s}" stroke-linecap="round"/>`;
  const hatSvg = hat ? `<path d="M${x - 13 * s} ${hy - 6 * s}c0-14 26-14 26 0z" fill="${hat}"/>` : `<path d="M${x - 12 * s} ${hy - 2 * s}c0-14 24-14 24 0" fill="${hair}"/>`;
  return `${legs}${body}<path d="M${x - 12 * s} ${y - 70 * s}l-10 22" stroke="${shirt}" stroke-width="${7 * s}" stroke-linecap="round"/>${arm}<circle cx="${x}" cy="${hy}" r="${13 * s}" fill="${SK}"/>${hatSvg}`;
}
const table = (x, y, w, c = '#B9834F') => `<rect x="${x}" y="${y}" width="${w}" height="8" rx="2" fill="${c}"/><path d="M${x + 8} ${y + 8}v44M${x + w - 8} ${y + 8}v44" stroke="#8A5F36" stroke-width="5"/>`;
const tree = (x, y, r = 40) => `<rect x="${x - 7}" y="${y - 70}" width="14" height="70" fill="#8A5F36"/><circle cx="${x}" cy="${y - 90}" r="${r}" fill="#2E9E55"/>`;
const sun = (x, y) => `<circle cx="${x}" cy="${y}" r="20" fill="#FFB547"/>`;
const cloud = (x, y, c = '#fff') => `<g fill="${c}"><circle cx="${x}" cy="${y}" r="18"/><circle cx="${x + 20}" cy="${y - 8}" r="22"/><circle cx="${x + 42}" cy="${y}" r="17"/><rect x="${x}" y="${y}" width="42" height="17"/></g>`;
const bag = (x, y, c) => `<rect x="${x}" y="${y}" width="34" height="38" rx="8" fill="${c}" ${OUT}/><path d="M${x + 8} ${y}c0-12 18-12 18 0" fill="none" ${OUT}/>`;
const book = (x, y, c = '#E0162B') => `<rect x="${x}" y="${y}" width="30" height="22" rx="2" fill="${c}" ${OUT}/><path d="M${x + 15} ${y}v22" stroke="#fff" stroke-width="2"/>`;

export const SCENES = {
  classroom: svg(`<rect x="40" y="26" width="170" height="80" rx="6" fill="#2E5E4E"/><rect y="200" width="${W}" height="60" fill="#E8DCC6"/>
    ${table(230, 150, 130)}${bag(270, 168, '#2F6FDE')}
    ${table(70, 150, 110)}${person(92, 220, { shirt: '#FFB547', pose: 'sit' })}${book(125, 128)}
    <path d="M300 60h60v40h-60z" fill="#fff" ${OUT}/><path d="M318 70h24M318 80h24M318 90h16" stroke="#9AA6BD" stroke-width="3"/>`, '#F7F1E3'),
  rain: svg(`${cloud(60, 50, '#9AA6BD')}${cloud(250, 40, '#9AA6BD')}
    ${Array.from({ length: 26 }, (_, i) => `<path d="M${15 + i * 15} ${80 + (i % 4) * 22}l-5 14" stroke="#2F6FDE" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
    <rect y="215" width="${W}" height="45" fill="#7DA06A"/><ellipse cx="280" cy="232" rx="40" ry="8" fill="#9CC3F0"/>
    <path d="M130 120c0-46 100-46 100 0z" fill="#D93A3A" ${OUT}/><path d="M180 120v34" stroke="#202B46" stroke-width="3"/>
    ${person(180, 232, { shirt: '#FFB547', skirt: true, armUp: true })}`, '#DDE5EE'),
  breakfast: svg(`<rect x="0" y="0" width="${W}" height="${H}" fill="#FFF6E5"/>${table(60, 150, 280, '#C99A6B')}
    <ellipse cx="150" cy="146" rx="46" ry="10" fill="#fff" ${OUT}/><ellipse cx="135" cy="141" rx="13" ry="9" fill="#fff" stroke="#E5C27A" stroke-width="2"/><circle cx="135" cy="141" r="5" fill="#F2C230"/><ellipse cx="165" cy="141" rx="13" ry="9" fill="#fff" stroke="#E5C27A" stroke-width="2"/><circle cx="165" cy="141" r="5" fill="#F2C230"/>
    <path d="M215 148c0-18 50-18 50 0z" fill="#C88A4A" ${OUT}/>
    <rect x="290" y="100" width="26" height="48" rx="4" fill="#fff" ${OUT}/><rect x="290" y="112" width="26" height="36" fill="#F7F9FC"/>`, '#FFF6E5'),
  park: svg(`${sun(340, 46)}<rect y="190" width="${W}" height="70" fill="#7DC27A"/>${tree(110, 200, 46)}
    <circle cx="112" cy="196" r="12" fill="#F2C230" ${OUT}/>
    <g transform="translate(250 160)"><ellipse cx="0" cy="20" rx="34" ry="16" fill="#9C6B3C" ${OUT}/><circle cx="34" cy="0" r="14" fill="#9C6B3C" ${OUT}/><path d="M-26 32l-10 12M24 32l12 12M-34 16l-16 -10" ${OUT}/></g>`, '#DFF1FF'),
  family: svg(`<rect y="200" width="${W}" height="60" fill="#E8DCC6"/>
    <rect x="20" y="110" width="110" height="90" fill="#CFD6E4"/><rect x="30" y="100" width="90" height="12" fill="#9AA6BD"/><ellipse cx="72" cy="98" rx="24" ry="6" fill="#606C80"/>
    ${person(90, 210, { shirt: '#F0607E', skirt: true, hair: '#2B1A10' })}
    <rect x="200" y="150" width="180" height="40" rx="10" fill="#3A6EA5"/><rect x="200" y="130" width="180" height="26" rx="10" fill="#4F86C6"/>
    ${person(260, 214, { shirt: '#21B8A6', pose: 'sit' })}<rect x="268" y="128" width="40" height="30" fill="#F7F9FC" ${OUT}/>
    <g transform="translate(345 136)"><ellipse cx="0" cy="8" rx="18" ry="9" fill="#2B2B2B"/><circle cx="14" cy="-2" r="8" fill="#2B2B2B"/></g>`, '#FFF4E8'),
  shop: svg(`<rect y="200" width="${W}" height="60" fill="#E8EEF7"/>
    <path d="M20 40h150M20 80h150M20 120h150" stroke="#8A5F36" stroke-width="5"/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${34 + (i % 5) * 26}" cy="${i < 5 ? 30 : 70}" r="9" fill="#D93A3A"/>`).join('')}
    ${person(150, 236, { shirt: '#3B6CF6' })}<path d="M170 180h34l-4 26h-26z" fill="#D93A3A" ${OUT}/><circle cx="180" cy="178" r="6" fill="#D93A3A"/><circle cx="194" cy="178" r="6" fill="#D93A3A"/>
    <rect x="240" y="150" width="140" height="50" fill="#9AA6BD"/><rect x="330" y="128" width="36" height="24" fill="#202B46"/>
    ${person(300, 160, { shirt: '#FFB547', skirt: true, scale: 0.9 })}`, '#F7F9FC'),
  cafe: svg(`<rect y="205" width="${W}" height="55" fill="#E8DCC6"/>${table(40, 160, 130, '#C99A6B')}
    ${person(80, 230, { shirt: '#F0607E', pose: 'sit', skirt: true })}<path d="M120 146h18v14h-18z" fill="#fff" ${OUT}/><path d="M138 150h6v6h-6" fill="none" ${OUT}/>
    ${person(290, 236, { shirt: '#fff', pants: '#202B46', armUp: true })}<rect x="296" y="128" width="60" height="6" fill="#9AA6BD"/><path d="M312 128c0-18 30-18 30 0z" fill="#F0A0C0" ${OUT}/>`, '#FFF1E6'),
  street: svg(`<rect y="170" width="${W}" height="90" fill="#7A8396"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${150 + i * 18}" y="176" width="10" height="78" fill="#fff"/>`).join('')}
    <rect x="10" y="110" width="120" height="60" rx="8" fill="#D93A3A" ${OUT}/><rect x="20" y="120" width="26" height="20" fill="#D8ECFF"/><rect x="54" y="120" width="26" height="20" fill="#D8ECFF"/><rect x="88" y="120" width="26" height="20" fill="#D8ECFF"/><circle cx="38" cy="172" r="10" fill="#202B46"/><circle cx="104" cy="172" r="10" fill="#202B46"/>
    <rect x="356" y="60" width="22" height="60" rx="4" fill="#202B46"/><circle cx="367" cy="76" r="6" fill="#444"/><circle cx="367" cy="100" r="7" fill="#2E9E55"/><path d="M367 120v60" stroke="#202B46" stroke-width="4"/>
    ${person(185, 236, { shirt: '#FFB547', scale: 0.8 })}${person(215, 236, { shirt: '#21B8A6', scale: 0.8, skirt: true })}
    <g transform="translate(280 214)"><circle cx="0" cy="20" r="14" fill="none" stroke="#202B46" stroke-width="3"/><circle cx="46" cy="20" r="14" fill="none" stroke="#202B46" stroke-width="3"/><path d="M0 20l18-20h20l8 20M18 0l-4-8" fill="none" stroke="#2F6FDE" stroke-width="4"/></g>`, '#DFF1FF'),
  morning: svg(`<rect y="200" width="${W}" height="60" fill="#DCE6F2"/><rect x="250" y="40" width="90" height="70" rx="6" fill="#D8ECFF" ${OUT}/>
    <rect x="240" y="150" width="110" height="20" rx="4" fill="#fff" ${OUT}/>
    ${person(200, 232, { shirt: '#3B6CF6', armUp: true })}<path d="M216 140l8-8" stroke="#E0162B" stroke-width="5" stroke-linecap="round"/>
    <circle cx="80" cy="70" r="36" fill="#fff" ${OUT}/><path d="M80 70V46M80 70h-18" stroke="#202B46" stroke-width="4" stroke-linecap="round"/>`, '#F3F8FF'),
  winter: svg(`<path d="M0 150l80-80 70 60 90-100 80 80 80-40v190H0z" fill="#B8C7DA"/><path d="M200 50l-25 28h50zM80 70l-18 20h36z" fill="#fff"/><rect y="190" width="${W}" height="70" fill="#fff"/>
    <circle cx="300" cy="200" r="30" fill="#fff" ${OUT}/><circle cx="300" cy="150" r="22" fill="#fff" ${OUT}/><path d="M300 150l20 4-20 4" fill="#F28C28"/><rect x="286" y="118" width="28" height="12" fill="#202B46"/>
    ${person(150, 236, { shirt: '#D93A3A', hat: '#2F6FDE' })}${person(215, 236, { shirt: '#21B8A6', hat: '#F2C230', scale: 0.75, skirt: true })}`, '#E6F0FA'),
  football: svg(`<rect y="140" width="${W}" height="120" fill="#5DB35A"/><path d="M330 120h60v70" fill="none" stroke="#fff" stroke-width="5"/><path d="M330 120v70" stroke="#fff" stroke-width="3"/>
    ${person(140, 236, { shirt: '#D93A3A' })}<circle cx="175" cy="226" r="10" fill="#fff" ${OUT}/>
    ${person(355, 220, { shirt: '#2F6FDE', armUp: true })}
    ${person(60, 180, { shirt: '#FFB547', skirt: true, armUp: true, scale: 0.8 })}
    <rect x="150" y="20" width="100" height="40" rx="6" fill="#202B46"/><circle cx="175" cy="40" r="8" fill="#D93A3A"/><circle cx="225" cy="40" r="8" fill="#2F6FDE"/><path d="M193 32v16M207 32l-6 16" stroke="#fff" stroke-width="3"/>`, '#CFEAFF'),
  bazaar: svg(`<rect y="190" width="${W}" height="70" fill="#E8DCC6"/><path d="M20 70h360l-20-40H40z" fill="#E0162B"/><path d="M20 70h360" stroke="#fff" stroke-width="4" stroke-dasharray="20 20"/>
    <rect x="40" y="140" width="320" height="50" fill="#B9834F"/>
    ${Array.from({ length: 6 }, (_, i) => `<circle cx="${60 + i * 16}" cy="132" r="9" fill="#D93A3A"/>`).join('')}
    <ellipse cx="200" cy="126" rx="26" ry="16" fill="#9CCB5A" ${OUT}/><ellipse cx="250" cy="126" rx="26" ry="16" fill="#9CCB5A" ${OUT}/>
    ${Array.from({ length: 7 }, (_, i) => `<circle cx="${300 + (i % 4) * 9}" cy="${122 + Math.floor(i / 4) * 9}" r="5" fill="#7A3E8F"/>`).join('')}
    <rect x="70" y="100" width="40" height="18" fill="#fff" ${OUT}/><text x="90" y="114" font-size="13" font-weight="700" text-anchor="middle" fill="#202B46">50</text>
    <rect x="210" y="94" width="40" height="18" fill="#fff" ${OUT}/><text x="230" y="108" font-size="13" font-weight="700" text-anchor="middle" fill="#202B46">100</text>
    ${person(200, 140, { shirt: '#fff', pants: '#202B46', hat: '#fff', scale: 0.8 })}`, '#FFF1D6')
};
