// The consignment note: A4, travels with the truck, signed three times. Not the
// carton sticker — that is printed and stuck onto the box and already exists.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§1 it is built on the sheet that already exists');
const w=mk('ShopyLink_Doc_CMR.html'), d=w.document;
ok(!!d.querySelector('.sheet')&&!!d.querySelector('.head'),'the A4 sheet and its head');
const mine=(fs.readFileSync('ShopyLink_Doc_CMR.html','utf8').match(/data:image\/png;base64,[A-Za-z0-9+/=]{200,}/g)||[]);
const quot=(fs.readFileSync('ShopyLink_Doc_Quotation.html','utf8').match(/data:image\/png;base64,[A-Za-z0-9+/=]{200,}/g)||[]);
ok(mine.length===2&&mine[0]===quot[0],'the lockups are the same assets, byte for byte (A1)');
ok(/@page\{size:A4;margin:0/.test(fs.readFileSync('ShopyLink_Doc_CMR.html','utf8')),'…and the same print rules');

console.log('§2 what a consignment note must carry');
const t=()=>d.querySelector('.sheet').textContent.replace(/\s+/g,' ');
ok(/CONSIGNMENT NOTE/.test(t()),'it names itself');
ok(/Sender/.test(t())&&/Consignee/.test(t())&&/Carrier/.test(t()),'sender, consignee and carrier — the three parties');
ok(/Place of loading/.test(t())&&/Place of delivery/.test(t()),'where it was loaded and where it goes');
ok(/Crossings/.test(t()),'…and the crossings between them');
ok(/Packages/.test(t())&&/Gross weight/.test(t()),'packages and gross weight, which is what a border counts');
ok(d.querySelectorAll('.acc-line').length===3,'three signature lines: loading, driver, delivery');
ok(/apparent good order|بحالة ظاهرية سليمة/.test(t()),'the carrier\u2019s undertaking is stated');
ok(/does not settle them|لا يسدّدها/.test(t()),'…and that the driver carries the papers but does not pay them');
ok(/مهلة السماح/.test(t()),'trade Arabic for free time (B5)');

console.log('§3 the trip publishes, the note draws');
const trip=mk('ShopyLink_Action_05_TripJourney.html');
trip.go('s2-pre');
ok(/Print ours|اطبع بوليصتنا/.test(trip.document.getElementById('shell').innerHTML),'the trip offers to print our own note');
ok(/Attach|أرفق/.test(trip.document.getElementById('shell').innerHTML),'…beside the slot for the agent\u2019s own paper — they are two documents');
trip.publishCMR();
const pay=JSON.parse(trip.localStorage.getItem('SL_CMR_V1'));
ok(pay.no&&pay.truck&&pay.driver,'the trip publishes itself, its truck and its driver');
ok(pay.legs.length>0,'…and every crossing');
const live=new JSDOM(fs.readFileSync('ShopyLink_Doc_CMR.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()});
live.window.localStorage.setItem('SL_CMR_V1',JSON.stringify(pay));
live.window.eval(fs.readFileSync('ShopyLink_Doc_CMR.html','utf8').match(/<script>[\s\S]*?<\/script>/g).map(x=>x.replace(/<\/?script>/g,'')).join('\n'));
const lt=live.window.document.querySelector('.sheet').textContent.replace(/\s+/g,' ');
ok(/TRP-20260817-001/.test(lt),'the note draws the published trip');
ok(/SY-1234-A/.test(lt)&&/Ahmad Al-Hassan/.test(lt),'…its truck and driver');
ok(/UAE Exit/.test(lt)&&/Syria Entry/.test(lt),'…and its crossings in order');

console.log('§4 with nothing published it is a specimen and says so');
ok(/specimen/.test(w.document.querySelector('.bar .h').textContent),'the chrome says specimen rather than pretending to be a real trip');

console.log('§5 the sticker is a different document, and still works');
const b1=mk('ShopyLink_Action_01_ReceiveParcel.html');
b1.go('done');
const st=b1.document.querySelector('.awb');
ok(!!st&&st.querySelectorAll('img').length===1,'the carton sticker still carries its embedded wordmark');
ok(/[\u0600-\u06FF]/.test(st.textContent),'…and reads in both languages at once, as a sticker must');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
