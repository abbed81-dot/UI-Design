// convert.js — turn a chip row into slPicker, ONE FILE AT A TIME, verified, reverted on failure.
// The shape it understands:  +ARR.map(function(x){return '<button onclick="FN(\''+x.KEY+'\')" …(x.KEY===CUR?…)…'}).join('')
const fs=require('fs'),{execSync}=require('child_process');
const f=process.argv[2];
let s=fs.readFileSync(f,'utf8');
const before=s;
const re=/\+\s*([A-Za-z_$][\w$]*)\.map\(function\((\w+)\)\s*\{\s*(?:var \w+=[^;]+;\s*)?return\s*'<button onclick="(\w+)\(\\'\s*'\s*\+\s*\2\.?([\w$]*)[\s\S]{0,900}?\}\)\.join\(''\)/g;
let m,out=[],last=0,n=0;
while((m=re.exec(s))!==null){
  const [full,arr,arg,fn,key]=m;
  const curM=full.match(new RegExp('\\\\b'+arg+'\\\\.?'+(key||'')+'\\\\s*===\\\\s*([A-Za-z_$][\\\\w$.]*)'));
  if(!curM){continue;}
  const cur=curM[1];
  const valFn=key?`,{value:function(${arg}){return ${arg}.${key};},label:function(${arg}){return ${arg}.name||${arg}.label||${arg}.${key};}}`:'';
  const call=`+slPicker('${f.replace(/\W/g,'').slice(-8)}-${fn}',${arr},${cur},"${fn}('{v}')"${valFn||',{}'})`;
  out.push(s.slice(last,m.index)+call);
  last=m.index+full.length; n++;
}
if(!n){console.log('  – '+f+': no convertible chip row found');process.exit(0);}
s=out.join('')+s.slice(last);
fs.writeFileSync(f,s);
function ok(cmd){try{execSync(cmd,{stdio:['ignore','pipe','pipe']});return true;}catch(e){return false;}}
const good = ok('node /tmp/es5check.js "'+f+'"') && ok('node rendercheck.js "'+f+'"');
if(!good){fs.writeFileSync(f,before);console.log('  ✗ '+f+': '+n+' rows converted but verification FAILED — file restored untouched');process.exit(1);}
console.log('  ✓ '+f+': '+n+' chip row(s) now scale, verified');
