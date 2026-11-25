// Builds docs/, a static website for GitHub Pages (or any web host):
//   docs/index.html            the playable game (from ../multiplication-game/index.html)
//   docs/privacy/index.html    the privacy policy (from store/privacy-policy.html)
//   docs/icons/, docs/manifest.webmanifest   home-screen icon and name (from assets/web/, made by scripts/web-icons.py)
// Run: node mobile-app/scripts/build-site.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = dirname(dirname(fileURLToPath(import.meta.url)));
const repo = dirname(app);
const docs = join(repo, 'docs');
mkdirSync(join(docs, 'privacy'), { recursive: true });
mkdirSync(join(docs, 'icons'), { recursive: true });

let game = readFileSync(join(repo, 'multiplication-game', 'index.html'), 'utf8')
  .replace(/<!--ARTIFACT-(START|END)-->\n?/g, '')
  .replace(/<meta name="claude:[^>]*>\n?/g, '')
  .replace('<title>مزرعة الأرقام</title>', ['<title>مزرعة الأرقام</title>',
    '<meta name="description" content="لعبة عربية لتعلّم جدول الضرب والقسمة والجمع والطرح والمنازل والتقريب للأطفال.">',
    '<meta name="theme-color" content="#3E9B4F">',
    // "Add to Home Screen": the Numbers Farm icon and name, opening full screen like an app
    '<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">',
    '<link rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon.png">',
    '<link rel="manifest" href="manifest.webmanifest">',
    '<meta name="apple-mobile-web-app-title" content="مزرعة الأرقام">',
    '<meta name="application-name" content="مزرعة الأرقام">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default">'].join('\n'));
writeFileSync(join(docs, 'index.html'), game);
writeFileSync(join(docs, 'privacy', 'index.html'), readFileSync(join(app, 'store', 'privacy-policy.html'), 'utf8'));
writeFileSync(join(docs, '.nojekyll'), '');
for (const f of readdirSync(join(app, 'assets', 'web'))) copyFileSync(join(app, 'assets', 'web', f), join(docs, 'icons', f));
writeFileSync(join(docs, 'manifest.webmanifest'), JSON.stringify({
  name: 'مزرعة الأرقام', short_name: 'مزرعة الأرقام', description: 'لعبة عربية لتعلّم الرياضيات للأطفال',
  lang: 'ar', dir: 'rtl', start_url: './', scope: './', display: 'standalone', orientation: 'any',
  background_color: '#F5F7F2', theme_color: '#3E9B4F',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: 'icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
  ],
}, null, 2) + '\n');
// Optional custom domain for GitHub Pages: set SITE_DOMAIN (e.g. games.basesolution.me) once its DNS record
// exists (CNAME games -> abbed81-dot.github.io). Without it the site is served at https://abbed81-dot.github.io/UI-Design/
import { rmSync } from 'node:fs';
if (process.env.SITE_DOMAIN) writeFileSync(join(docs, 'CNAME'), process.env.SITE_DOMAIN + '\n');
else rmSync(join(docs, 'CNAME'), { force: true });
console.log('docs/ built: index.html, privacy/index.html, icons/, manifest.webmanifest' + (process.env.SITE_DOMAIN ? ', CNAME' : ''));
