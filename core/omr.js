/**
 * Bilim Arena — бланк ответов для сканера и его распознавание (OMR) без внешних библиотек.
 *
 * Бланк (единицы — миллиметры, начало координат — центр левой верхней метки):
 *   4 чёрные квадратные метки по углам рамки SHEET.w × SHEET.h;
 *   полоска-код: тест, вариант, версия, контрольная сумма (34 клетки, крайние всегда чёрные);
 *   номер ученика по списку — две строки кружков (десятки, единицы);
 *   ответы — до 72 строк в трёх колонках: кружки A–F или клетка для письменного ответа.
 *
 * Распознавание: серое изображение → адаптивный порог → связные области → 4 метки →
 * гомография (мм → пиксели) → чтение кода (перебор поворотов, проверка CRC) → замер
 * темноты внутри каждого кружка относительно бумаги рядом. Фото никуда не отправляется.
 */

// ─── Разметка бланка ─────────────────────────────────────────────────────────

export const SHEET = { w: 170, h: 250, marker: 8 };
const CODE = { x0: 6, y: 17, pitch: 4.7, cell: 3.9, n: 34 };
const NUM = { x0: 100, y: [33, 40.5], pitch: 7 };
const COLS = [2, 59, 116];
const ROW_Y0 = 63;
const ROW_PITCH = 7.5;
const ROWS = 24;
const BUB = { dx0: 13, pitch: 7, r: 2.4 };
export const MAX_ITEMS = COLS.length * ROWS;
export const MAX_OPTIONS = 6;
export const BUBBLE_R = BUB.r;
const LETTERS = 'ABCDEF';

/** Центры клеток кода */
export const codeCells = () => Array.from({ length: CODE.n }, (_, i) => ({ x: CODE.x0 + i * CODE.pitch, y: CODE.y, size: CODE.cell }));

/** Кружки номера ученика: [десятки[0..9], единицы[0..9]] */
export const numberBubbles = () => NUM.y.map((y) => Array.from({ length: 10 }, (_, d) => ({ x: NUM.x0 + d * NUM.pitch, y, r: BUB.r })));

/** Подходит ли пункт варианта для кружков (иначе — клетка для письменного ответа) */
export const bubbleItem = (it) => (it.type === 'choice' || it.type === 'multiple') && it.options && it.options.length <= MAX_OPTIONS;

/**
 * Строки ответов для пунктов варианта (core/tests.js → buildVariant).
 * @returns {Array<{ n, x, y, bubbles?: [{x,y,r,letter}], box?: {x,y,w,h} }>}
 */
export function answerRows(items) {
  return items.slice(0, MAX_ITEMS).map((it, i) => {
    const x = COLS[Math.floor(i / ROWS)];
    const y = ROW_Y0 + (i % ROWS) * ROW_PITCH;
    const row = { n: it.n, x, y };
    if (bubbleItem(it)) row.bubbles = it.options.map((_, k) => ({ x: x + BUB.dx0 + k * BUB.pitch, y, r: BUB.r, letter: LETTERS[k] }));
    else row.box = { x: x + 9, y: y - 3, w: 42, h: 6 };
    return row;
  });
}

// ─── Код теста ───────────────────────────────────────────────────────────────

/** FNV-1a, 32 бита */
export function hash32(s) {
  let h = 0x811c9dc5;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return h >>> 0;
}

function crc8(bytes) {
  let c = 0xff; // ненулевое начало: пустая (белая) полоска никогда не проходит проверку
  for (const b of bytes) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = c & 0x80 ? ((c << 1) ^ 0x07) & 0xff : (c << 1) & 0xff;
  }
  return c;
}

export const testCode = (testId) => hash32(testId) & 0xffff;
export const versionCode = (questionIds) => hash32((questionIds || []).join(',')) & 0x3f;

/** Биты полоски-кода (34 клетки, 1 — чёрная) */
export function encodeSheet({ testId, variant, questionIds }) {
  const payload = (testCode(testId) << 8) | ((variant & 3) << 6) | versionCode(questionIds);
  const bytes = [(payload >>> 16) & 0xff, (payload >>> 8) & 0xff, payload & 0xff];
  const word = [...bytes, crc8(bytes)];
  const bits = [1];
  word.forEach((b) => { for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1); });
  bits.push(1);
  return bits;
}

/** Обратное: null, если крайние клетки не чёрные или не сошлась контрольная сумма */
export function decodeBits(bits) {
  if (bits.length !== CODE.n || !bits[0] || !bits[CODE.n - 1]) return null;
  const bytes = [];
  for (let k = 0; k < 4; k++) {
    let b = 0;
    for (let i = 0; i < 8; i++) b = (b << 1) | (bits[1 + k * 8 + i] ? 1 : 0);
    bytes.push(b);
  }
  if (crc8(bytes.slice(0, 3)) !== bytes[3]) return null;
  const payload = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
  return { test: payload >>> 8, variant: (payload >> 6) & 3, version: payload & 0x3f };
}

// ─── Изображение ─────────────────────────────────────────────────────────────

/**
 * Серое изображение, уменьшенное так, чтобы длинная сторона была ≤ maxSide.
 * @param {{width,height,data}} img — ImageData (RGBA)
 */
export function toGray(img, maxSide = 1600) {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const g = new Float32Array(w * h);
  const step = 1 / scale;
  const n = Math.max(1, Math.round(step));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Среднее по блоку исходных пикселей — меньше шума от камеры
      const sx0 = Math.floor(x * step);
      const sy0 = Math.floor(y * step);
      let sum = 0;
      let cnt = 0;
      for (let dy = 0; dy < n; dy++) {
        const sy = Math.min(img.height - 1, sy0 + dy);
        for (let dx = 0; dx < n; dx++) {
          const sx = Math.min(img.width - 1, sx0 + dx);
          const p = (sy * img.width + sx) * 4;
          sum += 0.299 * img.data[p] + 0.587 * img.data[p + 1] + 0.114 * img.data[p + 2];
          cnt++;
        }
      }
      g[y * w + x] = sum / cnt;
    }
  }
  return { w, h, g, scale };
}

/** Адаптивный порог: тёмное относительно среднего в окне (переносит тени и неровный свет) */
function binarize({ w, h, g }) {
  const ii = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += g[y * w + x];
      ii[(y + 1) * (w + 1) + x + 1] = ii[y * (w + 1) + x + 1] + row;
    }
  }
  const r = Math.max(8, Math.round(Math.min(w, h) / 16));
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w, x + r + 1);
      const sum = ii[y1 * (w + 1) + x1] - ii[y0 * (w + 1) + x1] - ii[y1 * (w + 1) + x0] + ii[y0 * (w + 1) + x0];
      const mean = sum / ((x1 - x0) * (y1 - y0));
      out[y * w + x] = g[y * w + x] < mean * 0.72 && g[y * w + x] < 150 ? 1 : 0;
    }
  }
  return out;
}

/** Связные тёмные области (4-связность) */
function components(bin, w, h) {
  const label = new Int32Array(w * h);
  const stack = new Int32Array(w * h);
  const out = [];
  let id = 0;
  for (let start = 0; start < w * h; start++) {
    if (!bin[start] || label[start]) continue;
    id++;
    let top = 0;
    stack[top++] = start;
    label[start] = id;
    let area = 0; let sx = 0; let sy = 0;
    let minx = w; let maxx = 0; let miny = h; let maxy = 0;
    while (top) {
      const p = stack[--top];
      const x = p % w;
      const y = (p - x) / w;
      area++; sx += x; sy += y;
      if (x < minx) minx = x; if (x > maxx) maxx = x;
      if (y < miny) miny = y; if (y > maxy) maxy = y;
      if (x > 0 && bin[p - 1] && !label[p - 1]) { label[p - 1] = id; stack[top++] = p - 1; }
      if (x < w - 1 && bin[p + 1] && !label[p + 1]) { label[p + 1] = id; stack[top++] = p + 1; }
      if (y > 0 && bin[p - w] && !label[p - w]) { label[p - w] = id; stack[top++] = p - w; }
      if (y < h - 1 && bin[p + w] && !label[p + w]) { label[p + w] = id; stack[top++] = p + w; }
    }
    out.push({ area, cx: sx / area, cy: sy / area, minx, maxx, miny, maxy });
  }
  return out;
}

/** Кандидаты в метки: плотные почти квадратные пятна, крупнее кружков и клеток кода */
function markerCandidates(comps, w, h) {
  const minArea = (w * h) * 0.00006; // лист может занимать лишь треть кадра
  return comps.filter((c) => {
    const bw = c.maxx - c.minx + 1;
    const bh = c.maxy - c.miny + 1;
    const fill = c.area / (bw * bh);
    const aspect = bw / bh;
    return c.area >= minArea && fill >= 0.72 && aspect > 0.55 && aspect < 1.8
      && c.minx > 0 && c.miny > 0 && c.maxx < w - 1 && c.maxy < h - 1;
  }).sort((a, b) => b.area - a.area).slice(0, 7);
}

// ─── Геометрия ───────────────────────────────────────────────────────────────

/** Гомография по 4 парам точек: src → dst (решение системы 8×8) */
export function homography(src, dst) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  // Гаусс с выбором главного элемента
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-12) return null;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  const hv = b.map((v, i) => v / A[i][i]);
  return [...hv, 1];
}

export function project(H, x, y) {
  const d = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / d, (H[3] * x + H[4] * y + H[5]) / d];
}

/** Средняя яркость в круге радиуса r (пиксели) */
function meanDisk(gray, cx, cy, r) {
  const { w, h, g } = gray;
  let sum = 0; let n = 0;
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    if (y < 0 || y >= h) continue;
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if (x < 0 || x >= w) continue;
      if ((x - cx) ** 2 + (y - cy) ** 2 > r2) continue;
      sum += g[y * w + x]; n++;
    }
  }
  return n ? sum / n : 255;
}

/** Пикселей на миллиметр около точки (по гомографии) */
function pxPerMm(H, x, y) {
  const [a, b] = project(H, x, y);
  const [c, d] = project(H, x + 1, y);
  return Math.hypot(c - a, d - b);
}

/**
 * Темнота кружка: 0 — как бумага, 1 — чёрный. Бумагу меряем рядом,
 * в промежутках между кружками, — так тень и неровный свет не мешают.
 */
function darkness(gray, H, x, y, r = BUB.r, gap = 3.5) {
  const k = pxPerMm(H, x, y);
  const [cx, cy] = project(H, x, y);
  const ink = meanDisk(gray, cx, cy, Math.max(1.2, r * 0.55 * k));
  const refs = [[-gap, 0], [gap, 0], [0, -3.6], [0, 3.6]].map(([dx, dy]) => {
    const [px, py] = project(H, x + dx, y + dy);
    return meanDisk(gray, px, py, Math.max(1, 0.6 * k));
  });
  const paper = Math.max(...refs);
  return Math.max(0, Math.min(1, 1 - ink / Math.max(1, paper)));
}

// ─── Распознавание ───────────────────────────────────────────────────────────

const CORNERS = () => [[0, 0], [SHEET.w, 0], [SHEET.w, SHEET.h], [0, SHEET.h]];

/** Четыре точки по часовой стрелке (в координатах экрана, y вниз) */
function clockwise(pts) {
  const cx = pts.reduce((s, p) => s + p[0], 0) / 4;
  const cy = pts.reduce((s, p) => s + p[1], 0) / 4;
  return pts.slice().sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
}

function combos(list, k) {
  const out = [];
  const rec = (start, acc) => {
    if (acc.length === k) { out.push(acc.slice()); return; }
    for (let i = start; i < list.length; i++) { acc.push(list[i]); rec(i + 1, acc); acc.pop(); }
  };
  rec(0, []);
  return out;
}

function readCode(gray, H) {
  const k = pxPerMm(H, SHEET.w / 2, CODE.y);
  const cells = codeCells();
  const vals = cells.map((c) => {
    const [px, py] = project(H, c.x, c.y);
    return meanDisk(gray, px, py, Math.max(1, c.size * 0.3 * k));
  });
  // Бумага — над и под полоской
  const paper = Math.max(...[CODE.y - 4.5, CODE.y + 4.5].flatMap((yy) => [20, 60, 100, 140].map((xx) => {
    const [px, py] = project(H, xx, yy);
    return meanDisk(gray, px, py, Math.max(1, 0.8 * k));
  })));
  return vals.map((v) => (1 - v / Math.max(1, paper) > 0.42 ? 1 : 0));
}

/**
 * Найти бланк на изображении.
 * @param {ImageData} img
 * @returns {null | { gray, H, code, corners }}  H — мм → пиксели серого изображения
 */
export function detectSheet(img, { maxSide = 1600 } = {}) {
  const gray = img.g ? img : toGray(img, maxSide);
  const bin = binarize(gray);
  const cand = markerCandidates(components(bin, gray.w, gray.h), gray.w, gray.h);
  if (cand.length < 4) return null;
  const tries = [];
  for (const four of combos(cand, 4)) {
    const areas = four.map((c) => c.area);
    if (Math.max(...areas) / Math.min(...areas) > 4) continue;
    const pts = clockwise(four.map((c) => [c.cx, c.cy]));
    for (let rot = 0; rot < 4; rot++) {
      const dst = [0, 1, 2, 3].map((i) => pts[(i + rot) % 4]);
      // Рамка вытянута по вертикали: короткая сторона — сверху
      const top = Math.hypot(dst[1][0] - dst[0][0], dst[1][1] - dst[0][1]);
      const left = Math.hypot(dst[3][0] - dst[0][0], dst[3][1] - dst[0][1]);
      const comps = [0, 1, 2, 3].map((i) => four.find((c) => c.cx === dst[i][0] && c.cy === dst[i][1]));
      tries.push({ dst, comps, plausible: Math.abs(Math.log((top / left) / (SHEET.w / SHEET.h))), area: areas.reduce((s, a) => s + a, 0) });
    }
  }
  tries.sort((a, b) => a.plausible - b.plausible || b.area - a.area);
  for (const tr of tries.slice(0, 40)) {
    const H = homography(CORNERS(), tr.dst);
    if (!H) continue;
    // Метки — квадраты SHEET.marker мм: их размер на снимке должен подходить к размеру листа.
    // Иначе четыре случайных пятна страницы (кнопки, значки) с вероятностью ~1/256 на попытку
    // давали «сошедшийся» код (CRC-8) — и обычная страница принималась за бланк
    if (!markersFit(H, tr.comps)) continue;
    const code = decodeBits(readCode(gray, H));
    if (code) return { gray, H, code, corners: tr.dst };
  }
  return null;
}

/** Площадь каждого пятна — как у метки SHEET.marker × SHEET.marker мм в этом месте снимка (с запасом на размытие) */
function markersFit(H, comps) {
  return CORNERS().every(([x, y], i) => {
    const c = comps[i];
    if (!c) return false;
    const side = SHEET.marker * pxPerMm(H, x, y);
    const ratio = c.area / (side * side);
    return ratio > 0.3 && ratio < 2.6;
  });
}

/** Выбор по строке кружков */
function pick(values, multiple) {
  const sorted = values.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const top = sorted[0]?.v ?? 0;
  const second = sorted[1]?.v ?? 0;
  const FILLED = 0.3;
  const UNSURE = 0.16;
  const index = sorted[0]?.i ?? -1;
  if (top < UNSURE) return { letters: '', status: 'blank', index: -1 };
  if (multiple) {
    // Карандаш рядом с ручкой светлее, но всё равно явно темнее бумаги
    const cut = Math.max(FILLED, top * 0.4);
    const marked = values.map((v, i) => (v >= cut ? LETTERS[i] : '')).join('');
    const unsure = values.some((v) => v >= UNSURE && v < cut);
    return { letters: marked, status: !marked ? 'unsure' : unsure ? 'unsure' : 'ok', index };
  }
  if (top < FILLED) return { letters: LETTERS[index] || '', status: 'unsure', index };
  if (second >= FILLED && second > top * 0.6) return { letters: values.map((v, i) => (v >= FILLED ? LETTERS[i] : '')).join(''), status: 'multi', index };
  return { letters: LETTERS[index] || '', status: second >= UNSURE && second > top * 0.6 ? 'unsure' : 'ok', index };
}

/**
 * Прочитать ответы и номер ученика с найденного бланка.
 * @param {{gray,H}} det — результат detectSheet
 * @param {Array} items — пункты варианта (buildVariant)
 */
export function readSheet(det, items) {
  const { gray, H } = det;
  const rows = answerRows(items).map((row, i) => {
    if (!row.bubbles) return { n: row.n, kind: 'box', box: row.box };
    const values = row.bubbles.map((b) => darkness(gray, H, b.x, b.y));
    const res = pick(values, items[i].type === 'multiple');
    return { n: row.n, kind: 'bubbles', values, ...res, bubbles: row.bubbles };
  });
  const digits = numberBubbles().map((line) => {
    const values = line.map((b) => darkness(gray, H, b.x, b.y));
    const res = pick(values, false);
    return { digit: res.status === 'blank' ? null : res.index, status: res.status, values };
  });
  const [tens, units] = digits;
  let number = null;
  let numberStatus = 'ok';
  if (units.digit == null) numberStatus = 'blank';
  else number = (tens.digit || 0) * 10 + units.digit;
  if ([tens.status, units.status].some((s) => s === 'multi' || s === 'unsure')) numberStatus = 'unsure';
  if (number === 0) { number = null; numberStatus = 'blank'; }
  return { rows, number, numberStatus };
}

/** Для наложения на фото: мм → координаты исходного изображения */
export function toImage(det, x, y) {
  const [px, py] = project(det.H, x, y);
  return [px / det.gray.scale, py / det.gray.scale];
}

// ─── Печать бланка ───────────────────────────────────────────────────────────

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * SVG бланка (единицы — мм). Текст подписей передаётся уже переведённым.
 * @param {{ testId, questionIds, variant, variantLabel, title, items, labels: { name, number, tens, units, howto, version } }} o
 */
export function sheetSvg(o) {
  const m = SHEET.marker;
  const parts = [];
  const text = (x, y, s, size = 3, extra = '') => parts.push(`<text x="${x}" y="${y}" font-size="${size}" ${extra}>${esc(s)}</text>`);
  // Угловые метки
  [[0, 0], [SHEET.w, 0], [SHEET.w, SHEET.h], [0, SHEET.h]].forEach(([x, y]) => parts.push(`<rect x="${x - m / 2}" y="${y - m / 2}" width="${m}" height="${m}" fill="#000"/>`));
  // Заголовок
  text(8, 8.5, o.title.slice(0, 60), 3.6, 'font-weight="700"');
  text(SHEET.w - 8, 8.5, o.variantLabel, 4.2, 'font-weight="800" text-anchor="end"');
  // Код
  const bits = encodeSheet({ testId: o.testId, variant: o.variant, questionIds: o.questionIds });
  codeCells().forEach((c, i) => { if (bits[i]) parts.push(`<rect x="${c.x - c.size / 2}" y="${c.y - c.size / 2}" width="${c.size}" height="${c.size}" fill="#000"/>`); });
  // Имя и номер ученика
  text(6, 31, `${o.labels.name}:`, 3.2);
  parts.push(`<line x1="26" y1="31.5" x2="76" y2="31.5" stroke="#000" stroke-width="0.3"/>`);
  text(NUM.x0 - 4, 27.5, o.labels.number, 2.8, 'text-anchor="end" font-weight="700"');
  const lines = numberBubbles();
  lines[0].forEach((b, d) => text(b.x, 28.6, String(d), 2.4, 'text-anchor="middle" fill="#555"'));
  [o.labels.tens, o.labels.units].forEach((lab, k) => text(NUM.x0 - 4, NUM.y[k] + 1, lab, 2.6, 'text-anchor="end"'));
  lines.flat().forEach((b) => parts.push(`<circle cx="${b.x}" cy="${b.y}" r="${b.r}" fill="none" stroke="#000" stroke-width="0.3"/>`));
  // Как заполнять
  parts.push(`<circle cx="9" cy="50" r="${BUB.r}" fill="#000"/>`);
  text(14, 51, o.labels.howto, 2.8);
  // Ответы
  answerRows(o.items).forEach((row) => {
    text(row.x + 8, row.y + 1.1, `${row.n}.`, 3, 'text-anchor="end" font-weight="700"');
    if (row.bubbles) {
      row.bubbles.forEach((b) => {
        parts.push(`<circle cx="${b.x}" cy="${b.y}" r="${b.r}" fill="none" stroke="#000" stroke-width="0.3"/>`);
        text(b.x, b.y + 0.8, b.letter, 2.2, 'text-anchor="middle" fill="#b5b5b5"');
      });
    } else {
      parts.push(`<rect x="${row.box.x}" y="${row.box.y}" width="${row.box.w}" height="${row.box.h}" rx="0.8" fill="none" stroke="#000" stroke-width="0.3"/>`);
    }
  });
  text(SHEET.w / 2, SHEET.h - 4, o.labels.version, 2.2, 'text-anchor="middle" fill="#777"');
  const pad = 7; // белое поле вокруг меток: на тёмном столе метка не сливается с фоном
  return `<svg xmlns="http://www.w3.org/2000/svg" class="omr-sheet" viewBox="${-pad} ${-pad} ${SHEET.w + pad * 2} ${SHEET.h + pad * 2}" width="${SHEET.w + pad * 2}mm" height="${SHEET.h + pad * 2}mm" font-family="Inter, Arial, sans-serif" role="img" aria-label="${esc(o.title)}">${parts.join('')}</svg>`;
}
