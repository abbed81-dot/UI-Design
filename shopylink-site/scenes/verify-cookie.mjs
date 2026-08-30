import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
  proxy:{ server: process.env.HTTPS_PROXY, bypass:'127.0.0.1,localhost' }});
const p = await b.newPage({ viewport:{width:1440,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await p.goto('http://127.0.0.1:3120/', { waitUntil:'load' });
await p.waitForTimeout(9000);
const banner = p.locator('section[aria-label]').first();
console.log('AR banner label:', await banner.getAttribute('aria-label'));
const box = await banner.boundingBox();
console.log('AR banner x (should hug the LEFT on an RTL page):', Math.round(box.x));
await banner.screenshot({ path:'qa-8-cookie-ar.png' });
// open the preferences modal
await p.getByRole('button', { name: /إدارة التفضيلات/ }).click();
await p.waitForTimeout(1200);
await p.locator('div[role="dialog"]').screenshot({ path:'qa-9-cookie-modal-ar.png' });
console.log('AR modal switch mirrored:', await p.evaluate(()=>{
  const sw=[...document.querySelectorAll('[role="switch"]')][1];
  const knob=sw.querySelector('span'); const s=sw.getBoundingClientRect(), k=knob.getBoundingClientRect();
  return `knob starts at ${Math.round(k.left-s.left)}px from the track's left edge (track ${Math.round(s.width)}px)`;
}));
console.log('ERRORS:', errs.length?errs.join('\n'):'none');
await b.close();
