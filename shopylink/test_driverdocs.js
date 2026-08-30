// A driver is not assignable because a name exists. A licence that expired
// yesterday stops the truck at the first post, with the cargo aboard.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§1 C2 owns the documents and publishes them');
const c2=mk('ShopyLink_Action_C2_Drivers.html');
const reg=c2.slDriversRead();
ok(reg&&reg.length>0,'the registry carries '+(reg?reg.length:0)+' drivers');
ok(reg.every(d=>d.docs&&d.docs.length),'…each with their documents');
ok(reg.every(d=>d.docs.every(x=>x.state)),'…each document with a state, computed from its expiry');
ok(reg.some(d=>d.docs.some(x=>/^Visa /.test(x.kind))),'…including a visa per country');
ok(reg.every(d=>'onLeave' in d),'…and whether the driver is away');

console.log('§2 B3 refuses whoever cannot legally travel');
const b3=mk('ShopyLink_Action_03_CreateTrip.html');
b3.localStorage.setItem('SL_DRIVERS_V1',c2.localStorage.getItem('SL_DRIVERS_V1'));
const good=b3.slDriversRead().filter(d=>d.worst==='green')[0];
const bad =b3.slDriversRead().filter(d=>d.worst==='red')[0];
ok(b3.driverAssignable(good.id)===true,good.name+': papers in order');
ok(b3.driverAssignable(bad.id)===false,bad.name+': refused');
const why=b3.driverBlockers(bad.id).filter(x=>x.hard).map(x=>x.why);
ok(why.length>0,'…and the refusal names the document: '+why.join(' · '));
ok(/expired|leave/.test(b3.driverNote(bad.id)),'…in words a dispatcher can act on');

console.log('§3 a visa is judged against the route, not in the abstract');
const mid=b3.slDriversRead().filter(d=>d.docs.some(x=>/^Visa Turkey/.test(x.kind)))[0];
b3.st.borders=[];
ok(b3.driverBlockers(mid.id).every(x=>!/no visa/.test(x.why)),'with no route chosen no visa is demanded');
b3.st.borders=[{id:'B',name:'UAE Exit',country:'UAE'}];
ok(b3.driverBlockers(mid.id).some(x=>/UAE/.test(x.why)&&x.hard),'a route through the UAE raises his UAE visa — held, but expired, which is the same wall at the post');
ok(b3.driverAssignable(mid.id)===false,'…so he is refused for this route');
b3.st.borders=[{id:'B',name:'Turkey Entry',country:'Turkey'}];
ok(b3.driverBlockers(mid.id).every(x=>!/no visa for Turkey/.test(x.why)),'…and the same driver is not faulted for Turkey, which he holds');
const noKsa=b3.slDriversRead().filter(d=>!d.docs.some(x=>/Visa KSA|Visa Saudi/.test(x.kind)))[0];
b3.st.borders=[{id:'B',name:'Saudi Entry',country:'KSA'}];
ok(b3.driverBlockers(noKsa.id).some(x=>/no visa for KSA/.test(x.why)),'a country he holds no visa for at all is named as missing');

console.log('§4 an expiry that has not happened yet is a warning, not a bar');
const amber=b3.slDriversRead().filter(d=>d.worst==='amber')[0];
if(amber){
  b3.st.borders=[];
  const bl=b3.driverBlockers(amber.id);
  ok(bl.some(x=>!x.hard),'a document expiring soon is raised…');
  ok(b3.driverAssignable(amber.id)===true,'…but does not stop the trip: '+amber.name);
}

console.log('§5 with no registry the dispatcher still dispatches');
const bare=mk('ShopyLink_Action_03_CreateTrip.html');
ok(bare.slDriversRead()===null,'no registry published');
ok(bare.driverBlockers('D-001')===null,'…so the answer is unknown, not no');
ok(bare.driverAssignable('D-001')===true,'…and B3 works exactly as it did — a dispatcher who cannot dispatch is worse');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
