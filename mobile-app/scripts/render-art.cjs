// Renders the app icon, Android adaptive-icon layers and splash images into assets/ (inputs for @capacitor/assets).
// Run: node scripts/render-art.cjs   (uses the Playwright + Chromium available on the build machine)
const { chromium } = require('playwright');
const path = require('path');
const out = p => path.join(__dirname, '..', 'assets', p);

// An original sheep drawn from simple shapes (no emoji or third-party art).
const sheep = (s = 1) => `
<g transform="scale(${s})">
  <g fill="#3A3A3A">
    <rect x="-150" y="120" width="44" height="120" rx="20"/><rect x="-60" y="130" width="44" height="115" rx="20"/>
    <rect x="40" y="130" width="44" height="115" rx="20"/><rect x="120" y="120" width="44" height="120" rx="20"/>
  </g>
  <g fill="#FFFFFF">
    <circle cx="-150" cy="10" r="95"/><circle cx="-60" cy="-60" r="105"/><circle cx="60" cy="-65" r="105"/>
    <circle cx="160" cy="0" r="95"/><circle cx="110" cy="90" r="95"/><circle cx="-10" cy="105" r="100"/>
    <circle cx="-120" cy="90" r="90"/><circle cx="0" cy="10" r="150"/>
  </g>
  <g transform="translate(-200,-40) rotate(-8)">
    <ellipse cx="-70" cy="-30" rx="58" ry="26" fill="#3A3A3A" transform="rotate(-25 -70 -30)"/>
    <ellipse cx="70" cy="-30" rx="58" ry="26" fill="#3A3A3A" transform="rotate(25 70 -30)"/>
    <ellipse cx="0" cy="20" rx="88" ry="105" fill="#3A3A3A"/>
    <circle cx="-32" cy="5" r="17" fill="#fff"/><circle cx="32" cy="5" r="17" fill="#fff"/>
    <circle cx="-28" cy="8" r="9" fill="#1d1d1d"/><circle cx="36" cy="8" r="9" fill="#1d1d1d"/>
    <ellipse cx="0" cy="70" rx="26" ry="14" fill="#F4A7B9"/>
    <circle cx="-26" cy="-70" r="34" fill="#fff"/><circle cx="12" cy="-82" r="38" fill="#fff"/><circle cx="44" cy="-62" r="28" fill="#fff"/>
  </g>
</g>`;
const badge = `
<g transform="translate(250,-300)">
  <circle r="120" fill="#F2B630"/><circle r="120" fill="none" stroke="#fff" stroke-width="14"/>
  <text y="38" text-anchor="middle" font-family="Baloo Bhaijaan 2" font-weight="800" font-size="120" fill="#3A2A00">١٢٣</text>
</g>`;
const bgGrad = `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6CC66F"/><stop offset="1" stop-color="#2F8A3E"/></linearGradient></defs>`;
const hill = `<ellipse cx="512" cy="1010" rx="720" ry="250" fill="#8BD48A" opacity=".55"/>`;

const svgs = {
  'icon-only.png':       {w:1024, h:1024, svg:`${bgGrad}<rect width="1024" height="1024" fill="url(#bg)"/>${hill}<g transform="translate(540,560)">${sheep(1.05)}${badge}</g>`},
  'icon-foreground.png': {w:1024, h:1024, transparent:true, svg:`<g transform="translate(530,550)">${sheep(.78)}<g transform="scale(.78)">${badge}</g></g>`},
  'icon-background.png': {w:1024, h:1024, svg:`${bgGrad}<rect width="1024" height="1024" fill="url(#bg)"/>${hill}`},
  'splash.png':          {w:2732, h:2732, svg:`<rect width="2732" height="2732" fill="#F5F7F2"/><g transform="translate(1366,1250)">${sheep(1.4)}${badge.replace('translate(250,-300)', 'translate(350,-420)')}</g>
                           <text x="1366" y="1830" text-anchor="middle" font-family="Baloo Bhaijaan 2" font-weight="800" font-size="200" fill="#3E9B4F">مزرعة الأرقام</text>`},
  'feature-graphic.png': {w:1024, h:500, svg:`${bgGrad}<rect width="1024" height="500" fill="url(#bg)"/><ellipse cx="300" cy="560" rx="520" ry="160" fill="#8BD48A" opacity=".5"/>
                           <g transform="translate(185,300)">${sheep(.42)}<g transform="scale(.42)">${badge}</g></g>
                           <text x="975" y="210" text-anchor="start" direction="rtl" font-family="Baloo Bhaijaan 2" font-weight="800" font-size="92" fill="#fff">مزرعة الأرقام</text>
                           <text x="975" y="290" text-anchor="start" direction="rtl" font-family="Tajawal" font-weight="700" font-size="33" fill="#F5FFF0">الضرب والجمع والطرح والمنازل والتقريب</text>
                           <text x="975" y="345" text-anchor="start" direction="rtl" font-family="Tajawal" font-weight="500" font-size="30" fill="#E3F5DF">نتعلّم الأرقام ونحن نلعب</text>`, out:'store'},
  'splash-dark.png':     {w:2732, h:2732, svg:`<rect width="2732" height="2732" fill="#11181C"/><g transform="translate(1366,1250)">${sheep(1.4)}${badge.replace('translate(250,-300)', 'translate(350,-420)')}</g>
                           <text x="1366" y="1830" text-anchor="middle" font-family="Baloo Bhaijaan 2" font-weight="800" font-size="200" fill="#5DBB6C">مزرعة الأرقام</text>`},
};
(async () => {
  const b = await chromium.launch();
  for (const [name, a] of Object.entries(svgs)){
    const p = await b.newPage({ viewport: { width: a.w, height: a.h } });
    const fontCss = 'file://' + path.join(__dirname, '..', 'www', 'fonts', 'fonts.css');
    await p.setContent(`<!doctype html><html><head><link rel="stylesheet" href="${fontCss}"><style>html,body{margin:0;background:transparent}</style></head>
      <body><svg xmlns="http://www.w3.org/2000/svg" width="${a.w}" height="${a.h}" viewBox="0 0 ${a.w} ${a.h}">${a.svg}</svg></body></html>`, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: a.out === 'store' ? path.join(__dirname, '..', 'store', name) : out(name), omitBackground: !!a.transparent });
    await p.close();
    console.log('rendered', name);
  }
  await b.close();
})();
