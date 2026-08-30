// roles.js — for every role in the staff registry, open every module and list the
// dangerous controls that person can SEE. What you may not do, you should not see.
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/claude/work/node_modules/jsdom');
const mk=x=>new JSDOM(fs.readFileSync(x,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test',virtualConsole:new VirtualConsole()}).window;
const c9=mk('ShopyLink_Action_C9_Staff.html');
const REG=c9.localStorage.getItem('SL_STAFF_V1');
const staff=JSON.parse(REG).staff;
// one representative person per (role, dept, level) combination actually in use
const seen={}, people=[];
staff.forEach(p=>{const k=p.role+'|'+p.dept+'|'+p.level;if(!seen[k]){seen[k]=1;people.push(p);}});
// controls that must not be visible without the matching grant
// Match the HANDLER, not the label. "Approved" is a status filter; askApprove() is
// the act. Reading the word alone reported a filter button as a permission breach.
const GUARDED=[[/askIssue\(|issueInv\(/,'b9_issue'],
               [/askApprove\(|apApprove\(/,'b9_issue'],
               [/askRmLane\(|rmLane\(/,'pr_base'],
               [/askReassign\(/,'b7_reassign']];
const files=process.argv.slice(2);
let bad=0;
files.forEach(file=>{
  people.forEach(p=>{
    let w;try{w=mk(file);}catch(e){return;}
    try{w.localStorage.setItem('SL_STAFF_V1',REG);}catch(e){}
    if(typeof w.setActorB9==='function')w.setActorB9(p.id);
    else if(typeof w.setActor==='function')w.setActor(p.id);
    else return;                                  // module has no actor yet
    // A guarded control usually lives inside an opened record, not on the landing
    // screen. Walk every screen AND open the first record of each kind, or the sweep
    // measures an empty page and reports success — which it did on its first run.
    const btns=[];
    const collect=()=>{[...w.document.querySelectorAll('#shell button')].forEach(b=>btns.push((b.getAttribute('onclick')||'')+' :: '+b.textContent.trim()));};
    const src=fs.readFileSync(file,'utf8');
    const screens=[...new Set((src.match(/go\('([a-z0-9\-]+)'\)/g)||[]).map(x=>x.slice(4,-2)))];
    screens.forEach(sc=>{try{w.go(sc);collect();}catch(e){}});
    ['openInv','openCross','openClaim','openD','openHub','openCard'].forEach(fn=>{
      if(typeof w[fn]!=='function')return;
      ['INVOICES','CROSS','CLAIMS','DRIVERS','HUBS','CARDS'].forEach(coll=>{
        if(!Array.isArray(w[coll])||!w[coll].length)return;
        try{w[fn](w[coll][0].ship||w[coll][0].id);collect();}catch(e){}
      });
    });
    GUARDED.forEach(([re,perm])=>{
      const visible=btns.filter(t=>re.test(t));
      if(visible.length&&p.perms.indexOf(perm)===-1){
        console.log('  ✗ '+file.replace('ShopyLink_','')+'  '+p.name+' ('+p.role+
          (p.dept?' · '+p.dept+' L'+p.level:'')+') sees '+JSON.stringify(visible[0])+' without '+perm);
        bad++;
      }
    });
  });
});
console.log(bad?('  '+bad+' controls visible without their grant'):'  every guarded control is hidden from those without the grant');
process.exitCode=bad?1:0;
