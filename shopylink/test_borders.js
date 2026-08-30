// The owner's three answers: a crossing is TWO POINTS; a border is both a piece
// of the network and a place where money is paid; and there is a fixed tariff
// with extras the agent pays on the day. Three files held three ideas of a
// border and one of them had not a single entry in common with the others.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const store={};
const shared={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{},key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length}};
const open1=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:shared,configurable:true});w.render&&w.render();return w;};

const c7=open1('ShopyLink_Action_C7_Hubs.html');

console.log('§1 the point belongs to the network');
const pts=JSON.parse(shared.getItem('SL_STOPS_V1')).stops;
ok(pts.length>0,'1.1 C7 publishes the points on the road — it has always held them and nobody could read them');
const brд=pts.filter(p=>p.kind==='border');
ok(brд.length>0,'1.2 borders among them');
ok(brд.every(p=>p.countryA&&p.countryB),'1.3 each naming the two countries it sits between');
ok(pts.some(p=>p.kind==='port')&&pts.some(p=>p.kind==='airport'),'1.4 …alongside ports and airports, which are points too');
ok(pts.every(p=>p.status!=='closed'),'1.5 a closed point is not published');

console.log('\n§2 a crossing is TWO points, as the owner said');
const b3=open1('ShopyLink_Action_03_CreateTrip.html');
const live=b3.bordersLive();
ok(live.length===brд.length*2,'2.1 every crossing yields an exit and an entry — '+live.length+' from '+brд.length);
const x=live.filter(b=>b.dir==='exit')[0], e=live.filter(b=>b.dir==='entry')[0];
ok(x.country!==e.country,'2.2 you leave one country and enter the other');
ok(x.point===e.point,'2.3 …and both carry the id of the crossing they belong to, so what B3 routes is what B5 prices');
ok(live.every(b=>b.seq===0),'2.4 the ORDER is not published: the sequence a trip takes is trip data, not a property of the road');
const src3=fs.readFileSync('ShopyLink_Action_03_CreateTrip.html','utf8');
ok(/BORDERS_SEED/.test(src3),'2.5 the twelve one-way gates this file invented survive only as a named seed');

console.log('\n§3 what is paid there stays with the fees');
const b5=open1('ShopyLink_Action_B5_BorderFees.html');
const fees=b5.bordersLive();
ok(fees.length===brд.length,'3.1 B5 sees one entry per crossing, not two — money is paid at the post, not at each gate');
ok(fees.every(b=>brд.some(p=>p.id===b.id)),'3.2 …under the ids the network publishes');
ok(fees.every(b=>Array.isArray(b.fees)),'3.3 each carrying its fee schedule, which is B5\'s own and not the network\'s');
ok(fees.some(b=>b.fees.length>0),'3.4 …priced where it has been priced');
const cross=b5.CROSS[0];
ok(Array.isArray(cross.std)&&Array.isArray(cross.extras),'3.5 a crossing separates the FIXED tariff from the extras the agent paid on the day');
ok(b5.PAYERS.some(p=>p.id==='agent'),'3.6 …and knows the agent\'s account as one of the ways money leaves');

console.log('\n§4 a point opened and not yet priced says so');
const store2={};
const sh2={getItem:k=>k in store2?store2[k]:null,setItem:(k,v)=>{store2[k]=String(v)},removeItem:k=>{},clear:()=>{},key:i=>Object.keys(store2)[i],get length(){return Object.keys(store2).length}};
const op2=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:sh2,configurable:true});w.render&&w.render();return w;};
op2('ShopyLink_Action_C7_Hubs.html');
const raw=JSON.parse(sh2.getItem('SL_STOPS_V1'));
raw.stops.push({id:'SP-99',kind:'border',name:'New Crossing',countryA:'SY',countryB:'IQ',code:'',agents:[],status:'active'});
sh2.setItem('SL_STOPS_V1',JSON.stringify(raw));
const b5b=op2('ShopyLink_Action_B5_BorderFees.html');
const fresh=b5b.bordersLive().filter(b=>b.id==='SP-99')[0];
ok(!!fresh,'4.1 a crossing opened in the network reaches the fees module at once');
ok(fresh.priced===false&&fresh.fees.length===0,'4.2 …marked as not yet priced rather than charged at nothing');
const b3b=op2('ShopyLink_Action_03_CreateTrip.html');
ok(b3b.bordersLive().some(b=>b.point==='SP-99'),'4.3 …and a trip can be routed through it the same day');

console.log('\n§5 nothing is invented where the network is silent');
const bare5=mk('ShopyLink_Action_B5_BorderFees.html');
ok(bare5.bordersLive().length>0,'5.1 with nothing published each file still draws its seed');
ok(/BORDERS_SEED/.test(fs.readFileSync('ShopyLink_Action_B5_BorderFees.html','utf8')),'5.2 …named as seed, like everywhere else');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
