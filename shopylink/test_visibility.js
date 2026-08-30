// What you may not do, you do not see. Tested through the guard itself, because a
// control that is absent for want of seeded data proves nothing about permissions.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const c9=mk('ShopyLink_Action_C9_Staff.html');
const REG=c9.localStorage.getItem('SL_STAFF_V1');
const staff=JSON.parse(REG).staff;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const load=x=>{const w=mk(x);w.localStorage.setItem('SL_STAFF_V1',REG);return w;};

console.log('§115 billing — issuing an invoice');
const holder=staff.filter(p=>p.perms.indexOf('b9_issue')>-1)[0];
const wh=staff.filter(p=>p.role==='wh')[0];
let w=load('ShopyLink_Action_09_Billing.html');
ok(w.ifMay('b9_issue','X')==='X','with no actor set the control is rendered — unknown is not refusal');
w=load('ShopyLink_Action_09_Billing.html'); w.setActorB9(wh.id);
ok(w.ifMay('b9_issue','X')==='','a warehouse clerk does not see it at all — not greyed out, absent');
ok(w.actorMay('b9_issue')===false,'…and the grant says false, not unknown');
w=load('ShopyLink_Action_09_Billing.html'); w.setActorB9(holder.id);
ok(w.ifMay('b9_issue','X')==='X','whoever holds the grant sees it — '+holder.name);
// and the act refuses even if the markup were reached another way
w=load('ShopyLink_Action_09_Billing.html'); w.setActorB9(wh.id);
const inv=w.INVOICES.filter(x=>x.status==='draft')[0];
w.openInv(inv.ship); w.issueInv();
ok(inv.status==='draft','hiding is not the whole guard — calling issueInv() directly is still refused');

console.log('§116 dispatcher — reassigning an accepted run');
const dispatchers=staff.filter(p=>p.perms.indexOf('b7_reassign')>-1);
const driver=staff.filter(p=>p.role==='driver')[0];
ok(dispatchers.length>0,'someone holds b7_reassign ('+dispatchers.map(p=>p.role).join(', ')+')');
w=load('ShopyLink_Action_07_Dispatcher.html'); w.setActor(driver.id);
ok(w.ifMayD('b7_reassign','X')==='','a driver cannot see Reassign');
w=load('ShopyLink_Action_07_Dispatcher.html'); w.setActor(dispatchers[0].id);
ok(w.ifMayD('b7_reassign','X')==='X','a dispatcher can');
w=load('ShopyLink_Action_07_Dispatcher.html');
ok(w.ifMayD('b7_reassign','X')==='X','no registry → shown');

console.log('§117 every role, every module');
['ShopyLink_Action_09_Billing.html','ShopyLink_Action_07_Dispatcher.html'].forEach(file=>{
  const perm=file.indexOf('Billing')>-1?'b9_issue':'b7_reassign';
  const fn=file.indexOf('Billing')>-1?'ifMay':'ifMayD';
  const setter=file.indexOf('Billing')>-1?'setActorB9':'setActor';
  let wrong=0;
  staff.forEach(p=>{
    const ww=load(file); ww[setter](p.id);
    const visible=ww[fn](perm,'X')==='X';
    const granted=p.perms.indexOf(perm)>-1;
    if(visible!==granted)wrong++;
  });
  ok(wrong===0,file.replace('ShopyLink_Action_','')+': all '+staff.length+' people see exactly what they are granted');
});
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
