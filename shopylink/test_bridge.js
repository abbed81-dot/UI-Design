// C9 owns who may do what; D1 reads it. Neither is blocked when the channel is gone.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§108 one owner publishes the rights');
const c9=mk('ShopyLink_Action_C9_Staff.html');
const pub=c9.slStaffRead();
ok(pub&&pub.length>0,'C9 publishes its staff ('+pub.length+')');
ok(pub.every(p=>p.id&&p.perms),'every entry carries an id and the permissions it resolves to');
ok(pub.some(p=>p.perms.length>0),'…which are computed, not copied');

console.log('§109 D1 reads rather than keeping a second opinion');
const d1=mk('ShopyLink_D1_Control.html');
d1.localStorage.setItem('SL_STAFF_V1',c9.localStorage.getItem('SL_STAFF_V1'));
ok((d1.slStaffRead()||[]).length===pub.length,'D1 sees exactly what C9 published');
const acct=c9.USERS.filter(u=>u.role==='acct')[0], wh=c9.USERS.filter(u=>u.role==='wh')[0];
ok(d1.permitted(acct.id,'invoice')===true,'an accountant may build an invoice');
ok(d1.permitted(wh.id,'invoice')===false,'a warehouse clerk may not — D1 no longer has to guess');
ok(d1.permitted('ghost','invoice')===null,'an unknown person is UNKNOWN, never silently allowed');

console.log('§110 routing and permission are different questions');
ok(typeof d1.canOwn==='function','a task owner is checked on both');
const r1=d1.canOwn(acct.id,'finance','invoice');
ok(r1.ok&&r1.checked==='routing and permission','with the registry, both are checked');
const r2=d1.canOwn(wh.id,'wh','invoice');
ok(!r2.ok&&r2.why==='routing','the wrong role is refused on routing before permission is even consulted');
const r3=d1.canOwn(wh.id,'finance','invoice');
ok(!r3.ok&&r3.why==='permission','the right role but the wrong grant is refused on permission — and says which');

console.log('§111 leave and departure are respected');
const someone=c9.USERS.filter(u=>u.role==='acct')[1]||acct;
const lv=c9.requestLeave(someone.id,'2026-08-19','2099-01-01');
c9.decideLeave(lv.req.id,true,'admin');
c9.render();
d1.localStorage.setItem('SL_STAFF_V1',c9.localStorage.getItem('SL_STAFF_V1'));
const offered=d1.whoCanDo('invoice');
ok(offered.every(p=>p.id!==someone.id),'someone on leave is not offered the work');
ok(d1.staffRec(someone.id).onLeave===true,'…though D1 can still see that they exist and why they are away');
ok(d1.staffRec(someone.id).back==='2099-01-01','…and when they are due back');

console.log('§112 it degrades honestly');
const bare=mk('ShopyLink_D1_Control.html');
ok(bare.slStaffRead()===null,'with no registry published, D1 finds none');
ok(bare.permitted(acct.id,'invoice')===null,'…and answers UNKNOWN rather than yes or no');
ok(bare.canOwn(acct.id,'finance','invoice').checked==='routing only','…falling back to its own routing, and saying so');
ok(bare.document.getElementById('shell').innerHTML.length>5000,'…while the dashboard still works');

console.log('§113 the grant is enforced at the act, not only in the interface');
const b9=mk('ShopyLink_Action_09_Billing.html');
b9.localStorage.setItem('SL_STAFF_V1',c9.localStorage.getItem('SL_STAFF_V1'));
const whU=c9.USERS.filter(u=>u.role==='wh')[0], acctU=c9.USERS.filter(u=>u.role==='acct')[0];
const inv=b9.INVOICES.filter(x=>x.status==='draft')[0];
b9.setActorB9(whU.id); b9.openInv(inv.ship);
ok(b9.actorMay('b9_issue')===false,'a warehouse clerk is not granted ISSUE');
b9.issueInv();
ok(inv.status==='draft','…and calling the function directly does nothing — the act refuses, not just the button');
b9.askIssue();
ok(/not granted|غير مصرَّح/.test(b9.document.querySelector('.sl-modal').textContent),'…and the dialog says so before anyone presses it');
b9.closeModal();
b9.setActorB9(acctU.id);
b9.issueInv();
ok(inv.status==='issued','the accountant can issue');

console.log('§114 a broken bus must not stop the billing');
const bare9=mk('ShopyLink_Action_09_Billing.html');
ok(bare9.actorMay('b9_issue')===null,'with no registry the answer is UNKNOWN, not no');
const inv2=bare9.INVOICES.filter(x=>x.status==='draft')[0];
bare9.openInv(inv2.ship); bare9.issueInv();
ok(inv2.status==='issued','…and the invoice still issues — a warehouse that cannot bill because a bus is down is worse than one that bills with a name on the record');

console.log('§118 the approvals console decides from the real roster');
const c12=mk('ShopyLink_Action_C12_Approvals.html');
ok(c12.rosterActors().length===3,'with no registry it falls back to its own seeded list, rather than showing nobody');
const c12b=mk('ShopyLink_Action_C12_Approvals.html');
c12b.localStorage.setItem('SL_STAFF_V1',c9.localStorage.getItem('SL_STAFF_V1'));
const roster=c12b.rosterActors();
ok(roster.length>3,'with the registry it sees the real roster ('+roster.length+')');
ok(roster.every(p=>p.level>=1&&p.level<=3),'each decider carries a level');
const pend=c12b.allReqs().filter(r=>r.status==='pending');
const hard=pend.filter(r=>c12b.reqLevel(r)===3)[0]||pend[0];
const lo=roster.filter(p=>p.level===1)[0], hi=roster.filter(p=>p.level===3)[0];
c12b.setMeFromRoster(lo.id);
ok(c12b.canDecide(hard)===false,'an L1 person cannot decide an L'+c12b.reqLevel(hard)+' request');
c12b.setMeFromRoster(hi.id);
ok(c12b.canDecide(hard)===true,'an L3 person can');
ok(c12b.pendingForMe().length===pend.length,'…and their queue is the whole list');
const away=c9.USERS.filter(u=>u.role==='hubsup')[0];
const lvq=c9.requestLeave(away.id,'2026-08-19','2099-02-02'); c9.decideLeave(lvq.req.id,true,'admin'); c9.render();
c12b.localStorage.setItem('SL_STAFF_V1',c9.localStorage.getItem('SL_STAFF_V1'));
ok(!c12b.rosterActors().some(p=>p.id===away.id),'someone on leave is not offered as a decider');

console.log('§119 an event names the person, not the screen');
const b1=mk('ShopyLink_Action_01_ReceiveParcel.html');
ok(!/actor:.B1 receive./.test(fs.readFileSync('ShopyLink_Action_01_ReceiveParcel.html','utf8')),'B1 no longer stamps a screen name onto its events');
ok(/unattributed/.test(b1.actorName()),'with nobody signed in it says unattributed rather than inventing a name');
b1.localStorage.setItem('SL_STAFF_V1',c9.localStorage.getItem('SL_STAFF_V1'));
const whx=c9.USERS.filter(u=>u.role==='wh')[0];
b1.setActor(whx.id);
b1.slEmit('parcel.received',{ship:'SH-CHAIN',actor:b1.actorName(),payload:{customer:'Test',cartons:3}});
const bus=JSON.parse(b1.localStorage.getItem('SL_EVENTS_V1')||'[]');
ok(bus[bus.length-1].actor===whx.name,'the event on the bus carries the receiver: '+bus[bus.length-1].actor);
const dash=mk('ShopyLink_D1_Control.html');
dash.localStorage.setItem('SL_EVENTS_V1',b1.localStorage.getItem('SL_EVENTS_V1'));
dash.localStorage.setItem('SL_STAFF_V1',c9.localStorage.getItem('SL_STAFF_V1'));
try{dash.ingest();}catch(e){}
dash.render();
const got=(dash.slEvRead?dash.slEvRead():[]).filter(e=>e.ship==='SH-CHAIN')[0];
ok(got&&got.actor===whx.name,'…and D1 reads it with the name intact — a wrong weight now has someone to ask');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
