// Captures store screenshots from www/index.html with a demo child, then frames them with an Arabic caption.
// Output: store/screenshots/<device>/raw-N.png and store/screenshots/<device>/N.png (captioned).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const WWW = 'file://' + path.join(ROOT, 'www', 'index.html');

const DEVICES = {
  'iphone-6.9':     {w:440,  h:956,  dsf:3},   // 1320 x 2868 (App Store, iPhone 6.9")
  'ipad-13':        {w:1032, h:1376, dsf:2},   // 2064 x 2752 (App Store, iPad 13")
  'android-phone':  {w:360,  h:640,  dsf:3},   // 1080 x 1920 (Google Play phone, 9:16)
  'android-tablet': {w:800,  h:1280, dsf:2},   // 1600 x 2560 (Google Play 10" tablet)
};
const CAPTIONS = [
  'خمسة عوالم لتعلّم الأرقام',
  'طريق ممتع، وكلما أسرعت تجاوزت المرحلة',
  'جدول الضرب بالصور: ٨ خراف مع كل خروف ٨',
  'الجمع والطرح خطوة بخطوة',
  'المنازل وقراءة الأعداد بالعربية',
  'التقريب مع العنزة المرحة',
];
const DEMO = {parent:{name:'أم سارة', phone:'0500000000', created:Date.now()}, active:'demo', sound:true,
  kids:[{id:'demo', name:'سارة', avatar:'🦁', prog:{stars:{mult:{0:3,1:3,2:2}, add:{0:3,1:2}, sub:{0:2}, place:{0:3,1:1}}, best:{}, facts:{}, correct:120}}]};

async function shoot(page, dir, i){ await page.waitForTimeout(700); await page.screenshot({path: path.join(dir, `raw-${i}.png`)}); }

(async () => {
  const b = await chromium.launch();
  for (const [name, d] of Object.entries(DEVICES)){
    const dir = path.join(ROOT, 'store', 'screenshots', name); fs.mkdirSync(dir, {recursive:true});
    const ctx = await b.newContext({viewport:{width:d.w, height:d.h}, deviceScaleFactor:d.dsf, colorScheme:'light'});
    const p = await ctx.newPage();
    await p.goto(WWW); await p.evaluate(db => localStorage.setItem('numbers-farm-v2', JSON.stringify(db)), DEMO); await p.reload();
    await p.waitForTimeout(500);
    await shoot(p, dir, 1);                                                     // worlds
    await p.click('[data-w="mult"]'); await p.waitForTimeout(400); await p.evaluate(() => scrollTo(0, 0));
    await shoot(p, dir, 2);                                                     // trail
    await p.locator('.node').nth(7).click(); await p.click('[data-act="learn"]');
    await p.click('#skipRow button[data-k="8"]');
    await shoot(p, dir, 3);                                                     // 8 x 8 sheep
    await p.click('#learnBack'); await p.click('#mapBack'); await p.click('[data-w="add"]'); await p.waitForTimeout(300);
    await p.locator('.node').nth(2).click(); await p.click('[data-act="learn"]');
    await p.click('#stepBtn'); await p.click('#stepBtn');
    await shoot(p, dir, 4);                                                     // column addition
    await p.click('#learnBack'); await p.click('#mapBack'); await p.click('[data-w="place"]'); await p.waitForTimeout(300);
    await p.locator('.node').nth(2).click(); await p.click('[data-act="learn"]');
    await shoot(p, dir, 5);                                                     // place value
    await p.click('#learnBack'); await p.click('#mapBack'); await p.click('[data-w="round"]'); await p.waitForTimeout(300);
    await p.locator('.node').nth(1).click(); await p.click('[data-act="learn"]'); await p.waitForTimeout(300);
    const toLeft = await p.evaluate(() => { const n = +document.querySelector('.nl').dataset.pos; return n >= 50; });
    const g = await p.locator('#learnLine .nl-goat').boundingBox(), tr = await p.locator('#learnLine .nl-track').boundingBox();
    await p.mouse.move(g.x + g.width / 2, g.y + g.height / 2); await p.mouse.down();
    await p.mouse.move(toLeft ? tr.x + 1 : tr.x + tr.width - 1, g.y + 8, {steps:8}); await p.mouse.up();
    await p.waitForTimeout(900);
    await shoot(p, dir, 6);                                                     // rounding goat
    await ctx.close();

    // captioned frames at the exact store size
    const W = d.w * d.dsf, H = d.h * d.dsf;
    const fp = await b.newPage({viewport:{width:W, height:H}});
    for (let i = 1; i <= 6; i++){
      const img = 'file://' + path.join(dir, `raw-${i}.png`), font = 'file://' + path.join(ROOT, 'www', 'fonts', 'fonts.css');
      const framePath = path.join(dir, `.frame-${i}.html`);
      fs.writeFileSync(framePath, `<!doctype html><html dir="rtl"><head><link rel="stylesheet" href="${font}"><style>
        html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
        body{background:linear-gradient(180deg,#6CC66F,#2F8A3E);display:flex;flex-direction:column;align-items:center;font-family:'Baloo Bhaijaan 2',sans-serif}
        h1{color:#fff;font-weight:800;font-size:${Math.round(W * .068)}px;line-height:1.25;text-align:center;margin:${Math.round(H * .05)}px ${Math.round(W * .07)}px ${Math.round(H * .03)}px;text-shadow:0 4px 0 rgba(0,0,0,.12)}
        .shot{flex:1;min-height:0;display:flex;align-items:flex-start;justify-content:center;width:100%}
        img{height:${Math.round(H * .80)}px;border-radius:${Math.round(W * .045)}px;box-shadow:0 30px 60px rgba(0,0,0,.25);border:${Math.round(W * .012)}px solid #fff}
      </style></head><body><h1>${CAPTIONS[i - 1]}</h1><div class="shot"><img src="${img}"></div></body></html>`);
      await fp.goto('file://' + framePath, {waitUntil:'load'});
      await fp.evaluate(() => document.fonts.ready);
      await fp.screenshot({path: path.join(dir, `${i}.png`)});
      fs.unlinkSync(framePath);
    }
    await fp.close();
    console.log('screenshots:', name, `${W}x${H}`);
  }
  await b.close();
})();
