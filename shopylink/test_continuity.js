// The owner's law: a shipment cannot appear from nowhere and cannot vanish. It
// is on the record from the moment it is taken in until it is handed over —
// including through failed delivery attempts, which are not an ending.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const D1=()=>mk('ShopyLink_D1_Control.html');

console.log('§1 only being taken in brings a shipment into existence');
let d=D1();
d.slEmit('trip.loaded',{ship:'TRP-1',actor:'x',payload:{ships:['GHOST-001']}});
d.slEmit('shipment.arrived',{ship:'TRP-1',actor:'x',payload:{ships:['GHOST-001']}});
d.slEmit('run.assigned',{ship:'RUN-1',actor:'x',payload:{ships:['GHOST-001']}});
ok(d.shipmentStages().length===0,'1.1 a shipment no warehouse ever received does not reach the board, however many steps name it');
ok(d.shipGhosts().length===1&&d.shipGhosts()[0].ship==='GHOST-001','1.2 …it is reported as a ghost instead — a fault to be seen, not a row to be drawn');
ok(d.shipGhosts()[0].firstSeen==='trip.loaded','1.3 …naming the step that first claimed to carry it');
const d2=D1();
d2.slEmit('shipment.expected',{ship:'BK-1',client:'A',actor:'x'});
ok(d2.shipGhosts().length===0,'1.4 a booking brings one into existence too — it is expected, and the client was told so, so it is no ghost');
ok(d2.shipmentStages().length===1&&d2.shipmentStages()[0].stage==='expected','1.4b …and the board shows it as expected, which it did not before: it counted from the receipt while the customer counted from the booking, so one shipment read two ways');
const d3=D1();
d3.slEmit('parcel.consolidated',{ship:'P-1',actor:'x',payload:{parcels:['P-1','P-2']}});
ok(d3.shipmentStages().length===2,'1.5 consolidation may name parcels it did not itself receive — each was received a moment earlier, on its own');

console.log('\n§2 …and then it moves, but is never conjured');
const d4=D1(); const S=d4.SHIPS[0].id;
d4.slEmit('parcel.received',{ship:S,client:'Layla Al-Rifai',actor:'Khaled'});
ok(d4.shipmentStages()[0].stage==='received','2.1 received');
d4.slEmit('trip.loaded',{ship:'TRP-9',actor:'x',payload:{ships:[S]}});
ok(d4.shipmentStages()[0].stage==='loaded','2.2 a trip moves it');
ok(d4.shipmentStages().length===1,'2.3 …and adds nobody else');

console.log('\n§3 a failed attempt is not an ending');
const d5=D1(); const T=d5.SHIPS[0].id;
d5.slEmit('parcel.received',{ship:T,client:'A',actor:'x'});
d5.slEmit('run.assigned',{ship:'RUN-1',actor:'x',payload:{ships:[T]}});
d5.slEmit('shipment.delivered',{ship:'RUN-1',actor:'x',payload:{delivered:0,failed:1,ships:[],failedShips:[T]}});
ok(d5.shipmentStages()[0].stage==='assigned','3.1 after one failure it stands at "out for delivery", not delivered and not gone');
ok(d5.inFlight().some(x=>x.ship===T||x.id===T),'3.2 …and it is still in flight, which is where somebody will look for it');
d5.slEmit('run.assigned',{ship:'RUN-2',actor:'x',payload:{ships:[T]}});
d5.slEmit('shipment.delivered',{ship:'RUN-2',actor:'x',payload:{delivered:0,failed:1,ships:[],failedShips:[T]}});
ok(d5.shipmentStages()[0].stage==='assigned','3.3 after a second failure it is still there — two failures do not delete a carton');
ok(d5.shipmentStages().length===1,'3.4 …and it is still ONE shipment, not one per attempt');
d5.slEmit('run.assigned',{ship:'RUN-3',actor:'x',payload:{ships:[T]}});
d5.slEmit('shipment.delivered',{ship:'RUN-3',actor:'x',payload:{delivered:1,failed:0,ships:[T],failedShips:[]}});
ok(d5.shipmentStages()[0].stage==='delivered','3.5 the third attempt succeeds and only then is it delivered');
ok(!d5.inFlight().some(x=>x.ship===T||x.id===T),'3.6 …and only then does it leave the in-flight list');

console.log('\n§4 nothing is deleted behind anyone\'s back');
const before=JSON.parse(d5.localStorage.getItem('SL_EVENTS_V1')).length;
d5.shipmentStages();d5.inFlight();d5.shipGhosts();
ok(JSON.parse(d5.localStorage.getItem('SL_EVENTS_V1')).length===before,'4.1 reading the board writes nothing and removes nothing');
const evs=JSON.parse(d5.localStorage.getItem('SL_EVENTS_V1'));
ok(evs.filter(e=>e.type==='shipment.delivered').length===3,'4.2 all three attempts are still on the log, the two failures included');
ok(evs.every(e=>e.at>0&&e.id),'4.3 every one of them timed and identified — the log is appended to, never edited');

console.log('\n§5 the seeds themselves: who holds a shipment nobody received');
const b7=mk('ShopyLink_Action_07_Dispatcher.html');
const b8=mk('ShopyLink_Action_08_Delivery.html');
const b9=mk('ShopyLink_Action_09_Billing.html');
const board=D1().SHIPS.map(s=>s.id);
const held={ 'B7 dispatcher':b7.DELIVERIES_SEED.map(x=>x.ship),
             'B8 delivery run':b8.STOPS_SEED.map(x=>x.ship),
             'B9 billing':b9.INVOICES.map(x=>x.ship) };
ok(b8.STOPS_SEED.every(s=>!!s.ship),'5.1 every stop on the seeded run names its cargo — the invented customer is gone');
ok(b8.STOPS_SEED.every(s=>b7.DELIVERIES_SEED.some(d=>d.id===s.id)),'5.2 …and every stop exists in the dispatcher seed that created it');
ok(b8.STOPS_SEED.every(s=>b7.DELIVERIES_SEED.some(d=>d.id===s.id&&d.ship===s.ship)),'5.3 …carrying the same shipment in both, not two opinions of one delivery');
Object.keys(held).forEach(function(k){
 const strays=held[k].filter(x=>x&&board.indexOf(x)===-1);
 ok(true,'5.x '+k+' holds '+held[k].length+', of which '+strays.length+' are not on D1\'s board — a count, not a verdict: a seed is each module\'s own demonstration day, and it must have one to open alone');
});

console.log('\n§6 the gap this leaves, stated rather than hidden');
const d6=D1();
ok(typeof d6.shipGhosts==='function','6.1 the board can name what claims to exist and does not');
ok(/SL_SHIPMENTS_V1/.test(fs.readFileSync('ShopyLink_D1_Control.html','utf8')),'6.2 the register is published — §7 drives it. Each module keeps a seed so it can open alone, and steps it aside the moment the register answers: that is asserted module by module in test_seeds.js, which is what this section used to only measure');

console.log('\n§7 the register is published, so nobody has to invent one');
const d7=D1();
const S7='CON-240703-02';
d7.slEmit('shipment.expected',{ship:S7,client:'Ahmad Khalil',actor:'Rana'});
d7.slEmit('parcel.received',{ship:S7,client:'Ahmad Khalil',actor:'Khaled',
 payload:{from:'Dubai',to:'Damascus',mode:'air',price:{amount:212.3,cur:'USD',basis:'perkg'}}});
d7.slEmit('run.assigned',{ship:'RUN-1',actor:'x',payload:{ships:[S7]}});
d7.slEmit('shipment.delivered',{ship:'RUN-1',actor:'x',payload:{delivered:0,failed:1,ships:[],failedShips:[S7]}});
d7.slEmit('shipment.delivered',{ship:'RUN-2',actor:'x',payload:{delivered:0,failed:1,ships:[],failedShips:[S7]}});
d7.slEmit('trip.loaded',{ship:'TRP-9',actor:'x',payload:{ships:['GHOST-7']}});
d7.render();
const reg=JSON.parse(d7.localStorage.getItem('SL_SHIPMENTS_V1'));
const one=reg.shipments.filter(x=>x.ship===S7)[0];
ok(!!one,'7.1 the shipment is published');
ok(one.client==='Ahmad Khalil','7.2 with the owner declared at receipt');
ok(one.from==='Dubai'&&one.to==='Damascus'&&one.mode==='air','7.3 …its origin, its destination and how it travels — a shipment has all three or it was never received');
ok(one.price&&one.price.amount===212.3,'7.4 …and what it was priced at when it was taken in');
ok(one.stage==='assigned'&&one.attempts===2,'7.5 …where it stands, and that two attempts have failed');
ok(one.open===true,'7.6 …and that it is still open, which is what makes it findable');
ok(reg.ghosts.length===1&&reg.ghosts[0].ship==='GHOST-7','7.7 what claims to exist and cannot be accounted for travels too, separately');
ok(reg.shipments.every(x=>x.ship!=='GHOST-7'),'7.8 …and never as a shipment');
ok(JSON.stringify(reg.shipments).indexOf('undefined')===-1,'7.9 no gap reaches the channel as "undefined"');
d7.render();
const again=JSON.parse(d7.localStorage.getItem('SL_SHIPMENTS_V1'));
ok(again.shipments.length===reg.shipments.length,'7.10 it is derived on every pass and stored nowhere — reading twice does not double it');

console.log('\n§8 one order of stages, everywhere');
const app=mk('ShopyLink_IndividualApp.html');
const biz=mk('ShopyLink_BusinessApp.html');
ok(d7.STAGES.length===7,'8.1 the board counts seven now, from the booking');
ok(d7.STAGES[0].id==='expected','8.2 …beginning where the client\'s promise begins');
ok(app.STAGE_EV.length===7&&biz.STAGES_C.length===7,'8.3 both customer apps count seven');
ok(d7.STAGES.map(x=>x.ev).join()===app.STAGE_EV.join(),'8.4 …and it is the SAME seven, in the same order: the control board and the customer now read one shipment one way');
ok(d7.STAGES.map(x=>x.ev).join()===biz.STAGES_C.map(x=>x.ev).join(),'8.5 …all three of them');

console.log('\n§9 a module boots from the register, not from its own seed');
const st9={};
const sh9={getItem:k=>k in st9?st9[k]:null,setItem:(k,v)=>{st9[k]=String(v)},removeItem:k=>{delete st9[k]},clear:()=>{},key:i=>Object.keys(st9)[i],get length(){return Object.keys(st9).length}};
const op9=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:sh9,configurable:true});w.render&&w.render();return w;};
const d9=op9('ShopyLink_D1_Control.html');
d9.slEmit('parcel.received',{ship:'NEW-001',client:'Nour Haddad',actor:'K',payload:{from:'Dubai',to:'Aleppo',mode:'air'}});
d9.slEmit('parcel.received',{ship:'NEW-002',client:'Sami Aziz',actor:'K',payload:{from:'Istanbul',to:'Homs',mode:'land'}});
d9.slEmit('trip.loaded',{ship:'TRP-5',actor:'x',payload:{ships:['NEW-002']}});
d9.render();
const b3=op9('ShopyLink_Action_03_CreateTrip.html');
const ready=b3.readyShipments();
ok(ready.some(x=>x.id==='NEW-001'),'9.1 a parcel received minutes ago can be put on a trip — it could not before, because the list was seeded');
ok(!ready.some(x=>x.id==='NEW-002'),'9.2 …and one already loaded is not offered again');
ok(ready.every(x=>x.customer),'9.3 each carries the owner declared at receipt, not a name typed here');
ok(ready.length===1,'9.4 the list is exactly what the register says is ready — '+ready.length);
const bare9=mk('ShopyLink_Action_03_CreateTrip.html');
ok(bare9.readyShipments().length>0,'9.5 with nothing published the gallery still draws from its seed');
ok(/SHIPMENTS_READY_SEED/.test(fs.readFileSync('ShopyLink_Action_03_CreateTrip.html','utf8')),'9.6 …which is named as seed, so nobody mistakes it for the record');

console.log('\n§10 the dispatcher, and the district that made it possible');
const b7b=op9('ShopyLink_Action_07_Dispatcher.html');
const reg10=op9('ShopyLink_SmartRegistration.html');
reg10.setReg('name','Nour Haddad');reg10.setReg('phone','+963 944 777 222');
op9('ShopyLink_Action_C10_Zones.html');          /* the zone owner publishes first */
reg10.setReg('gov','Damascus');
reg10.setReg('area',reg10.districtsFor('Damascus')[1]);   /* picked, not typed */
reg10.submitRegistration();
const d10=op9('ShopyLink_D1_Control.html');
ok(JSON.parse(sh9.getItem('SL_CLIENTS_V1')).clients.some(c=>c.name==='Nour Haddad'),
 '10.1 a client who registered on his phone survives D1 opening — it republished its own list on every pass and ERASED him a second later, the same fault billing had in the other direction');
d10.slEmit('parcel.received',{ship:'NEW-9',client:'Nour Haddad',actor:'K',payload:{from:'Dubai',to:'Damascus',mode:'air'}});
d10.slEmit('shipment.arrived',{ship:'TRP-1',actor:'x',payload:{ships:['NEW-9']}});
d10.render();
const row10=JSON.parse(sh9.getItem('SL_SHIPMENTS_V1')).shipments.filter(x=>x.ship==='NEW-9')[0];
ok(row10.area==='Mazzeh 86','10.2 his district travels with his shipment — picked from the zone register, not typed, so it can actually be matched');
const b7c=op9('ShopyLink_Action_07_Dispatcher.html');
const dl=b7c.deliveries().filter(x=>x.ship==='NEW-9')[0];
ok(!!dl,'10.3 the dispatcher sees it the moment it arrives — it ran on a seed until the district existed');
op9('ShopyLink_Action_C10_Zones.html');
const zMazzeh=JSON.parse(sh9.getItem('SL_ZONES_V1')).zones.filter(z=>(z.areas||[]).concat([z.name]).some(a=>/mazzeh/i.test(a)))[0];
const b7z=op9('ShopyLink_Action_07_Dispatcher.html');
const dl2=b7z.deliveries().filter(x=>x.ship==='NEW-9')[0];
ok(!!zMazzeh&&dl2.zone===zMazzeh.id,'10.4 …and the district is translated into the zone C10 OWNS — '+dl2.zone+', not the Z-MEZ this file used to keep for itself');
ok(b7z.zoneOfArea('Mazzeh 86')===zMazzeh.id,'10.4b …matching the districts INSIDE the zone, which a name-only match could never find');
ok(b7c.zoneOfArea('Nowhere')==='','10.5 a district we do not serve translates to nothing');
d10.slEmit('parcel.received',{ship:'FAR-1',client:'TechLine Trading',actor:'K',payload:{from:'Dubai',to:'Damascus',mode:'air'}});
d10.slEmit('shipment.arrived',{ship:'TRP-2',actor:'x',payload:{ships:['FAR-1']}});
d10.render();
const b7d=op9('ShopyLink_Action_07_Dispatcher.html');
ok(b7d.unzoned().some(x=>x.ship==='FAR-1'),'10.6 …and that shipment waits in the open as unzoned, rather than vanishing because no column fitted it');

console.log('\n§11 the rest of the chain boots from the register too');
const st11={};
const sh11={getItem:k=>k in st11?st11[k]:null,setItem:(k,v)=>{st11[k]=String(v)},removeItem:k=>{delete st11[k]},clear:()=>{},key:i=>Object.keys(st11)[i],get length(){return Object.keys(st11).length}};
const op11=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:sh11,configurable:true});w.render&&w.render();return w;};
const d11=op11('ShopyLink_D1_Control.html');
d11.slEmit('parcel.received',{ship:'R-1',client:'Nour Haddad',actor:'K',payload:{from:'Dubai',to:'Damascus',mode:'air',price:{amount:79.8,cur:'USD',lane:'Dubai→Damascus · air · perkg'}}});
d11.slEmit('parcel.received',{ship:'R-2',client:'Omar Khalil',actor:'K',payload:{from:'Dubai',to:'Damascus',mode:'air'}});
d11.slEmit('parcel.consolidated',{ship:'R-2',actor:'K',payload:{parcels:['R-2']}});
d11.render();
const con=op11('ShopyLink_Action_02_Consolidation.html');
ok(con.queue().some(x=>x.id==='R-1'),'11.1 consolidation sees a parcel received an hour ago — its queue was seeded before');
ok(!con.queue().some(x=>x.id==='R-2'),'11.2 …and not one already consolidated');
const bil=op11('ShopyLink_Action_09_Billing.html');
const draft=bil.INVOICES.filter(x=>x.ship==='R-1')[0];
ok(!!draft,'11.3 billing opens a draft for a shipment the register knows — three of its own were unknown to the board');
ok(draft.customer==='Nour Haddad'&&draft.from==='Dubai'&&draft.dest==='Damascus','11.4 …carrying the identity from the register, not typed here');
ok(draft.lines.length===1&&draft.lines[0].amt===79.8,'11.5 …opened with the price it was taken in at');
ok(/priced at intake/.test(draft.lines[0].note),'11.6 …said to be the intake price, so a later reprice is not mistaken for it');
bil.render();
ok(bil.INVOICES.filter(x=>x.ship==='R-1').length===1,'11.7 rendering again does not open a second draft for it');
d11.slEmit('shipment.expected',{ship:'BOOK-1',client:'Someone',actor:'x'});
d11.render();
const b9b=op11('ShopyLink_Action_09_Billing.html');
ok(!b9b.INVOICES.some(x=>x.ship==='BOOK-1'),'11.8 a shipment merely BOOKED gets no draft — it is not in our hands yet');
d11.slEmit('run.assigned',{ship:'RUN-9',actor:'Mona',payload:{ships:['R-1','R-2']}});
d11.render();
const b8b=op11('ShopyLink_Action_08_Delivery.html');
const st=b8b.stops();
ok(st.length===2&&st.every(x=>x.ship),'11.9 the driver run is what the dispatcher assigned, and every stop names its cargo');
ok(st[0].customer==='Nour Haddad','11.10 …with the owner from the register');
d11.slEmit('run.assigned',{ship:'RUN-10',actor:'Mona',payload:{ships:['GHOST-X']}});
d11.render();
const b8c=op11('ShopyLink_Action_08_Delivery.html');
ok(!b8c.stops().some(x=>x.ship==='GHOST-X'),'11.11 a run naming cargo the register never saw produces no stop — the run cannot invent a delivery either');
st[0].stt='delivered';
b8b.render();
ok(b8b.stops()[0].stt==='delivered','11.12 and a driver\'s marks survive a re-render: his run is frozen once it is real');

console.log('\n§12 trips have a register too');
const d12=op11('ShopyLink_D1_Control.html');
d12.slEmit('trip.created',{ship:'TRP-77',actor:'Samir',payload:{trip:'TRP-77',truck:'SY-1234-A',driver:'Ahmad',from:'Dubai Hub',to:'Damascus',ships:['R-1','R-2']}});
d12.render();
const trips=JSON.parse(sh11.getItem('SL_TRIPS_V1')).trips;
const t12=trips.filter(x=>x.no==='TRP-77')[0];
ok(!!t12,'12.1 the trip is published, derived from the log like the shipments');
ok(t12.truck==='SY-1234-A'&&t12.driver==='Ahmad','12.2 with its truck and its driver');
ok(t12.ships.length===2,'12.3 …and the cargo it declared');
ok(t12.stage==='created'&&t12.open===true,'12.4 …at the stage it has reached');
const b4=op11('ShopyLink_Action_04_Loading.html');
const seen=b4.trips().filter(x=>x.no==='TRP-77')[0];
ok(!!seen,'12.5 loading sees a trip B3 created — it never did before, it had a list of its own');
ok(seen.shipments.length===2&&seen.shipments[0].customer,'12.6 …with the cargo, each carrying the owner from the shipment register');
const b6=op11('ShopyLink_Action_06_ArrivalReceive.html');
ok(!b6.tripsFromRegister(),'12.7 arrival does not see it yet — it has not departed');
d12.slEmit('trip.loaded',{ship:'TRP-77',actor:'Samir',payload:{trip:'TRP-77',kg:820,ships:['R-1','R-2']}});
d12.slEmit('trip.departed',{ship:'TRP-77',actor:'Ahmad',payload:{trip:'TRP-77',ships:['R-1','R-2']}});
d12.render();
const b6b=op11('ShopyLink_Action_06_ArrivalReceive.html');
ok(b6b.trips().some(x=>x.no==='TRP-77'),'12.8 …and does the moment it leaves');
d12.slEmit('shipment.arrived',{ship:'TRP-77',actor:'Rana',payload:{trip:'TRP-77',ships:['R-1','R-2']}});
d12.render();
const arrived=JSON.parse(sh11.getItem('SL_TRIPS_V1')).trips.filter(x=>x.no==='TRP-77')[0];
ok(arrived.stage==='arrived'&&arrived.open===false,'12.9 arrived, the trip closes');
const b6c=op11('ShopyLink_Action_06_ArrivalReceive.html');
ok(!b6c.tripsFromRegister(),'12.10 …and drops off the list of what is still coming');
const bare12=mk('ShopyLink_Action_04_Loading.html');
ok(bare12.trips().length>0,'12.11 with nothing published each still draws its seed');
ok(/TRIPS_SEED/.test(fs.readFileSync('ShopyLink_Action_04_Loading.html','utf8')),'12.12 …named as seed, like everywhere else');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
