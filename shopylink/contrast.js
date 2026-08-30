// contrast.js — every colour pair that appears together, judged against WCAG AA
const fs=require('fs');
function hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');
 return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function lum(rgb){const a=rgb.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
 return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];}
function ratio(f,b){const L1=lum(hex2rgb(f)),L2=lum(hex2rgb(b));
 return ((Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05));}
// rgba(r,g,b,a) over a background → the colour actually seen
function flatten(fg,bg){
 const m=String(fg).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/);
 if(!m)return fg;
 const a=m[4]===undefined?1:parseFloat(m[4]);
 const b=hex2rgb(bg);
 const out=[0,1,2].map(i=>Math.round(parseInt(m[i+1],10)*a+b[i]*(1-a)));
 return '#'+out.map(v=>('0'+v.toString(16)).slice(-2)).join('');
}
const CANVAS='#F7F4EC';                       // our cream page
const file=process.argv[2];
const html=fs.readFileSync(file,'utf8');
// every declaration block that sets BOTH a colour and a background
const blocks=[...html.matchAll(/(?:style=["'`]|\{)([^"'`{}]{0,400}?)(?:["'`]|\})/g)].map(m=>m[1]);
const pairs=new Map();
blocks.forEach(b=>{
 const c=b.match(/(?:^|[;\s])color:\s*([^;]+)/i);
 const bgm=b.match(/background(?:-color)?:\s*([^;]+)/i);
 if(!c||!bgm)return;                          // judge only what is stated together — never assume a background
 let fg=c[1].trim(), bg=bgm[1].trim();
 if(/gradient|var\(|transparent|inherit|currentColor/i.test(fg))return;
 if(/gradient|var\(|transparent|inherit/i.test(bg))return;
 // only a stated hex background is knowable; an rgba background depends on a parent we cannot see
 if(!/^#[0-9a-f]{3,6}$/i.test(bg))return;
 const bgHex=bg;
 const fgHex=/^#/.test(fg)?fg:flatten(fg,bgHex);      // rgba text over a known hex IS knowable
 if(!/^#[0-9a-f]{3,6}$/i.test(fgHex))return;
 // font-size tells us whether the 3:1 large-text allowance applies
 const fsm=b.match(/font-size:\s*([\d.]+)px/i), fw=b.match(/font-weight:\s*(\d+)/i);
 const size=fsm?parseFloat(fsm[1]):14, weight=fw?parseInt(fw[1],10):400;
 const large=(size>=24)||(size>=18.66&&weight>=700);
 const need=large?3:4.5;
 const r=ratio(fgHex,bgHex);
 const key=fgHex.toUpperCase()+'|'+bgHex.toUpperCase()+'|'+(large?'L':'N');
 if(!pairs.has(key))pairs.set(key,{fg:fgHex,bg:bgHex,r:r,need:need,large:large,n:0});
 pairs.get(key).n++;
});
const rows=[...pairs.values()].sort((a,b)=>a.r-b.r);
const fails=rows.filter(x=>x.r<x.need);
console.log(file);
console.log('  pairs checked: '+rows.length+' | below AA: '+fails.length);
fails.slice(0,12).forEach(x=>console.log('   ✗ '+x.fg+' on '+x.bg+'  '+x.r.toFixed(2)+':1  needs '+x.need+(x.large?' (large)':'')+'  ×'+x.n));
process.exitCode=fails.length?1:0;
