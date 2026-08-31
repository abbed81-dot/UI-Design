/* ── can a person actually TYPE in it? ──────────────────────────────────
   A field that redraws the screen on every keystroke replaces the very node
   being typed into: focus falls to the body and the second character goes
   nowhere. Nothing static finds that — the handler may be named anything —
   so every text box in every module is typed into the way a person types,
   one keystroke at a time, and the field is asked what it kept. */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TYPE = 'input[type=text], input[type=search], input[type=tel], input[type=email], input:not([type]), textarea';
const WORD = 'دمشق';

const files = readFileSync('/tmp/mods.txt', 'utf8').trim().split('\n');
const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const report = [];

for (const f of files) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route('**/*', r => (/^file:/.test(r.request().url()) ? r.continue() : r.abort()));
  await p.goto('file:///home/claude/work/' + f, { waitUntil: 'load' });
  await p.waitForTimeout(650);
  await p.evaluate(() => { try { setLang('ar'); } catch {} });
  const nS = await p.evaluate(() => document.querySelectorAll('.sl-sim-btn').length);
  const mod = { file: f, tested: 0, broken: [] };

  for (let s = 0; s < Math.max(nS, 1); s++) {
    if (nS) { await p.evaluate(i => { const x = document.querySelectorAll('.sl-sim-btn')[i]; if (x) x.click(); }, s); }
    await p.waitForTimeout(300);
    const n = await p.evaluate(sel => Array.from(document.querySelectorAll(sel))
      .filter(e => e.offsetParent !== null && !e.disabled && !e.readOnly).length, TYPE);

    for (let i = 0; i < Math.min(n, 8); i++) {
      /* a fresh screen each time: a redraw can renumber the boxes */
      if (nS) { await p.evaluate(k => { const x = document.querySelectorAll('.sl-sim-btn')[k]; if (x) x.click(); }, s); await p.waitForTimeout(220); }
      const meta = await p.evaluate(([sel, idx]) => {
        const el = Array.from(document.querySelectorAll(sel))
          .filter(e => e.offsetParent !== null && !e.disabled && !e.readOnly)[idx];
        if (!el) return null;
        el.setAttribute('data-sl-typing-probe', '1');
        return { id: el.id || '', ph: el.getAttribute('placeholder') || '', tag: el.tagName };
      }, [TYPE, i]);
      if (!meta) continue;
      mod.tested++;
      try {
        await p.click('[data-sl-typing-probe="1"]', { timeout: 1500 });
        /* start from empty, so a field that arrives pre-filled is not counted
           as having eaten the keystrokes */
        await p.evaluate(() => { const e = document.querySelector('[data-sl-typing-probe="1"]'); if (e) e.value = ''; });
        for (const ch of WORD) { await p.keyboard.type(ch); await p.waitForTimeout(90); }
      } catch { /* unclickable is a different defect; the value read below tells */ }
      /* the redraw replaces the node, so the box is found again the way a
         person finds it: by its id, or by the words printed inside it */
      const got = await p.evaluate((meta) => {
        let el = document.querySelector('[data-sl-typing-probe="1"]');
        if (!el && meta.id) el = document.getElementById(meta.id);
        if (!el && meta.ph) el = Array.from(document.querySelectorAll('input,textarea'))
          .filter(e => e.getAttribute('placeholder') === meta.ph)[0];
        return {
          value: el ? el.value : null,
          gone: !el,
          focused: !!el && document.activeElement === el,
          active: document.activeElement ? (document.activeElement.id || document.activeElement.tagName) : '-',
        };
      }, meta);
      if (got.value !== WORD) {
        mod.broken.push({ screen: s + 1, id: meta.id, placeholder: meta.ph.slice(0, 30),
          typed: WORD, kept: got.gone ? '(box not found)' : got.value, focused: got.focused, active: got.active });
      }
      await p.evaluate(() => { const e = document.querySelector('[data-sl-typing-probe="1"]'); if (e) e.removeAttribute('data-sl-typing-probe'); });
    }
  }
  report.push(mod);
  console.log((mod.broken.length ? '⚠' : '✓') + ' ' + f.replace('ShopyLink_','').replace('.html','').padEnd(30)
    + ' typed into ' + String(mod.tested).padStart(3) + ' boxes · lost input in ' + String(mod.broken.length).padStart(2));
  await p.close();
}
await b.close();
writeFileSync('/home/claude/pw/typing.json', JSON.stringify(report, null, 1));
const T = report.reduce((a,m)=>a+m.tested,0), B = report.reduce((a,m)=>a+m.broken.length,0);
console.log('\n' + T + ' text boxes typed into across 22 modules · ' + B + ' did not keep what was typed');
for (const m of report) for (const x of m.broken)
  console.log('  ' + m.file.replace('ShopyLink_','').replace('.html','') + ' [screen ' + x.screen + '] '
    + (x.id ? '#' + x.id : '"' + x.placeholder + '"') + '  typed ' + x.typed + ' → kept ' + JSON.stringify(x.kept)
    + '  focus now: ' + x.active);
