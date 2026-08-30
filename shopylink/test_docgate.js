// The control board drew a gate and nothing was ever gated: a trip could be
// dispatched with no invoice, no permit and no packing list, and the first
// anybody heard of it was at a border. The rules belong to D1; B3 reads them,
// records who holds each paper, and refuses at the act.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const strip=h=>h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');

const d1=mk('ShopyLink_D1_Control.html'); const G=d1.localStorage.getItem('SL_GATES_V1');
const c9=mk('ShopyLink_Action_C9_Staff.html'); const STAFF=c9.localStorage.getItem('SL_STAFF_V1');
const staff=JSON.parse(STAFF).staff;
const L3=staff.filter(p=>Number(p.level)>=3)[0], L1=staff.filter(p=>Number(p.level)===1)[0];
const boot=(withGates,actor)=>{
 const w=mk('ShopyLink_Action_03_CreateTrip.html');
 if(withGates)w.localStorage.setItem('SL_GATES_V1',G);
 w.localStorage.setItem('SL_STAFF_V1',STAFF);
 if(actor)w.setActor(actor);
 w.go('s3-pre');
 /* Somebody must be carrying the originals before a trip can be declared —
    a rule added after these sections were written. Naming the carrier here
    keeps each section testing the thing it was written to test; §11 tests the
    custody rule itself, on a trip booted without this. */
 if(withGates!=='no-papers')w.setPapersHolder('DRV-03','Salma Idris');
 return w;
};

console.log('§1 the rules have an owner, and now they reach the module that acts');
const g=JSON.parse(G);
ok(!!g.rules['land|export|depart'],'1.1 the checklist for a land export is published');
ok(!!g.rules['sea|export|depart']&&!!g.rules['air|export|depart'],'1.2 …and for sea and air, which are not the same papers');
ok(!!g.labels.permit&&!!g.labelsAr.permit,'1.3 both languages travel, so no reader invents a name for a document');
ok(g.rules['sea|export|depart'].some(r=>r.code==='vgm'),'1.4 sea carries VGM; land does not');
ok(!g.rules['land|export|depart'].some(r=>r.code==='vgm'),'1.5 …and land does not carry it');
ok(!/DOC_RULES\s*=/.test(fs.readFileSync('ShopyLink_Action_03_CreateTrip.html','utf8')),'1.6 B3 keeps no copy of the rules — it reads them');

console.log('\n§2 the checklist is derived from the trip, not typed on it');
let w=boot(true);
ok(w.st.tripType==='land'&&w.st.assignedShipments.length===3,'2.1 a land trip with three shipments');
const req=w.docsRequired();
ok(req.length===13,'2.2 thirteen papers are required — '+req.length);
ok(req.filter(r=>r.ship===null).length===1,'2.3 the transit permit is asked once for the whole trip');
ok(req.filter(r=>r.code==='invoice').length===3,'2.4 …and the invoice for EVERY shipment, not just the first');
ok(/0\/13/.test(strip(w.document.getElementById('shell').innerHTML)),'2.5 the screen counts what is held against what is needed');

console.log('\n§3 nothing leaves without the papers');
ok(w.docsMissing().length===13,'3.1 nothing is held yet');
ok(w.docsClear()===false,'3.2 the trip is not clear');
ok(w.declareTripCreated()===false,'3.3 the act refuses — not merely a disabled button');
ok(JSON.parse(w.localStorage.getItem('SL_EVENTS_V1')||'[]').length===0,'3.4 and nothing reaches the log');
ok(/papers missing/.test(strip(w.document.getElementById('shell').innerHTML)),'3.5 the button says why, rather than sitting there dead');

console.log('\n§4 a tick is a person saying he has it');
w.setActor(L1.id); w.render();
w.tickDoc('permit','');
const held=w.docHeld('permit',null)||w.docHeld('permit','');
ok(!!held,'4.1 the paper is marked held');
ok(held.by===L1.name,'4.2 …by whoever actually ticked it — '+held.by);
ok(!!held.at,'4.3 …and when');
ok(/held by/.test(strip(w.document.getElementById('shell').innerHTML)),'4.4 the screen shows it, so a tick is answerable');
w.tickDoc('permit','');
ok(!w.docHeld('permit',''),'4.5 and it can be taken back — a mistaken tick is not a life sentence');

console.log('\n§5 a conditional paper is asked, never assumed');
const coo=w.docsRequired().filter(r=>r.code==='coo')[0];
ok(!!coo&&!!coo.cond,'5.1 the certificate of origin carries its condition from the rule');
ok(w.docsMissing().some(m=>m.code==='coo'),'5.2 it counts as missing until somebody says otherwise');
w.markNA('coo',coo.ship);
ok(!w.docsMissing().some(m=>m.code==='coo'&&m.ship===coo.ship),'5.3 …and set aside deliberately, it stops blocking');
ok(/does not apply/.test(strip(w.document.getElementById('shell').innerHTML)),'5.4 the control is on the screen for the papers that have a condition');

console.log('\n§6 clearing every paper opens the gate');
const w2=boot(true,L1.id);
w2.docsRequired().forEach(r=>w2.tickDoc(r.code,r.ship||''));
ok(w2.docsMissing().length===0,'6.1 all thirteen are held');
ok(w2.docsClear()===true,'6.2 the trip is clear');
ok(w2.declareTripCreated()!==false,'6.3 …and it may go');
const ev=JSON.parse(w2.localStorage.getItem('SL_EVENTS_V1')||'[]');
ok(ev.filter(e=>e.type==='trip.created').length===1,'6.4 the trip is declared once');

console.log('\n§7 dispatching without them is a level-3 decision, with a reason');
const w3=boot(true,L1.id);
ok(w3.mayOverrideDocs()===false,'7.1 a level-1 operator may not');
ok(w3.overrideDocs('the border agent has the originals').ok===false,'7.2 …and is refused at the act');
ok(strip(w3.document.getElementById('shell').innerHTML).indexOf('Dispatch without them')===-1,'7.3 what he may not do, he does not see');
w3.setActor(L3.id); w3.render();
ok(w3.mayOverrideDocs()===true,'7.4 a level-3 manager may');
ok(strip(w3.document.getElementById('shell').innerHTML).indexOf('Dispatch without them')>-1,'7.5 …and the control appears for him');
ok(w3.overrideDocs('ok').ok===false,'7.6 a two-word reason is not a reason');
w3.askOverrideDocs(); w3.setTyped('originals are with the border agent, scans on file'); w3.modalOk();
ok(!!w3.DOC_OVERRIDE,'7.7 the override is granted through the dialog');
ok(w3.DOC_OVERRIDE.by===L3.name,'7.8 recorded against whoever actually granted it — '+w3.DOC_OVERRIDE.by);
ok(/originals are with/.test(w3.DOC_OVERRIDE.reason),'7.9 …with the reason he gave');
ok(w3.declareTripCreated()!==false,'7.10 and the trip may now go');
ok(/Dispatched without the papers|أُرسلت بدون/.test(strip(w3.document.getElementById('shell').innerHTML)),'7.11 the screen keeps saying so');

console.log('\n§8 an override covers what was missing when it was granted');
const w4=boot(true,L3.id);
w4.overrideDocs('originals are with the border agent, scans on file');
ok(w4.docsClear()===true,'8.1 the trip is clear on the strength of it');
w4.st.assignedShipments.push('CON-240703-09');
ok(w4.docsClear()===false,'8.2 a shipment added afterwards brings its own papers, and they are missing');
ok(w4.declareTripCreated()===false,'8.3 …so the old permission does not carry the new cargo');

console.log('\n§9 with the rules unpublished the module says so');
const w5=boot(false,L1.id);
ok(w5.docsRequired().length===0,'9.1 nothing can be required');
ok(/not published here|غير منشورة/.test(strip(w5.document.getElementById('shell').innerHTML)),'9.2 …and the screen says why, rather than showing a clear gate');
ok(w5.declareTripCreated()!==false,'9.3 the trip is not held hostage to a bus being down — that is broken, not careful');

console.log('\n§10 the dialog this module had been calling for months');
const src=fs.readFileSync('ShopyLink_Action_03_CreateTrip.html','utf8');
ok(/function askConfirm\(/.test(src),'10.1 askConfirm is defined — it was called from three places and defined in none, so every one of them threw');
ok((src.match(/modalHTML\(\)/g)||[]).length>=5,'10.2 …and mounted on every screen, or it could never be seen');
const w6=boot(true,L1.id);
w6.st.borders=[w6.bordersLive()[0]];   /* the list is derived from the network now, not a table in this file */      // the review fixture carries no crossings
w6.askRmBorder(0);
ok(!!w6.B3MODAL,'10.3 the crossing dialog opens instead of throwing');
w6.modalClose();
ok(!w6.B3MODAL,'10.4 …and closes');

console.log('\n§11 the originals stay with one person, and never move');
const w11=boot('no-papers');
ok(w11.papersWith()===null,'11.1 a new trip carries nobody\'s name on its papers');
ok(w11.declareTripCreated()===false,'11.2 …and cannot be declared: papers with nobody is the same fault as papers missing');
const a1=w11.setPapersHolder('DRV-03','Salma Idris');
ok(a1.ok===true,'11.3 one person is named as carrying the originals');
ok(w11.papersWith().name==='Salma Idris','11.4 …and the trip knows who');
const a2=w11.setPapersHolder('DRV-06','Adel Rifai');
ok(a2.ok===false,'11.5 they cannot be handed to somebody else — the owner\'s rule is "one person, never"');
ok(/do not change hands/.test(a2.why),'11.6 …and it says so plainly rather than failing quietly');
ok(w11.papersWith().name==='Salma Idris','11.7 the refusal changes nothing: he still has them');
ok(w11.setPapersHolder(null,'')['ok']===false,'11.8 and nobody at all is not an option either');

console.log('\n§12 every paper names who put it there');
const w12=boot('ShopyLink_Action_03_CreateTrip.html');
w12.tickDoc('invoice','CON-240701-01');
const tick12=w12.DOCS_HELD[Object.keys(w12.DOCS_HELD)[0]];
ok(!!tick12&&!!tick12.by,'12.1 a ticked document records WHO uploaded it');
ok(!!tick12.at,'12.2 …and when');
ok(Object.keys(w12.DOCS_HELD).length===1,'12.3 …one entry per paper, not a blanket tick');
ok(/papers:\(function\(\)/.test(src),'12.4 and the trip event declares the carrier, so the answer travels with the journey rather than staying on a screen');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
