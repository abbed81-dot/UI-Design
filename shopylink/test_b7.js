const fs=require('fs');const {JSDOM}=require('jsdom');
const html=fs.readFileSync('ShopyLink_Action_07_Dispatcher.html','utf8');
let errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,
  virtualConsole:new (require('jsdom').VirtualConsole)().on('jsdomError',e=>errs.push(e.message)).on('error',e=>errs.push(e))});
const w=dom.window, d=w.document;
const shell=()=>d.getElementById('shell').innerHTML;
const len=()=>shell().length;
let fail=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ FAIL ')+m); if(!c)fail++;};

console.log('\n[states]');
['s1','s2-pre','s3-pre','done'].forEach(s=>{
  w.resetB7(); w.go(s); ok(len()>400, s+' renders ('+len()+' chars)');
  ok(d.querySelectorAll('.sl-sim-btn.on').length===1, s+' sim highlight');
  ok(/class="foot"/.test(shell()), s+' sticky footer');
});

console.log('\n[paid gate]');
w.resetB7(); w.go('s1');
ok(/Awaiting payment/.test(shell()),'unpaid section rendered separately');
ok(w.readyInZone('Z-01').length===2,'Mezzeh ready = 2 (unpaid Rana excluded)');
ok(w.readyInZone('Z-03').length===1,'Jaramana ready = 1 (paid business in, unpaid Hadi out)');
ok(w.readyInZone('Z-02').length===1,'Midan ready = 1 (unpaid BUSINESS Sham excluded — universal gate)');
ok(w.unpaidList().some(x=>x.id==='DLV-2608-08'),'unpaid business appears in Awaiting payment section');
ok(!w.readyInZone('Z-01').some(x=>x.id==='DLV-2608-05'),'unpaid individual never enters pool');
w.remind('DLV-2608-05');
ok(!!w.st.reminded['DLV-2608-05'],'WhatsApp reminder stamps time');

console.log('\n[one vocabulary for zones]');
/* C10 owns the zone register. This file used to carry a second set of ids for
   the same three zones — Z-MEZ/Z-MID/Z-JAR beside the register's Z-01/Z-02/Z-03
   — so zById() answered undefined for every zone its own drivers served, and
   reading .name off that stopped the whole Runs board. One vocabulary, checked
   here, because the symptom was a blank screen and the cause was a name. */
const zoneIds=w.zonesLive().map(function(z){return z.id;});
ok(w.deliveries().every(function(d){return zoneIds.indexOf(d.zone)>-1;}),'every delivery names a zone the register has');
ok(w.DRIVERS.every(function(d){return d.zones.every(function(z){return zoneIds.indexOf(z)>-1;});}),'…and every driver serves zones the register has');
ok(w.st.runs.every(function(r){return !!w.zById(r.zone);}),'…so no run can point at a zone that is not there');

console.log('\n[a record the register no longer holds]');
ok(typeof w.nameOr==='function','a missing record is named rather than read through');
ok(/not in the register|ليس في السجل/.test(w.nameOr(null,'DRV-99')),'…and the name says which one is missing');
ok(w.nameOr({name:'Samer Haddad'},'DRV-01')==='Samer Haddad','…while a record that is there reads normally');

console.log('\n[assign flow]');
w.pickZone('Z-01');
ok(w.sim==='s2','pickZone → s2');
ok(w.selCount()===2,'all ready selected by default');
ok(w.st.driver==='DRV-01','available zone driver auto-suggested');
w.toggleSel('DLV-2608-02');
ok(w.selCount()===1,'untick excludes a delivery');
w.toggleSel('DLV-2608-02');
w.pickDriver('DRV-04');
ok(w.st.driver!=='DRV-04','offline driver cannot be picked');
w.pickDriver('DRV-03');
ok(w.st.driver==='DRV-03','busy driver still pickable');
w.doAssign();
ok(w.sim==='s3','assign → monitor');
ok(w.st.runs.length===1&&w.st.runs[0].rst==='assigned','run created, status assigned');
ok(w.dst['DLV-2608-01']==='assigned','delivery status → assigned');
ok(w.readyInZone('Z-01').length===0,'assigned deliveries left the pool');

console.log('\n[monitor: decline / reassign / accept]');
const rid=w.st.runs[0].id;
w.simDecline(rid);
ok(w.st.runs.length===0,'decline removes the run');
ok(w.dst['DLV-2608-01']==='ready','declined deliveries back to ready');
w.pickZone('Z-01'); w.doAssign();
const rid2=w.st.runs[0].id;
w.reassign(rid2);
ok(w.sim==='s2'&&w.st.zone==='Z-01','reassign reopens assign with zone preset');
ok(w.selCount()===2,'reassign preselects the same deliveries');
w.doAssign();
const rid3=w.st.runs[0].id;
w.simAccept(rid3);
ok(w.st.runs[0].rst==='accepted'&&!!w.st.runs[0].acceptedAt,'accept → out_for_delivery + timestamp');
ok(w.dst['DLV-2608-01']==='accepted','delivery status → accepted');
w.simAccept(rid3);
ok(w.st.runs.length===1,'double-accept is a no-op');
w.reassign(rid3);
ok(w.st.runs[0].rst==='accepted','accepted run cannot be reassigned');

console.log('\n[summary]');
w.go('done');
ok(/Run out for delivery|الجولة/.test(shell()),'done renders');
ok(/RUN-260818/.test(shell()),'run chip shown');

console.log('\n[prepaid-only]');
w.resetB7(); w.pickZone('Z-03');
ok(!/COD badge/.test(shell()),'no COD badges anywhere (prepaid-only)');

console.log('\n[arabic]');
w.setLang('ar'); w.go('s1');
ok(d.documentElement.dir==='rtl','RTL applied');
ok(/لوحة التوزيع/.test(shell()),'AR board strings');
ok(/بانتظار الدفع/.test(shell()),'AR unpaid section');
w.setLang('en');

console.log('\nconsole errors: '+errs.length); errs.slice(0,5).forEach(e=>console.log('   '+e));
console.log('\nRESULT: '+(fail||errs.length?'FAIL ('+fail+')':'ALL PASS')+'\n');
process.exit(fail||errs.length?1:0);
