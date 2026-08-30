import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
  proxy:{ server: process.env.HTTPS_PROXY, bypass:'127.0.0.1,localhost' }});
const p = await b.newPage({ viewport:{width:1600,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await p.goto('http://127.0.0.1:3134/', { waitUntil:'load' });
await p.waitForTimeout(9000);
const rj = p.getByRole('button', { name:/رفض الكل/ });
if (await rj.count()) { await rj.first().click(); await p.waitForTimeout(600); }

// scroll onto the Dubai station
await p.evaluate(()=>{ const el=document.getElementById('globe-runway');
  const top=el.getBoundingClientRect().top+window.scrollY;
  const range=el.getBoundingClientRect().height-window.innerHeight;
  window.scrollTo(0, Math.round(top+(1/4)*range)); });
await p.waitForTimeout(3000);
await p.screenshot({ path:'qa-10-station-dubai.png' });

await p.getByRole('button', { name:/تجوّل في المدينة/ }).first().click();
await p.waitForTimeout(4500);
await p.screenshot({ path:'qa-11-city-dubai.png' });
console.log('labels visible:', await p.evaluate(()=>
  [...document.querySelectorAll('.pointer-events-none.fixed.inset-0.z-30 button')]
    .map(b=>`${b.textContent.trim()} @${b.style.opacity}`).join(' | ')));

// orbit by dragging, then open a store
const grab = () => p.evaluate(()=>[...document.querySelectorAll('.z-30 button')]
  .map(b=>b.style.transform).join(' '));
const before = await grab();
await p.mouse.move(800,450); await p.mouse.down();
await p.mouse.move(1050,420,{steps:14}); await p.mouse.up();
await p.waitForTimeout(2200);
console.log('orbit moved the camera:', (await grab()) !== before);
await p.screenshot({ path:'qa-12-city-orbited.png' });

const lbl = p.locator('.z-30 button').first();
await lbl.click({ force:true });
await p.waitForTimeout(1400);
await p.screenshot({ path:'qa-13-store-card.png' });
console.log('scroll lock:', await p.evaluate(()=>{ const y0=window.scrollY; window.scrollBy(0,600);
  const h=getComputedStyle(document.documentElement);
  return `moved=${window.scrollY!==y0} htmlOverflow=${h.overflow} htmlPos=${h.position}`; }));
// leaving must give everything back: the scroll, the stacking order, the panel
await p.getByRole('button', { name:/عودة إلى العالم/ }).click();
await p.waitForTimeout(3000);
console.log('after exit:', await p.evaluate(()=>{
  const c=document.querySelector('canvas');
  const y0=window.scrollY; window.scrollBy(0,400);
  const moved=window.scrollY!==y0; window.scrollTo(0,y0);
  const walk=[...document.querySelectorAll('#globe-runway button')].filter(b=>!b.disabled).length;
  return `canvasZ='${c.style.zIndex}' canvasPE='${c.style.pointerEvents}' htmlOverflow=${getComputedStyle(document.documentElement).overflow} scrollWorks=${moved} enabledWalkButtons=${walk}`;
}));
await p.screenshot({ path:'qa-14-after-exit.png' });
console.log('ERRORS:', errs.length?errs.join('\n'):'none');
await b.close();
