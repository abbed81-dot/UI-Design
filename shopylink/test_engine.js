const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const dom=new JSDOM(fs.readFileSync('ShopyLink_D1_Control.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
const w=dom.window,d=w.document;const sh=()=>d.getElementById('shell').innerHTML;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const H=w.HOUR, D=w.DAY;

console.log('§1 the three fields');
const noOwner=w.all().filter(x=>!x.owner)[0];
ok(!!noOwner&&w.unassigned().indexOf(noOwner)>-1,'1.1 an item with no owner sits in the Unassigned tray');
ok(w.queueFor('finance').indexOf(noOwner)===-1,'1.1b …and in nobody\'s role queue');
ok(w.unassigned().length>0,'1.2 the tray being non-empty is itself the alert');
const noDue=w.all().filter(x=>x.owner&&!x.due)[0];
ok(!!noDue&&w.isBroken(noDue)&&w.missing(noDue).indexOf('no due date')>-1,'1.3 no due date → broken, not "no rush"');
const probe=w.mk({ref:'T-1',title:'probe',kind:'document',owner:'U-01',role:'docs',next:'',due:w.NOW()+D});
ok(w.isBroken(probe)&&w.missing(probe).indexOf('no next action')>-1,'1.4 no next action → broken even when owned and dated');
const before=w.unassigned().length;
w.assign(noOwner.id,'U-04');
ok(w.unassigned().length===before-1&&w.queueFor('finance').indexOf(noOwner)>-1,'1.5 assigning clears the tray and fills the owner queue in the same tick');
ok(noOwner.due!==null,'1.5b …and a due date is set from the allowance so it cannot stay broken');

console.log('§2 ageing');
const it=w.mk({ref:'T-2',title:'age probe',kind:'document',owner:'U-01',role:'docs',next:'do',due:w.NOW()+10*H,allow:10*H});
ok(w.tone(it,w.NOW()+5*H)==='green','2.1 green under 70%');
ok(w.tone(it,w.NOW()+7*H)==='amber','2.2 amber exactly at 70% (inclusive)');
ok(w.tone(it,w.NOW()+11*H)==='red','2.3 red past the due date');
const hard=w.mk({ref:'T-3',title:'cutoff probe',kind:'document',owner:'U-01',role:'docs',next:'do',due:w.NOW()+10*H,allow:10*H,hardCutoff:w.NOW()+2*H});
ok(w.tone(hard,w.NOW()+3*H)==='black','2.4 black once a hard cutoff is passed');
ok(w.tone(hard,w.NOW()+30*H)==='black','2.4b black outranks red');
const t0=it.due;
w.CLOCK+=3*H; w.touch(it.id);
ok(w.ageMs(it)===0&&it.due===t0,'2.5 touching resets the age, never the due date');
w.CLOCK=0;
ok(w.tone(it,w.NOW()+5*H)==='green'&&w.tone(it,w.NOW()+11*H)==='red','2.6 every calculation takes an injected now');

console.log('§3 stalled');
const st=w.mk({ref:'T-4',title:'stall probe',kind:'document',owner:'U-01',role:'docs',next:'do',due:w.NOW()+5*D,allow:5*D});
ok(w.stalled().indexOf(st)===-1,'3.0 fresh item is not stalled');
w.CLOCK+=24*H;
ok(w.stalled().indexOf(st)>-1,'3.1 no update for 24h → stalled automatically');
ok(!!w.personName(st.owner)&&w.personName(st.owner)!=='—','3.2 the stalled entry names its owner');
w.touch(st.id);
ok(w.stalled().indexOf(st)===-1,'3.3 a touch clears it');
w.CLOCK=0;

console.log('§4 escalation ladder');
const es=w.mk({ref:'T-5',title:'ladder probe',kind:'document',owner:'U-01',role:'docs',next:'do',due:w.NOW()+H,allow:H});
w.CLOCK=25*H; w.sweep();
ok(w.escalation(es)===1,'4.1 overdue 1 day → L1');
w.CLOCK=49*H; w.sweep();
ok(w.escalation(es)===2,'4.2 overdue 2 days → L2');
w.CLOCK=73*H; w.sweep();
ok(w.escalation(es)===3&&w.critical().indexOf(es)>-1,'4.3 overdue 3 days → L3 on the manager panel');
ok(w.dismiss(es.id)===false,'4.4 an L3 item cannot be dismissed');
/* an item that has escalated to L3 is moved by a manager — and somebody must be
   signed in to be answerable for moving it at all */
w.setActor('U-00');
ok(w.reassign(es.id,'U-02','')===false,'4.5 reassigning at L3 without a reason is refused');
ok(w.reassign(es.id,'U-02','the owner is on leave')===true&&es.owner==='U-02','4.5b …with a reason it succeeds');
const lines=w.historyOf(es.id).map(a=>a.what).join('|');
ok(/L1/.test(lines)&&/L2/.test(lines)&&/L3/.test(lines),'4.6 the ladder recorded 1, 2 and 3 even though the clock jumped');
const es2=w.mk({ref:'T-6',title:'jump probe',kind:'document',owner:'U-01',role:'docs',next:'do',due:w.NOW()-3*D,allow:H});
w.sweep();
const l2=w.historyOf(es2.id).map(a=>a.what).join('|');
ok(/L1/.test(l2)&&/L2/.test(l2)&&/L3/.test(l2),'4.6b a 3-day jump in one move still logs every rung');
w.resolve(es.id);
ok(es.status==='resolved'&&w.critical().indexOf(es)===-1&&w.all().indexOf(es)>-1,'4.7 resolving leaves every live queue but stays in history');
w.CLOCK=0;

console.log('§5 handover');
const ho=w.mk({ref:'T-7',title:'handover probe',kind:'measure',owner:'U-02',role:'ops',next:'measure it',due:w.NOW()+2*D,allow:2*D});
const bad=w.handover(ho.id,'finance');
ok(bad.ok===false&&/cannot perform/.test(bad.why),'5.5 a handover to a role that cannot do the next action is refused, with a reason');
ok(w.handover(ho.id,'wh').ok===true&&w.pendingAck(ho.id),'5.1 handing over creates an unacknowledged handover');
ok(ho.owner==='U-02'&&ho.role==='ops','5.2 the item still belongs to the sender until acknowledged');
w.CLOCK+=4*H;
ok(w.staleHandovers().indexOf(ho)>-1,'5.3 unacknowledged for 4h → flagged');
ok(w.myUnacked('ops').indexOf(ho)>-1&&w.myUnacked('wh').indexOf(ho)>-1,'5.3b …on both the sender\'s and the receiver\'s strip');
w.ack(ho.id);
ok(ho.owner==='U-03'&&ho.role==='wh'&&w.ageMs(ho)===0&&!w.pendingAck(ho.id),'5.4 acknowledging transfers ownership and resets the clock');
w.CLOCK=0;

console.log('§6 cancellation');
ok(typeof w.deleteItem==='undefined','6.1 there is no delete API at all');
const cz=w.mk({ref:'T-8',title:'cancel probe',kind:'document',owner:'U-01',role:'docs',next:'do',due:w.NOW()+D,allow:D});
ok(w.cancel(cz.id,'','manager')===false,'6.2 cancelling with no reason is refused');
ok(w.cancel(cz.id,'client withdrew the booking','docs')===false,'6.4 a non-manager cannot cancel');
w.setActor('U-00');
ok(w.cancel(cz.id,'client withdrew the booking','manager')===true,'6.2b the manager with a reason succeeds');
ok(w.cancelled().indexOf(cz)>-1&&cz.by&&cz.at,'6.3 it stays reviewable with who and when');

console.log('§7 role visibility');
ok(w.queueFor('wh').every(x=>x.role==='wh'||(x.ho&&x.ho.to==='wh')),'7.1 a role sees only what it holds');
ok(w.queueFor('manager').length===w.openItems().length,'7.2 the manager sees everything');
ok(w.queueFor('wh').indexOf(w.all().filter(x=>x.role==='finance'&&x.status==='open')[0])===-1,'7.3 excluded items are absent from the array, not merely unrendered');
w.setActor('U-01');w.go('s1');
ok(/my overdue|متأخراتي/.test(sh())&&/due today|مستحق/.test(sh())&&/unacknowledged|تسليمات/.test(sh()),'7.4 every role opens with the same three-cell strip');
const stm=w.roleStatement('docs');
ok(stm&&stm.en.length>40&&stm.ar.length>20,'7.5 each role carries a written responsibility statement, EN and AR');
ok(new RegExp(stm.en.slice(0,40)).test(sh()),'7.5b …and it is visible on the dashboard');

console.log('§8 standing rules');
const warm=['Nothing waiting on you','Unassigned — needs owner','cannot be dismissed at L3 — resolve or reassign with a reason','Ownership stays with you until they acknowledge.','the whole engine reads this clock — tests move it, they never wait'];
ok(warm.filter(s=>!w.T_w[s]).length===0,'8.1 every warm string has an Arabic twin');
ok(/class="machine"/.test(sh()),'8.2 machine values are LTR-isolated');
w.setLang('ar');
ok(d.documentElement.dir==='rtl'&&/متأخراتي/.test(sh()),'8.1b AR renders');
w.setLang('en');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
