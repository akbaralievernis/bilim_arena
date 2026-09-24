// Загрузчик для теста: CDN supabase-js → мок; модули проекта — отдельная копия на «устройство»
const MOCK = new URL('./mock-supabase.mjs', import.meta.url).href;
const PROJECT = new URL('../../', import.meta.url).href;

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('https://cdn.jsdelivr.net/npm/@supabase/supabase-js')) return { url: MOCK, shortCircuit: true };
  const r = await next(specifier, context);
  const dev = context.parentURL ? new URL(context.parentURL).searchParams.get('device') : null;
  if (dev && r.url.startsWith('file:') && r.url.startsWith(PROJECT) && !r.url.includes('?device=')) {
    const u = new URL(r.url);
    u.searchParams.set('device', dev);
    return { ...r, url: u.href };
  }
  return r;
}
