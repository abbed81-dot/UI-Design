// The carton sticker: read by the hand who packed it and the driver who receives it,
// often at the same moment — so its labels carry both languages at once, and the
// wordmark is the asset file rather than characters arranged to look like it.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const load=lang=>{const w=new JSDOM(fs.readFileSync('ShopyLink_Action_01_ReceiveParcel.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
  if(lang==='ar'&&w.setLang)w.setLang('ar'); w.go('done'); return w;};

console.log('§141 the brand is the asset (A1)');
const w=load('en');
const img=w.document.querySelector('.awb img');
ok(!!img,'the sticker carries the wordmark as an image');
/* This line used to compare the embedding against /mnt/project/wordmarkmonowhite.png
   — a path on the machine this was authored on, so the contract threw here and
   reported nothing about the sticker it exists to check. Looking at it turned
   up two real faults, both now closed:

   · The package embedded an image whose source file it did not ship. The mark
     is in assets/wordmarkmonowhite.png now, with assets/wordmarkmonowhite@2x.png
     beside it, so the package carries what it prints.
   · The data URI declared image/png and the bytes were a JPEG — 1400x308, JFIF.
     On a PRINTED sticker that is not cosmetic: a JPEG has no alpha, so a mono
     WHITE wordmark meant for a dark ground carried a baked background and lossy
     ringing on the letterforms. The original is embedded now: a real PNG, pure
     white on a true alpha channel, stored greyscale+alpha because every visible
     pixel is white and the colour channels held nothing the alpha did not —
     lossless, and 17KB instead of 37KB.

   The comparison below is the anti-drift check the original line was reaching
   for: the embedding must stay the file the package ships, so re-embedding
   something else is caught here rather than at a print run. */
const b64=img.src.split(',')[1]||'';
const bytes=Buffer.from(b64,'base64');
ok(b64===fs.readFileSync('assets/wordmarkmonowhite.png').toString('base64'),
   '…byte for byte assets/wordmarkmonowhite.png, not drawn from shapes and not a re-encoding of it');
ok(bytes.slice(0,4).toString('hex')==='89504e47',
   '…and it IS a PNG, as the data URI says: a JPEG here would print a white mark on a baked ground');
/* IHDR: 8 bytes of signature, then length(4) + "IHDR"(4) + width(4) +
   height(4), so bit depth is byte 24 and colour type is byte 25. Reading 24
   for the colour type is off by one and answers 8 — the bit depth — which is
   never 4 or 6, so the check failed on a file that was correct. */
ok(bytes.slice(12,16).toString()==='IHDR'&&(bytes[25]===4||bytes[25]===6),
   '…with a real alpha channel (PNG colour type '+bytes[25]+'), because the ground it prints on is dark');
/* Not "no vector on the sticker" — the scannable code is an SVG and belongs
   there. The rule is about the WORDMARK: it is an <img>, and nothing vector
   stands in its place. */
ok(img.tagName==='IMG','…and the mark itself is an image element, not a drawing');
ok(w.document.querySelectorAll('.awb svg').length>0,'…while the SVG on the sticker is the scannable code, which is what a vector is FOR here');
ok(!/>shopy</.test(w.document.querySelector('.awb').innerHTML),'no typed "shopy" remains');

console.log('§142 both readers, one sticker');
const core=['المرسِل / المتجر','المرسَل إليه','البنود الجمركية','القيمة المصرَّحة','الوزن المحتسَب','التاريخ','الوزن الإجمالي'];
['en','ar'].forEach(lang=>{
  const t=load(lang).document.querySelector('.awb').textContent.replace(/\s+/g,' ');
  const miss=core.filter(x=>!t.includes(x));
  ok(miss.length===0,lang+' mode: '+core.length+' labels carry Arabic beside English'+(miss.length?' — missing '+miss.join(', '):''));
  ok(/SL-/.test(t),'   the shipment id stays Latin (B2)');
  ok(/kg/.test(t),'   …and so do the weights');
});
const ar=load('ar').document.querySelector('.awb').textContent;
ok(/عدد الطرود/.test(ar),'the carton count reads in Arabic for an Arabic operator');

console.log('§143 the sticker still does its job');
ok(/AWB|CMR|B\/L/.test(w.document.querySelector('.awb').textContent),'it names the transport document type');
ok(w.document.querySelector('.awb svg')||/barcode/i.test(w.document.querySelector('.awb').innerHTML),'…and carries something scannable');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
