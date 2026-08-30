
// ══════════════════════════════════════════════════════════════════
//  MY DAY — what must I do right now, and what happens if I don't?
//  Ordered by CONSEQUENCE. Never by date created, never alphabetically.
// ══════════════════════════════════════════════════════════════════
var CONSEQUENCE={
 measure:{en:'the container is stuffed on a declared figure — the revenue difference is never recovered',
          ar:'تُحشَى الحاوية على رقم مُصرَّح — وفرق الإيراد لا يُسترَدّ أبدًا'},
 document:{en:'the pack is incomplete and the truck is turned back at the border',
          ar:'الحزمة ناقصة فتُعاد الشاحنة من الحدود'},
 issueDoc:{en:'the carrier refuses the document and the trip rolls to the next departure',
          ar:'يرفض الناقل المستند فتتأجّل الرحلة إلى الإقلاع التالي'},
 declare:{en:'the shipment is held at customs and storage begins to accrue against the client',
          ar:'تُحتجز الشحنة في الجمارك ويبدأ التخزين يتراكم على العميل'},
 clear:{en:'free time expires and demurrage starts, per day, per container',
          ar:'ينتهي الوقت المجاني ويبدأ غرامة التأخير يوميًّا لكل حاوية'},
 deliver:{en:'the consignee waits, and a second delivery attempt is paid for twice',
          ar:'ينتظر المرسَل إليه، وتُدفع محاولة التسليم الثانية مرتين'},
 invoice:{en:'work is delivered and unpaid — this is the figure that must read zero',
          ar:'عمل سُلِّم ولم يُقبَض — وهذا هو الرقم الذي يجب أن يقرأ صفرًا'},
 collect:{en:'the receivable ages another bucket and the cash gap widens',
          ar:'تشيخ الذمّة سلّةً أخرى وتتّسع فجوة النقد'},
 profile:{en:'an unregistered client keeps shipping on the general tariff with no credit control',
          ar:'يستمر عميل غير مسجَّل بالشحن على التعرفة العامة بلا ضبط ائتماني'},
 quote:{en:'the quotation expires and the enquiry is lost to a competitor',
          ar:'ينتهي العرض وتضيع الفرصة لمنافس'}
};
function consequenceOf(it){
 var base=CONSEQUENCE[it.kind]||{en:'the job stops moving and nobody is told',ar:'يتوقّف العمل ولا يُبلَّغ أحد'};
 var txt=currentLang==='ar'?base.ar:base.en;
 if(it.hardCutoff&&NOW()>it.hardCutoff)
  return (currentLang==='ar'?'⬛ فات الموعد الصارم — ':'⬛ the hard cutoff is already past — ')+txt;
 if(overdue(it))
  return (currentLang==='ar'?'🔴 متأخر — ':'🔴 already overdue — ')+txt;
 return (currentLang==='ar'?'إن فات: ':'if missed: ')+txt;
}
var TONE_RANK={black:0,red:1,amber:2,green:3,grey:4};
function priorityList(role){
 return queueFor(role||ME.role).slice().sort(function(a,b){
  var d=TONE_RANK[tone(a)]-TONE_RANK[tone(b)];
  if(d)return d;                                   // consequence first
  return (a.due||9e15)-(b.due||9e15);              // then the nearest deadline
 });
}
function greetingWord(){
 var h=new Date(NOW()).getHours();
 if(h<12)return currentLang==='ar'?'صباح الخير':'Good morning';
 if(h<17)return currentLang==='ar'?'مساء الخير':'Good afternoon';
 return currentLang==='ar'?'مساء الخير':'Good evening';
}
function obligationLine(role){
 var q=queueFor(role), od=q.filter(function(it){return overdue(it);}).length,
     dt=q.filter(function(it){return dueToday(it);}).length, ua=myUnacked(role).length;
 if(!od&&!dt&&!ua)return currentLang==='ar'
   ?'لا متأخرات، ولا مستحق اليوم، ولا تسليمات تنتظر إقرارك.'
   :'Nothing overdue, nothing due today, and no handovers waiting on you.';
 var p=[];
 if(od)p.push(currentLang==='ar'?(od+' متأخرة'):(od+' overdue'));
 if(dt)p.push(currentLang==='ar'?(dt+' مستحقة اليوم'):(dt+' due today'));
 if(ua)p.push(currentLang==='ar'?(ua+' تسليمًا ينتظر إقرارك'):(ua+' handover'+(ua>1?'s':'')+' waiting for you to accept'));
 return (currentLang==='ar'?'لديك ':'You have ')+p.join(currentLang==='ar'?'، و':', ')+'.';
}
// ── today's shape ──
function todayBand(role){
 var q=queueFor(role).filter(function(it){return dueToday(it);});
 var byHour={};
 q.forEach(function(it){var h=new Date(it.due).getHours();(byHour[h]=byHour[h]||[]).push(it);});
 return {byHour:byHour,count:q.length,nowHour:new Date(NOW()).getHours()};
}
// ── since you were last here ──
var LAST_SEEN=T0-6*3600000;
function sinceLast(role){
 var out=HIST.filter(function(e){return e.ts>LAST_SEEN&&/assigned|handed over|handover acknowledged|escalation|L1|L2|L3/.test(e.what);});
 return out.slice(-8).reverse();
}
function markSeen(){LAST_SEEN=NOW();}
// ── shift handover note, per role ──
var SHIFT_NOTES=[
 {role:'wh',by:'Khaled Omar',at:T0-9*3600000,text:'Two pallets for SL-9603 arrived without a packing list — the driver said it follows by email. Do not stuff them before it arrives.'}
];
function shiftNote(role){
 var mine=SHIFT_NOTES.filter(function(n){return n.role===role;});
 return mine.length?mine[mine.length-1]:null;
}
function shiftNotesFor(role){return SHIFT_NOTES.filter(function(n){return n.role===role;});}
function leaveNote(role,text){
 if(String(text||'').replace(/\s/g,'').length<5)return {ok:false,why:'an empty note helps nobody'};
 SHIFT_NOTES.push({role:role,by:ME.name,at:NOW(),text:text});   // kept, never overwritten
 log(role,'shift note left');
 return {ok:true};
}
