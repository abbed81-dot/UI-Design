// An approved claim pays a client back. Approving it and telling nobody meant the
// money left and the invoice never knew — the client was billed in full for cargo
// we had already compensated them for.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const c9=new JSDOM(fs.readFileSync('ShopyLink_Action_C9_Staff.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const REG=c9.localStorage.getItem('SL_STAFF_V1');
const staff=JSON.parse(REG).staff;
const claims=()=>{const w=new JSDOM(fs.readFileSync('ShopyLink_Action_Claims.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
 w.localStorage.setItem('SL_STAFF_V1',REG);return w;};
const billing=()=>new JSDOM(fs.readFileSync('ShopyLink_Action_09_Billing.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§1 approving a claim announces the credit');
const cl=claims();
const decider=staff.filter(p=>p.perms.indexOf('b8_ret')>-1)[0];
cl.setActor(decider.id);
const c=cl.CLAIMS.filter(x=>x.status==='open')[0];
const assessed=cl.assessed(c);
cl.apSend(c.id); if(cl.modalOk)cl.modalOk();
ok(c.apReq&&c.apReq.status==='pending','a claim is raised for approval');
cl.apApprove(c.id); if(cl.modalOk)cl.modalOk();
ok(c.status==='settled'&&c.credit,'approving it issues a credit note: '+(c.credit?c.credit.no:''));
const ev=cl.slEvRead().filter(e=>e.type==='claim.approved');
ok(ev.length===1,'…and announces it — it used to tell nobody');
ok(ev[0].payload.amount===assessed,'…for the assessed amount: '+ev[0].payload.amount);
ok(ev[0].ship===c.ship&&ev[0].client===c.cust,'…against the right shipment and client');
ok(!!ev[0].actor,'…naming who approved it');

console.log('§2 billing applies it against what the client owes');
const b9=billing();
b9.localStorage.setItem('SL_EVENTS_V1',cl.localStorage.getItem('SL_EVENTS_V1'));
ok(b9.creditsFor(c.ship).length===1,'billing sees it against '+c.ship);
ok(b9.creditsTotal(c.ship)===assessed,'…at the same figure: '+b9.creditsTotal(c.ship));
const v={ship:c.ship,lines:[{name:'Shipping charge',amt:1200,cur:'USD'}]};
ok(b9.pullCredits(v).ok===true,'it can be pulled onto the invoice');
ok(v.lines[1].amt===-assessed,'…as a NEGATIVE line: '+v.lines[1].amt);
ok(v.lines[1].claim===c.id,'…carrying the claim number, so it can be traced');
ok(b9.pullCredits(v).ok===false,'…and applied once, never twice');
ok(b9.pullCredits({ship:'NO-SUCH',lines:[]}).ok===false,'a shipment with no approved claim has nothing to apply');

console.log('§3 the arithmetic, and the case that must not be issued');
const t1=b9.totals({lines:[{name:'a',amt:1200,cur:'USD'},{name:'b',amt:-240,cur:'USD',credit:true}]});
ok(t1.USD===960,'1200 less a 240 credit is 960');
const over={ship:'Z',term:'cash',lines:[{name:'a',amt:100,cur:'USD'},{name:'b',amt:-400,cur:'USD',credit:true}]};
ok(b9.totals(over).USD===-300,'a credit larger than the bill leaves a negative total');
ok(b9.canIssue(over)===false,'…and such an invoice cannot be issued — that is a refund to arrange, not a bill to send');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
