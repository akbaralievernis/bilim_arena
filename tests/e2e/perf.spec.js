// Скорость первого открытия на слабом телефоне и медленной сети (3G, процессор в 4 раза медленнее).
// Только по явному запросу: npx playwright test --project=perf
import { test, expect } from '@playwright/test';

const PAGES = ['index', 'play', 'practice', 'tasks', 'report', 'teacher', 'board'];
// Порог для первой отрисовки содержимого на «3G»: страница должна стать полезной быстро
const LCP_LIMIT_MS = 6000;

test('pages become usable quickly on a slow phone and 3G', async ({ browser }) => {
  test.setTimeout(300_000);
  const rows = [];
  for (const name of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let bytes = 0;
    const heavy = [];
    cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; });
    cdp.on('Network.responseReceived', (e) => { if (e.response.encodedDataLength > 60_000) heavy.push(e.response.url); });
    await page.addInitScript(() => {
      window.__lcp = 0;
      new PerformanceObserver((l) => { const e = l.getEntries().at(-1); if (e) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    const t0 = Date.now();
    await page.goto(`/${name}.html`, { waitUntil: 'load' });
    const loadMs = Date.now() - t0;
    await page.waitForTimeout(1500);
    const lcp = Math.round(await page.evaluate(() => window.__lcp));
    rows.push({ name, lcp, loadMs, kb: Math.round(bytes / 1024), heavy: heavy.map((u) => u.replace(/^.*\/\//, '').slice(0, 60)) });
    await ctx.close();
  }
  console.log(rows.map((r) => `${r.name.padEnd(9)} LCP ${String(r.lcp).padStart(5)} ms · load ${String(r.loadMs).padStart(5)} ms · ${String(r.kb).padStart(4)} KB${r.heavy.length ? ` · heavy: ${r.heavy.join(', ')}` : ''}`).join('\n'));
  for (const r of rows) expect(r.lcp, `${r.name}: largest paint`).toBeLessThan(LCP_LIMIT_MS);
});
