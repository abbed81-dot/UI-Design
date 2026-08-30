// The loop the day was missing: a confirmed quotation tells the warehouse a shipment
// is coming, so receiving starts from what was agreed instead of a blank form.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§1 confirming a quotation announces the shipment');
const b9=mk('ShopyLink_Action_09_Billing.html');
const d9=b9.document, btn=re=>[...d9.querySelectorAll('#shell button')].find(x=>re.test(x.textContent.trim()));
b9.go('q'); b9.qSetCust('TechLine Trading'); b9.qGo(2);
b9.qSet('from','Guangzhou'); b9.qSet('dest','Damascus'); b9.qSetField('method','sea');
b9.qSet('goods','cotton textiles'); b9.qSet('cartons','40'); b9.qSet('weight','1250'); b9.qSet('volume','8.4');
b9.qPickService('Customs clearance'); b9.qSetNewQuiet('price','200'); d9.getElementById('q-add').click();
b9.qGo(3); btn(/Issue/).click();
const before=b9.slEvRead().filter(e=>e.type==='shipment.expected').length;
b9.askQuoteWin(b9.QUOTES[0].id); b9.modalOk();
const evs=b9.slEvRead().filter(e=>e.type==='shipment.expected');
ok(evs.length===before+1,'confirming emits shipment.expected');
const pay=evs[evs.length-1].payload;
ok(pay.from==='Guangzhou'&&pay.to==='Damascus'&&pay.mode==='sea','…carrying the route and mode');
ok(pay.cartons===40&&pay.weight===1250,'…and what was promised, as numbers');
ok(pay.agreed&&pay.agreed.length===1,'…and the agreed price');

console.log('§2 receiving starts from it');
const b1=mk('ShopyLink_Action_01_ReceiveParcel.html');
b1.localStorage.setItem('SL_EVENTS_V1',b9.localStorage.getItem('SL_EVENTS_V1'));
b1.go('s1');
const sh=()=>b1.document.getElementById('shell').innerHTML;
ok(/Expected/.test(sh()),'the warehouse sees it waiting');
ok(/TechLine Trading/.test(sh())&&/40 cartons/.test(sh()),'…with the client and what was promised');
const ship=b1.expectedShipments()[0].ship;
b1.startExpected(ship);
ok(b1.customer.name==='TechLine Trading','picking it fills the client — no search, no retyping');
ok(b1.mode==='sea','…the mode comes from the quotation');
ok(b1.generatedId===ship,'…and the shipment keeps its agreed id');
ok(b1.sim==='s2','…and it opens at the items, since the client is already known');

console.log('§3 promised against arrived');
const v=b1.expectedVariance();
ok(v&&v.promisedC===40&&v.promisedW===1250,'the bench knows what was promised');
ok(v.off===true,'…and a short count is flagged rather than quietly accepted');
ok(/tell the client before it is issued/.test(b1.variancePanel()),'…with what to do about it: the invoice follows what arrived');

console.log('§4 once received it leaves the queue');
b1.slEmit('parcel.received',{ship:ship,actor:'x',payload:{}});
ok(b1.expectedShipments().every(x=>x.ship!==ship),'a received shipment is no longer expected');

console.log('§5 nothing announced, nothing changed');
const bare=mk('ShopyLink_Action_01_ReceiveParcel.html');
bare.go('s1');
ok(!/Expected/.test(bare.document.getElementById('shell').innerHTML),'with no bus the screen is exactly as it always was');
ok(bare.document.getElementById('shell').innerHTML.length>1500,'…and receiving by search still works');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
