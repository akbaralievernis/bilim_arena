/**
 * Bilim Arena — картинки в вопросах учителя.
 *
 * Картинка хранится внутри вопроса (data URL), поэтому её размер важен:
 * хранилище браузера ~5 МБ на весь сайт, вопросы ещё и уходят в облако.
 * Сжимаем до MAX_SIDE по длинной стороне (WebP, если браузер умеет, иначе JPEG),
 * а слишком большие — ещё сильнее. Картинка на экране — с подписью для диктора.
 */

export const MAX_SIDE = 800;
export const MAX_BYTES = 180 * 1024;

/** Размер data URL в байтах (base64 → ×3/4) */
export const dataUrlBytes = (url) => Math.round(((String(url).split(',')[1] || '').length * 3) / 4);

function encode(canvas, quality) {
  const webp = canvas.toDataURL('image/webp', quality);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality);
}

/**
 * Файл картинки → сжатый data URL.
 * @returns {Promise<{ url: string, bytes: number, width: number, height: number }>}
 */
export async function compressImage(file) {
  if (!file || !/^image\//.test(file.type)) throw new Error('not-image');
  const bmp = await createImageBitmap(file);
  let side = MAX_SIDE;
  let quality = 0.72;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, side / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    // Белый фон: у прозрачных PNG в JPEG иначе получится чёрный
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    const url = encode(canvas, quality);
    const bytes = dataUrlBytes(url);
    if (bytes <= MAX_BYTES) return { url, bytes, width: w, height: h };
    side = Math.round(side * 0.8);
    quality = Math.max(0.5, quality - 0.06);
  }
  throw new Error('too-big');
}

/** Можно показывать только свои картинки: data URL или файл сайта (защита от чужих ссылок) */
export const safeImageSrc = (src) => (typeof src === 'string' && (/^data:image\/(png|jpe?g|webp|gif);base64,/.test(src) || /^\.\/(assets|data)\//.test(src)) ? src : null);

/** Поставить картинку вопроса в контейнер (или убрать) */
export function setPromptImage(host, src, alt = '') {
  if (!host) return;
  const ok = safeImageSrc(src);
  if (!ok) { host.replaceChildren(); host.hidden = true; return; }
  const img = document.createElement('img');
  img.src = ok;
  img.alt = alt;
  img.decoding = 'async';
  img.className = 'prompt-image';
  host.replaceChildren(img);
  host.hidden = false;
}
