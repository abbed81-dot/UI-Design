#!/usr/bin/env bash
# One self-contained classic-script HTML file.
# · html-inline dies on the external Google Fonts <link>, so it is lifted out
#   before inlining (index.html is stashed to a temp copy and restored, no git
#   involved) and planted back into the bundle head — the fonts are meant to
#   stay external: the artifact CSP admits fonts.googleapis.com, and every
#   face declares a real fallback stack.
# · Parcel's ESM twin is dropped; the classic bundle is the one that ships.
set -e
cd "$(dirname "$0")"
cp index.html .index.orig.html
FONTS=$(grep -o '<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>' index.html || true)
PRECON=$(grep -o '<link rel="preconnect"[^>]*>' index.html || true)
sed -i 's|<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>||; s|<link rel="preconnect"[^>]*>||' index.html
trap 'mv .index.orig.html index.html' EXIT
bash "$SKILL/scripts/bundle-artifact.sh"
node - "$FONTS" "$PRECON" <<'JS'
const fs=require('fs');
let h=fs.readFileSync('bundle.html','utf8');
const before=h.length;
h=h.replace(/<script type="module">[\s\S]*?<\/script>/g,'');
h=h.replace(/<script nomodule defer>/g,'<script>');
const fonts=process.argv[2]||'', precon=process.argv[3]||'';
if(fonts && h.indexOf('fonts.googleapis')===-1) h=h.replace(/<html[^>]*>/i, m=>m+precon+fonts); /* the minifier drops <head>; links are legal here and the parser re-heads them */
fs.writeFileSync('bundle.html',h);
console.log('classic bundle: '+before+' -> '+h.length+' bytes · fonts '+(h.indexOf('fonts.googleapis')>-1?'linked':'MISSING'));
JS
