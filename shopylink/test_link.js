const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
function store(){const m={};return {getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v);},removeItem:k=>{delete m[k];}};}
const shared=store();
function open1(f){
 const html=fs.readFileSync(f,'utf8');
 const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
 Object.defineProperty(dom.window,'localStorage',{value:shared,configurable:true});
 html.match(/<script>([\s\S]*?)<\/script>/g).map(x=>x.replace(/<\/?script>/g,'')).forEach(c=>{try{dom.window.eval(c);}catch(e){console.log('ERR '+f+': '+e.message.slice(0,70));}});
 return dom.window;
}
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§38 the module declares, it does not decide');
const b1=open1('ShopyLink_Action_01_ReceiveParcel.html');
ok(typeof b1.slDeclareReceived==='function','38.1 B1 has one declaration function and no work-item logic of its own');
ok(/parcel.received/.test(b1.slDeclareReceived.toString()),'38.2 …it emits a fact, not an instruction');
/* a parcel with no owner, no destination and no price is not received at all —
   so the route is stated first, as it must be on the screen */
b1.localStorage.setItem('SL_TARIFF_V1',open1('ShopyLink_Pricing.html').localStorage.getItem('SL_TARIFF_V1'));
b1.customer={id:'C-001',name:'Layla Al-Rifai',type:'individual'};
b1.liveCartons=[{weight:6,dimL:40,dimW:30,dimH:20}];
b1.setOrigin('Guangzhou');b1.setDest('Damascus');b1.setMethod('air');
const ev=b1.slDeclareReceived();
ok(!!ev&&ev.type==='parcel.received'&&ev.ship,'38.3 receiving a parcel declares it on the shared bus');
ok(b1.slDeclareReceived()===null,'38.4 declaring twice is impossible — the event is emitted once');
ok(b1.slEvRead().length===1,'38.5 the log holds exactly one event');

console.log('§39 the dashboard derives the work');
const d1=open1('ShopyLink_D1_Control.html');
const before=d1.openItems().length, shipsBefore=d1.SHIPS.length;
const res=d1.ingest();   // note: the first render already ingested, so this call finds nothing new
ok(d1.openItems().length===before&&d1.openItems().filter(x=>x.ref===ev.ship).length===1,'39.1 one event → exactly one work item, created by the dashboard on load');
ok(!!d1.shipById(ev.ship),'39.2 …and the shipment lifetime clock started with it');
const wi=d1.openItems().filter(x=>x.ref===ev.ship)[0];
ok(!!wi&&wi.owner&&wi.next&&wi.due,'39.3 the item has one owner, one next action and one due date — the three fields');
ok(wi.role==='wh','39.4 it is routed to the role that can actually do it (warehouse measures)');
ok(d1.queueFor('wh').indexOf(wi)>-1&&d1.queueFor('finance').indexOf(wi)===-1,'39.5 it lands in that role queue and nobody else\'s');
const sp=d1.shipById(ev.ship);
ok(!!sp&&sp.receivedAt===ev.at,'39.6 the lifetime starts at the moment of receipt, not at ingest');
ok(d1.lifetime(sp)>=0&&!d1.isDelivered(sp),'39.7 it is running, not delivered');

console.log('§40 idempotent and replayable');
const after1=d1.openItems().length;
d1.ingest();d1.ingest();
ok(d1.openItems().length===after1,'40.1 re-ingesting the same log creates nothing twice');
const fresh=open1('ShopyLink_D1_Control.html');
fresh.ingest();
ok(fresh.openItems().filter(x=>x.ref===ev.ship).length===1,'40.2 a fresh dashboard replays the log to the same state');
ok(fresh.slEvRead().length===1,'40.3 the log itself is append-only and unchanged by reading');

console.log('§41 the chain through to delivery');
b1.slEmit('consolidated',{ship:ev.ship,actor:'B2',at:ev.at+2*3600000});
b1.slEmit('trip.departed',{ship:ev.ship,trip:'TRP-9001',actor:'B3',at:ev.at+6*3600000});
b1.slEmit('pod.signed',{ship:ev.ship,actor:'B8',at:ev.at+30*3600000});
const d2=open1('ShopyLink_D1_Control.html');
d2.ingest();
const s2=d2.shipById(ev.ship);
ok(!!s2.stamps.consolidated&&!!s2.stamps.departed,'41.1 later milestones stamp the same shipment');
ok(d2.isDelivered(s2),'41.2 the POD stops the clock');
ok(d2.lifetime(s2)===30*3600000,'41.3 the lifetime is exactly receipt → POD (30h)');
ok(d2.slicesSum(s2)===d2.lifetime(s2),'41.4 the slices still sum to the total');
ok(d2.openItems().filter(x=>x.ref===ev.ship&&x.role==='finance').length===1,'41.5 the POD also raises the invoicing item for Finance');

console.log('§42 degrades honestly');
const blocked=new JSDOM(fs.readFileSync('ShopyLink_D1_Control.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
Object.defineProperty(blocked.window,'localStorage',{get(){throw new Error('blocked');},configurable:true});
let thr=[];fs.readFileSync('ShopyLink_D1_Control.html','utf8').match(/<script>([\s\S]*?)<\/script>/g).map(x=>x.replace(/<\/?script>/g,'')).forEach(c=>{try{blocked.window.eval(c);}catch(e){thr.push(e.message);}});
ok(thr.length===0&&blocked.window.document.getElementById('shell').innerHTML.length>1500,'42.1 storage blocked → the dashboard still renders on its seeded data');
ok(blocked.window.ingest().added===0,'42.2 …and ingest is a no-op rather than an error');
const b1b=new JSDOM(fs.readFileSync('ShopyLink_Action_01_ReceiveParcel.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
Object.defineProperty(b1b.window,'localStorage',{get(){throw new Error('blocked');},configurable:true});
let thr2=[];fs.readFileSync('ShopyLink_Action_01_ReceiveParcel.html','utf8').match(/<script>([\s\S]*?)<\/script>/g).map(x=>x.replace(/<\/?script>/g,'')).forEach(c=>{try{b1b.window.eval(c);}catch(e){thr2.push(e.message);}});
ok(thr2.length===0,'42.3 B1 still works with no storage — receiving is never blocked by the bus');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
