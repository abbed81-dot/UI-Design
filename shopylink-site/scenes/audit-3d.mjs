/**
 * §0 of the optimize-3d-scene skill: measure before touching anything.
 *
 * Hooks getContext before app code runs and counts draw calls, vertices, frames
 * and — the number that matters most — WHEN each shader program links. Every
 * link must land before the loader hands off, or §3 is incomplete and the
 * micro-freezes are still there. SwiftShader is not a GPU, so only counted
 * quantities are quoted; fps from here would be a lie.
 */
import { chromium } from 'playwright';

const [url, label, w, h] = [process.argv[2], process.argv[3], +process.argv[4], +process.argv[5]];

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' },
});
const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2,
  isMobile: w < 700, hasTouch: w < 700 });

await p.addInitScript(() => {
  const gc = HTMLCanvasElement.prototype.getContext;
  window.__p = { draws: 0, verts: 0, frames: 0, links: [], attrs: null, kind: null, handoff: null };
  HTMLCanvasElement.prototype.getContext = function (kind, attrs) {
    const ctx = gc.call(this, kind, attrs);
    if (ctx && /webgl/.test(kind) && !window.__p.kind) {
      window.__p.kind = kind; window.__p.attrs = attrs; window.__gl = ctx;
      const da = ctx.drawArrays.bind(ctx);
      ctx.drawArrays = (m, f, c) => { window.__p.draws++; window.__p.verts += c; return da(m, f, c); };
      const de = ctx.drawElements.bind(ctx);
      ctx.drawElements = (m, c, t, o) => { window.__p.draws++; window.__p.verts += c; return de(m, c, t, o); };
      const cl = ctx.clear.bind(ctx);
      ctx.clear = (m) => { window.__p.frames++; return cl(m); };
      const lk = ctx.linkProgram.bind(ctx);
      ctx.linkProgram = (prog) => { window.__p.links.push(Math.round(performance.now())); return lk(prog); };
    }
    return ctx;
  };
  // the loader handoff: the curtain leaves the DOM
  new MutationObserver(() => {
    if (window.__p.handoff === null && !document.querySelector('div[class*="z-50"][class*="inset-0"]')) {
      window.__p.handoff = Math.round(performance.now());
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
});

const bytes = { three: 0, total: 0 };
p.on('response', async (r) => {
  const u = r.url();
  if (!u.includes('/_next/static') || !u.endsWith('.js')) return;
  const len = Number(r.headers()['content-length'] || 0);
  bytes.total += len;
});

await p.goto(url, { waitUntil: 'load' });
await p.waitForTimeout(12000);
const settled = await p.evaluate(() => ({ ...window.__p, links: window.__p.links.slice() }));
// one scroll pass — any program linking HERE is a mid-scroll compile stall
const before = settled.links.length;
await p.evaluate(() => { const el = document.getElementById('globe-runway');
  if (!el) return; const t = el.getBoundingClientRect().top + window.scrollY;
  const r = el.getBoundingClientRect().height - window.innerHeight;
  window.scrollTo(0, Math.round(t + r)); });
await p.waitForTimeout(6000);
const after = await p.evaluate(() => ({ ...window.__p, buf: [window.__gl.drawingBufferWidth, window.__gl.drawingBufferHeight] }));

console.log(`--- ${label} (${w}x${h}) ---`);
console.log('context           :', after.kind, JSON.stringify(after.attrs));
console.log('drawing buffer    :', after.buf.join(' x '), '=', (after.buf[0]*after.buf[1]/1e6).toFixed(2), 'Mpx');
console.log('draw calls/frame  :', (after.draws / Math.max(1, after.frames)).toFixed(1));
console.log('verts/frame       :', Math.round(after.verts / Math.max(1, after.frames)));
console.log('programs linked   :', after.links.length, '| last link at', after.links[after.links.length-1] ?? '-', 'ms');
console.log('loader handoff at :', after.handoff, 'ms');
console.log('links AFTER handoff:', after.links.filter(t => after.handoff !== null && t > after.handoff).length);
console.log('links DURING scroll:', after.links.length - before, '(must be 0)');
console.log('js bundle bytes   :', bytes.total.toLocaleString());
await b.close();
