const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const dom=new JSDOM(fs.readFileSync('ShopyLink_D1_Control.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
const w=dom.window,d=w.document;const sh=()=>d.getElementById('shell').innerHTML;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§71 a role is one person PER HUB');
ok(w.HUBS.length>=5,'71.1 the hubs exist: Damascus, Aleppo, Istanbul, Dubai, Guangzhou');
ok(w.PEOPLE.every(p=>p.hub),'71.2 every person belongs to a hub');
ok(w.peopleAt('CAN').length>0&&w.peopleAt('IST').length>0,'71.3 the outside hubs are staffed');
ok(w.readerOfRole('docs','DAM').name==='Rana Yousef','71.4 @documentation at Damascus is Rana');
ok(w.readerOfRole('docs','CAN').name==='Layla Faour','71.5 @documentation at Guangzhou is a different person entirely');
ok(w.readerOfRole('wh','CAN').name==='Wei Chen'&&w.readerOfRole('wh','DAM').name==='Khaled Omar','71.6 the same holds for the warehouse');
ok(w.roleHasHub('docs','CAN')===true&&w.roleHasHub('docs','ALP')===false,'71.7 the system knows which hub actually holds a role');

console.log('§72 when the hub has nobody, it says so — it does not pretend');
const r=w.readerOfRole('docs','ALP');
ok(!!r,'72.1 the message still reaches somebody rather than vanishing');
ok(r.elsewhere===true,'72.2 …but it is flagged as reaching someone outside the hub you chose');
ok(r.hub==='DAM','72.3 …and it names where they actually are');
ok(w.readerOfRole('docs','DAM').elsewhere===false,'72.4 no flag when the hub does hold the role');
ok(w.readerOfRole('nosuchrole','DAM')===null,'72.5 a role nobody holds returns nothing, not a wrong person');

console.log('§73 the message carries its hub');
w.pickRecord('SL-9603');
const res=w.postMessage({ref:'SL-9603',roles:['wh'],hub:'CAN',text:'weigh and photograph before stuffing'});
ok(res.ok===true&&res.msg.hub==='CAN','73.1 the hub is stored on the message');
ok(res.readers[0]==='Wei Chen','73.2 …and it decided who reads it');
const res2=w.postMessage({ref:'SL-9603',roles:['wh'],hub:'DAM',text:'same role, different city'});
ok(res2.readers[0]==='Khaled Omar','73.3 the same role at another hub reaches another person');
ok(w.messageReaders(res.msg)[0].name==='Wei Chen','73.4 re-reading an old message still resolves to its own hub');
const rep=w.postMessage({replyTo:res.msg.id,text:'a reply inherits the hub too'});
ok(rep.ok===true&&rep.msg.hub==='CAN','73.5 a reply inherits the hub, not just the record');

console.log('§74 it survives absence and turns into work correctly');
w.setActor('U-10');
w.setOOO('U-10','U-09',2,'travelling to the port');
const away=w.readerOfRole('docs','CAN');
ok(away.name==='Wei Chen'&&away.viaDelegate==='Layla Faour','74.1 with the hub holder away it resolves to the delegate, and names who they stand in for');
w.endOOO('U-10');
const m3=w.postMessage({ref:'SL-9603',roles:['wh'],hub:'CAN',text:'take the measurement today'}).msg;
const tk=w.toTask(m3.id,w.DAY);
ok(tk.ok===true&&tk.task.owner==='U-09','74.2 turning it into a task gives it to the person at THAT hub');
ok(w.queueFor('wh').indexOf(tk.task)>-1,'74.3 …and it enters the same engine');

console.log('§75 the screen');
w.go('s8');w.pickRecord('SL-9603');w.cmRole('docs');w.cmSet('hub','CAN');w.render();
ok(/Guangzhou|غوانزو/.test(sh()),'75.1 the hub chips are on the composer');
ok(/Layla Faour/.test(sh()),'75.2 the composer names who will actually read it, before you post');
w.cmSet('hub','ALP');w.render();
ok(/not at|ليس في/.test(sh()),'75.3 choosing a hub with nobody in that role warns you where it will land instead');
w.cmSet('hub','CAN');w.render();
ok(!/not at/.test(sh()),'75.4 …and the warning clears when it resolves cleanly');
ok(/viewBox="0 0 24 24"/.test(sh())&&/Guangzhou|غوانزو|Damascus|دمشق/.test(sh()),'75.5 posted messages show their hub, marked with our pin icon rather than an emoji');
w.setLang('ar');w.render();
ok(/غوانزو/.test(sh())&&/في/.test(sh()),'75.6 AR twin');
w.setLang('en');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
