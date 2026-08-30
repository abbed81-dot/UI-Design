// Generates ShopyLink_System_Diagram.html FROM THE CODE. Run it after any
// change to the wiring; never edit the diagram by hand. The old one was drawn
// once, by hand, and described a system that had stopped existing.
const fs = require('fs');
const { scan } = require('./wiring.js');

const CHAIN = ['shipment.expected','parcel.received','parcel.consolidated','trip.created',
               'trip.loaded','trip.departed','shipment.arrived','run.assigned',
               'shipment.delivered','invoice.issued','invoice.paid','cash.remitted','client.registered'];

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}

function build(){
  const s = scan();
  const chans = Object.keys(s.channels).sort();
  const evs = Object.keys(s.events).sort(function(a,b){
    const ia=CHAIN.indexOf(a), ib=CHAIN.indexOf(b);
    if(ia>-1&&ib>-1)return ia-ib;
    if(ia>-1)return -1; if(ib>-1)return 1;
    return a<b?-1:1;
  });
  const many = chans.filter(c => s.channels[c].owners.length > 1);
  const orphan = chans.filter(c => s.channels[c].owners.length === 0);
  const unread = chans.filter(c => s.channels[c].readers.length === 0);
  const when = new Date().toISOString().slice(0,10);

  const row = (a,b,c,warn) =>
    '<tr'+(warn?' class="warn"':'')+'><td class="mono">'+esc(a)+'</td><td>'+esc(b)+'</td><td>'+esc(c)+'</td></tr>';

  let h = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
  +'<meta name="viewport" content="width=device-width,initial-scale=1">'
  +'<title>ShopyLink — System Diagram (generated)</title><style>'
  +':root{--ink:#0B2A3B;--mute:#62707A;--rule:rgba(11,42,59,.12);--sky:#0EA5E9;--warn:#B23429;--ok:#065F46;'
  +'--body:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace}'
  +'*{box-sizing:border-box}body{margin:0;font-family:var(--body);color:var(--ink);background:#F7FAFC;padding:22px}'
  +'.wrap{max-width:1000px;margin:0 auto}h1{font-size:23px;margin:0 0 4px}'
  +'.sub{color:var(--mute);font-size:13.5px;margin-bottom:18px;line-height:1.6}'
  +'section{background:#fff;border:1px solid var(--rule);border-radius:12px;padding:16px 18px;margin-bottom:16px}'
  +'h2{font-size:15px;margin:0 0 4px}.note{color:var(--mute);font-size:12.5px;margin-bottom:11px;line-height:1.6}'
  +'table{width:100%;border-collapse:collapse;font-size:12.5px}'
  +'th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--mute);'
  +'border-bottom:1px solid var(--rule);padding:6px 8px 6px 0}'
  +'td{padding:7px 8px 7px 0;border-bottom:1px solid var(--rule);vertical-align:top}'
  +'.mono{font-family:var(--mono);direction:ltr}tr.warn td{background:#FDECEA}'
  +'.pill{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;'
  +'background:#EEF6FB;color:#0A4A6B;margin:0 4px 4px 0}'
  +'.flag{background:#FDECEA;color:var(--warn)}.good{background:#E7F6EF;color:var(--ok)}'
  +'[dir=rtl]{text-align:right}[dir=rtl] th,[dir=rtl] td{text-align:right;padding:7px 0 7px 8px}'
  +'button.lang{position:fixed;top:14px;right:14px;min-height:40px;padding:0 14px;border-radius:9px;'
  +'border:1.5px solid var(--rule);background:#fff;font-family:var(--body);font-weight:800;cursor:pointer}'
  +'</style></head><body><div class="wrap">'
  +'<button class="lang" onclick="flip()" id="lang">العربية</button>'
  +'<h1 id="t-title">ShopyLink — how the parts are joined</h1>'
  +'<div class="sub" id="t-sub">Generated from the source on '+when+' by <span class="mono">diagram.js</span>. '
  +'Nothing here is drawn by hand: every line was read out of the modules themselves, so a wire that is '
  +'not in the code cannot appear here, and one that is cannot be left out.</div>';

  h += '<section><h2 id="t-h1">Channels — who owns each, and who reads it</h2>'
    +'<div class="note" id="t-n1">A channel has ONE owner who publishes it; everybody else reads. '
    +'A row in red is written by more than one module, which is how two versions of one fact begin.</div>'
    +'<table><thead><tr><th>Channel</th><th id="t-c1">Published by</th><th id="t-c2">Read by</th></tr></thead><tbody>';
  chans.forEach(c=>{
    const x=s.channels[c];
    h += row(c, x.owners.join(', ')||'— nobody —', x.readers.join(', ')||'— nobody —',
             x.owners.length!==1);
  });
  h += '</tbody></table><div class="note">'
    + '<span class="pill '+(many.length?'flag':'good')+'">'+many.length+' with more than one writer</span>'
    + '<span class="pill '+(orphan.length?'flag':'good')+'">'+orphan.length+' with no owner</span>'
    + '<span class="pill">'+unread.length+' nobody reads yet</span>'
    + '</div></section>';

  h += '<section><h2 id="t-h2">The log — what each step declares, in order</h2>'
    +'<div class="note" id="t-n2">One append-only log carries every step. A module declares what it did; '
    +'others derive what they need. Nothing is deleted and nothing is edited.</div>'
    +'<table><thead><tr><th>Event</th><th id="t-c3">Declared by</th><th id="t-c4">Read by</th></tr></thead><tbody>';
  evs.forEach(e=>{
    const x=s.events[e];
    h += row(e, x.from.join(', ')||'— nobody —', x.to.join(', ')||'— derived, not matched by name —',
             x.from.length===0);
  });
  h += '</tbody></table></section>';

  h += '<section><h2 id="t-h5">Who does what</h2>'
    +'<div class="note" id="t-n5">The positions, read from the staff register that owns them. '
    +'A position says what it may DO (its grants), what work reaches it (its duties), and who it '
    +'answers to. The map used to draw the wires and say nothing about the people.</div>'
    +'<table><thead><tr><th id="t-c11">Position</th><th id="t-c12">Answers to</th>'
    +'<th id="t-c13">Work it receives</th><th id="t-c14">May do</th></tr></thead><tbody>';
  s.positions.forEach(function(p){
    h += '<tr><td class="mono">'+esc(p.id)+' · L'+p.level+'</td>'
      +'<td class="mono">'+esc(p.reportsTo||'—')+'</td>'
      +'<td>'+(p.duties.length?esc(p.duties.join(', ')):'<i>none — reads and reports</i>')+'</td>'
      +'<td>'+(p.grants[0]==='(every grant)'?'<b>every grant</b>':p.grants.length+'</td>')
      +'</tr>';
  });
  h += '</tbody></table><div class="note">'
    + '<span class="pill">'+s.positions.length+' positions</span>'
    + '<span class="pill">'+s.positions.filter(function(p){return !p.duties.length;}).length+' receive no work by design</span>'
    + '</div></section>';

  h += '<section><h2 id="t-h4">What the system does not carry</h2>'
    +'<div class="note" id="t-n4">Tables of record that exist in a file and on no channel. '
    +'The diagram used to draw only the wires, so an island was invisible to it — the tariff, the '
    +'addresses, the zones and the notice board were each found by accident, one at a time. '
    +'A name held in TWO modules with nothing between them is the dangerous kind: two copies of one '
    +'fact, waiting to disagree.</div>'
    +'<table><thead><tr><th id="t-c8">Table</th><th id="t-c9">Held in</th><th id="t-c10">Kind</th></tr></thead><tbody>';
  s.twinned.forEach(function(i){
    h += row(i.list, i.modules.join(', '), 'held in '+i.modules.length+' modules · nothing joins them', true);
  });
  s.alone.forEach(function(i){
    h += row(i.list, i.module, 'one module · unshared', false);
  });
  h += '</tbody></table><div class="note">'
    + '<span class="pill '+(s.twinned.length?'flag':'good')+'">'+s.twinned.length+' held in more than one module</span>'
    + '<span class="pill">'+s.alone.length+' unshared</span></div></section>';

  h += '<section><h2 id="t-h3">Modules</h2>'
    +'<div class="note" id="t-n3">Every module that touches a channel or the log. What it publishes is its own; '
    +'what it reads belongs to somebody else.</div>'
    +'<table><thead><tr><th id="t-c5">Module</th><th id="t-c6">Publishes</th><th id="t-c7">Reads</th></tr></thead><tbody>';
  s.mods.forEach(m=>{
    h += row(m.name, m.publishes.join(', ')||'—', m.reads.join(', ')||'—', false);
  });
  h += '</tbody></table></section>';

  h += '<script>'
    +'var AR={"t-title":"شوبي لينك — كيف تتصل الأجزاء",'
    +'"t-sub":"مولَّد من الشيفرة بتاريخ '+when+' بواسطة diagram.js. لا شيء هنا مرسوم بيد: كل سطر قُرئ من الوحدات نفسها، فما ليس في الشيفرة لا يظهر هنا، وما فيها لا يمكن إغفاله.",'
    +'"t-h1":"القنوات — من يملك كلاً منها ومن يقرؤها",'
    +'"t-n1":"للقناة مالك واحد ينشرها والبقية تقرأ. والصفّ الأحمر تكتبه أكثر من وحدة، وهكذا تبدأ نسختان لحقيقة واحدة.",'
    +'"t-h2":"السجل — ما تعلنه كل خطوة، بالترتيب",'
    +'"t-n2":"سجل واحد يُضاف إليه ولا يُعدَّل. كل وحدة تعلن ما فعلت، والبقية تشتقّ ما تحتاج.",'
    +'"t-h3":"الوحدات","t-n3":"كل وحدة تمسّ قناة أو السجل. ما تنشره لها، وما تقرؤه لغيرها.",'
    +'"t-h5":"من يفعل ماذا",'
    +'"t-n5":"المناصب، مقروءةً من سجل الموظّفين الذي يملكها. المنصب يقول ما يجوز له فعله (صلاحياته)، وأي عمل يصله (مهامّه)، ولمن يتبع. وكان المخطط يرسم الأسلاك ولا يقول شيئًا عن الناس.",'
    +'"t-c11":"المنصب","t-c12":"يتبع","t-c13":"العمل الذي يصله","t-c14":"يجوز له",'
    +'"t-h4":"ما لا يحمله النظام",'
    +'"t-n4":"جداول سجلات موجودة في ملف وعلى لا قناة. كان المخطط يرسم الأسلاك وحدها فلا يرى جزيرة — التعرفة والعناوين والمناطق ولوح الرسائل وُجدت كلها بالصدفة، واحدة تلو الأخرى. والاسم المحمول في وحدتين بلا شيء بينهما هو النوع الخطر: نسختان لحقيقة واحدة تنتظران أن تختلفا.",'
    +'"t-c8":"الجدول","t-c9":"محمول في","t-c10":"النوع",'
    +'"t-c1":"ينشرها","t-c2":"يقرؤها","t-c3":"يعلنه","t-c4":"يقرؤه","t-c5":"الوحدة","t-c6":"تنشر","t-c7":"تقرأ"};'
    +'var ar=false;'
    +'function flip(){ar=!ar;document.documentElement.setAttribute("dir",ar?"rtl":"ltr");'
    +'document.getElementById("lang").textContent=ar?"English":"العربية";'
    +'for(var k in AR){var el=document.getElementById(k);if(el)el.textContent=ar?AR[k]:el.getAttribute("data-en")||el.textContent;}}'
    +'(function(){for(var k in AR){var el=document.getElementById(k);if(el)el.setAttribute("data-en",el.textContent);}})();'
    +'</script></div></body></html>';
  return {html:h, scan:s, many:many, orphan:orphan};
}

if (require.main === module) {
  const out = build();
  fs.writeFileSync(__dirname + '/ShopyLink_System_Diagram.html', out.html);
  console.log('written · ' + Object.keys(out.scan.channels).length + ' channels, '
    + Object.keys(out.scan.events).length + ' events, ' + out.scan.mods.length + ' modules');
  if (out.many.length) console.log('channels with more than one writer: ' + out.many.join(', '));
}
module.exports = { build };
