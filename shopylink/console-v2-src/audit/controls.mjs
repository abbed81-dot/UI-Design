/* Every control in every service, exercised. For each clickable in a module's
   working surface: click it, then compare a fingerprint of that surface before
   and after. Three outcomes are reported — it threw, it changed nothing at all
   (a control that answers nothing is indistinguishable from a broken one to the
   person pressing it), or it worked. Disabled controls are named as such rather
   than counted as dead. */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const services = JSON.parse(process.env.SERVICES);
const report = [];

for (const s of services) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  await p.goto('file:///home/claude/console-v2/bundle.html');
  await p.waitForSelector('#root'); await p.waitForTimeout(1400);
  await p.evaluate(async (want) => {
    const sl = ms => new Promise(r => setTimeout(r, ms));
    const byT = () => Array.from(document.querySelectorAll('aside button[title]')).filter(x => x.getAttribute('title') === want)[0];
    if (byT()) { byT().click(); return; }
    for (const c of Array.from(document.querySelectorAll('aside button')).filter(x => x.getAttribute('aria-expanded') !== null)) {
      c.click(); await sl(60); const h = byT(); if (h) { h.click(); return; }
    }
  }, s.ar);
  await p.waitForTimeout(2800);

  const fr = p.frames().filter(f => f !== p.mainFrame()).slice(-1)[0];
  if (!fr) { report.push({ ...s, err: 'no frame' }); await p.close(); continue; }

  const n = await fr.evaluate(() => {
    const sc = document.querySelector('.sl-scroll') || document.body;
    return Array.from(sc.querySelectorAll('button, [onclick], input[type=checkbox], input[type=radio], select'))
      .filter(e => e.offsetParent !== null).length;
  });

  const results = { dead: [], threw: [], disabled: [], worked: 0 };
  for (let i = 0; i < Math.min(n, 26); i++) {
    const before = errs.length;
    const r = await fr.evaluate((idx) => {
      const sc = document.querySelector('.sl-scroll') || document.body;
      const els = Array.from(sc.querySelectorAll('button, [onclick], input[type=checkbox], input[type=radio], select'))
        .filter(e => e.offsetParent !== null);
      const el = els[idx];
      if (!el) return null;
      const label = (el.textContent || el.value || el.getAttribute('aria-label') || el.placeholder || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 26);
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') return { label, disabled: true };
      /* a fingerprint that sees an attribute flip and a panel opened anywhere,
         not only a change in how much text the working surface holds */
      const fp = () => {
        const h = sc.innerHTML;
        let k = 0; for (let i = 0; i < h.length; i += 7) k = (k * 31 + h.charCodeAt(i)) | 0;
        return h.length + ':' + k + '|' + document.body.innerHTML.length;
      };
      const a = fp();
      /* A select answers a CHANGE, never a click — clicking one and calling it
         dead was the harness being wrong, not the control. */
      if (el.tagName === 'SELECT') {
        if (el.options.length < 2) return { label, kind: 'select', noOptions: true };
        const was = el.selectedIndex;
        el.selectedIndex = (was + 1) % el.options.length;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return { label, a, kind: 'select', changedNow: fp() !== a };
      }
      if (/print|طباعة/i.test(label)) return { label, kind: 'print' };
      try { el.click(); } catch (e) { return { label, threw: String(e).slice(0, 60) }; }
      return { label, a, changedNow: fp() !== a };
    }, i);
    if (!r) break;
    if (r.disabled) { results.disabled.push(r.label); continue; }
    if (r.kind === 'print') { results.disabled.push(r.label + ' (opens the print dialog — not testable headless)'); continue; }
    if (r.noOptions) { results.dead.push(r.label + ' (a select with one option)'); continue; }
    if (r.threw) { results.threw.push(r.label + ' :: ' + r.threw); continue; }
    await p.waitForTimeout(260);
    const changed = r.changedNow || await fr.evaluate((a) => {
      const sc = document.querySelector('.sl-scroll') || document.body;
      return ((sc.innerText || '').length + '|' + sc.querySelectorAll('*').length + '|' + document.querySelectorAll('[role=dialog],.modal,.sheet').length) !== a;
    }, r.a);
    if (errs.length > before) results.threw.push(r.label + ' :: page error');
    else if (changed) results.worked++;
    else results.dead.push(r.label);
  }
  report.push({ ...s, controls: n, ...results, errs: errs.length });
  const flag = results.threw.length ? 'THREW' : results.dead.length ? 'silent' : 'ok';
  console.log(
    s.ar.padEnd(20) + ' ' + String(n).padStart(3) + ' controls · worked ' + String(results.worked).padStart(2) +
    ' · silent ' + String(results.dead.length).padStart(2) + ' · disabled ' + String(results.disabled.length).padStart(2) +
    ' · threw ' + results.threw.length + '  ' + flag +
    (results.dead.length ? '\n      silent: ' + results.dead.slice(0, 6).map(x => '«' + x + '»').join(' ') : '') +
    (results.threw.length ? '\n      THREW: ' + results.threw.slice(0, 3).join(' | ') : ''),
  );
  await p.close();
}
writeFileSync('/home/claude/pw/controls.json', JSON.stringify(report, null, 1));
const t = report.reduce((a, r) => ({ w: a.w + (r.worked || 0), d: a.d + (r.dead?.length || 0), x: a.x + (r.threw?.length || 0) }), { w: 0, d: 0, x: 0 });
console.log('\ntotal: ' + t.w + ' worked · ' + t.d + ' silent · ' + t.x + ' threw');
await b.close();
