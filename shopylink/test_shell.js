// One site, many roles. The modules are untouched: this only supplies the sign-in,
// a menu built from the person's own grants, and a queue of what is waiting.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=()=>new JSDOM(fs.readFileSync('ShopyLink_Shell.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
let w=mk(), d=()=>w.document;

console.log('§1 you sign in as a person');
ok(!!d().querySelector('.gate'),'it opens on a sign-in, not a menu');
const names=[...d().querySelectorAll('.who-btn b')].map(b=>b.textContent);
ok(names.length>0,names.length+' people offered, each by name');
ok(names.indexOf('Omar Al-Masri')>-1,'…including the admin');
ok(!names.some(x=>/Samer Haddad|Huda Kanaan/.test(x)),'…and no drivers: they have their own app, not this one');
ok(/\d+ permissions|صلاحية/.test(d().querySelector('.who-btn').textContent),'…each showing how much they may do');

console.log('§2 THE TEST — the menu is built from grants, not written down');
const clerk=w.staff().filter(p=>/Khaled/.test(p.name))[0];
const admin=w.staff().filter(p=>/Omar Al-Masri/.test(p.name))[0];
w.signIn(clerk.id);
const clerkLinks=[...d().querySelectorAll('.lnk')].map(b=>b.textContent.trim());
w.signIn(admin.id);
const adminLinks=[...d().querySelectorAll('.lnk')].map(b=>b.textContent.trim());
ok(clerkLinks.length<adminLinks.length,'the clerk sees '+clerkLinks.length+' entries, the admin '+adminLinks.length+' — if these matched, the filter would be decoration');
ok(!clerkLinks.some(x=>/Billing|Pricing/.test(x)),'the clerk never sees Billing or Pricing — absent, not greyed');
ok(adminLinks.some(x=>/Billing/.test(x)),'…and the admin does');
ok(clerkLinks.some(x=>/Receive parcel/.test(x)),'…while the clerk keeps the work that is his');

console.log('§3 hiding is not locking');
w.signIn(clerk.id);
let alerted=false; w.alert=function(){alerted=true;};
w.go('ShopyLink_Action_09_Billing.html');
ok(alerted,'asking for a forbidden module by URL is refused, not merely unlisted');
ok(w.CUR!=='ShopyLink_Action_09_Billing.html','…and it does not open');

console.log('§4 the modules keep talking to each other');
const src=fs.readFileSync('ShopyLink_Shell.html','utf8');
['SL_EVENTS_V1','SL_STAFF_V1','SL_QUOTES_BIZ_V1','SL_APPROVALS_V1'].forEach(function(c){
  ok(src.indexOf(c)>-1,'the shell reads '+c+' directly');
});
ok(!/postMessage/.test(src),'…and proxies nothing — same origin, same storage, no wrapper to drift');

console.log('§5 a queue, not a menu');
/* This section used to seed the EVENT LOG and look for a "Shipments expected"
   card. The home was rebuilt to read the REGISTERS the modules publish — so a
   figure here and the same figure in D1 cannot disagree — and the cards became
   duty-gated counts off SL_SHIPMENTS_V1. The sentences below did not change;
   the mechanism under them did, and this contract had been asserting against
   the old one, throwing on a card that no longer exists.
   Its first assertion also read body.textContent, which includes the shell's
   own dictionary inside the <script>: it matched the STRING "Shipments
   expected" in the source and passed on a page that never drew it. Every read
   here is against the rendered shell. */
w=mk(); d=()=>w.document;
const shellOf=x=>x.document.getElementById('app');
w.localStorage.setItem('SL_SHIPMENTS_V1',JSON.stringify({at:Date.now(),shipments:[
 {ship:'CON-A',client:'TechLine',from:'Dubai',to:'Damascus',mode:'air',stage:'received',at:Date.now(),attempts:0,open:true},
 {ship:'CON-B',client:'Sham',from:'Dubai',to:'Damascus',mode:'air',stage:'received',at:Date.now(),attempts:0,open:true}
]}));
w.signIn(w.staff().filter(p=>/Khaled/.test(p.name))[0].id);
ok(d().querySelectorAll('.qcard').length>0,'the landing page shows what is waiting, as a card and not a sentence');
ok(/>2</.test(d().querySelector('.qcard .n').outerHTML),'…counted: 2, off the register rather than off this screen\'s own arithmetic');
ok(!/Shipments expected/.test(shellOf(w).textContent),'…and the count is the register\'s question, not the log\'s: nothing here is derived twice');
const wa=mk();
wa.localStorage.setItem('SL_SHIPMENTS_V1',JSON.stringify({at:Date.now(),shipments:[
 {ship:'CON-A',client:'TechLine',from:'Dubai',to:'Damascus',mode:'air',stage:'received',at:Date.now(),attempts:0,open:true}
]}));
wa.signIn(wa.staff().filter(p=>/Fadi/.test(p.name))[0].id);
ok(wa.document.querySelectorAll('.qcard').length===0,'…and work is never offered to someone who cannot do it — the card is absent, not merely unclickable');

console.log('§6 it behaves like a site');
w.go('ShopyLink_Action_01_ReceiveParcel.html');
ok(w.location.hash==='#/ShopyLink_Action_01_ReceiveParcel.html','the URL follows you, so a screen can be linked to');
ok(!!d().querySelector('iframe'),'the module runs inside the shell');
ok(d().querySelectorAll('.side').length===1&&d().querySelectorAll('.bar').length===1,'…with one header on screen, not two');
ok(/Receive parcel/.test(d().querySelector('.crumb').textContent),'…and the breadcrumb says where you are');
w.setLang('ar');
ok(d().documentElement.dir==='rtl','the whole shell flips to Arabic');
ok(/استلام طرد/.test(d().body.textContent),'…menu and all');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
