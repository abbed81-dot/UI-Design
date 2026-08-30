// The consignment note rides with the truck. It is asked for at every crossing, so
// it is attached once to the trip rather than repeated inside each leg — and the
// system does not issue it yet, so this is an upload beside the paper.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=()=>new JSDOM(fs.readFileSync('ShopyLink_Action_05_TripJourney.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§144 the document follows the mode');
let w=mk(); w.go('s2-pre');
ok(w.tripDocKind()==='CMR','a road trip wants a CMR');
w.st.trip.mode='sea'; ok(w.tripDocKind()==='Bill of lading','a sea trip wants a bill of lading');
w.st.trip.mode='air'; ok(w.tripDocKind()==='Air waybill','an air trip wants an air waybill');
w.st.trip.mode='land';

console.log('§145 attaching it');
const sh=()=>w.document.getElementById('shell').innerHTML;
w.render();
ok(/not attached|غير مرفقة/.test(sh()),'it starts unattached and says so, rather than looking complete');
w.askTripDoc();
ok(!!w.document.getElementById('tripdoc-ref'),'Attach opens a field for the number');
w.document.getElementById('tripdoc-ref').value='';
w.saveTripDoc();
ok(!w.st.tripDoc,'an empty number is refused — a document with no reference cannot be found again');
w.askTripDoc();
w.document.getElementById('tripdoc-ref').value='CMR-2026-0455';
w.saveTripDoc();
ok(w.st.tripDoc.ref==='CMR-2026-0455','the number is stored exactly as it reads on the paper');
ok(w.st.tripDoc.kind==='CMR','…filed under the right kind for the mode');
ok(!!w.st.tripDoc.at,'…and stamped with when it was attached');
ok(/CMR-2026-0455/.test(sh()),'…and shown on the journey screen');

console.log('§146 it belongs to the trip, not to a leg');
ok(!w.st.legDocs['tripDoc'],'it is not filed inside any leg');
const legs=Object.keys(w.st.legDocs||{}).length;
w.render();
ok(Object.keys(w.st.legDocs||{}).length===legs,'…and attaching it did not touch the border papers');
ok((sh().match(/CMR-2026-0455/g)||[]).length===1,'it is shown once, not repeated at every crossing');

console.log('§147 it can be replaced');
w.askTripDoc();
w.document.getElementById('tripdoc-ref').value='CMR-2026-0999';
w.saveTripDoc();
ok(w.st.tripDoc.ref==='CMR-2026-0999','a corrected paper replaces the old reference');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
