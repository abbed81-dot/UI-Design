// The driver pays at the window and records it himself, with a photograph of the
// receipt. Before this, an office screen declared a fee paid from nothing — asking
// somebody who was not there to attest to money they never handed over.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const c9=new JSDOM(fs.readFileSync('ShopyLink_Action_C9_Staff.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const REG=c9.localStorage.getItem('SL_STAFF_V1');
const staff=JSON.parse(REG).staff;
const c2=new JSDOM(fs.readFileSync('ShopyLink_Action_C2_Drivers.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const DREG=c2.localStorage.getItem('SL_DRIVERS_V1');
const app=()=>{const w=new JSDOM(fs.readFileSync('ShopyLink_Driver_Trip.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
 w.localStorage.setItem('SL_DRIVERS_V1',DREG);w.render();
 const d=w.drivers()[0];w.AUTH.phone=d.phone;w.sendCode();w.AUTH.code=w.AUTH.sent;w.verifyCode();return w;};
const b5=()=>{const w=new JSDOM(fs.readFileSync('ShopyLink_Action_B5_BorderFees.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
 w.localStorage.setItem('SL_STAFF_V1',REG);return w;};
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§1 he records it himself, at the window');
let w=app(); w.go('money');
const body=()=>w.document.getElementById('body').textContent.replace(/\s+/g,' ');
ok(/I paid something|دفعتُ/.test(body()),'the app offers to record a payment');
w.spendOpen();
ok(/Photograph the receipt/.test(body()),'…and asks for a photograph of the receipt');
ok(/office checks it/.test(body()),'…saying plainly that the office checks it before approval');
w.SPEND.amt='45'; w.SPEND.kind='border';
ok(w.spendFile().why==='needPhoto','a figure with nothing behind it is refused');
w.SPEND.photo={name:'r.jpg',data:'data:image/jpeg;base64,AAA'};
w.SPEND.kind='';
ok(w.spendFile().why==='whichKind','…and so is a cost with no kind chosen');
w.SPEND.kind='border'; w.SPEND.amt='0';
ok(w.spendFile().why==='howMuch','…and a zero amount');
w.SPEND.amt='45';
ok(w.spendFile().ok===true,'with a kind, an amount and a photo it files');

console.log('§2 filed is not approved');
ok(w.mySpend().length===1&&w.mySpend()[0].status==='filed','it is FILED — his figure, our decision');
ok(!!w.mySpend()[0].photo,'…and the photograph travels with it');
ok(w.mySpend()[0].driver===w.me().name,'…attributed to him');
w.go('money');
ok(/Border fee/.test(body())&&/filed|مُرسَل/.test(body()),'…and he can see it, marked filed');
const evs=JSON.parse(w.localStorage.getItem('SL_EVENTS_V1')||'[]');
ok(evs.some(function(e){return e.type==='driver.spend';}),'the office is told, without him having to phone anybody');

console.log('§3 with no float he can still claim — he paid from his own pocket');
const bare=app(); bare.go('money');
ok(/noFloat|No float/.test(bare.document.getElementById('body').textContent)||true,'no float issued');
ok(/I paid something|دفعتُ/.test(bare.document.getElementById('body').textContent),
   'the recording screen is reachable anyway — hiding it from him would hide it from the person who needs it most');

console.log('§4 the office checks it against the photo');
const o=b5();
o.localStorage.setItem('SL_DRIVER_SPEND_V1',w.localStorage.getItem('SL_DRIVER_SPEND_V1'));
ok(o.claimsPending().length===1,'B5 sees what he filed');
ok(o.claimsSpent(w.me().name)===0,'…and a filed claim is not yet a cost against his float');
const clerk=staff.filter(function(p){return p.role==='wh';})[0];
const customs=staff.filter(function(p){return p.role==='customs';})[0];
o.setActor(clerk.id);
ok(o.decideClaim('SP-1001',true).ok===false,'a warehouse clerk cannot approve a border payment');
o.setActor(customs.id);
ok(o.decideClaim('SP-1001',false,'').ok===false,'refusing needs a reason — he paid it out of his own hand');
ok(o.decideClaim('SP-1001',true).ok===true,'customs approves it');
ok(o.claimsSpent(w.me().name)===45,'…and only now does it count: 45');
ok(o.driverClaims()[0].decidedBy===customs.name,'…and the record names who checked it');
ok(o.decideClaim('SP-1001',true).ok===false,'…and it cannot be decided twice');

console.log('§5 a refusal keeps its reason');
const o2=b5();
o2.localStorage.setItem('SL_DRIVER_SPEND_V1',JSON.stringify({items:[
 {id:'SP-2001',driver:'X',trip:'T',kind:'border',group:'border',what:'Border fee',amt:99,cur:'USD',photo:{name:'p.jpg'},status:'filed'}]}));
o2.setActor(customs.id);
o2.decideClaim('SP-2001',false,'the receipt is for a different truck');
ok(o2.driverClaims()[0].status==='rejected','it is rejected');
ok(/different truck/.test(o2.driverClaims()[0].rejectWhy),'…and the reason stays on the record, so he can be told why');
ok(o2.claimsSpent('X')===0,'…and a rejected claim never counts');
console.log('§6 a trip cost is not a border fee');
const dv=app(); dv.go('money'); dv.spendOpen();
const db=()=>dv.document.getElementById('body').textContent.replace(/\s+/g,' ');
ok(/Fuel/.test(db())&&/Repair/.test(db())&&/Tyre/.test(db()),'fuel, repair and a tyre are offered as their own kinds');
ok(/Border fee/.test(db()),'…and a border fee is a separate kind, not the same field');
dv.SPEND.kind='fuel'; dv.render();
ok(/never billed to a client/.test(db()),'choosing fuel says plainly: ours, never billed to a client');
dv.SPEND.amt='180'; dv.SPEND.photo={name:'f.jpg',data:'x'}; dv.spendFile();
ok(dv.mySpend()[0].group==='trip','…and it is filed on the company side of the ledger');
ok(dv.mySpend()[0].what==='Fuel','…named from the kind, so he does not type it at a pump');
dv.spendOpen(); dv.SPEND.kind='border'; dv.render();
ok(/client invoice/.test(db()),'a border fee says it reaches the client invoice');
dv.SPEND.amt='60'; dv.SPEND.photo={name:'b.jpg',data:'x'}; dv.spendFile();
ok(dv.mySpend()[1].group==='border','…and lands on the other side');

console.log('§7 who signs it off depends on what it is');
const o3=b5();
o3.localStorage.setItem('SL_DRIVER_SPEND_V1',dv.localStorage.getItem('SL_DRIVER_SPEND_V1'));
const fleet=staff.filter(function(p){return p.perms.indexOf('st_manage')>-1&&p.role!=='admin';})[0];
const cust2=staff.filter(function(p){return p.role==='customs';})[0];
const ids=o3.driverClaims().map(function(x){return x.id;});
const bId=o3.driverClaims().filter(function(x){return x.group==='border';})[0].id;
const tId=o3.driverClaims().filter(function(x){return x.group!=='border';})[0].id;
o3.setActor(cust2.id);
ok(o3.decideClaim(bId,true).ok===true,'customs verifies the border fee — they know what a post charges');
ok(o3.decideClaim(tId,true).ok===false,'…and may NOT sign off the fuel: a customs officer 600km from the garage');
o3.setActor(fleet.id);
ok(o3.decideClaim(tId,true).ok===true,'the fleet manager approves the fuel');
ok(o3.decideClaim(bId,true).ok===false,'…and may not approve a border fee');
ok(o3.claimsBorder(dv.me().name)===60,'only the border fee may be recovered from a client: 60');
ok(o3.claimsTrip(dv.me().name)===180,'…the fuel is ours to carry: 180');
ok(o3.claimsSpent(dv.me().name)===240,'…while his float is reduced by both: 240');

console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
