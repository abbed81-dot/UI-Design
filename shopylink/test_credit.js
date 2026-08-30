// The facility is GRANTED in D1 and READ in B9. This asserts the reading, the
// refusal, and the release — through the interface, because a test that calls
// issueInv() directly passes happily while the button that should call it is
// wired to nothing.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const boot=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;

// D1 publishes; nothing here writes the facility by hand.
const d1=boot('ShopyLink_D1_Control.html');
const CLI=d1.localStorage.getItem('SL_CLIENTS_V1');
const c9=boot('ShopyLink_Action_C9_Staff.html');
const STAFF=c9.localStorage.getItem('SL_STAFF_V1');
const staff=JSON.parse(STAFF).staff;

let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const mk=(withClients,withStaff)=>{
  const w=boot('ShopyLink_Action_09_Billing.html');
  if(withClients)w.localStorage.setItem('SL_CLIENTS_V1',CLI);
  if(withStaff)w.localStorage.setItem('SL_STAFF_V1',STAFF);
  w.render&&w.render();
  return w;
};
const sh=w=>w.document.getElementById('shell').innerHTML;
const L3=staff.filter(p=>Number(p.level)>=3)[0];
const L1=staff.filter(p=>Number(p.level)===1)[0];

console.log('§1 the facility is published as an answer, not as raw fields');
const pub=JSON.parse(CLI).clients;
const tech=pub.filter(c=>c.name==='TechLine Trading')[0];
const sham=pub.filter(c=>c.name==='Sham Import LLC')[0];
ok(!!tech.facility&&tech.facility.active===true,'1.1 the granted facility is published active');
ok(tech.facility.limit===5000&&tech.facility.days===30,'1.2 …with the limit and the days it was granted for');
ok(!!tech.facility.cur,'1.3 …and a currency, so a consumer never guesses one');
ok(sham.facility.active===false&&sham.facility.limit===0,'1.4 a business with no facility publishes inactive, limit 0 — being a business grants nothing');
ok(pub.every(c=>c.status!==undefined),'1.5 the account status travels with the record');

console.log('\n§2 B9 reads the facility rather than keeping a second opinion');
let w=mk(true,false);
const T=w.invByShip('BSH-240705-01');          // TechLine — facility 5000
const S=w.invByShip('BSH-240707-03');          // Sham — no facility
const I=w.invByShip('CON-240701-01');          // individual
ok(w.facilityOf(T).known===true,'2.1 the register is read');
ok(w.facilityOf(T).active===true&&w.facilityOf(T).limit===5000,'2.2 TechLine carries the granted 5,000');
ok(w.facilityOf(S).active===false,'2.3 Sham carries no facility');
ok(w.facilityOf(I).active===false,'2.4 an individual carries none either');

console.log('\n§3 credit is offered only where a facility was granted — at the act');
w.openInv('BSH-240707-03');
w.setTerm('credit');
ok(w.invByShip('BSH-240707-03').term!=='credit','3.1 setTerm refuses credit on an account with no facility');
w.setTerm('prepaid');
ok(w.invByShip('BSH-240707-03').term==='prepaid','3.2 prepaid is always available');
ok(/🔒/.test(sh(w)),'3.3 the screen says why, rather than showing a live button that does nothing');
w.openInv('BSH-240705-01');
w.setTerm('credit');
ok(w.invByShip('BSH-240705-01').term==='credit','3.4 credit is accepted where the facility is active');

console.log('\n§4 the three figures a person needs are on the screen');
const strip=sh(w);
ok(/5,000\.00/.test(strip),'4.1 the limit, with its two decimals');
ok(/1,7|1,8|\d,\d\d\d\.\d\d/.test(strip),'4.2 what this invoice adds');
ok(/تسهيل|Credit facility/.test(strip),'4.3 the strip is titled');
w.setLang&&w.setLang('ar');
ok(/تسهيل ائتماني/.test(sh(w)),'4.4 and it is titled in Arabic too — the pair is in T_b9');
ok(/5,000\.00/.test(sh(w)),'4.5 money stays left-to-right under Arabic');
w.setLang&&w.setLang('en');

console.log('\n§5 a facility revoked in D1 closes credit here — no second record to go stale');
const revoked=JSON.parse(CLI);
revoked.clients.forEach(c=>{if(c.name==='TechLine Trading')c.facility={active:false,days:0,limit:0,cur:'USD'};});
const w2=mk(false,false);
w2.localStorage.setItem('SL_CLIENTS_V1',JSON.stringify(revoked));
w2.openInv('BSH-240705-01');
w2.setTerm('credit');
ok(w2.invByShip('BSH-240705-01').term!=='credit','5.1 the contract flag in this file no longer grants credit on its own');

console.log('\n§6 past the limit the invoice cannot be issued');
const w3=mk(true,false);
w3.openInv('BSH-240705-01');
const T3=w3.invByShip('BSH-240705-01');
w3.setTerm('credit');
T3.lines.push({name:'Freight',amt:9000,cur:'USD',note:'takes it past 5,000'});
w3.render();
const c=w3.creditCheck(T3);
ok(c.ok===false&&c.over>0,'6.1 the check reports how far past, not merely that it failed');
ok(w3.canIssue(T3)===false,'6.2 canIssue falls');
ok(/يتجاوز|past the credit limit/.test(sh(w3)),'6.3 the button says the real reason, not "total must be above zero"');
w3.askIssue();if(w3.modalOk)w3.modalOk();
ok(T3.status==='draft','6.4 and pressing through the dialog still does not issue it');
w3.issueInv();
ok(T3.status==='draft','6.5 called directly, the act refuses — the button was never the guard');

console.log('\n§7 the release is a level-3 decision, with a reason, named');
const w4=mk(true,true);
w4.setActorB9(L1.id);
w4.openInv('BSH-240705-01');
const T4=w4.invByShip('BSH-240705-01');
w4.setTerm('credit');
T4.lines.push({name:'Freight',amt:9000,cur:'USD',note:'past the limit'});
w4.render();
ok(w4.mayRelease()===false,'7.1 a level-1 person may not release');
ok(w4.releaseOverLimit(T4.ship,'the client has paid in cash on arrival before').ok===false,'7.2 …and is refused at the act, not by hiding a button');
ok(sh(w4).indexOf('askRelease()')===-1,'7.3 what he may not do, he does not see');
w4.setActorB9(L3.id);
w4.render();
ok(w4.mayRelease()===true,'7.4 a level-3 manager may');
ok(sh(w4).indexOf('askRelease()')>-1,'7.5 …and the control appears for him');
ok(w4.releaseOverLimit(T4.ship,'ok').ok===false,'7.6 a four-character reason is not a reason');
w4.askRelease();w4.setTyped('board approved this shipment against the March payment');w4.modalOk();
ok(!!T4.release,'7.7 released through the dialog');
ok(T4.release.by===L3.name,'7.8 the record names whoever actually released it — '+T4.release.by);
ok(/board approved/.test(T4.release.reason),'7.9 …and carries the reason he gave');
ok(w4.canIssue(T4)===true,'7.10 the invoice can now be issued');
ok(/Released past the limit|أُفرج/.test(sh(w4)),'7.11 and the screen keeps saying so');

console.log('\n§8 a release is for the figure it was given for');
T4.lines.push({name:'Another charge',amt:2000,cur:'USD',note:'after the release'});
w4.render();
ok(w4.releaseCovers(T4,w4.creditCheck(T4))===false,'8.1 the invoice grew — the old release does not cover the new exposure');
ok(w4.canIssue(T4)===false,'8.2 …so it cannot be issued on the strength of it');
T4.lines.pop();
w4.render();
ok(w4.canIssue(T4)===true,'8.3 back to the released figure, and it may go');

console.log('\n§9 issuing declares itself on the log');
w4.askIssue();w4.modalOk();
ok(T4.status==='issued','9.1 issued');
const evs=JSON.parse(w4.localStorage.getItem('SL_EVENTS_V1')||'[]');
const ie=evs.filter(e=>e.type==='invoice.issued');
ok(ie.length===1,'9.2 exactly one invoice.issued event — the fact is declared once');
ok(ie[0].ship===T4.ship&&ie[0].client===T4.customer,'9.3 it names the shipment and the client, so the dashboard can close the finance item');
ok(ie[0].payload.inv===T4.inv_no,'9.4 …and the invoice number');
ok(ie[0].payload.amount>0&&!!ie[0].payload.cur,'9.5 …the amount with its currency');
ok(ie[0].payload.term==='credit'&&ie[0].payload.over===true,'9.6 …and that it went out on credit past the limit');
ok(ie[0].actor===L3.name,'9.7 the event names the person, never the screen');

console.log('\n§10 the exposure is derived from what was issued, and prepaid is not exposure');
const w5=mk(true,false);
w5.localStorage.setItem('SL_EVENTS_V1',JSON.stringify([
 {id:'EV-1',at:1,type:'invoice.issued',ship:'X-1',client:'TechLine Trading',actor:'a',payload:{inv:'INV-1',term:'credit',amount:4800,cur:'USD'}},
 {id:'EV-2',at:2,type:'invoice.issued',ship:'X-2',client:'TechLine Trading',actor:'a',payload:{inv:'INV-2',term:'prepaid',amount:9000,cur:'USD'}},
 {id:'EV-3',at:3,type:'invoice.issued',ship:'X-1',client:'TechLine Trading',actor:'a',payload:{inv:'INV-1',term:'credit',amount:4800,cur:'USD'}}
]));
w5.openInv('BSH-240705-01');
const T5=w5.invByShip('BSH-240705-01');
w5.setTerm('credit');
ok(w5.creditUsed(T5,'USD')===4800,'10.1 the prepaid invoice is not exposure, and the repeated event is counted once');
ok(w5.creditCheck(T5).ok===false,'10.2 4,800 already out leaves no room for this one');
ok(/issued and unpaid|صادر وغير/.test(sh(w5)),'10.3 the screen shows what is already out');

console.log('\n§11 no rate table, so another currency is reported and never converted');
const w6=mk(true,false);
w6.openInv('BSH-240705-01');
const T6=w6.invByShip('BSH-240705-01');
w6.setTerm('credit');
const cc=w6.creditCheck(T6);
ok(cc.other.indexOf('SYP')>-1,'11.1 the SYP line is reported as unmeasured');
ok(cc.amt===w6.totals(T6).USD,'11.2 …and the USD figure is exactly the USD total, with nothing converted into it');
ok(/rate table|جدول صرف/.test(sh(w6)),'11.3 the screen says why');

console.log('\n§12 with the register unreachable the module still works, and says the check is unavailable');
const w7=mk(false,false);
w7.openInv('BSH-240705-01');
const T7=w7.invByShip('BSH-240705-01');
w7.setTerm('credit');
ok(T7.term==='credit','12.1 alone, the file falls back to the record it holds');
ok(w7.creditCheck(T7).ok===true,'12.2 …and does not refuse a figure it has no limit to measure');
ok(/not published here|غير منشور/.test(sh(w7)),'12.3 …but it does not pretend either');
w7.askIssue();w7.modalOk();
ok(T7.status==='issued','12.4 the invoice can still be issued — a prototype that refuses everything is broken, not careful');

console.log('\n§13 B9 creates a client without erasing what it does not own');
const w8=mk(true,false);
const before=JSON.parse(w8.localStorage.getItem('SL_CLIENTS_V1')).clients.filter(c=>c.name==='TechLine Trading')[0];
ok(before.facility.active===true,'13.1 the facility is on the channel to begin with');
w8.clientsSeed&&w8.clientsSeed();
const r=w8.addClient({name:'Nour Textiles',phone:'+963 944 000 111',kind:'business',company:'Nour Textiles LLC'});
ok(r.ok===true,'13.2 the client is created');
const after=JSON.parse(w8.localStorage.getItem('SL_CLIENTS_V1')).clients;
const t2=after.filter(c=>c.name==='TechLine Trading')[0];
ok(!!t2&&t2.facility&&t2.facility.active===true,'13.3 …and TechLine still carries its facility — republishing does not wipe the owner\'s fields');
ok(after.filter(c=>c.name==='Nour Textiles').length===1,'13.4 the new client reached the channel');
ok(after.filter(c=>c.name==='Layla Al-Rifai').length===1,'13.5 …and nobody the module did not create was dropped');
const w9=boot('ShopyLink_Action_09_Billing.html');
w9.localStorage.setItem('SL_CLIENTS_V1',JSON.stringify({at:1,clients:after}));
w9.render();
ok(w9.facilityOf(w9.invByShip('BSH-240705-01')).limit===5000,'13.6 …so the credit check still reads 5,000 afterwards');

console.log('\n§14 one rule about the company\'s money, in one place');
const d14=boot('ShopyLink_D1_Control.html');
const pol=JSON.parse(d14.localStorage.getItem('SL_CLIENTS_V1')).policy;
ok(!!pol&&pol.releaseLevel===3,'14.1 the threshold travels with the client records, owned by whoever owns credit');
const src9=fs.readFileSync('ShopyLink_Action_09_Billing.html','utf8');
ok(/releaseLevel\(\)/.test(src9),'14.2 billing asks for it rather than holding a 3 of its own');
ok(!/level\)>=3/.test(src9),'14.3 …and no longer compares against a number typed into this file');
const srcD=fs.readFileSync('ShopyLink_D1_Control.html','utf8');
ok(/function isSenior/.test(srcD),'14.4 the control board has ONE test for a decision of this weight');
ok(!/\)!=='manager'\)return \{ok:false/.test(srcD),'14.5 …and no act is judged by whether somebody is CALLED a manager: a word this file interpreted, billing did not, and which says nothing about a company arranged by department AND level');
ok((srcD.match(/isSenior\(/g)||[]).length>=6,'14.6 it stands in every place the word used to — granting a facility, revoking one, overriding a trip, reassigning, releasing');
const w14=mk('ShopyLink_Action_09_Billing.html');
w14.localStorage.setItem('SL_CLIENTS_V1',JSON.stringify({at:1,clients:[],policy:{releaseLevel:2}}));
ok(w14.releaseLevel()===2,'14.7 lower the rule at the owner and billing follows in the same breath');
const bare14=mk('ShopyLink_Action_09_Billing.html');
ok(bare14.releaseLevel()===3,'14.8 with nothing published it falls back to the owner\'s current rule rather than to no rule at all');

console.log('\n§15 one book of invoices, derived from the log');
const d15=boot('ShopyLink_D1_Control.html');
ok(typeof d15.invoiceLedger==='function','15.1 the control board derives the ledger rather than keeping one');
ok(/INVOICES_SEED/.test(fs.readFileSync('ShopyLink_D1_Control.html','utf8')),'15.2 …its own rows survive as a named seed for an empty log');
d15.slEmit('invoice.issued',{ship:'S1',client:'TechLine Trading',actor:'Rana',payload:{inv:'INV-9',term:'credit',days:30,amount:1240,cur:'USD'}});
const led=d15.invoiceLedger();
ok(led.length===1&&led[0].id==='INV-9','15.3 an invoice ISSUED by billing appears here — the two books shared not one reference between them');
ok(led[0].amount===1240&&led[0].cur==='USD','15.4 with the amount and the currency billing declared');
ok(led[0].dueAt>led[0].at,'15.5 …and a due date derived from the terms, not typed twice');
d15.slEmit('invoice.paid',{ship:'S1',client:'TechLine Trading',actor:'Rana',payload:{inv:'INV-9',amount:400,cur:'USD',rcpt:'R-1'}});
ok(d15.invoiceLedger()[0].paid===400,'15.6 a payment against it is counted');
ok(d15.outstanding('CL-001')===840,'15.7 …and the client owes the difference: 1,240 issued less 400 paid');
ok(d15.overdueAmount('CL-001',Date.now()+40*86400000)===840,'15.8 …overdue once the term has run');
ok(d15.outstanding('CL-001')===d15.invoiceLedger().reduce((t,v)=>t+(v.amount-v.paid),0),'15.9 the board and the ledger cannot disagree, because there is one of them');
ok(led[0].client==='CL-001'&&led[0].clientName==='TechLine Trading','15.10 the client is resolved to an id AT THE SOURCE — the log names him, the credit board asks by id, and matching on the name alone gave 840 for one question and 0 for the same question asked the other way');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
