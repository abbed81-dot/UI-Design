// B6 Arrival & receive — rewritten against the module as it stands.
// The previous version tested a four-step flow with st.confirmed{}; the module is now a
// three-step flow and that state is gone. Patching names would have hidden the fact that
// the contract was written for a shape that no longer exists. The old file is kept as
// test_b6.legacy.txt so nothing written before the build is silently discarded.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const w=new JSDOM(fs.readFileSync('ShopyLink_Action_06_ArrivalReceive.html','utf8'),
  {runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole()}).window;
const sh=()=>w.document.getElementById('shell').innerHTML;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§B6 the three steps');
['s1','s2-pre','s3-pre','done'].forEach(s=>{w.go(s);ok(sh().length>400,s+' renders ('+sh().length+' chars)');});
w.go('s1');
ok(/1 · /.test(sh())&&/2 · /.test(sh())&&/3 · /.test(sh()),'a three-step tracker, matching the module');
ok(!/4 · /.test(sh()),'…and no fourth step');

console.log('§B6 receiving a trip');
w.receiveTrip('TRP-20260817-001');
ok(w.st.trip!==null,'a trip can be received');
const s1=w.st.trip.shipments[0];
ok(s1&&s1.cartons.length===6,'it carries a shipment of six cartons');
ok(s1.cartons.filter(c=>w.accounted(s1.id+'-'+c)).length===0,'nothing is accounted before it is scanned');
s1.cartons.forEach(c=>w.handleRcv(s1.id+'-'+c));
ok(s1.cartons.filter(c=>w.accounted(s1.id+'-'+c)).length===6,'scanning accounts each carton, one at a time');
ok(w.accounted(s1.id+'-nosuch')===false,'a carton that was never scanned stays unaccounted');

console.log('§B6 the standing rules');
ok(!/الدفع عند الاستلام/.test(fs.readFileSync('ShopyLink_Action_06_ArrivalReceive.html','utf8')),'no cash at the door — prepaid only');
w.setLang&&w.setLang('ar');
ok(/[\u0600-\u06FF]/.test(sh()),'renders in Arabic');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
