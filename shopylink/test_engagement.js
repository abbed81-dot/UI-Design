// The owner's correction: a contractor is a service supplier, not a member of
// staff; the DRIVER lives in the drivers register; and there are two kinds of
// driver — one who runs the trips and one who runs local delivery.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const store={};
const shared={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{},key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length}};
const open1=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:shared,configurable:true});w.render&&w.render();return w;};

const c2=open1('ShopyLink_Action_C2_Drivers.html');
const drv=JSON.parse(shared.getItem('SL_DRIVERS_V1')).drivers;

console.log('§1 the driver lives in the drivers register');
ok(drv.every(d=>d.engagement==='employee'||d.engagement==='contractor'),'1.1 each is an employee or a contractor, never blank');
ok(drv.some(d=>d.engagement==='contractor'),'1.2 the contracted half of the fleet can exist at all now');
ok(drv.every(d=>d.kind==='line'||d.kind==='local'),'1.3 …and each is a LINE driver or a LOCAL one');
ok(drv.some(d=>d.kind==='line')&&drv.some(d=>d.kind==='local'),'1.4 both kinds are on the road');
const c9=open1('ShopyLink_Action_C9_Staff.html');
const staff=JSON.parse(shared.getItem('SL_STAFF_V1')).staff;
ok(staff.every(p=>p.engagement===undefined),'1.5 the staff record carries NO engagement — it was put there this morning and withdrawn: a contractor is a service supplier, and holding him as staff gave him a level and permissions that mean nothing to him');
ok(/withdrawn the\n   same day/.test(fs.readFileSync('ShopyLink_Action_C9_Staff.html','utf8')),'1.6 …and the file says so, where the next person will look');

console.log('\n§2 a contractor takes no leave');
const con=drv.filter(d=>d.engagement==='contractor')[0];
const emp=drv.filter(d=>d.engagement==='employee')[0];
const r1=c2.requestLeave(con.id,'2026-09-01','2026-09-05','family');
ok(r1.ok===false&&/contract/.test(r1.why),'2.1 refused, and it says why: there is no roster to take time off from');
ok(c2.requestLeave(emp.id,'2026-09-01','2026-09-05','family').ok===true,'2.2 an employed driver may still take leave');
ok(!!con.name&&!!con.id,'2.3 the contractor is still a full record — he has a file, which is the point of holding him');

console.log('\n§3 each module asks for the kind it needs');
const b3=open1('ShopyLink_Action_03_CreateTrip.html');
const line=b3.driversOfKind('line');
ok(!!line&&line.length>0&&line.every(d=>d.kind==='line'),'3.1 trips ask for line drivers');
const b8=open1('ShopyLink_Action_08_Delivery.html');
const local=b8.driversOfKind('local');
ok(!!local&&local.length>0&&local.every(d=>d.kind==='local'),'3.2 delivery asks for local ones');
ok(line.length+local.length===drv.length,'3.3 …and between them they account for every driver, none stranded');
ok(!line.some(d=>local.some(l=>l.id===d.id)),'3.4 nobody is in both — a man three days away on the Istanbul line is not doing doorsteps in Mezzeh');
const bare=mk('ShopyLink_Action_03_CreateTrip.html');
ok(bare.driversOfKind('line')===null,'3.5 with nothing published it answers null rather than an empty list: "we do not know" is not "there are none"');

console.log('\n§4 a client is priced whether or not pricing has heard of him');
open1('ShopyLink_D1_Control.html');
const reg=open1('ShopyLink_SmartRegistration.html');
reg.setReg('name','Nour Haddad');reg.setReg('phone','+963 944 777 222');reg.setReg('gov','Damascus');
reg.submitRegistration();
const pr=open1('ShopyLink_Pricing.html');
const all=pr.customersLive();
const fresh=all.filter(c=>c.name==='Nour Haddad')[0];
ok(!!fresh,'4.1 somebody who registered on his phone a second ago exists for pricing — he did not before, and asking what he pays returned nothing at all');
ok(fresh.general===true&&fresh.agreed.length===0,'4.2 …on the GENERAL list, because nobody has singled him out — the owner\'s rule as code rather than as a habit');
const named=all.filter(c=>c.name==='TechLine Trading')[0];
ok(!!named&&named.agreed.length>0&&!named.general,'4.3 while a client given his own terms keeps them');
ok(all.length>=JSON.parse(shared.getItem('SL_CLIENTS_V1')).clients.length,'4.4 nobody on the register is missing from pricing');
ok(/CUSTOMERS_SEED/.test(fs.readFileSync('ShopyLink_Pricing.html','utf8')),'4.5 the local table survives as a named seed');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
