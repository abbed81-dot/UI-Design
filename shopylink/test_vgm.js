// SOLAS will not let a container be loaded without a certified gross mass, and
// the system knew it: the gate asks for a VGM on every sea trip and the board
// carries a work item with a hard cut-off. Nothing could produce the paper.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const store={};
const shared={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{},key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length}};
const open1=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:shared,configurable:true});w.render&&w.render();return w;};
const strip=h=>h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');

open1('ShopyLink_Action_C1_Trucks.html');
open1('ShopyLink_Action_C7_Hubs.html');
const d1=open1('ShopyLink_D1_Control.html');
d1.slEmit('parcel.received',{ship:'BSH-1',client:'TechLine Trading',actor:'Khaled',payload:{from:'Guangzhou',to:'Latakia Port',mode:'sea',weight:4200,cartons:12}});
d1.slEmit('parcel.received',{ship:'BSH-2',client:'Sham Import LLC',actor:'Khaled',payload:{from:'Guangzhou',to:'Latakia Port',mode:'sea',weight:3100,cartons:8}});
d1.slEmit('trip.created',{ship:'TRP-90',actor:'Mona',payload:{trip:'TRP-90',truck:'505-8812 دمشق',from:'Guangzhou',to:'Latakia Port',mode:'sea',ships:['BSH-1','BSH-2']}});
d1.render();

console.log('§1 the weight survives the receipt');
const reg=JSON.parse(shared.getItem('SL_SHIPMENTS_V1')).shipments;
ok(reg.every(s=>'weight' in s),'1.1 the shipment register carries a weight — the receipt has always measured it and the register threw it away');
ok(reg.filter(s=>s.ship==='BSH-1')[0].weight===4200,'1.2 …the one the clerk actually recorded');
ok(reg.filter(s=>s.ship==='BSH-1')[0].cartons===12,'1.3 …and how many pieces it was');

console.log('\n§2 the certificate is read, never typed');
const v=open1('ShopyLink_Doc_VGM.html');
const sheet=()=>strip(v.document.getElementById('sheet').innerHTML);
const w=v.weights();
ok(w.goods===7300,'2.1 the cargo is the sum of what was weighed at receipt — 4,200 + 3,100');
ok(w.tare===15200,'2.2 the tare is the fleet register\'s real one: 15,200 kg');
ok(w.total===22500,'2.3 …so the verified gross mass is 22,500 kg');
ok(/22,500 kg/.test(sheet()),'2.4 and that is what the paper says');
ok(/505-8812/.test(sheet()),'2.5 naming the vehicle it was weighed on');
ok(/Latakia Port/.test(sheet()),'2.6 …and the port of loading, from the network');
const src=fs.readFileSync('ShopyLink_Doc_VGM.html','utf8');
ok(!/[0-9]{4,}\s*(kg|كغ)/.test(src)&&!/tare\s*[:=]\s*[0-9]/.test(src),'2.7 no mass is written into this file at all — every figure is read. The trip module used to assume a tare of 8,500 for a lorry that weighs 15,200, and a VGM built on that would have been a CERTIFIED FALSE WEIGHT, off by nearly seven tonnes');

console.log('\n§3 the method is declared, because SOLAS requires it');
ok(/WEIGHED|weighed/.test(sheet()),'3.1 method 1: the packed unit was weighed — the owner weighs actually');
ok(/Method 1/.test(sheet()),'3.2 …named as method 1, which is the declaration the convention asks for');

console.log('\n§4 nothing is certified that was not weighed');
const store2={};
const sh2={getItem:k=>k in store2?store2[k]:null,setItem:(k,v)=>{store2[k]=String(v)},removeItem:k=>{},clear:()=>{},key:i=>Object.keys(store2)[i],get length(){return Object.keys(store2).length}};
const op2=x=>{const w2=mk(x);Object.defineProperty(w2,'localStorage',{value:sh2,configurable:true});w2.render&&w2.render();return w2;};
op2('ShopyLink_Action_C1_Trucks.html');
const d2=op2('ShopyLink_D1_Control.html');
d2.slEmit('parcel.received',{ship:'X-1',client:'A',actor:'K',payload:{from:'Guangzhou',to:'Latakia Port',mode:'sea'}});
d2.slEmit('trip.created',{ship:'TRP-91',actor:'M',payload:{trip:'TRP-91',truck:'505-8812 دمشق',mode:'sea',ships:['X-1']}});
d2.render();
const v2=op2('ShopyLink_Doc_VGM.html');
ok(v2.weights().complete===false,'4.1 a shipment nobody weighed cannot be certified');
ok(/cannot be certified/.test(strip(v2.document.getElementById('sheet').innerHTML)),'4.2 …and the paper says so on its face rather than printing a plausible number');
ok(/not weighed: X-1/.test(strip(v2.document.getElementById('sheet').innerHTML)),'4.3 …naming which one, so somebody can go and weigh it');
ok(v2.declareVGM().ok===false,'4.4 and declaring it is refused at the act — a certified weight nobody weighed is worse than a missing document');
ok(v2.document.getElementById('declare').disabled===true,'4.5 the button is disabled too, but the refusal does not depend on that');

console.log('\n§5 declared once, and the chain hears it');
ok(v.declareVGM().ok===true,'5.1 a complete certificate can be declared');
const evs=JSON.parse(shared.getItem('SL_EVENTS_V1')).filter(e=>e.type==='vgm.submitted');
ok(evs.length===1,'5.2 one event on the log');
ok(evs[0].payload.vgm===22500&&evs[0].payload.tare===15200,'5.3 carrying the mass and what it was made of');
ok(evs[0].payload.method==='weighed','5.4 …and how it was determined');
ok(evs[0].payload.ships.length===2,'5.5 …and which shipments it covers');
ok(v.declareVGM().ok===false,'5.6 the same trip cannot declare twice');

console.log('\n§6 the signature is left for the pen');
ok(/Signed for the shipper/.test(sheet()),'6.1 there is a place to sign');
ok(!/Omar|Rana|Mona/.test(sheet()),'6.2 …and no name is printed under the figure: the owner signs AFTER printing, so nobody is put under a weight he has not read');
ok(/Weighbridge/.test(sheet()),'6.3 with a second line for the weighing party\'s own reference');
v.flip();
ok(/الوزن الإجمالي المصدَّق/.test(strip(v.document.getElementById('sheet').innerHTML)),'6.4 and it prints in Arabic');
ok(/22,500/.test(strip(v.document.getElementById('sheet').innerHTML)),'6.5 …with the figure unchanged, because a number is not translated');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
