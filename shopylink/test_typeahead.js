const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const dom=new JSDOM(fs.readFileSync('ShopyLink_D1_Control.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
const w=dom.window,d=w.document;const sh=()=>d.getElementById('shell').innerHTML;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§65 it must survive a real number of shipments');
const base=w.knownRecords().length;
for(let i=1;i<=300;i++){
 w.mkShip({id:'BSH-2408-'+('000'+i).slice(-4),cust:(i%3===0?'TechLine Trading':(i%3===1?'Sham Import LLC':'Noor Trading Co')),
   from:(i%2?'Guangzhou':'Istanbul'),to:'Damascus',mode:(i%2?'sea':'land'),receivedAt:w.T0-i*3600000,stamps:{received:w.T0-i*3600000}});
}
ok(w.knownRecords().length===base+300,'65.1 three hundred shipments are in the system');
w.go('s8');w.clearRecord();
ok(!/BSH-2408-0001/.test(sh()),'65.2 with nothing typed the list is NOT drawn — 300 buttons would be useless');
ok(/type at least one character|اكتب حرفًا/.test(sh()),'65.3 …it says to start typing, and how many records exist');

console.log('§66 each character narrows it');
const a=w.findRecordsPage('B').total;
const b=w.findRecordsPage('BSH-2408-01').total;
const c=w.findRecordsPage('BSH-2408-012').total;
const dd=w.findRecordsPage('BSH-2408-0123').total;
ok(a>b&&b>c&&c>=dd,'66.1 every extra character narrows the result: '+a+' → '+b+' → '+c+' → '+dd);
ok(dd===1,'66.2 a full number resolves to exactly one');
ok(w.findRecordsPage('BSH-2408-0123').rows[0].id==='BSH-2408-0123','66.3 …and it is the right one');

console.log('§67 the dropdown never floods the screen');
const p=w.findRecordsPage('BSH');
ok(p.rows.length===w.REC_SHOW,'67.1 at most '+w.REC_SHOW+' rows are ever drawn');
ok(p.total>p.rows.length&&p.hidden===p.total-p.rows.length,'67.2 the rest are counted, not silently dropped');
w.setRecQ('BSH');
ok(/showing|يُعرض/.test(sh())&&/keep typing to narrow it|تابع الكتابة/.test(sh()),'67.3 the screen says how many are shown of how many, and to keep typing');
const rows=(sh().match(/pickRecord\(/g)||[]).length;
ok(rows<=w.REC_SHOW+1,'67.4 the DOM really holds only that many rows, not 300');
w.setRecQ('BSH-2408-0007');
ok(/showing|يُعرض/.test(sh())&&!/keep typing/.test(sh()),'67.5 once it fits, it stops nagging');

console.log('§68 ranking — the number you typed comes first');
w.mkShip({id:'SL-77',cust:'Exact Match Co',from:'Dubai',to:'Damascus',mode:'air',receivedAt:w.T0,stamps:{received:w.T0}});
w.mkShip({id:'SL-7700',cust:'Longer One',from:'Dubai',to:'Damascus',mode:'air',receivedAt:w.T0,stamps:{received:w.T0}});
ok(w.findRecords('SL-77')[0].id==='SL-77','68.1 an exact number outranks a longer one that contains it');
ok(w.findRecords('techline')[0].label.toLowerCase().indexOf('techline')>-1,'68.2 a name match works when the number is unknown');
const r1=w.findRecords('BSH-2408-02').map(x=>x.id).join(',');
const r2=w.findRecords('BSH-2408-02').map(x=>x.id).join(',');
ok(r1===r2,'68.3 the order is stable — the list does not jump about between keystrokes');

console.log('§69 it still refuses what does not exist');
w.setRecQ('BSH-9999-9999');
ok(w.findRecordsPage('BSH-9999-9999').total===0&&/no record matches/.test(sh()),'69.1 an unknown number matches nothing and says so');
ok(w.postMessage({ref:'BSH-9999-9999',roles:['ops'],text:'x'}).ok===false,'69.2 …and cannot be posted to');
w.setRecQ('');w.pickRecord('BSH-2408-0007');
ok(w.CHAT_REF==='BSH-2408-0007'&&/writing about|الكتابة عن/.test(sh()),'69.3 picking from the dropdown selects it and shows the composer');
ok(w.postMessage({ref:'BSH-2408-0007',roles:['ops'],text:'real record, real message'}).ok===true,'69.4 …and a message on it is accepted');

console.log('§70 the thread chips cap too');
ok(/records with a thread/.test(sh()),'70.1 the chips are labelled with their count');
const chips=(sh().match(/pickRecord\('/g)||[]).length;
ok(chips<=12,'70.2 they never grow into a wall — the rest live in the search');
w.setLang('ar');w.clearRecord();
ok(/ابدأ بكتابة رقم أو اسم/.test(sh()),'70.3 AR twin');
w.setLang('en');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
