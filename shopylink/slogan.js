// slogan.js — the brand string is copied, never remembered.
// Source of truth: ShopyLink_Brand_Guide_A4.html → "world · to · door"
const fs=require('fs');
const CORRECT='world · to · door';
const pat=/[Ww]orld\s*·?\s*[Tt]o\s*·?\s*[Dd]oor/g;
function scan(text,where,out){
  let m;while((m=pat.exec(text))!==null){
    if(m[0]!==CORRECT)out.push({where:where,found:m[0]});
  }
}
const f=process.argv[2];
const html=fs.readFileSync(f,'utf8');
const out=[];
scan(html,'file',out);
// base64-embedded modules hide from a plain text search — look inside them too
(html.match(/data:text\/html;base64,[A-Za-z0-9+/=]+/g)||[]).forEach((d,i)=>{
  try{scan(Buffer.from(d.split('base64,')[1],'base64').toString('utf8'),'embedded #'+(i+1),out);}catch(e){}
});
console.log(f+' — '+(out.length?out.length+' WRONG':'slogan correct'));
out.forEach(o=>console.log('   ✗ '+JSON.stringify(o.found)+'  in '+o.where));
process.exitCode=out.length?1:0;
