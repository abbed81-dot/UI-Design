// the hub registry: C7 owns it, Pricing reads it, and neither is blocked when it is gone
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const mk=file=>new JSDOM(fs.readFileSync(file,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;

console.log('§90 one owner publishes');
const c7=mk('ShopyLink_Action_C7_Hubs.html');
const pub=c7.slRegHubs();
ok(pub&&pub.length>0,'C7 publishes its hubs ('+pub.length+')');
ok(pub.every(h=>h.id&&h.name),'every entry carries an id and a name');
ok(pub.some(h=>h.city&&h.phone),'…and the city and phone that only C7 holds');
ok(pub.every(h=>h.status!=='closed'),'closed hubs are not offered');

console.log('§91 the consumer reads, never retypes');
const pr=mk('ShopyLink_Pricing.html');
pr.localStorage.setItem('SL_HUBS_V1',c7.localStorage.getItem('SL_HUBS_V1'));
ok((pr.slRegHubs()||[]).length===pub.length,'Pricing sees exactly what C7 published');
const avail=pr.hubsNotPriced();
ok(avail!==null,'the list is offered as a choice');
ok(avail.every(a=>pub.some(h=>a.id.indexOf(h.name)===0)),'every option comes from the registry, none invented');
pr.go('s6');pr.askAddHub();
ok(!!pr.document.querySelector('.sl-modal select'),'the choice is a dropdown, not a text field');
pr.setPendHub(avail[0].id);pr.modalOk();
ok(pr.curHub===avail[0].id,'the attached name is the registry name, character for character');
ok(pr.hubsNotPriced().length===avail.length-1,'…and that hub is no longer offered twice');

console.log('§92 it degrades honestly');
const dom=new JSDOM(fs.readFileSync('ShopyLink_Pricing.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()});
Object.defineProperty(dom.window,'localStorage',{get(){throw new Error('blocked');}});
dom.window.eval(fs.readFileSync('ShopyLink_Pricing.html','utf8').match(/<script>([\s\S]*?)<\/script>/g).map(b=>b.replace(/<\/?script>/g,'')).join('\n'));
ok(dom.window.slRegHubs()===null,'blocked storage → no registry');
dom.window.askAddHub();
const t2=dom.window.document.querySelector('.sl-modal').textContent.replace(/\s+/g,' ');
ok(/not reachable/.test(t2),'…the dialog says so rather than showing an empty list');
ok(/type the name exactly/.test(t2),'…and typing still works, so nobody is stopped');
console.log('\n'+(f?('FAIL — '+f+' of '+n):('ALL PASS — '+n+' checks')));
process.exit(f?1:0);
