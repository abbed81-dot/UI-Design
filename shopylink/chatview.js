
// ── S8 · threads ──
var CHAT_REF=null;
var cm={roles:{},person:'',text:'',reply:null};
function chatPick(ref){CHAT_REF=ref;cm={roles:{},person:'',text:'',reply:null};render();}
function cmRole(r){cm.roles[r]=!cm.roles[r];render();}
function cmSet(k,v){cm[k]=v;
 var b=document.getElementById('cm-go');
 if(b){var okNow=cmReady();b.disabled=!okNow;b.style.cursor=okNow?'pointer':'not-allowed';
  b.style.background=okNow?'#10B981':'#E4E9F0';b.style.color=okNow?'#FFFFFF':'rgba(11,42,59,.4)';}}
function cmRoles(){var out=[];for(var k in cm.roles)if(cm.roles[k])out.push(k);return out;}
function cmReady(){return !!(CHAT_REF&&cmRoles().length&&String(cm.text).replace(/\s/g,'').length>1);}
function doPost(){
 var r=postMessage({ref:CHAT_REF,roles:cmRoles(),person:cm.person||null,text:cm.text,replyTo:cm.reply});
 if(!r.ok){askConfirm(t('Refused'),'<b style="color:#991B1B">'+t(r.why)+'</b>',t('Close'),true,function(){});return;}
 cm={roles:{},person:'',text:'',reply:null};render();
}
function askToTask(id){
 askConfirm(t('Turn this into a task?'),
  t('it takes the record and the role from the message, and enters the same escalation engine as every other item'),
  t('Confirm'),false,function(){
   var r=toTask(id,DAY);
   if(!r.ok)askConfirm(t('Refused'),'<b style="color:#991B1B">'+t(r.why)+'</b>',t('Close'),true,function(){});
  });
}
function msgRow(m){
 var sys=m.kind==='system';
 var d=new Date(m.at);
 return '<div style="display:flex;gap:11px;padding:11px 13px;border-radius:11px;margin-bottom:8px;background:'+(sys?'#F7F4EC':'#FFFFFF')+';border:1.5px solid '+(sys?'rgba(11,42,59,.09)':'rgba(14,165,233,.22)')+'">'
  +'<span style="font-size:17px">'+(sys?'⚙':'💬')+'</span>'
  +'<div style="flex:1;min-width:180px">'
  +'<div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-bottom:4px">'
  +'<span style="font-weight:800;font-size:var(--fs-body)">'+(sys?t('system'):m.by)+'</span>'
  +m.roles.map(function(r){return '<span style="font-size:var(--fs-hint);font-weight:800;padding:3px 9px;border-radius:999px;background:#E6F4FE;color:#0A4A6B">@'+t(roleById(r).name)+'</span>';}).join('')
  +(m.person?'<span style="font-size:var(--fs-hint);font-weight:800;padding:3px 9px;border-radius:999px;background:#EEF2F7;color:#0B2A3B">'+personName(m.person)+'</span>':'')
  +'<span class="machine hint">'+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+'</span>'
  +(m.edits.length?'<span class="hint">('+t('edited')+')</span>':'')
  +'</div>'
  +'<div style="font-size:var(--fs-body);line-height:1.6">'+((sys&&currentLang==='ar')?m.textAr:m.text)+'</div>'
  +(m.roles.length?'<div class="hint" style="margin-top:4px">'+t('reaches')+': '+messageReaders(m).map(function(p){return p.name;}).join(' · ')+'</div>':'')
  +(m.task?'<div class="hint" style="margin-top:5px;font-weight:800;color:#065F46">✓ '+t('became task')+' <span class="machine">'+m.task+'</span></div>':'')
  +'</div>'
  +(sys||m.task?'':'<button onclick="askToTask(\''+m.id+'\')" style="cursor:pointer;align-self:flex-start;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:6px 12px;border-radius:9px;border:1.5px solid rgba(14,165,233,.5);background:#F4FBFF;color:#0A4A6B">→ '+t('make it a task')+'</button>')
  +'</div>';
}
function renderS8(){
 var refs=threadRefs();
 if(!CHAT_REF&&refs.length)CHAT_REF=refs[0];
 var thread=CHAT_REF?threadOf(CHAT_REF):[];
 var acts=CHAT_REF?actionsFor(CHAT_REF):[];
 var h=modalHTML()
  +'<div class="card" style="padding:var(--pad-card);margin-bottom:13px">'
  +'<div class="eyebrow" style="margin-bottom:5px">'+t('Threads')+'</div>'
  +'<div style="font-size:var(--fs-body);font-weight:700">'+t('every message names the record it is about and the role that must act')+'</div>'
  +'<div class="hint" style="margin-top:5px">'+t('the conversation stays with the job — when someone leaves the company, the context does not leave with them')+'</div></div>'
  // pick a record
  +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'
  +refs.map(function(r){var on=CHAT_REF===r;
    return '<button onclick="chatPick(\''+r+'\')" style="cursor:pointer;font-family:var(--body);font-weight:800;padding:8px 14px;border-radius:999px;border:1.5px solid '+(on?'#0EA5E9':'rgba(11,42,59,.14)')+';background:'+(on?'#E6F4FE':'#FFFFFF')+';color:'+(on?'#0A4A6B':'#0B2A3B')+'"><span class="machine">'+r+'</span> <span class="hint">'+threadOf(r).length+'</span></button>';
   }).join('')
  +'</div>';
 if(!CHAT_REF)return h+'<div class="hint">'+t('no thread yet')+'</div>';
 // the record is a door
 h+='<div class="card" style="margin-bottom:12px;padding:var(--pad-card);border-color:rgba(16,185,129,.4);background:#F3FBF7">'
  +'<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">'
  +'<span class="machine" style="font-family:var(--disp);font-size:var(--fs-title);font-weight:800;letter-spacing:-.025em">'+CHAT_REF+'</span>'
  +'<span class="hint">'+(acts.length?(acts.length+' '+t('open action(s) on this record')):t('nothing open on this record'))+'</span>'
  +'<span style="margin-left:auto"></span>'
  +(acts.length?'<button onclick="openRecord(\''+CHAT_REF+'\')" style="cursor:pointer;font-family:var(--body);font-weight:800;padding:0 18px;border-radius:10px;border:none;background:#10B981;color:#FFFFFF">→ '+t('go and act')+'</button>':'')
  +'</div>'
  +(acts.length?'<div style="margin-top:9px">'+acts.map(itemCard).join('')+'</div>':'')
  +'</div>';
 // the timeline
 h+=thread.map(msgRow).join('');
 // compose — record and role are not optional
 h+='<div class="card" style="margin-top:12px;padding:var(--pad-card);border:2px solid rgba(14,165,233,.4)">'
  +'<div class="eyebrow" style="margin-bottom:7px">'+t('write on')+' <span class="machine">'+CHAT_REF+'</span></div>'
  +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px">'
  +'<span class="hint" style="font-weight:800;align-self:center">'+t('addressed to')+':</span>'
  +ROLES.filter(function(r){return r.id!=='manager';}).map(function(r){var on=!!cm.roles[r.id];
    return '<button onclick="cmRole(\''+r.id+'\')" style="cursor:pointer;font-family:var(--body);font-size:var(--fs-hint);font-weight:800;padding:6px 12px;border-radius:999px;border:1.5px solid '+(on?'#0EA5E9':'rgba(11,42,59,.14)')+';background:'+(on?'#E6F4FE':'#FFFFFF')+';color:'+(on?'#0A4A6B':'#0B2A3B')+'">@'+t(r.name)+'</button>';
   }).join('')
  +'<select oninput="cmSet(\'person\',this.value)" style="border:1.5px solid rgba(11,42,59,.15);border-radius:9px;padding:0 10px;height:var(--ctl-h);font-family:var(--body);background:#FFFFFF"><option value="">'+t('and a person (optional)')+'</option>'
  +PEOPLE.map(function(p){return '<option value="'+p.id+'"'+(cm.person===p.id?' selected':'')+'>'+p.name+'</option>';}).join('')+'</select>'
  +'</div>'
  +'<textarea oninput="cmSet(\'text\',this.value)" rows="2" placeholder="'+t('what needs to happen, and by whom')+'" style="width:100%;border:1.5px solid rgba(11,42,59,.15);border-radius:10px;padding:10px 12px;font-family:var(--body);font-size:var(--fs-body);background:#FFFFFF">'+String(cm.text).replace(/</g,'&lt;')+'</textarea>'
  +'<div style="display:flex;gap:10px;align-items:center;margin-top:9px;flex-wrap:wrap">'
  +'<span class="hint">'+(cmRoles().length?(t('reaches')+': '+cmRoles().map(function(r){var p=readerOfRole(r);return p?p.name:r;}).join(' · ')):t('pick at least one role — a message with no role is an obligation with nobody to own it'))+'</span>'
  +'<span style="margin-left:auto"></span>'
  +'<button id="cm-go" onclick="doPost()" '+(cmReady()?'':'disabled')+' style="cursor:'+(cmReady()?'pointer':'not-allowed')+';font-family:var(--body);font-weight:800;padding:0 20px;border-radius:10px;border:none;background:'+(cmReady()?'#10B981':'#E4E9F0')+';color:'+(cmReady()?'#FFFFFF':'rgba(11,42,59,.4)')+'">'+t('Post')+'</button>'
  +'</div>'
  +'<div class="hint" style="margin-top:7px">🔒 '+t('messages are permanent — an edit keeps its history, and the thread exports with the job')+'</div>'
  +'</div>';
 return h;
}
