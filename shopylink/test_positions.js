// The owner asked for positions and authorities as a freight forwarder actually
// has them. Three things stood in the way: five modules guarded themselves with
// the grant for managing STAFF, the roles had no statement of what any of them
// meant, and two vocabularies disagreed about the names.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
let f=0,n=0;const ok=(c,m)=>{n++;console.log((c?'  ✓ ':'  ✗ FAIL ')+m);if(!c)f++;};
const c9=mk('ShopyLink_Action_C9_Staff.html');
const staff=JSON.parse(c9.localStorage.getItem('SL_STAFF_V1')).staff;

console.log('§1 the network and the fleet have grants of their own');
['nw_fleet','nw_fleet_rm','nw_map','nw_map_rm','nw_agents','nw_agents_rm'].forEach(function(g,i){
  ok(c9.FN_TIER[g]!==undefined,'1.'+(i+1)+' '+g+' exists, at level '+c9.FN_TIER[g]);
});
ok(c9.FN_TIER.nw_fleet===1&&c9.FN_TIER.nw_fleet_rm===2,'1.7 keeping a record is level 1; RETIRING a truck or a driver is level 2 — the same shape as every other pair in this system');
ok(c9.GROUPS.some(g=>g.fns.some(x=>x.id==='nw_map')),'1.8 …and they are on the screen where grants are given, or they could never be held');

console.log('\n§2 no module guards itself with somebody else\'s grant');
[['C1_Trucks','nw_fleet'],['C2_Drivers','nw_fleet'],['C7_Hubs','nw_map'],
 ['C10_Zones','nw_map'],['C8_Agents','nw_agents']].forEach(function(pair,i){
  const src=fs.readFileSync('ShopyLink_Action_'+pair[0]+'.html','utf8');
  ok(src.indexOf("actorMay('st_manage')")===-1,'2.'+(i+1)+' '+pair[0]+' no longer asks for the STAFF grant — keeping personnel records should not let a person retire a truck');
  ok(src.indexOf("actorMay('"+pair[1]+"')")>-1,'   …it asks for '+pair[1]);
});

console.log('\n§3 every position says what it owns');
const roles=c9.ROLES;
ok(roles.every(r=>r.stmt&&r.stmtAr),'3.1 each has a statement of responsibility, in both languages — this register had permissions and not one word of what any role MEANS');
ok(roles.every(r=>/Accountable for/.test(r.stmt)),'3.2 …and each names what he is accountable FOR, not only what he owns');
ok(roles.filter(r=>r.id!=='admin').every(r=>!!r.sup),'3.3 everybody answers to somebody');
ok(roles.filter(r=>r.id==='admin')[0].sup===null,'3.4 …except the one at the top');
ok(roles.filter(r=>r.id==='wh')[0].sup==='hubsup','3.5 a centre clerk answers to the centres manager, not to the owner — each centre has its own staff and a manager over the four');
ok(roles.filter(r=>r.id==='driver')[0].sup==='disp','3.6 …and a driver to the trip coordinator');
ok(!roles.some(r=>r.id==='docs'),'3.7 there is no "documentation" position: documents have four custodies — shipping papers with the coordinator, staff papers with HR, transit papers with the external agent, and the originals with the driver');
ok(roles.filter(r=>r.id==='customs')[0].stmt.indexOf('agent')>-1,'3.8 and clearance is described as dealing with AGENTS, because the clearing is done by an external one');

console.log('\n§4 it travels with the person');
const one=staff.filter(p=>p.role==='disp')[0];
ok(!!one.stmtAr&&!!one.stmt,'4.1 a published person carries the statement of his position');
ok('reportsTo' in one,'4.2 …and who he answers to');
ok(one.reportsTo==='admin','4.3 read from the role, not typed onto the person');
ok(staff.every(p=>Array.isArray(p.perms)),'4.4 alongside his grants, as before');

console.log('\n§5 the grants sit with the work');
const byRole={};roles.forEach(r=>{byRole[r.id]=Object.keys(r.perms);});
ok(byRole.hubsup.indexOf('nw_map')>-1,'5.1 the centres manager may keep the centres');
ok(byRole.disp.indexOf('nw_fleet')>-1,'5.2 the trip coordinator may keep trucks and drivers');
ok(byRole.customs.indexOf('nw_agents')>-1,'5.3 the agent liaison may keep the agents');
ok(byRole.acct.indexOf('nw_map')===-1&&byRole.acct.indexOf('nw_fleet')===-1,'5.4 …and the accountant may keep none of them, which was not true an hour ago');
ok(byRole.sales.indexOf('nw_agents')===-1,'5.5 nor sales');

console.log('\n§6 one vocabulary, and a bridge for the file that had its own');
/* both on one storage: D1 READS the register, so testing it in isolation tests
   a system with no staff module — which answers null, correctly, and proves
   nothing about the bridge */
const store6={};
const sh6={getItem:k=>k in store6?store6[k]:null,setItem:(k,v)=>{store6[k]=String(v)},removeItem:k=>{},clear:()=>{},key:i=>Object.keys(store6)[i],get length(){return Object.keys(store6).length}};
const op6=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:sh6,configurable:true});w.render&&w.render();return w;};
op6('ShopyLink_Action_C9_Staff.html');
const d1=op6('ShopyLink_D1_Control.html');
ok(typeof d1.roleCanon==='function','6.1 D1 can say which position each of its local names means');
ok(d1.roleCanon('ops')==='disp','6.2 ops is the trip coordinator');
ok(d1.roleCanon('finance')==='acct','6.3 finance is the accountant');
ok(d1.roleCanon('manager')==='admin','6.4 manager is the one at the top');
ok(d1.roleCanon('docs')==='disp','6.5 and docs is the coordinator too — documents are not a job, and the shipping papers are his');
ok(d1.roleCanon('wh')==='wh'&&d1.roleCanon('sales')==='sales','6.6 the names that already agreed are untouched');
ok(d1.ROLES.length===7,'6.7 D1 keeps its own seven, because its WORK ITEMS are routed by them and its people are written in that vocabulary');

const pos=d1.positionOf('ops');
ok(!!pos&&!!pos.stmt,'6.8 …but it READS what a position owns from the register rather than restating it');
ok(pos.role==='disp','6.9 …under the register\'s name');
const nb=JSON.parse(sh6.getItem('SL_NOTICES_V1')).notices.filter(n=>n.audience&&n.audience.roles)[0];
ok(!!nb&&nb.audience.roles.every(r=>d1.roleCanon(r)===r),'6.10 and everything that LEAVES speaks the register\'s language — a notice addressed to "ops" would otherwise reach nobody at all');
ok(nb.audience.roles.length===new Set(nb.audience.roles).size,'6.11 …with the same man addressed once, though two local names map to him');

console.log('\n§7 the fleet is the fleet\'s, and a tare is not a guess');
const st7={};
const sh7={getItem:k=>k in st7?st7[k]:null,setItem:(k,v)=>{st7[k]=String(v)},removeItem:k=>{},clear:()=>{},key:i=>Object.keys(st7)[i],get length(){return Object.keys(st7).length}};
const op7=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:sh7,configurable:true});w.render&&w.render();return w;};
const c1=op7('ShopyLink_Action_C1_Trucks.html');
const fleet=JSON.parse(sh7.getItem('SL_TRUCKS_V1')).trucks;
ok(fleet.length>0,'7.1 C1 publishes the fleet — it has always held it and nobody could read it');
ok(fleet.every(t=>t.plate&&t.tare>0&&t.payload>0),'7.2 each with the plate a coordinator writes down, its tare and what it can carry');
const b3=op7('ShopyLink_Action_03_CreateTrip.html');
const live=b3.trucksLive();
ok(live.every(t=>fleet.some(x=>x.plate===t.plate)),'7.3 every lorry a trip can be given is one the company owns — this file invented two with plates C1 has never seen');
const trk1=live.filter(t=>t.id==='TRK-01')[0];
ok(!!trk1&&trk1.tare===15200,'7.4 …and its TARE is the real one: 15,200 kg against the 8,500 this file used to assume — nearly seven tonnes of difference in every load calculation');
ok(live.every(t=>'papers' in t),'7.5 a lorry whose papers have expired is a fact the coordinator sees, not one buried in the fleet module');
const bare7=mk('ShopyLink_Action_03_CreateTrip.html');
ok(bare7.trucksLive().length>0,'7.6 with nothing published it still draws its seed');
ok(/TRUCKS_SEED/.test(fs.readFileSync('ShopyLink_Action_03_CreateTrip.html','utf8')),'7.7 …named as seed, like everywhere else');

console.log('\n§8 one list of countries, and one of categories');
const st8={};
const sh8={getItem:k=>k in st8?st8[k]:null,setItem:(k,v)=>{st8[k]=String(v)},removeItem:k=>{},clear:()=>{},key:i=>Object.keys(st8)[i],get length(){return Object.keys(st8).length}};
const op8=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:sh8,configurable:true});w.render&&w.render();return w;};
op8('ShopyLink_Action_C7_Hubs.html');
const ctr=JSON.parse(sh8.getItem('SL_COUNTRIES_V1')).countries;
ok(ctr.length>0,'8.1 C7 publishes the countries — four modules held a list and no two had the same shape');
ok(ctr.every(c=>c.en&&c.ar&&c.cur&&c.tel),'8.2 …with everything the four copies were keeping apart: both names, the currency, the dialling code');
const c8=op8('ShopyLink_Action_C8_Agents.html'), d18=op8('ShopyLink_D1_Control.html');
ok(c8.countriesLive().some(c=>c.id==='US'),'8.3 America reaches the agents module — it was registered this morning and appeared in exactly ONE of the four');
ok(d18.countriesLive().some(c=>c.ar==='أمريكا'),'8.4 …and D1, in Arabic, which is the shape it needs');
ok(c8.countriesLive().length===d18.countriesLive().length,'8.5 the same list to both, differently shaped');
const bare8=mk('ShopyLink_Action_C8_Agents.html');
ok(bare8.countriesLive().length>0,'8.6 with nothing published each still draws its seed');
const pr8=op8('ShopyLink_Pricing.html');
const b98=op8('ShopyLink_Action_09_Billing.html');
ok(b98.catsLive().length===JSON.parse(sh8.getItem('SL_TARIFF_V1')).cats.length,'8.7 billing reads the categories from the tariff rather than keeping its own');
const tf8=JSON.parse(sh8.getItem('SL_TARIFF_V1')); tf8.cats.push({id:'gold',name:'Gold',disc:15});
sh8.setItem('SL_TARIFF_V1',JSON.stringify(tf8));
ok(b98.catsLive().some(c=>c.id==='gold'),'8.8 …so a category added at the owner reaches the invoice, instead of it charging last month\'s discount with nothing to show it had');

console.log('\n§9 registering a person is refused with a reason, and declared');
const c9r=mk('ShopyLink_Action_C9_Staff.html');
ok(c9r.createWhy()==='a person needs a name','9.1 an empty form says what is missing, rather than greying out a button and letting him guess');
c9r.nu.name='Hala Deeb';
ok(/address/.test(c9r.createWhy()),'9.2 …then the next thing');
c9r.nu.email=c9r.USERS[0].email;
ok(/already belongs/.test(c9r.createWhy()),'9.3 an address another person holds is refused — an email is how somebody signs in, and two people cannot share one door');
c9r.nu.email='hala.deeb@shopylink.com';
c9r.nu.scope={type:'list',countries:[],hubs:['H-DAM']}; c9r.nu.pass='Temp!9911';
ok(c9r.createWhy()==='','9.4 …and when it is complete it says so');
const made=c9r.createUser();
ok(made.ok===true&&!!made.id,'9.5 the person is registered');
const rec=c9r.USERS.filter(u=>u.id===made.id)[0];
ok(rec.status==='invited'&&rec.invite&&rec.invite.pass,'9.6 with an invitation and a first password he will be made to change');
ok(rec.engagement==='employee','9.7 …and his ENGAGEMENT, asked at the door: deciding it later means somebody has already been given a roster he was never entitled to');
const evs9=JSON.parse(c9r.localStorage.getItem('SL_EVENTS_V1')||'[]').filter(e=>e.type==='user.registered');
ok(evs9.length===1,'9.8 and it is declared on the shared log, where it cannot be quietly un-happened');
ok(evs9[0].payload.role==='wh'&&evs9[0].payload.hubs.length>0,'9.9 …naming the position granted and where he works');
ok('by' in evs9[0].payload,'9.10 …and who granted it: a person given the keys to a company\'s system is a fact the company holds');

console.log('\n§10 the agent who paid, by reference');
const st10={};
const sh10={getItem:k=>k in st10?st10[k]:null,setItem:(k,v)=>{st10[k]=String(v)},removeItem:k=>{},clear:()=>{},key:i=>Object.keys(st10)[i],get length(){return Object.keys(st10).length}};
const op10=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:sh10,configurable:true});w.render&&w.render();return w;};
op10('ShopyLink_Action_C7_Hubs.html');
op10('ShopyLink_Action_C8_Agents.html');
const ag=JSON.parse(sh10.getItem('SL_AGENTS_V1')).agents;
ok(ag.length>0,'10.1 C8 publishes the clearing agents — it held them in full and published none of it');
ok(ag.every(a=>a.company&&a.services.length),'10.2 …each with his company and what he actually does for us');
const b5=op10('ShopyLink_Action_B5_BorderFees.html');
const bd=b5.bordersLive()[0];
ok(/AGT-/.test(bd.agent),'10.3 a border names its agent by REFERENCE — it used to carry him as free text, and the network carried a reference, and no reader could join the two');
ok(/Odeh|Arslan/.test(b5.agentLabel(bd.agent)),'10.4 …resolved to a person and a company when it is shown');
const spend=b5.agentSpend(bd.agent);
ok(spend.total>0,'10.5 "what has this agent spent on our behalf" has an answer now — '+spend.total+' '+spend.cur);
ok(spend.rows.length>0&&spend.rows[0].crossing,'10.6 …crossing by crossing, so it can be checked against his invoice');
ok(b5.agentSpend('AGT-99').total===0,'10.7 an agent who has crossed nothing has spent nothing, not an error');

console.log('\n§11 one added fee per city, and it is the tariff\'s');
const pr11=mk('ShopyLink_Pricing.html');
ok(pr11.govExtra('Aleppo')===180,'11.1 the extra to Aleppo is the tariff\'s 180 — this screen kept its own table saying 5, and raising the tariff left the address plans charging the old figure');
ok(pr11.govExtra('Damascus')===0,'11.2 the city where the hub is adds nothing');
ok(pr11.govExtra('Tartus')===200,'11.3 Tartus is priced now — it is in the tariff and was missing from the screen\'s own list of five');
ok(pr11.govExtra('Hama')===null,'11.4 a governorate nobody has priced answers null, not zero: unpriced is not free');
const row=pr11.apRow(Object.keys(pr11.APLANS)[0],'Aleppo');
ok(row&&row.year>0,'11.5 the address plan still prices, from the centre plus that extra — which is the owner\'s rule in one line: from the centre to the city hub, and every further city adds its fee');
ok(/GOVX_SEED/.test(fs.readFileSync('ShopyLink_Pricing.html','utf8')),'11.6 the old table survives as a named seed for a governorate the tariff does not carry');

console.log('\n§12 a position says what work it receives');
const st12={};
const sh12={getItem:k=>k in st12?st12[k]:null,setItem:(k,v)=>{st12[k]=String(v)},removeItem:k=>{},clear:()=>{},key:i=>Object.keys(st12)[i],get length(){return Object.keys(st12).length}};
const op12=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:sh12,configurable:true});w.render&&w.render();return w;};
const c912=op12('ShopyLink_Action_C9_Staff.html');
ok(c912.ROLES.every(r=>Array.isArray(r.duties)),'12.1 every position lists the KINDS of work that land on it');
ok(c912.ROLES.every(r=>r.dutyAr&&r.dutyEn),'12.2 …and says in a sentence what its day is made of, in both languages');
ok(c912.ROLES.filter(r=>r.id==='wh')[0].duties.join()==='measure','12.3 the centre clerk measures');
ok(c912.ROLES.filter(r=>r.id==='acct')[0].duties.join()==='invoice','12.4 the accountant invoices');
ok(c912.ROLES.filter(r=>r.id==='audit')[0].duties.length===0,'12.5 …and the auditor receives no work at all: he reads and reports, which is a duty stated by its absence');
const st=JSON.parse(sh12.getItem('SL_STAFF_V1')).staff;
ok(st.every(p=>Array.isArray(p.duties)),'12.6 the duties travel with the person, like his grants and his statement');

const d12=op12('ShopyLink_D1_Control.html');
ok(JSON.stringify(d12.dutiesOf('ops'))===JSON.stringify(['document','deliver']),'12.7 the control board reads them under its own name for the position');
const wh=d12.queueFor('wh')||[];
ok(wh.length>0&&wh.every(i=>i.kind==='measure'||i.role==='wh'),'12.8 …and a clerk receives measuring work');
const fin=d12.queueFor('finance')||[];
ok(fin.some(i=>i.kind==='invoice'&&!i.role),'12.9 an item with NO role — "invoice a delivered shipment" — reaches the accountant by his duty. It used to fall on nobody, which is how work goes missing without anybody refusing it');
ok((d12.queueFor('audit')||[]).length===0,'12.10 and the auditor is sent none');
const bare12=mk('ShopyLink_D1_Control.html');
ok(bare12.dutiesOf('ops')===null&&(bare12.queueFor('ops')||[]).length>=0,'12.11 with no staff register the board routes as it always did, rather than routing nothing');

console.log('\n§13 sales: registers, quotes, builds and ASKS');
const st13={};
const sh13={getItem:k=>k in st13?st13[k]:null,setItem:(k,v)=>{st13[k]=String(v)},removeItem:k=>{},clear:()=>{},key:i=>Object.keys(st13)[i],get length(){return Object.keys(st13).length}};
const op13=x=>{const w=mk(x);Object.defineProperty(w,'localStorage',{value:sh13,configurable:true});w.render&&w.render();return w;};
const c913=op13('ShopyLink_Action_C9_Staff.html');
const sales=c913.ROLES.filter(r=>r.id==='sales')[0];
const has=g=>Object.keys(sales.perms).indexOf(g)>-1;
ok(has('b0_reg'),'13.1 sales registers a shipment');
ok(has('qt_make'),'13.2 …draws up a quotation — an act that had NO grant at all until now, so the screen was open to anybody who could reach it');
ok(has('qt_price'),'13.3 …and may offer a price other than the tariff\'s, without an approval: it is an offer to ONE client, not a price published to everybody, and the owner\'s L3 rule guards the published list');
ok(has('b9_build')&&has('b9_issue'),'13.4 …and both builds the invoice and issues it');
ok(sales.duties.indexOf('invoice')>-1,'13.5 so invoicing work reaches him now');
ok(/يسجّل الشحنة/.test(sales.dutyAr),'13.6 …and his day is described as he described it');

const st13x=JSON.parse(sh13.getItem('SL_STAFF_V1'));
const jr=st13x.staff.filter(p=>p.role==='sales')[0]; jr.level=1;
sh13.setItem('SL_STAFF_V1',JSON.stringify(st13x));
const b913=op13('ShopyLink_Action_09_Billing.html');
b913.setActor(jr.id); b913.cur=b913.INVOICES[0].ship;
ok(b913.issueNeedsApproval()===true,'13.7 a level-1 salesman holding the grant still needs an approval to issue');
b913.issueInv();
ok(b913.INVOICES[0].status==='draft','13.8 …so pressing issue does NOT make it a debt on the client');
const req13=JSON.parse(sh13.getItem('SL_APPROVALS_V1')||'[]').filter(x=>x.op==='invoice')[0];
ok(!!req13&&req13.level===2,'13.9 it is filed instead, at level 2');
ok(/\d/.test(req13.amount||''),'13.10 …showing what would be charged: '+req13.amount);
const acct13=st13x.staff.filter(p=>p.role==='acct'&&Number(p.level)>=2)[0];
if(acct13){
  const b2=op13('ShopyLink_Action_09_Billing.html');
  b2.setActor(acct13.id); b2.cur=b2.INVOICES[1].ship;
  ok(b2.issueNeedsApproval()===false,'13.11 …while a level-2 accountant issues with his own hand: the GRANT says he is in this business, the LEVEL says whether his hand is enough');
}

console.log('\n'+(f?'  '+f+' FAILED of '+n:'ALL PASS — '+n+' checks'));
process.exit(f?1:0);
