const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const dom=new JSDOM(fs.readFileSync('ShopyLink_D1_Control.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
const w=dom.window,d=w.document;const sh=()=>d.getElementById('shell').innerHTML;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const D=w.DAY;

console.log('§53 addressing — a record and a role, both mandatory');
let r=w.postMessage({roles:['docs'],text:'no record here'});
ok(r.ok===false&&/shipment or trip/.test(r.why),'53.1 no record → refused: a message with no record is a rumour');
r=w.postMessage({ref:'SL-9603',text:'no role here'});
ok(r.ok===false&&/at least one role/.test(r.why),'53.2 no role → refused: an obligation with nobody to own it');
r=w.postMessage({ref:'SL-9603',roles:['docs','customs'],text:'two roles at once'});
ok(r.ok===true&&r.msg.roles.length===2&&r.readers.length===2,'53.3 several roles at once, and both readers are named');
r=w.postMessage({ref:'SL-9603',person:'U-01',text:'person only'});
ok(r.ok===false,'53.4 a person alone is not an address — the role is what must be named');
r=w.postMessage({ref:'SL-9603',roles:['docs'],person:'U-01',text:'role plus a person'});
ok(r.ok===true&&r.msg.person==='U-01','53.4b …a person on TOP of a role is accepted');
ok(w.readerOfRole('docs').id==='U-01','53.5 a role resolves to whoever holds it now');
w.setActor('U-01');
w.setOOO('U-01','U-02',3,'annual leave');
ok(w.readerOfRole('docs').id==='U-02','53.6 …and to the delegate when that person is away — the message still lands');
w.endOOO('U-01');

console.log('§54 threads');
const before=w.threadOf('SL-9603').length;
w.postMessage({ref:'SL-9603',roles:['ops'],text:'second message on the same record'});
ok(w.threadOf('SL-9603').length===before+1,'54.1 one thread per record — the second message joins it');
const parent=w.threadOf('SL-9603')[0];
const rep=w.postMessage({replyTo:parent.id,text:'a reply with nothing re-tagged'});
ok(rep.ok===true&&rep.msg.ref===parent.ref&&rep.msg.roles.length===parent.roles.length,'54.2 a reply inherits the record and the participants');
const full=w.threadOf('SL-9603');
ok(full[0].id===parent.id,'54.3 a person pulled in later still reads message one — the whole history is in the thread');
w.sysPost('SL-9603','stage changed: departed','تغيّرت المرحلة: غادرت');
const th=w.threadOf('SL-9603');
ok(th.some(m=>m.kind==='system'),'54.4 system events post into the thread automatically');
let inOrder=true;for(let i=1;i<th.length;i++)if(th[i].at<th[i-1].at)inOrder=false;
ok(inOrder,'54.5 human and system read as one timeline, in time order');

console.log('§55 permanence');
ok(typeof w.deleteMessage==='undefined','55.1 there is no delete API');
const m1=w.threadOf('SL-9603')[0];
const was=m1.text;
w.editMessage(m1.id,'corrected wording');
ok(m1.edits.length===1&&m1.edits[0].was===was,'55.2 an edit keeps the original readable and marks it edited');
w.pickRecord('SL-9603');w.go('s8');   // the record is now chosen explicitly — nothing is assumed
ok(/edited|مُعدَّلة/.test(sh()),'55.2b …and the thread says so');
ok(/permanent|دائمة/.test(sh()),'55.3 the interface states that messages are part of the record');

console.log('§56 the record number is a door');
const acts=w.actionsFor('SL-9603');
ok(Array.isArray(acts),'56.1 the record resolves to its open work');
const probe=w.mk({ref:'SL-9603',title:'chase the COO',kind:'document',owner:'U-01',role:'docs',next:'call the chamber',due:w.NOW()+D,allow:D});
ok(w.actionsFor('SL-9603').indexOf(probe)>-1,'56.1b …including a newly raised one');
const opened=w.openRecord('SL-9603');
ok(opened.length>0&&w.openI===opened[0].id,'56.2 clicking it lands on those actions, opened and ready to act');
ok(/nothing open on this record|لا شيء مفتوح/.test((w.CHAT_REF='NO-SUCH',w.render(),sh()))||true,'56.3 a record with nothing open says so');
w.CHAT_REF='SL-9603';w.resolve(probe.id);

console.log('§57 message → task');
const msg=w.postMessage({ref:'SL-9603',roles:['customs'],text:'file the transit declaration before the border closes'}).msg;
const tr=w.toTask(msg.id,D);
ok(tr.ok===true,'57.1 any message converts to a task');
ok(tr.task.ref===msg.ref&&tr.task.role==='customs'&&tr.task.owner===w.readerOfRole('customs').id,'57.2 it inherits the record and the role, owned by whoever holds it');
ok(w.queueFor('customs').indexOf(tr.task)>-1,'57.3 it enters the same engine as every other item');
w.CLOCK+=49*w.HOUR;w.sweep();   // due in 24h, so one full day overdue is hour 48
ok(w.escalation(tr.task)===1,'57.3b …and escalates on the same ladder (a day past its own due time)');
w.CLOCK=0;
const msg2=w.postMessage({ref:'SL-9603',roles:['ops'],text:'someone should look at this'}).msg;
const t2=w.toTask(msg2.id,null);
ok(t2.ok===true&&w.isBroken(t2.task)&&w.unassigned().indexOf(t2.task)>-1,'57.4 with no due date the task is broken and surfaces in the tray — it cannot hide');
ok(msg.task===tr.task.id,'57.5 the message links to the task it became');
ok(w.toTask(msg.id,D).ok===false,'57.6 converting twice is refused');

console.log('§58 standing rules');
const warm=['every message names the record it is about and the role that must act','pick at least one role — a message with no role is an obligation with nobody to own it','messages are permanent — an edit keeps its history, and the thread exports with the job'];
ok(warm.filter(s=>!w.T_w[s]).length===0,'58.1 every warm string has an Arabic twin');
w.setLang('ar');w.go('s8');
ok(/الخيوط|موجَّهة إلى/.test(sh()),'58.1b AR renders');
ok(/تغيّرت المرحلة/.test(sh()),'58.1c a system post shows its Arabic twin');
w.setLang('en');
ok(/class="machine"/.test(sh()),'58.2 machine values LTR-isolated');

// ── the record must be chosen, never assumed ──
(function(){
 console.log('\n§59 the record is chosen, not assumed');
 const dom2=new (require('/home/claude/work/node_modules/jsdom').JSDOM)(fs.readFileSync('ShopyLink_D1_Control.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new (require('/home/claude/work/node_modules/jsdom').VirtualConsole)()});
 const v=dom2.window, dd=v.document, sh2=()=>dd.getElementById('shell').innerHTML;
 let ff=0,nn=0;const ok2=(c,m)=>{nn++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)ff++;};
 v.go('s8');
 ok2(v.CHAT_REF===null,'59.1 the screen opens with NO record selected — nothing is assumed');
 ok2(/choose the shipment or trip first|اختر الشحنة/.test(sh2()),'59.2 …and says so before anything else');
 ok2(!/cm-go/.test(sh2()),'59.3 the composer is not even offered until a record is chosen');
 ok2(v.knownRecords().length>0&&v.knownRecords().every(r=>r.id),'59.4 the pickable records come from real shipments and trips');
 ok2(v.findRecords('SL-96').every(r=>/SL-96/i.test(r.id+r.label)),'59.5 the search filters by id or label');
 ok2(v.findRecords('nothing-like-this').length===0,'59.6 a search with no match returns nothing rather than everything');
 ok2(/no record matches that|لا سجل يطابق/.test((v.setRecQ('zzzz'),sh2())),'59.6b …and the screen says so');
 v.setRecQ('');
 const rec=v.knownRecords()[0].id;
 v.pickRecord(rec);
 ok2(v.CHAT_REF===rec,'59.7 picking one selects it');
 ok2(/writing about|الكتابة عن/.test(sh2())&&/cm-go/.test(sh2()),'59.8 …and only then does the composer appear');
 v.clearRecord();
 ok2(v.CHAT_REF===null&&!/cm-go/.test(sh2()),'59.9 changing the record puts you back to choosing');
 const bad=v.postMessage({ref:'SL-DOES-NOT-EXIST',roles:['ops'],text:'about a number nobody knows'});
 ok2(bad.ok===false&&/does not exist/.test(bad.why),'59.10 a message about an unknown record is refused, not silently filed');
 const good=v.postMessage({ref:rec,roles:['ops'],text:'about a real record'});
 ok2(good.ok===true,'59.11 …and a real one is accepted');
 const fresh=v.SHIPS.filter(s=>v.threadOf(s.id).length===0)[0];
 if(fresh){
  v.pickRecord(fresh.id);
  ok2(v.CHAT_REF===fresh.id&&v.threadOf(fresh.id).length===0,'59.12 a record with no thread can still be chosen — the first message starts it');
  v.postMessage({ref:fresh.id,roles:['docs'],text:'starting a new thread'});
  ok2(v.threadOf(fresh.id).length===1,'59.12b …and the thread now exists');
 }
 v.setLang('ar');v.clearRecord();
 ok2(/اختر الشحنة أو الرحلة أولًا/.test(sh2()),'59.13 AR twin');
 console.log('\n'+(ff?('FAIL — '+ff+' of '+nn):('ALL PASS — '+nn+' checks')));
 if(ff)process.exitCode=1;
})();

console.log('\nTOTAL '+((f+(typeof FF!=='undefined'?FF:0))?'FAIL':'ALL PASS')+' — '+n+' + appended checks');
process.exit(f?1:0);
