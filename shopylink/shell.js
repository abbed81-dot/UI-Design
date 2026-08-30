
// ══════════════════════════════════════════════════════════════════
//  THE SHELL — global search · live sidebar badges · notification centre · port clock
//  Nothing here invents data: every count and every result comes from the engines above.
// ══════════════════════════════════════════════════════════════════

// ── 1 · GLOBAL SEARCH — one field, everything, grouped by type, status inline ──
function searchAll(q){
 q=String(q||'').trim().toLowerCase();
 if(!q)return [];
 var out=[];
 var push=function(type,id,label,status,go){out.push({type:type,id:id,label:label,status:status,go:go});};
 SHIPS.forEach(function(sp){
  if((sp.id+' '+sp.cust+' '+sp.from+' '+sp.to+' '+sp.mode).toLowerCase().indexOf(q)>-1)
   push('shipment',sp.id,sp.cust+' · '+sp.from+'→'+sp.to,
     isDelivered(sp)?t('Delivered'):t('still running'),'s4');
 });
 TRIPS.forEach(function(tp){
  if((tp.id+' '+tp.route+' '+tp.mode).toLowerCase().indexOf(q)>-1)
   push('trip',tp.id,tp.route+' · '+tp.mode,gateState(tp.id)==='CLEARED'?t('CLEARED'):t('BLOCKED'),'s5');
  tp.ships.forEach(function(sh2){
   if((sh2.id+' '+sh2.name).toLowerCase().indexOf(q)>-1)push('shipment',sh2.id,sh2.name+' · '+tp.id,tp.id,'s5');
  });
  (tp.costs||[]).forEach(function(c){
   if((c.code+' '+c.supplier).toLowerCase().indexOf(q)>-1)push('cost',c.ref,costLabel(c.code)+' · '+c.supplier,money(c.amount),'s6');
  });
 });
 CLIENTS.forEach(function(c){
  var hay=c.id+' '+c.name+' '+c.tax+' '+c.contacts.map(function(k){return k.name+' '+k.phone+' '+k.email;}).join(' ');
  if(hay.toLowerCase().indexOf(q)>-1)push('client',c.id,c.name+(c.tax?' · '+c.tax:''),t(c.status),'s7');
 });
 openItems().forEach(function(it){
  if((it.id+' '+it.ref+' '+it.title+' '+it.next).toLowerCase().indexOf(q)>-1)
   push('work',it.id,it.title+' · '+it.ref,personName(it.owner),'s1');
 });
 PEOPLE.forEach(function(p){
  if((p.id+' '+p.name).toLowerCase().indexOf(q)>-1)push('person',p.id,p.name,t(roleById(p.role).name),'s1');
 });
 MSGS.forEach(function(m){
  if(m.text.toLowerCase().indexOf(q)>-1)push('message',m.id,m.text.slice(0,60)+' · '+m.ref,m.by,'s8');
 });
 return out;
}
function searchGrouped(q){
 var r=searchAll(q), g={}, order=[];
 r.forEach(function(x){if(!g[x.type]){g[x.type]=[];order.push(x.type);}g[x.type].push(x);});
 return order.map(function(k){return {type:k,rows:g[k]};});
}

// ── 2 · SIDEBAR BADGES — the count of records needing THIS user's action ──
function badgeFor(section){
 var role=ME.role, q=queueFor(role);
 if(section==='work')   return {n:q.length, red:q.filter(function(it){return overdue(it);}).length>0};
 if(section==='gates')  return {n:TRIPS.filter(function(tp){return tp.ships.length&&gateState(tp.id)==='BLOCKED';}).length, red:true};
 if(section==='clients')return {n:provisionalTray().length, red:provisionalTray().some(function(x){return x.ageDays>PROV_DAYS;})};
 if(section==='profit') return {n:TRIPS.reduce(function(a,tp){return a+unallocated(tp.id).length;},0), red:true};
 if(section==='speed')  return {n:SHIPS.filter(function(sp){return !isDelivered(sp)&&promiseTone(sp)==='red';}).length, red:true};
 if(section==='threads')return {n:myUnacked(role).length, red:false};
 if(section==='manager')return {n:unassigned().length+critical().length, red:true};
 return {n:0,red:false};
}
function badgeHTML(section){
 var b=badgeFor(section);
 if(!b.n)return '';
 return '<span class="machine" style="margin-'+(currentLang==='ar'?'right':'left')+':6px;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;background:'+(b.red?'#E1483B':'#0EA5E9')+';color:#FFFFFF">'+b.n+'</span>';
}

// ── 3 · NOTIFICATIONS — one inbox, grouped, actionable in place, never vanishing ──
function notifications(){
 var out=[], role=ME.role;
 myUnacked(role).forEach(function(it){
  out.push({group:'action',id:'N-ack-'+it.id,item:it,
    text:t('a handover is waiting for you to accept'),act:'ack'});
 });
 critical().filter(function(it){return it.role===role||role==='manager';}).forEach(function(it){
  out.push({group:'critical',id:'N-esc-'+it.id,item:it,
    text:t('escalated to level 3 — it cannot be dismissed'),act:'open'});
 });
 queueFor(role).filter(function(it){return tone(it)==='black';}).forEach(function(it){
  out.push({group:'critical',id:'N-cut-'+it.id,item:it,
    text:t('past a hard cutoff'),act:'open'});
 });
 queueFor(role).filter(function(it){return overdue(it)&&tone(it)!=='black';}).forEach(function(it){
  out.push({group:'action',id:'N-od-'+it.id,item:it,text:t('overdue'),act:'open'});
 });
 unassigned().forEach(function(it){
  if(role!=='manager')return;
  out.push({group:'action',id:'N-un-'+it.id,item:it,text:t('no owner — nobody is accountable for this'),act:'assign'});
 });
 MSGS.filter(function(m){return m.roles.indexOf(role)>-1&&m.kind==='human'&&!m.task;}).slice(-4).forEach(function(m){
  out.push({group:'info',id:'N-msg-'+m.id,msg:m,text:t('a message addressed to your role'),act:'thread'});
 });
 return out;
}
var NOTIF_READ={};
function notifRead(id){NOTIF_READ[id]=1;render();}
function notifReadAll(){notifications().forEach(function(x){NOTIF_READ[x.id]=1;});render();}
function notifUnread(){return notifications().filter(function(x){return !NOTIF_READ[x.id];});}
function notifGroups(){
 var g={critical:[],action:[],info:[]};
 notifications().forEach(function(x){g[x.group].push(x);});
 return g;
}

// ── 4 · THE CLOCK — local time, and the port's local time where it matters ──
var PORT_TZ=[
 {place:'Damascus',  off:3},
 {place:'Istanbul',  off:3},
 {place:'Dubai',     off:4},
 {place:'Guangzhou', off:8},
 {place:'Yiwu',      off:8},
 {place:'Delaware',  off:-4}
];
function tzOf(place){
 var p=PORT_TZ.find(function(x){return x.place===place;});
 return p?p.off:null;
}
function timeAt(place,now){
 var off=tzOf(place);
 if(off===null)return null;
 var d=new Date((now||NOW())+(off-3)*HOUR);        // our own base is UTC+3
 return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
}
function clockRow(places){
 return places.filter(function(p){return tzOf(p)!==null;}).map(function(p){
  return '<span style="display:inline-flex;gap:6px;align-items:center;font-size:var(--fs-hint);font-weight:800;padding:4px 10px;border-radius:999px;background:#EEF2F7;color:#0B2A3B">'
   +p+' <span class="machine">'+timeAt(p)+'</span></span>';
 }).join('');
}
function tripPlaces(tp){
 var out=[];
 String(tp.route||'').split('→').forEach(function(x){
  x=x.replace(/\s/g,'');
  if(tzOf(x)!==null)out.push(x);
 });
 return out;
}
