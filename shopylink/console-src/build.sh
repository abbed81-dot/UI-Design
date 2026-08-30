#!/usr/bin/env bash
# Build the console into ONE self-contained classic-script HTML file.
#
# Parcel emits a differential pair for a type="module" entry: a modern ESM
# bundle and a `nomodule` classic one. Both is the wrong answer here. The
# project's own compat rules say the target viewer runs a legacy JS engine, so
# the classic bundle is the one that must ship — and shipping both doubles a
# file that is opened from a filesystem. The step below keeps the classic
# bundle and drops the module twin.
set -e
cd "$(dirname "$0")"
bash "$SKILL/scripts/bundle-artifact.sh"
node - <<'JS'
const fs=require('fs');
let h=fs.readFileSync('bundle.html','utf8');
const before=h.length;
// drop the ESM twin
h=h.replace(/<script type="module">[\s\S]*?<\/script>/g,'');
// the classic bundle is no longer the fallback — it is the bundle
h=h.replace(/<script nomodule defer>/g,'<script>');
fs.writeFileSync('bundle.html',h);
console.log('classic-only bundle: '+before+' -> '+h.length+' bytes');
JS
