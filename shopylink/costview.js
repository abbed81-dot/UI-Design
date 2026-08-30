
// ── S6 profit board: who actually paid for this trip, and who actually earned ──
function money(n){
 var v=Number(n)||0, neg=v<0; v=Math.abs(v);
 var s2=(Math.round(v*100)/100).toFixed(2), p=s2.split('.'), i=p[0], out='';
 while(i.length>3){out=','+i.slice(-3)+out;i=i.slice(0,-3);}
 return (neg?'−':'')+i+out+'.'+p[1];
}
function costRow(tp,x){
 var c=x.cost, r=x.res;
 return '<div style="padding:11px 13px;border:1.5px solid '+(r.ok?'rgba(11,42,59,.09)':'rgba(225,72,59,.4)')+';border-radius:10px;margin-bottom:7px;background:'+(r.ok?'#FFFFFF':'#FFF7F6')+'">'
  +'<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">'
  +'<span style="flex:1;min-width:150px;font-size:var(--fs-body);font-weight:800">'+costLabel(c.code)
  +' <span class="hint" style="font-weight:700">'+c.supplier+'</span></span>'
  +'<span class="machine" style="font-family:var(--disp);font-weight:800;letter-spacing:-.025em;font-size:var(--fs-lead)">'+money(c.amount)+' '+c.cur+'</span>'
  +(c.ship?'<span style="font-size:var(--fs-hint);font-weight:800;padding:4px 10px;border-radius:999px;background:#E6F4FE;color:#0A4A6B">'+t('direct')+' · '+c.ship+'</span>'
    :'<select onchange="setKey(\''+tp.id+'\',\''+c.ref+'\',this.value);render()" style="border:1.5px solid rgba(11,42,59,.15);border-radius:9px;padding:0 10px;font-family:var(--body);font-size:var(--fs-hint);background:#FFFFFF">'
      +KEYS.filter(function(k){return k!=='manual';}).map(function(k){return '<option value="'+k+'"'+(c.key===k?' selected':'')+'>'+keyLabel(k)+'</option>';}).join('')+'</select>')
  +'<button onclick="askVoidCost(\''+tp.id+'\',\''+c.ref+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:6px 12px;border-radius:8px;border:1.5px solid rgba(225,72,59,.4);background:#FFFFFF;color:#E1483B">'+t('Void')+'</button>'
  +'</div>'
  +(r.ok
    ?'<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:8px">'
      +r.parts.map(function(p){return '<span class="machine" style="font-size:var(--fs-hint);font-weight:800;padding:5px 11px;border-radius:999px;background:#EEF2F7">'+p.ship+' · '+money(p.amount)+'</span>';}).join('')
      +'<span class="hint" style="font-weight:700">'+t('allocated')+' '+keyLabel(r.key)+'</span></div>'
    :'<div style="margin-top:8px;font-size:var(--fs-body);font-weight:800;color:#991B1B">⚠ '+t('unallocated')+' — '+t(r.why)
      +(r.zero&&r.zero.length?' <span class="machine">('+r.zero.join(', ')+')</span>':'')+'</div>')
  +'</div>';
}
function shipProfitRow(tp,s){
 var rev=revenue(s.id), cst=costOf(s.id,tp.id), pr=profitOf(s.id,tp.id), mg=marginOfShip(s.id,tp.id);
 var neg=pr<0, thin=thinMargin(s.id,tp.id);
 return '<div style="padding:12px 14px;border:1.5px solid '+(neg?'rgba(225,72,59,.45)':(thin?'rgba(251,191,36,.5)':'rgba(11,42,59,.09)'))+';border-radius:11px;margin-bottom:8px;background:'+(neg?'#FFF7F6':(thin?'#FFFDF6':'#FFFFFF'))+'">'
  +'<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">'
  +'<div style="flex:1;min-width:150px"><div style="font-weight:800;font-size:var(--fs-body)">'+s.name+'</div>'
  +'<div class="hint machine">'+s.id+' · '+fact(s.id).cbm+' CBM · '+fact(s.id).weight+' kg · '+fact(s.id).pieces+' pcs</div></div>'
  +'<div><div class="eyebrow">'+t('revenue')+'</div><div class="machine" style="font-weight:800">'+money(rev)+'</div></div>'
  +'<div><div class="eyebrow">'+t('cost')+'</div><div class="machine" style="font-weight:800">'+money(cst)+'</div></div>'
  +'<div style="border-left:1px solid rgba(11,42,59,.1);padding-left:16px">'
  +'<div class="eyebrow">'+t('profit')+'</div>'
  +'<div class="machine figure" style="color:'+(neg?'#991B1B':'#065F46')+'">'+money(pr)+'</div></div>'
  +(mg!==null?'<span class="machine" style="font-size:var(--fs-hint);font-weight:800;padding:5px 11px;border-radius:999px;background:'+(neg?'#FBE3E1':(thin?'#FDF0D5':'#DCF5E9'))+';color:'+(neg?'#991B1B':(thin?'#78500A':'#065F46'))+'">'+Math.round(mg*1000)/10+'%'+(thin&&!neg?' · '+t('thin margin'):'')+'</span>':'')
  +'</div>'
  +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'
  +costSourceFor(s.id,tp.id).map(function(x){
    return '<span class="hint" style="font-weight:700">'+costLabel(x.code)+' <span class="machine">'+money(x.amount)+'</span> '+t('of')+' <span class="machine">'+money(x.of)+'</span> '+keyLabel(x.key)+'</span>';
   }).join(' · ')
  +'</div></div>';
}
function askVoidCost(tripId,ref){
 askReason(t('Void this cost?'),t('It is never deleted — it stays in the record, marked void, and every profit re-computes.'),t('Confirm'),function(reason){
  if(!voidCost(tripId,ref,reason))askConfirm(t('Refused'),'<b style="color:#991B1B">'+t('reason is required')+'</b>',t('Close'),true,function(){});
 });
}
function renderS6(){
 var h=modalHTML()
  +'<div class="card" style="padding:var(--pad-card);margin-bottom:13px">'
  +'<div class="eyebrow" style="margin-bottom:5px">'+t('Cost allocation')+'</div>'
  +'<div style="font-size:var(--fs-body);font-weight:700">'+t('a cost is booked once at trip level and split across the shipments that caused it')+'</div>'
  +'<div class="hint" style="margin-top:5px">'+t('the parts always sum to the cost, to the cent · profit per client is calculated, never guessed')+'</div></div>';
 TRIPS.filter(function(tp){return tp.ships.length;}).forEach(function(tp){
  var un=unallocated(tp.id);
  h+='<div class="card" style="margin-bottom:13px;overflow:hidden">'
   +'<div style="display:flex;gap:var(--gap);align-items:center;padding:var(--pad-row);background:#F7F4EC">'
   +'<span style="font-size:20px">'+(tp.mode==='land'?'🚚':(tp.mode==='sea'?'🚢':'✈'))+'</span>'
   +'<div style="flex:1"><div style="font-family:var(--disp);font-size:var(--fs-lead);font-weight:800;letter-spacing:-.025em">'+tp.id+'</div>'
   +'<div class="hint">'+tp.route+'</div></div>'
   +(un.length?'<span style="font-size:var(--fs-hint);font-weight:800;padding:5px 11px;border-radius:999px;background:#FBE3E1;color:#991B1B">⚠ '+un.length+' '+t('unallocated')+'</span>':'')
   +'<div style="text-align:right"><div class="eyebrow">'+t('trip profit')+'</div>'
   +'<div class="machine" style="font-family:var(--disp);font-weight:800;letter-spacing:-.025em;font-size:var(--fs-title);color:'+(tripProfit(tp.id)<0?'#991B1B':'#065F46')+'">'+money(tripProfit(tp.id))+'</div></div>'
   +'</div>'
   +'<div style="padding:var(--pad-card)">'
   +'<div class="eyebrow" style="margin-bottom:7px">'+t('costs booked on the trip')+'</div>'
   +allocationOf(tp.id).map(function(x){return costRow(tp,x);}).join('')
   +'<div class="eyebrow" style="margin:13px 0 7px">'+t('profit per shipment')+'</div>'
   +tp.ships.map(function(s){return shipProfitRow(tp,s);}).join('')
   +'</div></div>';
 });
 return h;
}
