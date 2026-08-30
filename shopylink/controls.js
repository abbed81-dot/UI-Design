// controls.js — a control with padding but no height has no height at all: it takes the
// browser's default, which differs per control type. That is why a select sits proud of the
// input beside it, and why the native arrow is jammed against the edge with no room reserved.
const fs=require('fs');
const f=process.argv[2];
const html=fs.readFileSync(f,'utf8');
const findings={selNoHeight:0,selNoArrowRoom:0,inpNoHeight:0,selNoAppearance:0};
// a global rule only counts if it actually sets a height on select
const globalSelect=/(?:^|[},;\s])select(?:[^{},]{0,60})?\{[^}]*\bheight\s*:/m.test(html);
const globalArrow=/(?:^|[},;\s])select(?:[^{},]{0,60})?\{[^}]*appearance\s*:\s*none/m.test(html);
(html.match(/<select[^>]*>/g)||[]).forEach(tag=>{
  const st=(tag.match(/style="([^"]*)"/)||[])[1]||'';
  if(!/height/.test(st)&&!globalSelect)findings.selNoHeight++;
  // the native arrow needs reserved room: either appearance:none + a drawn chevron, or ~28px of end padding
  const pad=(st.match(/padding:\s*[^;]*/)||[''])[0];
  const nums=(pad.match(/(\d+)px/g)||[]).map(x=>parseInt(x,10));
  const endPad=nums.length>1?nums[1]:(nums[0]||0);
  if(endPad<26&&!globalArrow)findings.selNoArrowRoom++;
});
(html.match(/<input[^>]*type="(text|number)"[^>]*>/g)||[]).forEach(tag=>{
  const st=(tag.match(/style="([^"]*)"/)||[])[1]||'';
  if(!/height/.test(st)&&!/\binput\b[^{]*\{[^}]*height/.test(html))findings.inpNoHeight++;
});
const bad=Object.values(findings).reduce((a,b)=>a+b,0);
console.log(f+' — controls without a stated height or arrow room: '+bad
  +(bad?'  (select:'+findings.selNoHeight+' arrow:'+findings.selNoArrowRoom+' input:'+findings.inpNoHeight+')':''));
process.exitCode=bad?1:0;
