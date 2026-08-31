/* ── are the boxes balanced? ────────────────────────────────────────────
   Two controls are ROW-MATES when they stand side by side — their horizontal
   spans do not overlap — and their vertical spans still touch. Such a pair is
   balanced when it shares a top edge and a height. Two failures are measured,
   and neither is a matter of taste:

     · DROPPED  — one box's top edge sits below its row-mate's: the box has
                  fallen below the line;
     · UNEVEN   — same line, two different box heights.

   Every module is opened exactly as delivered, driven through every screen its
   own switcher offers, and measured in Arabic and in English, because the two
   directions do not lay out the same and the defect this audit was written for
   exists in only one of them. */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CTL = 'input:not([type=hidden]):not([type=file]), select, textarea';

const MEASURE = `(() => {
  const vis = e => e.offsetParent !== null && e.getBoundingClientRect().width > 8;
  const cs = Array.from(document.querySelectorAll(${JSON.stringify(CTL)})).filter(vis);
  const info = cs.map(c => {
    const r = c.getBoundingClientRect();
    /* the label a person reads above or beside the box */
    let lab = '';
    for (let n = c.parentElement, d = 0; n && d < 3 && !lab; n = n.parentElement, d++) {
      const l = n.querySelector('.fl-label, label, .fl, .f-lbl');
      if (l) lab = l.textContent.trim().replace(/\\s+/g, ' ');
    }
    return {
      label: (lab || c.getAttribute('placeholder') || c.name || c.id || c.tagName).slice(0, 26),
      type: c.getAttribute('type') || c.tagName.toLowerCase(),
      req: !!(c.closest('.fg, .f-row, div') && c.closest('.fg, .f-row, div').querySelector('.fl-req')),
      t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right),
      h: Math.round(r.height), w: Math.round(r.width),
    };
  });
  const pairs = [];
  for (let i = 0; i < info.length; i++) for (let j = i + 1; j < info.length; j++) {
    const a = info[i], d = info[j];
    const sideBySide = a.r <= d.l + 2 || d.r <= a.l + 2;
    const bandsTouch = Math.min(a.b, d.b) - Math.max(a.t, d.t) > 0;
    if (!sideBySide || !bandsTouch) continue;
    pairs.push({
      sig: a.label + ' ⇔ ' + d.label,
      drop: Math.abs(a.t - d.t),
      hGap: Math.abs(a.h - d.h),
      a: { label: a.label, type: a.type, req: a.req, top: a.t, h: a.h, w: a.w },
      b: { label: d.label, type: d.type, req: d.req, top: d.t, h: d.h, w: d.w },
    });
  }
  return pairs;
})()`;

const files = readFileSync('/tmp/mods.txt', 'utf8').trim().split('\n');
const report = [];
const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

for (const f of files) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route('**/*', r => (/^file:/.test(r.request().url()) ? r.continue() : r.abort()));
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 90)));
  await p.goto('file:///home/claude/work/' + f, { waitUntil: 'load' });
  await p.waitForTimeout(650);

  const nS = await p.evaluate(() => document.querySelectorAll('.sl-sim-btn').length);
  const mod = { file: f, screens: Math.max(nS, 1), pairs: 0, dropped: [], uneven: [], errs };
  const seen = new Set();

  for (const lang of ['ar', 'en']) {
    await p.evaluate(l => { try { setLang(l); } catch {} }, lang);
    await p.waitForTimeout(220);
    for (let s = 0; s < Math.max(nS, 1); s++) {
      if (nS) { await p.evaluate(i => { const x = document.querySelectorAll('.sl-sim-btn')[i]; if (x) x.click(); }, s); }
      await p.waitForTimeout(300);
      let pairs = [];
      try { pairs = await p.evaluate(MEASURE); } catch (e) { errs.push(String(e).slice(0, 70)); continue; }
      for (const pr of pairs) {
        const key = lang + '#' + pr.sig;
        if (seen.has(key)) continue;
        seen.add(key); mod.pairs++;
        const where = lang + ' · screen ' + (s + 1);
        if (pr.drop > 2) mod.dropped.push({ where, ...pr });
        else if (pr.hGap > 2) mod.uneven.push({ where, ...pr });
      }
    }
  }
  report.push(mod);
  console.log((mod.dropped.length ? '⚠' : (mod.uneven.length ? '·' : '✓')) + ' '
    + f.replace('ShopyLink_', '').replace('.html', '').padEnd(30)
    + ' screens ' + String(mod.screens).padStart(2)
    + ' · pairs ' + String(mod.pairs).padStart(3)
    + ' · dropped ' + String(mod.dropped.length).padStart(3)
    + ' · uneven ' + String(mod.uneven.length).padStart(3));
  await p.close();
}
await b.close();
writeFileSync('/home/claude/pw/fields.json', JSON.stringify(report, null, 1));
const P = report.reduce((a, m) => a + m.pairs, 0);
const D = report.reduce((a, m) => a + m.dropped.length, 0);
const U = report.reduce((a, m) => a + m.uneven.length, 0);
console.log('\n' + P + ' side-by-side box pairs measured across ' + report.length
  + ' modules, Arabic and English · ' + D + ' dropped · ' + U + ' uneven');
if (D) { console.log('\nDROPPED:'); for (const m of report) for (const d of m.dropped)
  console.log('  ' + m.file.replace('ShopyLink_','').replace('.html','') + '  [' + d.where + ']  '
    + d.sig + '   drop ' + d.drop + 'px   (' + d.a.type + ' top ' + d.a.top + (d.a.req?' *':'')
    + '  |  ' + d.b.type + ' top ' + d.b.top + (d.b.req?' *':'') + ')'); }
if (U) { console.log('\nUNEVEN:'); for (const m of report) for (const u of m.uneven)
  console.log('  ' + m.file.replace('ShopyLink_','').replace('.html','') + '  [' + u.where + ']  '
    + u.sig + '   ' + u.a.type + ' ' + u.a.h + 'px  vs  ' + u.b.type + ' ' + u.b.h + 'px'); }
