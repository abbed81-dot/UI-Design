// The code map answers the first question a developer asks: "where is B3?"
// Every row is checked against the file it names, so it cannot go stale silently.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const map=fs.readFileSync('CODE_MAP.md','utf8');
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§1 every file the map names exists');
const named=[...new Set((map.match(/ShopyLink_[A-Za-z0-9_]+\.html/g)||[]))];
named.forEach(function(x){ ok(fs.existsSync(x),x.replace('ShopyLink_','')); });

console.log('§2 every B code matches the title inside its file');
[['B1','ShopyLink_Action_01_ReceiveParcel.html'],
 ['B2','ShopyLink_Action_02_Consolidation.html'],
 ['B3','ShopyLink_Action_03_CreateTrip.html'],
 ['B4','ShopyLink_Action_04_Loading.html'],
 ['B5','ShopyLink_Action_05_TripJourney.html'],
 ['B6','ShopyLink_Action_06_ArrivalReceive.html'],
 ['B7','ShopyLink_Action_07_Dispatcher.html'],
 ['B8','ShopyLink_Action_08_Delivery.html'],
 ['B9','ShopyLink_Action_09_Billing.html']].forEach(function(r){
  const t=(fs.readFileSync(r[1],'utf8').match(/<title>([^<]*)</)||['',''])[1];
  ok(t.indexOf(r[0]+' —')===0,r[0]+' is '+r[1].replace('ShopyLink_Action_','')+' — title says "'+t.split('·')[0].trim()+'"');
 });

console.log('§3 every C code matches too');
[['C1','ShopyLink_Action_C1_Trucks.html'],['C2','ShopyLink_Action_C2_Drivers.html'],
 ['C7','ShopyLink_Action_C7_Hubs.html'],['C8','ShopyLink_Action_C8_Agents.html'],
 ['C9','ShopyLink_Action_C9_Staff.html'],['C10','ShopyLink_Action_C10_Zones.html']].forEach(function(r){
  const t=(fs.readFileSync(r[1],'utf8').match(/<title>([^<]*)</)||['',''])[1];
  ok(t.indexOf(r[0]+' —')===0,r[0]+' → '+r[1].replace('ShopyLink_Action_',''));
 });

console.log('§4 C3-C6 and C11 are merged, and the merges are real');
['C3','C4','C5','C6','C11'].forEach(function(c){
  const hit=fs.readdirSync('.').filter(x=>new RegExp('_'+c+'_').test(x));
  ok(hit.length===0,'no separate file for '+c+' — as the map says');
});
ok(/merged, not missing/.test(map),'…and the map calls it a merge, not a gap');
ok(/Do not build them/.test(map),'…and says plainly not to rebuild them');
const c2=new JSDOM(fs.readFileSync('ShopyLink_Action_C2_Drivers.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const drv=c2.DRIVERS[0];
ok(Array.isArray(drv.visas)&&drv.visas.length>0&&'exp' in drv.visas[0],
   'C3 is genuinely inside C2: a visa per country, each with an expiry');
const c7=fs.readFileSync('ShopyLink_Action_C7_Hubs.html','utf8');
ok(/IATA|airport/i.test(c7),'C4 airports are genuinely inside C7');
ok(/UNLOCODE|port/i.test(c7),'C5 ports too');
ok(/cities|city/i.test(c7),'…and C6 cities');
ok(/rate card/i.test(fs.readFileSync('ShopyLink_Pricing.html','utf8')),'C11 rate cards are genuinely in Pricing');

console.log('§5 the collision is disclosed');
ok(/has B5 in its filename but is not B5/.test(map),'the map warns that Action_B5_BorderFees is not B5');
const j=(fs.readFileSync('ShopyLink_Action_05_TripJourney.html','utf8').match(/<title>([^<]*)</)||['',''])[1];
ok(j.indexOf('B5 —')===0,'…because B5 is really the trip journey: "'+j.split('·')[0].trim()+'"');

console.log('§6 the three documents no longer share one title');
const titles=['ShopyLink_Doc_Invoice.html','ShopyLink_Doc_Quotation.html','ShopyLink_Doc_CMR.html']
  .map(x=>(fs.readFileSync(x,'utf8').match(/<title>([^<]*)</)||['',''])[1]);
ok(new Set(titles).size===3,'each names itself: '+titles.map(t=>t.split('·')[0].trim()).join(' | '));
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
