const fs=require('fs');const {JSDOM}=require('/home/claude/work/node_modules/jsdom');
let fail=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)fail++;};
function load(f,noFind){
  let errs=[];
  const vc=new (require('/home/claude/work/node_modules/jsdom').VirtualConsole)().on('jsdomError',e=>{if(!/HTMLCanvasElement|scrollTo/.test(e.message))errs.push(e.message);}).on('error',e=>errs.push(e));
  const html=fs.readFileSync(f,'utf8');
  if(noFind){
    const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
    delete dom.window.Array.prototype.find;
    html.match(/<script>([\s\S]*?)<\/script>/g).map(x=>x.replace(/<\/?script>/g,'')).forEach(c=>{try{dom.window.eval(c);}catch(e){{if(!/scrollTo/.test(e.message))errs.push('THROW '+e.message)};}});
    return {w:dom.window,errs};
  }
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc});
  return {w:dom.window,errs};
}

console.log('\n════ DRIVER APP (standalone) ════');
let {w,errs}=load('ShopyLink_Driver_App.html');
let d=w.document;const app=()=>d.getElementById('app').innerHTML;
ok(app().length>2000,'run screen renders ('+app().length+' chars)');
ok(/Layla Al-Rifai/.test(app())&&/Ahmad Khalil/.test(app()),'all 4 stops listed — the fourth is a real delivery now, not a customer the gallery invented');
ok(/● /.test(app()),'Next stop highlighted');
ok(d.getElementById('foot').innerHTML.length>50,'sticky footer renders');

console.log('\n[gates]');
w.openStop('DLV-2608-04'); ok(w.scr==='stop','stop opens');
ok(/Prepaid|مدفوعة مسبقًا/.test(app()),'prepaid banner shown — no COD anywhere');
ok(!/Collect COD|تحصيل النقد/.test(app()),'no cash-collect controls');
w.applySig('DLV-2608-04'); w.markDelivered('DLV-2608-04');
ok(w.STOPS[2].stt==='pending','nothing works before arrive');
w.arrive('DLV-2608-04'); w.markDelivered('DLV-2608-04');
ok(w.STOPS[2].stt==='arrived','delivered blocked: recipient+signature missing');
ok(/Confirm signature \(fallback\)|sig-pad/.test(app()),'signature pad + fallback rendered');
w.toggleRcpt('DLV-2608-04'); w.applySig('DLV-2608-04');
ok(w.STOPS[2].sig===true,'signature applied');
w.markDelivered('DLV-2608-04'); ok(w.STOPS[2].stt==='delivered','delivered after recipient+signature');
ok(w.scr==='run','auto back to run');

console.log('\n[unavailable + end + cash]');
w.openStop('DLV-2608-01');w.arrive('DLV-2608-01');w.openUnavail('DLV-2608-01');
w.confirmUnavail('DLV-2608-01'); ok(w.STOPS[0].stt==='arrived','unavail blocked without a reason');
w.setReason('DLV-2608-01','No answer');w.confirmUnavail('DLV-2608-01');
ok(w.STOPS[0].stt==='unavailable','unavailable with reason only — photo optional');
ok(w.STOPS[0].photo===false,'no photo attached, still accepted');
w.endRun(); ok(w.scr!=='end','end blocked with pending stops');
['DLV-2608-02','DLV-2608-03'].forEach(id=>{w.openStop(id);w.arrive(id);w.toggleRcpt(id);w.applySig(id);w.markDelivered(id);});
w.endRun(); ok(w.scr==='end','end run opens');
ok(/All shipments prepaid|مدفوعة مسبقًا/.test(app()),'end screen: prepaid note, no cash statement');
ok(!/Submit statement|تقديم الكشف/.test(app()),'no cash-submit step');

console.log('\n[arabic + legacy engine]');
w.setLang('ar'); ok(d.documentElement.dir==='rtl'&&/جولتي|محطات|سُلِّم/.test(app()),'AR RTL');
w.setLang('en');
let L=load('ShopyLink_Driver_App.html',true);
ok(L.w.document.getElementById('app').innerHTML.length>2000,'legacy engine (no Array.find): run renders');
ok(L.errs.length===0,'legacy engine: zero throws ('+L.errs.join(';')+')');
console.log('driver console errors:',errs.length);

console.log('\n════ OPS DASHBOARD (B8) ════');
let D=load('ShopyLink_Action_08_Delivery.html');
let w2=D.w,d2=w2.document;const sh=()=>d2.getElementById('shell').innerHTML;
ok(sh().length>2000,'s1 monitor renders ('+sh().length+' chars)');
ok(/ShopyLink_Driver_App\.html/.test(sh()),'driver-app banner present');
ok(/Layla/.test(sh()),'seeded live data visible');
ok(!/COD/.test(sh().replace(/CODE/g,'')),'monitor has no COD traces');
['s3-pre','done'].forEach(s=>{w2.resetB8();w2.go(s);ok(sh().length>400,s+' renders');});
w2.resetB8();w2.go('done');
ok(/Trip closed|أُغلقت الرحلة/.test(sh()),'done says Trip closed');
w2.resetB8();w2.go('s3-pre');
w2.stops()[2].cartons.forEach(c=>w2.handleRet('DLV-2608-04-'+c));
w2.acceptReturn('DLV-2608-04');
ok(w2.stops()[2].stt==='repool','reverse receive → repool');
w2.setLang('ar');w2.go('s1');
ok(/تطبيق السائق ملف مستقل/.test(sh()),'AR banner');
console.log('dashboard console errors:',D.errs.length);

console.log('\nRESULT: '+(fail||errs.length||D.errs.length?'FAIL':'ALL PASS')+'\n');
process.exit(fail||errs.length||D.errs.length?1:0);
