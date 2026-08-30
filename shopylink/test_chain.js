// A shipment's whole journey, announced. Before this, B1 spoke and B2–B8 were
// silent: cargo was consolidated, loaded, driven, received, assigned and
// delivered, and nothing outside those screens knew any of it had happened.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§1 every link in the chain declares what it did');
const links=[
 ['01_ReceiveParcel','parcel.received','slDeclareReceived'],
 ['02_Consolidation','parcel.consolidated',null],
 ['03_CreateTrip','trip.created',null],
 ['04_Loading','trip.loaded',null],
 ['06_ArrivalReceive','shipment.arrived',null],
 ['07_Dispatcher','run.assigned',null],
 ['08_Delivery','shipment.delivered',null]
];
/* B1 will not receive a parcel with no owner, no destination and no price — so
   the harness must state a route, exactly as a clerk must. The tariff comes from
   its owner; nothing here invents a rate. */
const TF=mk('ShopyLink_Pricing.html').localStorage.getItem('SL_TARIFF_V1');
function readyB1(w){
 w.localStorage.setItem('SL_TARIFF_V1',TF);
 w.customer={id:'C-001',name:'Layla Al-Rifai',type:'individual'};
 w.liveCartons=[{weight:6,dimL:40,dimW:30,dimH:20}];
 w.setOrigin('Guangzhou');w.setDest('Damascus');w.setMethod('air');
}
links.forEach(function(L){
 const w=mk('ShopyLink_Action_'+L[0]+'.html');
 if(L[2]) { readyB1(w); w[L[2]](); }   /* B1 declares at its own step, before done */
 /* B3 will not declare a trip whose original papers are in nobody's hands —
    the same shape as B1 refusing a parcel with no owner: the harness must state
    it, exactly as a coordinator must. */
 if(typeof w.setPapersHolder==='function') w.setPapersHolder('DRV-03','Salma Idris');
 if(!L[2]) { try{ w.go('done'); }catch(e){} }
 const evs=w.slEvRead().filter(function(e){return e.type===L[1];});
 ok(evs.length===1,L[0].replace(/^\d+_/,'')+' → '+L[1]);
 /* and never twice: a screen revisited must not claim the work again */
 if(L[2]) w[L[2]](); else { try{ w.go('done'); }catch(e){} }
 ok(w.slEvRead().filter(function(e){return e.type===L[1];}).length===1,'   …declared once, not on every visit');
});

console.log('§2 each carries enough to be useful downstream');
const c=mk('ShopyLink_Action_02_Consolidation.html'); c.go('done');
const cons=c.slEvRead().filter(e=>e.type==='parcel.consolidated')[0];
ok(!!cons.at&&'actor' in cons,'an event is stamped and attributed');
const t=mk('ShopyLink_Action_03_CreateTrip.html'); t.setPapersHolder('DRV-03','Salma Idris'); t.go('done');
const trip=t.slEvRead().filter(e=>e.type==='trip.created')[0];
ok(trip.payload&&('driver' in trip.payload||'truck' in trip.payload),'trip.created names the driver or the truck');
const l=mk('ShopyLink_Action_04_Loading.html'); l.go('done');
const load=l.slEvRead().filter(e=>e.type==='trip.loaded')[0];
ok(load.payload&&'kg' in load.payload,'trip.loaded carries the weight aboard');

console.log('§3 the log is append-only and replayable');
const w2=mk('ShopyLink_Action_04_Loading.html');
w2.slEmit('trip.loaded',{ship:'T-1',actor:'x',payload:{kg:10}});
w2.slEmit('trip.loaded',{ship:'T-2',actor:'x',payload:{kg:20}});
const all=w2.slEvRead();
ok(all.length>=2,'events accumulate rather than overwrite');
ok(all.every(function(e){return e.id&&e.at&&e.type;}),'…each with an id, a time and a type');

console.log('§4 nothing breaks when storage is gone');
const bare=mk('ShopyLink_Action_08_Delivery.html');
bare.localStorage.clear();
let threw=false;
try{ bare.go('done'); }catch(e){ threw=true; }
ok(!threw,'a module still completes its work with the bus unavailable — best effort, never blocking');
console.log('§5 the picture is derived, never kept');
const d1=mk('ShopyLink_D1_Control.html');
d1.go('s0');
ok(/nothing has moved yet|لم يتحرّك/.test(d1.document.getElementById('shell').innerHTML),
   'an empty log shows nothing rather than a plausible number');
['SH-1','SH-2','SH-3'].forEach(function(s2){ d1.slEmit('parcel.received',{ship:s2,actor:'a',payload:{}}); });
d1.slEmit('parcel.consolidated',{ship:'SH-1',actor:'a',payload:{}});
d1.slEmit('trip.loaded',{ship:'SH-1',actor:'a',payload:{}});
d1.slEmit('shipment.arrived',{ship:'SH-1',actor:'a',payload:{}});
d1.slEmit('run.assigned',{ship:'SH-1',actor:'a',payload:{}});
d1.slEmit('shipment.delivered',{ship:'SH-1',actor:'a',payload:{}});
d1.slEmit('parcel.consolidated',{ship:'SH-2',actor:'a',payload:{}});
const cc=d1.stageCounts();
ok(cc.delivered===1,'one shipment reached delivered');
ok(cc.consolidated===1,'one is at consolidated');
ok(cc.received===1,'one is still at received');
ok(d1.inFlight().length===2,'…so two are still moving — counted, not guessed');
ok(d1.shipmentStages().filter(function(x){return x.ship==='SH-1';})[0].stage==='delivered',
   'a shipment is placed at the FURTHEST point it reached, not the last event seen');
d1.go('s0');
ok(/Where everything is|أين كل شيء/.test(d1.document.getElementById('shell').innerHTML),'and the control screen shows it');
ok(/2/.test(d1.document.getElementById('shell').innerHTML),'…with the moving count on it');

console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
