import { chromium } from 'playwright';
const shots = process.argv.slice(2);
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-certificate-errors'],
  proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' },
});
const p = await b.newPage({ viewport:{ width:1440, height:900 }, ignoreHTTPSErrors:true });
const errs=[];
p.on('console', m => { if(m.type()==='error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
await p.goto('http://127.0.0.1:8899/shopylink-globe.html', { waitUntil:'load' });
await p.waitForTimeout(4000);
const total = await p.evaluate(()=>document.documentElement.scrollHeight - window.innerHeight);
for (const [i,frac] of [0, 0.25, 0.5, 1.0].entries()) {
  await p.evaluate(y=>window.scrollTo(0,y), Math.round(total*frac));
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `/home/user/UI-Design/shopylink-site/scenes/preview-${i}.png` });
}
console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
await b.close();
