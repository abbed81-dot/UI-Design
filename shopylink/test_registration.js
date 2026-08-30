// Five screens of registration existed and registered nobody: every field was a
// picture of a field, no button was wired to anything, and the account the whole
// customer app is built on had to be written into its source by hand.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const fresh=()=>{
 const store={};
 const shared={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{},key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length}};
 return {shared:shared,open:x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:shared,configurable:true});w.render&&w.render();return w;}};
};
const strip=h=>h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');

console.log('§1 nothing is registered on half an answer');
let E=fresh(); E.open('ShopyLink_D1_Control.html');
let reg=E.open('ShopyLink_SmartRegistration.html');
ok(reg.regReady()===false,'1.1 an empty form is not ready');
reg.setReg('name','Nour Haddad');
ok(reg.regReady()===false,'1.2 …nor a name alone');
reg.setReg('phone','+963 9');
ok(reg.regReady()===false,'1.3 …nor a phone number too short to call');
reg.setReg('phone','+963 944 777 222');
ok(reg.regReady()===false,'1.4 …nor without the governorate his goods are delivered to');
const before=JSON.parse(E.shared.getItem('SL_CLIENTS_V1')).clients.length;
ok(reg.submitRegistration().ok===false,'1.5 and the act refuses');
ok(JSON.parse(E.shared.getItem('SL_CLIENTS_V1')).clients.length===before,'1.6 …with nobody written');

console.log('\n§2 a registration produces a client');
reg.setReg('gov','Aleppo');
ok(reg.regReady()===true,'2.1 the form is complete');
const r=reg.submitRegistration();
ok(r.ok===true&&!!r.id,'2.2 it registers — '+r.id);
const list=JSON.parse(E.shared.getItem('SL_CLIENTS_V1')).clients;
const made=list.filter(c=>c.name==='Nour Haddad')[0];
ok(!!made,'2.3 the client is on the register D1 owns, not in a list of its own');
ok(made.type==='individual'&&made.city==='Aleppo'&&made.phone==='+963 944 777 222','2.4 carrying what he actually typed');
ok(made.facility&&made.facility.active===false,'2.5 …and no credit facility: a new client is prepaid, and registration grants nothing');
ok(made.status==='ACTIVE','2.6 the account is active');

console.log('\n§3 it does not disturb anyone already there');
const tech=list.filter(c=>c.name==='TechLine Trading')[0];
ok(!!tech&&tech.facility.active===true&&tech.facility.limit===5000,'3.1 TechLine keeps its 5,000 facility — the fan-out rule billing learned the hard way');
ok(list.length===before+1,'3.2 exactly one client was added');
ok(reg.submitRegistration().ok===false,'3.3 the same name cannot be registered twice');
ok(JSON.parse(E.shared.getItem('SL_CLIENTS_V1')).clients.length===before+1,'3.4 …and nothing is written when it is refused');

console.log('\n§4 the fact reaches the log');
const evs=JSON.parse(E.shared.getItem('SL_EVENTS_V1')||'[]').filter(e=>e.type==='client.registered');
ok(evs.length===1,'4.1 one client.registered event');
ok(evs[0].client==='Nour Haddad','4.2 naming who registered');
ok(evs[0].payload.id===r.id&&evs[0].payload.gov==='Aleppo','4.3 …with the id given and the governorate');
ok(evs[0].payload.channel==='self-registration','4.4 …and that he did it himself, not a clerk at a counter');
ok(evs[0].at>0,'4.5 and the moment it happened, so it cannot be quietly un-happened');

console.log('\n§5 this device now knows whose it is');
const acc=JSON.parse(E.shared.getItem('SL_ACCOUNT_V1')).account;
ok(acc.name==='Nour Haddad'&&acc.id===r.id,'5.1 the account is published');
ok(acc.gov==='Aleppo','5.2 …with where he is');
const app=E.open('ShopyLink_IndividualApp.html');
ok(app.ACCOUNT.name==='Nour Haddad','5.3 the customer app takes its identity from the registration');
ok(/Nour/.test(strip(app.screenHTML('home','default','en'))),'5.4 …and greets him by it');
ok(app.logShipments().length===0,'5.5 a new account owns no cargo, and is shown none');

console.log('\n§6 the screen says what happened, in both languages');
const done=reg.body(5,'default','en');
ok(/Registered/.test(strip(done.foot)),'6.1 the last screen confirms with the id rather than offering the button again');
ok(/تم التسجيل/.test(strip(reg.body(5,'default','ar').foot)),'6.2 in Arabic too');
const src=fs.readFileSync('ShopyLink_SmartRegistration.html','utf8');
ok(/onclick=.{0,4}submitRegistration\(\)/.test(src),'6.3 the button is wired to the act — it was a picture of a button');
ok(/oninput=.{0,4}setReg\('name'/.test(src)&&/setReg\('phone'/.test(src),'6.4 …and the fields carry what is typed');

console.log('\n§7 with storage blocked nothing is claimed');
const bare=mk('ShopyLink_SmartRegistration.html');
bare.setReg('name','X Y'); bare.setReg('phone','+963 944 000 000'); bare.setReg('gov','Homs');
const r7=bare.submitRegistration();
ok(r7.ok===true,'7.1 the form still completes — a registration desk is not blocked by a bus');
const app7=mk('ShopyLink_IndividualApp.html');
ok(app7.ACCOUNT.name==='Layla Al-Rifai','7.2 and an app with nothing published falls back to its own record rather than to nobody');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
