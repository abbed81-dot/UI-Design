import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
  proxy:{ server: process.env.HTTPS_PROXY, bypass:'127.0.0.1,localhost' }});
// a mid-range Android, which is what this audience actually carries
const p = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await p.goto('http://127.0.0.1:3171/', { waitUntil:'load' });
await p.waitForTimeout(11000);
const rj = p.getByRole('button', { name:/رفض الكل/ }); if (await rj.count()) { await rj.first().click(); await p.waitForTimeout(700); }
await p.screenshot({ path:'qa-m1-hero.png' });
console.log('horizontal overflow:', await p.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth));
await p.evaluate(()=>{ const el=document.getElementById('globe-runway');
  const top=el.getBoundingClientRect().top+window.scrollY;
  const range=el.getBoundingClientRect().height-window.innerHeight;
  window.scrollTo(0, Math.round(top+(1/4)*range)); });
await p.waitForTimeout(3000);
await p.screenshot({ path:'qa-m2-city-panel.png' });
const walk = p.getByRole('button', { name:/تجوّل في المدينة/ }).first();
console.log('walk button visible on phone:', await walk.isVisible().catch(()=>false));
await walk.click({ timeout: 5000 }).catch(e=>console.log('walk click failed:', e.message.split('\n')[0]));
await p.waitForTimeout(4500);
await p.screenshot({ path:'qa-m3-city.png' });
console.log('ERRORS:', errs.length?errs.join('\n'):'none');
await b.close();
