/* Contrast, measured rather than assumed: every text node the console draws is
   read with its computed colour and the colour actually painted behind it, and
   checked against WCAG AA — 4.5:1 for body text, 3:1 for text at 18.66px bold
   or 24px and above. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('file:///home/claude/console-v2/bundle.html');
await p.waitForSelector('#root'); await p.waitForTimeout(1800);

const res = await p.evaluate(() => {
  const lum = ([r, g, b]) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = c => (c.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
  const over = (fg, bg) => {          /* flatten any alpha onto the ground below */
    const a = fg[3] === undefined ? 1 : fg[3];
    return [0, 1, 2].map(i => Math.round(fg[i] * a + bg[i] * (1 - a)));
  };
  const bgOf = el => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.length >= 3 && (c[3] === undefined || c[3] > 0.95)) return c.slice(0, 3);
      n = n.parentElement;
    }
    return [255, 255, 255];
  };
  const out = [];
  const seen = new Set();
  document.querySelectorAll('#root *').forEach(el => {
    const txt = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.nodeValue.trim()).join(' ').trim();
    if (!txt || txt.length < 2) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || !el.offsetParent) return;
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight) || 400;
    const bg = bgOf(el);
    const fg = over(parse(cs.color), bg);
    const L1 = lum(fg), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    const key = txt.slice(0, 24) + '|' + cs.color + '|' + size;
    if (seen.has(key)) return;
    seen.add(key);
    if (ratio < need) out.push({ txt: txt.slice(0, 34), size: Math.round(size * 10) / 10, weight, color: cs.color, ratio: Math.round(ratio * 100) / 100, need });
  });
  return out;
});
if (!res.length) console.log('no contrast failures in the console chrome');
res.forEach(r => console.log(`FAIL ${r.ratio}:1 (needs ${r.need}) ${r.size}px/${r.weight} ${r.color}  «${r.txt}»`));
console.log('\n' + res.length + ' failing text styles');
await b.close();
