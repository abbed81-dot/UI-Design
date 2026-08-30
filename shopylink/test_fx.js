// The tariff is written in USD and the customer apps speak Syrian pounds. One
// approved rate, owned and published by Pricing, changed the way every other
// published figure changes — and cited wherever it is used, because a converted
// figure without its rate and its date is not a price, it is a rumour.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const strip=h=>h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');

console.log('§1 the rate has an owner, and travels like the tariff');
const pr=mk('ShopyLink_Pricing.html');
const TF=pr.localStorage.getItem('SL_TARIFF_V1');
const tf=JSON.parse(TF);
ok(!!tf.fx&&tf.fx.rate>0,'1.1 an approved rate is published');
ok(tf.fx.base==='USD'&&tf.fx.quote==='SYP','1.2 it says which currency into which — never a bare number');
ok(!!tf.fx.at,'1.3 …and the day it was set');
const card=strip(pr.fxBlock());
ok(/Approved exchange rate/.test(card),'1.4 the price list shows it');
ok(card.indexOf(String(tf.fx.at))>-1,'1.5 …with its date on the screen, not only in the channel');

console.log('\n§2 it changes the way a published price changes');
ok(pr.canFileFx()===false,'2.1 nothing can be filed before a new figure is typed');
pr.setFxDraft(tf.fx.rate);
ok(pr.canFileFx()===false,'2.2 …nor when the figure is the one already approved');
pr.setFxDraft(14200);
ok(pr.canFileFx()===true,'2.3 a different figure can be requested');
pr.askFx();pr.setTyped('central bank rate for August');pr.modalOk();
ok(pr.FX.rate===tf.fx.rate,'2.4 requesting does not change it — L3 decides, not the person asking');
ok(!!pr.pendingFor('fx','rate'),'2.5 the request is held');
const bus=JSON.parse(pr.localStorage.getItem('SL_APPROVALS_V1')||'[]');
const it=bus.filter(x=>/exchange rate/i.test(x.opName||''))[0];
ok(!!it,'2.6 …and reaches the approvals bus');
ok(it.level===3,'2.7 at level 3');
ok(it.amount===String(tf.fx.rate)+' → 14200','2.8 showing what it would move from and to — '+it.amount);
ok(/central bank/.test(it.reason),'2.9 …with the reason given');
ok(it.opName!=='Edit base price list','2.10 and it is named for what it is, not filed under base prices');
ok(pr.canFileFx()===false,'2.11 a second request cannot be stacked on the first');

console.log('\n§3 the customer app converts with that rate, and says so');
const P='SL-9777';
const w=mk('ShopyLink_IndividualApp.html');
w.localStorage.setItem('SL_TARIFF_V1',TF);
w.localStorage.setItem('SL_EVENTS_V1',JSON.stringify([
 {type:'parcel.received',ship:P,client:w.ACCOUNT.name,at:1,actor:'K',
  payload:{from:'Guangzhou',to:'Aleppo',mode:'air',weight:1.2,cartons:2,price:{amount:7.98,cur:'USD'}}},
 {type:'parcel.consolidated',ship:P,at:2,actor:'K',payload:{parcels:[P]}}]));
const row=w.logShipments()[0];
const m=w.shipMoney(row);
ok(m.converted===true&&m.cur==='SYP','3.1 the parcel is shown in pounds');
ok(m.amount===Math.round(7.98*tf.fx.rate),'3.2 …at the published rate exactly — '+m.amount);
const note=w.rateNote(row,'en');
ok(/7\.98 USD/.test(note),'3.3 the figure it converted FROM is cited to the cent, not rounded to whole dollars');
ok(note.indexOf(String(tf.fx.rate).slice(0,2))>-1,'3.4 …the rate is cited');
ok(note.indexOf(tf.fx.at)>-1,'3.5 …and the day that rate was set');
ok(/حُوِّل/.test(w.rateNote(row,'ar')),'3.6 in Arabic too');
w.st.detailId=P;
ok(/rate set/.test(strip(w.screenHTML('ship-detail','default','en'))),'3.7 and it reaches the parcel screen, under the amount it explains');

console.log('\n§4 no rate published: shown as priced, never converted at a guess');
const w2=mk('ShopyLink_IndividualApp.html');
w2.localStorage.setItem('SL_EVENTS_V1',JSON.stringify([
 {type:'parcel.received',ship:P,client:w2.ACCOUNT.name,at:1,actor:'K',
  payload:{from:'Guangzhou',to:'Aleppo',mode:'air',weight:1.2,price:{amount:7.98,cur:'USD'}}}]));
const m2=w2.shipMoney(w2.logShipments()[0]);
ok(m2.converted===false&&m2.cur==='USD','4.1 the amount stays in the currency it was priced in');
ok(m2.amount===7.98,'4.2 …untouched — no rate was invented to move it');
ok(/no approved rate|لا سعر صرف/.test(w2.rateNote(w2.logShipments()[0],'en')+w2.rateNote(w2.logShipments()[0],'ar')),'4.3 and the screen says why it is not in pounds');

console.log('\n§5 the rate moves every price shown to a customer');
const raised=JSON.parse(TF); raised.fx.rate=tf.fx.rate*2; raised.fx.at='2026-08-28';
const w3=mk('ShopyLink_IndividualApp.html');
w3.localStorage.setItem('SL_TARIFF_V1',JSON.stringify(raised));
w3.localStorage.setItem('SL_EVENTS_V1',w.localStorage.getItem('SL_EVENTS_V1'));
ok(w3.shipMoney(w3.logShipments()[0]).amount===Math.round(7.98*raised.fx.rate),'5.1 double the rate, double the pounds — one rate, one place');
ok(w3.rateNote(w3.logShipments()[0],'en').indexOf('2026-08-28')>-1,'5.2 …and the new date travels with it');

console.log('\n§6 nobody keeps a second rate');
['ShopyLink_IndividualApp.html','ShopyLink_BusinessApp.html','ShopyLink_Action_01_ReceiveParcel.html'].forEach(function(fn,i){
 const src=fs.readFileSync(fn,'utf8');
 ok(!/(var|let)\s+(FX|RATE_USD|USD_SYP)\s*=/.test(src),'6.'+(i+1)+' '+fn.replace('ShopyLink_','')+' holds no rate of its own');
});

console.log('\n§7 the loop closes: requested here, decided there, applied back here');
const store={};
const shared={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{},key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length}};
const open1=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:shared,configurable:true});w.render&&w.render();return w;};
const c9=open1('ShopyLink_Action_C9_Staff.html');
const staff7=JSON.parse(shared.getItem('SL_STAFF_V1')).staff;
const L3=staff7.filter(p=>Number(p.level)>=3)[0], L1=staff7.filter(p=>Number(p.level)===1)[0];
const pr7=open1('ShopyLink_Pricing.html');
const was=pr7.FX.rate;
pr7.setFxDraft(14200);pr7.askFx();pr7.setTyped('central bank rate for August');pr7.modalOk();
const c12=open1('ShopyLink_Action_C12_Approvals.html');
const it7=JSON.parse(shared.getItem('SL_APPROVALS_V1')).filter(x=>x.op==='fx')[0];
ok(!!it7,'7.1 the request reaches the approvals screen');
ok(c12.opById('fx').name==='Approved exchange rate','7.2 …named for what it is, not filed under base prices');
ok(c12.opById('fx').level===3,'7.3 …at level 3 in the catalogue');
c12.setActor(L1.id);c12.render();
ok(c12.canDecide(c12.reqById(it7.id))===false,'7.4 a level-1 approver may not decide it');
c12.setActor(L3.id);c12.render();
ok(c12.canDecide(c12.reqById(it7.id))===true,'7.5 a level-3 approver may');
c12.askApprove(it7.id);c12.modalOk();
ok(JSON.parse(shared.getItem('SL_APPROVALS_V1')).filter(x=>x.id===it7.id)[0].status==='approved','7.6 the decision is written to the bus');
pr7.render();
ok(pr7.FX.rate===14200,'7.7 …and Pricing applies it on its next pass — '+was+' became '+pr7.FX.rate);
ok(/^\d{4}-\d{2}-\d{2}$/.test(pr7.FX.at),'7.8 the date it was set is a DATE — the clock stamp would have written "19:25" here');
ok(JSON.parse(shared.getItem('SL_TARIFF_V1')).fx.rate===14200,'7.9 the new rate is republished at once');
const app7=open1('ShopyLink_IndividualApp.html');
ok(app7.slFx().rate===14200,'7.10 …and the customer app is already reading it');
ok(app7.slFx().at===pr7.FX.at,'7.11 with the day it was approved, not the day it was seeded');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
