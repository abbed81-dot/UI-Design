
// ── S4 speed board: how long we actually take, receipt → POD ──
function fmtDays(ms){
 var d=ms/DAY;
 return (d<10?Math.round(d*10)/10:Math.round(d))+'d';
}
function barFor(s){
 var sl=slices(s), tot=slicesSum(s)||1, w=worstSlice(s);
 var col={received:'#94A3B8',consolidated:'#7DD3FC',departed:'#0EA5E9',border:'#F59E0B',arrived:'#38BDF8',cleared:'#A78BFA'};
 return '<div style="display:flex;height:14px;border-radius:7px;overflow:hidden;background:#EEF2F7">'
  +sl.map(function(x){
    var pc=Math.max(1,Math.round(x.ms/tot*100));
    var isW=w&&x.from===w.from;
    return '<div title="'+(currentLang==='ar'?MS_LABEL_AR[x.from]:MS_LABEL[x.from])+' · '+fmtDays(x.ms)+'" style="width:'+pc+'%;background:'+(col[x.from]||'#CBD5E1')+';'+(isW?'box-shadow:inset 0 0 0 2px #991B1B;':'')+'"></div>';
   }).join('')
  +'</div>';
}
function shipRow(s){
 var lt=lifetime(s), cw=clientWait(s), ct=controlled(s), pr=promiseOf(s), tn=promiseTone(s), w=worstSlice(s);
 var tcol={green:'#065F46',amber:'#78500A',red:'#991B1B',grey:'rgba(11,42,59,.45)'}[tn];
 var tbg={green:'#DCF5E9',amber:'#FDF0D5',red:'#FBE3E1',grey:'#EEF2F7'}[tn];
 return '<div class="card" style="margin-bottom:10px;padding:var(--pad-card)">'
  +'<div style="display:flex;gap:var(--gap);align-items:center;flex-wrap:wrap;margin-bottom:10px">'
  +'<span style="font-size:19px">'+(isDelivered(s)?'✓':'🚚')+'</span>'
  +'<div style="flex:1;min-width:170px">'
  +'<div style="font-family:var(--disp);font-size:var(--fs-lead);font-weight:800;letter-spacing:-.025em">'+s.cust+'</div>'
  +'<div class="hint machine">'+s.id+' · '+s.from+'→'+s.to+' · '+s.mode+'</div></div>'
  // the two figures, always together and always labelled
  +'<div><div class="eyebrow">'+t('total, as the client felt it')+'</div>'
  +'<div class="machine figure">'+fmtDays(lt)+'</div></div>'
  +'<div><div class="eyebrow">'+t('under our control')+'</div>'
  +'<div class="machine" style="font-family:var(--disp);font-weight:800;letter-spacing:-.025em;font-size:var(--fs-title);color:#0A4A6B">'+fmtDays(ct)+'</div></div>'
  +(cw?'<div><div class="eyebrow">'+t('client wait')+'</div>'
    +'<div class="machine" style="font-family:var(--disp);font-weight:800;letter-spacing:-.025em;font-size:var(--fs-title);color:#78500A">'+fmtDays(cw)+'</div></div>':'')
  +'<div style="border-left:1px solid rgba(11,42,59,.1);padding-left:16px">'
  +'<div class="eyebrow">'+t('promise')+'</div>'
  +(pr?'<span class="machine" style="font-size:var(--fs-hint);font-weight:800;padding:5px 11px;border-radius:999px;background:'+tbg+';color:'+tcol+'">'+fmtDays(pr)+' · '+Math.round(promisePct(s)*100)+'%</span>'
     :'<span style="font-size:var(--fs-hint);font-weight:800;padding:5px 11px;border-radius:999px;background:#EEF2F7;color:rgba(11,42,59,.5)">'+t('unpromised')+'</span>')
  +'</div>'
  +(isDelivered(s)?'':'<span style="font-size:var(--fs-hint);font-weight:800;padding:4px 10px;border-radius:999px;background:#E6F4FE;color:#0A4A6B">'+t('still running')+'</span>')
  +'</div>'
  +barFor(s)
  +'<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px">'
  +slices(s).map(function(x){
     var isW=w&&x.from===w.from;
     return '<span class="hint" style="font-weight:'+(isW?'800':'700')+';color:'+(isW?'#991B1B':'rgba(11,42,59,.55)')+'">'
      +(currentLang==='ar'?MS_LABEL_AR[x.from]:MS_LABEL[x.from])+' <span class="machine">'+fmtDays(x.ms)+'</span>'+(isW?' ◂':'')+'</span>';
   }).join('')
  +'</div>'
  +(cw?'<div class="hint" style="margin-top:7px;color:#78500A;font-weight:700">⏸ '+t('client wait')+': '+s.waits.map(function(wt){return wt.why;}).join(' · ')+'</div>':'')
  +'</div>';
}
function renderS4(){
 var running=SHIPS.filter(function(s){return !isDelivered(s);});
 var done=SHIPS.filter(isDelivered);
 var lanes=[];
 SHIPS.forEach(function(s){
  var k=s.from+'|'+s.to+'|'+s.mode;
  if(lanes.indexOf(k)===-1)lanes.push(k);
 });
 var h=modalHTML()
  +'<div class="card" style="padding:var(--pad-card);margin-bottom:13px">'
  +'<div class="eyebrow" style="margin-bottom:5px">'+t('Delivery speed')+'</div>'
  +'<div style="font-size:var(--fs-body);font-weight:700">'+t('receipt to POD — nothing internal resets this clock')+'</div>'
  +'<div class="hint" style="margin-top:5px">'+t('the total is what the client lived through · performance is judged on the time under our control')+'</div>'
  +'</div>';
 // lane averages
 h+='<div class="card" style="padding:var(--pad-card);margin-bottom:13px">'
  +'<div class="eyebrow" style="margin-bottom:9px">'+t('Average by lane × mode')+' — '+t('delivered shipments only')+'</div>'
  +'<div style="display:flex;gap:10px;padding:5px 10px;font-family:var(--mono);font-size:var(--fs-eyebrow);font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(11,42,59,.45)">'
  +'<span style="flex:1.4">'+t('lane')+'</span><span style="width:90px;text-align:right">'+t('promise')+'</span>'
  +'<span style="width:90px;text-align:right">'+t('total')+'</span><span style="width:110px;text-align:right">'+t('controlled')+'</span>'
  +'<span style="width:150px;text-align:right">'+t('suggested promise')+'</span></div>'
  +lanes.map(function(k){
    var p=k.split('|'), a=avgLane(p[0],p[1],p[2]), pr=promiseFor(p[0],p[1],p[2]), sg=suggestPromise(p[0],p[1],p[2]);
    return '<div style="display:flex;gap:10px;align-items:center;padding:9px 10px;border-top:1px solid rgba(11,42,59,.07)">'
     +'<span style="flex:1.4;font-size:var(--fs-body);font-weight:700">'+p[0]+'→'+p[1]+' <span class="hint">'+p[2]+'</span></span>'
     +'<span class="machine" style="width:90px;text-align:right;font-weight:800">'+(pr?fmtDays(pr):'<span style="color:rgba(11,42,59,.35)">'+t('unpromised')+'</span>')+'</span>'
     +'<span class="machine" style="width:90px;text-align:right">'+(a?fmtDays(a.avg):'—')+'</span>'
     +'<span class="machine" style="width:110px;text-align:right;font-weight:800;color:#0A4A6B">'+(a?fmtDays(a.avgControlled):'—')+'</span>'
     +'<span style="width:150px;text-align:right">'+(sg?('<span class="machine" style="font-weight:800">'+sg.days+'d</span> <span class="hint">n='+sg.n+(sg.thin?' · '+t('thin')+'':'')+'</span>'):'<span class="hint">—</span>')+'</span>'
     +'</div>';
   }).join('')
  +'<div class="hint" style="margin-top:9px">'+t('a promise built on fewer than 5 deliveries is marked thin — it is an indication, not a fact')+'</div>'
  +'</div>';
 h+='<div class="eyebrow" style="margin-bottom:8px">'+t('still running')+' · <span class="machine">'+running.length+'</span></div>'
  +(running.length?running.map(shipRow).join(''):'<div class="hint" style="margin-bottom:12px">—</div>');
 h+='<div class="eyebrow" style="margin:14px 0 8px">'+t('Delivered')+' · <span class="machine">'+done.length+'</span></div>'
  +done.map(shipRow).join('');
 return h;
}
