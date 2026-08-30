
// ══════════════════════════════════════════════════════════════════
//  COST ALLOCATION — a cost is booked once at trip level and split across the
//  shipments that caused it. The parts must sum to the cost, to the cent.
// ══════════════════════════════════════════════════════════════════
var KEYS=['cbm','weight','pieces','manual'];
var KEY_LABEL={cbm:'by CBM',weight:'by weight',pieces:'by pieces',manual:'manual split'};
var KEY_LABEL_AR={cbm:'بالمتر المكعب',weight:'بالوزن',pieces:'بعدد الطرود',manual:'توزيع يدوي'};
function keyLabel(k){return currentLang==='ar'?(KEY_LABEL_AR[k]||k):(KEY_LABEL[k]||k);}
var MARGIN_MIN=0.10;

var COST_LABEL={truck:'Truck hire',ocean:'Ocean freight',air:'Air freight',cfs:'CFS handling',
 border:'Border fees',customs:'Customs clearance',inland:'Inland trucking',storage:'Storage'};
var COST_LABEL_AR={truck:'أجرة الشاحنة',ocean:'الشحن البحري',air:'الشحن الجوي',cfs:'مناولة المستودع',
 border:'رسوم الحدود',customs:'التخليص الجمركي',inland:'النقل الداخلي',storage:'التخزين'};
function costLabel(c){return currentLang==='ar'?(COST_LABEL_AR[c]||c):(COST_LABEL[c]||c);}

// shipment commercial facts live here (cbm / weight / pieces / invoiced revenue)
var SHIPFACT={};
function setFact(shipId,f){SHIPFACT[shipId]=f;}
function fact(shipId){return SHIPFACT[shipId]||{cbm:0,weight:0,pieces:0,revenue:0};}

var COSTSEQ=0;
function bookCost(tripId,o){
 var tp=tripById(tripId);if(!tp)return null;
 if(!tp.costs)tp.costs=[];
 COSTSEQ++;
 var c={ref:'C-'+COSTSEQ,trip:tripId,code:o.code,amount:Number(o.amount)||0,cur:o.cur||'USD',
  supplier:o.supplier||'',ship:o.ship||null,key:o.key||'cbm',manual:o.manual||null,
  by:(ME?ME.name:'system'),at:NOW(),void:false,voidWhy:''};
 tp.costs.push(c);
 log(tripId,'cost booked '+o.code+' '+c.amount+(c.ship?' · '+c.ship:''));
 return c;
}
function duplicateOf(tripId,o){
 var tp=tripById(tripId);if(!tp||!tp.costs)return null;
 return tp.costs.find(function(c){
  return !c.void&&c.code===o.code&&c.supplier===(o.supplier||'')&&Number(c.amount)===Number(o.amount);
 })||null;
}
function voidCost(tripId,ref,why){
 var tp=tripById(tripId);if(!tp||!tp.costs)return false;
 var c=tp.costs.find(function(x){return x.ref===ref;});
 if(!c||String(why||'').replace(/\s/g,'').length<3)return false;
 c.void=true;c.voidWhy=why;                      // never deleted, excluded from every total
 log(tripId,'cost voided '+c.code+' · '+why);
 return true;
}
function liveCosts(tripId){
 var tp=tripById(tripId);
 return (tp&&tp.costs?tp.costs:[]).filter(function(c){return !c.void;});
}
function setKey(tripId,ref,key){
 var tp=tripById(tripId);if(!tp||!tp.costs)return false;
 var c=tp.costs.find(function(x){return x.ref===ref;});
 if(!c||KEYS.indexOf(key)===-1)return false;
 var from=c.key;c.key=key;
 log(tripId,'allocation key '+from+' → '+key+' on '+c.code);
 return true;
}

// ── the split. parts must sum to the amount, to the cent. ──
function weightsFor(tripId,key){
 var tp=tripById(tripId);
 var out=[], zero=[];
 tp.ships.forEach(function(s){
  var f=fact(s.id), v=0;
  if(key==='cbm')v=Number(f.cbm)||0;
  else if(key==='weight')v=Number(f.weight)||0;
  else if(key==='pieces')v=Number(f.pieces)||0;
  if(!v)zero.push(s.id);
  out.push({ship:s.id,v:v});
 });
 return {rows:out,zero:zero};
}
function allocate(tripId,cost){
 var tp=tripById(tripId);
 if(!tp)return {ok:false,why:'no trip'};
 if(cost.void)return {ok:false,why:'void'};
 if(!tp.ships.length)return {ok:false,why:'no shipments'};
 var cents=Math.round(cost.amount*100), parts=[], i;
 // a direct cost belongs wholly to its shipment
 if(cost.ship)return {ok:true,key:'direct',parts:[{ship:cost.ship,amount:cost.amount}]};
 if(tp.ships.length===1)return {ok:true,key:cost.key,parts:[{ship:tp.ships[0].id,amount:cost.amount}]};
 if(cost.key==='manual'){
  var m=cost.manual||{}, tot=0, ids=[];
  tp.ships.forEach(function(s){var p=Number(m[s.id])||0;tot+=p;ids.push(s.id);});
  if(Math.abs(tot-100)>0.001)return {ok:false,why:'manual split is '+tot+'% — it must total 100%',short:100-tot};
  var acc=0;
  for(i=0;i<ids.length;i++){
   var cc=(i===ids.length-1)?(cents-acc):Math.round(cents*(Number(m[ids[i]])||0)/100);
   acc+=cc;parts.push({ship:ids[i],amount:cc/100});
  }
  return {ok:true,key:'manual',parts:parts};
 }
 var wf=weightsFor(tripId,cost.key);
 var sum=0;wf.rows.forEach(function(r){sum+=r.v;});
 if(!sum)return {ok:false,why:'no '+cost.key+' recorded',zero:wf.zero};
 // largest-remainder, deterministic: the biggest share carries the odd cent
 var raw=wf.rows.map(function(r){return {ship:r.ship,exact:cents*r.v/sum};});
 var floors=raw.map(function(r){return {ship:r.ship,c:Math.floor(r.exact),rem:r.exact-Math.floor(r.exact),exact:r.exact};});
 var used=0;floors.forEach(function(r){used+=r.c;});
 var left=cents-used;
 var order=floors.slice().sort(function(a,b){
  if(b.rem!==a.rem)return b.rem-a.rem;
  if(b.exact!==a.exact)return b.exact-a.exact;
  return a.ship<b.ship?-1:1;
 });
 for(i=0;i<left;i++)order[i%order.length].c++;
 floors.forEach(function(r){parts.push({ship:r.ship,amount:r.c/100});});
 return {ok:true,key:cost.key,parts:parts,zero:wf.zero};
}
function allocationOf(tripId){
 var out=[];
 liveCosts(tripId).forEach(function(c){out.push({cost:c,res:allocate(tripId,c)});});
 return out;
}
function unallocated(tripId){
 return allocationOf(tripId).filter(function(x){return !x.res.ok;});
}
function costOf(shipId,tripId){
 var t=0;
 allocationOf(tripId).forEach(function(x){
  if(!x.res.ok)return;
  x.res.parts.forEach(function(p){if(p.ship===shipId)t+=p.amount;});
 });
 return Math.round(t*100)/100;
}
function revenue(shipId){return Number(fact(shipId).revenue)||0;}
function profitOf(shipId,tripId){return Math.round((revenue(shipId)-costOf(shipId,tripId))*100)/100;}
function marginOfShip(shipId,tripId){
 var r=revenue(shipId);
 if(!r)return null;
 return profitOf(shipId,tripId)/r;
}
function thinMargin(shipId,tripId){
 var m=marginOfShip(shipId,tripId);
 return m!==null&&m<MARGIN_MIN;
}
function tripProfit(tripId){
 var tp=tripById(tripId), t=0;
 tp.ships.forEach(function(s){t+=profitOf(s.id,tripId);});
 return Math.round(t*100)/100;
}
function costSourceFor(shipId,tripId){
 var out=[];
 allocationOf(tripId).forEach(function(x){
  if(!x.res.ok)return;
  x.res.parts.forEach(function(p){if(p.ship===shipId)out.push({code:x.cost.code,ref:x.cost.ref,key:x.res.key,amount:p.amount,of:x.cost.amount});});
 });
 return out;
}

// ── seed on the existing land trip ──
(function(){
 setFact('SL-9601',{cbm:2,weight:900,pieces:8,revenue:520});
 setFact('SL-9602',{cbm:3,weight:1500,pieces:12,revenue:700});
 setFact('SL-9603',{cbm:5,weight:600,pieces:30,revenue:940});
 setFact('SL-9701',{cbm:1.08,weight:120,pieces:4,revenue:210});
 bookCost('TRP-8842',{code:'truck',amount:1800,supplier:'Arslan Transport',key:'cbm'});
 bookCost('TRP-8842',{code:'border',amount:180,supplier:'Bab al-Hawa',key:'cbm'});
 bookCost('TRP-8842',{code:'customs',amount:120,supplier:'Odeh Clearance',ship:'SL-9603'}); // direct
 bookCost('TRP-8830',{code:'ocean',amount:95,supplier:'Co-loader',key:'cbm'});
})();
