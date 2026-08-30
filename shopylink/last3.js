
// ══════════════════════════════════════════════════════════════════
//  THE LAST THREE SHELL ITEMS
//  1 · Quick create (+) — context aware, and it refuses to create a half-thing
//  2 · Company notice board — dismissible per user, archived not deleted
//  3 · Profile & preferences — mine only; admin settings live elsewhere
// ══════════════════════════════════════════════════════════════════

// ── 1 · QUICK CREATE ──
var QC_KINDS=[
 {id:'work',    en:'Work item',   ar:'بند عمل',    need:['ref','role','next','due']},
 {id:'client',  en:'Client',      ar:'عميل',       need:['name','country','contact','reach']},
 {id:'message', en:'Message',     ar:'رسالة',      need:['ref','roles','text']},
 {id:'cost',    en:'Trip cost',   ar:'كلفة رحلة',  need:['trip','code','amount']},
 {id:'note',    en:'Shift note',  ar:'ملاحظة وردية',need:['text']}
];
function qcKindLabel(id){var k=QC_KINDS.find(function(x){return x.id===id;});return k?(currentLang==='ar'?k.ar:k.en):id;}
// context: on a screen that is about a record, the new thing inherits it
function qcContext(){
 if(sim==='s8'&&CHAT_REF)return {ref:CHAT_REF,why:'the thread you are reading'};
 if(sim==='s5'&&TRIPS.length)return {trip:TRIPS[0].id,why:'the trip on screen'};
 if(openI&&itemById(openI))return {ref:itemById(openI).ref,why:'the item you have open'};
 return {};
}
function quickCreateThing(kind,o){
 o=o||{};
 var missing=[];
 var need=(QC_KINDS.find(function(k){return k.id===kind;})||{}).need||[];
 need.forEach(function(fieldName){
  if(fieldName==='reach'){if(!o.phone&&!o.email)missing.push('phone or email');return;}
  if(fieldName==='roles'){if(!(o.roles&&o.roles.length))missing.push('role');return;}
  if(!o[fieldName])missing.push(fieldName);
 });
 if(missing.length)return {ok:false,need:missing};
 if(kind==='work'){
  var holder=readerOfRole(o.role,o.hub||'DAM');
  var wi=mk({ref:o.ref,title:o.next,titleAr:o.next,kind:'document',
    owner:holder?holder.id:null,role:o.role,next:o.next,nextAr:o.next,
    due:NOW()+Number(o.due)*HOUR,allow:Number(o.due)*HOUR});
  return {ok:true,id:wi.id,goto:'s1'};
 }
 if(kind==='client'){
  var r=quickCreate({name:o.name,country:o.country,contact:o.contact,phone:o.phone,email:o.email,type:o.type||'individual'},o.dismiss);
  if(!r.ok)return r;
  return {ok:true,id:r.id,goto:'s7'};
 }
 if(kind==='message'){
  var mr=postMessage({ref:o.ref,roles:o.roles,hub:o.hub||'DAM',text:o.text});
  if(!mr.ok)return mr;
  return {ok:true,id:mr.msg.id,goto:'s8'};
 }
 if(kind==='cost'){
  var c=bookCost(o.trip,{code:o.code,amount:o.amount,supplier:o.supplier||'',key:o.key||'cbm'});
  return c?{ok:true,id:c.ref,goto:'s6'}:{ok:false,why:'no trip'};
 }
 if(kind==='note'){
  var nr=leaveNote(ME.role,o.text);
  if(!nr.ok)return nr;
  return {ok:true,id:'note',goto:'s0'};
 }
 return {ok:false,why:'unknown kind'};
}

// ── 2 · NOTICE BOARD — management speaking to everyone, dismissible per user ──
var NOTICES=[
 {id:'NB-1',at:T0-2*DAY,by:'Omar Al-Masri',kind:'advisory',
  en:'Bab al-Hawa is running four-hour queues this week. Add half a day to any Istanbul trip you quote.',
  ar:'باب الهوى فيه طوابير أربع ساعات هذا الأسبوع. أضف نصف يوم إلى أي رحلة إسطنبول تسعّرها.'},
 {id:'NB-2',at:T0-6*DAY,by:'Omar Al-Masri',kind:'policy',
  en:'From this month every business account is prepaid unless a credit facility is granted in writing.',
  ar:'من هذا الشهر كل حساب أعمال بالدفع المسبق ما لم يُمنح تسهيل ائتماني كتابةً.'},
 {id:'NB-3',at:T0-11*DAY,by:'Omar Al-Masri',kind:'closure',
  en:'The Guangzhou warehouse closes for the public holiday on the 24th and 25th.',
  ar:'مستودع غوانزو مغلق في العطلة الرسمية يومي ٢٤ و٢٥.'}
];
var NOTICE_DISMISSED={};                       // per user — dismissing hides, never deletes
function noticeKey(id){return (ME?ME.id:'?')+'|'+id;}
function noticeLive(){return NOTICES.filter(function(nb){return !NOTICE_DISMISSED[noticeKey(nb.id)];});}
function noticeArchive(){return NOTICES.filter(function(nb){return !!NOTICE_DISMISSED[noticeKey(nb.id)];});}
function dismissNotice(id){NOTICE_DISMISSED[noticeKey(id)]=1;render();}
function restoreNotice(id){delete NOTICE_DISMISSED[noticeKey(id)];render();}
function postNotice(kind,en,ar,actorRole){
 if((actorRole||ME.role)!=='manager')return {ok:false,why:'only the manager posts to the board'};
 if(String(en||'').replace(/\s/g,'').length<8)return {ok:false,why:'a notice nobody can act on is noise'};
 NOTICES.unshift({id:'NB-'+(NOTICES.length+1),at:NOW(),by:ME.name,kind:kind||'advisory',en:en,ar:ar||en});
 log('board','notice posted');
 return {ok:true};
}

// ── 3 · PROFILE & PREFERENCES — personal only ──
var PREFS={lang:'en',density:'comfortable',tz:'DAM',dateFmt:'DD MMM YYYY',
 notify:{handover:true,escalation:true,cutoff:true,message:true},
 signature:'', stamp:false};
function setPref(k,v){
 PREFS[k]=v;
 if(k==='lang')setLang(v);
 else if(k==='density')setDensity(v);
 else render();
 return true;
}
function setNotifyPref(k,v){
 if(k==='cutoff'&&!v)return {ok:false,why:'a critical cutoff alert cannot be switched off — only resolved'};
 PREFS.notify[k]=!!v;render();
 return {ok:true};
}
function myActivity(){
 return HIST.filter(function(e){return e.who===ME.name;}).slice(-12).reverse();
}
