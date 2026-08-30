// 20 / 50 / 100 per page, then Next. A catalogue's tail must be reachable in steps —
// every card is a real product someone may need, unlike an alert list whose tail is noise.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=()=>new JSDOM(fs.readFileSync('ShopyLink_Action_Cards.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const grow=w=>{const one=JSON.parse(JSON.stringify(w.CARDS[0])),sp=JSON.parse(JSON.stringify(w.SUPPLIERS[0]));
  for(let i=1;i<=200;i++){w.CARDS.push(Object.assign({},one,{id:'C'+i,name:'Card '+i}));w.SUPPLIERS.push(Object.assign({},sp,{id:'S'+i,name:'Sup '+i}));}};

console.log('§126 page sizes are the reader\u2019s choice');
let w=mk(); grow(w); w.go('s1');
const rows=()=>(w.document.getElementById('shell').innerHTML.match(/toggleC\(/g)||[]).length;
ok(rows()===20,'opens at 20 per page');
ok(w.PAGE_SIZES.join()==='20,50,100','and offers 20 / 50 / 100');
w.pgSet('cards',50); ok(rows()===50,'50 per page draws 50');
w.pgSet('cards',100); ok(rows()===100,'100 per page draws 100');
w.pgSet('cards',20);

console.log('§127 the tail is reachable, not folded away');
const sh=()=>w.document.getElementById('shell').innerHTML;
ok(/1–20 of 206/.test(sh()),'it states the range: 1–20 of 206');
w.pgGo('cards',1);
ok(/21–40 of 206/.test(sh()),'Next moves a page, and the range follows');
w.pgSet('cards',100); w.pgGo('cards',2);
ok(rows()===6,'the final page holds the remainder, not a full page of repeats');
ok(/201–206 of 206/.test(sh()),'…and says so');

console.log('§128 the failure cases every pager has');
w=mk(); grow(w); w.go('s1'); w.pgGo('cards',9);
w.setQ('Card 7');
ok(w.pgOf('cards').page<=1,'a filter that shortens the list moves you to a page that exists');
ok(rows()>0,'…so you never land on an empty page');
w.setQ('');
w.pgGo('cards',0);
const prev=[...w.document.querySelectorAll('#shell button')].find(b=>/Previous|السابق/.test(b.textContent));
ok(prev&&prev.disabled,'Previous is disabled on the first page rather than silently doing nothing');

console.log('§129 each list keeps its own place');
w=mk(); grow(w);
w.pgGo('cards',3); w.pgSet('sups',50);
ok(w.pgOf('cards').page===3&&w.pgOf('sups').page===0,'paging one list does not move another');
ok(w.pgOf('cards').size===20&&w.pgOf('sups').size===50,'…and each remembers its own page size');
w.go('s3');
ok((sh().match(/toggleKey\(/g)||[]).length<=50,'the supplier registry pages too');

console.log('§130 the dashboard work queue');
const d1=new JSDOM(fs.readFileSync('ShopyLink_D1_Control.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const dsh=function(){return d1.document.getElementById('shell').innerHTML;};
d1.go('s1');
ok(/class="pager"/.test(dsh()),'a short queue STILL shows the pager — disabled at both ends, so the reader can see the list is complete rather than wondering where the control went');
d1.setActor('U-01');   /* somebody must be signed in to own the work */
for(var i=1;i<=80;i++)d1.mk({ref:'SL-'+i,title:'Task '+i,titleAr:'مهمة',kind:'document',owner:d1.ME.id,role:d1.ME.role,next:'do',nextAr:'نفّذ',due:d1.NOW()+d1.DAY,allow:d1.DAY});
d1.render();
ok(/class="pager"/.test(dsh()),'at 82 items it appears');
ok((dsh().match(/class="pager"/g)||[]).length===2,'above AND below the list — you never scroll back to turn the page');
ok(/1–20 of 82/.test(dsh()),'it states the range');
ok(/Previous|السابق/.test(dsh())&&/Next|التالي/.test(dsh()),'Previous and Next are offered');
d1.pgGo('myq',1);
ok(/21–40 of 82/.test(dsh()),'Next moves one page');
d1.pgSet('myq',50);
ok(/1–50 of 82/.test(dsh()),'changing the page size returns to the first page rather than stranding you');

console.log('§131 the modules that already paged, now with a size choice');
[['ShopyLink_Action_C1_Trucks.html','TRUCKS'],['ShopyLink_Action_C2_Drivers.html','DRIVERS']].forEach(function(cfg){
  const w4=new JSDOM(fs.readFileSync(cfg[0],'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
  const s4=function(){return w4.document.getElementById('shell').innerHTML;};
  const tag=cfg[0].replace('ShopyLink_Action_','').replace('.html','');
  const arr=w4[cfg[1]], one=JSON.parse(JSON.stringify(arr[0]));
  for(var i=1;i<=90;i++)arr.push(Object.assign({},one,{id:'X'+i,plate:'P'+i}));
  w4.render();
  ok(w4.PAGE===20,tag+': opens at 20 per page, not the 6 an author once chose');
  ok(/per page|لكل صفحة/.test(s4()),'   the size choice is on screen');
  ok(/Prev|السابق/.test(s4())&&/Next|التالي/.test(s4()),'   beside Previous and Next');
  const at20=s4().length;
  w4.setPageSize(100);
  ok(s4().length>at20,'   100 per page draws more than 20 did');
  ok(w4.page===0,'   …and returns to the first page rather than stranding you');
  w4.setPageSize(20);
});

console.log('§132 Previous and Next are always there — and actually clickable');
const c=mk();
const csh=()=>c.document.getElementById('shell').innerHTML;
const find=re=>[...c.document.querySelectorAll('#shell button')].find(b=>re.test(b.textContent.trim()));
c.go('s1');
ok(!!find(/Previous|السابق/)&&!!find(/Next|التالي/),'with only '+c.CARDS.length+' cards they are still on screen');
ok(find(/Previous|السابق/).disabled&&find(/Next|التالي/).disabled,'…both disabled, since there is one page');
ok(/1 \/ 1/.test(csh()),'…and it reads page 1 / 1, so the reader can see the list is complete');
const one3=JSON.parse(JSON.stringify(c.CARDS[0]));
for(let i=1;i<=60;i++)c.CARDS.push(Object.assign({},one3,{id:'C'+i,name:'Card '+i}));
c.render();
ok(!find(/Next|التالي/).disabled,'at 66 cards Next comes alive');
find(/Next|التالي/).dispatchEvent(new c.Event('click',{bubbles:true}));
ok(/21–40 of 66/.test(csh()),'CLICKING Next turns the page — by click, not by calling the function behind it');
find(/Previous|السابق/).dispatchEvent(new c.Event('click',{bubbles:true}));
ok(/1–20 of 66/.test(csh()),'clicking Previous goes back');
find(/^50$/).dispatchEvent(new c.Event('click',{bubbles:true}));
ok(/1–50 of 66/.test(csh()),'clicking 50 resizes the page');

console.log('§133 every paged module, checked by clicking');
[['ShopyLink_Action_09_Billing.html','INVOICES'],
 ['ShopyLink_Action_Claims.html','CLAIMS'],
 ['ShopyLink_Action_C7_Hubs.html','HUBS'],
 ['ShopyLink_Action_C8_Agents.html','AGENTS'],
 ['ShopyLink_Action_C1_Trucks.html','TRUCKS'],
 ['ShopyLink_Action_C2_Drivers.html','DRIVERS']].forEach(cfg=>{
  const src=fs.readFileSync(cfg[0],'utf8');
  const w5=new JSDOM(src,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
  const tag=cfg[0].replace('ShopyLink_Action_','').replace('.html','');
  const screens=[...new Set((src.match(/go\('([a-z0-9\-]+)'\)/g)||[]).map(s=>s.slice(4,-2)))];
  const find=re=>[...w5.document.querySelectorAll('#shell button')].find(b=>re.test(b.textContent.trim()));
  // grow first, then find the screen that lists the records
  const arr=w5[cfg[1]];
  if(arr&&arr.length){const one=JSON.parse(JSON.stringify(arr[0]));
    for(let i=1;i<=60;i++)arr.push(Object.assign({},one,{id:'Z'+i,name:'N'+i,plate:'P'+i}));}
  let sc=null;
  screens.forEach(s=>{try{w5.go(s);}catch(e){return}
    if(find(/Previous|السابق|Prev/))sc=s;});
  ok(!!sc,tag.padEnd(14)+' has Previous/Next on screen '+(sc||'—'));
  if(!sc)return;
  w5.go(sc);
  ok(find(/Previous|السابق|Prev/).disabled,'   Previous is disabled at the start, not hidden');
  const nx=find(/Next|التالي/);
  ok(nx&&!nx.disabled,'   Next is live with '+(arr?arr.length:'?')+' records');
  const before=w5.document.getElementById('shell').innerHTML;
  nx.dispatchEvent(new w5.Event('click',{bubbles:true}));
  ok(w5.document.getElementById('shell').innerHTML!==before,'   CLICKING Next changes the page');
  ok(!find(/Previous|السابق|Prev/).disabled,'   …and Previous becomes live');
});

console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
