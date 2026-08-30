// The dashboard: a sidebar that gets out of the way, and a home that reads the
// registers instead of counting its own fixtures. Built INTO the shell, which
// already signs a person in and hides the modules he holds no grant in —
// checked before writing anything, because a console was built beside it once
// and deleted the same day.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const store={};
const shared={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{},key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length}};
const open1=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:shared,configurable:true});w.render&&w.render();return w;};
const cards=h=>(h.match(/<div class="t">([^<]*)<\/div><div class="n machine">(\d+)/g)||[])
  .map(x=>x.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim());

open1('ShopyLink_Action_C9_Staff.html');
const d1=open1('ShopyLink_D1_Control.html');
['S-1','S-2','S-3'].forEach(id=>d1.slEmit('parcel.received',{ship:id,client:'C',actor:'Khaled',payload:{from:'Dubai',to:'Damascus',mode:'air',weight:9}}));
d1.slEmit('shipment.arrived',{ship:'T1',actor:'x',payload:{ships:['S-2','S-3']}});
d1.slEmit('shipment.delivered',{ship:'R1',actor:'x',payload:{delivered:0,failed:1,ships:[],failedShips:['S-3']}});
d1.slEmit('shipment.delivered',{ship:'R1',actor:'x',payload:{delivered:0,failed:1,ships:[],failedShips:['S-3']}});
d1.render();
const sh=open1('ShopyLink_Shell.html');
const staff=JSON.parse(shared.getItem('SL_STAFF_V1')).staff;
const by=r=>staff.filter(p=>p.role===r)[0];

console.log('§1 nothing was rebuilt that the shell already had');
const src=fs.readFileSync('ShopyLink_Shell.html','utf8');
ok(/function canOpen/.test(src),'1.1 the shell still owns the sign-in and the module list');
ok(sh.MODULES.length===5,'1.2 five categories, as before');
ok(sh.MODULES.reduce((a,g)=>a+g[3].length,0)===25,'1.3 and twenty-five modules under them');
ok(!/setItem\('SL_(SHIPMENTS|TRIPS|NOTICES|APPROVALS)/.test(src),'1.4 the dashboard writes to no register: it is a window, not a second system');

console.log('\n§2 the sidebar gets out of the way, and remembers');
ok(typeof sh.toggleRail==='function','2.1 it collapses');
const was=sh.RAIL;
sh.toggleRail();
ok(sh.RAIL!==was,'2.2 …and the state changes');
ok(shared.getItem('SL_SHELL_RAIL')!==null,'2.3 …and is remembered: a control that forgets is one nobody uses twice');
const sh2=open1('ShopyLink_Shell.html');
ok(sh2.RAIL===sh.RAIL,'2.4 …across a reopen');
sh.toggleRail();
ok(/data-i=/.test(sh.document.body.innerHTML),'2.5 every link carries its initial, so the rail is readable without labels');
ok(/title="/.test(sh.document.body.innerHTML),'2.6 …and its full name on hover, because an initial alone is a guess');

console.log('\n§3 the figures are read, not counted here');
sh.ME=by('admin');
ok(sh.nReceived()===1,'3.1 what has been taken in and not yet consolidated');
ok(sh.nArrived()===2,'3.2 what has arrived and waits for a round');
ok(sh.nFailed()===1,'3.3 what has failed twice');
const reg=JSON.parse(shared.getItem('SL_SHIPMENTS_V1')).shipments;
ok(sh.nOpen()===reg.filter(s=>s.open).length,'3.4 …and the open count is the register\'s own, so this screen and D1 cannot disagree');

console.log('\n§4 every card is work THIS person owes');
sh.ME=by('wh');
const whC=cards(sh.renderHome());
ok(whC.length===1&&/Taken in/.test(whC[0]),'4.1 the centre clerk sees what is waiting to be measured, and nothing else');
sh.ME=by('acct');
ok(!cards(sh.renderHome()).some(c=>/Taken in/.test(c)),'4.2 the accountant does not: showing him parcels waiting in Dubai teaches him to ignore the screen');
sh.ME=by('support');
const supC=cards(sh.renderHome());
ok(supC.some(c=>/To deliver|Failed/.test(c)),'4.3 the delivery supervisor sees the rounds and the failures');
sh.ME=by('admin');
ok(cards(sh.renderHome()).length>=3,'4.4 and the one who holds every duty sees them all');

console.log('\n§5 a position that promises what it cannot do');
const sup=sh.staff().filter(p=>p.role==='support')[0];
ok(sup.perms.indexOf('b7_assign')>-1,'5.1 the support agent may open the dispatcher — his statement says he ASSIGNS the rounds and he held only b8_mon, so the card for work he owns was hidden from him by canOpen, correctly refusing a module he had no grant in');
ok(sup.perms.indexOf('b8_ret')===-1&&sup.perms.indexOf('b7_reassign')===-1,'5.2 …and NOT the level-2 acts: I read the position by its English name, gave it reassignment and returns, and two older contracts caught it inside a minute. A support agent is level 1; the exceptions belong above him.');
ok(sup.level===1,'5.3 …his level is unchanged, which is what those contracts were guarding');

console.log('\n§6 the day, and what head office is saying');
sh.ME=by('admin');
const home=sh.renderHome();
ok(/on the move|quiet|not moved/.test(home),'6.1 the day says what kind of day it is');
ok(/class="note"/.test(home),'6.2 …under any notice addressed to him');
const junior=by('driver')||by('wh');
sh.ME=junior;
const jr=sh.renderHome();
const aimed=JSON.parse(shared.getItem('SL_NOTICES_V1')).notices.filter(x=>x.audience&&!x.audience.all)[0];
ok(!aimed||jr.indexOf(aimed.en.slice(0,25))===-1,'6.3 a notice addressed elsewhere is not shown to him — the audience is the board\'s, not a level of my invention');

console.log('\n§7 an empty system says so');
const bare=mk('ShopyLink_Shell.html');
bare.ME=null;
ok(bare.dashLive()===false,'7.1 with nothing published it knows');
ok(/nothing|Nothing|لم تنشر/.test(bare.renderHome()),'7.2 …and says so rather than drawing zeros that look like a quiet day');
ok(bare.document.body.innerHTML.length>500,'7.3 and the shell still renders with nobody signed in — it used to throw on ME.name in its own footer');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
