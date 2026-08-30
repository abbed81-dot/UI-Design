// Exposure only ever grew: a client who paid every invoice on time still filled
// his ceiling and was refused, which is the opposite of what a facility is for.
// Money is now counted where it ARRIVED — billing for cash and bank, delivery
// for what a permitted driver took at the door — and the client's exposure is
// what was issued less what came in.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

const d1=mk('ShopyLink_D1_Control.html'); const CLI=d1.localStorage.getItem('SL_CLIENTS_V1');
const c2=mk('ShopyLink_Action_C2_Drivers.html'); const DRV=c2.localStorage.getItem('SL_DRIVERS_V1');
const drivers=JSON.parse(DRV).drivers;

console.log('§1 taking money at the door is a permission, held on the record');
ok(drivers.every(d=>typeof d.cash==='boolean'),'1.1 every driver record answers the question, one way or the other');
ok(drivers.some(d=>d.cash)&&drivers.some(d=>!d.cash),'1.2 …and they do not all answer it the same way');
ok(!/cash\s*:/.test(fs.readFileSync('ShopyLink_Action_08_Delivery.html','utf8').split('var STOPS_SEED=')[1].slice(0,2000)),'1.3 delivery keeps no opinion of its own about who may collect');

console.log('\n§2 billing records what reached the company');
const b9=mk('ShopyLink_Action_09_Billing.html');
b9.localStorage.setItem('SL_CLIENTS_V1',CLI); b9.render();
b9.openInv('BSH-240705-01');
const V=b9.invByShip('BSH-240705-01');
b9.setTerm('credit'); b9.askIssue(); b9.modalOk();
ok(V.status==='issued','2.1 an invoice is issued to begin with');
const total=b9.totals(V)[b9.primaryCurOf(V)];
const before=b9.creditUsed(V,b9.primaryCurOf(V));
ok(before>0,'2.2 it shows as exposure — '+before);
const half=Math.round(total*50)/100;
const r1=b9.recordPayment(V.inv_no,half,'bank','TRF-9910');
ok(r1.ok===true,'2.3 a part payment is accepted from a business with a facility');
ok(b9.creditUsed(V,b9.primaryCurOf(V))===Math.round((before-half)*100)/100,'2.4 …and the exposure comes DOWN by exactly what came in');
ok(b9.dueOn(V)===Math.round((total-half)*100)/100,'2.5 the invoice knows what is still owed');
const evs=()=>JSON.parse(b9.localStorage.getItem('SL_EVENTS_V1')||'[]');
const pe=evs().filter(e=>e.type==='invoice.paid')[0];
ok(!!pe&&pe.payload.rcpt===r1.rcpt,'2.6 the receipt has a number, so the same money cannot be counted twice');
ok(pe.payload.method==='bank'&&pe.payload.ref==='TRF-9910','2.7 how it came and its reference travel with it');
ok(pe.payload.holder==='company','2.8 …and that the company is holding it');
ok(pe.actor&&pe.actor!=='B9','2.9 the event names the person, never the screen');

console.log('\n§3 what cannot be paid');
ok(b9.recordPayment(V.inv_no,total,'cash','').ok===false,'3.1 more than is owed is refused');
ok(b9.recordPayment('INV-NOPE',10,'cash','').ok===false,'3.2 …as is a payment against an invoice that does not exist');
const r2=b9.recordPayment(V.inv_no,Math.round((total-half)*100)/100,'cash','');
ok(r2.ok===true&&r2.left===0,'3.3 the rest settles it');
ok(b9.creditUsed(V,b9.primaryCurOf(V))===0,'3.4 …and the ceiling is free again — the whole point of a facility');
ok(b9.recordPayment(V.inv_no,1,'cash','').ok===false,'3.5 a settled invoice takes no more money');

console.log('\n§4 a part payment is a credit arrangement, so it needs a facility');
const b92=mk('ShopyLink_Action_09_Billing.html');
b92.localStorage.setItem('SL_CLIENTS_V1',CLI); b92.render();
const IND=b92.invByShip('CON-240701-01');
ok(b92.mayPartPay(IND)===false,'4.1 an individual may not pay in parts');
const SHAM=b92.invByShip('BSH-240707-03');
ok(b92.mayPartPay(SHAM)===false,'4.2 nor a business with no facility — being a business grants nothing');
ok(b92.mayPartPay(b92.invByShip('BSH-240705-01'))===true,'4.3 a business with a granted facility may');
b92.openInv('CON-240701-01'); b92.setTerm('prepaid'); b92.askIssue(); b92.modalOk();
const t4=b92.totals(IND)[b92.primaryCurOf(IND)];
ok(b92.recordPayment(IND.inv_no,Math.round(t4*30)/100,'cash','').ok===false,'4.4 …so a third of it is refused at the act');
ok(b92.recordPayment(IND.inv_no,t4,'cash','').ok===true,'4.5 the whole of it is taken');

console.log('\n§5 at the door: only a driver who may');
const mkB8=(runDriver,evts)=>{
 const w=mk('ShopyLink_Action_08_Delivery.html');
 w.localStorage.setItem('SL_DRIVERS_V1',DRV);
 w.localStorage.setItem('SL_EVENTS_V1',JSON.stringify(evts||[]));
 if(w.RUN)w.RUN.driverId=runDriver;
 return w;
};
const allowed=drivers.filter(d=>d.cash)[0], barred=drivers.filter(d=>!d.cash)[0];
const SHIP='BSH-240705-01';
const chain=[{id:'E1',at:1,type:'invoice.issued',ship:SHIP,client:'TechLine Trading',actor:'x',
  payload:{inv:'INV-2608-05',amount:1200,cur:'USD',term:'prepaid'}}];
const w5=mkB8(barred.id,chain);
ok(w5.mayCollect()===false,'5.1 a driver without the permission may not collect');
ok(w5.collectAt('DLV-2608-04').ok===false,'5.2 …and the act refuses him, not merely the button');
ok(JSON.parse(w5.localStorage.getItem('SL_EVENTS_V1')).filter(e=>e.type==='invoice.paid').length===0,'5.3 nothing reaches the log');
const w6=mkB8(allowed.id,chain);
ok(w6.mayCollect()===true,'5.4 the permitted driver may');
ok(w6.dueAt(SHIP).amount===1200,'5.5 what is owed is read from the log, not typed at the door');
const c=w6.collectAt('DLV-2608-04');
ok(c.ok===true&&c.amount===1200,'5.6 …and he collects exactly that');
const pd=JSON.parse(w6.localStorage.getItem('SL_EVENTS_V1')).filter(e=>e.type==='invoice.paid')[0];
ok(pd.payload.holder==='driver:'+allowed.id,'5.7 the money is held by the DRIVER, named — not by the company yet');
ok(pd.payload.remitted===false,'5.8 …and it says plainly that it has not been remitted');
ok(pd.actor===allowed.name,'5.9 the receipt names who took it');
ok(pd.payload.method==='cod','5.10 and how');
ok(w6.collectAt('DLV-2608-04').ok===false,'5.11 the same door cannot be collected twice — the log already shows it settled');
w6.stops().push({id:'DLV-TEST-9',ship:'',n:9,customer:'Someone',cartons:['C01'],attempts:0,stt:'pending'});
ok(w6.collectAt('DLV-TEST-9').ok===false,'5.12 a stop carrying no shipment collects nothing, rather than guessing which (the seed no longer has one — the case is built here rather than borrowed from a fault)');

console.log('\n§6 the two collectors count as one');
const b93=mk('ShopyLink_Action_09_Billing.html');
b93.localStorage.setItem('SL_CLIENTS_V1',CLI);
b93.localStorage.setItem('SL_EVENTS_V1',JSON.stringify([
 {id:'E1',at:1,type:'invoice.issued',ship:SHIP,client:'TechLine Trading',actor:'x',
  payload:{inv:'INV-9',amount:1000,cur:'USD',term:'credit'}},
 {id:'E2',at:2,type:'invoice.paid',ship:SHIP,client:'TechLine Trading',actor:'driver',
  payload:{inv:'INV-9',amount:400,cur:'USD',rcpt:'RCP-1',holder:'driver:DRV-01'}},
 {id:'E3',at:3,type:'invoice.paid',ship:SHIP,client:'TechLine Trading',actor:'driver',
  payload:{inv:'INV-9',amount:400,cur:'USD',rcpt:'RCP-1',holder:'driver:DRV-01'}},
 {id:'E4',at:4,type:'invoice.paid',ship:SHIP,client:'TechLine Trading',actor:'cashier',
  payload:{inv:'INV-9',amount:200,cur:'USD',rcpt:'RCP-2',holder:'company'}}
]));
b93.render();
const V6=b93.invByShip('BSH-240705-01');
ok(b93.paidFor('TechLine Trading','USD')===600,'6.1 the receipt repeated in the log is counted once — 400 + 200');
ok(b93.creditUsed(V6,'USD')>=0,'6.2 and the exposure never falls below zero, whatever the log says');
ok(b93.paidOn('INV-9')===600,'6.3 the invoice sees both collectors, the driver and the counter');

console.log('\n§7 the driver hands it over, and it stops being his');
const b94=mk('ShopyLink_Action_09_Billing.html');
b94.localStorage.setItem('SL_CLIENTS_V1',CLI);
b94.localStorage.setItem('SL_DRIVERS_V1',DRV);
b94.localStorage.setItem('SL_EVENTS_V1',JSON.stringify([
 {id:'E1',at:1,type:'invoice.paid',ship:SHIP,client:'TechLine Trading',actor:'Samer Haddad',
  payload:{inv:'INV-9',amount:1200,cur:'USD',rcpt:'RCP-A',holder:'driver:DRV-01',remitted:false}},
 {id:'E2',at:2,type:'invoice.paid',ship:'X-2',client:'Sham Import LLC',actor:'Samer Haddad',
  payload:{inv:'INV-10',amount:300,cur:'USD',rcpt:'RCP-B',holder:'driver:DRV-01',remitted:false}},
 {id:'E3',at:3,type:'invoice.paid',ship:'X-3',client:'Layla Al-Rifai',actor:'cashier',
  payload:{inv:'INV-11',amount:90,cur:'USD',rcpt:'RCP-C',holder:'company'}}
]));
b94.render();
const held=b94.driverHoldings();
ok(held.length===1&&held[0].driver==='DRV-01','7.1 one driver is holding money');
ok(held[0].amount===1500,'7.2 …the sum of what he collected — 1,200 + 300');
ok(held[0].name===allowed.name,'7.3 named from the drivers registry, not from an id on a screen');
ok(b94.driverHoldings().every(x=>x.driver!=='company'),'7.4 what reached the counter is not counted as anyone\'s pocket');
ok(/Cash held by drivers/.test(b94.document.getElementById('shell').innerHTML),'7.5 and the counter can see it without being told');
ok(b94.receiveFromDriver('DRV-01',2000,'USD').ok===false,'7.6 more than he holds is refused');
ok(b94.receiveFromDriver('DRV-99',10,'USD').ok===false,'7.7 …as is a driver holding nothing');
const r7=b94.receiveFromDriver('DRV-01',500,'USD');
ok(r7.ok===true&&r7.left===1000,'7.8 a part hand-over leaves the rest with him');
ok(b94.heldBy('DRV-01','USD')===1000,'7.9 …and what he holds is derived again, never stored');
const rm=JSON.parse(b94.localStorage.getItem('SL_EVENTS_V1')).filter(e=>e.type==='cash.remitted')[0];
ok(rm.payload.driver==='DRV-01'&&rm.payload.holder==='company','7.10 the receipt says the money passed to the company');
ok(!!rm.actor,'7.11 …and names who received it');
b94.receiveFromDriver('DRV-01',1000,'USD');
ok(b94.heldBy('DRV-01','USD')===0,'7.12 handing the rest over clears him');
ok(b94.driverHoldings().length===0,'7.13 …and he leaves the list');
ok(b94.receiveFromDriver('DRV-01',1,'USD').ok===false,'7.14 nothing more can be received from an empty pocket');

console.log('\n§8 remitting is not paying');
const V8=b94.invByShip('BSH-240705-01');
ok(b94.paidOn('INV-9')===1200,'8.1 the client stayed settled through all of it — his debt cleared at the door');
ok(b94.creditUsed(V8,'USD')===0,'8.2 …and moving cash between our own hands never touches his exposure');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
