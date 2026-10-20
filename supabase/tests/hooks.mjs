// Загрузчик для теста: модули проекта — отдельная копия на «устройство».
// supabase-js подменяется в cloud.test.mjs через window.supabase (core/cloud.js берёт его оттуда)
const PROJECT = new URL('../../', import.meta.url).href;

export async function resolve(specifier, context, next) {
  const r = await next(specifier, context);
  const dev = context.parentURL ? new URL(context.parentURL).searchParams.get('device') : null;
  if (dev && r.url.startsWith('file:') && r.url.startsWith(PROJECT) && !r.url.includes('?device=')) {
    const u = new URL(r.url);
    u.searchParams.set('device', dev);
    return { ...r, url: u.href };
  }
  return r;
}
