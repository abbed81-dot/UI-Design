// Builds www/index.html for the native app from the single game source (../multiplication-game/index.html):
//  - swaps the Google Fonts links for the fonts bundled in www/fonts (the app must work offline),
//  - uses an app viewport (no pinch zoom) and adds theme colours for the system bars.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(join(root, '..', 'multiplication-game', 'index.html'), 'utf8');

const replace = (text, re, by, what) => {
  if (!re.test(text)) throw new Error(`build-www: could not find ${what} in the game source`);
  return text.replace(re, by);
};

let html = src;
html = replace(html, /<!--WEB-FONTS-->[\s\S]*?<!--\/WEB-FONTS-->/, '<link rel="stylesheet" href="fonts/fonts.css">', 'the WEB-FONTS block');
html = replace(html, /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">\n' +
  '<meta name="theme-color" content="#F5F7F2" media="(prefers-color-scheme: light)">\n' +
  '<meta name="theme-color" content="#11181C" media="(prefers-color-scheme: dark)">\n' +
  '<meta name="format-detection" content="telephone=no">', 'the viewport meta tag');
html = html.replace(/<!--ARTIFACT-(START|END)-->\n?/g, '').replace(/<meta name="claude:[^>]*>\n?/g, '');
if (/fonts\.(googleapis|gstatic)\.com/.test(html)) throw new Error('build-www: an external font link is still present');

writeFileSync(join(root, 'www', 'index.html'), html);
console.log(`www/index.html written (${(html.length / 1024).toFixed(0)} KB)`);
