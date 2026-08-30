// No module invents what a register can answer.
//
// The index has carried this as an open item since 19 Aug — "five modules
// still boot from their own seeds (B2, B4, B6, B8, B9); §5 measures the drift;
// nothing yet removes it". Measured module by module, it is no longer true:
// every one of the six reads the register that owns its work and falls back to
// its own seed only when nothing has been published. What was missing is not
// the wiring — it is anything that PROVES the wiring, so a later edit cannot
// quietly put a module back on its fixtures. That is what this file is.
//
// Two of them are conditional in a way worth stating, because getting it wrong
// made this contract report a fault that was not there:
//   · B4 Loading wants trips at stage 'created'. Publish 'departed' and it
//     correctly shows nothing from the register.
//   · B8 Delivery derives its run from a run.assigned EVENT, not from the
//     shipment register alone. With no run, falling back is the right answer.
// A probe that skips either reads "still on its seed" about a module that is
// wired. The setup below gives each what it actually asks for.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const bag=()=>{const s={};return{getItem:k=>k in s?s[k]:null,setItem:(k,v)=>{s[k]=String(v)},removeItem:k=>{delete s[k]},clear:()=>{},key:i=>Object.keys(s)[i],get length(){return Object.keys(s).length}};};
const mk=(x,st)=>{const w=new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
  Object.defineProperty(w,'localStorage',{value:st,configurable:true});w.render&&w.render();return w;};

/* One unmistakable name. If a module's list carries it, the module read the
   register; if it carries only its own ids, it did not. */
const MARK='REG-';
const ships=[
 {ship:'REG-RCV',client:'RegisterCo',area:'Mazzeh',from:'Dubai',to:'Damascus',mode:'air',weight:5,cartons:1,price:null,stage:'received', at:Date.now(),attempts:0,open:true},
 {ship:'REG-ARR',client:'RegisterCo',area:'Mazzeh',from:'Dubai',to:'Damascus',mode:'air',weight:5,cartons:1,price:null,stage:'arrived',  at:Date.now(),attempts:0,open:true},
 {ship:'REG-ASG',client:'RegisterCo',area:'Mazzeh',from:'Dubai',to:'Damascus',mode:'air',weight:5,cartons:2,price:null,stage:'assigned', at:Date.now(),attempts:0,open:true},
 {ship:'REG-DLV',client:'RegisterCo',area:'Mazzeh',from:'Dubai',to:'Damascus',mode:'air',weight:5,cartons:1,price:null,stage:'delivered',at:Date.now(),attempts:0,open:false}];
const trips=[
 {no:'REG-TRIPC',trip:'REG-TRIPC',mode:'land',from:'Istanbul',to:'Damascus',stage:'created', at:Date.now(),open:true,ships:['REG-RCV']},
 {no:'REG-TRIPD',trip:'REG-TRIPD',mode:'land',from:'Istanbul',to:'Damascus',stage:'departed',at:Date.now(),open:true,ships:['REG-ARR']}];
const runEvent=[{id:'EV-1',at:Date.now(),type:'run.assigned',trip:null,ship:null,client:null,
  actor:'Mona Said',payload:{ships:['REG-ASG'],zone:'Z-01',driver:'DRV-01'}}];

const wired=[
 {code:'B2', file:'ShopyLink_Action_02_Consolidation.html', list:'queue',      asks:'parcels the register holds at "received"'},
 {code:'B4', file:'ShopyLink_Action_04_Loading.html',       list:'trips',      asks:'trips at stage "created"'},
 {code:'B6', file:'ShopyLink_Action_06_ArrivalReceive.html',list:'trips',      asks:'trips that have departed'},
 {code:'B7', file:'ShopyLink_Action_07_Dispatcher.html',    list:'deliveries', asks:'shipments arrived or assigned'},
 {code:'B8', file:'ShopyLink_Action_08_Delivery.html',      list:'stops',      asks:'the cargo of the last assigned run'},
 {code:'B9', file:'ShopyLink_Action_09_Billing.html',       list:'INVOICES',   asks:'what has been delivered and not billed'}];

console.log('§1 with a register published, every module works on it');
wired.forEach(function(m){
  const st=bag();
  st.setItem('SL_SHIPMENTS_V1',JSON.stringify({at:Date.now(),shipments:ships}));
  st.setItem('SL_TRIPS_V1',JSON.stringify({at:Date.now(),trips:trips}));
  st.setItem('SL_EVENTS_V1',JSON.stringify(runEvent));
  const w=mk(m.file,st);
  let list=[];
  try{ list=(typeof w[m.list]==='function')?w[m.list]():(w[m.list]||[]); }catch(e){}
  const arr=Array.isArray(list)?list:[];
  const hits=(JSON.stringify(arr).match(new RegExp(MARK,'g'))||[]).length;
  ok(hits>0, m.code+' works on the published register — '+m.asks+' ('+hits+' from it)');
});

console.log('\n§2 with nothing published, each still runs on its own seed');
wired.forEach(function(m){
  const st=bag();
  const w=mk(m.file,st);
  let list=[];
  try{ list=(typeof w[m.list]==='function')?w[m.list]():(w[m.list]||[]); }catch(e){}
  const arr=Array.isArray(list)?list:[];
  ok(arr.length>0, m.code+' still opens with a day of its own — a channel is best-effort, never a dependency');
  ok(JSON.stringify(arr).indexOf(MARK)===-1, '   …and it is the seed, not a register that was never there');
});

console.log('\n§3 the register answers, the seed does not linger beside it');
/* The fault this guards against is not "the module ignores the register" — it
   is the subtler one: the module reads the register AND keeps showing its own
   rows too, so one screen carries two answers to the same question. */
wired.forEach(function(m){
  const st=bag();
  st.setItem('SL_SHIPMENTS_V1',JSON.stringify({at:Date.now(),shipments:ships}));
  st.setItem('SL_TRIPS_V1',JSON.stringify({at:Date.now(),trips:trips}));
  st.setItem('SL_EVENTS_V1',JSON.stringify(runEvent));
  const w=mk(m.file,st);
  let live=[];
  try{ live=(typeof w[m.list]==='function')?w[m.list]():(w[m.list]||[]); }catch(e){}
  const st2=bag();
  const w2=mk(m.file,st2);
  let seed=[];
  try{ seed=(typeof w2[m.list]==='function')?w2[m.list]():(w2[m.list]||[]); }catch(e){}
  const seedIds=JSON.stringify(seed);
  const liveArr=Array.isArray(live)?live:[];
  const carried=liveArr.filter(function(x){
    const id=x&&(x.ship||x.id||x.no);
    return id&&String(id).indexOf(MARK)===-1&&seedIds.indexOf(String(id))>-1;
  });
  ok(carried.length===0, m.code+' shows no seeded row beside the register\'s — two answers to one question is how a board and a module come to disagree'+
     (carried.length?' — carried: '+carried.map(function(x){return x.ship||x.id||x.no;}).join(', '):''));
});

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
