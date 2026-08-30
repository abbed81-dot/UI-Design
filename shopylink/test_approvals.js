// C12 exists to be the check on everything else, so it must not invent the
// authority it checks against. The level comes from C9, derived there from the
// grants a person actually holds.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const c9=new JSDOM(fs.readFileSync('ShopyLink_Action_C9_Staff.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const REG=c9.localStorage.getItem('SL_STAFF_V1');
const staff=JSON.parse(REG).staff;
const mk=()=>{const w=new JSDOM(fs.readFileSync('ShopyLink_Action_C12_Approvals.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
  w.localStorage.setItem('SL_STAFF_V1',REG);return w;};
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const clerk=staff.filter(p=>p.role==='wh')[0];
const support=staff.filter(p=>p.role==='support')[0];
const admin=staff.filter(p=>p.role==='admin')[0];

console.log('§1 C9 derives the level from the grants held');
ok(staff.every(p=>p.level>=1&&p.level<=3),'every person carries a level between 1 and 3');
ok(admin.level===3,'the admin is 3 — sets the rules');
ok(clerk.level===2,'a warehouse clerk is 2 — approves and fixes');
ok(support.level===1,'a support agent is 1 — does the work');
ok(staff.filter(p=>p.role==='driver')[0].level===1,'…and so is a driver');
ok(new Set(staff.map(p=>p.level)).size===3,'all three levels are genuinely in use');

console.log('§2 C12 reads that level rather than guessing it');
let w=mk();
ok(w.ME.level===1,'nobody signed in → the lowest level, not a default of 2');
w.setActor(clerk.id);
ok(w.ME.level===clerk.level,clerk.name+' comes through at '+w.ME.level+' — from the registry');
w.setActor(support.id);
ok(w.ME.level===1,'a support agent stays at 1, where guessing from the role gave 2');

console.log('§3 the level actually gates a decision');
w.setActor(admin.id);
const pend=w.allReqs().filter(r=>r.status==='pending');
const need3=pend.filter(r=>w.reqLevel(r)===3)[0];
const need2=pend.filter(r=>w.reqLevel(r)===2)[0];
ok(pend.length>0,pend.length+' requests are waiting');
if(need3){
  w.setActor(clerk.id);
  ok(!w.canDecide(need3),'a level-2 clerk cannot decide what needs 3');
  w.setActor(admin.id);
  ok(w.canDecide(need3),'…and the admin can');
}
if(need2){
  w.setActor(support.id);
  ok(!w.canDecide(need2),'a level-1 agent cannot decide what needs 2');
  w.setActor(clerk.id);
  ok(w.canDecide(need2),'…and the clerk can');
}

console.log('§4 changing what an approval REQUIRES is a rule change');
w.setActor(clerk.id);
ok(w.actorMay3()===false,'a level-2 clerk may not change the level a request needs');
w.setActor(admin.id);
ok(w.actorMay3()===true,'…only level 3 may — that is setting the rules, not applying them');

console.log('§5 signing out signs out');
w.setActor(admin.id);
ok(w.ME.level===3,'signed in at 3');
w.setActor(null);
ok(w.ME.level===1&&!w.ME.id,'signing out drops to 1 and holds no id — it used to keep the admin');
ok(/unattributed/.test(w.ME.name),'…and names nobody');
w.setActor('U-does-not-exist');
ok(w.ME.level===1,'an unknown id is nobody, not whoever was there before');
ok(w.allReqs().filter(r=>r.status==='pending'&&w.reqLevel(r)>1).every(r=>!w.canDecide(r)),
   '…and nothing above level 1 can be decided by nobody');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
