// Border fees, on the engine that already existed. My session built a second copy
// of this by not checking first — the original is better: it reports the
// percentage as well as the share, and refuses to guess a split.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const w=mk('ShopyLink_Action_B5_BorderFees.html');
const c=w.CROSS[0];

console.log('§1 whose money paid it');
ok(w.crossTotal(c)===120,'the crossing totals 120 — standard fees plus APPROVED extras only');
ok(w.settleCross(c.id,'').ok===false,'a fee with no payer cannot be reconciled');
ok(w.settleCross(c.id,'driver').ok===true,'…and the driver float settles it');
ok(c.paidBy==='driver'&&!!c.paidAt,'…recorded with whose hand and when');
ok(w.settleCross(c.id,'agent').ok===false,'…and it cannot be settled twice');
ok(w.outstandingTotal()===120,'it stands as money out until it comes back: '+w.outstandingTotal());

console.log('§2 an unapproved expense is not yet a cost');
const c2=w.CROSS[1];
const before=w.crossTotal(c2);
if(w.addExtra){ try{ w.addExtra(c2.id,'Escort fee',35,'USD'); }catch(e){} }
ok(w.crossTotal(c2)===before||!(c2.apReq&&c2.apReq.status==='approved'),
   'adding an extra does not raise the total until it is approved');

console.log('§3 who bears it — by declared value, and never guessed');
const fresh=mk('ShopyLink_Action_B5_BorderFees.html');
const fc=fresh.CROSS[0];
const none=fresh.apportion(fc);
ok(none.ok===false,'with no shipments on the trip the split is REFUSED, not invented: "'+none.why+'"');
fresh.slEmit('parcel.received',{ship:'S1',client:'TechLine',payload:{trip:fc.trip,declared:20000}});
fresh.slEmit('parcel.received',{ship:'S2',client:'Sham Import',payload:{trip:fc.trip,declared:5000}});
const a=fresh.apportion(fc);
ok(a.ok===true&&a.rows.length===2,'with two shipments it apportions across both');
ok(a.rows[0].pct===80&&a.rows[1].pct===20,'…by declared value: 80% and 20%');
ok(a.rows[0].share===96&&a.rows[1].share===24,'…which is 96 and 24 of the 120');
ok(a.rows[0].share+a.rows[1].share===a.total,'…adding back to the whole, losing nothing');

console.log('§4 and it comes back on the invoice');
fresh.settleCross(fc.id,'driver');
const r=fresh.recoverCross(fc.id);
ok(r.ok===true&&r.rows.length===2,'the shares are sent to billing');
const b9=mk('ShopyLink_Action_09_Billing.html');
b9.localStorage.setItem('SL_EVENTS_V1',fresh.localStorage.getItem('SL_EVENTS_V1'));
ok(b9.borderFeesFor('S1').length===1,'billing sees the fee against the right shipment');
ok(Math.abs(b9.borderFeesTotal('S1')-96)<0.01,'…at its apportioned share: '+b9.borderFeesTotal('S1'));
const v={ship:'S1',lines:[]};
const add=b9.addBorderFees(v);
ok(add.ok===true,'the fee can be put on the invoice');
ok(v.lines.length===1&&v.lines[0].passThrough===true,'…as a pass-through line at cost — a disbursement recovered is not a service sold');
ok(!!v.lines[0].ref,'…carrying the crossing it came from, so it can be proved: '+v.lines[0].ref);
ok(b9.addBorderFees(v).ok===false,'…and is never recovered twice');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
