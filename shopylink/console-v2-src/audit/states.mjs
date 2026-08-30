/* The layout must hold in every state the console can be in, not only the one
   that looks good in a screenshot. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const cases = [
  { w: 1440, h: 900, state: 'طبيعي' },
  { w: 1440, h: 900, state: '+٥٠٠' },
  { w: 1440, h: 900, state: 'فارغ' },
  { w: 1440, h: 900, state: 'خطأ' },
  { w: 1440, h: 900, state: 'تحميل' },
  { w: 1120, h: 900, state: 'طبيعي' },
  { w: 1440, h: 620, state: 'طبيعي' },
];
for (const c of cases) {
  const p = await b.newPage({ viewport: { width: c.w, height: c.h } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 100)));
  await p.goto('file:///home/claude/console-v2/bundle.html');
  await p.waitForSelector('#root'); await p.waitForTimeout(1500);
  if (c.state !== 'طبيعي') {
    await p.evaluate((s) => { const b2 = Array.from(document.querySelectorAll('button')).filter(x => (x.textContent||'').trim() === s)[0]; if (b2) b2.click(); }, c.state);
    await p.waitForTimeout(900);
  }
  const m = await p.evaluate(() => ({
    hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    vScrollBody: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
    rows: document.querySelectorAll('.sl-row').length,
    clipped: (() => {
      const bad = [];
      document.querySelectorAll('#root button, #root section').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.height > 8 && r.bottom > window.innerHeight + 2 && !el.closest('.sl-scroll-col,.sl-panel-body,aside')) bad.push((el.textContent||'').trim().slice(0,20));
      });
      return bad.slice(0, 3);
    })(),
  }));
  console.log(`${String(c.w)}×${c.h} · ${c.state.padEnd(7)} rows=${String(m.rows).padEnd(4)} page-scroll=${m.vScrollBody ? 'yes' : 'no '} h-scroll=${m.hScroll ? 'YES!' : 'no'} err=${errs.length} ${m.clipped.length ? 'CLIPPED: ' + m.clipped.join(' | ') : ''}`);
  await p.close();
}
await b.close();
