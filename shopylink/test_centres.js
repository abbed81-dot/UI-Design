// A centre is not a warehouse. It is the address a customer is given for his
// shopping, served by a warehouse that may serve several. The four were held in
// the customer-facing addresses screen with their lines and their subscription
// prices, publishing nothing — the address a man gives his shop lived in a file
// no other module could read.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const store={};
const shared={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{},key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length}};
const open1=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:shared,configurable:true});w.render&&w.render();return w;};
const strip=h=>h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');

const c9=open1('ShopyLink_Action_C9_Staff.html');
const staff=JSON.parse(shared.getItem('SL_STAFF_V1')).staff;
const L3=staff.filter(p=>Number(p.level)>=3)[0], L1=staff.filter(p=>Number(p.level)===1)[0];
const c7=open1('ShopyLink_Action_C7_Hubs.html');

console.log('§1 America is on the network');
ok(c7.COUNTRIES.some(c=>c.iso==='US'),'1.1 the country is registered');
ok(c7.CITIES.some(c=>c.name==='Charlotte'),'1.2 …with the city the address is in');
const usHub=c7.HUBS.filter(h=>h.id==='H-USA')[0];
ok(!!usHub&&usHub.type==='receiving','1.3 …and a receiving hub, which is what makes it an origin');
ok(JSON.parse(shared.getItem('SL_HUBS_V1')).hubs.filter(h=>h.id==='H-USA').length===1,'1.4 published, so every module sees it');

console.log('\n§2 a centre is published, and it is not a warehouse');
const pub=JSON.parse(shared.getItem('SL_CENTRES_V1')).centres;
ok(pub.length===4,'2.1 four centres — '+pub.map(c=>c.country).join(', '));
ok(pub.every(c=>c.lines.length>0),'2.2 each carries the address a customer is given, line by line');
ok(pub.every(c=>!!c.hub),'2.3 …and the warehouse that serves it');
ok(pub.every(c=>c.hub!==c.id),'2.4 the two are different records — a centre is served BY a warehouse, it is not one');
ok(pub.some(c=>c.methods.length>1),'2.5 the methods it ships by travel too');
ok(pub.every(c=>c.plans.length>0&&c.plans.every(p=>p.price>0&&p.cur)),'2.6 …and the price of owning the address, with its currency');
ok(pub.every(c=>!JSON.stringify(c).match(/perkg|lane/)),'2.7 carriage is NOT here — one price in two places is one price too many');

console.log('\n§3 changing the subscription is a level-3 decision');
const was=c7.centreById('CE-USA').plans[2].price;
c7.go('s5');
ok(/c7-sub|Centres/.test(strip(c7.document.getElementById('shell').innerHTML)),'3.1 the panel draws');
c7.askCentreSub('CE-USA','annual');
ok(!!c7.document.getElementById('c7-sub'),'3.2 the dialog is drawn on this screen too — it opened invisibly at first, which is a dead button nobody notices');
c7.document.getElementById('c7-sub').value=String(was+600000);
c7.setTyped('bo');
c7.modalOk();
ok(!!c7.modal,'3.3 a two-letter reason does not file it');
c7.setTyped('board approved a higher annual fee');
c7.modalOk();
ok(c7.centreById('CE-USA').plans[2].price===was,'3.4 filing changes nothing — L3 decides');
const rq=JSON.parse(shared.getItem('SL_APPROVALS_V1')).filter(x=>x.op==='centre')[0];
ok(!!rq&&rq.level===3,'3.5 the request stands on the bus at level 3');
ok(rq.amount===String(was)+' → '+String(was+600000),'3.6 showing what it would move from and to — '+rq.amount);
ok(/board approved/.test(rq.reason),'3.7 …with the reason given');
const c12=open1('ShopyLink_Action_C12_Approvals.html');
ok(c12.opById('centre').name!=='centre','3.8 the approvals catalogue names it rather than showing a bare id');
ok(c12.opById('centre').level===3,'3.9 …at level 3');
c12.setActor(L1.id);c12.render();
ok(c12.canDecide(c12.reqById(rq.id))===false,'3.10 a level-1 approver may not decide it');
c12.setActor(L3.id);c12.render();
c12.askApprove(rq.id);c12.modalOk();
c7.render();
ok(c7.centreById('CE-USA').plans[2].price===was+600000,'3.11 approved, the fee moves');
ok(JSON.parse(shared.getItem('SL_CENTRES_V1')).centres.filter(c=>c.id==='CE-USA')[0].plans[2].price===was+600000,'3.12 …and is republished at once');

console.log('\n§4 opening a centre');
const before=c7.CENTRES.length;
ok(c7.canAddCentre()===false,'4.1 nothing can be opened before a country, a warehouse, an address and a fee are given');
c7.setNce('country','JO'); c7.setNce('hub','H-DXB');
c7.setNce('lines','ShopyLink Amman\nQueen Alia Road 12\nAmman, Jordan');
c7.setNce('sub','90000');
ok(c7.canAddCentre()===true,'4.2 …and can be once they are');
c7.askAddCentre(); c7.setTyped('opening an Amman centre served from Dubai'); c7.modalOk();
ok(c7.CENTRES.length===before,'4.3 asking does not open it');
const rq2=JSON.parse(shared.getItem('SL_APPROVALS_V1')).filter(x=>x.op==='centre'&&/New centre/.test(x.ref||''))[0];
ok(!!rq2,'4.4 the request is filed');
c12.render(); c12.askApprove(rq2.id); c12.modalOk(); c7.render();
ok(c7.CENTRES.length===before+1,'4.5 approved, the centre exists');
const made=c7.CENTRES[c7.CENTRES.length-1];
ok(made.hub==='H-DXB','4.6 …linked to the warehouse that serves it, which is in another country entirely');
ok(made.retail===false,'4.7 …and NOT offered to individuals by opening it — that stays a separate decision');
ok(made.plans[0].price===90000,'4.8 carrying the fee that was approved');

console.log('\n§5 both languages');
ok(/Centres/.test(strip(c7.document.getElementById('shell').innerHTML)),'5.1 the panel is titled');
c7.setLang&&c7.setLang('ar');
c7.render();
ok(/المراكز البريدية|اشتراك/.test(strip(c7.document.getElementById('shell').innerHTML)),'5.2 …in Arabic too');

console.log('\n§6 the customer screen reads the panel, and no longer its own copy');
const ad=open1('ShopyLink_Addresses.html');
ok(typeof ad.slCentres==='function','6.1 it has a reader for the published centres');
const live=ad.liveCountries();
ok(live.length===pub.filter(c=>c.retail).length,'6.2 it shows exactly the centres offered to individuals');
ok(live.every(c=>!!c.centre),'6.3 …each carrying the centre it came from');
const usa=live.filter(c=>c.code==='USA')[0];
ok(!!usa&&usa.lines.join(' ')===pub.filter(c=>c.country==='US')[0].lines.join(' '),'6.4 the address it shows a customer is the panel\'s, character for character');
ok(ad.livePlans()[2].price===c7.centreById('CE-USA').plans[2].price,'6.5 …and so is the fee he is asked for — the one the manager approved');
const bare=mk('ShopyLink_Addresses.html');
ok(bare.liveCountries().length===4,'6.6 with nothing published the gallery still draws from its own rows');
ok(/COUNTRIES_SEED/.test(fs.readFileSync('ShopyLink_Addresses.html','utf8')),'6.7 …which are named as seed, so nobody mistakes them for the record');
const src6=fs.readFileSync('ShopyLink_Addresses.html','utf8');
ok(!/\bCOUNTRIES\.(find|filter|map)\(/.test(src6)&&!/\bPLANS\.(find|filter|map)\(/.test(src6),'6.8 nothing reads the local copies directly any more');

console.log('\n§7 a fee changed in the panel reaches the customer');
const wasFee=c7.centreById('CE-UAE').plans[1].price;
c7.render();
c7.askCentreSub('CE-UAE','monthly');
c7.document.getElementById('c7-sub').value=String(wasFee+50000);
c7.setTyped('monthly fee raised for the Dubai centre');
c7.modalOk();
const rq3=JSON.parse(shared.getItem('SL_APPROVALS_V1')).filter(x=>/CE-UAE/.test(x.ref||''))[0];
c12.render(); c12.askApprove(rq3.id); c12.modalOk(); c7.render();
const ad2=open1('ShopyLink_Addresses.html');
ad2.st.country='UAE';
ok(ad2.livePlans().filter(p=>p.id==='monthly')[0].price===wasFee+50000,'7.1 the customer screen quotes the new fee at once — two copies of one fact are now one');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
