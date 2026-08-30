
// ── quick create panel ──
var QC_OPEN=false, qcK='work', qcF={};
function toggleQC(){QC_OPEN=!QC_OPEN;qcF={};var ctx=qcContext();if(ctx.ref)qcF.ref=ctx.ref;if(ctx.trip)qcF.trip=ctx.trip;render();}
function qcKind(k){qcK=k;qcF={};var ctx=qcContext();if(ctx.ref)qcF.ref=ctx.ref;if(ctx.trip)qcF.trip=ctx.trip;render();}
function qcF_set(k,v){qcF[k]=v;}
function qcToggleRole(r){qcF.roles=qcF.roles||[];var i=qcF.roles.indexOf(r);if(i>-1)qcF.roles.splice(i,1);else qcF.roles.push(r);render();}
function doQC(){
 var r=quickCreateThing(qcK,qcF);
 if(!r.ok){
  askConfirm(t('Refused'),'<b style="color:#991B1B">'+(r.need?t('still missing')+': '+r.need.map(function(x){return t(x);}).join(' · '):t(r.why))+'</b>',t('Close'),true,function(){});
  return;
 }
 QC_OPEN=false;qcF={};
 var made=r.id;
 sim=r.goto;render();
 askConfirm(t('Created'),'<b class="machine">'+made+'</b>',t('Close'),false,function(){});
}
function qcInput(k,label,w2,type){
 return '<span style="display:flex;flex-direction:column;gap:4px"><span class="eyebrow">'+label+'</span>'
  +'<input type="'+(type||'text')+'" value="'+String(qcF[k]===undefined?'':qcF[k]).replace(/"/g,'&quot;')+'" oninput="qcF_set(\''+k+'\',this.value)" style="width:'+w2+';border:1.5px solid rgba(11,42,59,.15);border-radius:9px;padding:0 11px;height:var(--ctl-h);font-family:var(--body);font-size:var(--fs-body);background:#FFFFFF"></span>';
}
function qcPanel(){
 if(!QC_OPEN)return '';
 var ctx=qcContext();
 var h='<div class="card" style="padding:var(--pad-card);margin-bottom:12px;border:2px solid rgba(16,185,129,.5)">'
  +'<div style="display:flex;gap:10px;align-items:center;margin-bottom:9px">'
  +'<span class="eyebrow">+ '+t('Quick create')+'</span>'
  +(ctx.why?'<span class="hint">'+t('pre-filled from')+' '+t(ctx.why)+'</span>':'')
  +'<button onclick="toggleQC()" style="cursor:pointer;margin-left:auto;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:5px 12px;border-radius:8px;border:1.5px solid rgba(11,42,59,.18);background:#FFFFFF;color:#0B2A3B">'+t('Close')+'</button></div>'
  +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:11px">'
  +QC_KINDS.map(function(k){var on=qcK===k.id;
    return '<button onclick="qcKind(\''+k.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:7px 13px;border-radius:999px;border:1.5px solid '+(on?'#10B981':'rgba(11,42,59,.14)')+';background:'+(on?'#DCF5E9':'#FFFFFF')+';color:'+(on?'#065F46':'#0B2A3B')+'">'+qcKindLabel(k.id)+'</button>';
   }).join('')
  +'</div><div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end">';
 if(qcK==='work'){
  h+=qcInput('ref',t('record'),'150px')
   +'<span style="display:flex;flex-direction:column;gap:4px"><span class="eyebrow">'+t('role')+'</span>'
   +'<select oninput="qcF_set(\'role\',this.value)" style="border:1.5px solid rgba(11,42,59,.15);border-radius:9px;padding:0 11px;height:var(--ctl-h);font-family:var(--body);background:#FFFFFF"><option value="">—</option>'
   +ROLES.map(function(r){return '<option value="'+r.id+'">'+t(r.name)+'</option>';}).join('')+'</select></span>'
   +'<span style="display:flex;flex-direction:column;gap:4px"><span class="eyebrow">'+t('at')+'</span>'
   +'<select oninput="qcF_set(\'hub\',this.value)" style="border:1.5px solid rgba(11,42,59,.15);border-radius:9px;padding:0 11px;height:var(--ctl-h);font-family:var(--body);background:#FFFFFF">'
   +HUBS.map(function(hb){return '<option value="'+hb.id+'">'+hubLabel(hb.id)+'</option>';}).join('')+'</select></span>'
   +qcInput('next',t('next action'),'230px')
   +qcInput('due',t('due in hours'),'110px','number');
 } else if(qcK==='client'){
  h+=qcInput('name',t('name'),'180px')+qcInput('country',t('country'),'120px')+qcInput('contact',t('contact name'),'160px')
   +qcInput('phone',t('phone'),'150px')+qcInput('email',t('email'),'170px');
 } else if(qcK==='message'){
  h+=qcInput('ref',t('record'),'150px')
   +'<span style="display:flex;flex-direction:column;gap:4px"><span class="eyebrow">'+t('addressed to')+'</span>'
   +'<span style="display:flex;gap:5px;flex-wrap:wrap">'+ROLES.filter(function(r){return r.id!=='manager';}).map(function(r){
      var on=(qcF.roles||[]).indexOf(r.id)>-1;
      return '<button onclick="qcToggleRole(\''+r.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:6px 11px;border-radius:999px;border:1.5px solid '+(on?'#0EA5E9':'rgba(11,42,59,.14)')+';background:'+(on?'#E6F4FE':'#FFFFFF')+';color:'+(on?'#0A4A6B':'#0B2A3B')+'">@'+t(r.name)+'</button>';
     }).join('')+'</span></span>'
   +qcInput('text',t('message'),'260px');
 } else if(qcK==='cost'){
  h+='<span style="display:flex;flex-direction:column;gap:4px"><span class="eyebrow">'+t('trip')+'</span>'
   +'<select oninput="qcF_set(\'trip\',this.value)" style="border:1.5px solid rgba(11,42,59,.15);border-radius:9px;padding:0 11px;height:var(--ctl-h);font-family:var(--body);background:#FFFFFF"><option value="">—</option>'
   +TRIPS.map(function(tp){return '<option value="'+tp.id+'"'+(qcF.trip===tp.id?' selected':'')+'>'+tp.id+'</option>';}).join('')+'</select></span>'
   +qcInput('code',t('cost'),'140px')+qcInput('amount',t('amount'),'120px','number')+qcInput('supplier',t('supplier'),'160px');
 } else {
  h+=qcInput('text',t('what the next person needs to know'),'380px');
 }
 h+='<button onclick="doQC()" style="cursor:pointer;font-family:var(--body);font-weight:800;padding:0 20px;height:var(--ctl-h);border-radius:10px;border:none;background:#10B981;color:#FFFFFF">'+t('Create')+'</button>'
  +'</div><div class="hint" style="margin-top:8px">'+t('it refuses to create a half-thing — every field it asks for, it needs')+'</div></div>';
 return h;
}
// ── notice board ──
function noticeBoard(){
 var live=noticeLive(), arch=noticeArchive();
 if(!live.length&&!arch.length)return '';
 var kindCol={advisory:['#FDF0D5','#78500A'],policy:['#E6F4FE','#0A4A6B'],closure:['#EEF2F7','rgba(11,42,59,.6)']};
 var h='';
 if(live.length){
  h+='<div class="card" style="padding:var(--pad-card);margin-bottom:13px;border-color:rgba(251,191,36,.45)">'
   +'<div class="eyebrow" style="margin-bottom:8px">📌 '+t('From management')+' · <span class="machine">'+live.length+'</span></div>'
   +live.map(function(nb){
     var c=kindCol[nb.kind]||kindCol.advisory;
     return '<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 12px;border-radius:10px;background:'+c[0]+';margin-bottom:6px">'
      +'<div style="flex:1;min-width:200px">'
      +'<div style="font-size:var(--fs-body);font-weight:700;line-height:1.6;color:'+c[1]+'">'+(currentLang==='ar'?nb.ar:nb.en)+'</div>'
      +'<div class="hint" style="margin-top:4px">'+nb.by+' · <span class="machine">'+slDateStr(new Date(nb.at))+'</span> · '+t(nb.kind)+'</div></div>'
      +'<button onclick="dismissNotice(\''+nb.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:5px 11px;border-radius:8px;border:1.5px solid rgba(11,42,59,.18);background:#FFFFFF;color:#0B2A3B">'+t('dismiss')+'</button>'
      +'</div>';
    }).join('')
   +'</div>';
 }
 if(arch.length){
  h+='<div class="card" style="padding:var(--pad-card);margin-bottom:13px">'
   +'<div class="eyebrow" style="margin-bottom:7px">🗄 '+t('dismissed — kept, not deleted')+' · <span class="machine">'+arch.length+'</span></div>'
   +arch.map(function(nb){
     return '<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(11,42,59,.05);font-size:var(--fs-body)">'
      +'<span style="flex:1;opacity:.65">'+(currentLang==='ar'?nb.ar:nb.en)+'</span>'
      +'<button onclick="restoreNotice(\''+nb.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:5px 11px;border-radius:8px;border:1.5px solid rgba(11,42,59,.15);background:#FFFFFF;color:rgba(11,42,59,.6)">'+t('bring it back')+'</button></div>';
    }).join('')
   +'</div>';
 }
 return h;
}
// ── S9 · profile & preferences ──
function renderS9(){
 var r=roleById(ME.role);
 var pill=function(on,label,onclick){
  return '<button onclick="'+onclick+'" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:7px 14px;border-radius:999px;border:1.5px solid '+(on?'#0EA5E9':'rgba(11,42,59,.14)')+';background:'+(on?'#E6F4FE':'#FFFFFF')+';color:'+(on?'#0A4A6B':'#0B2A3B')+'">'+label+'</button>';
 };
 return modalHTML()
  +'<div class="card" style="padding:var(--pad-card);margin-bottom:13px">'
  +'<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">'
  +'<div style="width:54px;height:54px;border-radius:50%;background:#0B2A3B;color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-family:var(--disp);font-weight:800;font-size:20px">'+ME.name.slice(0,1)+'</div>'
  +'<div style="flex:1;min-width:220px">'
  +'<div style="font-family:var(--disp);font-size:var(--fs-figure);font-weight:800;letter-spacing:-.025em">'+ME.name+'</div>'
  +'<div class="hint machine">'+ME.id+' · '+t(r.name)+' · 📍 '+hubLabel(ME.hub)+'</div>'
  +'<div class="hint" style="margin-top:7px;line-height:1.6;max-width:620px">'+(currentLang==='ar'?r.stmtAr:r.stmt)+'</div></div>'
  +'</div></div>'
  +oooStrip()
  +'<div class="card" style="padding:var(--pad-card);margin-bottom:13px">'
  +'<div class="eyebrow" style="margin-bottom:9px">'+t('Preferences')+' — '+t('mine only · company settings live under Admin')+'</div>'
  +'<div style="display:flex;gap:22px;flex-wrap:wrap">'
  +'<div><div class="eyebrow" style="margin-bottom:5px">'+t('language')+'</div><div style="display:flex;gap:6px">'
   +pill(currentLang==='en','English',"setPref('lang','en')")+pill(currentLang==='ar','العربية',"setPref('lang','ar')")+'</div></div>'
  +'<div><div class="eyebrow" style="margin-bottom:5px">'+t('density')+'</div><div style="display:flex;gap:6px">'
   +pill(density==='comfortable',t('Comfortable'),"setPref('density','comfortable')")+pill(density==='compact',t('Compact'),"setPref('density','compact')")+'</div></div>'
  +'<div><div class="eyebrow" style="margin-bottom:5px">'+t('timezone')+'</div><div style="display:flex;gap:6px;flex-wrap:wrap">'
   +HUBS.map(function(hb){return pill(PREFS.tz===hb.id,hubLabel(hb.id)+' <span class="machine">'+timeAt(hb.en)+'</span>',"setPref('tz','"+hb.id+"')");}).join('')+'</div></div>'
  +'</div></div>'
  +'<div class="card" style="padding:var(--pad-card);margin-bottom:13px">'
  +'<div class="eyebrow" style="margin-bottom:9px">'+t('Notifications')+'</div>'
  +[['handover',t('a handover is waiting for you to accept')],['escalation',t('escalated to level 3 — it cannot be dismissed')],
    ['message',t('a message addressed to your role')],['cutoff',t('past a hard cutoff')]].map(function(p){
    var on=PREFS.notify[p[0]], locked=p[0]==='cutoff';
    return '<div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid rgba(11,42,59,.05)">'
     +'<span style="flex:1;font-size:var(--fs-body);font-weight:700">'+p[1]+'</span>'
     +(locked?'<span style="font-size:var(--fs-hint);font-weight:800;padding:5px 11px;border-radius:999px;background:#FBE3E1;color:#991B1B">🔒 '+t('cannot be switched off')+'</span>'
       :'<button onclick="setNotifyPref(\''+p[0]+'\','+(!on)+')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:6px 14px;border-radius:999px;border:1.5px solid '+(on?'#10B981':'rgba(11,42,59,.15)')+';background:'+(on?'#DCF5E9':'#FFFFFF')+';color:'+(on?'#065F46':'rgba(11,42,59,.5)')+'">'+(on?t('on'):t('off'))+'</button>')
     +'</div>';
   }).join('')
  +'</div>'
  +'<div class="card" style="padding:var(--pad-card)">'
  +'<div class="eyebrow" style="margin-bottom:9px">'+t('My activity')+'</div>'
  +(myActivity().length?myActivity().map(function(e){
     return '<div style="display:flex;gap:12px;padding:7px 0;border-bottom:1px solid rgba(11,42,59,.05);font-size:var(--fs-body)">'
      +'<span class="machine" style="color:rgba(11,42,59,.45)">'+e.at+'</span>'
      +'<span class="machine" style="color:rgba(11,42,59,.45)">'+e.ref+'</span><span>'+e.what+'</span></div>';
    }).join(''):'<div class="hint">'+t('nothing yet in this session')+'</div>')
  +'</div>';
}
