// A quotation promises; an invoice demands. Same sheet, different obligations.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const src=fs.readFileSync('ShopyLink_Doc_Quotation.html','utf8');
const w=mk('ShopyLink_Doc_Quotation.html'), d=w.document;
const sheet=()=>d.querySelector('.sheet').textContent.replace(/\s+/g,' ');

console.log('§137 the brand comes from the asset, never from markup');
const pay=s=>(s.match(/data:image\/png;base64,[A-Za-z0-9+/=]{200,}/g)||[]);
const mine=pay(src), inv=pay(fs.readFileSync('ShopyLink_Doc_Invoice.html','utf8'));
ok(mine.length===inv.length&&mine.every((x,i)=>x===inv[i]),'all '+mine.length+' logo payloads byte-identical to the invoice (A1)');
ok(d.querySelectorAll('img.lockup').length>0,'the lockup is an <img>, not drawn');

console.log('§138 it is a quotation, not an invoice with a new title');
ok(/QUOTATION/.test(sheet())&&!/INVOICE/.test(sheet()),'it says QUOTATION and never INVOICE');
ok(/Valid until/.test(sheet()),'it carries a validity date');
ok(!/Due date/.test(sheet()),'…and no due date, because nothing is owed yet');
ok(!/Paid to date/.test(sheet()),'…and nothing claims to have been paid');
ok(/Prepayment on acceptance/.test(sheet()),'it states what is due if they accept');
ok(d.querySelectorAll('.acc-line').length===2,'both sides have somewhere to sign');

console.log('§139 the terms protect both sides');
ok(/not part of this figure/.test(sheet()),'it says plainly what the price does NOT cover');
ok(/requoted/.test(sheet()),'…that the price expires rather than lapsing silently');
ok(/recalculated on what actually arrives/.test(sheet()),'…and what happens if the cargo differs');
ok(/told before anything moves/.test(sheet()),'…with the client told before, not after');
ok(/booking, not a debt/.test(sheet()),'acceptance opens a booking, not a debt');
ok(/Business accounts only/.test(sheet()),'and it states the rule: quotations are for business accounts');

console.log('§140 the Arabic carries the meaning');
const textual=sel=>[...d.querySelectorAll(sel)].filter(e=>e.tagName!=='IMG'&&!e.querySelector('img'));
ok(textual('.en-t').length===textual('.ar-t').length,textual('.en-t').length+' text pairs, matched');
ok(textual('.en-t').every(e=>e.textContent.trim())&&textual('.ar-t').every(e=>e.textContent.trim()),'no half-translated pair');
w.toggleLang();
ok(d.body.classList.contains('rtl'),'Arabic switches the sheet to RTL');
ok(textual('.en-t').every(e=>w.getComputedStyle(e).display==='none'),'…and hides every English string');
ok(/عرض سعر/.test(sheet())&&/صالح حتى/.test(sheet()),'the Arabic reads as a quotation with a validity');
ok(/أرضيات/.test(sheet()),'trade Arabic: أرضيات, not a literal rendering of demurrage (B5)');
ok(/مهلة السماح/.test(sheet()),'…and مهلة السماح for free time');
ok(/QTN-24-0207/.test(sheet()),'the reference keeps its Latin form under RTL (B2)');
ok(d.querySelectorAll('.mark .ar-t').length>0,'and the Arabic lockup replaces the English one (A3)');

console.log('§148 the lockup: slogan bigger, rules beside the words');
const enPay=fs.readFileSync('assets/lockup_en.png').toString('base64');
const arPay=fs.readFileSync('assets/lockup_ar.png').toString('base64');
['ShopyLink_Doc_Quotation.html','ShopyLink_Doc_Invoice.html'].forEach(function(p){
  const ww=mk(p), dd=ww.document, tag=p.replace('ShopyLink_Doc_','').replace('.html','');
  const enImg=dd.querySelector('img.lockup.en-t'), arImg=dd.querySelector('img.lockup-ar-word');
  ok(enImg&&enImg.src.split(',')[1]===enPay,tag+': the English lockup is the rebuilt one');
  ok(arImg&&arImg.src.split(',')[1]===arPay,tag+': the Arabic lockup too');
  ok(!dd.querySelector('.lockup-ar-slogan'),tag+': the separate Arabic slogan image is gone — one lockup, not two pieces');
});
console.log('§149 the sheet draws the quotation it was opened for');
const payload=JSON.stringify({id:'QTN-24-0301',customer:'Aleppo Textiles',status:'review',validUntil:'2026-09-07',
  lines:[{name:'Customs clearance',amt:200,cur:'USD'},{name:'Handling',amt:40,cur:'USD'}]});
const live=new JSDOM(fs.readFileSync('ShopyLink_Doc_Quotation.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()});
live.window.localStorage.setItem('SL_QUOTE_V1',payload);
live.window.eval(fs.readFileSync('ShopyLink_Doc_Quotation.html','utf8').match(/<script>[\s\S]*?<\/script>/g).map(x=>x.replace(/<\/?script>/g,'')).join('\n'));
const lt=live.window.document.querySelector('.sheet').textContent.replace(/\s+/g,' ');
ok(/QTN-24-0301/.test(lt),'the number is the published one, not the specimen');
ok(/Aleppo Textiles/.test(lt)&&!/TechLine Trading/.test(lt),'the client is the published one');
ok(/Customs clearance/.test(lt)&&/Handling/.test(lt),'the priced lines are the published ones');
ok((lt.match(/240\.00/g)||[]).length>=2,'…and the total follows them');
ok(!/1,361\.80/.test(lt),'no specimen figure survives');

console.log('§150 with nothing published it stays a specimen, and says so');
const spec=mk('ShopyLink_Doc_Quotation.html');
ok(/specimen/.test(spec.document.querySelector('.bar .h').textContent),'the chrome says it is a specimen — it does not pretend to be somebody\u2019s quotation');
ok(!!spec.document.querySelector('.sheet'),'…and the design is still there to be judged');

console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
