
// ── S0 · My Day ──
var noteDraft='';
function setNote(v){noteDraft=v;}
function doLeaveNote(){
 var r=leaveNote(ME.role,noteDraft);
 if(!r.ok){askConfirm(t('Refused'),'<b style="color:#991B1B">'+t(r.why)+'</b>',t('Close'),true,function(){});return;}
 noteDraft='';render();
}
function priorityRow(it,i){
 var tn=tone(it), col={black:'#0B2A3B',red:'#E1483B',amber:'#F59E0B',green:'#10B981',grey:'#94A3B8'}[tn];
 return '<div style="display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:11px;border:1.5px solid '+(tn==='black'||tn==='red'?'rgba(225,72,59,.35)':'rgba(11,42,59,.09)')+';background:'+(tn==='black'?'#FFF7F6':(tn==='red'?'#FFF7F6':'#FFFFFF'))+';margin-bottom:8px">'
  +'<span class="machine" style="width:22px;font-weight:800;color:rgba(11,42,59,.35);padding-top:2px">'+(i+1)+'</span>'
  +'<span style="width:10px;height:10px;border-radius:50%;background:'+col+';margin-top:6px;flex-shrink:0"></span>'
  +'<div style="flex:1;min-width:190px">'
  +'<div style="font-family:var(--disp);font-size:var(--fs-lead);font-weight:800;letter-spacing:-.025em">'+((currentLang==='ar'?it.nextAr:it.next)||(currentLang==='ar'?it.titleAr:it.title))+'</div>'
  +'<div class="hint machine" style="margin-top:2px">'+it.ref+' · '+((currentLang==='ar'?it.titleAr:it.title))+'</div>'
  +'<div style="margin-top:5px;font-size:var(--fs-body);font-weight:700;color:'+(tn==='black'||tn==='red'?'#991B1B':'#78500A')+'">'+consequenceOf(it)+'</div>'
  +'</div>'
  +'<div style="text-align:right;min-width:110px">'
  +'<div class="eyebrow">'+t('due')+'</div>'
  +'<div class="machine" style="font-weight:800;color:'+(tn==='red'||tn==='black'?'#991B1B':'#0B2A3B')+'">'+fmtDue(it)+'</div></div>'
  +'<div style="display:flex;gap:7px;flex-wrap:wrap">'
  +(it.ho&&!it.ho.ack&&it.ho.to===ME.role
    ?'<button onclick="ack(\''+it.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:7px 13px;border-radius:9px;border:none;background:#10B981;color:#FFFFFF">✓ '+t('Acknowledge')+'</button>'
    :'<button onclick="touch(\''+it.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:7px 13px;border-radius:9px;border:1.5px solid rgba(11,42,59,.18);background:#FFFFFF;color:#0B2A3B">'+t('Touch')+'</button>')
  +'<button onclick="resolve(\''+it.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:7px 13px;border-radius:9px;border:none;background:#0EA5E9;color:#FFFFFF">'+t('Resolve')+'</button>'
  +'</div></div>';
}
function renderS0(){
 var role=ME.role, r=roleById(role), list=priorityList(role), band=todayBand(role), sn=shiftNote(role), since=sinceLast(role);
 var h=modalHTML()
  // 1 · the greeting states the obligation
  +'<div class="card" style="padding:var(--pad-card);margin-bottom:13px">'
  +'<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">'
  +'<div style="flex:1;min-width:260px">'
  +'<div class="eyebrow">'+greetingWord()+' · '+slDateStr(new Date(NOW()))+'</div>'
  +'<div style="font-family:var(--disp);font-size:var(--fs-figure);font-weight:800;letter-spacing:-.025em;margin:4px 0 6px">'+ME.name+'</div>'
  +'<div style="font-size:var(--fs-lead);font-weight:800;color:'+(list.filter(function(x){return overdue(x);}).length?'#991B1B':'#065F46')+'">'+obligationLine(role)+'</div>'
  +'<div class="hint" style="margin-top:7px;line-height:1.6;max-width:640px">'+(currentLang==='ar'?r.stmtAr:r.stmt)+'</div>'
  +'</div>'
  +'<div><div class="eyebrow">'+t('Acting as')+'</div>'
  +'<select oninput="setActor(this.value)" style="margin-top:5px;border:1.5px solid rgba(11,42,59,.15);border-radius:10px;padding:0 11px;font-family:var(--body);background:#FFFFFF">'
  +PEOPLE.map(function(p){return '<option value="'+p.id+'"'+(p.id===ME.id?' selected':'')+'>'+p.name+' — '+t(roleById(p.role).name)+'</option>';}).join('')
  +'</select></div>'
  +densityToggle()
  +'</div></div>'
  +oooStrip()
  +topStrip(role)
  +drillPanel();
 // 2 · shift handover note
 if(sn){
  h+='<div class="card" style="padding:var(--pad-card);margin-bottom:13px;background:#FFFDF6;border-color:rgba(251,191,36,.5)">'
   +'<div class="eyebrow" style="margin-bottom:5px">🔁 '+t('from the previous shift')+'</div>'
   +'<div style="font-size:var(--fs-body);font-weight:700;line-height:1.6">'+sn.text+'</div>'
   +'<div class="hint" style="margin-top:5px">'+sn.by+' · <span class="machine">'+(new Date(sn.at).getHours()<10?'0':'')+new Date(sn.at).getHours()+':'+('0'+new Date(sn.at).getMinutes()).slice(-2)+'</span>'
   +(shiftNotesFor(role).length>1?' · '+t('earlier notes kept')+' ('+(shiftNotesFor(role).length-1)+')':'')+'</div>'
   +'</div>';
 }
 // 3 · the priority list
 h+='<div class="eyebrow" style="margin-bottom:8px">'+t('Do this now')+' — '+t('ordered by consequence, not by date')+' · <span class="machine">'+list.length+'</span></div>';
 h+=list.length?list.map(priorityRow).join('')
  :'<div class="card" style="padding:34px 20px;text-align:center;margin-bottom:13px"><div style="font-size:30px;margin-bottom:8px">✓</div>'
   +'<div style="font-family:var(--disp);font-size:var(--fs-title);font-weight:800;letter-spacing:-.025em">'+t('Nothing waiting on you')+'</div>'
   +'<div class="hint" style="margin-top:6px">'+t('take a stalled item from the manager board, or leave a note for the next shift')+'</div></div>';
 // 4 · today's shape
 h+='<div class="card" style="margin-top:13px;padding:var(--pad-card)">'
  +'<div class="eyebrow" style="margin-bottom:9px">🕐 '+t('The shape of today')+' · <span class="machine">'+band.count+'</span></div>';
 if(!band.count){
  h+='<div class="hint">'+t('nothing falls due today')+'</div>';
 } else {
  h+='<div style="display:flex;gap:2px;align-items:flex-end;height:74px">';
  for(var hh=7;hh<=20;hh++){
   var items=band.byHour[hh]||[], past=hh<band.nowHour, isNow=hh===band.nowHour;
   var worst='green';
   items.forEach(function(it){if(TONE_RANK[tone(it)]<TONE_RANK[worst])worst=tone(it);});
   var col=items.length?{black:'#0B2A3B',red:'#E1483B',amber:'#F59E0B',green:'#10B981',grey:'#94A3B8'}[worst]:'#E4E9F0';
   h+='<div style="flex:1;text-align:center">'
    +'<div title="'+items.map(function(it){return it.ref;}).join(', ')+'" style="height:'+(items.length?Math.min(46,14+items.length*16):6)+'px;background:'+col+';border-radius:5px;opacity:'+(past?'.4':'1')+';'+(isNow?'box-shadow:0 0 0 2px #0EA5E9;':'')+'"></div>'
    +'<div class="machine" style="font-size:9.5px;color:rgba(11,42,59,'+(isNow?'.9':'.4')+');margin-top:4px;font-weight:'+(isNow?'800':'600')+'">'+hh+'</div></div>';
  }
  h+='</div><div class="hint" style="margin-top:7px">'+t('spent hours are dimmed · the ringed hour is now')+'</div>';
 }
 h+='</div>';
 // 5 · since you were last here
 h+='<div class="card" style="margin-top:13px;padding:var(--pad-card)">'
  +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">'
  +'<span class="eyebrow">👁 '+t('Since you were last here')+' · <span class="machine">'+since.length+'</span></span>'
  +'<button onclick="markSeen()" style="cursor:pointer;margin-left:auto;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:5px 12px;border-radius:8px;border:1.5px solid rgba(11,42,59,.18);background:#FFFFFF;color:#0B2A3B">'+t('mark as seen')+'</button></div>'
  +(since.length?since.map(function(e){
     return '<div style="display:flex;gap:12px;padding:7px 0;border-bottom:1px solid rgba(11,42,59,.05);font-size:var(--fs-body)">'
      +'<span class="machine" style="color:rgba(11,42,59,.45)">'+e.at+'</span>'
      +'<span class="machine" style="color:rgba(11,42,59,.45)">'+e.ref+'</span>'
      +'<span><b>'+e.who+'</b> '+e.what+'</span></div>';
    }).join(''):'<div class="hint">'+t('nothing changed while you were away')+'</div>')
  +'</div>';
 // 6 · leave a note for the next shift
 h+='<div class="card" style="margin-top:13px;padding:var(--pad-card)">'
  +'<div class="eyebrow" style="margin-bottom:7px">✍ '+t('Leave a note for the next shift')+'</div>'
  +'<textarea oninput="setNote(this.value)" rows="2" placeholder="'+t('what the next person needs to know')+'" style="width:100%;border:1.5px solid rgba(11,42,59,.15);border-radius:10px;padding:10px 12px;font-family:var(--body);font-size:var(--fs-body);background:#FFFFFF">'+String(noteDraft).replace(/</g,'&lt;')+'</textarea>'
  +'<button onclick="doLeaveNote()" style="cursor:pointer;margin-top:8px;font-family:var(--body);font-weight:800;padding:0 18px;border-radius:10px;border:none;background:#0EA5E9;color:#FFFFFF">'+t('Leave the note')+'</button>'
  +'</div>';
 return h+auditCard();
}
