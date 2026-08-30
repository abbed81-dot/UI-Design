
// ── S5 document gates: BLOCKED or CLEARED, and nothing in between ──
function gateBadge(tp){
 var st=gateState(tp.id);
 var cleared=st==='CLEARED';
 return '<span style="font-family:var(--disp);font-weight:800;letter-spacing:.06em;font-size:var(--fs-lead);padding:9px 18px;border-radius:11px;background:'
  +(cleared?'#10B981':'#E1483B')+';color:#FFFFFF">'+(cleared?'✓ '+t('CLEARED'):'⛔ '+t('BLOCKED'))+'</span>';
}
function docChip(tp,code,ship){
 var why=docWhy(tp,code,ship);
 var d=tp.docs.filter(function(x){return x.code===code&&x.ship===ship;}).slice(-1)[0];
 var bg=!why?'#DCF5E9':(why==='missing'?'#FBE3E1':'#FDF0D5');
 var fg=!why?'#065F46':(why==='missing'?'#991B1B':'#78500A');
 var mark=!why?'✓':(why==='missing'?'✕':(why==='expired'?'⌛':'⊘'));
 var extra='';
 if(d&&d.expires&&!d.void){
  var left=expiresIn(d);
  extra=' <span class="machine" style="opacity:.75">'+(left>0?Math.ceil(left/DAY)+'d':t('expired'))+'</span>';
 }
 return '<span style="display:inline-flex;align-items:center;gap:7px;font-size:var(--fs-hint);font-weight:800;padding:6px 12px;border-radius:999px;background:'+bg+';color:'+fg+'">'
  +mark+' '+docLabel(code)+extra
  +(why&&why!=='missing'?' <span style="opacity:.8">'+t(why)+'</span>':'')
  +'</span>';
}
function tripGateCard(tp){
 var chk=gateCheck(tp.id), req=requiredFor(tp.mode,tp.dir,tp.stage);
 var tripReq=req.filter(function(r){return r.level==='trip';});
 var shipReq=req.filter(function(r){return r.level==='ship';});
 var h='<div class="card" style="margin-bottom:12px;overflow:hidden;border-color:'+(chk.ok?'rgba(16,185,129,.45)':'rgba(225,72,59,.45)')+'">'
  +'<div style="display:flex;gap:var(--gap);align-items:center;padding:var(--pad-row);background:'+(chk.ok?'#E9F8F1':'#FFF7F6')+'">'
  +'<span style="font-size:21px">'+(tp.mode==='land'?'🚚':(tp.mode==='sea'?'🚢':'✈'))+'</span>'
  +'<div style="flex:1;min-width:160px">'
  +'<div style="font-family:var(--disp);font-size:var(--fs-lead);font-weight:800;letter-spacing:-.025em">'+tp.id+'</div>'
  +'<div class="hint">'+tp.route+' · '+tp.mode+' · <span class="machine">'+tp.ships.length+'</span> '+t('shipments')+'</div></div>'
  +(tp.overridden?'<span style="font-size:var(--fs-hint);font-weight:800;padding:5px 11px;border-radius:999px;background:#FDF0D5;color:#78500A">⚠ '+t('overridden')+'</span>':'')
  +gateBadge(tp)
  +'</div>'
  +'<div style="padding:var(--pad-card)">';
 if(tripReq.length){
  h+='<div class="eyebrow" style="margin-bottom:7px">'+t('trip documents')+'</div>'
   +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px">'
   +tripReq.map(function(r){return docChip(tp,r.code,null);}).join('')+'</div>';
 }
 tp.ships.forEach(function(s){
  var bad=chk.missing.filter(function(m){return m.ship===s.id;}).length;
  h+='<div style="padding:10px 12px;border-radius:10px;border:1.5px solid '+(bad?'rgba(225,72,59,.35)':'rgba(11,42,59,.09)')+';background:'+(bad?'#FFF7F6':'#FFFFFF')+';margin-bottom:7px">'
   +'<div style="display:flex;gap:9px;align-items:center;margin-bottom:7px">'
   +'<span style="font-weight:800;font-size:var(--fs-body)">'+s.name+'</span>'
   +'<span class="hint machine">'+s.id+'</span>'
   +(bad?'<span style="margin-left:auto;font-size:var(--fs-hint);font-weight:800;color:#991B1B">'+bad+' '+t('missing')+'</span>':'')
   +'</div>'
   +'<div style="display:flex;gap:7px;flex-wrap:wrap">'
   +shipReq.map(function(r){return docChip(tp,r.code,s.id);}).join('')
   +'</div></div>';
 });
 if(!chk.ok){
  h+='<div style="margin-top:10px;padding:12px 14px;border-radius:11px;background:#FBE3E1;border:1.5px solid rgba(225,72,59,.4)">'
   +'<div style="font-weight:800;font-size:var(--fs-body);color:#991B1B;margin-bottom:6px">⛔ '+t('departure refused — the pack is incomplete')+'</div>'
   +'<div style="font-size:var(--fs-body);color:#991B1B">'
   +(chk.why==='no shipments'?t('no shipments on this trip')
     :chk.missing.map(function(m){return (m.ship?'<b class="machine">'+m.ship+'</b> · ':'')+docLabel(m.code)+' <span style="opacity:.75">('+t(m.why)+')</span>';}).join('<br>'))
   +'</div>'
   +(ME.role==='manager'
     ?'<button onclick="askOverride(\''+tp.id+'\')" style="cursor:pointer;margin-top:10px;font-family:var(--body);font-weight:800;padding:0 18px;border-radius:10px;border:1.5px solid rgba(225,72,59,.5);background:#FFFFFF;color:#E1483B">'+t('Override with a reason')+'</button>'
     :'<div class="hint" style="margin-top:8px;font-weight:800;color:#991B1B">'+t('only the manager may override a gate')+'</div>')
   +'</div>';
 } else {
  h+='<button onclick="doExit(\''+tp.id+'\')" style="cursor:pointer;margin-top:10px;font-family:var(--body);font-weight:800;padding:0 20px;border-radius:10px;border:none;background:#10B981;color:#FFFFFF">'+t('Release to the driver')+'</button>';
 }
 // quick attach for the demo
 var missCodes=[];
 chk.missing.forEach(function(m){if(m.why==='missing')missCodes.push(m);});
 if(missCodes.length){
  h+='<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
   +'<span class="hint" style="font-weight:800">'+t('attach the missing one')+':</span>'
   +missCodes.map(function(m){
     return '<button onclick="attach(\''+tp.id+'\',\''+m.code+'\','+(m.ship?'{ship:\''+m.ship+'\'}':'{}')+');render()" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:7px 13px;border-radius:9px;border:1.5px dashed rgba(14,165,233,.55);background:#F4FBFF;color:#0A4A6B">📎 '+docLabel(m.code)+(m.ship?' · '+m.ship:'')+'</button>';
    }).join('')
   +'</div>';
 }
 return h+'</div></div>';
}
function doExit(id){
 var r=tryExit(id);
 askConfirm(r.ok?t('Released'):t('Refused'),
  r.ok?('<b>'+id+'</b><br>'+t('the pack is complete and the trip may depart'))
      :('<b style="color:#991B1B">'+t('departure refused — the pack is incomplete')+'</b>'),
  t('Close'),!r.ok,function(){});
}
function askOverride(id){
 askReason(t('Override the gate?'),
  '<b>'+id+'</b><br>'+t('The documents stay missing. The override is recorded with your name and reviewed weekly.'),
  t('Confirm'),function(reason){
   var r=overrideGate(id,null,reason,ME.role);
   if(!r.ok)askConfirm(t('Refused'),'<b style="color:#991B1B">'+t(r.why)+'</b>',t('Close'),true,function(){});
  });
}
function renderS5(){
 var h=modalHTML()
  +'<div class="card" style="padding:var(--pad-card);margin-bottom:13px">'
  +'<div class="eyebrow" style="margin-bottom:5px">'+t('Document gates')+'</div>'
  +'<div style="font-size:var(--fs-body);font-weight:700">'+t('a stage cannot be exited while a required document is missing — this is a refusal, not a warning')+'</div>'
  +'<div class="hint" style="margin-top:5px">'+t('the checklist is generated from mode, direction and stage · the pack checks every shipment on the trip')+'</div>'
  +'</div>'
  +TRIPS.map(tripGateCard).join('');
 var ov=overrides();
 h+='<div class="card" style="margin-top:13px;padding:var(--pad-card)'+(ov.length?';border-color:rgba(251,191,36,.55)':'')+'">'
  +'<div class="eyebrow" style="margin-bottom:9px">'+t('Overrides — reviewed weekly')+' · <span class="machine">'+ov.length+'</span></div>'
  +(ov.length?ov.map(function(x){
    return '<div style="padding:9px 0;border-bottom:1px solid rgba(11,42,59,.05);font-size:var(--fs-body)">'
     +'<b class="machine">'+x.trip+'</b> — “'+x.o.reason+'” <span class="hint">'+x.o.by+'</span>'
     +'<div class="hint" style="margin-top:3px">'+t('missing at the time')+': '+x.o.missing.map(function(m){return (m.ship?m.ship+'·':'')+docLabel(m.code);}).join(' · ')+'</div></div>';
   }).join(''):'<div class="hint">'+t('none — the packs have been complete')+'</div>')
  +'</div>';
 return h;
}
