import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  proxy:{ server: process.env.HTTPS_PROXY, bypass:'127.0.0.1,localhost' }});
const errs=[];
const shot = async (w,h,name,mobile) => {
  const p = await b.newPage({ viewport:{width:w,height:h}, deviceScaleFactor: mobile?2:1, isMobile:mobile, hasTouch:mobile });
  p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  const r = await p.goto('http://127.0.0.1:3200/privacy-policy', { waitUntil:'load' });
  console.log(name, 'status', r.status());
  await p.waitForTimeout(2500);
  const rj = p.getByRole('button', { name:/رفض الكل/ }); if (await rj.count()) { await rj.first().click(); await p.waitForTimeout(500); }
  await p.screenshot({ path:`qa-legal-${name}.png` });
  if (!mobile) {
    console.log('placeholders highlighted:', await p.locator('mark').count());
    console.log('sections:', await p.locator('section h2').count());
    console.log('overflow:', await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth));
    await p.locator('main').screenshot({ path:'qa-legal-full.png' });
    // the banner link must now resolve
    const link = await p.evaluate(()=>document.querySelector('a[href="/privacy-policy"]')?.href ?? null);
    console.log('banner link target present:', link !== null || 'n/a on this page');
  }
  await p.close();
};
await shot(1440,900,'desktop',false);
await shot(390,844,'phone',true);
// and the 404 that started this
const p2 = await b.newPage();
const r2 = await p2.goto('http://127.0.0.1:3200/privacy-policy', { waitUntil:'load' });
console.log('privacy-policy status:', r2.status());
console.log('ERRORS:', errs.length?errs.join('\n'):'none');
await b.close();
