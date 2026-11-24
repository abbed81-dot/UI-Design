// Builds docs/, a static website for GitHub Pages (or any web host):
//   docs/index.html            the playable game (from ../multiplication-game/index.html)
//   docs/privacy/index.html    the privacy policy (from store/privacy-policy.html)
// Run: node mobile-app/scripts/build-site.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = dirname(dirname(fileURLToPath(import.meta.url)));
const repo = dirname(app);
const docs = join(repo, 'docs');
mkdirSync(join(docs, 'privacy'), { recursive: true });

let game = readFileSync(join(repo, 'multiplication-game', 'index.html'), 'utf8')
  .replace(/<!--ARTIFACT-(START|END)-->\n?/g, '')
  .replace(/<meta name="claude:[^>]*>\n?/g, '')
  .replace('<title>مزرعة الأرقام</title>', '<title>مزرعة الأرقام</title>\n<meta name="description" content="لعبة عربية لتعلّم جدول الضرب والجمع والطرح والمنازل والتقريب للأطفال.">\n<meta name="theme-color" content="#3E9B4F">');
writeFileSync(join(docs, 'index.html'), game);
writeFileSync(join(docs, 'privacy', 'index.html'), readFileSync(join(app, 'store', 'privacy-policy.html'), 'utf8'));
writeFileSync(join(docs, '.nojekyll'), '');
// Optional custom domain for GitHub Pages: set SITE_DOMAIN (e.g. games.basesolution.me) once its DNS record
// exists (CNAME games -> abbed81-dot.github.io). Without it the site is served at https://abbed81-dot.github.io/UI-Design/
import { rmSync } from 'node:fs';
if (process.env.SITE_DOMAIN) writeFileSync(join(docs, 'CNAME'), process.env.SITE_DOMAIN + '\n');
else rmSync(join(docs, 'CNAME'), { force: true });
console.log('docs/ built: index.html, privacy/index.html' + (process.env.SITE_DOMAIN ? ', CNAME' : ''));
