// Border fees as money, not only as a record: whose hand paid, whether it has
// actually gone, whose cargo bears it, and whether it ever came back.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§1 whose money paid it');
const b5=mk('ShopyLink_Action_B5_BorderFees.html');
const c=b5.CROSS[0];
ok(b5.crossTotal(c)===120,'the crossing totals its fees: '+b5.crossTotal(c)+' USD');
ok(b5.settleCross(c.id,'').ok===false,'a fee with no payer cannot be reconciled, so it is refused');
ok(b5.settleCross(c.id,'driver').ok===true,'…the driver\u2019s float settles it');
ok(c.paidBy==='driver'&&!!c.paidAt,'…recorded with whose hand and when');
ok(b5.settleCross(c.id,'agent').ok===false,'…and it cannot be settled twice');

console.log('§2 recorded is not recovered');
ok(b5.feesOutstanding().length===1,'until it reaches an invoice it is money out and not back');
ok(b5.outstandingTotal()===120,'…120 USD outstanding, and visible as such');

console.log('§3 apportioned by declared value');
ok(b5.recoverCross(c.id).ok===false,'with no shipments recorded the split is refused, not guessed');
b5.slEmit('parcel.received',{ship:'SH-A',client:'TechLine',payload:{trip:c.trip,declared:9000}});
b5.slEmit('parcel.received',{ship:'SH-B',client:'Sham Import',payload:{trip:c.trip,declared:900}});
b5.slEmit('parcel.received',{ship:'SH-C',client:'Layla',payload:{trip:c.trip,declared:100}});
const r=b5.recoverCross(c.id);
ok(r.ok,'with declared values it apportions');
ok(r.rows[0].share===108&&r.rows[1].share===10.8&&r.rows[2].share===1.2,'90/9/1 by value → 108 · 10.80 · 1.20');
ok(Math.round(r.rows.reduce((a,x)=>a+x.share,0)*100)/100===120,'…the parts equal the whole, to the cent');
ok(b5.feesOutstanding().length===0,'…and the crossing is settled and recovered');
const evs=b5.slEvRead().filter(e=>e.type==='borderfee.apportioned');
ok(evs.length===3,'each shipment is told its share');
ok(evs[0].payload.basis==='declared value','…and the basis is named, so it can be argued with');

console.log('§4 zero values are refused rather than split evenly');
const b5b=mk('ShopyLink_Action_B5_BorderFees.html');
const c2=b5b.CROSS[1];
b5b.slEmit('parcel.received',{ship:'X',client:'A',payload:{trip:c2.trip,declared:0}});
b5b.settleCross(c2.id,'agent');
const rr=b5b.recoverCross(c2.id);
ok(rr.ok===false&&/declared/.test(rr.why),'no declared value means no share can be worked out: '+rr.why);

console.log('§5 it reaches the invoice, at cost');
const b9=mk('ShopyLink_Action_09_Billing.html');
b9.localStorage.setItem('SL_EVENTS_V1',b5.localStorage.getItem('SL_EVENTS_V1'));
const inv=b9.INVOICES[0];
b5.slEmit('borderfee.apportioned',{ship:inv.ship,client:inv.customer,payload:{crossing:c.id,border:c.border,amount:42.5,cur:'USD',basis:'declared value',pct:35}});
b9.localStorage.setItem('SL_EVENTS_V1',b5.localStorage.getItem('SL_EVENTS_V1'));
ok(b9.borderFeesTotal(inv.ship)===42.5,'billing sees the share: '+b9.borderFeesTotal(inv.ship));
b9.openInv(inv.ship);
ok(/Border fees|رسوم المعابر/.test(b9.document.getElementById('shell').innerHTML),'…on the invoice screen');
const before=(inv.lines||[]).length;
ok(b9.addBorderFees(inv).ok===true,'…and it can be added');
ok(inv.lines[inv.lines.length-1].passThrough===true,'marked a pass-through — a disbursement, not a service we sell');
ok(inv.lines[inv.lines.length-1].amt===42.5,'…at cost, never marked up');
ok(b9.addBorderFees(inv).ok===false,'…and never added twice');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
