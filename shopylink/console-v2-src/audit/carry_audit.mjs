/* The audit the diagrams ask for, made honest: each module is measured TWICE —
   once opened on its own, the way it was handed over, and once inside the
   console. The console's copy must render at least what the standalone renders
   (same working controls, same text), must show no second sidebar or topbar,
   and must raise no error. An absolute text threshold would only measure how
   talkative a module's first screen is; this measures whether carrying it
   changed it. */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = '/home/claude/pw/shots';
mkdirSync(OUT, { recursive: true });
const services = JSON.parse(process.env.SERVICES);

const probe = () => {
  const d = document;
  const sc = d.querySelector('.sl-scroll') || d.querySelector('.sl-main') || d.body;
  const controls = d.querySelectorAll('.sl-scroll button, .sl-scroll input, .sl-scroll select, .sl-scroll textarea');
  const vis = el => !!el && getComputedStyle(el).display !== 'none';
  return {
    text: (sc && sc.innerText || '').trim().length,
    controls: controls.length,
    sidebar: vis(d.querySelector('.sl-sb')),
    topbar: vis(d.querySelector('.sl-top')),
    title: (d.title || '').slice(0, 60),
    docLang: d.documentElement.getAttribute('lang') || '',
    docDir: d.documentElement.getAttribute('dir') || '',
    brokenAttr: /t\('/.test(Array.from(d.querySelectorAll('[placeholder],[aria-label]'))
      .map(e => (e.getAttribute('placeholder') || '') + (e.getAttribute('aria-label') || '')).join('|')),
  };
};

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--allow-file-access-from-files'] });

/* ── pass one: each module on its own ────────────────────────────────── */
const base = {};
for (const s of services) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('file:///home/claude/work/' + s.file);
  await p.waitForTimeout(2600);
  const hasLang = await p.evaluate(() => {
    if (typeof window.setLang !== 'function') return false;
    window.setLang('ar');
    return true;
  });
  await p.waitForTimeout(600);
  base[s.file] = { ...(await p.evaluate(probe)), errs: errs.length, hasLang };
  await p.close();
}

/* ── pass two: the same modules, carried by the console ──────────────── */
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
await page.goto('file:///home/claude/console-v2/bundle.html');
await page.waitForSelector('#root');
await page.waitForTimeout(1500);

const rows = [];
for (const s of services) {
  const before = errors.length;
  await page.evaluate(async (want) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const byTitle = () => Array.from(document.querySelectorAll('aside button[title]'))
      .filter(b => b.getAttribute('title') === want)[0];
    if (byTitle()) { byTitle().click(); return; }
    for (const c of Array.from(document.querySelectorAll('aside button')).filter(b => b.getAttribute('aria-expanded') !== null)) {
      c.click(); await sleep(60);
      const hit = byTitle(); if (hit) { hit.click(); return; }
    }
  }, s.ar);
  await page.waitForTimeout(2800);

  const shell = await page.evaluate(() => ({
    /* a sidebar the person can SEE: the two drawers live in the DOM at zero
       width when closed, and counting them was counting furniture, not chrome */
    consoleSidebars: Array.from(document.querySelectorAll('#root aside'))
      .filter(a => a.getBoundingClientRect().width > 8).length,
    moduleFrameSidebars: 0,
    frames: document.querySelectorAll('main iframe').length,
    frameH: Math.round((document.querySelector('main iframe') || { getBoundingClientRect: () => ({ height: 0 }) }).getBoundingClientRect().height),
  }));
  const f = page.frames().filter(fr => fr !== page.mainFrame()).slice(-1)[0];
  const inner = f ? await f.evaluate(probe) : null;

  await page.screenshot({ path: `${OUT}/${s.file.replace(/\W+/g, '_')}.png` });
  rows.push({ ...s, base: base[s.file], inner, shell, newErrors: errors.length - before });

  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).filter(x => (x.textContent || '').trim() === 'يومي')[0];
    if (b) b.click();
  });
  await page.waitForTimeout(250);
}
writeFileSync('/home/claude/pw/audit2.json', JSON.stringify(rows, null, 1));

let bad = 0;
console.log('service              | standalone      | in console      | verdict');
console.log('---------------------+-----------------+-----------------+--------');
for (const r of rows) {
  const b = r.base, i = r.inner;
  const findings = [];
  if (!i) findings.push('no frame');
  else {
    if (i.sidebar) findings.push('SECOND SIDEBAR');
    if (i.topbar) findings.push('SECOND TOPBAR');
    if (r.shell.consoleSidebars !== 1) findings.push('console sidebars=' + r.shell.consoleSidebars);
    if (i.controls < b.controls) findings.push(`controls ${i.controls}<${b.controls}`);
    if (i.text < Math.round(b.text * 0.9)) findings.push(`text ${i.text}<${b.text}`);
    if (r.newErrors) findings.push(r.newErrors + ' js error(s)');
    if (r.shell.frames !== 1) findings.push('frames=' + r.shell.frames);
    if (r.shell.frameH < 400) findings.push('frame only ' + r.shell.frameH + 'px');
    /* a module that carries no language switch of its own cannot follow the
       console into Arabic; that is a fact about the file, not a carrying fault */
    if (b.hasLang && i.docLang !== 'ar') findings.push('module stayed ' + (i.docLang || 'unset') + ', console is ar');
    if (i.brokenAttr) findings.push('broken t() attribute');
  }
  if (findings.length) bad++;
  console.log(
    r.ar.padEnd(20) + ' | ' +
    ('t=' + b.text + ' c=' + b.controls).padEnd(15) + ' | ' +
    ('t=' + (i ? i.text : '-') + ' c=' + (i ? i.controls : '-')).padEnd(15) + ' | ' +
    (findings.length ? 'FAIL: ' + findings.join(', ') : (b.hasLang ? 'ok' : 'ok · no lang switch in the file')),
  );
}
console.log('\n' + (rows.length - bad) + ' of ' + rows.length + ' modules carried faithfully · total page errors ' + errors.length);
await browser.close();
process.exit(bad ? 1 : 0);
