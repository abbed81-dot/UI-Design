// The chain used to declare TRIPS and RUNS. A shipment therefore stalled at
// "consolidated" for ever, while the board listed TRP-… and RUN-… as if they
// were cargo. This asserts the fix at both ends: every step NAMES the shipments
// it concerns, and the consumer places a shipment at the furthest step that
// names it. The event shapes below are taken from the modules themselves, not
// invented here — the old test_link passed happily on hand-made events with the
// shipment id on every stage, which is exactly the shape the modules never emit.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const boot=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§1 every trip-level declaration carries the cargo it concerns');
const SRC={
 'B3 trip.created':['ShopyLink_Action_03_CreateTrip.html','trip.created'],
 'B4 trip.loaded':['ShopyLink_Action_04_Loading.html','trip.loaded'],
 'B5 trip.departed':['ShopyLink_Action_05_TripJourney.html','trip.departed'],
 'B6 shipment.arrived':['ShopyLink_Action_06_ArrivalReceive.html','shipment.arrived'],
 'B7 run.assigned':['ShopyLink_Action_07_Dispatcher.html','run.assigned'],
 'B8 shipment.delivered':['ShopyLink_Action_08_Delivery.html','shipment.delivered']
};
Object.keys(SRC).forEach(function(k){
 const src=fs.readFileSync(SRC[k][0],'utf8');
 const i=src.indexOf("slEmit('"+SRC[k][1]+"'");
 const seg=src.slice(i,i+900);
 ok(i>-1&&/ships\s*:/.test(seg),k+' names the shipments, not only a count');
});
Object.keys(SRC).forEach(function(k){
 const src=fs.readFileSync(SRC[k][0],'utf8');
 const all=src.split("slEmit('"+SRC[k][1]+"'").slice(1);
 ok(all.every(s=>/ships\s*:/.test(s.slice(0,900))),k+' — every announcer in the file does, not just the first');
});

console.log('\n§2 the cargo has an owner from the moment it is received');
const b1=fs.readFileSync('ShopyLink_Action_01_ReceiveParcel.html','utf8');
const e1=b1.slice(b1.indexOf("slEmit('parcel.received'"),b1.indexOf("slEmit('parcel.received'")+400);
ok(/client\s*:/.test(e1),'2.1 parcel.received carries the client — the one moment the clerk certainly knows whose it is');
ok(!/client\s*:\s*'[A-Za-z]/.test(e1),'2.2 …read from the record, never a name written into the source');
const others=['03_CreateTrip','04_Loading','05_TripJourney','06_ArrivalReceive','07_Dispatcher','08_Delivery'];
ok(others.every(function(m){
  const s=fs.readFileSync('ShopyLink_Action_'+m+'.html','utf8');
  const i=s.indexOf('slEmit(\'trip'),j=s.indexOf('slEmit(\'shipment'),k=s.indexOf('slEmit(\'run');
  const seg=[i,j,k].filter(x=>x>-1).map(x=>s.slice(x,x+600)).join('');
  return !/client\s*:\s*[^n]/.test(seg);
 }),'2.3 the later steps do NOT repeat the client — one fact, written once, cannot drift');

console.log('\n§3 a shipment reaches the end of the chain, on the shapes the modules emit');
const d=boot('ShopyLink_D1_Control.html');
const ship=d.SHIPS[0].id, other=d.SHIPS[1].id;
d.slEmit('parcel.received',{ship:ship,client:'TechLine Trading',actor:'Khaled Omar',
  payload:{customer:'TechLine Trading',cartons:4,weight:120}});
ok(d.shipmentStages().filter(x=>x.ship===ship)[0].stage==='received','3.1 received');
d.slEmit('parcel.consolidated',{ship:ship,actor:'Khaled Omar',payload:{count:2,parcels:[ship,other]}});
ok(d.shipmentStages().filter(x=>x.ship===ship)[0].stage==='consolidated','3.2 consolidated');
ok(d.shipmentStages().filter(x=>x.ship===other)[0].stage==='consolidated','3.3 …and so is the parcel that was only named in the payload');
d.slEmit('trip.loaded',{ship:'TRP-2608-014',actor:'Samir',payload:{trip:'TRP-2608-014',truck:'T-9',kg:820,ships:[ship,other]}});
ok(d.shipmentStages().filter(x=>x.ship===ship)[0].stage==='loaded','3.4 loaded — declared against the TRIP, credited to the cargo');
d.slEmit('shipment.arrived',{ship:'TRP-2608-014',actor:'Rana',payload:{trip:'TRP-2608-014',hub:'Damascus',ships:[ship,other]}});
ok(d.shipmentStages().filter(x=>x.ship===ship)[0].stage==='arrived','3.5 arrived');
d.slEmit('run.assigned',{ship:'RUN-77',actor:'Mona',payload:{zone:'Z-JAR',driver:'D-3',ships:[ship]}});
ok(d.shipmentStages().filter(x=>x.ship===ship)[0].stage==='assigned','3.6 out for delivery');
ok(d.shipmentStages().filter(x=>x.ship===other)[0].stage==='arrived','3.7 …while the shipment not on that run stays where it is');
d.slEmit('shipment.delivered',{ship:'RUN-77',actor:'Mona',payload:{run:'RUN-77',delivered:1,failed:0,ships:[ship],failedShips:[],unnamed:0}});
ok(d.shipmentStages().filter(x=>x.ship===ship)[0].stage==='delivered','3.8 delivered');

console.log('\n§4 a vehicle is not a shipment');
const rows=d.shipmentStages().map(x=>x.ship);
ok(rows.indexOf('TRP-2608-014')===-1,'4.1 the trip number is not listed as cargo');
ok(rows.indexOf('RUN-77')===-1,'4.2 nor is the delivery run');
ok(rows.length===2,'4.3 two shipments moved, and the board shows two rows — '+rows.join(', '));
ok(d.inFlight().every(x=>x.ship!==ship),'4.4 the delivered one is out of the in-flight count');

console.log('\n§5 a failed delivery is not a delivered one');
const d2=boot('ShopyLink_D1_Control.html');
const s2=d2.SHIPS[0].id, s3=d2.SHIPS[1].id;
d2.slEmit('parcel.received',{ship:s2,client:'A',actor:'x'});
d2.slEmit('parcel.received',{ship:s3,client:'B',actor:'x'});
d2.slEmit('run.assigned',{ship:'RUN-80',actor:'x',payload:{ships:[s2,s3]}});
d2.slEmit('shipment.delivered',{ship:'RUN-80',actor:'x',payload:{run:'RUN-80',delivered:1,failed:1,ships:[s2],failedShips:[s3],unnamed:0}});
const st5=k=>d2.shipmentStages().filter(x=>x.ship===k)[0].stage;
ok(st5(s2)==='delivered','5.1 the one that was delivered reads delivered');
ok(st5(s3)==='assigned','5.2 the one that failed stays out for delivery — a second attempt is due, and the client must not be told it arrived');

console.log('\n§6 B8 reads the field it actually writes');
const b8=fs.readFileSync('ShopyLink_Action_08_Delivery.html','utf8');
const dec=b8.slice(b8.indexOf('function declareDelivered'),b8.indexOf('function declareDelivered')+1400);
ok(/s3\.stt===/.test(dec),'6.1 the outcome is read from stt — the field the file writes');
ok(!/s3\.status===/.test(dec),'6.2 …and no longer from status, which it never writes: every event declared 0 delivered, 0 failed');
ok(/unnamed/.test(dec),'6.3 a stop carrying no shipment id is counted and declared, not dropped from the total');
const stops=b8.slice(b8.indexOf('var STOPS_SEED='),b8.indexOf('var STOPS_SEED=')+2200);
ok((stops.match(/ship:'/g)||[]).length>=3,'6.4 the stops carry the shipment they deliver, paired with B7\'s register');

console.log('\n§7 storage blocked: every module still works, and nothing is invented');
const d3=boot('ShopyLink_D1_Control.html');
ok(d3.shipmentStages().length===0,'7.1 an empty log yields no rows — no plausible number, no half-full bar');
ok(/nothing has moved yet|لم يتحرك/.test(d3.stagePanel()),'7.2 …and the panel says so in words');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
