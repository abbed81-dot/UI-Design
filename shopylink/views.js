
// ── views ──
var sim='s1', openI=null;
function toggleI(id){openI=openI===id?null:id;render();}
function fmtAge(ms){
 var h=Math.floor(ms/HOUR);
 if(h<1)return Math.max(0,Math.floor(ms/60000))+'m';
 if(h<48)return h+'h';
 return Math.floor(h/24)+'d';
}
function fmtDue(it){
 if(!it.due)return '—';
 var d=new Date(it.due), n=NOW();
 var diff=it.due-n, s=(diff<0?'-':'')+fmtAge(Math.abs(diff));
 return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+' ('+s+')';
}
function toneDot(tn){
 var c={green:'#10B981',amber:'#F59E0B',red:'#E1483B',black:'#0B2A3B',grey:'#94A3B8'}[tn];
 return '<span style="width:10px;height:10px;border-radius:50%;background:'+c+';display:inline-block;flex-shrink:0'+(tn==='black'?';box-shadow:0 0 0 3px rgba(11,42,59,.18)':'')+'"></span>';
}
function escPill(it){
 if(!it.esc)return '';
 var m={1:['#FDF0D5','#78500A'],2:['#FFE4CC','#9A3412'],3:['#FBE3E1','#991B1B']}[it.esc];
 return '<span style="font-size:var(--fs-hint);font-weight:800;padding:4px 10px;border-radius:999px;background:'+m[0]+';color:'+m[1]+'">'+t('escalation')+' L'+it.esc+'</span>';
}
function itemCard(it){
 var tn=tone(it), brk=missing(it), open2=openI===it.id;
 return '<div class="card" style="margin-bottom:9px;overflow:hidden;border-color:'+(open2?'#7DD3FC':(tn==='black'?'#0B2A3B':(tn==='red'?'rgba(225,72,59,.45)':'rgba(11,42,59,.09)')))+'">'
  +'<div onclick="toggleI(\''+it.id+'\')" style="cursor:pointer;display:flex;align-items:center;gap:var(--gap);padding:var(--pad-row);background:'+(open2?'#F4FBFF':'#FFFFFF')+'">'
  +toneDot(tn)
  +'<div style="flex:1;min-width:160px">'
  +'<div style="font-family:var(--disp);font-size:var(--fs-lead);font-weight:800;letter-spacing:-.025em">'+(currentLang==='ar'?it.titleAr:it.title)+'</div>'
  +'<div class="hint machine">'+it.id+' · '+it.ref+'</div></div>'
  +(brk.length?'<span style="font-size:var(--fs-hint);font-weight:800;padding:4px 10px;border-radius:999px;background:#FBE3E1;color:#991B1B">⚠ '+t(brk[0])+'</span>':'')
  +'<span class="hint">'+t('owner')+' <b>'+personName(it.owner)+'</b></span>'
  +'<span class="machine hint">'+t('age')+' '+fmtAge(ageMs(it))+'</span>'
  +'<span class="machine" style="font-weight:800;color:'+(tn==='red'||tn==='black'?'#991B1B':'#0B2A3B')+'">'+fmtDue(it)+'</span>'
  +escPill(it)
  +(it.ho&&!it.ho.ack?'<span style="font-size:var(--fs-hint);font-weight:800;padding:4px 10px;border-radius:999px;background:#FDF0D5;color:#78500A">🤝 '+t('awaiting acknowledgement')+'</span>':'')
  +'<span style="font-size:16px;color:rgba(11,42,59,.35)">'+(open2?'▾':'▸')+'</span></div>'
  +(open2?itemBody(it,brk,tn):'')
  +'</div>';
}
function itemBody(it,brk,tn){
 var h='<div style="padding:var(--pad-card);border-top:1px solid rgba(11,42,59,.07);background:#FDFCF9">';
 h+='<div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:12px">'
  +'<div><div class="eyebrow">'+t('owner')+'</div><div style="font-weight:800;font-size:var(--fs-body)">'+(it.owner?personName(it.owner):'<span style="color:#991B1B">'+t('no owner')+'</span>')+'</div></div>'
  +'<div><div class="eyebrow">'+t('next action')+'</div><div style="font-weight:800;font-size:var(--fs-body)">'+((currentLang==='ar'?it.nextAr:it.next)||'<span style="color:#991B1B">'+t('no next action')+'</span>')+'</div></div>'
  +'<div><div class="eyebrow">'+t('due')+'</div><div class="machine" style="font-weight:800;font-size:var(--fs-body)">'+(it.due?fmtDue(it):'<span style="color:#991B1B">'+t('no due date')+'</span>')+'</div></div>'
  +'</div>';
 if(tn==='black')h+='<div style="padding:10px 13px;border-radius:10px;background:#0B2A3B;color:#FFFFFF;font-weight:800;font-size:var(--fs-body);margin-bottom:11px">⬛ '+t('past a hard cutoff')+'</div>';
 if(it.esc>=3)h+='<div style="padding:10px 13px;border-radius:10px;background:#FBE3E1;color:#991B1B;font-weight:800;font-size:var(--fs-body);margin-bottom:11px">'+t('cannot be dismissed at L3 — resolve or reassign with a reason')+'</div>';
 if(it.ho&&!it.ho.ack){
  h+='<div style="padding:11px 13px;border-radius:10px;background:#FFF7E6;border:1.5px solid rgba(251,191,36,.55);margin-bottom:11px">'
   +'<div style="font-weight:800;font-size:var(--fs-body);color:#78500A">🤝 '+t('from')+' '+t(roleById(it.ho.from)?roleById(it.ho.from).name:it.ho.from)+' '+t('to')+' '+t(roleById(it.ho.to).name)+'</div>'
   +'<div class="hint" style="margin-top:4px">'+t('Ownership stays with you until they acknowledge.')+'</div>'
   +'<button onclick="ack(\''+it.id+'\')" style="cursor:pointer;margin-top:9px;font-family:var(--body);font-weight:800;padding:0 18px;border-radius:9px;border:none;background:#10B981;color:#FFFFFF">✓ '+t('Acknowledge')+'</button></div>';
 }
 h+='<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center;padding-top:11px;border-top:1px solid rgba(11,42,59,.07)">';
 if(!it.owner){
  h+='<select onchange="if(this.value)assign(\''+it.id+'\',this.value)" style="border:1.5px solid rgba(14,165,233,.5);border-radius:9px;padding:0 11px;font-family:var(--body);background:#F4FBFF"><option value="">'+t('Assign to…')+'</option>'
   +PEOPLE.map(function(p){return '<option value="'+p.id+'">'+p.name+' — '+t(roleById(p.role).name)+'</option>';}).join('')+'</select>';
 } else {
  h+='<button onclick="touch(\''+it.id+'\')" style="cursor:pointer;font-family:var(--body);font-weight:800;padding:0 16px;border-radius:9px;border:1.5px solid rgba(11,42,59,.18);background:#FFFFFF;color:#0B2A3B">'+t('Touch')+'</button>'
   +'<select onchange="if(this.value)doHandover(\''+it.id+'\',this.value);this.value=\'\'" style="border:1.5px solid rgba(11,42,59,.15);border-radius:9px;padding:0 11px;font-family:var(--body);background:#FFFFFF"><option value="">'+t('Hand over to…')+'</option>'
   +ROLES.filter(function(r){return r.id!==it.role;}).map(function(r){return '<option value="'+r.id+'">'+t(r.name)+'</option>';}).join('')+'</select>'
   +'<select onchange="if(this.value)askReassign(\''+it.id+'\',this.value);this.value=\'\'" style="border:1.5px solid rgba(11,42,59,.15);border-radius:9px;padding:0 11px;font-family:var(--body);background:#FFFFFF"><option value="">'+t('Reassign to…')+'</option>'
   +PEOPLE.filter(function(p){return p.id!==it.owner;}).map(function(p){return '<option value="'+p.id+'">'+p.name+'</option>';}).join('')+'</select>'
   +'<span style="margin-left:auto"></span>'
   +'<button onclick="resolve(\''+it.id+'\')" style="cursor:pointer;font-family:var(--body);font-weight:800;padding:0 18px;border-radius:9px;border:none;background:#10B981;color:#FFFFFF">✓ '+t('Resolve')+'</button>'
   +(ME.role==='manager'?'<button onclick="askCancel(\''+it.id+'\')" style="cursor:pointer;font-family:var(--body);font-weight:800;padding:0 16px;border-radius:9px;border:1.5px solid rgba(225,72,59,.5);background:#FFFFFF;color:#E1483B">'+t('Cancel job')+'</button>':'');
 }
 return h+'</div></div>';
}
function doHandover(id,role){
 var r=handover(id,role);
 if(!r.ok&&r.why)askConfirm(t('Hand over to…'),'<b style="color:#991B1B">'+t(r.why)+'</b>',t('Close'),true,function(){});
}
function askReassign(id,pid){
 var it=itemById(id);
 if(it.esc>=3){
  askReason(t('Reassign'),'<b>'+it.id+'</b> · '+t('escalation')+' L3<br>'+t('cannot be dismissed at L3 — resolve or reassign with a reason'),t('Confirm'),function(reason){reassign(id,pid,reason);});
 } else reassign(id,pid,'');
}
function askCancel(id){
 askReason(t('Cancel this job?'),'<b>'+id+'</b><br>'+t('It can never be deleted — it stays in the cancelled log.'),t('Confirm'),function(reason){
  if(!cancel(id,reason,ME.role))askConfirm(t('Cancel job'),'<b style="color:#991B1B">'+t('only the manager may cancel')+'</b>',t('Close'),true,function(){});
 });
}
function topStrip(role){
 var q=queueFor(role);
 var od=q.filter(function(it){return overdue(it);}).length;
 var dt=q.filter(function(it){return dueToday(it);}).length;
 var ua=myUnacked(role).length;
 var cell=function(lbl,n,col){
  return '<div style="flex:1;min-width:130px;padding:12px 14px;border-radius:12px;background:'+(n?col[0]:'#F7F4EC')+';border:1.5px solid '+(n?col[1]:'rgba(11,42,59,.08)')+'">'
   +'<div class="eyebrow">'+lbl+'</div>'
   +'<div class="figure" style="margin-top:3px;color:'+(n?col[2]:'rgba(11,42,59,.3)')+'">'+n+'</div></div>';
 };
 return '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:13px">'
  +cell(t('my overdue'),od,['#FBE3E1','rgba(225,72,59,.4)','#991B1B'])
  +cell(t('due today'),dt,['#FDF0D5','rgba(251,191,36,.5)','#78500A'])
  +cell(t('unacknowledged handovers'),ua,['#E6F4FE','rgba(14,165,233,.4)','#0A4A6B'])
  +'</div>';
}
function renderS1(){
 var role=ME.role, r=roleById(role), q=queueFor(role);
 q=q.slice().sort(function(a,b){
  var o={black:0,red:1,amber:2,green:3,grey:4};
  var d=o[tone(a)]-o[tone(b)];
  if(d)return d;
  return (a.due||9e15)-(b.due||9e15);
 });
 var h=modalHTML()
  +'<div class="card" style="padding:var(--pad-card);margin-bottom:13px;display:flex;gap:18px;flex-wrap:wrap;align-items:center">'
  +'<div><div class="eyebrow">'+t('Acting as')+'</div>'
  +'<select oninput="setActor(this.value)" style="margin-top:5px;border:1.5px solid rgba(11,42,59,.15);border-radius:10px;padding:0 11px;font-family:var(--body);background:#FFFFFF">'
  +PEOPLE.map(function(p){return '<option value="'+p.id+'"'+(p.id===ME.id?' selected':'')+'>'+p.name+' — '+t(roleById(p.role).name)+'</option>';}).join('')
  +'</select></div>'
  +'<div style="flex:1;min-width:250px;border-left:1px solid rgba(11,42,59,.1);padding-left:18px">'
  +'<div class="eyebrow">'+t('Responsibility')+'</div>'
  +'<div style="font-size:var(--fs-body);font-weight:700;line-height:1.6;margin-top:4px">'+(currentLang==='ar'?r.stmtAr:r.stmt)+'</div></div>'
  +'<span style="margin-left:auto"></span>'+densityToggle()+'</div>'
  +topStrip(role)
  +'<div class="eyebrow" style="margin-bottom:8px">'+t('My queue')+' · <span class="machine">'+q.length+'</span> '+t('items')+'</div>';
 h+=q.length?q.map(itemCard).join('')
  :'<div class="card" style="padding:40px 20px;text-align:center"><div style="font-size:32px;margin-bottom:9px">✓</div>'
   +'<div style="font-family:var(--disp);font-size:var(--fs-title);font-weight:800;letter-spacing:-.025em">'+t('Nothing waiting on you')+'</div>'
   +'<div class="hint" style="margin-top:5px">'+t('Everything you own is on time.')+'</div></div>';
 return h+auditCard();
}
function renderS2(){
 sweep();
 var un=unassigned(), st=stalled(), cr=critical(), sh=staleHandovers();
 var box=function(title,list,col,note){
  return '<div class="card" style="margin-bottom:12px;border-color:'+(list.length?col[1]:'rgba(11,42,59,.09)')+'">'
   +'<div style="padding:var(--pad-row);background:'+(list.length?col[0]:'#F7F4EC')+';display:flex;align-items:center;gap:12px">'
   +'<span class="eyebrow" style="color:'+(list.length?col[2]:'rgba(11,42,59,.45)')+'">'+title+'</span>'
   +'<span class="figure" style="font-size:var(--fs-title);color:'+(list.length?col[2]:'rgba(11,42,59,.3)')+'">'+list.length+'</span>'
   +(note?'<span class="hint" style="margin-left:auto">'+note+'</span>':'')+'</div>'
   +(list.length?'<div style="padding:var(--pad-card)">'+list.map(itemCard).join('')+'</div>':'');
 };
 var h=modalHTML();
 h+=box('⚠ '+t('Unassigned — needs owner'),un,['#FBE3E1','rgba(225,72,59,.45)','#991B1B'],t('this tray being non-empty is itself an alert'));
 h+=box('🔴 '+t('Critical'),cr,['#FBE3E1','rgba(225,72,59,.45)','#991B1B'],t('cannot be dismissed at L3 — resolve or reassign with a reason'));
 h+=box('⏸ '+t('Stalled'),st,['#FDF0D5','rgba(251,191,36,.5)','#78500A'],'24h');
 h+=box('🤝 '+t('unacknowledged handovers'),sh,['#E6F4FE','rgba(14,165,233,.4)','#0A4A6B'],'4h');
 // team load
 h+='<div class="card" style="padding:var(--pad-card);margin-bottom:12px">'
  +'<div class="eyebrow" style="margin-bottom:9px">'+t('Team load')+'</div>'
  +PEOPLE.map(function(p){
    var mine=openItems().filter(function(it){return it.owner===p.id;});
    var od=mine.filter(function(it){return overdue(it);}).length;
    return '<div style="display:flex;gap:14px;align-items:center;padding:8px 0;border-bottom:1px solid rgba(11,42,59,.05);font-size:var(--fs-body)">'
     +'<span style="flex:1;font-weight:800">'+p.name+'</span>'
     +'<span class="hint">'+t(roleById(p.role).name)+'</span>'
     +'<span class="machine" style="font-weight:800">'+mine.length+' '+t('active')+'</span>'
     +'<span class="machine" style="font-weight:800;color:'+(od?'#991B1B':'rgba(11,42,59,.35)')+'">'+od+' '+t('overdue')+'</span></div>';
   }).join('')+'</div>';
 // cancelled log
 var cn=cancelled();
 if(cn.length){
  h+='<div class="card" style="padding:var(--pad-card);margin-bottom:12px">'
   +'<div class="eyebrow" style="margin-bottom:9px">'+t('Cancelled')+'</div>'
   +cn.map(function(it){return '<div style="padding:8px 0;border-bottom:1px solid rgba(11,42,59,.05);font-size:var(--fs-body)"><b class="machine">'+it.id+'</b> · '+it.ref+' — “'+it.cancelReason+'” <span class="hint">'+it.by+' · '+it.at+'</span></div>';}).join('')
   +'</div>';
 }
 return h+auditCard();
}
function renderS3(){
 var btn=function(lbl,ms){return '<button onclick="pushClock('+ms+')" style="cursor:pointer;font-family:var(--body);font-weight:800;padding:0 16px;border-radius:10px;border:1.5px solid rgba(14,165,233,.5);background:#F4FBFF;color:#0A4A6B">'+lbl+'</button>';};
 var d=new Date(NOW());
 return modalHTML()
  +'<div class="card" style="padding:var(--pad-card);margin-bottom:13px">'
  +'<div class="eyebrow" style="margin-bottom:5px">'+t('Advance the clock')+'</div>'
  +'<div class="hint" style="margin-bottom:11px">'+t('the whole engine reads this clock — tests move it, they never wait')+'</div>'
  +'<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center">'
  +'<span class="machine" style="font-family:var(--disp);font-weight:800;letter-spacing:-.025em;font-size:var(--fs-figure)">'
  +('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+'</span>'
  +'<span class="hint machine">'+slDateStr(d)+'</span>'
  +'<span style="margin-left:auto"></span>'
  +btn(t('+1h'),HOUR)+btn(t('+4h'),4*HOUR)+btn(t('+1d'),DAY)+btn(t('+2d'),2*DAY)+btn(t('+3d'),3*DAY)
  +'<button onclick="resetClock()" style="cursor:pointer;font-family:var(--body);font-weight:800;padding:0 16px;border-radius:10px;border:1.5px solid rgba(11,42,59,.18);background:#FFFFFF;color:#0B2A3B">'+t('reset')+'</button>'
  +'</div></div>'
  +'<div class="card" style="padding:var(--pad-card)">'
  +'<div class="eyebrow" style="margin-bottom:9px">'+t('all queues')+'</div>'
  +openItems().slice().sort(function(a,b){return (a.due||9e15)-(b.due||9e15);}).map(itemCard).join('')
  +'</div>'+auditCard();
}
function auditCard(){
 return '<div class="card" style="margin-top:13px;padding:var(--pad-card)">'
  +'<div class="eyebrow" style="margin-bottom:9px">'+t('Audit log')+'</div>'
  +AUDIT.map(function(a){return '<div style="display:flex;gap:12px;padding:7px 0;border-bottom:1px solid rgba(11,42,59,.05);font-size:var(--fs-body)">'
    +'<span class="machine" style="color:rgba(11,42,59,.45)">'+a.at+'</span>'
    +'<span class="machine" style="color:rgba(11,42,59,.45)">'+a.ref+'</span>'
    +'<span><b>'+a.who+'</b> '+a.what+'</span></div>';}).join('')
  +'<div class="hint" style="margin-top:8px">'+t('every change is logged')+'</div></div>';
}
// ── router ──
function render(){
 var el=document.getElementById('shell');
 if(sim==='s1'){el.innerHTML=renderS1();return;}
 if(sim==='s2'){el.innerHTML=renderS2();return;}
 if(sim==='s3'){el.innerHTML=renderS3();return;}
 el.innerHTML='<div style="padding:20px;color:rgba(11,42,59,.52)">Unknown state</div>';
}
function go(s){
 sim=s;
 document.querySelectorAll('.sl-sim-btn').forEach(function(b){b.classList.remove('on');});
 var a=document.querySelector('.sl-sim-btn[onclick*="\''+s+'\'"]');
 if(a)a.classList.add('on');
 render();
 var sc=document.querySelector('.sl-scroll');if(sc)sc.scrollTop=0;
}
try{
 document.documentElement.setAttribute('data-density','comfortable');
 document.getElementById('sl-logo').innerHTML=slLockup(16,'white');
 document.getElementById('sl-date').textContent=slDateStr(new Date(NOW()));
 document.querySelector('.sl-menu').onclick=function(){document.querySelector('.sl-sb').classList.toggle('open');};
 document.querySelector('.sl-overlay').onclick=function(){document.querySelector('.sl-sb').classList.remove('open');};
}catch(e){}
go('s1');
</script>
