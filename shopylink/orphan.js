const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const js=(html.match(/<script>[\s\S]*?<\/script>/g)||[]).map(b=>b.replace(/<\/?script>/g,'')).join('\n');
const defs=[...new Set([...js.matchAll(/^\s*function\s+(\w+)\s*\(/gm)].map(m=>m[1]))];
const never=[];
defs.forEach(fn=>{
  // count references across the WHOLE file — markup attributes are call sites too
  const all=(html.match(new RegExp('\\b'+fn+'\\b','g'))||[]).length;
  const asDef=(html.match(new RegExp('function\\s+'+fn+'\\b','g'))||[]).length;
  if(all-asDef===0)never.push(fn);
});
console.log('defined: '+defs.length+' | never referenced anywhere in the file: '+never.length);
never.forEach(f=>console.log('  ✗',f));
