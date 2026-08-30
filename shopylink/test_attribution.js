// An audit line written at the act must name whoever acted. A hard-coded name is
// worse than none: it is read and believed, and it credits work to someone who
// was not there — or blames them for it.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const c9=new JSDOM(fs.readFileSync('ShopyLink_Action_C9_Staff.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const REG=c9.localStorage.getItem('SL_STAFF_V1');
const mk=x=>{const w=new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
  w.localStorage.setItem('SL_STAFF_V1',REG);return w;};
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const staff=JSON.parse(REG).staff;
const person=staff.filter(p=>p.role==='hubsup')[0];

console.log('§1 no module writes a fixed name into its audit trail');
const MODS=['Action_C10_Zones','Action_C12_Approvals','Action_C1_Trucks','Action_C2_Drivers',
            'Action_C7_Hubs','Action_C8_Agents','Action_C9_Staff','Action_Cards'];
MODS.forEach(function(m){
 const src=fs.readFileSync('ShopyLink_'+m+'.html','utf8');
 const write=src.match(/function logA\([a-zA-Z0-9_]*\)\{[^}]*\}/);
 ok(!!write,m.replace('Action_','')+' has a write path');
 ok(!/who:'[A-Z][a-z]+ [A-Z]/.test(write[0]),'   …and it does not hard-code a person');
});

console.log('§2 with nobody signed in, it says so');
MODS.forEach(function(m){
 const w=mk('ShopyLink_'+m+'.html');
 if(typeof w.actorName!=='function'){ok(false,m+' has no actorName');return;}
 ok(/unattributed/.test(w.actorName()),m.replace('Action_','')+': "'+w.actorName()+'"');
});

console.log('§3 signing someone in names them, and the log follows');
MODS.forEach(function(m){
 const w=mk('ShopyLink_'+m+'.html');
 if(typeof w.setActor!=='function'){ok(false,m+' cannot switch person');return;}
 w.setActor(person.id);
 const before=(w.AUDIT||[]).length;
 if(typeof w.logA==='function')w.logA('did something');
 const line=(w.AUDIT||[])[0];
 ok(line&&line.who===person.name,m.replace('Action_','')+' → "'+(line?line.who:'no line')+'"');
});

console.log('§4 an unknown person is not silently accepted');
const w2=mk('ShopyLink_Action_C7_Hubs.html');
w2.setActor('U-does-not-exist');
ok(/unattributed/.test(w2.actorName()),'an id nobody holds still reads as unattributed');

console.log('§5 C12 offers everyone, not a list copied into the file');
const c12=mk('ShopyLink_Action_C12_Approvals.html');
ok(c12.actorList().length>3,'the approvals picker offers '+c12.actorList().length+' people from the registry');
ok(/unattributed/.test(c12.ME.name),'…and starts with nobody signed in');

console.log('§6 seed history is left alone');
const hubs=fs.readFileSync('ShopyLink_Action_C7_Hubs.html','utf8');
ok(/var AUDIT=\[\{at:'[0-9:]+',who:'[A-Z]/.test(hubs),'yesterday\u2019s seeded rows keep their names — they are history, not a claim about now');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
