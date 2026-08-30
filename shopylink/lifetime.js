
// ══════════════════════════════════════════════════════════════════
//  SHIPMENT LIFETIME — receipt → POD. A different clock from the work-item age.
//  Nothing internal resets it. Client-caused waiting is measured beside it,
//  never deducted from the number the customer experiences.
// ══════════════════════════════════════════════════════════════════
var MS_STAGES=['received','consolidated','departed','border','arrived','cleared','delivered'];
var MS_LABEL={received:'Received',consolidated:'Consolidated',departed:'Departed',border:'Border',arrived:'Arrived',cleared:'Cleared',delivered:'Delivered'};
var MS_LABEL_AR={received:'استُلمت',consolidated:'دُمجت',departed:'غادرت',border:'الحدود',arrived:'وصلت',cleared:'خُلّصت',delivered:'سُلّمت'};

// promise per LANE × MODE, in days. no default — a missing lane is 'unpromised', never guessed.
var PROMISE=[
 {from:'Guangzhou',to:'Damascus',mode:'sea',days:45},
 {from:'Guangzhou',to:'Damascus',mode:'air',days:9},
 {from:'Istanbul', to:'Damascus',mode:'land',days:12},
 {from:'Dubai',    to:'Damascus',mode:'air',days:7},
 {from:'Guangzhou',to:'Aleppo',  mode:'sea',days:48}
];
function promiseFor(from,to,mode){
 var p=PROMISE.find(function(x){return x.from===from&&x.to===to&&x.mode===mode;});
 return p?p.days*DAY:null;
}
var THIN_SAMPLE=5;

var SHIPS=[];
function mkShip(o){
 var s={id:o.id, cust:o.cust, from:o.from, to:o.to, mode:o.mode,
  receivedAt:o.receivedAt, podAt:o.podAt||null,
  stamps:o.stamps||{received:o.receivedAt},
  waits:o.waits?o.waits.slice():[]};      // [{from,to|null,why}]
 SHIPS.push(s);return s;
}
function shipById(id){return SHIPS.find(function(s){return s.id===id;})||null;}
function stamp(id,ms,at){
 var s=shipById(id);if(!s)return false;
 if(s.podAt)return false;                  // a delivered shipment is frozen
 s.stamps[ms]=at||NOW();
 if(ms==='delivered'){s.podAt=s.stamps[ms];closeWait(id);}
 log(id,'milestone '+ms);
 return true;
}
function pod(id,at){return stamp(id,'delivered',at);}

// 9. lifetime — nothing internal resets it
function lifetime(s,now){
 if(typeof s==='string')s=shipById(s);
 if(!s)return 0;
 var end=s.podAt||(now||NOW());
 return Math.max(0,end-s.receivedAt);
}
function isDelivered(s){return !!(s&&s.podAt);}
function slices(s,now){
 if(typeof s==='string')s=shipById(s);
 var out=[], pts=[], i;
 for(i=0;i<MS_STAGES.length;i++){
  var k=MS_STAGES[i];
  if(s.stamps[k]!==undefined)pts.push({k:k,at:s.stamps[k]});
 }
 var end=s.podAt||(now||NOW());
 for(i=0;i<pts.length;i++){
  var to=(i+1<pts.length)?pts[i+1].at:end;
  if(pts[i].k==='delivered')break;
  out.push({from:pts[i].k, to:(i+1<pts.length?pts[i+1].k:'now'), ms:Math.max(0,to-pts[i].at)});
 }
 return out;
}
function slicesSum(s,now){var t=0;slices(s,now).forEach(function(x){t+=x.ms;});return t;}
function worstSlice(s,now){
 var a=slices(s,now), w=null;
 a.forEach(function(x){if(!w||x.ms>w.ms)w=x;});
 return w;
}

// 10. client-caused waiting — measured as a UNION, never summed twice
function startWait(id,why,at){
 var s=shipById(id);if(!s)return false;
 s.waits.push({from:at||NOW(),to:null,why:why||''});
 log(id,'client wait started · '+(why||''));return true;
}
function closeWait(id,at){
 var s=shipById(id);if(!s)return false;
 var n=at||NOW(), hit=false;
 s.waits.forEach(function(wt){if(wt.to===null){wt.to=n;hit=true;}});
 if(hit)log(id,'client wait closed');
 return hit;
}
function clientWait(s,now){
 if(typeof s==='string')s=shipById(s);
 if(!s)return 0;
 var n=s.podAt||(now||NOW()), lo=s.receivedAt;
 var iv=s.waits.map(function(wt){
   return {a:Math.max(lo,wt.from), b:Math.min(n,(wt.to===null?n:wt.to))};
  }).filter(function(x){return x.b>x.a;});
 iv.sort(function(x,y){return x.a-y.a;});
 var total=0, cur=null;
 iv.forEach(function(x){
  if(!cur){cur={a:x.a,b:x.b};return;}
  if(x.a<=cur.b){cur.b=Math.max(cur.b,x.b);}      // overlap → union
  else {total+=cur.b-cur.a;cur={a:x.a,b:x.b};}
 });
 if(cur)total+=cur.b-cur.a;
 return Math.min(total,lifetime(s,now));           // can never exceed the total
}
function controlled(s,now){return lifetime(s,now)-clientWait(s,now);}

// 11. the promise — judged on controlled time, shown to the client as the total
function promiseOf(s){
 if(typeof s==='string')s=shipById(s);
 return s?promiseFor(s.from,s.to,s.mode):null;
}
function promisePct(s,now){
 var p=promiseOf(s);
 if(!p)return null;
 return controlled(s,now)/p;
}
function promiseTone(s,now){
 var p=promisePct(s,now);
 if(p===null)return 'grey';
 if(p<0.90)return 'green';
 if(p<=1.00)return 'amber';
 return 'red';
}
function onTime(s,now){
 var p=promisePct(s,now);
 return p===null?null:(p<=1.00);
}
function deliveredIn(from,to,mode){
 return SHIPS.filter(function(s){
  return isDelivered(s)&&(!from||s.from===from)&&(!to||s.to===to)&&(!mode||s.mode===mode);
 });
}
function avgLane(from,to,mode){
 var d=deliveredIn(from,to,mode);
 if(!d.length)return null;
 var tot=0,ctl=0;
 d.forEach(function(s){tot+=lifetime(s);ctl+=controlled(s);});
 return {n:d.length, avg:Math.round(tot/d.length), avgControlled:Math.round(ctl/d.length), thin:d.length<THIN_SAMPLE};
}
function suggestPromise(from,to,mode){
 var a=avgLane(from,to,mode);
 if(!a)return null;
 return {days:Math.round(a.avgControlled/DAY*10)/10, n:a.n, thin:a.thin};
}

// ── seed: three delivered, two running ──
(function(){
 var d=DAY;
 mkShip({id:'BSH-240520-01',cust:'TechLine Trading',from:'Guangzhou',to:'Damascus',mode:'sea',
  receivedAt:T0-52*d,
  stamps:{received:T0-52*d,consolidated:T0-49*d,departed:T0-46*d,arrived:T0-12*d,cleared:T0-9*d,delivered:T0-8*d},
  waits:[{from:T0-11*d,to:T0-9*d,why:'client had not paid the customs duty'}]});
 SHIPS[SHIPS.length-1].podAt=T0-8*d;
 mkShip({id:'BSH-240601-02',cust:'Sham Import LLC',from:'Istanbul',to:'Damascus',mode:'land',
  receivedAt:T0-14*d,
  stamps:{received:T0-14*d,consolidated:T0-13*d,departed:T0-11*d,border:T0-10*d,arrived:T0-9*d,cleared:T0-8*d,delivered:T0-8*d}});
 SHIPS[SHIPS.length-1].podAt=T0-8*d;
 mkShip({id:'CON-240610-03',cust:'Layla Al-Rifai',from:'Dubai',to:'Damascus',mode:'air',
  receivedAt:T0-9*d,
  stamps:{received:T0-9*d,consolidated:T0-8*d,departed:T0-7*d,arrived:T0-7*d,cleared:T0-5*d,delivered:T0-4*d},
  waits:[{from:T0-7*d,to:T0-5*d,why:'client did not send the invoice'}]});
 SHIPS[SHIPS.length-1].podAt=T0-4*d;
 mkShip({id:'BSH-240705-01',cust:'TechLine Trading',from:'Guangzhou',to:'Damascus',mode:'sea',
  receivedAt:T0-38*d,
  stamps:{received:T0-38*d,consolidated:T0-35*d,departed:T0-32*d,arrived:T0-3*d}});
 mkShip({id:'CON-240701-01',cust:'Layla Al-Rifai',from:'Guangzhou',to:'Aleppo',mode:'sea',
  receivedAt:T0-51*d,
  stamps:{received:T0-51*d,consolidated:T0-47*d,departed:T0-44*d,arrived:T0-6*d,cleared:T0-2*d},
  waits:[{from:T0-6*d,to:null,why:'consignee unreachable for delivery'}]});
})();
