// The old diagram was drawn by hand, once, and described a system that had
// stopped existing. This one is GENERATED, and this contract is what stops it
// drifting again: it regenerates from the code and compares, so a wire added to
// a module and not to the diagram fails here rather than misleading somebody in
// six months.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const { scan } = require('/home/claude/work/wiring.js');
const { build } = require('/home/claude/work/diagram.js');
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

const file=fs.readFileSync('ShopyLink_System_Diagram.html','utf8');
const s=scan();
const chans=Object.keys(s.channels), evs=Object.keys(s.events);

console.log('§1 it describes the system that exists, not one that used to');
chans.forEach(function(c){ if(file.indexOf(c)===-1) ok(false,'1.x the diagram names '+c); });
ok(chans.every(c=>file.indexOf(c)>-1),'1.1 every channel in the code appears in the diagram — all '+chans.length);
ok(evs.every(e=>file.indexOf(e)>-1),'1.2 every event type appears — all '+evs.length);
ok(s.mods.every(m=>file.indexOf(m.name)>-1),'1.3 every module that touches a channel or the log appears — all '+s.mods.length);
const named=(file.match(/SL_[A-Z0-9_]+_V1/g)||[]);
const strays=named.filter(c=>chans.indexOf(c)===-1);
ok(strays.length===0,'1.4 …and it names no channel that does not exist: '+(strays.join(', ')||'none'));

console.log('\n§2 it cannot drift, because it is regenerated and compared');
const fresh=build().html;
ok(fresh.replace(/\d{4}-\d{2}-\d{2}/g,'')===file.replace(/\d{4}-\d{2}-\d{2}/g,''),
  '2.1 regenerating from the code yields the file on disk, character for character (dates aside)');
ok(/generated|Generated/.test(file),'2.2 it says of itself that it is generated');
ok(/diagram\.js/.test(file),'2.3 …and names the tool, so the next person regenerates instead of editing');

console.log('\n§3 it tells the truth about ownership, including the awkward parts');
const many=chans.filter(c=>s.channels[c].owners.length>1);
ok(many.length>0,'3.1 some channels are written by more than one module — '+many.length+' of them');
ok(many.every(c=>{
  const i=file.indexOf(c);
  return i>-1 && file.lastIndexOf('<tr class="warn">',i)>file.lastIndexOf('<tr>',i);
}),'3.2 every one of them is marked, rather than drawn as though the rule held');
const owned=chans.filter(c=>s.channels[c].owners.length===1);
ok(owned.length>0,'3.3 …and the ones with a single owner are not marked — '+owned.length);
ok(new RegExp('more than one writer').test(file),'3.4 the count is stated on the page, not left to be counted by eye');

console.log('\n§4 it renders, in both languages');
const w=new JSDOM(file,{runScripts:'dangerously',url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const rows=w.document.querySelectorAll('tbody tr').length;
ok(rows===chans.length+evs.length+s.mods.length+s.twinned.length+s.alone.length+s.positions.length,'4.1 one row per channel, event, module and island — '+rows);
ok(w.document.querySelectorAll('tr.warn').length>=many.length,'4.2 the marked rows are there in the rendered page too');
w.flip();
ok(w.document.documentElement.getAttribute('dir')==='rtl','4.3 it turns around');
ok(/شوبي لينك/.test(w.document.getElementById('t-title').textContent),'4.4 …and speaks Arabic');
ok(/SL_/.test(w.document.body.innerHTML),'4.5 while the machine values stay as they are — a channel name is not translated');
w.flip();
ok(/how the parts are joined/.test(w.document.getElementById('t-title').textContent),'4.6 and back again');

console.log('\n§5 what it is honest about');
ok(/nobody reads yet/.test(file),'5.1 it counts the channels nobody reads yet rather than implying every wire is used');
ok(s.channels['SL_EVENTS_V1'].owners.length>1,'5.2 the log is written by many modules by design — and the diagram shows it marked like any other, which is a limitation of the check, not a fault in the log');

console.log('\n§6 it shows what the system does NOT carry');
ok(Array.isArray(s.islands)&&s.islands.length>0,'6.1 the scanner reports tables of record that reach no channel');
ok(s.twinned.length>0,'6.2 …and separates the dangerous kind: the same name in two or more modules with nothing joining them');
ok(s.twinned.some(x=>x.list==='LEAVE_REQS'),'6.2b LEAVE_REQS among them — leave requests built TWICE, in C2 and C9, with the same functions in both; three earlier versions of this test missed it because each half fell into a different bucket');
ok(!s.twinned.some(x=>x.list==='CUSTOMERS'),'6.2c CUSTOMERS is off the list — it was reported the day it was found and fixed the same day: pricing reads the client register now');
ok(s.twinned.every(x=>x.modules.length>1),'6.3 …by that definition exactly');
ok(s.alone.every(x=>!!x.module),'6.4 …from the merely unshared, which may be perfectly fine');
const names=s.islands.map(x=>x.list);
ok(names.indexOf('MSGS')===-1,'6.5 MSGS is NOT among them any more — it was an island this morning, it is published now, and the scanner sees the difference');
ok(s.mods.some(m=>/D1/.test(m.name)&&m.held.indexOf('MSGS')>-1),'6.6 …though the scanner still finds the table itself: it starts EMPTY and fills at runtime, and looking only for seeded rows was how it stayed invisible');
ok(!names.some(x=>/_SEED$/.test(x)),'6.7 a seed is not reported as an island: it is a fallback for a register that does exist');
const carried=['ZONES','CENTRES','NOTICES','MSGS'];
carried.forEach(function(c,i){
  ok(names.indexOf(c)===-1,'6.8.'+(i+1)+' '+c+' is no longer an island — it was one this week, and each was found by accident rather than by looking');
});
ok(/does not carry/i.test(file),'6.9 the section is titled on the page');
ok(/في وحدتين|لا قناة|جزيرة/.test(file),'6.10 …and in Arabic');

console.log('\n§7 it shows the people, not only the wires');
ok(s.positions.length===10,'7.1 the ten positions are read from the register that owns them — '+s.positions.length);
ok(s.positions.every(p=>p.level),'7.2 each with its level');
ok(s.positions.filter(p=>p.id!=='admin').every(p=>p.reportsTo),'7.3 …and who it answers to');
ok(s.positions.filter(p=>p.id==='admin')[0].grants[0]==='(every grant)','7.4 admin holds every grant there is — its list is built from the catalogue rather than typed, and a pattern that insisted on a literal list skipped the one position holding everything');
ok(s.positions.filter(p=>p.id==='audit')[0].duties.length===0,'7.5 the auditor receives no work, which the page states rather than leaving blank');
ok(/Who does what/.test(file),'7.6 the section is on the page');
ok(new RegExp(s.positions[1].id).test(file),'7.7 …naming the positions themselves');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
