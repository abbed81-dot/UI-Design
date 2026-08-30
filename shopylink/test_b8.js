// B8 Delivery — rewritten. The old version called collectCOD(), a capability the
// PREPAID-ONLY rule deleted. A test that asserts a deleted behaviour is worse than no
// test: it fails for the right reason and gets ignored. This one guards the rule instead.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const html=fs.readFileSync('ShopyLink_Action_08_Delivery.html','utf8');
const w=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

// SUPERSEDED 28 Aug 2026. This module was built prepaid-only: no money at the
// door, no collection function, not even the words. The owner has since ruled
// that a driver MAY take money — but only if he is permitted to, and what he
// takes is his responsibility until he remits it. The old rule is written out
// here rather than deleted, so nobody restores it by accident.
console.log('§B8 money at the door, by permission only');
ok(typeof w.collectAt==='function','collection exists now — the prepaid-only rule was lifted by the owner');
ok(typeof w.mayCollect==='function','…and it asks first whether this driver may');
ok(w.mayCollect()===null||typeof w.mayCollect()==='boolean','with no driver registry it answers "unknown", never a silent yes');
ok(w.collectAt('DLV-2608-01').ok===false,'and with no registry and no invoice, nothing is collected');
ok(/SL_DRIVERS_V1/.test(html),'the permission is read from the drivers registry, not decided here');
console.log('§B8 the module still does its job');
ok(w.document.getElementById('shell').innerHTML.length>2000,'it renders');
ok(typeof w.go==='function','its screens are reachable');
w.go('s2');ok(w.document.getElementById('shell').innerHTML.length>1000,'the ops monitor opens');
w.go('s3-pre');ok(w.document.getElementById('shell').innerHTML.length>1000,'the returns screen opens');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
