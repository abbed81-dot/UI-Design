// what the PAGE renders, not what the file contains — rule G10
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const f=process.argv[2];
const w=new JSDOM(fs.readFileSync(f,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole()}).window;
const d=w.document, sh=()=>{const e=d.getElementById('shell');return e?e.innerHTML:'';};
let bad=0;const ok=(c,m)=>{if(!c){console.log('   ✗ '+m);bad++;}};
const EM=/[\u{1F300}-\u{1FAFF}]/u;
const screens=[...new Set((fs.readFileSync(f,'utf8').match(/go\('([a-z0-9\-]+)'\)/g)||[]).map(x=>x.slice(4,-2)))];
const seen=new Set();
screens.forEach(s=>{
  try{w.go(s);}catch(e){return;}
  const h=sh(); if(!h||seen.has(h))return; seen.add(h);
  // strip <script> and <style>: their contents are never rendered to the reader
  const visible=h.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'');
  ok(!EM.test(visible), s+': a pictographic emoji is still on screen');
  ok(!/placeholder="<svg|viewBox=" 0=/.test(h), s+': an SVG was injected into an attribute');
  const txt=d.getElementById('shell').textContent;
  ok(!/stroke-width|viewBox|style="padding/.test(txt), s+': raw markup is visible as text');
});
['ar','en'].forEach(l=>{try{w.setLang(l);}catch(e){}; ok(!EM.test(sh().replace(/<script[\s\S]*?<\/script>/g,'')), 'lang '+l+': emoji on screen');});
const icons=(sh().match(/viewBox="0 0 24 24"/g)||[]).length;
console.log((bad?'  FAIL  ':'  PASS  ')+f+'   screens:'+seen.size+'  icons drawn:'+icons);
process.exitCode=bad?1:0;
