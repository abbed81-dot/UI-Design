// An audit log is read at its head. The rest is history, not a page.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const FILES=['ShopyLink_Action_B5_BorderFees.html','ShopyLink_Action_Cards.html','ShopyLink_Action_Claims.html',
 'ShopyLink_Action_C10_Zones.html','ShopyLink_Action_C1_Trucks.html','ShopyLink_Action_C2_Drivers.html',
 'ShopyLink_Action_C7_Hubs.html','ShopyLink_Action_C8_Agents.html'];
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
FILES.forEach(x=>{
  const src=fs.readFileSync(x,'utf8');
  const w=new JSDOM(src,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
  const tag=x.replace('ShopyLink_Action_','').replace('.html','');
  const screens=[...new Set((src.match(/go\('([a-z0-9\-]+)'\)/g)||[]).map(s=>s.slice(4,-2)))];
  // find the screen that actually shows the log — not every module puts it first
  const withLog=()=>{let hit=null;screens.forEach(s=>{try{w.go(s);}catch(e){return}
    if(/Audit log|سجل/i.test(w.document.getElementById('shell').innerHTML))hit=s;});return hit;};
  const sc=withLog();
  if(!sc){ok(false,tag+': no audit log found on any screen');return;}
  w.go(sc);
  const before=w.document.getElementById('shell').innerHTML.length;
  ok(!/newest first|الأحدث/.test(w.document.getElementById('shell').innerHTML),tag.padEnd(15)+' short log → nothing folded');
  for(let i=0;i<300;i++)w.AUDIT.push({at:'12:00',who:'x',what:'y',ref:'z'});
  w.go(sc);
  const after=w.document.getElementById('shell').innerHTML;
  ok(/newest first|الأحدث/.test(after),'   '+w.AUDIT.length+' rows → says 12 of '+w.AUDIT.length+', newest first');
  ok(after.length/before<1.4,'   …and the page holds at x'+(after.length/before).toFixed(2));
});
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
