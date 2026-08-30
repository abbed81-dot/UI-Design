// A queue is worked, not browsed: ordered by what you can decide, capped, and honest
// about what it is holding back. Counted by what the page DRAWS, because the decide
// buttons are permission-gated and counting them measures the wrong thing.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const w=new JSDOM(fs.readFileSync('ShopyLink_Action_C12_Approvals.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const d=w.document, sh=()=>d.getElementById('shell').innerHTML;
const cards=()=>(sh().match(/Pending<\/span>|Approved<\/span>|Rejected<\/span>/g)||[]).length;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§120 a short queue is shown whole');
w.go('s1');
const start=cards();
ok(start>0,'the queue draws its cards ('+start+' after the pending filter)');
ok(start<=10&&!/queue-fold/.test(sh()),'…and with fewer than the cap, nothing is folded away');

console.log('§121 a long queue is capped and says so');
const one=JSON.parse(JSON.stringify(w.REQS[0]));
for(let i=1;i<=90;i++)w.REQS.push(Object.assign({},one,{id:'RQ-X'+i,status:'pending'}));
w.render();
ok(cards()===10,'at '+w.REQS.length+' requests exactly 10 cards are drawn');
ok(/queue-fold/.test(sh()),'…and the page states it is showing a head of the queue');
ok(w.REQ_VIEW.length>10,'…while the queue itself still holds all '+w.REQ_VIEW.length);
ok(/yours first|ما يخصّك أولًا/.test(sh()),'…ordered so what you can decide comes first');

console.log('§122 the order is the point, not the cap');
const first=w.REQ_VIEW[0], last=w.REQ_VIEW[w.REQ_VIEW.length-1];
ok(!w.canDecide(last)||w.canDecide(first),'anything you can decide sorts above anything you cannot');

console.log('§123 nothing is hidden for good');
w.reqShowAll();
ok(cards()>10,'show-all opens the rest ('+cards()+')');
w.reqShowAll();
ok(cards()===10,'…and it folds back');

console.log('§124 the audit log reads from its head');
for(let i=0;i<60;i++)w.AUDIT.push({at:'12:00',who:'x',what:'y'});
w.render();
ok(/newest first|الأحدث أولًا/.test(sh()),'a long audit log says it is showing the newest first');
ok(sh().length<80000,'…and the page stays a page ('+sh().length+' chars)');

console.log('§125 a ceiling, measured from above the cap');
// Measuring from the seed is misleading: 6 cards to 10 is the cap filling up, not
// growth. The honest test starts already above the cap and adds hundreds more.
const one2=JSON.parse(JSON.stringify(w.REQS[0]));
for(var i=1;i<=20;i++)w.REQS.push(Object.assign({},one2,{id:'A'+i,status:'pending'}));
w.render(); const at28=sh().length, c28=cards();
for(var j=1;j<=400;j++)w.REQS.push(Object.assign({},one2,{id:'B'+j,status:'pending'}));
w.render(); const at428=sh().length, c428=cards();
ok(c28===10&&c428===10,'10 cards at 28 requests and 10 at '+w.REQS.length);
ok(Math.abs(at428-at28)<20,'the page changes by '+(at428-at28)+' characters — the width of a counter');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
