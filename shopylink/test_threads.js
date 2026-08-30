// The board has always promised that "messages are permanent — an edit keeps
// its history, and the thread exports with the job". It could not: the messages
// lived in D1 and nothing else could see them. A clerk holding an invoice could
// not read the sentence that explains it.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const store={};
const shared={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{},key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length}};
const open1=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:shared,configurable:true});w.render&&w.render();return w;};
const strip=h=>h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');

const d=open1('ShopyLink_D1_Control.html');
d.ME=d.PEOPLE[0];
const REF='BSH-240705-01';

console.log('§1 a message is addressed, attributed and timed');
const bad=d.postMessage({ref:REF,text:'   ',roles:['ops']});
ok(bad.ok===false,'1.1 an empty message says nothing and is refused');
const noRole=d.postMessage({ref:REF,text:'something happened',roles:[]});
ok(noRole.ok===false,'1.2 …and one addressed to nobody is an obligation with no owner');
const r1=d.postMessage({ref:REF,text:'Customer disputes the weight — hold the invoice until the re-weigh.',roles:['ops']});
ok(r1.ok===true,'1.3 addressed to a role, it is accepted');
ok(r1.readers&&r1.readers.length>0,'1.4 …and it says who will actually read it — the holder of the role, or whoever stands in for him');

console.log('\n§2 the thread is published, per record');
d.render();
const pub=JSON.parse(shared.getItem('SL_THREADS_V1')).threads;
const th=pub.filter(x=>x.ref===REF)[0];
ok(!!th,'2.1 the shipment has a thread on the channel');
ok(th.messages.length===1&&th.count===1,'2.2 with the message that was posted');
ok(th.messages[0].by===d.PEOPLE[0].name,'2.3 …naming who said it');
ok(th.messages[0].at>0,'2.4 …and when');
ok(th.messages[0].roles.indexOf('ops')>-1,'2.5 …and who it was addressed to');
ok(th.messages[0].edited===false,'2.6 …and whether it has been edited since');
ok(pub.every(t=>t.ref),'2.7 every thread is published against a record, never loose');
ok(JSON.stringify(pub).indexOf('"task"')===-1,'2.8 the internal work item behind a message does not travel: a reader wants what was said, not how the board files it');

console.log('\n§3 the promise: it reaches the work');
d.postMessage({ref:REF,text:'Re-weighed at 118 kg. Invoice may go.',roles:['finance']});
d.render();
const b9=open1('ShopyLink_Action_09_Billing.html');
b9.openInv(REF);
const screen=strip(b9.document.getElementById('shell').innerHTML);
ok(/What was said about this shipment/.test(screen),'3.1 billing shows the thread beside the invoice it explains');
ok(/disputes the weight/.test(screen),'3.2 …the sentence that says why the invoice waited');
ok(/Re-weighed at 118/.test(screen),'3.3 …and the one that released it');
ok(/read here, answered there/.test(screen),'3.4 and it says where a reply belongs: the thread is the board\'s, and a reply is written where the record is');
const src9=fs.readFileSync('ShopyLink_Action_09_Billing.html','utf8');
ok(!/MSGS/.test(src9),'3.5 billing keeps no messages of its own — it reads');
ok(!/setItem\(SL_REG_THREADS/.test(src9),'3.6 …and writes none');

console.log('\n§4 a shipment nobody discussed shows nothing');
b9.openInv('CON-240701-01');
const quiet=strip(b9.document.getElementById('shell').innerHTML);
ok(!/What was said/.test(quiet),'4.1 no empty panel where there is no conversation');
const bare=mk('ShopyLink_Action_09_Billing.html');
bare.openInv(REF);
ok(!/What was said/.test(strip(bare.document.getElementById('shell').innerHTML)),'4.2 …and none at all when the channel is not published: billing does not invent a conversation');

console.log('\n§5 the map can see it now');
const { scan } = require('/home/claude/work/wiring.js');
const s5=scan();
ok(!!s5.channels['SL_THREADS_V1'],'5.1 the channel is on the map');
ok(s5.channels['SL_THREADS_V1'].owners.indexOf('D1 Control')>-1,'5.2 owned by the board that holds the messages');
ok(s5.channels['SL_THREADS_V1'].readers.length>0,'5.3 …and read by somebody, which is the whole point');
ok(!s5.islands.some(i=>i.list==='MSGS'),'5.4 MSGS is no longer an island — it was the fifth, and the only one found by being asked about rather than by accident');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
