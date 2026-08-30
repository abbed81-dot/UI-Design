// responsive.js — a control pushed out of view is a control that does not exist.
// Two patterns do it: a flex row with `margin-left:auto` and no `flex-wrap`, so the last
// item is shoved past the edge; and a fixed pixel width wider than a phone.
const fs=require('fs');
const f=process.argv[2];
const html=fs.readFileSync(f,'utf8');
// look for THE guard, not for any flex-wrap that happens to be inside the query —
// the loose test passed files that were still pushing controls off the edge
const mobileGuard=/\[style\*="display:flex"\]\{flex-wrap:wrap !important\}/.test(html)
  && /\[style\*="margin-left:auto"\]\{margin-left:0 !important\}/.test(html);
let pushed=0,wide=0,nowrap=0;
// every inline flex row: does it have an auto-margin child and no wrap?
const rows=html.match(/style="[^"]*display:flex[^"]*"/g)||[];
rows.forEach(r=>{ if(!/flex-wrap/.test(r)) nowrap++; });
const autos=(html.match(/margin-left:auto|margin-right:auto/g)||[]).length;
// fixed widths that cannot fit a 360px viewport
((html.match(/(?:^|[;"\s])width:\s*(\d{3,4})px/g)||[])).forEach(m=>{
  const px=parseInt(m.replace(/\D/g,''),10); if(px>=380)wide++;
});
if(!mobileGuard){ pushed=autos; }
const total=(mobileGuard?0:nowrap)+wide;
console.log(f+' — flex rows that cannot wrap: '+(mobileGuard?0:nowrap)
  +' | auto-margin pushes: '+(mobileGuard?0:autos)
  +' | fixed widths ≥380px: '+wide
  +(mobileGuard?'   (a 767px wrap guard is present)':''));
process.exitCode=total?1:0;
