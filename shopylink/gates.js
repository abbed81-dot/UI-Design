
// ══════════════════════════════════════════════════════════════════
//  DOCUMENT GATES — a stage cannot be exited while a required document is missing.
//  Refusal, not warning. The strictest instance is the truck departure pack.
// ══════════════════════════════════════════════════════════════════
var DOC_LABEL={
 invoice:'Commercial invoice', packing:'Packing list', coo:'Certificate of Origin',
 permit:'Transit permit', insurance:'Insurance certificate', cmr:'CMR consignment note',
 exportdec:'Export declaration', si:'Shipping instruction', vgm:'VGM', awb:'AWB',
 loading:'Loading list', manifest:'Consolidation manifest', fcr:'Warehouse receipt', pod:'POD'
};
var DOC_LABEL_AR={
 invoice:'الفاتورة التجارية', packing:'قائمة التعبئة', coo:'شهادة المنشأ',
 permit:'تصريح العبور', insurance:'شهادة التأمين', cmr:'بوليصة الطريق CMR',
 exportdec:'البيان التصديري', si:'تعليمات الشحن', vgm:'VGM', awb:'بوليصة جوية',
 loading:'قائمة التحميل', manifest:'بيان التجميع', fcr:'إيصال المستودع', pod:'توقيع الاستلام'
};
function docLabel(c){return currentLang==='ar'?(DOC_LABEL_AR[c]||c):(DOC_LABEL[c]||c);}

// the checklist is DERIVED from mode + direction + stage. never typed on the job.
var DOC_RULES={
 'land|export|depart':[
   {code:'invoice',level:'ship'},{code:'packing',level:'ship'},
   {code:'coo',level:'ship',when:'lane requires it',whenAr:'يشترطها الخط'},
   {code:'permit',level:'trip'},{code:'insurance',level:'ship',when:'if insured',whenAr:'إن كانت مؤمَّنة'}],
 'sea|export|depart':[
   {code:'si',level:'trip'},{code:'vgm',level:'trip'},{code:'loading',level:'trip'},
   {code:'invoice',level:'ship'},{code:'packing',level:'ship'},{code:'exportdec',level:'ship'}],
 'air|export|depart':[
   {code:'awb',level:'trip'},{code:'invoice',level:'ship'},{code:'packing',level:'ship'},
   {code:'exportdec',level:'ship'}],
 'land|export|deliver':[{code:'cmr',level:'ship'},{code:'pod',level:'ship'}],
 'sea|export|deliver':[{code:'pod',level:'ship'}]
};
function requiredFor(mode,dir,stage){
 var k=mode+'|'+dir+'|'+stage;
 var r=DOC_RULES[k];
 return r?r.slice():[];
}

var TRIPS=[];
function mkTrip(o){
 var tp={id:o.id,mode:o.mode,dir:o.dir||'export',route:o.route||'',ships:[],docs:[],
  overridden:false,overrides:[],stage:o.stage||'depart'};
 TRIPS.push(tp);return tp;
}
function tripById(id){return TRIPS.find(function(t){return t.id===id;})||null;}
function addShip(tripId,shipId,name){
 var tp=tripById(tripId);if(!tp)return false;
 if(tp.ships.some(function(s){return s.id===shipId;}))return false;
 tp.ships.push({id:shipId,name:name||shipId});
 return true;
}
function rmShip(tripId,shipId){
 var tp=tripById(tripId);if(!tp)return false;
 tp.ships=tp.ships.filter(function(s){return s.id!==shipId;});
 tp.docs=tp.docs.filter(function(d){return d.ship!==shipId;});   // only that shipment's documents go
 return true;
}
var DOCSEQ=0;
function attach(tripId,code,opts){
 var tp=tripById(tripId);if(!tp)return null;
 opts=opts||{};
 DOCSEQ++;
 var d={ref:'D-'+DOCSEQ,trip:tripId,code:code,ship:opts.ship||null,
   by:(ME?ME.name:'system'),at:NOW(),void:false,voidWhy:'',
   expires:opts.expires||null,supersedes:opts.supersedes||null};
 tp.docs.push(d);
 log(tripId,'attached '+code+(opts.ship?' · '+opts.ship:''));
 return d;
}
function voidDoc(tripId,ref,why){
 var tp=tripById(tripId);if(!tp)return false;
 var d=tp.docs.find(function(x){return x.ref===ref;});
 if(!d||String(why||'').replace(/\s/g,'').length<3)return false;
 d.void=true;d.voidWhy=why;                                    // never deleted
 log(tripId,'voided '+d.code+' · '+why);
 return true;
}
function replaceDoc(tripId,ref,opts){
 var tp=tripById(tripId);if(!tp)return null;
 var old=tp.docs.find(function(x){return x.ref===ref;});
 if(!old)return null;
 old.void=true;old.voidWhy='superseded';
 var nd=attach(tripId,old.code,{ship:old.ship,expires:(opts||{}).expires,supersedes:old.ref});
 return nd;
}
function expiresIn(d,now){return d.expires?(d.expires-(now||NOW())):null;}
function docLive(d,now){
 if(d.void)return false;
 if(d.expires&&(now||NOW())>d.expires)return false;            // expired satisfies nothing
 return true;
}
function docWhy(tp,code,ship,now){
 var hits=tp.docs.filter(function(d){return d.code===code&&d.ship===ship&&d.trip===tp.id;});
 if(!hits.length)return 'missing';
 if(hits.some(function(d){return docLive(d,now);}))return null;
 if(hits.some(function(d){return d.expires&&(now||NOW())>d.expires&&!d.void;}))return 'expired';
 return 'void';
}

// the gate — evaluated at the moment of exit, never cached
function gateCheck(tripId,stage,now){
 var tp=tripById(tripId);
 if(!tp)return {ok:false,missing:[],why:'no trip'};
 var req=requiredFor(tp.mode,tp.dir,stage||tp.stage);
 var miss=[];
 if(!tp.ships.length)return {ok:false,missing:[],why:'no shipments'};
 req.forEach(function(r){
  if(r.level==='trip'){
   var w=docWhy(tp,r.code,null,now);
   if(w)miss.push({ship:null,code:r.code,why:w,cond:r.when||null,condAr:r.whenAr||null});
  } else {
   tp.ships.forEach(function(s){                                // EVERY shipment, not just the first
    var w=docWhy(tp,r.code,s.id,now);
    if(w)miss.push({ship:s.id,code:r.code,why:w,cond:r.when||null,condAr:r.whenAr||null});
   });
  }
 });
 // an override only covers what was missing at the moment it was granted
 if(tp.overridden&&tp.overrides.length){
  var cov=tp.overrides[tp.overrides.length-1].covered;
  miss=miss.filter(function(m){return cov.indexOf((m.ship||'-')+':'+m.code)===-1;});
 }
 return {ok:miss.length===0,missing:miss,why:miss.length?'missing documents':''};
}
function gateState(tripId,stage,now){return gateCheck(tripId,stage,now).ok?'CLEARED':'BLOCKED';}
function tryExit(tripId,stage,now){
 var r=gateCheck(tripId,stage,now);
 if(r.ok)log(tripId,'exited stage '+(stage||''));
 return r;
}
function overrideGate(tripId,stage,reason,actorRole){
 var tp=tripById(tripId);if(!tp)return {ok:false,why:'no trip'};
 if((actorRole||ME.role)!=='manager')return {ok:false,why:'only the manager may override a gate'};
 if(String(reason||'').replace(/\s/g,'').length<5)return {ok:false,why:'reason is required'};
 var r=gateCheck(tripId,stage);
 tp.overridden=true;
 tp.overrides.push({at:NOW(),by:ME.name,reason:reason,stage:stage||tp.stage,
   covered:r.missing.map(function(m){return (m.ship||'-')+':'+m.code;}),
   missing:r.missing.slice()});
 log(tripId,'GATE OVERRIDDEN · '+reason);
 return {ok:true};
}
function overrides(){
 var out=[];
 TRIPS.forEach(function(tp){tp.overrides.forEach(function(o){out.push({trip:tp.id,o:o});});});
 return out;
}

// ── seed: one land trip carrying three shipments, one of them incomplete ──
(function(){
 var tp=mkTrip({id:'TRP-8842',mode:'land',dir:'export',route:'Istanbul → Damascus',stage:'depart'});
 addShip('TRP-8842','SL-9601','TechLine Trading');
 addShip('TRP-8842','SL-9602','Sham Import LLC');
 addShip('TRP-8842','SL-9603','Noor Trading Co');
 attach('TRP-8842','permit',{expires:T0+20*DAY});
 ['SL-9601','SL-9602','SL-9603'].forEach(function(id){
  attach('TRP-8842','invoice',{ship:id});
  attach('TRP-8842','packing',{ship:id});
 });
 attach('TRP-8842','coo',{ship:'SL-9601'});
 attach('TRP-8842','coo',{ship:'SL-9602'});
 attach('TRP-8842','insurance',{ship:'SL-9601'});
 attach('TRP-8842','insurance',{ship:'SL-9602'});
 attach('TRP-8842','insurance',{ship:'SL-9603'});
 // SL-9603 has no COO → the pack is BLOCKED and must name that shipment
 var sea=mkTrip({id:'TRP-8830',mode:'sea',dir:'export',route:'Guangzhou → Damascus',stage:'depart'});
 addShip('TRP-8830','SL-9701','Layla Al-Rifai');
 attach('TRP-8830','si');attach('TRP-8830','vgm');attach('TRP-8830','loading');
 attach('TRP-8830','invoice',{ship:'SL-9701'});
 attach('TRP-8830','packing',{ship:'SL-9701'});
 attach('TRP-8830','exportdec',{ship:'SL-9701'});
})();
