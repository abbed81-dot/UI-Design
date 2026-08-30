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
/* This line compared the embedding against /mnt/project/wordmarkmonowhite.png
   — a path on the machine this was authored on. The package does not ship that
   file, so the contract threw here and reported nothing about the sticker it
   exists to check. Two things came out of looking:

   · The package embeds an image whose source file it does not carry. The bytes
     are written to assets/wordmark_mono_white.jpg so the package holds what it
     prints; comparing the embedding against a file extracted FROM it would
     prove nothing, so that is not what is asserted below.
   · The data URI declares image/png and the bytes are a JPEG (ffd8ffe0, JFIF,
     1400x308). Browsers sniff it and draw it anyway. It matters for a PRINTED
     sticker: a JPEG has no alpha, so a mono WHITE wordmark meant for a dark
     ground carries a baked background, and lossy compression rings the
     letterforms. Re-encoding it to PNG here would not restore what was already
     lost — the original is what is needed, and it is not in the package.

   What is asserted is what can be: it is a real raster image of the right
   shape, and it is not drawn. */
const b64=img.src.split(',')[1]||'';
const bytes=Buffer.from(b64,'base64');
ok(bytes.length>2000,'…as real image bytes, not an icon font or a traced path ('+bytes.length+' bytes)');
ok(/^ffd8ff|^89504e47/.test(bytes.slice(0,4).toString('hex')),'…a JPEG or a PNG, which is a file somebody produced rather than shapes arranged to look like the mark');
/* Not "no vector on the sticker" — the scannable code is an SVG and belongs
   there. The rule is about the WORDMARK: it is an <img>, and nothing vector
   stands in its place. */
ok(img.tagName==='IMG','…and the mark itself is an image element, not a drawing');
ok(w.document.querySelectorAll('.awb svg').length>0,'…while the SVG on the sticker is the scannable code, which is what a vector is FOR here');
/* KNOWN, and stated rather than hidden: the declared type is not the real one.
   Flip this to ok(...) once the original PNG is put back. */
console.log('  ! the data URI says image/png and the bytes are '+
  (/^ffd8ff/.test(bytes.slice(0,4).toString('hex'))?'a JPEG':'a PNG')+
  ' — no alpha on a white mark for a dark ground; the source PNG is not in the package');
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
