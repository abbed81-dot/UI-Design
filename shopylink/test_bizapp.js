// Individuals are priced at the counter — a fixed list, nothing to approve. A
// business account is the opposite: the price was quoted for this job, and someone
// with authority accepts it or says what is wrong with it. Two apps, two jobs.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§1 the individual app carries no pricing decisions');
const ind=mk('ShopyLink_App_Combined_Designed_v2.html');
ok(typeof ind.clientQuotes==='undefined','no quotation engine in the consumer app');
ok(typeof ind.answerQuote==='undefined','…nothing there can approve a price');
ok(typeof ind.render==='function','…and it still works');
const b9chk=mk('ShopyLink_Action_09_Billing.html');
ok(b9chk.newQuote({type:'individual',ship:'X',customer:'Y'}).ok===false,'and billing refuses to quote an individual at all');

console.log('§2 billing sends a quotation to the business app');
const b9=mk('ShopyLink_Action_09_Billing.html');
const d9=b9.document, btn=re=>[...d9.querySelectorAll('#shell button')].find(x=>re.test(x.textContent.trim()));
b9.go('q'); b9.openNewClient();
b9.ncSet('name','Aleppo Textiles'); b9.ncKind('business'); b9.ncSet('company','Aleppo Textiles LLC');
b9.ncCountry('SY'); b9.ncSet('city','Aleppo'); b9.ncSet('phone','21 555 0100'); b9.ncSet('email','a@b.com');
d9.getElementById('nc-save').click();
b9.qSet('from','Guangzhou'); b9.qSet('dest','Damascus'); b9.qSetField('method','sea');
b9.qSet('goods','cotton textiles'); b9.qSet('cartons','40'); b9.qSet('weight','1250'); b9.qSet('volume','8.4');
b9.qPickService('Sea freight — 40ft container'); b9.qSetNewQuiet('price','2400'); d9.getElementById('q-add').click();
b9.qPickService('Customs clearance'); b9.qSetNewQuiet('price','200'); d9.getElementById('q-add').click();
b9.qGo(3); btn(/Issue/).click();
ok(!b9.localStorage.getItem('SL_QUOTES_BIZ_V1'),'issuing alone sends nothing (F20)');
btn(/WhatsApp/).click(); b9.modalOk();
const sent=JSON.parse(b9.localStorage.getItem('SL_QUOTES_BIZ_V1')).quotes;
ok(sent.length===1&&sent[0].lines.length===2,'sending puts it in the business app, priced');

console.log('§3 the business client reads it whole');
const app=mk('ShopyLink_BusinessApp.html');
app.localStorage.setItem('SL_QUOTES_BIZ_V1',b9.localStorage.getItem('SL_QUOTES_BIZ_V1'));
app.render();
const txt=()=>app.document.getElementById('app').textContent.replace(/\s+/g,' ');
ok(/2,600.00 USD/.test(txt()),'the total: 2,600.00 USD');
ok(/Guangzhou → Damascus/.test(txt())&&/1250 kg/.test(txt()),'the route and the cargo it was priced for');
ok(/Sea freight/.test(txt())&&/Customs clearance/.test(txt()),'…and every line, so the price is not a lump');

console.log('§4 accept, or say what is wrong with it');
const qid=sent[0].id;
ok(app.discussQuote(qid,'').ok===false,'discussing needs something said');
ok(app.discussQuote(qid,'the sea rate is above the market this month').ok===true,'…and then it is a thread, not a rejection');
const q=app.quoteById(qid);
ok(q.thread.length===1&&q.answer==='no','the objection is kept on the quotation');
app.render();
ok(/above the market/.test(txt()),'…and the client can see what they said');
const evs=JSON.parse(app.localStorage.getItem('SL_EVENTS_V1')||'[]');
ok(evs.some(e=>e.type==='quote.answered'&&/above the market/.test(e.payload.why)),'the office is told, with the reason');

console.log('§5 an acceptance is final, an expired price is not acceptable');
const app2=mk('ShopyLink_BusinessApp.html');
app2.localStorage.setItem('SL_QUOTES_BIZ_V1',JSON.stringify({quotes:[
 {id:'QA',customer:'X',validUntil:'2099-01-01',lines:[{name:'a',amt:50,cur:'USD'}]},
 {id:'QB',customer:'X',validUntil:'2020-01-01',lines:[{name:'b',amt:10,cur:'USD'}]}]}));
ok(app2.acceptQuote('QA').ok===true,'a live price is accepted');
ok(app2.acceptQuote('QA').ok===false,'…once');
ok(app2.discussQuote('QA','actually no').ok===false,'…and an accepted price is not reopened by a message');
ok(app2.acceptQuote('QB').ok===false,'an expired price cannot be accepted at all');

console.log('§6 the office sees the answer');
const b9b=mk('ShopyLink_Action_09_Billing.html');
b9b.localStorage.setItem('SL_EVENTS_V1',app.localStorage.getItem('SL_EVENTS_V1'));
b9b.QUOTES.push({id:qid,customer:'Aleppo Textiles',status:'review',lines:[],validUntil:'2099-01-01',by:''});
b9b.applyClientAnswers();
ok(b9b.QUOTES[0].clientSaidNo,'the objection lands on the quotation in billing');
ok(/above the market/.test(b9b.QUOTES[0].clientWhy||''),'…carrying why, so the requote is informed');
console.log('§7 it is a phone, not a page');
const ui=mk('ShopyLink_BusinessApp.html');
const cs=s=>ui.getComputedStyle(ui.document.querySelector(s));
ok(cs('.phone').width==='390px'&&cs('.phone').height==='783px','the glass is a fixed 390 × 783');
ok(cs('.phone').overflow==='hidden','…and clips, so overflow reads as a fault');
ok(cs('.framewrap').borderRadius==='46px'&&cs('.phone').borderRadius==='34px','bezel 46 over glass 34, differing by the 12px padding');
ok(cs('.sb').height==='48px'&&/9:41/.test(ui.document.querySelector('.sb').textContent),'a 48px status bar takes its room before the app starts');
const bsrc=fs.readFileSync('ShopyLink_BusinessApp.html','utf8');
const inner=bsrc.slice(bsrc.indexOf('the app, inside the glass'),bsrc.indexOf('</style>'));
ok((inner.match(/width:\s*\d+px/g)||[]).length===0,'nothing inside the glass states a pixel width');
ok(/--ctl-h:\s*44px/.test(bsrc)&&/\.btn\{[^}]*height:var\(--ctl-h\)/.test(bsrc.replace(/\s+/g,'')),'every action is a 44px tap target');
ok(/overflow-wrap:anywhere/.test(bsrc),'…and a long service name breaks in its cell rather than pushing the price off the screen');

console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
