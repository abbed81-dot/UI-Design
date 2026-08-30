// department × level: permissions follow from the pair, not from 24 ticks per person
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const w=new JSDOM(fs.readFileSync('ShopyLink_Action_C9_Staff.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const d=w.document, sh=()=>d.getElementById('shell').innerHTML;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§103 the model');
ok(w.DEPTS.length===5,'five departments, matching the five families of work already in the build');
ok(w.LEVELS.length===3,'three levels: does the work · approves and fixes · sets the rules');
ok(w.fnsOfDept('money').length===9,'a department owns a known set of functions');

console.log('§104 the level actually divides the work');
const m1=w.permsFor('money',1), m2=w.permsFor('money',2), m3=w.permsFor('money',3);
ok(m1.b9_build&&!m1.b9_issue,'L1 in Billing builds an invoice but cannot ISSUE it');
ok(m2.b9_issue&&!m2.pr_base,'L2 issues invoices but cannot set the price list');
ok(m3.pr_base&&m3.pr_hs,'L3 sets prices and customs tables');
ok(Object.keys(m1).length<Object.keys(m2).length&&Object.keys(m2).length<Object.keys(m3).length,
   'each level is strictly larger than the one below ('+Object.keys(m1).length+' < '+Object.keys(m2).length+' < '+Object.keys(m3).length+')');
const d1=w.permsFor('dest',1), d2p=w.permsFor('dest',2);
ok(d1.b7_assign&&!d1.b7_reassign,'in the destination hub, L1 assigns a run but cannot reassign or cancel one');
ok(d2p.b6_exc,'…and L2 handles the damaged-and-missing exceptions');

console.log('§105 one setting, not twenty-four ticks');
const u=w.USERS.filter(x=>x.role!=='admin')[0];
const r=w.setDeptLevel(u.id,'money',2,'admin');
ok(r.ok,'a department and level are set in one action');
ok(Object.keys(w.effectivePerms(u)).length>=4,'…and the person holds '+Object.keys(w.effectivePerms(u)).length+' permissions with nothing ticked by hand');
ok(w.setDeptLevel(u.id,'money',2,'ops').ok===false,'only a system administrator may set it');
ok(w.setDeptLevel(u.id,'nonsense',2,'admin').ok===false,'an unknown department is refused');
ok(w.setDeptLevel(u.id,'money',9,'admin').ok===false,'an unknown level is refused');

console.log('§106 every permission says where it came from');
w.setDeptLevel(u.id,'money',3,'admin');
ok(w.permSource(u,'pr_base')==='dept','from the department');
u.overrides={pr_base:{on:false,why:'pricing freeze'}};
ok(w.permSource(u,'pr_base')==='override'&&!w.effectivePerms(u).pr_base,'an override wins, is named, and actually removes it');
u.overrides={};
ok(w.permSource(u,'nothing_like_this')===null,'a permission nobody granted reports no source, rather than guessing');

console.log('§107 the dialog');
w.go('s1');w.openDept(u.id);
ok(!!d.querySelector('.sl-modal select'),'the department is chosen from a dropdown');
ok(/L1|L2|L3/.test(d.querySelector('.sl-modal').textContent),'the three levels are on offer');
w.setPendDept('dest');w.setPendLvl(1);
const a=d.querySelector('.sl-modal').textContent;
w.setPendLvl(2);
ok(a!==d.querySelector('.sl-modal').textContent,'the dialog states what the pair grants, and it changes with the level');
w.modalOk();
ok(u.dept==='dest'&&u.level===2,'applying moves them to Destination hub L2');
w.toggleUserOpen(u.id);
ok(/L2/.test(sh()),'…and the card shows the pair');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
