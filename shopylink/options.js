// options.js — a list of choices rendered as a row of pressable chips is fine at five
// and unusable at twenty. This finds every place the whole option set is painted at once.
const fs=require('fs');
const f=process.argv[2];
const html=fs.readFileSync(f,'utf8');
// ARRAY.map(...) that emits a <button> or a chip — the whole set, every render
const re=/(\w+)(?:\.filter\([^)]*\))?\.map\(function\([^)]*\)\s*\{[\s\S]{0,320}?<button/g;
const hits=[];let m;
while((m=re.exec(html))!==null){
  const src=m[1];
  // a guard means the author thought about growth: a slice, a search, or a threshold
  const around=html.slice(Math.max(0,m.index-320),m.index+420);
    // a <select>, a slice, a search, or slPicker means growth was considered.
  // A results list is not an option set — it is output, and it is meant to be long.
  const guarded=/\.slice\(|SHOW|search|findRecords|slPicker|<select|selH\(|length>\s*\d+\s*\?/.test(around)
    || /gaps|rows|results|missing|hits/i.test(src);
  hits.push({src:src,guarded:guarded});
}
const bad=hits.filter(h=>!h.guarded);
// Known false positive: a .map() that returns [value,label] pairs for selH() is a
// <select>, which scales by nature — the regex sees the <button> that follows it in
// the same string. Listed here rather than silently excluded, so the count stays honest.
const KNOWN_SELECT_FED=['DCOUNTRIES'];
const real=bad.filter(b=>KNOWN_SELECT_FED.indexOf(b.src)===-1);
console.log(f+' — option rows painted whole: '+hits.length+' | unguarded: '+real.length
  +(real.length?'   from: '+[...new Set(real.map(b=>b.src))].slice(0,6).join(', '):''));
process.exitCode=real.length?1:0;
