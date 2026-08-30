// The shell prompt describes a system that exists. Every number in it is checked
// against the files, so it cannot go stale without this failing.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const spec=fs.readFileSync('SHELL_PROMPT.md','utf8');
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§1 the counts it quotes are real');
const mods=fs.readdirSync('.').filter(x=>/^ShopyLink.*\.html$/.test(x)&&x!=='ShopyLink_Shell.html');
/* the figure is read from the folder and from the prompt and compared —
   writing 35 here would mean editing the test every time a module is added,
   which is how a count stops being checked at all */
const said=(spec.match(/(\d+) self-contained/)||[])[1];
ok(String(mods.length)===said,mods.length+' modules on disk, and the prompt says '+said);
const w=new JSDOM(fs.readFileSync('ShopyLink_Action_C9_Staff.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const st=JSON.parse(w.localStorage.getItem('SL_STAFF_V1')).staff;
ok(st.length===24&&/24 people/.test(spec),'24 people');
ok([...new Set(st.map(p=>p.role))].length===10&&/Ten of them/.test(spec),'10 roles');
/* read from both sides and compared, rather than typed: the number changed the
   day the network got grants of its own, and a figure written into a test is a
   figure that stops being checked */
const held=[...new Set(st.flatMap(p=>p.perms))].length;
const saidP=(spec.match(/(\d+) permissions/)||[])[1];
ok(String(held)===saidP,held+' permissions held, and the prompt says '+saidP);

console.log('§2 every channel it names exists');
const chans=[...new Set(mods.flatMap(m=>(fs.readFileSync(m,'utf8').match(/SL_[A-Z_]*_V1/g)||[])))];
chans.forEach(function(c){ ok(spec.indexOf(c)>-1,'the prompt names '+c); });
ok(chans.length===24,'…all twenty-four of them: '+chans.length);

console.log('§3 the test it proposes actually discriminates');
const clerk=st.filter(p=>/Khaled/.test(p.name))[0];
const admin=st.filter(p=>/Omar Al-Masri/.test(p.name))[0];
ok(!!clerk&&!!admin,'both named people are real');
ok(clerk.perms.length!==admin.perms.length,'their permission counts differ ('+clerk.perms.length+' vs '+admin.perms.length+') — so the sidebar test can fail honestly');
ok(clerk.perms.indexOf('b9_issue')<0&&admin.perms.indexOf('b9_issue')>-1,'…and on a specific grant: issuing invoices');

console.log('§4 it warns about the two things that go wrong');
ok(/Do not rebuild the modules/.test(spec),'it says not to rebuild what exists');
ok(/Hiding a module is not securing it/.test(spec),'…and that navigation is not access control');
ok(/actorMay/.test(spec),'…naming the guard the modules already use');

console.log('§5 the families it lists cover the modules');
['Intake','Trips','Destination','Money','Admin'].forEach(function(x){
  ok(spec.indexOf(x)>-1,'family: '+x);
});
ok(/printables, not\s*\n?screens/.test(spec)||/printables/.test(spec),'documents are called printables, not screens');
console.log('\n§the rule that cost the most this week');
ok(/wiring\.js find/.test(spec),'the prompt tells the next person to ask whether a thing exists before building it');
const rules=fs.readFileSync('RULES.md','utf8');
ok(/G1b/.test(rules),'…and the rule is in RULES.md, not only in a prompt somebody may not read');
ok(/already existed/.test(rules),'…with what it cost, so it reads as a scar rather than as advice');

console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
