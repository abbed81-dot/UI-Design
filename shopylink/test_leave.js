// leave: a date to come back, an approval to go, a confirmation to return
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const w=new JSDOM(fs.readFileSync('ShopyLink_Action_C2_Drivers.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const d=w.document, sh=()=>d.getElementById('shell').innerHTML;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
/* an EMPLOYED driver: DRV-01 is a contractor now, and a contractor takes no
   leave — the rule this file predates. Picking him by name rather than by
   position keeps the test testing leave rather than engagement. */
const emp=w.DRIVERS.filter(function(d){return (d.engagement||'employee')==='employee';})[0];
const emps=w.DRIVERS.filter(function(d){return (d.engagement||'employee')==='employee';});
const emp2=emps[1];
const id=emp.id, id2=emp2.id;

console.log('§96 a return date is required');
ok(w.requestLeave(id,w.todayISO(),'').ok===false,'leave with no return date is refused — leave with no end is not leave');
ok(w.requestLeave(id,'2026-08-20','2026-08-19').ok===false,'a return date before the departure is refused');
ok(emp.status!=='leave','nothing happened to the driver while it was refused');

console.log('§97 the administrator decides, not the asker');
const r=w.requestLeave(id,'2026-08-19','2099-01-01');
ok(r.ok&&r.req.status==='pending','a dated request is PENDING, not granted by asking');
ok(emp.status!=='leave','…he stays on duty until someone grants it');
ok(w.decideLeave(r.req.id,true,'ops').ok===false,'an ops clerk cannot grant it');
ok(w.decideLeave(r.req.id,true,'admin').ok===true,'a system administrator can');
ok(emp.status==='leave','…and only then is he off the roster');
ok(w.decideLeave(r.req.id,true,'admin').ok===false,'a decided request cannot be decided twice');
ok(w.requestLeave(id,'2026-09-01','2099-02-02').ok===false,'and he cannot be sent away twice over');

console.log('§98 nobody is assumed back');
ok(w.leaveDue().length===0,'before the date, nothing is asked');
w.render();ok(!/Due back|مستحقّو/.test(sh()),'…the board stays quiet');
r.req.back='2020-01-01';                                  // the day comes
ok(w.leaveDue().length===1,'on the day, the return falls due');
w.render();
ok(/Due back|مستحقّو العودة/.test(sh()),'…and the board asks for a confirmation');
ok(/days late|أيام تأخير/.test(sh()),'…counting the days it is already overdue');
ok(emp.status==='leave','he is NOT put back automatically — an assumed return is a driver who may still be away');
ok(w.confirmReturn(r.req.id,'ops').ok===false,'an ops clerk cannot confirm the return either');
const res=w.confirmReturn(r.req.id,'admin');
ok(res.ok&&emp.status==='active','the administrator confirms, and only then is he assignable again');
ok(res.late===true,'…and the late return is recorded, not quietly forgotten');
w.render();ok(!/Due back|مستحقّو/.test(sh()),'the prompt clears once answered');

console.log('§99 still away — extend rather than lie');
const r2=w.requestLeave(id2,'2026-08-01','2099-03-03');
w.decideLeave(r2.req.id,true,'admin');
r2.req.back='2020-02-01';
ok(w.leaveDue().length===1,'a second return falls due');
w.render();ok(/extend|مدّد/i.test(sh()),'…and the board offers to extend instead of forcing a false confirmation');
r2.req.back='2099-05-05';
ok(w.leaveDue().length===0,'extending clears the prompt without claiming he came back');
ok(emp2.status==='leave','…and he stays on leave, correctly');

console.log('§100 the dialogs a user actually presses');
[['ShopyLink_Action_C2_Drivers.html','DRIVERS','askLeave','askConfirmReturn'],
 ['ShopyLink_Action_C9_Staff.html','USERS','askLeaveU','askConfirmReturnU']].forEach(function(cfg){
  var w2=new JSDOM(fs.readFileSync(cfg[0],'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
  var d2=w2.document, tag=cfg[0].replace('ShopyLink_Action_','').replace('.html','');
  /* whoever this file's leave applies to: an EMPLOYED driver in C2, since a
     contractor takes none, and any staff member in C9 */
  var pool=w2[cfg[1]].filter(function(x){return (x.engagement||'employee')==='employee';});
  var subj=pool[0], id2=subj.id;
  w2[cfg[2]](id2);
  ok(!!d2.querySelector('.sl-modal'),tag+': the leave dialog opens when pressed');
  var inp=d2.querySelector('.sl-modal input');
  ok(!!inp&&inp.type==='date','   …with a CALENDAR, not a box to type a date string into');
  ok(!!inp.getAttribute('min'),'   …that cannot be set before today');
  w2.setTyped('nope');w2.modalOk();   // the calendar cannot produce this, but the guard stays
  ok(!w2.leaveOf(id2),'   a bad date is refused');
  w2.modal=null;
  w2[cfg[2]](id2);w2.setTyped('2099-01-01');w2.modalOk();
  ok(w2.leaveOf(id2)&&w2.leaveOf(id2).back==='2099-01-01','   the typed date reaches the record');
  var rr=w2.leaveOf(id2); rr.back='2020-01-01'; w2.render();
  ok(/Due back|مستحقّو/.test(d2.getElementById('shell').innerHTML),'   the board asks for the return');
  w2[cfg[3]](rr.id); w2.modalOk();
  ok(subj.status==='active'&&rr.returned&&rr.late,'   confirming returns them, and the lateness is kept');
});

console.log('§101 the controls are where the person is');
var w3=new JSDOM(fs.readFileSync('ShopyLink_Action_C9_Staff.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
var d3=w3.document, sh3=function(){return d3.getElementById('shell').innerHTML;};
var u3=w3.USERS.filter(function(x){return x.status==='active'&&x.role!=='admin';})[0];
w3.go('s1');w3.toggleUserOpen(u3.id);
ok(/askLeaveU/.test(sh3()),'the staff card carries a Send-on-leave button');
w3.askLeaveU(u3.id);w3.setTyped('2099-03-03');w3.modalOk();
w3.toggleUserOpen(u3.id);w3.toggleUserOpen(u3.id);
ok(/On leave|في إجازة/.test(sh3())&&/2099-03-03/.test(sh3()),'…and once away the card shows the date they are due back');
var lv3=w3.leaveOf(u3.id); lv3.back='2020-01-01'; w3.render();
ok(/Confirm back|أكّد العودة/.test(sh3()),'on the due day the card itself offers to confirm the return');

console.log('§102 a summary chip must open');
var omar=w3.USERS.filter(function(x){return /Omar/i.test(x.name);})[0];
w3.toggleUserOpen(omar.id);
ok(/toggleAllPerms/.test(sh3()),'the "+16" permission chip is a button, not a dead label');
var c0=(sh3().match(/background:#DCF5E9/g)||[]).length;
w3.toggleAllPerms(omar.id);
ok((sh3().match(/background:#DCF5E9/g)||[]).length>c0,'pressing it shows every permission, not a count of hidden ones');
ok(/show fewer|أظهر أقل/.test(sh3()),'…and folds back');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
