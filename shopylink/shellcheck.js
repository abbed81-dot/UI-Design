// shellcheck.js — the shared shell is copied into every standalone file BY DESIGN
// (no build step, no module system, each file must open alone on an old engine).
// What is not by design is the copies drifting apart. This gives the shell ONE source of
// truth and reports every file whose copy no longer matches it.
//
//   node shellcheck.js            → report drift across all modules
//   node shellcheck.js --adopt F  → take file F as the canonical source
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const SRC='shell.src.json';
const SHARED=['slMark','slLockup','slDateStr','askConfirm','askReason','closeModal','modalOk',
  'setTyped','setDensity','densityToggle','slBusRead','slBusPush','slBusPatch','slBusGet',
  'slEvAvailable','slEvRead','slEvWrite','slEmit'];

function bodies(file){
  const html=fs.readFileSync(file,'utf8');
  const js=(html.match(/<script>[\s\S]*?<\/script>/g)||[]).map(b=>b.replace(/<\/?script>/g,'')).join('\n');
  const out={};
  SHARED.forEach(n=>{
    const m=new RegExp('^function\\s+'+n+'\\s*\\(','m').exec(js);
    if(!m)return;
    let i=js.indexOf('{',m.index),d=0,end=i;
    for(let k=i;k<js.length;k++){
      if(js[k]==='{')d++; else if(js[k]==='}'){d--;if(d===0){end=k+1;break;}}
    }
    out[n]=js.slice(m.index,end).replace(/\s+/g,'');   // strip ALL whitespace: Babel reformatting is not drift
  });
  return out;
}
const files=fs.readdirSync('.').filter(f=>/^ShopyLink.*\.html$/.test(f)&&f!=='ShopyLink_Dashboard.html');

if(process.argv[2]==='--adopt'){
  const from=process.argv[3];
  const b=bodies(from);
  fs.writeFileSync(SRC,JSON.stringify({from:from,at:new Date().toISOString(),bodies:b},null,1));
  console.log('canonical shell taken from '+from+' — '+Object.keys(b).length+' helpers');
  process.exit(0);
}
if(!fs.existsSync(SRC)){console.log('no '+SRC+' yet — run: node shellcheck.js --adopt <file>');process.exit(1);}
const canon=JSON.parse(fs.readFileSync(SRC,'utf8'));
let drift=0,missing=0;
files.forEach(f=>{
  const b=bodies(f),bad=[];
  Object.keys(b).forEach(n=>{
    if(!canon.bodies[n])return;
    if(b[n]===canon.bodies[n])return;
    // a renamed parameter is not drift; a different structure is
    const strip=x=>x.replace(/[A-Za-z_$][A-Za-z0-9_$]*/g,'x');
    bad.push(n+(strip(b[n])===strip(canon.bodies[n])?'  (names only)':''));
  });
  if(bad.length){drift+=bad.length;console.log(f);bad.forEach(n=>console.log('   ~ '+n+' has drifted from the canonical copy'));}
});
console.log('\ncanonical source: '+canon.from);
console.log('files checked: '+files.length+' | helpers that have drifted: '+drift);
process.exitCode=drift?1:0;
