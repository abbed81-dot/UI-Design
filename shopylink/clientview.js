
// ── S7 clients: dedupe first, quick create second, provisional tray always visible ──
var qc={name:'',country:'Syria',contact:'',phone:'',email:'',tax:'',type:'individual',dismiss:''};
function setQc(k,v){qc[k]=v;
 var b=document.getElementById('qc-go');
 if(b){var okNow=qcReady();b.disabled=!okNow;b.style.cursor=okNow?'pointer':'not-allowed';
  b.style.background=okNow?'#10B981':'#E4E9F0';b.style.color=okNow?'#FFFFFF':'rgba(11,42,59,.4)';}
 var m=document.getElementById('qc-match');if(m)m.innerHTML=matchPanel();
}
function qcReady(){return !!(qc.name&&qc.country&&qc.contact&&(qc.phone||qc.email));}
function matchPanel(){
 if(!qc.name&&!qc.phone&&!qc.email&&!qc.tax)return '';
 var ms=matchClient({name:qc.name,phone:qc.phone,email:qc.email,tax:qc.tax});
 if(!ms.length)return '<div class="hint" style="font-weight:700;color:#065F46">✓ '+t('no similar client found')+'</div>';
 return '<div style="padding:11px 13px;border-radius:10px;background:#FFF7E6;border:1.5px solid rgba(251,191,36,.55)">'
  +'<div style="font-weight:800;font-size:var(--fs-body);color:#78500A;margin-bottom:7px">⚠ '+t('possible duplicates — check before creating')+'</div>'
  +ms.map(function(m){
    var strong=m.score>=STRONG;
    return '<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-top:1px solid rgba(11,42,59,.06)">'
     +'<span style="flex:1;font-weight:800;font-size:var(--fs-body)">'+m.client.name+' <span class="hint machine">'+m.client.id+'</span>'
     +(m.merged?' <span class="hint">→ '+t('merged into')+' '+m.survivor.name+'</span>':'')+'</span>'
     +'<span class="hint">'+m.why.map(function(x){return t(x);}).join(' · ')+'</span>'
     +'<span class="machine" style="font-size:var(--fs-hint);font-weight:800;padding:4px 10px;border-radius:999px;background:'+(strong?'#FBE3E1':'#EEF2F7')+';color:'+(strong?'#991B1B':'rgba(11,42,59,.6)')+'">'+m.score+'</span>'
     +'</div>';
   }).join('')
  +(strongMatches({name:qc.name,phone:qc.phone,email:qc.email,tax:qc.tax}).length
    ?'<div style="margin-top:9px"><div class="eyebrow" style="margin-bottom:5px">'+t('to create anyway, say why it is not the same client')+'</div>'
      +'<input type="text" value="'+String(qc.dismiss).replace(/"/g,'&quot;')+'" oninput="setQc(\'dismiss\',this.value)" style="width:100%;border:1.5px solid rgba(225,72,59,.45);border-radius:9px;padding:9px 11px;font-family:var(--body);font-size:var(--fs-body);background:#FFFFFF"></div>':'')
  +'</div>';
}
function doQuickCreate(){
 var r=quickCreate(qc,qc.dismiss);
 if(!r.ok){
  askConfirm(t('Refused'),'<b style="color:#991B1B">'+(r.need?t('still missing')+': '+r.need.map(function(x){return t(x);}).join(' · '):t(r.why))+'</b>',t('Close'),true,function(){});
  return;
 }
 qc={name:'',country:'Syria',contact:'',phone:'',email:'',tax:'',type:'individual',dismiss:''};
 askConfirm(t('Created'),'<b>'+r.id+'</b> · '+t('PROVISIONAL')+'<br>'+t('the job may proceed · prepaid, general tariff, no credit')+'<br>'+t('a completion task was created for Sales, due in 7 days')+' <span class="machine">'+r.task+'</span>',t('Close'),false,function(){});
}
function askMerge(loser,survivor){
 var n=openShipmentsOf(loser);
 askReason(t('Merge these two?'),
  '<b>'+clientById(loser).name+'</b> → <b>'+clientById(survivor).name+'</b><br>'
  +t('the losing record is kept and marked merged — it is never deleted, and its id still resolves')
  +(n?'<div style="margin-top:9px;padding:9px 12px;border-radius:9px;background:#FDF0D5;color:#78500A;font-weight:800">⚠ <span class="machine">'+n+'</span> '+t('open shipments will move with it')+'</div>':''),
  t('Confirm'),function(reason){
   var r=mergeClients(loser,survivor,reason);
   if(!r.ok)askConfirm(t('Refused'),'<b style="color:#991B1B">'+t(r.why)+'</b>',t('Close'),true,function(){});
  });
}
function clientCard(c){
 var out=outstanding(c.id), ovd=overdueAmount(c.id);
 var prov=c.status==='PROVISIONAL';
 return '<div class="card" style="margin-bottom:9px;padding:var(--pad-card);border-color:'+(prov?'rgba(251,191,36,.5)':'rgba(11,42,59,.09)')+';background:'+(prov?'#FFFDF6':'#FFFFFF')+'">'
  +'<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">'
  +'<div style="flex:1;min-width:170px">'
  +'<div style="font-family:var(--disp);font-size:var(--fs-lead);font-weight:800;letter-spacing:-.025em">'+c.name+'</div>'
  +'<div class="hint machine">'+c.id+' · '+c.country+(c.tax?' · '+c.tax:'')+' · '+t(c.type==='business'?'business':'individual')+'</div></div>'
  +'<span style="font-size:var(--fs-hint);font-weight:800;padding:5px 11px;border-radius:999px;background:'
   +(prov?'#FDF0D5':(c.status==='ACTIVE'?'#DCF5E9':'#EEF2F7'))+';color:'+(prov?'#78500A':(c.status==='ACTIVE'?'#065F46':'rgba(11,42,59,.55)'))+'">'+t(c.status)+'</span>'
  +(c.type==='business'&&c.creditDays
    ?'<span class="machine" style="font-size:var(--fs-hint);font-weight:800;padding:5px 11px;border-radius:999px;background:#E6F4FE;color:#0A4A6B">'+c.creditDays+'d · '+money(c.creditLimit)+'</span>'
    :'<span style="font-size:var(--fs-hint);font-weight:800;padding:5px 11px;border-radius:999px;background:#EEF2F7;color:rgba(11,42,59,.6)">'+t('prepaid')+'</span>')
  +(out?'<div style="text-align:right"><div class="eyebrow">'+t('outstanding')+'</div><div class="machine" style="font-weight:800;color:'+(ovd?'#991B1B':'#0B2A3B')+'">'+money(out)+(ovd?' · '+money(ovd)+' '+t('overdue'):'')+'</div></div>':'')
  +'</div>'
  +(c.mergedInto?'<div class="hint" style="margin-top:7px">→ '+t('merged into')+' <b>'+resolveClient(c.id).name+'</b></div>':'')
  +'</div>';
}
function renderS7(){
 var tray=provisionalTray();
 var h=modalHTML()
  +'<div class="card" style="padding:var(--pad-card);margin-bottom:13px">'
  +'<div class="eyebrow" style="margin-bottom:5px">'+t('Clients')+'</div>'
  +'<div style="font-size:var(--fs-body);font-weight:700">'+t('creating a client is easy · creating a duplicate is hard')+'</div>'
  +'<div class="hint" style="margin-top:5px">'+t('operations is never held up by paperwork — the shipment proceeds and Sales completes the profile')+'</div></div>';
 // provisional tray with age
 h+='<div class="card" style="margin-bottom:13px;border-color:'+(tray.length?'rgba(251,191,36,.55)':'rgba(11,42,59,.09)')+'">'
  +'<div style="padding:var(--pad-row);background:'+(tray.length?'#FFF7E6':'#F7F4EC')+';display:flex;align-items:center;gap:12px">'
  +'<span class="eyebrow" style="color:'+(tray.length?'#78500A':'rgba(11,42,59,.45)')+'">'+t('Provisional — needs completion')+'</span>'
  +'<span class="figure" style="font-size:var(--fs-title);color:'+(tray.length?'#78500A':'rgba(11,42,59,.3)')+'">'+tray.length+'</span>'
  +'<span class="hint" style="margin-left:auto">'+t('a client sitting provisional for a month is a business risk, not an admin detail')+'</span></div>'
  +(tray.length?'<div style="padding:var(--pad-card)">'+tray.map(function(x){
     return '<div style="display:flex;gap:12px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(11,42,59,.05)">'
      +'<span style="flex:1;font-weight:800;font-size:var(--fs-body)">'+x.client.name+' <span class="hint machine">'+x.client.id+'</span></span>'
      +'<span class="machine" style="font-size:var(--fs-hint);font-weight:800;padding:4px 10px;border-radius:999px;background:'+(x.ageDays>PROV_DAYS?'#FBE3E1':'#EEF2F7')+';color:'+(x.ageDays>PROV_DAYS?'#991B1B':'rgba(11,42,59,.6)')+'">'+x.ageDays+'d</span>'
      +(x.task?'<span class="hint machine">'+x.task+'</span>':'')
      +'<button onclick="doComplete(\''+x.client.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:6px 13px;border-radius:9px;border:none;background:#0EA5E9;color:#FFFFFF">'+t('Complete profile')+'</button>'
      +'</div>';
    }).join('')+'</div>':'');
 h+='</div>';
 // quick create with dedupe in front
 h+='<div class="card" style="margin-bottom:13px;padding:var(--pad-card);border:2px solid rgba(14,165,233,.4)">'
  +'<div class="eyebrow" style="margin-bottom:8px">'+t('Quick create')+' — '+t('the minimum, and nothing more')+'</div>'
  +'<div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:10px">'
  +inpQ('name',t('name'),'200px')+inpQ('country',t('country'),'130px')+inpQ('contact',t('contact name'),'170px')
  +inpQ('phone',t('phone'),'160px')+inpQ('email',t('email'),'190px')+inpQ('tax',t('tax number')+' ('+t('optional')+')','160px')
  +'<select oninput="setQc(\'type\',this.value)" style="border:1.5px solid rgba(11,42,59,.15);border-radius:9px;padding:0 11px;font-family:var(--body);background:#FFFFFF">'
  +'<option value="individual">'+t('individual')+'</option><option value="business">'+t('business')+'</option></select>'
  +'</div>'
  +'<div id="qc-match" style="margin-bottom:10px">'+matchPanel()+'</div>'
  +'<button id="qc-go" onclick="doQuickCreate()" '+(qcReady()?'':'disabled')+' style="cursor:'+(qcReady()?'pointer':'not-allowed')+';font-family:var(--body);font-weight:800;padding:0 20px;border-radius:10px;border:none;background:'+(qcReady()?'#10B981':'#E4E9F0')+';color:'+(qcReady()?'#FFFFFF':'rgba(11,42,59,.4)')+'">+ '+t('Create as provisional')+'</button>'
  +'<span class="hint" style="margin-left:10px">'+t('name · country · contact · phone or email')+'</span>'
  +'</div>';
 h+='<div class="eyebrow" style="margin-bottom:8px">'+t('All clients')+' · <span class="machine">'+CLIENTS.length+'</span></div>'
  +CLIENTS.map(clientCard).join('');
 return h;
}
function inpQ(k,ph,w2){
 return '<input type="text" value="'+String(qc[k]).replace(/"/g,'&quot;')+'" oninput="setQc(\''+k+'\',this.value)" placeholder="'+ph+'" style="width:'+w2+';border:1.5px solid rgba(11,42,59,.15);border-radius:9px;padding:0 11px;height:var(--ctl-h);font-family:var(--body);font-size:var(--fs-body);background:#FFFFFF">';
}
function doComplete(id){
 var r=completeProfile(id,{tax:'SY-'+Math.floor(10000+Math.random()*89999),address:'Damascus'});
 if(!r.ok)askConfirm(t('Refused'),'<b style="color:#991B1B">'+t('still missing')+': '+r.need.map(function(x){return t(x);}).join(' · ')+'</b>',t('Close'),true,function(){});
 else render();
}
