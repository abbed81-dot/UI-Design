// ShopyLink flow diagnostic — catches dead controls + silent gated mutations + dead-ends.
// Usage: node flow_check.js <file.html>
const fs=require('fs');
const FILE=process.argv[2]||'/mnt/user-data/outputs/ShopyLink_IndividualApp.html';
const src=fs.readFileSync(FILE,'utf8');
const script=(src.match(/<script>[\s\S]*?<\/script>/g)||[]).pop()||'';
let fails=0, warns=0;
const FAIL=m=>{fails++;console.log('  ✗ FAIL:',m);};
const WARN=m=>{warns++;console.log('  ⚠ WARN:',m);};

// ---- 1) emitted vs handled data-hooks ----
const emitted=new Set(), handled=new Set();
for(const m of script.matchAll(/data-([a-z][a-z0-9-]*)\s*=/gi)) emitted.add(m[1].toLowerCase());
for(const m of script.matchAll(/(?:QA|querySelectorAll|querySelector)\(\s*['"`]\[data-([a-z][a-z0-9-]*)/gi)) handled.add(m[1].toLowerCase());
// carriers read by another handler's dataset (not their own click): allow if referenced via .dataset
const datasetRefs=new Set();
for(const m of script.matchAll(/\.dataset\.([a-zA-Z0-9]+)/g)){ // camelCase -> kebab
  datasetRefs.add(m[1].replace(/[A-Z]/g,c=>'-'+c.toLowerCase()).toLowerCase());
}
console.log('\n[1] Control wiring');
const deadControls=[...emitted].filter(h=>!handled.has(h) && h!=='act');
for(const h of deadControls){
  if(datasetRefs.has(h)) continue; // it's a data carrier used by another handler
  FAIL(`control "data-${h}" is emitted but has NO click handler (dead button / dead-end).`);
}
// data-act values: flag non-noop named placeholders
const actVals=new Set(); for(const m of script.matchAll(/data-act="([^"]+)"/g)) actVals.add(m[1]);
// inert = a value that is never used in a conditional comparison anywhere (truly does nothing)
const inert=[...actVals].filter(v=> v!=='noop' && !v.includes('${') && !new RegExp("['\"`]"+v.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')+"['\"`]").test(script.replace(/data-act="[^"]+"/g,'')) );
if(inert.length) WARN(`data-act placeholders that look actionable but are inert: ${inert.join(', ')} (verify intended).`);
const deadHandlers=[...handled].filter(h=>!emitted.has(h));
for(const h of deadHandlers) WARN(`handler for "data-${h}" exists but nothing emits it (dead handler).`);
if(!deadControls.length) console.log('  ✓ every interactive control has a handler');

// ---- 2) gated-action lint: money/subscription mutation MUST navigate (no silent flip) ----
console.log('\n[2] Gated-action fidelity (paid/subscription actions must route through a flow)');
// split handler blocks
const parts=script.split(/QA\(\s*['"`]\[data-/).slice(1);
let gatedChecked=0;
for(const p of parts){
  const name=(p.match(/^([a-z0-9-]+)/i)||[])[1]||'?';
  const body=p.slice(0, p.indexOf('});')>=0?p.indexOf('});')+3:200);
  const mutatesMoney=/\.(paid|active)\s*=|\.status\s*=\s*'active'|\.plan\s*=/.test(body);
  const navigates=/st\.screen\s*=/.test(body);
  if(mutatesMoney){
    gatedChecked++;
    if(!navigates) FAIL(`"data-${name}" changes a paid/subscription state but does NOT navigate to a payment/confirm/result screen — this is the silent-flip mistake.`);
  }
}
if(gatedChecked && !fails) console.log(`  ✓ ${gatedChecked} state-changing handler(s) all route through a screen (no silent flips)`);
if(!gatedChecked) console.log('  (no money/subscription mutations found)');

console.log(`\nRESULT: ${fails} fail, ${warns} warn\n`);
process.exit(fails?1:0);
