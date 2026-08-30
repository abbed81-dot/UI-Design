import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
  proxy:{ server: process.env.HTTPS_PROXY, bypass:'127.0.0.1,localhost' }});
const p = await b.newPage({ viewport:{width:1600,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await p.goto('http://127.0.0.1:3143/', { waitUntil:'load' });
await p.waitForTimeout(10000);
const rj = p.getByRole('button', { name:/رفض الكل/ }); if (await rj.count()) { await rj.first().click(); await p.waitForTimeout(600); }
const at = (st) => p.evaluate((s)=>{ const el=document.getElementById('globe-runway');
  const top=el.getBoundingClientRect().top+window.scrollY;
  const range=el.getBoundingClientRect().height-window.innerHeight;
  window.scrollTo(0, Math.round(top+(s/4)*range)); }, st);
const names = ['dubai','guangzhou','istanbul','newyork'];
for (let i=1;i<=4;i++){
  await at(i); await p.waitForTimeout(2600);
  await p.getByRole('button', { name:/تجوّل في المدينة/ }).nth(i-1).click();
  await p.waitForTimeout(4200);
  await p.screenshot({ path:`qa-city-${i}-${names[i-1]}.png` });
  await p.getByRole('button', { name:/عودة إلى العالم/ }).click();
  await p.waitForTimeout(2600);
}
console.log('ERRORS:', errs.length?errs.join('\n'):'none');
await b.close();
