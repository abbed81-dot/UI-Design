// dupe.js — guards the rule that actually applies to this codebase.
//   inside one file : a function defined twice is ALWAYS a bug (the later one wins silently)
//   across files    : duplication is the architecture — 29 standalone files, no module system
// So this fails on the first and stays quiet about the second.
const fs=require('fs');
const f=process.argv[2];
const html=fs.readFileSync(f,'utf8');
const js=(html.match(/<script>[\s\S]*?<\/script>/g)||[]).map(b=>b.replace(/<\/?script>/g,'')).join('\n');
// transpiler helpers are emitted once per script block by design — not a hand-written duplicate
const TRANSPILER=/^_(typeof|slicedToArray|toConsumableArray|createClass|defineProperty|classCallCheck|arrayWithHoles|iterableToArray|unsupportedIterableToArray|nonIterableRest|arrayLikeToArray|arrayWithoutHoles|iterableToArrayLimit|nonIterableSpread|toPrimitive|toPropertyKey)$/;
const seen={},dupes=[];
let m;const re=/^function\s+(\w+)\s*\(/gm;   // TOP LEVEL only — an indented function is a scoped inner helper, not a duplicate
while((m=re.exec(js))!==null){
  const n=m[1];
  if(TRANSPILER.test(n))continue;
  if(seen[n]!==undefined)dupes.push({name:n,first:seen[n],again:js.slice(0,m.index).split('\n').length});
  else seen[n]=js.slice(0,m.index).split('\n').length;
}
// a var re-declared with a different value is the same class of fault
const vars={},vdupes=[];
const vre=/^var\s+([A-Z_][A-Z0-9_]{2,})\s*=\s*([^;\n]{1,60})/gm;
while((m=vre.exec(js))!==null){
  const n=m[1],v=m[2].trim();
  if(vars[n]!==undefined&&vars[n]!==v)vdupes.push({name:n,was:vars[n],now:v});
  else vars[n]=v;
}
console.log(f+' — functions: '+Object.keys(seen).length
  +' | defined twice: '+dupes.length
  +' | constants redefined differently: '+vdupes.length);
dupes.forEach(d=>console.log('   ✗ '+d.name+'() defined at line '+d.first+' and again at '+d.again));
vdupes.forEach(d=>console.log('   ✗ '+d.name+' was '+JSON.stringify(d.was)+' then '+JSON.stringify(d.now)));
process.exitCode=(dupes.length+vdupes.length)?1:0;
