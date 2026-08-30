// The driver app: three things the office knew and he never did — whether his own
// papers let him cross, what is left of his float, and which note rides with him.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const c2=new JSDOM(fs.readFileSync('ShopyLink_Action_C2_Drivers.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const DREG=c2.localStorage.getItem('SL_DRIVERS_V1');
const mk=()=>{const w=new JSDOM(fs.readFileSync('ShopyLink_Driver_Trip.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
  w.localStorage.setItem('SL_DRIVERS_V1',DREG);w.render();return w;};
const signInAs=(win,d)=>{win.AUTH.phone=d.phone;win.sendCode();win.AUTH.code=win.AUTH.sent;win.verifyCode();win.render();};
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
let w=mk(); const d=()=>w.document; const body=()=>d().getElementById('body').textContent.replace(/\s+/g,' ');
const cs=s=>w.getComputedStyle(d().querySelector(s));

console.log('§1 it is a phone, not a page');
ok(cs('.phone').width==='390px'&&cs('.phone').height==='783px','a fixed 390 × 783 glass');
ok(cs('.phone').overflow==='hidden','…that clips, so overflow reads as a fault');
ok(cs('.framewrap').borderRadius==='46px'&&cs('.phone').borderRadius==='34px','bezel 46 over glass 34, differing by the 12px padding');
ok(cs('.sb').height==='48px'&&/9:41/.test(d().querySelector('.sb').textContent),'a 48px status bar takes its room first');
const src=fs.readFileSync('ShopyLink_Driver_Trip.html','utf8');
const inner=src.slice(src.indexOf('nothing below this line'),src.indexOf('</style>'));
const widths=(inner.match(/width:\s*\d+px/g)||[]);
ok(widths.length===1&&/10px/.test(widths[0]),'no layout box states a pixel width — only a 10px dot, which is an ornament not a column');
ok(/--ctl-h:46px/.test(src)&&/\.btn\{[^}]*height:var\(--ctl-h\)/.test(src.replace(/\s+/g,'')),'46px tap targets — a driver taps with a glove on');
ok(/overflow-wrap:anywhere/.test(src),'…and long values break in their cell rather than pushing off the glass');

console.log('§2 he signs in on his own phone, with a code');
ok(/Sign in/.test(body()),'it opens on a sign-in, not a list of names');
ok(!/Samer Haddad|Yara Salem/.test(body()),'…and names nobody before they have identified themselves');
const drv=w.drivers()[0];
w.AUTH.phone='+963 999 000 111';
ok(w.sendCode().ok===false,'a number on no driver record is refused');
w.AUTH.phone=drv.phone;
ok(w.sendCode().ok===true,'his own number is accepted');
ok(w.AUTH.sent&&w.AUTH.sent.length===6,'…and a six-digit code is issued');
w.AUTH.code='000000';
ok(w.verifyCode().ok===false,'a wrong code is refused');
w.AUTH.code=w.AUTH.sent;
ok(w.verifyCode().ok===true,'the right one signs him in');
ok(w.ME_ID===drv.id,'…as himself: '+w.me().name);
ok(/No trip assigned/.test(body()),'with no trip it says so rather than showing an empty shell');
ok(d().querySelectorAll('.tabs button').length===3,'three tabs, and no more: trip, papers, float');

console.log('§3 his papers — the ones that stop him at a post');
w.go('papers');
const bad=(drv.docs||[]).filter(x=>x.state==='red');
ok(/Licence|Passport/.test(body()),'every document is listed');
if(bad.length){
  ok(/needs attention/.test(body()),'an expired document is raised, not buried: '+bad[0].kind);
  ok(/cannot be assigned/.test(body()),'…and it says what that costs him — no trip until it is renewed');
}else{
  ok(/in order/.test(body()),'papers in order says so');
}
const good=w.drivers().filter(x=>(x.docs||[]).every(y=>y.state==='green'))[0];
if(good){ signInAs(w,good); w.go('papers');
  ok(/in order/.test(body()),'…and a clean driver is told he is clear: '+good.name); }

console.log('§4 his float — the money he is answerable for');
w=mk(); signInAs(w,w.drivers()[0]); w.go('money');
ok(/No float issued/.test(body()),'with no float it tells him to see the office before leaving');
w.localStorage.setItem('SL_FLOAT_V1',JSON.stringify({floats:{}}));
const nm=w.drivers()[0].name;
w.localStorage.setItem('SL_FLOAT_V1',JSON.stringify({floats:(function(o){o[nm]={taken:500,spent:120};return o;})({})}));
w.render();
ok(/380/.test(body()),'given 500, spent 120, and what it leads with is 380 — what is left with him');
ok(/500/.test(body())&&/120/.test(body()),'…with both halves shown beneath');
ok(/receipts|الإيصالات/.test(body()),'…and a reminder that every crossing fee comes off it');

console.log('§5 the trip and the note that rides with him');
const tj=new JSDOM(fs.readFileSync('ShopyLink_Action_05_TripJourney.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
tj.go('s2-pre');   // a trip must be open before its note can be published
tj.publishCMR();
const cmr=JSON.parse(tj.localStorage.getItem('SL_CMR_V1'));
w=mk();
cmr.driver=w.drivers()[0].name;                 /* the trip is his */
w.localStorage.setItem('SL_CMR_V1',JSON.stringify(cmr));
signInAs(w,w.drivers()[0]);
ok(/TRP-/.test(body()),'his trip appears: '+(body().match(/TRP-[0-9-]+/)||[''])[0]);
ok(new RegExp(cmr.truck).test(body()),'…with the truck he is driving');
ok(cmr.legs.every(function(l){return body().indexOf(l)>-1;}),'…and every crossing he will pass, in order');
ok(/consignment note|بوليصة/i.test(body()),'…and the note number he carries');
ok(typeof w.openNote==='function','…which he can open');

console.log('§6 somebody else\u2019s trip is not his');
const w2=mk();
cmr.driver='Not This Person';
w2.localStorage.setItem('SL_CMR_V1',JSON.stringify(cmr));
signInAs(w2,w2.drivers()[0]);
ok(/No trip assigned/.test(w2.document.getElementById('body').textContent),'a note published for another driver does not show as his');

console.log('§7 Arabic, and the machine values that must not flip');
w.setLang('ar');
ok(d().documentElement.dir==='rtl','the app flips to Arabic');
ok(/الرحلة|الأوراق|السلفة/.test(d().getElementById('tabs').textContent),'…tabs and all');
ok(/TRP-/.test(body()),'…while the trip number stays Latin (B3)');
console.log('§8 the float he sees is the one the office set');
const b5=new JSDOM(fs.readFileSync('ShopyLink_Action_B5_BorderFees.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const w3=mk();
const him=w3.drivers()[0].name;
/* the float is issued at the departing hub, not at a border (the user's ruling) */
const b4f=new JSDOM(fs.readFileSync('ShopyLink_Action_04_Loading.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
b4f.issueFloat(him,500);
b5.localStorage.setItem('SL_FLOAT_V1',b4f.localStorage.getItem('SL_FLOAT_V1'));
const cr=b5.CROSS[0];
b5.settleCross(cr.id,'driver');
cr.paidDriver=him;
b5.publishFloats();
w3.localStorage.setItem('SL_FLOAT_V1',b5.localStorage.getItem('SL_FLOAT_V1'));
signInAs(w3,w3.drivers()[0]);
w3.go('money');
const mb=()=>w3.document.getElementById('body').textContent.replace(/\s+/g,' ');
ok(/500/.test(mb()),'he sees what he was given: 500');
ok(new RegExp(String(b5.crossTotal(cr))).test(mb()),'…what he has paid out at crossings: '+b5.crossTotal(cr));
ok(new RegExp(String(500-b5.crossTotal(cr))).test(mb()),'…and the balance leads: '+(500-b5.crossTotal(cr)));
ok(b5.floatLeft(him)===500-b5.crossTotal(cr),'the office and the driver read the SAME number — spent is derived from the crossings, not kept twice');

console.log('§9 the sign-in holds up where it matters');
let a=mk(); const dd=a.drivers()[0];
a.AUTH.phone=dd.phone; a.sendCode();
a.AUTH.expires=new Date().getTime()-1; a.AUTH.code=a.AUTH.sent;
ok(a.verifyCode().why==='expired','a code past its two minutes is refused even when correct');
a=mk(); a.AUTH.phone=dd.phone; a.sendCode(); a.AUTH.code='111111';
a.verifyCode(); a.verifyCode();
ok(a.verifyCode().why==='tooMany','three wrong guesses end the attempt');
ok(a.AUTH.step==='phone'&&!a.AUTH.sent,'…and the code is discarded, not left waiting');
a=mk(); a.AUTH.phone='0'+String(dd.phone).replace(/[^0-9]/g,'').slice(-9);
ok(a.sendCode().ok===true,'the same number written without a country code still works');
const off=a.drivers().filter(function(x){return x.status!=='active';})[0];
if(off){ a=mk(); a.AUTH.phone=off.phone;
  ok(a.sendCode().why==='notActive','an inactive driver is sent to the office, not signed in'); }
const src2=fs.readFileSync('ShopyLink_Driver_Trip.html','utf8');
ok(/no SMS gateway/.test(src2),'the screen says plainly that the code is a prototype stub, rather than pretending an SMS was sent');

console.log('§10 opened alone, it still works');
const solo=new JSDOM(fs.readFileSync('ShopyLink_Driver_Trip.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
ok(solo.drivers().length>0,'with no registry published it falls back to a seed: '+solo.drivers().length+' drivers');
const s1=solo.drivers()[0];
solo.AUTH.phone=s1.phone;
ok(solo.sendCode().ok===true,'…so a number is recognised and the sign-in is usable — it refused every number before this');
solo.AUTH.code=solo.AUTH.sent;
ok(solo.verifyCode().ok===true&&solo.me().name===s1.name,'…and he gets in: '+solo.me().name);
const withReg=mk();
ok(withReg.drivers().length===JSON.parse(DREG).drivers.length,'…and when C2 has published, the office list wins over the seed');
/* a fresh window: solo is signed in by now and shows his trip, not the gate */
const gate2=new JSDOM(fs.readFileSync('ShopyLink_Driver_Trip.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const gt=gate2.document.getElementById('body').textContent.replace(/\s+/g,' ');
ok(/tap a number to try it|انقر رقمًا/.test(gt),'the sign-in offers the seeded numbers, so nobody has to be told them');
ok(/Prototype/.test(gt),'…marked as a prototype affordance, not a feature');
ok(/\+963/.test(gt),'…the numbers themselves are shown');
ok(!/Samer Haddad|Yara Salem/.test(gt),'…and still nobody is named before signing in');

console.log('§11 a browser carrying old data still lets him in');
const stale=new JSDOM(fs.readFileSync('ShopyLink_Driver_Trip.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
stale.localStorage.setItem('SL_DRIVERS_V1',JSON.stringify({at:1,drivers:[
 {id:'DRV-01',name:'Samer Haddad',hub:'H-DAM',status:'active',docs:[{kind:'Licence',exp:'2027-01-01',state:'green'}]},
 {id:'DRV-02',name:'Yara Salem',hub:'H-DAM',status:'active',docs:[]}]}));
stale.render();
ok(stale.drivers().every(function(d){return !!d.phone;}),'a registry published before phones existed is COMPLETED, not trusted blindly');
stale.AUTH.phone='+963 944 210 118';
ok(stale.sendCode().ok===true,'…so the sign-in works in a browser holding yesterday\u2019s data');
ok(stale.drivers()[0].docs.length===1,'…and the office record is kept — only the missing number is borrowed');
const cur=mk();
ok(cur.drivers().length===JSON.parse(DREG).drivers.length&&cur.drivers()[0].phone,'a current registry wins outright');

console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
