/* With the console in Arabic, how much English does each module still show?
   This measures the MODULES' own dictionaries, not the carrying — it is the
   list of what is still to be translated, module by module. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const services = JSON.parse(process.env.SERVICES);
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('file:///home/claude/console-v2/bundle.html');
await p.waitForSelector('#root'); await p.waitForTimeout(1500);
const rows = [];
for (const s of services) {
  await p.evaluate(async (want) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const byTitle = () => Array.from(document.querySelectorAll('aside button[title]')).filter(b => b.getAttribute('title') === want)[0];
    if (byTitle()) { byTitle().click(); return; }
    for (const c of Array.from(document.querySelectorAll('aside button')).filter(b => b.getAttribute('aria-expanded') !== null)) {
      c.click(); await sleep(60);
      const h = byTitle(); if (h) { h.click(); return; }
    }
  }, s.ar);
  await p.waitForTimeout(2600);
  const f = p.frames().filter(fr => fr !== p.mainFrame()).slice(-1)[0];
  const r = f ? await f.evaluate(() => {
    const sc = document.querySelector('.sl-scroll') || document.body;
    const text = (sc.innerText || '');
    /* words of three or more Latin letters, minus the ones that are meant to
       stay Latin: codes, units and proper names the brand keeps in English */
    const keep = /^(SL|TRP|CON|AWB|VGM|CMR|HS|UAE|SY|TR|kg|cm|USD|SYP|TRY|EUR|ShopyLink|SIMULATE)$/i;
    const words = (text.match(/[A-Za-z][A-Za-z.']{2,}/g) || []).filter(w => !keep.test(w));
    const uniq = [...new Set(words)];
    const arabic = (text.match(/[؀-ۿ]/g) || []).length;
    return { latinWords: words.length, uniq: uniq.slice(0, 8), arabicChars: arabic };
  }) : null;
  rows.push({ ...s, ...r });
  await p.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).filter(x => (x.textContent || '').trim() === 'يومي')[0]; if (b) b.click(); });
  await p.waitForTimeout(220);
}
rows.sort((a, b2) => (b2.latinWords || 0) - (a.latinWords || 0));
console.log('module               | english words left | examples');
console.log('---------------------+--------------------+---------');
for (const r of rows) console.log(r.ar.padEnd(20) + ' | ' + String(r.latinWords).padStart(4) + '               | ' + (r.uniq || []).join(', '));
const total = rows.reduce((a, r) => a + (r.latinWords || 0), 0);
console.log('\ntotal English words still shown in the Arabic build: ' + total);
await b.close();
