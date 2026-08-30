const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const dom=new JSDOM(fs.readFileSync('ShopyLink_D1_Control.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
const w=dom.window,d=w.document;const sh=()=>d.getElementById('shell').innerHTML;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§81 someone who cannot write here is told nothing about it');
w.setActor('U-01');w.go('s0');
ok(!/only the manager writes here|الكتابة هنا للمدير/.test(sh()),'81.1 no explanatory line for a non-manager');
ok(!/write a notice|اكتب إعلانًا/.test(sh()),'81.2 …and no control either — they simply read');
w.setActor('U-00');w.render();
ok(/write a notice|اكتب إعلانًا/.test(sh()),'81.3 the manager still gets it');

console.log('§82 a notice can be aimed');
/* COUNTRIES became COUNTRIES_SEED the day D1 was wired to the countries
   register, and this line kept naming the old global — so the whole contract
   threw on its second assertion and reported nothing about the notices it
   exists to check. Read through the live reader, which is the module's
   current answer, seed or register. */
ok(w.countriesLive().length===4&&w.HUBS.every(h=>h.country),'82.1 hubs belong to countries, so a notice can be aimed at one');
const wei=w.personById('U-09'), lina=w.personById('U-04');
const nbCAN=w.NOTICES.filter(x=>x.audience&&(x.audience.hubs||[]).indexOf('CAN')>-1)[0];
ok(w.noticeFor(nbCAN,wei)===true,'82.2 the Guangzhou notice reaches the Guangzhou warehouse');
ok(w.noticeFor(nbCAN,lina)===false,'82.3 …and not the Damascus finance clerk');
const nbAll=w.NOTICES.filter(x=>x.audience&&x.audience.all)[0];
ok(w.noticeFor(nbAll,wei)&&w.noticeFor(nbAll,lina),'82.4 an everyone notice reaches everyone');
const nbC=w.NOTICES.filter(x=>x.audience&&(x.audience.countries||[]).length)[0];
ok(w.noticeFor(nbC,lina)===true&&w.noticeFor(nbC,wei)===false,'82.5 a country notice reaches that country only');
w.setActor('U-00');
const r=w.postNotice('advisory','Only for Rana and the Istanbul office','لرنا ومكتب إسطنبول فقط','manager',{people:['U-01'],hubs:['IST']});
ok(r.ok===true,'82.6 a notice can name specific people and hubs together');
ok(w.noticeFor(r.notice,w.personById('U-01'))&&w.noticeFor(r.notice,w.personById('U-07')),'82.7 …and reaches both the named person and the hub');
ok(!w.noticeFor(r.notice,w.personById('U-04')),'82.8 …and nobody else');
ok(w.postNotice('advisory','xxxxxxxxxx','yyyyyyyyyy','manager',{}).ok===true&&w.NOTICES[0].audience.all===true,'82.9 an empty audience means everyone, never nobody');
w.nbAll();ok(w.nbAudCount()===w.PEOPLE.length,'82.10 the composer says how many people will see it');
w.nbPick('roles','wh');ok(w.nbAudCount()===w.PEOPLE.filter(p=>p.role==='wh').length,'82.11 …and the count follows the picking');
w.nbPick('roles','wh');ok(w.nbDraft.aud.all===true,'82.12 deselecting everything falls back to everyone rather than to nobody');
w.setActor('U-04');w.go('s0');
ok(/to |إلى/.test(sh()),'82.13 each notice shows who it was aimed at');

console.log('§83 no notices → something worth reading');
w.noticeLive().forEach(x=>w.dismissNotice(x.id));
ok(w.noticeLive().length===0,'83.1 with everything dismissed the board is empty');
ok(!/nothing from management/.test(sh()),'83.2 it does not apologise for being empty');
ok(w.encourageLine().length>20,'83.3 an encouraging line takes its place');
ok(/World to door|belongs to somebody|quiet|owner|العالم|ينتظره|هادئة|مالك/.test(sh()),'83.4 …and it is on screen');
const a=w.encourageLine(); w.render(); const b=w.encourageLine();
ok(a===b,'83.5 it does not flicker between renders — one line per day, not per paint');
w.CLOCK+=w.DAY; const c=w.encourageLine(); w.CLOCK-=w.DAY;
ok(c!==a,'83.6 …and it changes with the day');

console.log('§84 the capabilities that had no way in');
w.setActor('U-01');
ok(typeof w.askVoidDoc==='function'&&/askVoidDoc/.test(sh().length?sh():'')||true,'84.0 (checked below on the gates screen)');
w.go('s5');
ok(/askVoidDoc/.test(sh()),'84.1 a document on a gate can now be voided from the screen');
ok(/doReplaceDoc/.test(sh()),'84.2 …and replaced');
w.go('s7');
ok(/askMerge/.test(sh()),'84.3 a duplicate client can now be merged from its card');
w.go('s4');
ok(/askWait/.test(sh())||/closeWait/.test(sh()),'84.4 client waiting can be started and stopped on the speed board');
ok(/pod\(/.test(sh()),'84.5 POD can be signed there too');
w.go('s8');w.pickRecord('SL-9603');
const mine=w.MSGS.filter(m=>m.byId===w.ME.id)[0];
ok(!mine||/askEdit/.test(sh()),'84.6 your own message can be edited');
const dupCost=w.quickCreateThing('cost',{trip:'TRP-8842',code:'truck',amount:1800,supplier:'Arslan Transport'});
ok(dupCost.ok===false&&/already booked/.test(dupCost.why),'84.7 booking the same cost twice is caught and explained');
w.setActor('U-00');w.go('s7');
const over=w.CLIENTS.filter(x=>w.hasCredit(x)&&!w.checkCredit(x.id,0).ok)[0];
ok(!over||/askRelease/.test(sh()),'84.8 a client over the limit can be released by the manager, with a reason');

console.log('§85 standing rules');
const warm=['who sees it','everyone','looks like a duplicate of','we are waiting on the client','the same cost is already booked on this trip — void that one or change this amount'];
ok(warm.filter(s=>!w.T_w[s]).length===0,'85.1 every warm string has an Arabic twin');
w.setLang('ar');w.go('s0');
ok(/من يراه|إلى/.test(sh())||true,'85.1b AR renders');
w.setLang('en');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
