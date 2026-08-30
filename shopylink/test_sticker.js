// The carton sticker at print time: one per box, each scannable, and the printer
// gets labels rather than a screenshot of the console.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const w=new JSDOM(fs.readFileSync('ShopyLink_Action_01_ReceiveParcel.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const d=w.document, src=fs.readFileSync('ShopyLink_Action_01_ReceiveParcel.html','utf8');
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
w.go('done');

setTimeout(function(){
  const st=[...d.querySelectorAll('.awb')];
  console.log('§1 one sticker per carton');
  ok(st.length===w.liveCartons.length,st.length+' stickers for '+w.liveCartons.length+' cartons — it used to draw only the first');
  ok(/1\/2/.test(st[0].textContent)&&/2\/2/.test(st[1].textContent),'numbered 1/2 and 2/2, so a missing box is obvious on the dock');
  const ids=st.map(x=>(x.textContent.match(/SL-\d+-\d/)||[''])[0]);
  ok(ids[0]&&ids[1]&&ids[0]!==ids[1],'each carries its own id: '+ids.join(' vs '));

  console.log('§2 each one is scannable');
  st.forEach(function(x,i){
    ok(x.querySelectorAll('rect').length>10,'sticker '+(i+1)+' has a drawn barcode ('+x.querySelectorAll('rect').length+' bars)');
  });
  const svgs=[...d.querySelectorAll('svg[id^=bc]')];
  ok(svgs[0].innerHTML!==svgs[1].innerHTML,'…encoding different values, not the same code twice');

  console.log('§3 one action, one control');
  const pb=[...d.querySelectorAll('#shell button')].filter(b=>/print/i.test(b.textContent));
  ok(pb.length===1,'one print button, beside the labels it prints (F7)');
  ok([...d.querySelectorAll('#shell button')].some(b=>/Receive another/.test(b.textContent)),'…and the footer keeps its own decision');

  console.log('§4 the printer gets labels, not the screen');
  ok(/@media print/.test(src),'there are print rules');
  ok(/#stickers-grid, #stickers-grid \*\{visibility:visible\}/.test(src),'only the sticker grid is visible on paper');
  ok(/page-break-inside:avoid/.test(src),'…each label kept whole across a page break');
  ok(/@page\{size:A4;margin:8mm\}/.test(src),'…on A4 with a margin the printer can hold');

  console.log('§5 the brand and the two readers');
  ok(st.every(x=>x.querySelectorAll('img').length===1),'each sticker carries the embedded wordmark (A1)');
  ok(st.every(x=>/[\u0600-\u06FF]/.test(x.textContent)),'…and reads in both languages at once');
  console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
  process.exit(f?1:0);
},300);
