
// ── the global bar: search · clock · notifications, on every screen ──
var GQ='', GSHOW=false, NOTIF_OPEN=false;
function setGQ(v){GQ=v;GSHOW=!!v;render();}
function gGo(screen,id){
 GQ='';GSHOW=false;
 if(id&&/^SL-|^BSH-|^CON-|^TRP-/.test(id)){CHAT_REF=recordExists(id)?id:CHAT_REF;}
 if(id&&itemById(id))openI=id;
 sim=screen;render();
}
function toggleNotif(){NOTIF_OPEN=!NOTIF_OPEN;render();}
function typeLabel(k){
 return {shipment:t('shipment'),trip:t('trip'),client:t('client'),work:t('work item'),
   person:t('person'),message:t('message'),cost:t('cost')}[k]||k;
}
function globalBar(){
 var groups=searchGrouped(GQ), unread=notifUnread().length;
 var h='<div class="card" style="padding:10px 14px;margin-bottom:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">'
  +'<input type="text" value="'+String(GQ).replace(/"/g,'&quot;')+'" oninput="setGQ(this.value)" placeholder="🔍 '+t('one field — container, trip, client, invoice, plate, driver, message')+'" style="flex:1;min-width:240px;border:1.5px solid rgba(11,42,59,.15);border-radius:10px;padding:0 12px;height:var(--ctl-h);font-family:var(--body);font-size:var(--fs-body);background:#FFFFFF">'
  +clockRow(['Damascus','Istanbul','Dubai','Guangzhou'])
  +'<button onclick="toggleNotif()" style="cursor:pointer;position:relative;font-family:var(--body);font-weight:800;padding:0 14px;height:var(--ctl-h);border-radius:10px;border:1.5px solid '+(unread?'rgba(225,72,59,.45)':'rgba(11,42,59,.15)')+';background:'+(unread?'#FBE3E1':'#FFFFFF')+';color:'+(unread?'#991B1B':'#0B2A3B')+'">🔔 '+(unread?'<span class="machine">'+unread+'</span>':'')+'</button>'
  +'</div>';
 if(GSHOW&&GQ){
  h+='<div class="card" style="padding:var(--pad-card);margin-bottom:12px;border-color:#7DD3FC">'
   +'<div class="eyebrow" style="margin-bottom:8px">'+t('found')+' <span class="machine">'+searchAll(GQ).length+'</span> — '+t('grouped by type, with each record\'s status')+'</div>'
   +(groups.length?groups.map(function(g){
      return '<div style="margin-bottom:9px"><div class="eyebrow" style="margin-bottom:5px">'+typeLabel(g.type)+' · <span class="machine">'+g.rows.length+'</span></div>'
       +g.rows.slice(0,6).map(function(r){
         return '<button onclick="gGo(\''+r.go+'\',\''+r.id+'\')" style="cursor:pointer;display:block;width:100%;text-align:'+(currentLang==='ar'?'right':'left')+';padding:8px 11px;border-radius:9px;border:1.5px solid rgba(11,42,59,.09);background:#FFFFFF;margin-bottom:5px">'
          +'<span class="machine" style="font-weight:800">'+r.id+'</span> <span style="font-size:var(--fs-body)">'+r.label+'</span>'
          +'<span class="hint" style="float:'+(currentLang==='ar'?'left':'right')+'">'+r.status+'</span></button>';
        }).join('')+'</div>';
     }).join(''):'<div class="hint">'+t('nothing matches that — try a number or a name')+'</div>')
   +'</div>';
 }
 if(NOTIF_OPEN)h+=notifPanel();
 return h;
}
function notifRow(x){
 var it=x.item, m=x.msg;
 var read=!!NOTIF_READ[x.id];
 return '<div style="display:flex;gap:11px;align-items:center;flex-wrap:wrap;padding:10px 12px;border-radius:10px;border:1.5px solid rgba(11,42,59,.09);margin-bottom:6px;background:'+(read?'#FDFCF9':'#FFFFFF')+';opacity:'+(read?'.6':'1')+'">'
  +'<div style="flex:1;min-width:180px">'
  +'<div style="font-size:var(--fs-body);font-weight:800">'+x.text+'</div>'
  +'<div class="hint machine">'+(it?(it.ref+' · '+((currentLang==='ar'?it.titleAr:it.title)||'')):(m?m.ref+' · '+m.text.slice(0,40):''))+'</div></div>'
  // actionable in place — no navigating away
  +(x.act==='ack'?'<button onclick="ack(\''+it.id+'\');notifRead(\''+x.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:6px 12px;border-radius:9px;border:none;background:#10B981;color:#FFFFFF">✓ '+t('Acknowledge')+'</button>':'')
  +(x.act==='open'?'<button onclick="gGo(\'s1\',\''+it.id+'\');notifRead(\''+x.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:6px 12px;border-radius:9px;border:1.5px solid rgba(11,42,59,.18);background:#FFFFFF;color:#0B2A3B">'+t('open it')+'</button>':'')
  +(x.act==='assign'?'<button onclick="gGo(\'s2\',\''+it.id+'\');notifRead(\''+x.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:6px 12px;border-radius:9px;border:none;background:#E1483B;color:#FFFFFF">'+t('give it an owner')+'</button>':'')
  +(x.act==='thread'?'<button onclick="pickRecord(\''+m.ref+'\');gGo(\'s8\',\''+m.ref+'\');notifRead(\''+x.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:6px 12px;border-radius:9px;border:1.5px solid rgba(14,165,233,.5);background:#F4FBFF;color:#0A4A6B">'+t('open the thread')+'</button>':'')
  +(read?'':'<button onclick="notifRead(\''+x.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:6px 10px;border-radius:9px;border:1.5px solid rgba(11,42,59,.15);background:#FFFFFF;color:rgba(11,42,59,.6)">'+t('mark read')+'</button>')
  +'</div>';
}
function notifPanel(){
 var g=notifGroups();
 var section=function(key,label,col){
  if(!g[key].length)return '';
  return '<div style="margin-bottom:10px"><div class="eyebrow" style="margin-bottom:6px;color:'+col+'">'+label+' · <span class="machine">'+g[key].length+'</span></div>'
   +g[key].map(notifRow).join('')+'</div>';
 };
 var total=g.critical.length+g.action.length+g.info.length;
 return '<div class="card" style="padding:var(--pad-card);margin-bottom:12px;border-color:rgba(225,72,59,.35)">'
  +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">'
  +'<span class="eyebrow">🔔 '+t('Notifications')+' — '+t('one inbox, grouped, actionable in place')+'</span>'
  +'<button onclick="notifReadAll()" style="cursor:pointer;margin-left:auto;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:5px 12px;border-radius:8px;border:1.5px solid rgba(11,42,59,.18);background:#FFFFFF;color:#0B2A3B">'+t('mark all read')+'</button>'
  +'<button onclick="toggleNotif()" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:5px 12px;border-radius:8px;border:1.5px solid rgba(11,42,59,.18);background:#FFFFFF;color:#0B2A3B">'+t('Close')+'</button></div>'
  +(total?section('critical','🔴 '+t('Critical'),'#991B1B')+section('action','🟠 '+t('Action required'),'#78500A')+section('info','⚪ '+t('Informational'),'rgba(11,42,59,.5)')
        :'<div class="hint">'+t('nothing needs you right now')+'</div>')
  +'<div class="hint" style="margin-top:8px">'+t('a critical alert is resolved, never silenced')+'</div>'
  +'</div>';
}
