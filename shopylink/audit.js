const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const acorn=require('/home/claude/work/node_modules/acorn/dist/acorn.js');
const f=process.argv[2];
const html=fs.readFileSync(f,'utf8');
const blocks=(html.match(/<script>[\s\S]*?<\/script>/g)||[]).map(b=>b.replace(/<\/?script>/g,''));
const R={file:f};
// 1 ES5 syntax
let es5=true,es5e='';
blocks.forEach((c,i)=>{try{acorn.parse(c,{ecmaVersion:5});}catch(e){if(es5){es5=false;es5e='blk'+i+': '+e.message.slice(0,50);}}});
R.es5=es5?'✓':'✗ '+es5e;
// 2 renders normally
try{
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
  const d=dom.window.document;
  const shell=d.getElementById('shell')||d.getElementById('view')||d.body;
  R.render=shell.innerHTML.length>600?'✓ '+shell.innerHTML.length:'✗ '+shell.innerHTML.length;
  // 3 AR
  const w=dom.window;
  if(typeof w.setLang==='function'){w.setLang('ar');R.ar=(d.documentElement.dir==='rtl'||/[\u0600-\u06FF]/.test(shell.innerHTML))?'✓':'✗';}
  else if(w.st&&'lang' in w.st&&typeof w.render==='function'){w.st.lang='ar';w.render();R.ar=/[\u0600-\u06FF]/.test(d.body.innerHTML)?'✓':'✗';}
  else R.ar='—';
}catch(e){R.render='✗ '+e.message.slice(0,40);R.ar='—';}
// 4 strict legacy engine
try{
  const dm=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
  const w=dm.window;delete w.Array.prototype.find;delete w.Intl;
  w.Number.prototype.toLocaleString=function(){if(arguments.length>1||arguments[0]!==undefined)throw new TypeError('opts');return String(this);};
  w.Date.prototype.toLocaleDateString=function(){if(arguments.length>1)throw new TypeError('opts');return 'x';};
  let thr=[];blocks.forEach(c=>{try{w.eval(c);}catch(e){thr.push(e.message.slice(0,50));}});
  const sh=w.document.getElementById('shell')||w.document.getElementById('view')||w.document.body;
  R.legacy=thr.length?'✗ '+thr[0]:(sh.innerHTML.length>600?'✓':'✗ blank');
}catch(e){R.legacy='✗ '+e.message.slice(0,40);}
// 5 red flag
R.flag=html.indexOf('\u{1F1F8}\u{1F1FE}')===-1?'✓':'✗ emoji';
console.log(JSON.stringify(R));
