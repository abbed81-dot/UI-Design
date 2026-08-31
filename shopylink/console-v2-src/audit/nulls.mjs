/* ── no screen may print the word "null" ─────────────────────────────────
   A value that is legitimately absent — no id before anyone signs in, no hub
   on a person, no timezone for a hub that is a city rather than a port, a trip
   number before the trip is declared — reaches the screen as the literal text
   "null" the moment it is concatenated into a template. It reads as a fault in
   the software to the person looking at it. Every screen of every module is
   swept for it, and for its two relatives, "undefined" and "NaN". */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const files = readFileSync('/tmp/mods.txt', 'utf8').trim().split('\n');
const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
let total = 0;
for (const f of files) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route('**/*', r => (/^file:/.test(r.request().url()) ? r.continue() : r.abort()));
  await p.goto('file:///home/claude/work/' + f, { waitUntil: 'load' });
  await p.waitForTimeout(650);
  await p.evaluate(() => { try { setLang('ar'); } catch {} document.documentElement.setAttribute('lang','ar'); });
  const n = await p.evaluate(() => document.querySelectorAll('.sl-sim-btn').length);
  const hits = [];
  for (let s = 0; s < Math.max(n, 1); s++) {
    if (n) { await p.evaluate(i => { const x = document.querySelectorAll('.sl-sim-btn')[i]; if (x) x.click(); }, s); }
    await p.waitForTimeout(320);
    const found = await p.evaluate(() => {
      const bad = /(^|[^A-Za-z])(null|undefined|NaN)([^A-Za-z]|$)/;
      const out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = w.nextNode())) {
        const v = node.nodeValue || '';
        if (!bad.test(v)) continue;
        const par = node.parentElement;
        if (!par || par.offsetParent === null || par.closest('script,style')) continue;
        out.push(v.trim().replace(/\s+/g, ' ').slice(0, 50));
      }
      for (const el of document.querySelectorAll('input,select,textarea')) {
        if (el.offsetParent && bad.test(el.value || '')) out.push('value: ' + el.value);
      }
      return out;
    });
    for (const h of found) hits.push('screen ' + (s + 1) + ': ' + h);
  }
  total += hits.length;
  console.log((hits.length ? '⚠' : '✓') + ' ' + f.replace('ShopyLink_','').replace('.html','').padEnd(30)
    + ' screens ' + String(Math.max(n,1)).padStart(2) + ' · nulls on screen ' + hits.length);
  for (const h of hits) console.log('      ' + h);
  await p.close();
}
await b.close();
console.log('\n' + total + ' absent values printed as words across 22 modules, every screen');
