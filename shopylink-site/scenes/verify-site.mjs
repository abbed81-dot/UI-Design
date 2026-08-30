import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
  proxy:{ server: process.env.HTTPS_PROXY, bypass:'127.0.0.1,localhost' }});
const p = await b.newPage({ viewport:{width:1440,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await p.goto('http://127.0.0.1:3190/', { waitUntil:'load' });
await p.waitForTimeout(9000); // software rendering in CI: the loader honestly waits for the scene
const reject = p.getByRole('button', { name: /reject all/i });
if (await reject.count()) { await reject.first().click(); await p.waitForTimeout(700); }

await p.screenshot({ path:'qa-1-hero-ar.png' });

const total = await p.evaluate(()=>document.documentElement.scrollHeight - window.innerHeight);
// Land ON a station: the runway's own range starts after the hero, so
// scrollY = runwayTop + p * (runwayHeight - vh). Guessing a page fraction
// lands between legs and shows nothing.
const at = async (station) => p.evaluate((s) => {
  const el = document.getElementById('globe-runway');
  const top = el.getBoundingClientRect().top + window.scrollY;
  const range = el.getBoundingClientRect().height - window.innerHeight;
  window.scrollTo(0, Math.round(top + (s / 4) * range));
}, station);
for (const [name, station] of [['qa-2-dubai',1],['qa-3-istanbul',3]]) {
  await at(station);
  await p.waitForTimeout(3200);
  await p.screenshot({ path:`${name}.png` });
}

await p.evaluate(()=>window.scrollTo(0,0));
await p.waitForTimeout(1200);
await p.locator('main header button').click();
await p.waitForTimeout(2600);
const meta = await p.evaluate(()=>document.documentElement.dir+' / '+document.documentElement.lang);
await p.screenshot({ path:'qa-4-hero-en.png' });

await p.evaluate(y=>window.scrollTo(0,y), Math.round(total*0.99));
await p.waitForTimeout(2000);
await p.screenshot({ path:'qa-5-steps-en.png' });

console.log('after toggle:', meta);
console.log('ERRORS:', errs.length?errs.join('\n'):'none');
await b.close();
