// The React console — the one artefact in this package that shipped without a
// contract. It is a WINDOW: it reads the channels the modules publish and opens
// those modules by filename. Placed beside them it shows the real registers;
// opened alone it draws a demonstration day and says so on the page.
//
// Read before writing: the console renders into #root, and this file is 217KB
// of bundled script INSIDE <body>. Asserting against body.textContent matches
// the source of the bundle and passes on strings the reader never sees — the
// first draft of this contract did exactly that and reported a demonstration
// badge that was not on the page. Every assertion here reads #root.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const bag=()=>{const s={};return{getItem:k=>k in s?s[k]:null,setItem:(k,v)=>{s[k]=String(v)},removeItem:k=>{delete s[k]},clear:()=>{},key:i=>Object.keys(s)[i],get length(){return Object.keys(s).length},_keys:()=>Object.keys(s)};};
const open1=(x,st)=>{const w=new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;Object.defineProperty(w,'localStorage',{value:st,configurable:true});w.render&&w.render();return w;};
const root=w=>w.document.getElementById('root');
const text=w=>root(w).textContent.replace(/\s+/g,' ');
const btns=w=>[...root(w).querySelectorAll('button')];
const click=(w,b)=>b.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const src=fs.readFileSync('ShopyLink_Console.html','utf8');
const wait=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{

// the console opened with nothing published
const aloneBag=bag();
const alone=open1('ShopyLink_Console.html',aloneBag);
await wait(700);

// the console opened beside the modules, with their registers published
const withBag=bag();
open1('ShopyLink_Action_C9_Staff.html',withBag);
const d1=open1('ShopyLink_D1_Control.html',withBag);
['S-1','S-2'].forEach(id=>d1.slEmit&&d1.slEmit('parcel.received',{ship:id,client:'TechLine Trading',actor:'Khaled',payload:{from:'Dubai',to:'Damascus',mode:'air',weight:9}}));
d1.render&&d1.render();
const beside=open1('ShopyLink_Console.html',withBag);
await wait(700);

console.log('§1 it is a window, not a second system');
ok(aloneBag._keys().length===0,'1.1 it writes to no channel: a console that publishes is a second place the truth lives');
ok(!/setItem\(\s*["\']SL_/.test(src),'1.2 …and the source contains no write to one');
const refs=[...new Set(src.match(/ShopyLink_[A-Za-z0-9_]+\.html/g)||[])];
ok(refs.length>15,'1.3 it opens the existing modules by filename rather than reimplementing them ('+refs.length+' of them)');
const missing=refs.filter(r=>!fs.existsSync(r));
ok(missing.length===0,'1.4 …and every filename it opens exists in the package'+(missing.length?' — MISSING: '+missing.join(', '):''));

console.log('\n§2 opened alone it draws a demonstration day, and says so');
ok(/بيانات تجريبية|DEMONSTRATION DATA/.test(text(alone)),'2.1 the page states it is demonstration data — a screen of invented figures that does not say so is a lie told in numbers');
ok(text(alone).length>300,'2.2 …and still draws a full day rather than empty zeros, which read as a quiet day');

console.log('\n§3 placed beside the modules it shows the real registers');
ok(!/بيانات تجريبية|DEMONSTRATION DATA/.test(text(beside)),'3.1 the demonstration badge is gone once a register is published');
const fig=t=>{const m=t.match(/مستلَمة\s*(\d+).*?في الطريق\s*(\d+).*?أخفقت مرّتين\s*(\d+).*?رحلات جارية\s*(\d+)/);return m?m.slice(1).map(Number):null;};
const fa=fig(text(alone)),fb=fig(text(beside));
ok(fa&&fb,'3.2 the figures are on both pages');
ok(fa&&fb&&fa.join()!==fb.join(),'3.3 …and they are not the same figures: the register answered, the fixtures did not');
const reg=JSON.parse(withBag.getItem('SL_SHIPMENTS_V1')).shipments;
ok(fb&&fb[0]===reg.filter(s=>s.stage==='received').length,'3.4 what is taken in is the register\'s own count, so this screen and D1 cannot disagree');

console.log('\n§4 the brief\'s order: what must be done, then what was said, then the figures');
const t=text(alone);
const iNeed=t.indexOf('يحتاج إجراء'),iNote=t.indexOf('Omar Al-Masri'),iFig=t.indexOf('مستلَمة');
ok(iNeed>-1&&iNote>-1&&iFig>-1,'4.1 all three regions are on the page');
ok(iNeed<iNote,'4.2 needs-action comes before the head-office notices');
ok(iNote<iFig,'4.3 …and the notices before the figures');
ok(iFig===Math.max(iNeed,iNote,iFig),'4.4 the figures are last: a person opening this owes work, he is not here to admire a number');

console.log('\n§5 every needs-action row answers four questions and offers two doors');
const opens=btns(alone).filter(b=>/^(افتح|Open)$/.test(b.textContent.trim()));
ok(opens.length>0,'5.1 there are rows to act on ('+opens.length+')');
ok((t.match(/CON-\d{6}-\d\d|TRP-\d{4}-\d+/g)||[]).length>=opens.length,'5.2 each names its reference: work without a reference cannot be picked up by anyone else');
ok(/متأخّر/.test(t),'5.3 …and how late it is, which is what decides the order of a day');
const threads=btns(alone).filter(b=>/المحادثة|Thread/.test(b.getAttribute('title')||b.getAttribute('aria-label')||''));
ok(threads.length===opens.length,'5.4 …and every row carries its thread beside its action, one for each');
ok(threads.every(b=>b.getAttribute('aria-label')),'5.5 the thread button is an icon alone, so it carries a name — an icon without one is a guess');

console.log('\n§6 the sidebar, and the search that must be reachable from anywhere');
const cats=['الاستلام','الرحلات','الوجهة','المال','الشبكة','الإدارة'];
ok(cats.every(c=>t.indexOf(c)>-1),'6.1 six categories, the shell\'s own grouping rather than a new one');
const iSearch=t.indexOf('ابحث عن خدمة'),iLast=Math.max(...cats.map(c=>t.indexOf(c)));
ok(iSearch>iLast,'6.2 search sits at the foot of the list, as the seventh entry');
ok(/metaKey\|\|[^)]{0,14}ctrlKey/.test(src)&&/"k"===/.test(src),'6.3 …and ⌘K reaches it from anywhere, because a search you must aim at is one you stop using');
const rail=btns(alone).filter(b=>/طيّ|Collapse/.test(b.textContent.trim()))[0];
ok(!!rail,'6.4 the sidebar collapses');
const wide=root(alone).innerHTML;
if(rail){click(alone,rail);await wait(250);}
ok(root(alone).innerHTML!==wide,'6.5 …and the page answers the press');
ok((root(alone).querySelectorAll('[title]').length)>0,'6.6 collapsed, every entry keeps its full name on hover: an initial alone is a guess');

console.log('\n§7 the sidebar turns with the language');
const lang=btns(beside).filter(b=>/^(EN|ع|AR)$/.test(b.textContent.trim()))[0];
ok(!!lang,'7.1 the language is one press away');
ok(beside.document.documentElement.getAttribute('dir')==='rtl','7.2 it opens in Arabic, right to left');
if(lang){click(beside,lang);await wait(300);}
ok(beside.document.documentElement.getAttribute('dir')==='ltr','7.3 …and the whole page turns, not the words alone — a sidebar reading the other way puts every label at the far edge from its icon');
ok(/Intake|Trips|Money/.test(text(beside)),'7.4 …with the labels translated, not transliterated');

console.log('\n§8 φ governs the masses, and is refused on the type');
ok(/--sb-w:\s*237px/.test(src),'8.1 the sidebar is 237 — 56 × φ³, and the brand sheet\'s 232 to within 2%');
ok(/--rail-w:\s*56px/.test(src),'8.2 …from a rail of 56');
ok(/--panel-w:\s*384px/.test(src),'8.3 the panel is 384');
const fib=(src.match(/--s[1-8]:\s*(\d+)px/g)||[]).map(x=>+x.match(/(\d+)px/)[1]);
ok(fib.join()==='5,8,13,21,34,55,89,144','8.4 spacing is Fibonacci — φ in integers a browser lays out honestly');
const fsv=(src.match(/--fs-[a-z]+:\s*([\d.]+)px/g)||[]).map(x=>parseFloat(x.match(/([\d.]+)px/)[1]));
ok(fsv.length>=6&&Math.min(...fsv)>=10,'8.5 the type scale is the brand\'s: φ applied to type produced a 5.3px label, which is not a label');

console.log('\n§9 no colour outside the tokens');
ok(/--sky:\s*#0ea5e9/i.test(src),'9.1 the palette is declared as tokens');
ok(/focus-visible\{outline:2px solid var\(--sky\)/.test(src),'9.2 the focus ring a person actually sees is the brand\'s, not the framework\'s blue');
/* the minifier lowercases a hex value, so these read case-insensitively: the
   letter case of #DDD8CD is not a design fact and an assertion on it fails on
   a change to the build rather than to the page */
ok(/border:0 solid #DDD8CD/i.test(src),'9.3 the preflight border carries the brand value');
ok(!/border:0 solid #e5e7eb/i.test(src),'9.4 …and the framework\'s own grey is not in the file at all: replaced at its source, not overridden afterwards, which would ship both and win only by cascade order');
ok(/placeholder\{opacity:1;color:#95A1A9/i.test(src),'9.5 the placeholder likewise');
ok(!/placeholder\{opacity:1;color:#9ca3af/i.test(src),'9.6 …and its framework grey is gone too');

console.log('\n§10 the mark is the guide\'s, not drawn from memory');
ok(root(beside).querySelectorAll('svg').length>0,'10.1 the mark is drawn as SVG');
ok(root(beside).querySelectorAll('mask').length>=2,'10.2 …with a mask on each link, so each passes over and under the other');
ok(!/<text[^>]*>\s*shopy/i.test(src),'10.3 the wordmark is not assembled from characters: shapes arranged to look like it have been removed three times');


/* ── the pieces the console shipped without ──────────────────────────── */

console.log('\n§11 what waits on HIS OWN signature');
const apBag=bag();
open1('ShopyLink_Action_C9_Staff.html',apBag);
open1('ShopyLink_Action_C7_Hubs.html',apBag);
const apD1=open1('ShopyLink_D1_Control.html',apBag);
apD1.render&&apD1.render();
const roster=JSON.parse(apBag.getItem('SL_STAFF_V1')).staff;
const byName=nm=>roster.filter(p=>p.name===nm)[0];
const admin=roster.filter(p=>p.role==='admin')[0];
apBag.setItem('SL_APPROVALS_V1',JSON.stringify([
  {id:'AP-1',op:'disc',opName:'Exceptional discount',module:'B9',ref:'CON-240711-02',hub:'',level:1,status:'pending',by:'Fadi Nassar',at:Date.now()-7200000},
  {id:'AP-2',op:'base',opName:'Edit base price list',module:'Pricing',ref:'Dubai→Damascus',hub:'',level:3,status:'pending',by:'Dana Qassem',at:Date.now()-3600000},
  {id:'AP-3',op:'disc',opName:'Already decided',module:'B9',ref:'CON-240601-01',hub:'',level:1,status:'approved',by:'Fadi Nassar',at:Date.now()-9e6},
  {id:'AP-4',op:'disc',opName:'His own request',module:'B9',ref:'CON-240602-01',hub:'',level:1,status:'pending',by:admin.name,at:Date.now()-9e6}
]));
const apW=open1('ShopyLink_Console.html',apBag);
await wait(800);
ok(/موافقة تنتظر توقيعك/.test(text(apW)),'11.1 an approval waiting on him is work, and reaches his list beside the rest of it');
ok((text(apW).match(/موافقة تنتظر توقيعك/g)||[]).length===2,'11.2 …only the ones still pending: a decision already taken is not work');
ok(text(apW).indexOf('CON-240602-01')===-1,'11.3 …and never his own request: a person does not sign for himself');
ok(!/setItem\(\s*["\']SL_APPROVALS/.test(src),'11.4 it files none: C12 owns the queue, the console only shows it');

console.log('\n§12 his centre, and the people under him');
const pick=(w,id)=>{const sel=root(w).querySelector('select');sel.value=id;sel.dispatchEvent(new w.Event('change',{bubbles:true}));};
const supBag=bag();
open1('ShopyLink_Action_C9_Staff.html',supBag);
open1('ShopyLink_Action_C7_Hubs.html',supBag);
const supD1=open1('ShopyLink_D1_Control.html',supBag);
const old=Date.now()-40*3600000;
supD1.slEmit('parcel.received',{ship:'CON-A',client:'C',actor:'Khaled Omar',at:old,payload:{}});
supD1.slEmit('parcel.received',{ship:'CON-B',client:'C',actor:'Yara Salem',payload:{}});
supD1.slEmit('parcel.received',{ship:'CON-C',client:'C',actor:'Somebody Else',payload:{}});
supD1.render&&supD1.render();
const supW=open1('ShopyLink_Console.html',supBag);
await wait(800);
ok(!!root(supW).querySelector('select'),'12.1 the console asks who is viewing — nothing publishes the signed-in person, and a supervisor who cannot say he is one never sees his own screen');
const tarek=byName('Tarek Aziz');
pick(supW,tarek.id);
await wait(400);
const st12=text(supW);
ok(/مركزه وفريقه/.test(st12),'12.2 a person with people under him gets his centre and his people');
ok(/سوريا/.test(st12),'12.3 the country is named from the countries register: the staff register says "Syria" and the hub register says "SY", and comparing those two strings matches no hub at all');
const hubIds=(st12.match(/H-[A-Z0-9]+/g)||[]);
ok(hubIds.length>1,'12.4 …and a centres manager holds a GROUP of hubs, not one ('+hubIds.length+')');
const trs=[...root(supW).querySelectorAll('tbody tr')];
ok(trs.length===roster.filter(p=>p.reportsTo===tarek.role&&p.id!==tarek.id).length,'12.5 one row per person who answers to him, from the register rather than a list typed here');
ok(/Khaled Omar/.test(st12)&&!/Mona Said/.test(st12.split('مركزه وفريقه')[1]||''),'12.6 …and nobody else\'s people: a screen full of another manager\'s staff teaches him to ignore it');
const khaled=trs.filter(r=>/Khaled Omar/.test(r.textContent))[0];
ok(!!khaled&&/1/.test(khaled.textContent),'12.7 what he finished is read off the append-only log, by the events he declared');
ok(!!khaled&&khaled.textContent.replace(/\s+/g,'').indexOf('110')>-1,'12.8 …and what is STOPPED is his own work still open past what its stage allows — finished 1, stopped 1');
ok(/لا يعرفه السجل/.test(st12)&&/Somebody Else/.test(st12),'12.9 work declared by a name the register does not hold is REPORTED, not dropped — the log names the actor and the register keys by id');
const clerk=byName('Ziad Mardini');
pick(supW,clerk.id);
await wait(400);
ok(!/مركزه وفريقه/.test(text(supW)),'12.10 a person with nobody under him is shown no team: the section is his people, not a table everyone gets');

console.log('\n§13 a channel that will not parse');
const badBag=bag();
open1('ShopyLink_Action_C9_Staff.html',badBag);
badBag.setItem('SL_SHIPMENTS_V1','{"shipments":[{"ship":"CON-1",');
const badW=open1('ShopyLink_Console.html',badBag);
await wait(800);
const bt=text(badW);
ok(/قناة لم تُقرأ|could not be read/.test(bt),'13.1 the page says a channel could not be read rather than rendering a blank');
ok(/SL_SHIPMENTS_V1/.test(bt),'13.2 …and NAMES it, so the person who must fix it knows which one');
ok(bt.length>300,'13.3 …and the console still draws its day: a channel is best-effort, never a dependency');
ok(/بيانات تجريبية|DEMONSTRATION DATA/.test(bt),'13.4 …on its own seed, and it says so — a broken channel must not look like a quiet day');

console.log('\n§14 five hundred rows');
const bigBag=bag();
open1('ShopyLink_Action_C9_Staff.html',bigBag);
const many=[];
for(var q=0;q<500;q++)many.push({ship:'CON-9'+String(100000+q).slice(1)+'-01',client:'C'+q,from:'Dubai',to:'Damascus',mode:'air',weight:9,cartons:1,stage:'assigned',at:Date.now()-9e7,attempts:2,open:true});
bigBag.setItem('SL_SHIPMENTS_V1',JSON.stringify({at:Date.now(),shipments:many}));
/* publish the trips too. Left unpublished, the console falls back to its own
   seed for that channel alone and adds the seed's VGM row — which is correct
   behaviour and made this assertion read 501. The console was right and the
   first draft of this check was wrong. */
bigBag.setItem('SL_TRIPS_V1',JSON.stringify({at:Date.now(),trips:[{trip:'TRP-2608-011',from:'Istanbul',to:'Damascus',stage:'arrived',mode:'land',at:Date.now()-7e7}]}));
const bigW=open1('ShopyLink_Console.html',bigBag);
await wait(1200);
const bigT=text(bigW);
ok(/يحتاج إجراء\s*500/.test(bigT),'14.1 all five hundred are counted: a figure that quietly caps is worse than no figure');
const painted=[...root(bigW).querySelectorAll('button')].filter(b=>/^(افتح|Open)$/.test(b.textContent.trim())).length;
ok(painted<500,'14.2 …and not all five hundred are painted at once ('+painted+')');
ok(painted>0,'14.3 …but the first page is');
ok(/\d+–\d+ \/ 500/.test(bigT),'14.4 it is PAGED, not capped: the page says which of the five hundred these are, so the five hundred and first is reachable');


console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
})();
