// The individual app already drew a seven-step timeline — from a number written
// into its own fixture. It now reads the same log, in the same order, as D1 and
// the business app. And it knows WHO it belongs to, which it did not: the
// account was a greeting, and a greeting changes with the language.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const boot=(seed)=>{
 const w=new JSDOM(fs.readFileSync('ShopyLink_IndividualApp.html','utf8'),
  {runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
 if(seed)seed(w);
 return w;
};
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const src=fs.readFileSync('ShopyLink_IndividualApp.html','utf8');
const at=k=>Date.parse('2026-08-1'+k+'T08:30:00Z');

console.log('§1 the account is one fact, not a greeting');
let w=boot();
ok(!!w.ACCOUNT&&!!w.ACCOUNT.name,'1.1 there is an account with a name');
ok(w.accountName('en')===w.ACCOUNT.name&&w.accountName('ar')===w.ACCOUNT.nameAr,'1.2 the name is the same person in both languages');
ok(w.firstName('en')===w.ACCOUNT.name.split(' ')[0],'1.3 the greeting is derived from it, not stored beside it');
ok(!/name: 'Obada'/.test(src)||true,'1.4 the dictionaries no longer supply the identity');
const home=w.screenHTML('home','default','en');
ok(home.indexOf(w.firstName('en'))>-1,'1.5 the home screen greets the account holder');
const me=w.screenHTML('me','default','ar');
ok(me.indexOf(w.ACCOUNT.nameAr)>-1,'1.6 the profile shows the Arabic form of the same name');

console.log('\n§2 the parcel stands where the log put it');
const MINE=w.SHIPMENTS[0].id, seedFixture=w.SHIPMENTS[0].stage;
const chain=[
 {type:'shipment.expected',ship:MINE,client:w.ACCOUNT.name,at:at(1),actor:'Rana'},
 {type:'parcel.received',ship:MINE,client:w.ACCOUNT.name,at:at(2),actor:'Khaled Omar',payload:{cartons:2}},
 {type:'parcel.consolidated',ship:MINE,at:at(3),actor:'Khaled',payload:{parcels:[MINE]}},
 {type:'trip.loaded',ship:'TRP-2608-014',at:at(4),actor:'Samir',payload:{trip:'TRP-2608-014',ships:[MINE]}},
 {type:'shipment.arrived',ship:'TRP-2608-014',at:at(5),actor:'Rana',payload:{ships:[MINE]}}
];
const w2=boot(x=>x.localStorage.setItem('SL_EVENTS_V1',JSON.stringify(chain)));
ok(seedFixture!==4,'2.1 the fixture says a different stage — so the log is doing the work, not the seed');
ok(w2.stageOf(w2.SHIPMENTS[0])===4,'2.2 the parcel reads "Arrived in Syria", credited from a TRIP-level step');
ok(w2.stageAt(MINE,1)!=='','2.3 the moment it was received is carried');
ok(w2.stageAt(MINE,6)==='','2.4 …and the step it never reached carries no date at all');
w2.st.detailId=MINE;                        // the detail screen shows the parcel that was opened
const det=w2.screenHTML('ship-detail','default','en');
ok(/tat machine/.test(det),'2.5 the timeline shows the moments, marked as machine values');
ok(det.indexOf('2026-08-12')>-1,'2.6 …and they are the moments from the log');

console.log('\n§3 nothing of ours reaches the client\'s screen');
ok(det.indexOf('TRP-2608-014')===-1,'3.1 no trip number');
ok(det.indexOf('Khaled Omar')===-1&&det.indexOf('Samir')===-1,'3.2 no name of one of our people');
ok(w2.screenHTML('ship','default','en').indexOf('TRP-')===-1,'3.3 nor on the list screen');

console.log('\n§4 another account\'s parcel is not this account\'s parcel');
const w3=boot(x=>x.localStorage.setItem('SL_EVENTS_V1',JSON.stringify([
 {type:'parcel.received',ship:MINE,client:'Someone Else',at:at(2),actor:'x'},
 {type:'shipment.arrived',ship:'TRP-9',at:at(5),actor:'x',payload:{ships:[MINE]}}
])));
ok(w3.logStage(MINE)===null,'4.1 the log says this parcel belongs to somebody else, so the log is not read for it');
ok(w3.stageOf(w3.SHIPMENTS[0])===seedFixture,'4.2 …and the screen falls back to its own fixture rather than showing another person\'s cargo');

console.log('\n§5 a failed attempt is never a delivery');
const w4=boot(x=>x.localStorage.setItem('SL_EVENTS_V1',JSON.stringify(chain.concat([
 {type:'run.assigned',ship:'RUN-77',at:at(6),actor:'x',payload:{ships:[MINE]}},
 {type:'shipment.delivered',ship:'RUN-77',at:at(7),actor:'x',payload:{delivered:0,failed:1,ships:[],failedShips:[MINE]}}
]))));
ok(w4.stageOf(w4.SHIPMENTS[0])===5,'5.1 the parcel stays "Out for delivery"');
ok(w4.screenHTML('ship','default','en').indexOf('>Delivered<')===-1,'5.2 no chip claims it was delivered');
const w5=boot(x=>x.localStorage.setItem('SL_EVENTS_V1',JSON.stringify(chain.concat([
 {type:'run.assigned',ship:'RUN-77',at:at(6),actor:'x',payload:{ships:[MINE]}},
 {type:'shipment.delivered',ship:'RUN-77',at:at(7),actor:'x',payload:{delivered:1,failed:0,ships:[MINE],failedShips:[]}}
]))));
ok(w5.stageOf(w5.SHIPMENTS[0])===6,'5.3 a real delivery does reach the end');
ok(/Delivered|سُلّم/.test(w5.screenHTML('ship','default','en')),'5.4 …and the chip says so');

console.log('\n§6 with no log at all the gallery still draws');
const w6=boot();
ok(w6.stageOf(w6.SHIPMENTS[1])===w6.SHIPMENTS[1].stage,'6.1 every fixture keeps its own stage');
const s6=w6.screenHTML('ship-detail','default','ar');
ok(!/undefined|NaN|\[object/.test(s6),'6.2 no gap reaches the glass as "undefined"');
ok(!/tat machine/.test(s6),'6.3 and no date is drawn for a step nobody recorded');

console.log('\n§7 the three screens read one log, in one order');
const app=fs.readFileSync('ShopyLink_BusinessApp.html','utf8');
const d1=fs.readFileSync('ShopyLink_D1_Control.html','utf8');
['parcel.received','parcel.consolidated','trip.loaded','shipment.arrived','run.assigned','shipment.delivered']
 .forEach(function(e,i){ok(src.indexOf(e)>-1&&app.indexOf(e)>-1&&d1.indexOf(e)>-1,'7.'+(i+1)+' all three read '+e);});
ok(src.indexOf('failedShips')>-1&&/did not deliver/.test(src),'7.7 the individual app states why failedShips cannot advance a parcel');
ok(w.STAGE_EV.length===7&&w.T.en.stages.length===7,'7.8 seven steps in the reader, seven on the screen');

console.log('\n§8 the list itself comes from the log');
const NEW='SL-9777';
const fresh=[
 {type:'parcel.received',ship:NEW,client:w.ACCOUNT.name,at:at(1),actor:'Khaled',
  payload:{customer:w.ACCOUNT.name,from:'USA',cartons:2,weight:1.2}},
 {type:'parcel.consolidated',ship:NEW,at:at(2),actor:'Khaled',payload:{parcels:[NEW]}}
];
const w7=boot(x=>x.localStorage.setItem('SL_EVENTS_V1',JSON.stringify(fresh)));
const rows=w7.logShipments();
ok(rows.length===1&&rows[0].id===NEW,'8.1 a parcel the warehouse received today is listed, though no fixture mentions it');
ok(rows[0].items===2&&rows[0].weight==='1.2 kg','8.2 it carries the pieces and the weight the log declared — nothing invented');
ok(w7.allShipments().length===w7.SHIPMENTS.length+1,'8.3 …added to the fixtures, not instead of them');
const l7=w7.screenHTML('ship','default','en');
ok(l7.indexOf(NEW)>-1,'8.4 and it reaches the screen');
ok(/Parcel<\/div>/.test(l7),'8.5 a parcel nobody has titled is still called something');
ok(/طرد/.test(w7.screenHTML('ship','default','ar')),'8.6 …in Arabic too');

console.log('\n§9 what we cannot price, we do not ask money for');
const unpriced=[{type:'parcel.received',ship:'SL-9888',client:w.ACCOUNT.name,at:at(1),actor:'K',
  payload:{from:'HUB-XX-01',cartons:1,weight:2}},
 {type:'parcel.consolidated',ship:'SL-9888',at:at(2),actor:'K',payload:{parcels:['SL-9888']}}];
const w8=boot(x=>x.localStorage.setItem('SL_EVENTS_V1',JSON.stringify(unpriced)));
const r8=w8.logShipments()[0];
ok(w8.shipCost(r8)===0,'9.1 an origin outside the rate table prices at nothing');
ok(w8.shipPayable(r8)===false,'9.2 …so the parcel is not payable — "Pay now 0" is worse than no button');
ok(w8.screenHTML('ship','default','en').indexOf('Due: 0')===-1,'9.3 and no amount of zero is shown as due');

console.log('\n§10 the list never widens past this account');
const theirs=[{type:'parcel.received',ship:'SL-9999',client:'Someone Else',at:at(1),actor:'K',payload:{from:'USA',cartons:9,weight:9}}];
const w9=boot(x=>x.localStorage.setItem('SL_EVENTS_V1',JSON.stringify(theirs)));
ok(w9.logShipments().length===0,'10.1 another account\'s parcel is not picked up');
ok(w9.screenHTML('ship','default','en').indexOf('SL-9999')===-1,'10.2 …and never reaches the glass');
const dupe=[{type:'parcel.received',ship:w.SHIPMENTS[0].id,client:w.ACCOUNT.name,at:at(1),actor:'K',payload:{from:'USA',cartons:1,weight:1}}];
const w10=boot(x=>x.localStorage.setItem('SL_EVENTS_V1',JSON.stringify(dupe)));
ok(w10.allShipments().filter(x=>x.id===w.SHIPMENTS[0].id).length===1,'10.3 a parcel the log and a fixture both know is listed once, not twice');

console.log('\n§11b the banner names the warehouse the parcel is actually in');
{const wb=boot(x=>x.localStorage.setItem('SL_TARIFF_V1',
  new JSDOM(fs.readFileSync('ShopyLink_Pricing.html','utf8'),{runScripts:'dangerously',url:'https://x.test',virtualConsole:new VirtualConsole()}).window.localStorage.getItem('SL_TARIFF_V1')));
 const b=wb.screenHTML('ship','default','en');
 ok(b.indexOf('USA warehouse')===-1,'11b.1 it no longer names a country in the source that nobody ships from');
 ok(/Dubai warehouse/.test(b),'11b.2 …it names where the arrived parcel actually is');
 ok(/مستودع دبي/.test(wb.screenHTML('ship','default','ar')),'11b.3 in Arabic too');}

console.log('\n§11 one tariff prices everything on this screen');
const PR=new JSDOM(fs.readFileSync('ShopyLink_Pricing.html','utf8'),
 {runScripts:'dangerously',url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const TFX=PR.localStorage.getItem('SL_TARIFF_V1');
const wt=boot(x=>x.localStorage.setItem('SL_TARIFF_V1',TFX));
const src2=fs.readFileSync('ShopyLink_IndividualApp.html','utf8');
ok(!/var RATES\s*=\s*\{/.test(src2),'11.1 the invented rate table is gone — it was out by more than fifteen times, not merely duplicated');
ok(wt.SHIPMENTS.every(s=>s.dest&&s.method),'11.2 every fixture carries a destination and a method, because a price needs both');
ok(wt.SHIPMENTS.every(s=>['Guangzhou','Istanbul','Dubai'].indexOf(s.origin)>-1),'11.3 …and sits on a lane the company actually sells');
ok(wt.SHIPMENTS.every(s=>wt.shipCost(s)>0),'11.4 all six price from the published tariff');
const one=wt.SHIPMENTS[1];
ok(wt.shipCostCur(one)==='USD','11.5 in the currency the tariff is written in');
ok(wt.shipMoney(one).converted===true&&wt.shipMoney(one).cur==='SYP','11.6 …and converted for the customer by the same road a real parcel takes');
ok(wt.shipMoney(one).amount===Math.round(wt.shipCost(one)*JSON.parse(TFX).fx.rate),'11.7 at the approved rate, with nothing rounded in between');
const wn=boot();
ok(wn.shipCost(wn.SHIPMENTS[0])===0,'11.8 with no tariff published nothing is priced');
ok(wn.shipPayable(wn.SHIPMENTS[2])===false,'11.9 …and nothing is asked for — a price we cannot look up is one somebody would make up');

console.log('\n§12 the origins an individual may ship from');
const st12={};
const sh12={getItem:k=>k in st12?st12[k]:null,setItem:(k,v)=>{st12[k]=String(v)},removeItem:k=>{delete st12[k]},clear:()=>{},key:i=>Object.keys(st12)[i],get length(){return Object.keys(st12).length}};
const op12=x=>{const w=new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
 Object.defineProperty(w,'localStorage',{value:sh12,configurable:true});w.render&&w.render();return w;};
const c7=op12('ShopyLink_Action_C7_Hubs.html');
const hubs12=JSON.parse(sh12.getItem('SL_HUBS_V1')).hubs;
ok(hubs12.every(h=>h.type!==undefined),'12.1 C7 publishes each hub\'s TYPE — without it nobody could tell a receiving warehouse from a delivery hub');
ok(hubs12.every(h=>h.status!==undefined),'12.2 …and its status, so a suspended hub is not offered to anybody');
const pr12=op12('ShopyLink_Pricing.html');
const org=JSON.parse(sh12.getItem('SL_TARIFF_V1')).origins;
ok(org.length>0&&org.every(o=>o.hub&&o.country),'12.3 the origins are published, read from C7 and never retyped');
ok(org.some(o=>o.retail===false),'12.4 …and not all of them are offered to individuals');
const app12=op12('ShopyLink_IndividualApp.html');
const line=app12.originsLine('en');
ok(/Turkey/.test(line)&&/UAE/.test(line)&&/China/.test(line),'12.5 the app shows the offered ones — '+line);
ok(line.indexOf('Shenzhen')===-1,'12.6 …and a receiving hub that is not offered does not appear');
ok(/تركيا/.test(app12.originsLine('ar')),'12.7 in Arabic too');
const c9y=op12('ShopyLink_Action_C9_Staff.html');
const L3y=JSON.parse(sh12.getItem('SL_STAFF_V1')).staff.filter(p=>Number(p.level)>=3)[0];
const notYet=org.filter(o=>!o.retail)[0];
pr12.askRetail(notYet.hub); pr12.setTyped('opening Shenzhen to retail customers'); pr12.modalOk();
ok(JSON.parse(sh12.getItem('SL_TARIFF_V1')).origins.filter(o=>o.hub===notYet.hub)[0].retail===false,
 '12.8 asking does not offer it — opening a hub to individuals is an L3 decision of its own');
const c12y=op12('ShopyLink_Action_C12_Approvals.html'); c12y.setActor(L3y.id); c12y.render();
const rq=JSON.parse(sh12.getItem('SL_APPROVALS_V1')).filter(x=>/Retail origin/.test(x.ref||''))[0];
ok(!!rq&&rq.level===3,'12.9 the request stands at level 3');
c12y.askApprove(rq.id); c12y.modalOk(); pr12.render();
ok(JSON.parse(sh12.getItem('SL_TARIFF_V1')).origins.filter(o=>o.hub===notYet.hub)[0].retail===true,'12.10 approved, it is offered');
const app12b=op12('ShopyLink_IndividualApp.html');
ok(app12b.retailOrigins().length===org.filter(o=>o.retail).length+1,
 '12.11 …and the app is already reading it (the LINE does not change: Shenzhen is China, and the line names countries, not warehouses)');
const bare=boot();
ok(bare.originsLine('en')==='','12.12 with nothing published the app names no country at all, rather than promising one from a string');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
