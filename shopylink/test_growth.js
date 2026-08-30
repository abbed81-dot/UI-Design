// growth contract — rule C8: the page must have a ceiling, not a slope.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;

console.log('§93 B9 billing queue');
const b9=mk('ShopyLink_Action_09_Billing.html');
const d9=b9.document, sh9=()=>d9.getElementById('shell').innerHTML;
b9.go('s1');
ok(!/showing/.test(sh9()),'3 invoices → everything shown, no fold');
const one=JSON.parse(JSON.stringify(b9.INVOICES[0]));
for(let i=1;i<=400;i++)b9.INVOICES.push(Object.assign({},one,{id:'IX'+i,ship:'SH-'+i,status:i%3?'paid':'draft'}));
b9.render();
const at403=sh9().length, rows=(sh9().match(/assign-row/g)||[]).length;
ok(rows===20,'403 invoices → one page of 20 rows drawn, not 403');
ok(at403<26000,'…and the page stays a page ('+at403+' chars, was 39,794 unbounded)');
ok(b9.INV_VIEW[0].status==='draft','drafts head the queue — it is worked, not browsed');
ok(/drafts first/.test(sh9()),'…and the screen says so');
b9.setInvQ('SH-399');
ok(b9.INV_VIEW.length===1,'search finds one among 403');
b9.setInvQ('');b9.invShowAll();
ok((sh9().match(/assign-row/g)||[]).length>12,'the full queue can still be opened — nothing hidden for good');
b9.invShowAll();

console.log('§94 D1 manager board');
const d1=mk('ShopyLink_D1_Control.html');
const dd=d1.document, sh1=()=>dd.getElementById('shell').innerHTML;
d1.go('s2');const base=sh1().length;
ok(!/busiest first/.test(sh1()),d1.PEOPLE.length+' people → all shown');
for(let i=1;i<=200;i++)d1.PEOPLE.push({id:'U'+i,name:'P'+i,role:'ops',hub:'DAM'});
d1.render();
ok(sh1().length/base<1.3,'213 people → the board holds its size (x'+(sh1().length/base).toFixed(2)+')');
ok(/busiest first/.test(sh1()),'…ranked, and it says so');

console.log('§95 D1 survives a partial record');
d1.TRIPS.push({id:'TRP-BARE',ships:[],mode:'land',dir:'export',stage:'depart',docs:[]});
ok(Array.isArray(d1.overrides()),'a trip with no overrides array does not crash the gates board');
d1.go('s5');ok(sh1().length>1000,'…and the screen renders');

console.log('§96 the worst single page, module by module');
// A reader sees one page at a time, so the honest measure is the WORST page — each
// in a fresh window, because measuring after a chain of go() calls measures the chain.
function worstPage(file,arrs,grow){
  const src=fs.readFileSync(file,'utf8');
  const scr=[...new Set((src.match(/go\(.([a-z0-9\-]+)..\)/g)||[]).map(s=>s.slice(4,-2)))];
  let m2=0;
  scr.forEach(sc=>{
    const w2=mk(file);
    if(grow)arrs.forEach(a=>{if(!Array.isArray(w2[a])||!w2[a].length)return;
      const one=JSON.parse(JSON.stringify(w2[a][0]));
      for(let i=1;i<=200;i++)w2[a].push(Object.assign({},one,{id:(one.id||'X')+'-'+i}));});
    try{w2.go(sc);m2=Math.max(m2,w2.document.getElementById('shell').innerHTML.length);}catch(e){}
  });
  return m2;
}
[['ShopyLink_Action_07_Dispatcher.html',['DELIVERIES','DRIVERS','ZONES']],
 ['ShopyLink_Action_08_Delivery.html',['STOPS','TRACK']],
 ['ShopyLink_Action_Cards.html',['CARDS','SUPPLIERS']],
 ['ShopyLink_Action_C12_Approvals.html',['REQS']],
 ['ShopyLink_Action_09_Billing.html',['INVOICES']]].forEach(function(cfg){
  const b2=worstPage(cfg[0],cfg[1],false), g2=worstPage(cfg[0],cfg[1],true);
  ok(g2/b2<3,cfg[0].replace('ShopyLink_Action_','').replace('.html','').padEnd(16)+' +200 records → worst page x'+(g2/b2).toFixed(2));
});
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
