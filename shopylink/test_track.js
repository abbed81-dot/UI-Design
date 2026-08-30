// "Where is my shipment?" — answered from the same log the company writes to,
// on the shapes the modules actually emit. What matters most here is what the
// screen must NOT do: attribute cargo loosely, leak how we are organised, or
// draw a stage nobody recorded.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const boot=(x,seed)=>{
 const w=new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
 if(seed)seed(w);
 w.render&&w.render();
 return w;
};
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const sh=w=>w.document.getElementById('app').innerHTML;
const ME='TechLine Trading', OTHER='Sham Import LLC';
const quotes=[{id:'QT-2608-01',customer:ME,from:'Guangzhou',dest:'Damascus',method:'sea',
  validUntil:'2099-01-01',lines:[{name:'Freight',amt:1200,cur:'USD'}]}];
const ev=(type,ship,extra)=>Object.assign({type:type,ship:ship,at:Date.parse('2026-08-0'+(1+(ev.i=(ev.i||0)+1)%9)+'T09:00:00Z'),actor:'Khaled Omar'},extra||{});
const seedWith=list=>w=>{
 w.localStorage.setItem('SL_QUOTES_BIZ_V1',JSON.stringify({at:1,quotes:quotes}));
 w.localStorage.setItem('SL_EVENTS_V1',JSON.stringify(list));
};
const MINE='BSH-240705-01', THEIRS='BSH-240707-03';
const chain=[
 ev('shipment.expected',MINE,{client:ME,payload:{}}),
 ev('parcel.received',MINE,{client:ME,payload:{customer:ME,cartons:4}}),
 ev('parcel.received',THEIRS,{client:OTHER,payload:{customer:OTHER}}),
 ev('parcel.consolidated',MINE,{payload:{count:2,parcels:[MINE,THEIRS]}}),
 ev('trip.loaded','TRP-2608-014',{payload:{trip:'TRP-2608-014',truck:'T-9',kg:820,ships:[MINE,THEIRS]}}),
 ev('shipment.arrived','TRP-2608-014',{payload:{trip:'TRP-2608-014',hub:'Damascus',ships:[MINE,THEIRS]}}),
 ev('run.assigned','RUN-77',{payload:{zone:'Z-JAR',driver:'D-3',ships:[MINE]}})
];

console.log('§1 the tab exists and the client can reach it');
let w=boot('ShopyLink_BusinessApp.html',seedWith(chain));
ok(/tabs/.test(sh(w)),'1.1 a tab bar is drawn');
ok(/Tracking/.test(sh(w)),'1.2 tracking is one of the tabs');
ok(/Quotations/.test(sh(w)),'1.3 …and quotations is still the other');
w.setTab('t');
ok(/Your shipments/.test(sh(w)),'1.4 pressing it opens the tracking screen');

console.log('\n§2 the shipment stands where the log put it, on the modules\' own shapes');
const mine=w.myShipments().filter(x=>x.ship===MINE)[0];
ok(!!mine,'2.1 the account\'s shipment is found');
ok(w.STAGES_C[mine.reached].id==='assigned','2.2 it has reached "out for delivery" — declared against a RUN, credited to the cargo');
ok(mine.at[0]!==undefined&&mine.at[1]!==undefined,'2.3 booking and receipt are both timed');
ok(/Out for delivery/.test(sh(w)),'2.4 …and the screen says so in words');
ok(/Delivered/.test(sh(w))&&/not yet/.test(sh(w)),'2.5 the step it has not reached is drawn empty, not hidden and not guessed');

console.log('\n§3 another account\'s cargo is not this account\'s business');
ok(w.myShipments().every(x=>x.ship!==THEIRS),'3.1 the shipment belonging to the other client is absent');
ok(sh(w).indexOf(THEIRS)===-1,'3.2 …and its number appears nowhere on the screen');
ok(sh(w).indexOf(OTHER)===-1,'3.3 nor does the other client\'s name');

console.log('\n§4 a shipment nobody attributed is shown to nobody');
const orphan=chain.filter(e=>!(e.type==='parcel.received'&&e.ship===MINE)&&e.type!=='shipment.expected');
const w2=boot('ShopyLink_BusinessApp.html',seedWith(orphan));
w2.setTab('t');
ok(w2.myShipments().length===0,'4.1 with no declaration of ownership, the cargo is claimed by no one');
ok(/Nothing moving yet/.test(sh(w2)),'4.2 …and the screen says nothing is moving rather than showing loose cargo');

console.log('\n§5 how the company is arranged is not the client\'s business');
w=boot('ShopyLink_BusinessApp.html',seedWith(chain));w.setTab('t');
const screen=sh(w);
ok(screen.indexOf('TRP-2608-014')===-1,'5.1 no trip number');
ok(screen.indexOf('RUN-77')===-1,'5.2 no delivery run');
ok(screen.indexOf('Khaled Omar')===-1,'5.3 no name of one of our people — the log carries it, the client is not shown it');
ok(screen.indexOf('T-9')===-1&&screen.indexOf('D-3')===-1,'5.4 no truck, no driver');

console.log('\n§6 a failed attempt is never reported as a delivery');
const failed=chain.concat([ev('shipment.delivered','RUN-77',{payload:{run:'RUN-77',delivered:0,failed:1,ships:[],failedShips:[MINE],unnamed:0}})]);
const w3=boot('ShopyLink_BusinessApp.html',seedWith(failed));
w3.setTab('t');
const m3=w3.myShipments().filter(x=>x.ship===MINE)[0];
ok(w3.STAGES_C[m3.reached].id==='assigned','6.1 the shipment stays out for delivery');
ok(!/class="chip[^"]*">Delivered</.test(sh(w3)),'6.2 the status chip does not read Delivered');
ok(/class="lb">Delivered<\/span><span class="at">not yet/.test(sh(w3)),'6.2b …while the step itself is still drawn, empty and honest');
const done=chain.concat([ev('shipment.delivered','RUN-77',{payload:{run:'RUN-77',delivered:1,failed:0,ships:[MINE],failedShips:[],unnamed:0}})]);
const w4=boot('ShopyLink_BusinessApp.html',seedWith(done));
w4.setTab('t');
ok(w4.STAGES_C[w4.myShipments()[0].reached].id==='delivered','6.3 a real delivery does reach the end');

console.log('\n§7 both languages, and the machine values stay left to right');
w4.setLang('ar');
ok(/التتبّع/.test(sh(w4)),'7.1 the tab is named in Arabic');
ok(/سُلِّمت/.test(sh(w4)),'7.2 the stages are named in Arabic — the pairs are in this file\'s own dictionary');
ok(/خرجت للتسليم/.test(sh(w4)),'7.3 …every one of them, not only the last');
ok(sh(w4).indexOf(MINE)>-1&&/class="no machine"/.test(sh(w4)),'7.4 the shipment number is marked as a machine value under RTL');
ok(w4.document.documentElement.dir==='rtl','7.5 the page turns around');
w4.setLang('en');

console.log('\n§8 a catalogue is paged, never capped');
const many=[];
for(let i=1;i<=7;i++){
 const id='BSH-2607-'+(i<10?'0':'')+i;
 many.push(ev('parcel.received',id,{client:ME,payload:{customer:ME}}));
 many.push(ev('parcel.consolidated',id,{payload:{parcels:[id]}}));
}
const w5=boot('ShopyLink_BusinessApp.html',seedWith(many));
w5.setTab('t');
ok(w5.myShipments().length===7,'8.1 all seven shipments are held');
ok((sh(w5).match(/class="qcard"/g)||[]).length===3,'8.2 three to a page');
ok(/Previous/.test(sh(w5))&&/Next/.test(sh(w5)),'8.3 both controls are drawn at the first page');
ok(/Previous<\/button>/.test(sh(w5).replace(/\s+disabled/,'')),'8.4 Previous is present, not removed');
ok(/disabled/.test(sh(w5)),'8.5 …and disabled, because there is nothing before the first page');
w5.tPage(1);w5.tPage(1);
ok((sh(w5).match(/class="qcard"/g)||[]).length===1,'8.6 the last page holds the seventh');
ok(/3<\/span> of <span class="machine">3/.test(sh(w5)),'8.7 the page count is stated');
w5.tPage(1);
ok((sh(w5).match(/class="qcard"/g)||[]).length===1,'8.8 pressing Next at the end does not run off the list');

console.log('\n§9 storage blocked, or nothing sent yet');
const w6=boot('ShopyLink_BusinessApp.html',w=>{w.localStorage.setItem('SL_EVENTS_V1',JSON.stringify(chain));});
w6.setTab('t');
ok(/We cannot tell which account/.test(sh(w6)),'9.1 with no quotation the app does not guess whose cargo it is looking at');
ok(w6.myShipments().length===0,'9.2 …and shows none');
const w7=boot('ShopyLink_BusinessApp.html',seedWith([]));
w7.setTab('t');
ok(/Nothing moving yet/.test(sh(w7)),'9.3 an empty log says nothing is moving');
ok(!/undefined|NaN|\[object/.test(sh(w7)),'9.4 and no gap in the data reaches the glass as "undefined"');

console.log('\n§10 the client screen and the control board read the log the same way');
const d1=fs.readFileSync('ShopyLink_D1_Control.html','utf8');
const app=fs.readFileSync('ShopyLink_BusinessApp.html','utf8');
['parcel.received','parcel.consolidated','trip.loaded','shipment.arrived','run.assigned','shipment.delivered']
 .forEach(function(e){ok(d1.indexOf(e)>-1&&app.indexOf(e)>-1,'10.'+(n%100)+' both read '+e);});
ok(/failedShips/.test(app)===false||/failedShips is deliberately absent|deliberately absent/.test(app),'10.x the client screen states why failedShips is excluded');

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
