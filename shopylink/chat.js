
// ══════════════════════════════════════════════════════════════════
//  CONTEXTUAL CHAT — every message targets a RECORD and at least one ROLE.
//  A message with no record is a rumour; with no role it is an obligation with no owner.
//  Replies inherit. A person is named ON TOP of a role, never instead of it.
// ══════════════════════════════════════════════════════════════════
var MSGS=[], MSGSEQ=0;
function threadOf(ref){return MSGS.filter(function(m){return m.ref===ref;}).sort(function(a,b){return a.at-b.at;});}
function threadRefs(){
 var seen={},out=[];
 MSGS.forEach(function(m){if(!seen[m.ref]){seen[m.ref]=1;out.push(m.ref);}});
 return out;
}
// who actually reads a role right now — the holder, or the delegate if they are away
function readerOfRole(role){
 var p=PEOPLE.find(function(x){return x.role===role;});
 if(!p)return null;
 if(personOOO(p.id))return personById(p.ooo.delegate);
 return p;
}
function postMessage(o){
 o=o||{};
 var text=String(o.text||'').replace(/\s/g,'').length?o.text:'';
 if(!text)return {ok:false,why:'an empty message says nothing'};
 var ref=o.ref;
 var roles=(o.roles||[]).filter(function(r){return !!roleById(r);});
 // a reply inherits the record and the participants — no re-tagging
 if(o.replyTo){
  var parent=MSGS.find(function(m){return m.id===o.replyTo;});
  if(parent){ref=ref||parent.ref; if(!roles.length)roles=parent.roles.slice();}
 }
 if(!ref)return {ok:false,why:'a message must name the shipment or trip it is about'};
 if(!roles.length)return {ok:false,why:'a message must be addressed to at least one role'};
 MSGSEQ++;
 var m={id:'MSG-'+MSGSEQ,ref:ref,roles:roles,person:o.person||null,
   by:(ME?ME.name:'system'),byId:(ME?ME.id:null),at:NOW(),text:text,
   kind:'human',edits:[],task:null,replyTo:o.replyTo||null};
 MSGS.push(m);
 log(ref,'message to '+roles.join('+')+(o.person?' · '+personName(o.person):''));
 return {ok:true,msg:m,readers:roles.map(function(r){var p=readerOfRole(r);return p?p.name:r;})};
}
function sysPost(ref,text,textAr){
 MSGSEQ++;
 var m={id:'MSG-'+MSGSEQ,ref:ref,roles:[],person:null,by:'system',byId:null,
   at:NOW(),text:text,textAr:textAr||text,kind:'system',edits:[],task:null,replyTo:null};
 MSGS.push(m);
 return m;
}
function editMessage(id,text){
 var m=MSGS.find(function(x){return x.id===id;});
 if(!m||m.kind!=='human')return {ok:false};
 if(String(text||'').replace(/\s/g,'').length<2)return {ok:false,why:'an empty message says nothing'};
 m.edits.push({was:m.text,at:NOW(),by:(ME?ME.name:'')});     // the original stays readable
 m.text=text;
 return {ok:true};
}
function messageReaders(m){
 var out=[];
 m.roles.forEach(function(r){var p=readerOfRole(r);if(p)out.push(p);});
 if(m.person){var pp=personById(m.person);if(pp&&out.indexOf(pp)===-1)out.push(pp);}
 return out;
}
function threadFor(role){
 return MSGS.filter(function(m){
  return m.roles.indexOf(role)>-1||(m.person&&personById(m.person)&&personById(m.person).role===role);
 });
}
// ── the record number is a door ──
function actionsFor(ref){return openItems().filter(function(it){return it.ref===ref;});}
function openRecord(ref){
 DRILL=null; openI=null;
 CHAT_REF=ref;
 var acts=actionsFor(ref);
 if(acts.length)openI=acts[0].id;
 sim='s8';render();
 return acts;
}
// ── message → task ──
function toTask(id,dueMs){
 var m=MSGS.find(function(x){return x.id===id;});
 if(!m||m.kind!=='human')return {ok:false,why:'only a written message becomes a task'};
 if(m.task)return {ok:false,why:'this message is already a task'};
 var role=m.roles[0], holder=m.person?personById(m.person):readerOfRole(role);
 var wi=mk({ref:m.ref,title:m.text.slice(0,60),titleAr:m.text.slice(0,60),
   kind:'document',owner:holder?holder.id:null,role:holder?holder.role:role,
   next:m.text.slice(0,80),nextAr:m.text.slice(0,80),
   due:dueMs?NOW()+dueMs:null,allow:dueMs||DAY,touched:NOW()});
 m.task=wi.id;
 log(m.ref,'message became task '+wi.id);
 return {ok:true,task:wi};
}
// ── seed one real conversation on a real record ──
(function(){
 var me0=ME;
 ME=personById('U-03');
 postMessage({ref:'SL-9603',roles:['docs'],text:'The pallets arrived with no certificate of origin. Do we hold them or stuff and follow up?'});
 ME=personById('U-01');
 postMessage({ref:'SL-9603',roles:['ops','customs'],text:'Hold them. Customs will reject the pack at the border without it — I am chasing the chamber now.'});
 sysPost('SL-9603','gate check: departure BLOCKED — certificate of origin missing','فحص البوابة: المغادرة محجوبة — شهادة المنشأ ناقصة');
 ME=me0;
})();
