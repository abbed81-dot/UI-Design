// iconize.js — wire the paint-time iconizer into ONE module, verify, revert on failure.
// Never a blind replacement (G7); never trusted without reading the rendered page (G10).
const fs=require('fs'),{execSync}=require('child_process');
const f=process.argv[2];
const before=fs.readFileSync(f,'utf8');
let s=before;
if(s.indexOf('function slIconize(')>-1){console.log('  – '+f+': already wired');process.exit(0);}
if(s.indexOf('var SL_ICONS=')===-1){console.log('  – '+f+': no icon family');process.exit(0);}
const d1=fs.readFileSync('ShopyLink_D1_Control.html','utf8');
const HELPER=d1.slice(d1.indexOf('var SL_EMOJI='),d1.indexOf('\nfunction render(){',d1.indexOf('var SL_EMOJI=')));
const i=s.indexOf('function render(){');
if(i<0){console.log('  – '+f+': no render()');process.exit(0);}
s=s.slice(0,i)+HELPER+'\n'+s.slice(i);
// wrap only the paints inside render(), matched exactly
const j=s.indexOf('function render(){'), nxt=s.indexOf('\nfunction ',j+10);
let seg=s.slice(j,nxt), n=0;
seg=seg.replace(/el\.innerHTML=(?!slIconize)([^;]+?);(?=\s*(?:return|\}|\n))/g,(m,g)=>{n++;return 'el.innerHTML=slIconize('+g+');';});
s=s.slice(0,j)+seg+s.slice(nxt);
fs.writeFileSync(f,s);
const ok=c=>{try{execSync(c,{stdio:['ignore','pipe','pipe']});return true;}catch(e){return false;}};
if(!ok('node /tmp/es5check.js "'+f+'"')){fs.writeFileSync(f,before);console.log('  ✗ '+f+': parse failed — restored');process.exit(1);}
// the page must still render AND must have gained icons — an empty screen is not success
const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
try{
  const w=new JSDOM(fs.readFileSync(f,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
  const el=w.document.getElementById('shell');
  const h=el?el.innerHTML.replace(/<script[\s\S]*?<\/script>/g,''):'';
  if(h.length<800){fs.writeFileSync(f,before);console.log('  ✗ '+f+': page did not render ('+h.length+') — restored');process.exit(1);}
  const em=(h.match(/[\u{1F300}-\u{1FAFF}]/gu)||[]).length;
  const ic=(h.match(/viewBox="0 0 24 24"/g)||[]).length;
  console.log('  ✓ '+f+': '+n+' paints wrapped · icons '+ic+' · emoji left '+em+(em?'  ← unmapped, see below':''));
  if(em)[...new Set(h.match(/[\u{1F300}-\u{1FAFF}]/gu))].forEach(c=>console.log('       '+c+' U+'+c.codePointAt(0).toString(16).toUpperCase()));
}catch(e){fs.writeFileSync(f,before);console.log('  ✗ '+f+': threw — restored: '+e.message.slice(0,50));process.exit(1);}
