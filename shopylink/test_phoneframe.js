// The phone frame: a fixed window that does not grow, so a design is judged at the
// size it will be used. Every number here is read from the file, not remembered.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const w=new JSDOM(fs.readFileSync('ShopyLink_App_Combined_Designed_v2.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const d=w.document, cs=s=>w.getComputedStyle(d.querySelector(s));
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};

console.log('§1 the glass');
ok(cs('.phone').width==='390px','390px wide — an iPhone 14/15 in CSS pixels');
ok(cs('.phone').height==='783px','783px tall');
ok(cs('.phone').overflow==='hidden','it CLIPS, so content running past the bottom is visible as a fault');
ok(cs('.phone').flexDirection==='column','…and stacks its children');

console.log('§2 the hardware around it');
ok(cs('.phone').borderRadius==='34px','glass radius 34px');
ok(cs('.framewrap').borderRadius==='46px','bezel radius 46px');
ok(cs('.framewrap').padding==='12px','padding 12px — 34+12=46, which is why the corners read as machined');
ok(/gradient/.test(cs('.framewrap').background),'the bezel is a gradient, not a flat block');
ok(/inset/.test(cs('.framewrap').boxShadow),'…with an inset highlight, which is what makes it look like a device');

console.log('§3 the room an app really has');
ok(cs('.sb').height==='48px','the status bar takes 48px before the app starts');
ok(!!d.querySelector('.scr'),'the app writes into .scr and nothing above it');

console.log('§4 the spec file says the same');
const spec=fs.readFileSync('PHONE_FRAME.md','utf8');
['390px','783px','34px','46px','48px','.framewrap','.phone','.scr','.sb','.stage'].forEach(function(x){
  ok(spec.indexOf(x)>-1,'PHONE_FRAME.md records '+x);
});
console.log('§5 the universal prompt reproduces it from scratch');
const up=fs.readFileSync('UNIVERSAL_PROMPT.md','utf8');
['390','783','46px','34px','48px','overflow:hidden','must not grow'].forEach(function(x){
  ok(up.indexOf(x)>-1,'the prompt states '+x);
});
ok(/not a responsive web page/i.test(up),'…and names the opposite of what it wants, which is the sentence that does the work');
ok(/Avoid/.test(up)&&/responsive/.test(up),'…and warns off the words that produced the desktop result');
const css=up.match(/```css\n([\s\S]*?)```/)[1];
const page='<!DOCTYPE html><html><head><style>'+css+'</style></head><body>'
  +'<div class="stage"><div class="framewrap"><div class="phone">'
  +'<div class="sb"><span>9:41</span></div><div class="scr">x</div></div></div></div></body></html>';
const t2=new JSDOM(page,{pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const c2=s=>t2.getComputedStyle(t2.document.querySelector(s));
ok(c2('.phone').width==='390px'&&c2('.phone').height==='783px','a page built from the prompt alone has the same fixed glass');
ok(c2('.phone').overflow==='hidden','…clipping');
ok(c2('.sb').height==='48px','…and the same status bar');

console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
