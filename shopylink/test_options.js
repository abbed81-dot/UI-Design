// C7: a choice is made from a dropdown when the set grows; chips stay where the set
// is small or fixed. The point is never the control — it is whether the reader can
// still see and reach every option once the business has been running a year.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§134 D1 — addressing a message to a hub');
const d1=mk('ShopyLink_D1_Control.html');
const src1=fs.readFileSync('ShopyLink_D1_Control.html','utf8');
ok(!/HUBS\.map\(function\(hb\)\{var on=cm\.hub/.test(src1),'the chip row is gone');
ok(/slPicker\('cm-hub'/.test(src1),'one hub is chosen from a dropdown — hubs grow with the business');
const sh1=()=>d1.document.getElementById('shell').innerHTML;
d1.go('s8');const b1=sh1().length;
for(let i=1;i<=60;i++)d1.HUBS.push({id:'H'+i,en:'Hub '+i,ar:'مركز '+i,country:'SY'});
d1.render();
ok(sh1().length/b1<1.4,'at '+d1.HUBS.length+' hubs the page holds (x'+(sh1().length/b1).toFixed(2)+')');

console.log('§135 D1 — what must NOT become a dropdown');
ok(d1.QC_KINDS.length===5,'QC_KINDS is a fixed vocabulary of '+d1.QC_KINDS.length);
ok(/QC_KINDS\.map/.test(src1),'…and stays as chips: hiding one of five behind a click costs a click and gains nothing');

console.log('§136 C8 — services are a multi-select, and it scales');
const c8=mk('ShopyLink_Action_C8_Agents.html');
const sh8=()=>c8.document.getElementById('shell').innerHTML;
c8.startCreate();
const b8=sh8().length;
ok((sh8().match(/toggleNaSvc/g)||[]).length===c8.SERVICES.length,c8.SERVICES.length+' services → every one shown as a chip');
ok(!/add a service|أضف خدمة/.test(sh8()),'…and no dropdown at this size, because chips show them all at a glance');
for(let i=1;i<=40;i++)c8.SERVICES.push('Service '+i);
c8.render();
ok(/add a service|أضف خدمة/.test(sh8()),'above the threshold it becomes a picker');
ok((sh8().match(/<option/g)||[]).length>40,'…offering every service');
ok(sh8().length/b8<1.15,'…and the page holds (x'+(sh8().length/b8).toFixed(2)+', was x1.42)');
c8.toggleNaSvc('Service 3');
ok(/Service 3/.test(sh8()),'a chosen service is shown visibly — a multi-select must never be invisible (C7b)');
c8.toggleNaSvc('Service 3');
ok(/none chosen yet|لم تُختَر/.test(sh8()),'…and removing it says so plainly');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
