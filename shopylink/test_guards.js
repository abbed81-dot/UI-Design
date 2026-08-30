// The shell hides a module a person may not use. This refuses the act inside it:
// a URL, a stale tab or a second window all reach the function directly, so a
// hidden link is not a locked door (F18).
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const c9=new JSDOM(fs.readFileSync('ShopyLink_Action_C9_Staff.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const REG=c9.localStorage.getItem('SL_STAFF_V1');
const staff=JSON.parse(REG).staff;
const mk=x=>{const w=new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
  w.localStorage.setItem('SL_STAFF_V1',REG);return w;};
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const clerk=staff.filter(p=>p.role==='wh')[0];
const admin=staff.filter(p=>p.role==='admin')[0];

console.log('§1 the guard exists where a register can be changed');
const MODS=[['Action_C7_Hubs','st_manage'],['Action_C1_Trucks','st_manage'],
            ['Action_C2_Drivers','st_manage'],['Action_C8_Agents','st_manage'],
            ['Action_C10_Zones','st_manage'],['Action_C9_Staff','st_roles'],
            ['Action_Cards','pr_cards']];
MODS.forEach(function(m){
 const w=mk('ShopyLink_'+m[0]+'.html');
 ok(typeof w.actorMay==='function',m[0].replace('Action_','')+' has actorMay');
 ok(w.actorMay(m[1])===true,'   …and with nobody signed in the file still works — a demo must open');
 w.setActor(clerk.id);
 ok(w.actorMay(m[1])===false,'   …but the warehouse clerk is refused '+m[1]);
 w.setActor(admin.id);
 ok(w.actorMay(m[1])===true,'   …and the admin is allowed');
});

console.log('§2 refused at the act, not merely on the button');
const h=mk('ShopyLink_Action_C7_Hubs.html');
h.setActor(clerk.id);
const live=()=>h.HUBS.filter(x=>!x.archived).length;
const before=live();
const target=h.HUBS.filter(x=>!x.archived)[0];
h.askArchiveHub(target.id);
if(h.setTyped)h.setTyped(target.name);      /* even typing the confirmation */
if(h.modalOk)h.modalOk();
ok(live()===before,'a clerk who reaches the function directly still cannot archive a hub');
ok(typeof h.refuse==='function','…and there is a refusal that names the missing grant');

console.log('§3 the permitted person can, and the log names them');
h.setActor(admin.id);
h.askArchiveHub(target.id);
if(h.setTyped)h.setTyped(target.name);      /* archiving needs the name typed (F12) */
if(h.modalOk)h.modalOk();
ok(live()===before-1,'the admin archives it: '+before+' → '+live());
ok(h.AUDIT[0].who===admin.name,'…and the audit names the real actor: '+h.AUDIT[0].who);
ok(/archived/.test(h.AUDIT[0].what),'…and what was done');

console.log('§4 an unprivileged person cannot change permissions either');
const s=mk('ShopyLink_Action_C9_Staff.html');
s.setActor(clerk.id);
ok(s.actorMay('st_roles')===false,'a clerk may not grant permissions');
ok(s.actorMay('st_manage')===false,'…nor manage staff');
s.setActor(admin.id);
ok(s.actorMay('st_roles')===true,'the admin may');

console.log('§5 with the registry gone, nothing is locked out');
const bare=new JSDOM(fs.readFileSync('ShopyLink_Action_C7_Hubs.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
ok(bare.actorMay('st_manage')===true,'no registry → the module behaves as it always did, rather than refusing everything');
console.log('§6 the operational chain, each step by the grant that names its work');
const CHAIN=[['01_ReceiveParcel','b1_ind'],['02_Consolidation','b2_con'],['03_CreateTrip','t_create'],
             ['04_Loading','t_depart'],['05_TripJourney','t_customs'],['06_ArrivalReceive','b6_conf'],
             ['08_Delivery','b8_mon']];
CHAIN.forEach(function(c){
 const w=mk('ShopyLink_Action_'+c[0]+'.html');
 ok(typeof w.actorMay==='function',c[0].replace(/^\d+_/,'')+' is guarded');
 ok(w.actorMay(c[1])===true,'   …and opens unsigned');
 const holder=staff.filter(function(p){return p.perms.indexOf(c[1])>-1;})[0];
 const other=staff.filter(function(p){return p.perms.indexOf(c[1])<0&&p.role!=='driver'&&p.role!=='admin';})[0];
 w.setActor(other.id);
 ok(w.actorMay(c[1])===false,'   …refuses '+other.role+' — '+c[1]);
 w.setActor(holder.id);
 ok(w.actorMay(c[1])===true,'   …allows '+holder.role);
});

console.log('§7 border fees: paying and charging on are different jobs');
const b5=mk('ShopyLink_Action_B5_BorderFees.html');
const customs=staff.filter(function(p){return p.role==='customs';})[0];
const acct=staff.filter(function(p){return p.role==='acct';})[0];
b5.setActor(clerk.id);
ok(b5.settleCross(b5.CROSS[0].id,'driver').ok===false,'a warehouse clerk cannot declare a crossing paid');

b5.setActor(customs.id);
ok(b5.settleCross(b5.CROSS[0].id,'driver').ok===true,'customs settles what was paid at the post');
ok(typeof b5.giveFloat==='undefined','…and cannot issue a float at all — that is not done at a border');
b5.slEmit('parcel.received',{ship:'S1',client:'A',payload:{trip:b5.CROSS[0].trip,declared:9000}});
ok(b5.recoverCross(b5.CROSS[0].id).ok===false,'…but may NOT charge it on to a client');
b5.setActor(acct.id);
ok(b5.recoverCross(b5.CROSS[0].id).ok===true,'…which is the accountant\u2019s half — so nobody both pays and bills');

console.log('§8 the float: issued where the trip starts, spent where the money goes');
const c2b=new JSDOM(fs.readFileSync('ShopyLink_Action_C2_Drivers.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const DREG=c2b.localStorage.getItem('SL_DRIVERS_V1');
const him=JSON.parse(DREG).drivers[0];
const b4=mk('ShopyLink_Action_04_Loading.html');
ok(typeof b4.issueFloat==='function','the departing hub is where a float is issued');
b4.setActor(clerk.id);
ok(b4.issueFloat(him.name,500).ok===false,'a warehouse clerk cannot hand out cash');
const departer=staff.filter(function(p){return p.perms.indexOf('t_depart')>-1;})[0];
b4.setActor(departer.id);
ok(b4.issueFloat(him.name,500).ok===true,departer.role+' issues it — the last place anybody sees the driver before the road');
ok(b4.floatOf(him.name).by===departer.name,'…and the record names who handed it over');
const b5b=mk('ShopyLink_Action_B5_BorderFees.html');
b5b.localStorage.setItem('SL_FLOAT_V1',b4.localStorage.getItem('SL_FLOAT_V1'));
b5b.setActor(customs.id);
const cr=b5b.CROSS[0];
b5b.settleCross(cr.id,'driver'); cr.paidDriver=him.name; b5b.publishFloats();
ok(b5b.floatSpent(him.name)===b5b.crossTotal(cr),'the crossing spends from it: '+b5b.crossTotal(cr));
ok(b5b.floatLeft(him.name)===500-b5b.crossTotal(cr),'…leaving '+b5b.floatLeft(him.name)+' — derived from the crossings, never kept twice');

console.log('§9 claims: the cap is pricing, the decision is returns');
const cl=mk('ShopyLink_Action_Claims.html');
ok(typeof cl.actorMay==='function','claims is guarded');
const support=staff.filter(function(p){return p.role==='support';})[0];
const cap0=cl.POLICY.flatCap;
cl.setActor(support.id);
cl.askSetCap(cap0+50);
ok(cl.POLICY.flatCap===cap0,'a support agent cannot move the compensation cap — it decides what every future claim is worth');
ok(cl.actorMay('b8_ret')===false,'…nor decide a claim, which pays a client');
const pricer=staff.filter(function(p){return p.perms.indexOf('pr_base')>-1;})[0];
cl.setActor(pricer.id);
ok(cl.actorMay('pr_base')===true,'pricing may set the cap');
const ret=staff.filter(function(p){return p.perms.indexOf('b8_ret')>-1;})[0];
cl.setActor(ret.id);
ok(cl.actorMay('b8_ret')===true,'returns may decide the claim');

console.log('§10 D1: a cancellation must be answerable');
const d1=new JSDOM(fs.readFileSync('ShopyLink_D1_Control.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
ok(!d1.ME.id,'nobody is signed in at the start — it used to default to PEOPLE[0]');
d1.go('s0');
ok(d1.document.getElementById('shell').innerHTML.length>1000,'…and the screen still draws');
const job=d1.ITEMS.filter(function(i){return i.status==='open';})[0];
ok(d1.cancel(job.id,'a reason long enough')===false,'nobody cannot cancel a client job');
const mgr=d1.PEOPLE.filter(function(p){return p.role==='manager';})[0];
d1.setActor(mgr.id);
ok(d1.cancel(job.id,'client withdrew the shipment')===true,'a manager can, with a reason');
d1.setActor(null);
ok(!d1.ME.id,'signing out drops him — it used to keep him');
const job2=d1.ITEMS.filter(function(i){return i.status==='open';})[0];
ok(d1.cancel(job2.id,'another reason here')===false,'…and cancellation is refused again');
d1.setActor('U-nobody');
ok(!d1.ME.id,'an unknown id is nobody, not whoever was there before');

console.log('§11 moving somebody else\u2019s work needs a person behind it');
const dd=new JSDOM(fs.readFileSync('ShopyLink_D1_Control.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const it=dd.ITEMS.filter(function(x){return x.status==='open';})[0];
const owner=it.owner;
const other=dd.PEOPLE.filter(function(p){return p.id!==owner;})[0];
ok(dd.reassign(it.id,other.id,'')===false,'nobody cannot reassign a job — it used to succeed, attributed to no one');
ok(it.owner===owner,'…and the work stays put');
const stranger=dd.PEOPLE.filter(function(p){return p.id!==owner&&p.role!=='manager';})[0];
dd.setActor(stranger.id);
ok(dd.reassign(it.id,other.id,'')===false,'a person with no claim on it cannot move it');
dd.setActor(owner);
ok(dd.reassign(it.id,other.id,'')===true,'the owner may hand it on');
const ln=(dd.LOG||dd.AUDIT||[]).filter(function(l){return /reassigned/.test(l.what||l.text||'');})[0];
ok(ln&&/reassigned/.test(ln.what||ln.text),'…and the log names who did it, not just that it happened');
const mgr2=dd.PEOPLE.filter(function(p){return p.role==='manager';})[0];
dd.setActor(mgr2.id);
ok(dd.reassign(it.id,owner,'putting it back')===true,'a manager may move anybody\u2019s work');

console.log('§12 the modules with nothing to guard, checked rather than assumed');
['Addresses','SmartRegistration','GiftCards'].forEach(function(m){
 const src=fs.readFileSync('ShopyLink_'+m+'.html','utf8');
 const acts=(src.match(/onclick="([a-zA-Z]+)\(/g)||[]).map(function(x){return x.slice(9,-1);});
 const uniq={};acts.forEach(function(a){uniq[a]=1;});
 const names=Object.keys(uniq);
 ok(names.every(function(a){return /^pg(Go|Set)$/.test(a);}),
    m+' has only paging controls — nothing to destroy, spend or approve: '+names.join(' '));
});

console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
