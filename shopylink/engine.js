// ── i18n ──
var currentLang='en';
var T_w={
 'Work':'الأعمال','My work':'أعمالي','Manager':'المدير','Clock':'الساعة','Roles':'الأدوار','Acting as':'تتصرّف بصفة',
 'my overdue':'متأخراتي','due today':'مستحق اليوم','unacknowledged handovers':'تسليمات لم أقرّها',
 'Responsibility':'المسؤولية','owner':'المالك','next action':'الإجراء التالي','due':'الاستحقاق','age':'العمر',
 'Open':'مفتوح','Resolved':'محلول','Cancelled':'ملغى','Unassigned — needs owner':'بلا مالك — يحتاج إسنادًا',
 'Stalled':'متوقّفة','Critical':'حرجة','Broken':'مكسورة','no owner':'بلا مالك','no due date':'بلا تاريخ استحقاق','no next action':'بلا إجراء تالٍ',
 'Assign':'إسناد','Assign to…':'أسنِد إلى…','Touch':'تحديث','Resolve':'إنهاء','Reassign':'إعادة إسناد','Cancel job':'إلغاء العمل','Hand over':'تسليم',
 'Acknowledge':'إقرار الاستلام','awaiting acknowledgement':'بانتظار الإقرار','from':'من','to':'إلى',
 'Reason':'السبب','reason is required':'السبب إلزامي','Confirm':'تأكيد','Cancel':'إلغاء','Close':'إغلاق',
 'escalation':'التصعيد','L1 owner notified':'م1 أُبلغ المالك','L2 supervisor notified':'م2 أُبلغ المشرف','L3 on the manager panel':'م3 على لوحة المدير',
 'cannot be dismissed at L3 — resolve or reassign with a reason':'لا يمكن صرفها عند م3 — أنهِها أو أعد إسنادها بسبب',
 'past a hard cutoff':'تجاوزت موعدًا صارمًا','hard cutoff':'موعد صارم',
 'Nothing waiting on you':'لا شيء ينتظرك','Everything you own is on time.':'كل ما تملكه في وقته.',
 'Advance the clock':'قدّم الساعة','now':'الآن','+1h':'+ساعة','+4h':'+٤ ساعات','+1d':'+يوم','+2d':'+يومان','+3d':'+٣ أيام','reset':'إرجاع',
 'the whole engine reads this clock — tests move it, they never wait':'المحرّك كله يقرأ هذه الساعة — والاختبارات تحرّكها ولا تنتظر',
 'Audit log':'سجل التدقيق','every change is logged':'كل تغيير يُسجَّل','Team load':'حِمل الفريق','active':'نشط','overdue':'متأخر',
 'Hand over to…':'تسليم إلى…','that role cannot perform the next action':'ذلك الدور لا يملك الإجراء التالي',
 'Ownership stays with you until they acknowledge.':'تبقى الملكية معك حتى يقرّ الاستلام.',
 'Cancel this job?':'إلغاء هذا العمل؟','It can never be deleted — it stays in the cancelled log.':'لا يُحذف أبدًا — يبقى في سجل الملغاة.',
 'only the manager may cancel':'الإلغاء للمدير وحده','Reassign to…':'إعادة الإسناد إلى…',
 'Sales':'المبيعات','Operations':'العمليات','Documentation':'التوثيق','Customs':'الجمارك','Warehouse':'المستودع','Finance':'المالية','Manager role':'المدير',
 'Comfortable':'مريح','Compact':'مضغوط','items':'عنصر','all queues':'كل الطوابير','My queue':'طابوري'
};
function t(s){return currentLang==='ar'&&T_w[s]?T_w[s]:s;}
function setLang(l){currentLang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';document.documentElement.lang=l;
 document.querySelectorAll('.lang-opt').forEach(function(b){b.classList.toggle('on',b.dataset.lang===l);});
 var bc=document.getElementById('bc-action');if(bc)bc.textContent=l==='ar'?'الأعمال':'Work';render();}

// ── density + modal ──
var density='comfortable';
function setDensity(v){density=v;document.documentElement.setAttribute('data-density',v==='compact'?'compact':'comfortable');render();}
function densityToggle(){
 return '<div style="display:flex;gap:0;border:1.5px solid rgba(11,42,59,.15);border-radius:10px;overflow:hidden">'
  +'<button onclick="setDensity(\'comfortable\')" style="cursor:pointer;font-family:var(--body);font-weight:800;padding:0 14px;border:none;background:'+(density==='comfortable'?'#0B2A3B':'#FFFFFF')+';color:'+(density==='comfortable'?'#FFFFFF':'#0B2A3B')+'">'+t('Comfortable')+'</button>'
  +'<button onclick="setDensity(\'compact\')" style="cursor:pointer;font-family:var(--body);font-weight:800;padding:0 14px;border:none;background:'+(density==='compact'?'#0B2A3B':'#FFFFFF')+';color:'+(density==='compact'?'#FFFFFF':'#0B2A3B')+'">'+t('Compact')+'</button>'
  +'</div>';
}
var modal=null;
function askConfirm(title,msg,ok,danger,act){modal={title:title,msg:msg,ok:ok,danger:danger,reason:false,typed:'',act:act};render();}
function askReason(title,msg,ok,act){modal={title:title,msg:msg,ok:ok,danger:true,reason:true,typed:'',act:act};render();}
function setTyped(v){modal.typed=v;var b=document.getElementById('mdl-ok');
 if(b){var okNow=String(v).replace(/\s/g,'').length>4;b.disabled=!okNow;b.style.cursor=okNow?'pointer':'not-allowed';
  b.style.background=okNow?'#E1483B':'#E4E9F0';b.style.color=okNow?'#FFFFFF':'rgba(11,42,59,.4)';}}
function closeModal(){modal=null;render();}
function modalOk(){
 if(modal&&modal.reason&&String(modal.typed).replace(/\s/g,'').length<5)return;
 var a=modal?modal.act:null, txt=modal?modal.typed:'';
 modal=null;if(a)a(txt);render();}
function modalHTML(){
 if(!modal)return '';
 var okNow=modal.reason?(String(modal.typed).replace(/\s/g,'').length>4):true;
 return '<div class="sl-modal-ov" onclick="if(event.target===this)closeModal()"><div class="sl-modal">'
  +'<div style="padding:16px 20px;background:'+(modal.danger?'#FDECEA':'#F4FBFF')+';border-bottom:1px solid rgba(11,42,59,.08)">'
  +'<div style="font-family:var(--disp);font-size:var(--fs-lead);font-weight:800;letter-spacing:-.025em;color:'+(modal.danger?'#991B1B':'#0A4A6B')+'">'+modal.title+'</div></div>'
  +'<div style="padding:18px 20px;font-size:var(--fs-body);line-height:1.7;color:#0B2A3B">'+modal.msg
  +(modal.reason?'<div style="margin-top:14px"><div class="eyebrow" style="margin-bottom:6px">'+t('Reason')+'</div>'
    +'<textarea oninput="setTyped(this.value)" rows="2" style="width:100%;border:1.5px solid rgba(225,72,59,.5);border-radius:10px;padding:11px 13px;font-family:var(--body);font-size:var(--fs-body);background:#FFFFFF">'+String(modal.typed).replace(/</g,'&lt;')+'</textarea>'
    +'<div class="hint" style="margin-top:4px">'+t('reason is required')+'</div></div>':'')
  +'</div>'
  +'<div style="display:flex;gap:10px;padding:16px 20px;border-top:1px solid rgba(11,42,59,.08);background:#F7F4EC">'
  +'<button onclick="closeModal()" style="cursor:pointer;font-family:var(--body);font-weight:800;padding:0 20px;border-radius:10px;border:1.5px solid rgba(11,42,59,.18);background:#FFFFFF;color:#0B2A3B">'+t('Cancel')+'</button>'
  +'<button id="mdl-ok" onclick="modalOk()" '+(okNow?'':'disabled')+' style="cursor:'+(okNow?'pointer':'not-allowed')+';margin-left:auto;font-family:var(--body);font-weight:800;padding:0 22px;border-radius:10px;border:none;background:'+(okNow?(modal.danger?'#E1483B':'#10B981'):'#E4E9F0')+';color:'+(okNow?'#FFFFFF':'rgba(11,42,59,.4)')+'">'+modal.ok+'</button>'
  +'</div></div></div>';
}

// ══════════════════════════════════════════════════════════════════
//  ANTI-FORGETTING ENGINE
//  every item: one owner · one next action · one due date.
//  any of the three missing → the item is BROKEN and surfaces by itself.
//  all time reads NOW() — tests move the clock, they never wait.
// ══════════════════════════════════════════════════════════════════
var HOUR=3600000, DAY=24*HOUR;
var AMBER_AT=0.70;        // amber at 70% of the allowance, inclusive
var STALL_MS=24*HOUR;     // no update for 24h → stalled
var ACK_MS=4*HOUR;        // handover unacknowledged for 4h → flagged
var T0=new Date(2026,7,19,9,0,0).getTime();   // fixed base so the demo is reproducible
var CLOCK=0;                                   // milliseconds pushed forward by the tester
function NOW(){return T0+CLOCK;}
function pushClock(ms){CLOCK+=ms;sweep();render();}
function resetClock(){CLOCK=0;render();}

var ROLES=[
 {id:'sales',   name:'Sales',        lvl:1, sup:'manager',
  stmt:'Owns the client relationship, quotations and contract rates. Accountable for every quotation answered before it expires and every client correctly registered and priced.',
  stmtAr:'يملك علاقة العميل وعروض الأسعار وأسعار العقود. ومسؤول عن الإجابة عن كل عرض قبل انتهائه، وعن تسجيل كل عميل وتسعيره تسعيرًا صحيحًا.'},
 {id:'ops',     name:'Operations',   lvl:2, sup:'manager',
  stmt:'Owns trip creation, truck and driver assignment, physical movement and delivery. Accountable for every trip departing on time and every shipment arriving and being delivered.',
  stmtAr:'يملك إنشاء الرحلات وإسناد الشاحنات والسائقين والحركة الفعلية والتسليم. ومسؤول عن مغادرة كل رحلة في وقتها ووصول كل شحنة وتسليمها.'},
 {id:'docs',    name:'Documentation',lvl:2, sup:'manager',
  stmt:'Owns every deadline and every document that reaches a carrier or a border. Accountable for no deadline missed and no document leaving with an error in it.',
  stmtAr:'يملك كل موعد نهائي وكل مستند يصل إلى ناقل أو حدود. ومسؤول عن ألا يفوت موعد وألا يخرج مستند فيه خطأ.'},
 {id:'customs', name:'Customs',      lvl:2, sup:'manager',
  stmt:'Owns declarations, clearance and classification. Accountable for no shipment held for a reason that was foreseeable.',
  stmtAr:'يملك البيانات الجمركية والتخليص والتصنيف. ومسؤول عن ألا تُحتجز شحنة لسبب كان يمكن توقّعه.'},
 {id:'wh',      name:'Warehouse',    lvl:1, sup:'ops',
  stmt:'Owns receiving, measuring, weighing, packing and condition. Accountable for every piece received being measured, recorded and photographed.',
  stmtAr:'يملك الاستلام والقياس والوزن والتغليف وحالة البضاعة. ومسؤول عن قياس كل قطعة تُستلم وتسجيلها وتصويرها.'},
 {id:'finance', name:'Finance',      lvl:2, sup:'manager',
  stmt:'Owns invoicing, collection and cost allocation. Accountable for nothing delivered going uninvoiced.',
  stmtAr:'يملك الفوترة والتحصيل وتوزيع الكلف. ومسؤول عن ألا يبقى مسلَّم بلا فاتورة.'},
 {id:'manager', name:'Manager role', lvl:3, sup:null,
  stmt:'Owns the whole flow — escalations, overrides, reassignment. Accountable for no job on hold, no job forgotten, no job cancelled without a reason on record.',
  stmtAr:'يملك التدفّق كله — التصعيدات والتجاوزات وإعادة الإسناد. ومسؤول عن ألا يبقى عمل معلّقًا ولا منسيًّا ولا ملغى بلا سبب مسجَّل.'}
];
function roleById(id){return ROLES.find(function(r){return r.id===id;})||null;}
function roleStatement(id){var r=roleById(id);return r?{en:r.stmt,ar:r.stmtAr}:null;}

var PEOPLE=[
 {id:'U-01',name:'Rana Yousef',role:'docs'},
 {id:'U-02',name:'Mona Said',role:'ops'},
 {id:'U-03',name:'Khaled Omar',role:'wh'},
 {id:'U-04',name:'Lina Hamwi',role:'finance'},
 {id:'U-05',name:'Ziad Mardini',role:'customs'},
 {id:'U-06',name:'Fadi Nassar',role:'sales'},
 {id:'U-00',name:'Omar Al-Masri',role:'manager'}
];
function personById(id){return PEOPLE.find(function(p){return p.id===id;})||null;}
function personName(id){var p=personById(id);return p?p.name:'—';}

// which roles may perform which kind of next action (used to refuse a nonsense handover)
var ACTION_ROLES={
 measure:['wh','ops'], stuff:['wh','ops'], depart:['ops'], deliver:['ops'],
 declare:['customs'], clear:['customs'],
 document:['docs'], issueDoc:['docs'],
 invoice:['finance'], collect:['finance'],
 quote:['sales'], profile:['sales']
};
function roleCanDo(role,kind){
 if(role==='manager')return true;
 var a=ACTION_ROLES[kind];
 return a?a.indexOf(role)>-1:true;
}

var SEQ=400;
var ITEMS=[];
function mk(o){
 SEQ++;
 var it={id:'WI-'+SEQ, ref:o.ref, title:o.title, titleAr:o.titleAr||o.title,
  kind:o.kind, owner:(o.owner===undefined?null:o.owner), role:o.role||null,
  next:(o.next===undefined?'':o.next), nextAr:o.nextAr||o.next||'',
  due:(o.due===undefined?null:o.due), allow:o.allow||(2*DAY),
  touched:o.touched!==undefined?o.touched:T0, status:'open',
  hardCutoff:o.hardCutoff||null, esc:0, escLogged:0,
  ho:null, cancelReason:'', by:'', at:''};
 ITEMS.push(it);
 return it;
}
function itemById(id){return ITEMS.find(function(x){return x.id===id;})||null;}
function all(){return ITEMS;}
function openItems(){return ITEMS.filter(function(x){return x.status==='open';});}

// ── the three fields ──
function missing(it){
 var m=[];
 if(!it.owner)m.push('no owner');
 if(!it.due)m.push('no due date');
 if(!String(it.next||'').length)m.push('no next action');
 return m;
}
function isBroken(it){return missing(it).length>0;}
function unassigned(){return openItems().filter(isBroken);}

// ── ageing ──
function ageMs(it,now){return (now||NOW())-it.touched;}
function pctOf(it,now){
 if(!it.due)return 0;
 var n=now||NOW(), start=it.due-it.allow;
 if(n<=start)return 0;
 return (n-start)/it.allow;
}
function tone(it,now){
 var n=now||NOW();
 if(it.hardCutoff&&n>it.hardCutoff)return 'black';   // black outranks red
 var p=pctOf(it,n);
 if(!it.due)return 'grey';
 if(p>1)return 'red';
 if(p>=AMBER_AT)return 'amber';
 return 'green';
}
function overdue(it,now){return !!it.due&&(now||NOW())>it.due;}
function dueToday(it,now){
 if(!it.due)return false;
 var n=now||NOW();
 return it.due>=n && (it.due-n)<=DAY;
}
function overdueDays(it,now){
 if(!overdue(it,now))return 0;
 return Math.floor(((now||NOW())-it.due)/DAY);
}

// ── touch / stalled ──
function touch(id){var it=itemById(id);if(!it||it.status!=='open')return false;
 it.touched=NOW();log(it.id,'touched');render();return true;}
function stalled(){return openItems().filter(function(it){return ageMs(it)>=STALL_MS;});}

// ── escalation ladder — one rung per overdue day, never skipped ──
function escalation(it){return it.esc;}
function sweep(){
 openItems().forEach(function(it){
  var d=Math.min(3,overdueDays(it));
  while(it.escLogged<d){
   it.escLogged++;
   it.esc=it.escLogged;
   log(it.id,['','L1 owner notified','L2 supervisor notified','L3 on the manager panel'][it.escLogged]);
  }
 });
}
function critical(){sweep();return openItems().filter(function(it){return it.esc>=3;});}
function dismiss(id){var it=itemById(id);if(!it)return false;
 if(it.esc>=3)return false;              // cannot be dismissed at L3
 return true;}

// ── handover: ownership stays with the sender until acknowledged ──
function handover(id,toRole){
 var it=itemById(id);if(!it||it.status!=='open')return {ok:false,why:'closed'};
 if(!roleCanDo(toRole,it.kind))return {ok:false,why:'that role cannot perform the next action'};
 it.ho={to:toRole,from:it.role,at:NOW(),ack:false};
 log(it.id,'handed over to '+toRole);
 render();return {ok:true};
}
function pendingAck(id){var it=itemById(id);return !!(it&&it.ho&&!it.ho.ack);}
function ack(id){
 var it=itemById(id);if(!it||!it.ho||it.ho.ack)return false;
 var np=PEOPLE.find(function(p){return p.role===it.ho.to;});
 it.role=it.ho.to;
 it.owner=np?np.id:it.owner;
 it.touched=NOW();                      // acknowledging resets the age clock
 it.ho.ack=true;it.ho=null;
 log(it.id,'handover acknowledged');
 render();return true;
}
function staleHandovers(){
 return openItems().filter(function(it){return it.ho&&!it.ho.ack&&(NOW()-it.ho.at)>=ACK_MS;});
}
function myUnacked(role){
 return openItems().filter(function(it){return it.ho&&!it.ho.ack&&(it.ho.to===role||it.role===role);});
}

// ── assign · resolve · reassign · cancel (never delete) ──
function assign(id,personId){
 var it=itemById(id), p=personById(personId);
 if(!it||!p)return false;
 it.owner=p.id;it.role=p.role;it.touched=NOW();
 if(!it.due)it.due=NOW()+it.allow;
 log(it.id,'assigned to '+p.name);render();return true;
}
function resolve(id){var it=itemById(id);if(!it||it.status!=='open')return false;
 it.status='resolved';log(it.id,'resolved');render();return true;}
function reassign(id,personId,reason){
 var it=itemById(id);if(!it)return false;
 if(it.esc>=3&&String(reason||'').replace(/\s/g,'').length<5)return false;   // L3 demands a reason
 var from=personName(it.owner), p=personById(personId);
 if(!p)return false;
 it.owner=p.id;it.role=p.role;it.touched=NOW();
 log(it.id,'reassigned '+from+' → '+p.name+(reason?' · '+reason:''));
 render();return true;
}
function cancel(id,reason,actorRole){
 var it=itemById(id);if(!it||it.status!=='open')return false;
 if((actorRole||ME.role)!=='manager')return false;                            // manager only
 if(String(reason||'').replace(/\s/g,'').length<5)return false;               // reason required
 it.status='cancelled';it.cancelReason=reason;it.by=ME.name;it.at=stampW();
 log(it.id,'cancelled · '+reason);render();return true;
}
function cancelled(){return ITEMS.filter(function(x){return x.status==='cancelled';});}

// ── role visibility: by data, not by hiding ──
function queueFor(role){
 sweep();
 if(role==='manager')return openItems();
 return openItems().filter(function(it){return it.role===role||(it.ho&&it.ho.to===role);});
}

// ── audit ──
var AUDIT=[];
function stampW(){var d=new Date(NOW());return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
function log(ref,what){AUDIT.unshift({at:stampW(),who:ME?ME.name:'system',ref:ref,what:what});if(AUDIT.length>12)AUDIT.pop();}

// ── seed ──
var ME=PEOPLE[0];
function setActor(id){var p=personById(id);if(p){ME=p;render();}}
mk({ref:'BSH-240705-01',title:'VGM to carrier',titleAr:'إرسال VGM إلى الناقل',kind:'document',owner:'U-01',role:'docs',
    next:'submit VGM',nextAr:'أرسل VGM',due:T0+6*HOUR,allow:DAY,hardCutoff:T0+8*HOUR});
mk({ref:'TRP-8842',title:'Border pack for the driver',titleAr:'حزمة مستندات السائق',kind:'document',owner:'U-01',role:'docs',
    next:'verify the pack is complete',nextAr:'تحقّق من اكتمال الحزمة',due:T0+20*HOUR,allow:DAY});
mk({ref:'CON-240701-01',title:'Measure and weigh at the warehouse',titleAr:'القياس والوزن في المستودع',kind:'measure',owner:'U-03',role:'wh',
    next:'record actual CBM',nextAr:'سجّل الحجم الفعلي',due:T0+4*HOUR,allow:8*HOUR});
mk({ref:'CLM-2291',title:'Damage claim assessment',titleAr:'تقدير مطالبة تلف',kind:'invoice',owner:'U-04',role:'finance',
    next:'assess against the cap',nextAr:'قدّرها مقابل السقف',due:T0-2*HOUR,allow:DAY});
mk({ref:'BSH-240630-04',title:'Import clearance',titleAr:'التخليص الاستيرادي',kind:'clear',owner:'U-05',role:'customs',
    next:'file the declaration',nextAr:'قدّم البيان',due:T0+30*HOUR,allow:2*DAY});
mk({ref:'TRP-8851',title:'Delivery to the consignee',titleAr:'التسليم إلى المرسَل إليه',kind:'deliver',owner:'U-02',role:'ops',
    next:'assign a run',nextAr:'أسنِد جولة',due:T0+12*HOUR,allow:DAY});
mk({ref:'INV-24-0118',title:'Invoice a delivered shipment',titleAr:'فوترة شحنة مسلَّمة',kind:'invoice',owner:null,role:null,
    next:'issue the invoice',nextAr:'أصدر الفاتورة',due:T0+2*DAY,allow:2*DAY});          // no owner → tray
mk({ref:'SL-9502',title:'Complete a provisional client profile',titleAr:'إكمال ملف عميل مؤقّت',kind:'profile',owner:'U-06',role:'sales',
    next:'collect the trade licence',nextAr:'اجمع السجل التجاري',due:null,allow:7*DAY}); // no due → broken
