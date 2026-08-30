import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
  proxy:{ server: process.env.HTTPS_PROXY, bypass:'127.0.0.1,localhost' }});
const p = await b.newPage({ viewport:{width:1600,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await p.goto('http://127.0.0.1:3111/', { waitUntil:'load' });
await p.waitForTimeout(9000);
const rj = p.getByRole('button', { name:/reject all/i });
if (await rj.count()) { await rj.first().click(); await p.waitForTimeout(600); }

const clock = () => p.evaluate(() => {
  const el = document.querySelector('main header time');
  return el ? el.parentElement.textContent.replace(/\s+/g,' ').trim() : 'NO CLOCK';
});
const at = (s) => p.evaluate((st)=>{
  const el=document.getElementById('globe-runway');
  const top=el.getBoundingClientRect().top+window.scrollY;
  const range=el.getBoundingClientRect().height-window.innerHeight;
  window.scrollTo(0, Math.round(top+(st/4)*range));
}, s);

console.log('AR station 0 :', await clock());
for (const s of [1,2,3,4]) { await at(s); await p.waitForTimeout(2600); console.log('AR station '+s+' :', await clock()); }
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(2000);
await p.screenshot({ path:'qa-6-clock-ar.png' });
await p.locator('main header button').click(); await p.waitForTimeout(2000);
console.log('EN station 0 :', await clock());
await at(4); await p.waitForTimeout(2600);
console.log('EN station 4 :', await clock());
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(2200);
await p.screenshot({ path:'qa-7-clock-en.png' });
console.log('ERRORS:', errs.length?errs.join('\n'):'none');
await b.close();
