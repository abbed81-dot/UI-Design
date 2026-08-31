/* Every English string the Arabic build still SHOWS — not words, whole strings,
   the way a person reads them, so each one can be given an Arabic twin. Every
   screen of every module, plus placeholders, titles and labels, which no
   text-node walk would ever see. Machine values are excluded by rule: codes,
   money, units, links, filenames, brand names. */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const PICK = `(() => {
  const KEEP = /^(SL|TRP|CON|AWB|MAWB|HAWB|MBL|HBL|VGM|CMR|TIR|POL|POD|POD?|HS|ETD|ETA|LCL|FCL|UAE|KSA|SY|TR|AE|JO|kg|cm|m3|USD|SYP|TRY|AED|EUR|ShopyLink|SOLAS|IMO|DAM|DXB|LTK|ALP|JEA|FZ|MSC|CMA|CGM|Maersk|Hapag|Lloyd)$/i;
  const MACHINE = /^[\\s\\d.,:%×\\/+\\-–—·|()\\[\\]]*$/;
  const CODE = /^[A-Z]{2,6}[-–][A-Za-z0-9-]+$/;
  const LINKY = /@|https?:|www\\.|\\.(com|net|org|ae|sy|io|html|js|css)\\b/i;
  const ARABIC = /[\\u0600-\\u06FF]/;
  const out = new Set();
  const take = (raw) => {
    if (!raw) return;
    const t = String(raw).trim().replace(/\\s+/g, ' ');
    if (!t || t.length < 2 || t.length > 120) return;
    if (ARABIC.test(t) || MACHINE.test(t) || CODE.test(t) || LINKY.test(t)) return;
    /* must carry a real Latin word of three letters or more */
    const words = t.match(/[A-Za-z][A-Za-z'’.]{2,}/g) || [];
    if (!words.length) return;
    if (words.every(w => KEEP.test(w.replace(/[.'’]/g, '')))) return;
    out.add(t);
  };
  const vis = (el) => el && el.offsetParent !== null;
  /* the words drawn on the screen */
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())) {
    const par = n.parentElement;
    if (!par || par.closest('script, style, .sl-sb, .sl-top')) continue;
    if (!vis(par)) continue;
    take(n.nodeValue);
  }
  /* and the words that live in attributes, which no text walk can reach */
  for (const el of Array.from(document.querySelectorAll('[placeholder], [title], [aria-label], option'))) {
    if (el.tagName !== 'OPTION' && !vis(el)) continue;
    take(el.getAttribute('placeholder'));
    take(el.getAttribute('title'));
    take(el.getAttribute('aria-label'));
    if (el.tagName === 'OPTION') take(el.textContent);
  }
  return Array.from(out);
})()`;

const files = readFileSync('/tmp/mods.txt', 'utf8').trim().split('\n');
const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const found = new Map();   /* string -> Set(module) */

for (const f of files) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route('**/*', r => (/^file:/.test(r.request().url()) ? r.continue() : r.abort()));
  await p.goto('file:///home/claude/work/' + f, { waitUntil: 'load' });
  await p.waitForTimeout(700);
  await p.evaluate(() => { try { setLang('ar'); } catch {} });
  await p.waitForTimeout(400);
  const nS = await p.evaluate(() => document.querySelectorAll('.sl-sim-btn').length);
  let mine = 0;
  for (let s = 0; s < Math.max(nS, 1); s++) {
    if (nS) { await p.evaluate(i => { const x = document.querySelectorAll('.sl-sim-btn')[i]; if (x) x.click(); }, s); }
    await p.waitForTimeout(420);
    let list = [];
    try { list = await p.evaluate(PICK); } catch (e) { console.log('  (' + f + ' screen ' + (s+1) + ': ' + String(e).slice(0,50) + ')'); }
    for (const t of list) {
      if (!found.has(t)) found.set(t, new Set());
      found.get(t).add(f.replace('ShopyLink_', '').replace('.html', ''));
      mine++;
    }
  }
  console.log(f.replace('ShopyLink_','').replace('.html','').padEnd(30) + ' screens ' + String(Math.max(nS,1)).padStart(2) + ' · english strings seen ' + mine);
  await p.close();
}
await b.close();
const rows = Array.from(found.entries())
  .map(([t, mods]) => ({ text: t, modules: Array.from(mods) }))
  .sort((a, b2) => b2.modules.length - a.modules.length || a.text.localeCompare(b2.text));
writeFileSync('/home/claude/i18n/harvest.json', JSON.stringify(rows, null, 1));
console.log('\n' + rows.length + ' distinct English strings still shown in the Arabic build');
