
// ══════════════════════════════════════════════════════════════════
//  CLIENTS — creating is easy, creating a DUPLICATE is hard.
//  Individuals are prepaid, always. Business accounts may carry credit days.
// ══════════════════════════════════════════════════════════════════
var STRONG=85, WEAK=40, PROV_DAYS=7;

function normName(s){
 s=String(s||'').toLowerCase();
 s=s.replace(/[\u064B-\u0652]/g,'');                 // strip Arabic diacritics
 s=s.replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
 s=s.replace(/^ال/,'');                              // the Arabic article
 s=s.replace(/\b(the|co|llc|ltd|company|trading|est)\b/g,'');
 s=s.replace(/[^0-9a-z\u0600-\u06FF]/g,'');          // spacing and punctuation vanish
 return s;
}
function normPhone(p){
 var s=String(p||'').replace(/[^0-9]/g,'');
 s=s.replace(/^00/,'');                              // 00963… → 963…
 if(s.length>9)s=s.slice(-9);                        // keep the national significant number
 return s;
}
function normTax(x){return String(x||'').replace(/[^0-9a-zA-Z]/g,'').toUpperCase();}
function bigrams(s){var out=[],i;for(i=0;i<s.length-1;i++)out.push(s.slice(i,i+2));return out;}
function diceScore(a,b){
 a=normName(a);b=normName(b);
 if(!a||!b)return 0;
 if(a===b)return 100;
 if(a.indexOf(b)>-1||b.indexOf(a)>-1)return 90;
 var A=bigrams(a),B=bigrams(b),hit=0,used={};
 A.forEach(function(g){
  for(var i=0;i<B.length;i++){if(B[i]===g&&!used[i]){used[i]=1;hit++;return;}}
 });
 return Math.round(200*hit/(A.length+B.length));
}

var CLIENTS=[
 {id:'CL-001',name:'TechLine Trading',type:'business',country:'Syria',tax:'SY-99120',
  contacts:[{name:'Fadi Nassar',phone:'+963 944 111 222',email:'fadi@techline.sy'}],
  status:'ACTIVE',creditDays:30,creditLimit:5000,mergedInto:null},
 {id:'CL-002',name:'Sham Import LLC',type:'business',country:'Syria',tax:'SY-77450',
  contacts:[{name:'Mazen Ali',phone:'+963 933 222 333',email:'mazen@sham.sy'}],
  status:'ACTIVE',creditDays:0,creditLimit:0,mergedInto:null},
 {id:'CL-003',name:'Layla Al-Rifai',type:'individual',country:'Syria',tax:'',
  contacts:[{name:'Layla Al-Rifai',phone:'+963 950 111 111',email:''}],
  status:'ACTIVE',creditDays:0,creditLimit:0,mergedInto:null}
];
var CLSEQ=3;
function clientById(id){return CLIENTS.find(function(c){return c.id===id;})||null;}
function resolveClient(id){                            // a merged id still resolves — to its survivor
 var c=clientById(id), guard=0;
 while(c&&c.mergedInto&&guard++<10)c=clientById(c.mergedInto);
 return c;
}
function liveClients(){return CLIENTS.filter(function(c){return !c.mergedInto&&c.status!=='CLOSED';});}

// ── 23. deduplicate FIRST ──
function matchClient(q){
 q=q||{};
 var out=[];
 CLIENTS.forEach(function(c){
  var why=[], score=0;
  if(q.tax&&c.tax&&normTax(q.tax)===normTax(c.tax)){score=100;why.push('same tax number');}
  if(q.phone){
   var qp=normPhone(q.phone);
   if(qp&&c.contacts.some(function(k){return normPhone(k.phone)===qp;})){score=Math.max(score,100);why.push('same phone');}
  }
  if(q.email){
   var qe=String(q.email).toLowerCase();
   if(qe&&c.contacts.some(function(k){return String(k.email).toLowerCase()===qe;})){score=Math.max(score,100);why.push('same email');}
  }
  if(q.name){
   var ns=diceScore(q.name,c.name);
   if(ns>score){score=ns;}
   if(ns>=WEAK)why.push('similar name');
  }
  if(score>=WEAK){
   out.push({client:c, score:score, why:why,
     merged:!!c.mergedInto, survivor:c.mergedInto?resolveClient(c.id):null});
  }
 });
 out.sort(function(a,b){return b.score-a.score;});
 return out;
}
function strongMatches(q){return matchClient(q).filter(function(m){return m.score>=STRONG;});}

// ── 24. quick create ──
function quickCreate(o,dismissReason){
 o=o||{};
 var need=[];
 if(!o.name)need.push('name');
 if(!o.country)need.push('country');
 if(!o.contact)need.push('contact name');
 if(!o.phone&&!o.email)need.push('phone or email');
 if(need.length)return {ok:false,need:need};
 var sm=strongMatches({name:o.name,phone:o.phone,email:o.email,tax:o.tax});
 if(sm.length&&String(dismissReason||'').replace(/\s/g,'').length<5)
  return {ok:false,duplicate:sm,why:'a strong match must be dismissed with a reason'};
 CLSEQ++;
 var id='CL-'+('00'+CLSEQ).slice(-3);
 var c={id:id,name:o.name,type:o.type||'individual',country:o.country,tax:o.tax||'',
  contacts:[{name:o.contact,phone:o.phone||'',email:o.email||''}],
  status:'PROVISIONAL',creditDays:0,creditLimit:0,mergedInto:null,
  createdAt:NOW(),dismissed:dismissReason||''};
 CLIENTS.push(c);
 log(id,'client quick-created'+(dismissReason?' · duplicate dismissed: '+dismissReason:''));
 // the completion task joins the same anti-forgetting engine as everything else
 var wi=mk({ref:id,title:'Complete the client profile',titleAr:'إكمال ملف العميل',kind:'profile',
   owner:'U-06',role:'sales',next:'collect the trade licence and tax number',nextAr:'اجمع السجل التجاري والرقم الضريبي',
   due:NOW()+PROV_DAYS*DAY,allow:PROV_DAYS*DAY});
 c.task=wi.id;
 return {ok:true,id:id,client:c,task:wi.id};
}
function provisionalTray(){
 return CLIENTS.filter(function(c){return c.status==='PROVISIONAL';}).map(function(c){
  return {client:c, ageDays:Math.floor((NOW()-(c.createdAt||T0))/DAY), task:c.task||null};
 });
}
function completeProfile(id,fields){
 var c=clientById(id);if(!c)return {ok:false};
 fields=fields||{};
 var need=[];
 if(!(fields.tax||c.tax))need.push('tax number');
 if(!(fields.address||c.address))need.push('address');
 if(need.length)return {ok:false,need:need};
 c.tax=fields.tax||c.tax;c.address=fields.address||c.address;
 c.status='ACTIVE';
 if(c.task)resolve(c.task);
 log(c.id,'profile completed → ACTIVE');
 return {ok:true};
}
function applyContract(id){
 var c=resolveClient(id);
 if(!c)return {ok:false,why:'no client'};
 if(c.status!=='ACTIVE')return {ok:false,why:'a provisional client is on the general tariff, prepaid, with no contract'};
 return {ok:true};
}

// ── 25. merge ──
function mergeClients(loserId,survivorId,reason){
 var a=clientById(loserId), b=clientById(survivorId);
 if(!a||!b||a.id===b.id)return {ok:false,why:'no client'};
 if(String(reason||'').replace(/\s/g,'').length<5)return {ok:false,why:'reason is required'};
 if(resolveClient(b.id).id===a.id)return {ok:false,why:'that would be circular'};
 a.contacts.forEach(function(k){
  if(!b.contacts.some(function(x){return normPhone(x.phone)===normPhone(k.phone)&&x.name===k.name;}))b.contacts.push(k);
 });
 SHIPS.forEach(function(s){if(s.cust===a.name)s.cust=b.name;});
 // the stricter credit terms survive
 b.creditDays=Math.min(Number(b.creditDays)||0,Number(a.creditDays)||0);
 b.creditLimit=Math.min(Number(b.creditLimit)||0,Number(a.creditLimit)||0);
 a.mergedInto=b.id;a.status='CLOSED';
 log(a.id,'merged into '+b.id+' · '+reason);
 return {ok:true};
}
function openShipmentsOf(clientId){
 var c=clientById(clientId);if(!c)return 0;
 return SHIPS.filter(function(s){return s.cust===c.name&&!isDelivered(s);}).length;
}

// ── 26. credit — business only ──
var INVOICES_C=[
 {id:'INV-24-0101',client:'CL-001',amount:1800,paid:0,dueAt:T0-12*DAY},
 {id:'INV-24-0107',client:'CL-001',amount:900,paid:900,dueAt:T0-3*DAY},
 {id:'INV-24-0112',client:'CL-002',amount:640,paid:0,dueAt:T0+9*DAY}
];
function setCredit(id,days,limit){
 var c=resolveClient(id);
 if(!c)return {ok:false,why:'no client'};
 if(c.type!=='business')return {ok:false,why:'individuals are prepaid — credit is for business accounts only'};
 if(c.status==='PROVISIONAL')return {ok:false,why:'a provisional account stays prepaid until its profile is complete'};
 c.creditDays=Number(days)||0;c.creditLimit=Number(limit)||0;
 log(c.id,'credit set '+c.creditDays+'d / '+c.creditLimit);
 return {ok:true};
}
function outstanding(id){
 var t=0;
 INVOICES_C.forEach(function(v){if(v.client===id)t+=(v.amount-v.paid);});
 return Math.round(t*100)/100;
}
function overdueAmount(id,now){
 var n=now||NOW(), t=0;
 INVOICES_C.forEach(function(v){if(v.client===id&&v.dueAt<n)t+=(v.amount-v.paid);});
 return Math.round(t*100)/100;
}
function checkCredit(id,newAmount){
 var c=resolveClient(id);
 if(!c)return {ok:false,why:'no client'};
 if(c.type!=='business'||!c.creditLimit)
  return {ok:true,prepaid:true,note:'prepaid'};
 var after=outstanding(id)+(Number(newAmount)||0);
 if(after>c.creditLimit)
  return {ok:false,over:Math.round((after-c.creditLimit)*100)/100,limit:c.creditLimit,after:after};
 return {ok:true,after:after,limit:c.creditLimit};
}
var RELEASE_OVERRIDES=[];
function releaseOverLimit(id,reason,actorRole){
 if((actorRole||ME.role)!=='manager')return {ok:false,why:'only the manager may release over the limit'};
 if(String(reason||'').replace(/\s/g,'').length<5)return {ok:false,why:'reason is required'};
 RELEASE_OVERRIDES.push({client:id,by:ME.name,at:NOW(),reason:reason});
 log(id,'released over the credit limit · '+reason);
 return {ok:true};
}
