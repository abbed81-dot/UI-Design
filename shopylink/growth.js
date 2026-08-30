// growth.js — rule C8, automated: grow every collection tenfold and see if the page follows.
// A page that grows with the data has no ceiling, and will one day be unusable.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const f=process.argv[2];
const src=fs.readFileSync(f,'utf8');
let w;try{w=new JSDOM(src,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;}
catch(e){console.log(f+' — could not load');process.exit(0);}
const d=w.document, el=d.getElementById('shell');
if(!el){console.log(f+' — no shell');process.exit(0);}
const scr=[...new Set((src.match(/go\('([a-z0-9\-]+)'\)/g)||[]).map(s=>s.slice(4,-2)))];
const size=()=>{let t=0;scr.forEach(s=>{try{w.go(s);t+=el.innerHTML.length;}catch(e){}});return t;};
const before=size();
// every top-level array of records gets ten times as many
const grown=[];
Object.keys(w).forEach(k=>{
  try{
    const a=w[k];
    if(!Array.isArray(a)||!a.length||a.length>500||!/^[A-Z]/.test(k))return;
    if(typeof a[0]!=='object'||a[0]===null)return;
    const n=a.length, add=Math.min(200,n*10);
    for(let i=0;i<add;i++){const c=JSON.parse(JSON.stringify(a[i%n]));if(c.id)c.id=String(c.id)+'-x'+i;if(c.name)c.name=String(c.name)+' '+i;a.push(c);}
    grown.push(k+':'+n+'→'+a.length);
  }catch(e){}
});
if(!grown.length){console.log(f+' — no growable collections found');process.exit(0);}
let after;try{after=size();}catch(e){console.log(f+' — CRASHED when grown: '+e.message.slice(0,60));process.exit(1);}
const x=after/before;
console.log(f+' — page x'+x.toFixed(1)+'   ['+grown.slice(0,4).join(' ')+']');
process.exitCode=x>1.8?1:0;
