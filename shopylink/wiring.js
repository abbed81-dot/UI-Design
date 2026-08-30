// Reads the system's wiring OUT OF THE CODE: which module publishes which
// channel, which reads it, what each declares on the log and what each listens
// for, and which acts need an approval. Nothing here is typed by hand, which is
// the whole point — the last diagram was drawn once and was wrong within a week.
const fs = require('fs'), path = require('path');

const DIR = __dirname;
const SKIP = /Brand_|Logo_|Asset_Hub|Packaging|Stationery|Combined|Doc_|Dashboard\.html/;

function moduleName(f) {
  return f.replace(/^ShopyLink_/, '').replace(/\.html$/, '')
          .replace(/^Action_/, '').replace(/_/g, ' ');
}
function uniq(a) { const s = {}, o = []; a.forEach(x => { if (x && !s[x]) { s[x] = 1; o.push(x); } }); return o.sort(); }

function feeders(src){
  /* the bodies of the functions that BUILD what gets published — registries and
     publishers. A table matters here if one of them reads it, whatever the
     channel ends up calling the result: MSGS travels as `threads`, and a test
     that matched names alone kept calling it an island after it was published. */
  var out='', re2=/function\s+\w*(?:Registry|Publish|Facts)\w*\s*\([^)]*\)\s*\{/g, m2;
  while((m2=re2.exec(src))){ out += src.slice(m2.index, m2.index+1400); }
  return out;
}
function publishBody(src){
  /* the text of every publish call in the file: what actually leaves it */
  var out='', re2=/setItem\(/g, m2;
  while((m2=re2.exec(src))){ out += src.slice(m2.index, m2.index+900); }
  return out;
}
function scan() {
  const files = fs.readdirSync(DIR).filter(f => /^ShopyLink_.*\.html$/.test(f) && !SKIP.test(f));
  const mods = [];
  files.forEach(f => {
    const src = fs.readFileSync(path.join(DIR, f), 'utf8');
    // a channel is PUBLISHED where the file writes it, READ where it only reads
    const writes = uniq((src.match(/setItem\(\s*(?:'|")?(SL_[A-Z0-9_]+_V1)|setItem\(\s*([A-Za-z_$][\w$]*)\s*,/g) || [])
      .map(m => (m.match(/SL_[A-Z0-9_]+_V1/) || [])[0]).filter(Boolean));
    // setItem(VAR, …) — resolve the variable to the channel it holds
    const varChans = {};
    (src.match(/var\s+([A-Za-z_$][\w$]*)\s*=\s*'(SL_[A-Z0-9_]+_V1)'/g) || []).forEach(d => {
      const m = d.match(/var\s+([A-Za-z_$][\w$]*)\s*=\s*'(SL_[A-Z0-9_]+_V1)'/);
      varChans[m[1]] = m[2];
    });
    (src.match(/setItem\(\s*([A-Za-z_$][\w$]*)\s*,/g) || []).forEach(d => {
      const v = d.match(/setItem\(\s*([A-Za-z_$][\w$]*)\s*,/)[1];
      if (varChans[v]) writes.push(varChans[v]);
    });
    const readsRaw = uniq((src.match(/getItem\(\s*(?:'|")?(SL_[A-Z0-9_]+_V1)/g) || [])
      .map(m => (m.match(/SL_[A-Z0-9_]+_V1/) || [])[0]).filter(Boolean));
    (src.match(/getItem\(\s*([A-Za-z_$][\w$]*)\s*\)/g) || []).forEach(d => {
      const v = d.match(/getItem\(\s*([A-Za-z_$][\w$]*)\s*\)/)[1];
      if (varChans[v]) readsRaw.push(varChans[v]);
    });
    const publishes = uniq(writes);
    const reads = uniq(readsRaw.filter(c => publishes.indexOf(c) === -1));
    const emits = uniq((src.match(/slEmit\(\s*'([a-z.]+)'/g) || []).map(m => m.match(/'([a-z.]+)'/)[1]));
    // an event a file LISTENS for: named in a comparison or a stage table
    const listens = uniq((src.match(/(?:type\s*===\s*'|ev:\s*')([a-z]+\.[a-z]+)'/g) || [])
      .map(m => m.match(/'([a-z]+\.[a-z]+)'/)[1]).filter(e => emits.indexOf(e) === -1));
    const approvals = uniq((src.match(/op:\s*'([a-z]+)'|\{id:\s*'([a-z]+)',icon/g) || [])
      .map(m => (m.match(/'([a-z]+)'/) || [])[1]).filter(Boolean));
    /* What a module HOLDS and does not share. The diagram drew the wires and
       could not see an island: the tariff, the addresses, the zones and the
       notice board were each a table of record living in one file, invisible to
       every other, and each was found by accident rather than by looking. A
       named list of records that reaches no channel is exactly that shape. */
    /* `var X=[{…}]` finds a seeded table. `var X=[]` finds one that fills at
       RUNTIME — which is how the message threads stayed invisible: MSGS starts
       empty, so a scanner looking only for seeded rows never saw the one table
       in the system that carries what people said to each other. */
    const held = uniq(
      (src.match(/var ([A-Z][A-Z0-9_]{2,})\s*=\s*\[\s*\{/g) || [])
        .map(m => (m.match(/var ([A-Z][A-Z0-9_]{2,})/) || [])[1])
      .concat(
      (src.match(/var ([A-Z][A-Z0-9_]{2,})\s*=\s*\[\s*\]/g) || [])
        .map(m => (m.match(/var ([A-Z][A-Z0-9_]{2,})/) || [])[1])
      )
      .filter(n => n && !/_SEED$|^SL_|^PAGE_|^PGS$|^T_/.test(n)));
    if (!publishes.length && !reads.length && !emits.length && !listens.length && !held.length) return;
    mods.push({ file: f, name: moduleName(f), publishes, reads, emits, listens, approvals, held });
  });
  const channels = {};
  mods.forEach(m => {
    m.publishes.forEach(c => { channels[c] = channels[c] || { owners: [], readers: [] }; channels[c].owners.push(m.name); });
    m.reads.forEach(c => { channels[c] = channels[c] || { owners: [], readers: [] }; channels[c].readers.push(m.name); });
  });
  const events = {};
  mods.forEach(m => {
    m.emits.forEach(e => { events[e] = events[e] || { from: [], to: [] }; events[e].from.push(m.name); });
    m.listens.forEach(e => { events[e] = events[e] || { from: [], to: [] }; events[e].to.push(m.name); });
  });
  /* a record table is "unshared" when the module that holds it publishes
     nothing at all — it may be a seed, or it may be the company's only copy of
     something, and either way somebody should look at it deliberately */
  /* An island is a table of record that exists in ONE file and has no
     counterpart anywhere on the channels — not "does it leave this module",
     which flags every legitimate local fallback of a published register, but
     "does the system carry this thing at all". The tariff, the addresses, the
     zones and the notice board each answered no, and each was found by
     accident. MSGS — the message threads — still answers no. */
  const shipped = mods.map(m => publishBody(fs.readFileSync(path.join(DIR, m.file), 'utf8')))
                      .join(' ').toLowerCase();
  const chanNames = Object.keys(channels).join(' ').toLowerCase();
  const islands = [], summaries = [], bridged = [];
  mods.forEach(m => {
    m.held.forEach(h => {
      const stem = h.toLowerCase().replace(/s$/, '');
      if (stem.length < 3) return;
      const own = fs.readFileSync(path.join(DIR, m.file), 'utf8');
      /* A module that keeps X_SEED and reads a live X from a channel is not
         holding a second copy — it is holding a fallback for one that exists,
         which is the pattern this codebase settled on. Counting those as
         duplicates gave false alarms (CITYX and SERVICES were reported as
         "prices in two places" the morning after they were fixed), and a tool
         that cries wolf stops being read. */
      const seeded = new RegExp('\\b' + h + '_SEED\\b').test(own) || /_SEED$/.test(h);
      const named  = new RegExp(stem + '[a-z]*\\s*[:,]').test(shipped) ||
                     chanNames.indexOf(stem) > -1;
      /* A publisher READING a table is not the same as publishing it: C9's
         staff registry reads LEAVE_REQS and ships `onLeave:true` — a summary,
         not the requests. Clearing it as "carried" hid a real duplicate, so
         these are reported apart rather than absolved. */
      const summarised = !named && new RegExp('\\b' + h + '\\b').test(feeders(own));
      if (summarised) summaries.push({ module: m.name, list: h });
      const carried = named || seeded || summarised;
      if (!carried) islands.push({ module: m.name, list: h });
      /* A table that names a BRIDGE to the owner's vocabulary is a translation,
         not a second copy: D1 keeps its seven role names because its work items
         are routed by them, and maps every one to the register on the way out.
         The tool records that rather than either hiding it or calling it a
         duplicate — the reader deserves to know which kind he is looking at. */
      /* the bridge must be for THIS table, not merely present in the same file:
         D1 holds a role alias and also holds COUNTRIES and AUDIT, and marking
         those as translated would be a comfortable lie */
      if (h === 'ROLES' && /ROLE_ALIAS/.test(own)) bridged.push({ module: m.name, list: h });
    });
  });
  /* ranked, because 53 unsorted names is a list nobody reads: a table of the
     same name held in two modules with no channel between them is two copies of
     one fact waiting to disagree; one held in a single module is merely
     unshared, which may be perfectly fine. */
  const byName = {};
  islands.forEach(i => { (byName[i.list] = byName[i.list] || []).push(i.module); });
  const split = Object.keys(byName).filter(k => byName[k].length > 1)
    .map(k => ({ list: k, modules: byName[k] }))
    .sort((a, b) => b.modules.length - a.modules.length);
  const alone = Object.keys(byName).filter(k => byName[k].length === 1)
    .map(k => ({ list: k, module: byName[k][0] })).sort((a,b)=>a.module<b.module?-1:1);
  /* ── the same table in two modules, whatever bucket each fell into ────
     LEAVE_REQS was missed by every earlier version: C9's copy is summarised
     onto the staff channel (`onLeave:true`) and C2's is not, so the two halves
     of one duplication landed in two different lists and neither looked like a
     pair. The question is simply whether a name is held twice, and whether
     anything joins the copies. */
  const everywhere = {};
  mods.forEach(m => m.held.forEach(h => {
    const base = h.replace(/_SEED$/, '');
    (everywhere[base] = everywhere[base] || []).push(m.name);
  }));
  const twinned = Object.keys(everywhere)
    .filter(k => uniq(everywhere[k]).length > 1)
    .filter(k => !Object.keys(channels).some(c => c.toLowerCase().indexOf(k.toLowerCase().replace(/s$/,'')) > -1))
    .map(k => ({ list: k, modules: uniq(everywhere[k]) }))
    .sort((a, b) => b.modules.length - a.modules.length);
  const bridgedNames = {};
  bridged.forEach(b => { bridgedNames[b.list] = 1; });
  twinned.forEach(t => { t.bridged = !!bridgedNames[t.list]; });
  return { mods, channels, events, islands, split, alone, summaries, twinned, bridged, positions: positions() };
}


/* ── does this already exist? ─────────────────────────────────────────
   The owner's standing rule, made answerable in one command:
       node wiring.js find <word>
   Before writing a module, a table or a function, ask where the thing already
   lives. Four times in one week something was built that already existed —
   the addresses screen, the notice board, the console, and a second rule for
   releasing past a credit limit — and every time the original was better than
   the copy. The cost of asking is a second; the cost of not asking was a day. */
function find(term){
  const t = String(term || '').toLowerCase();
  if (!t) { console.log('usage: node wiring.js find <word>'); return; }
  const files = fs.readdirSync(DIR).filter(f => /^ShopyLink_.*\.html$/.test(f));
  const hits = [];
  files.forEach(f => {
    const src = fs.readFileSync(path.join(DIR, f), 'utf8');
    const low = src.toLowerCase();
    if (low.indexOf(t) === -1) return;
    const fns = (src.match(/function\s+(\w*)/g) || [])
      .map(x => x.replace(/function\s+/, ''))
      .filter(n => n.toLowerCase().indexOf(t) > -1);
    const tables = (src.match(/var ([A-Z][A-Z0-9_]{2,})\s*=\s*\[/g) || [])
      .map(x => (x.match(/var ([A-Z][A-Z0-9_]{2,})/) || [])[1])
      .filter(n => n && n.toLowerCase().indexOf(t) > -1);
    const chans = uniq((src.match(/SL_[A-Z0-9_]+_V1/g) || [])
      .filter(c => c.toLowerCase().indexOf(t) > -1));
    const mentions = (low.match(new RegExp(t, 'g')) || []).length;
    hits.push({ file: moduleName(f), fns: uniq(fns), tables: uniq(tables), chans, mentions });
  });
  hits.sort((a, b) => (b.fns.length + b.tables.length + b.chans.length) -
                      (a.fns.length + a.tables.length + a.chans.length) || b.mentions - a.mentions);
  if (!hits.length) { console.log('"' + term + '" appears nowhere — it is genuinely new.'); return; }
  console.log('"' + term + '" already appears in ' + hits.length + ' module(s):\n');
  hits.slice(0, 10).forEach(h => {
    const parts = [];
    if (h.chans.length)  parts.push('channels: ' + h.chans.join(', '));
    if (h.tables.length) parts.push('tables: ' + h.tables.join(', '));
    if (h.fns.length)    parts.push('functions: ' + h.fns.slice(0, 6).join(', '));
    console.log('  ' + h.file.padEnd(24) + (parts.join(' | ') || h.mentions + ' mentions'));
  });
  console.log('\nRead the strongest match before building anything.');
}


/* ── who does what: the positions, read from the staff module ─────────
   The map drew the wires and the islands and said nothing about the people.
   A whole structure of positions was built this week — what each owns, what it
   answers to, what it may do and what work reaches it — and a reader of the
   diagram could not see any of it. Read from C9, the register that owns them. */
function positions(){
  const src = fs.readFileSync(path.join(DIR, 'ShopyLink_Action_C9_Staff.html'), 'utf8');
  const out = [];
  /* admin's grants are setOf(FNS.map(...)) — every grant there is — not a
     literal list, so a pattern that insisted on `[` skipped the one position
     that holds everything. Match the record, then read its grants either way. */
  const re2 = /\{id:'(\w+)',name:'([^']*)'([\s\S]{0,1100}?)perms:setOf\(([\s\S]{0,400}?)\)\}/g;
  let m;
  while ((m = re2.exec(src))) {
    const body = m[3];
    const rawG = m[4];
    const listed = /\[([^\]]*)\]/.exec(rawG);
    const grants = listed
      ? listed[1].replace(/'/g, '').split(',').map(x => x.trim()).filter(Boolean)
      : ['(every grant)'];
    const grab = k => { const g = new RegExp(k + ":'((?:[^'\\\\]|\\\\.)*)'").exec(body); return g ? g[1] : ''; };
    const lvl = /level:(\d)/.exec(body);
    const duties = /duties:\[([^\]]*)\]/.exec(body);
    out.push({
      id: m[1], name: m[2],
      level: lvl ? Number(lvl[1]) : null,
      reportsTo: grab('sup') || (/sup:null/.test(body) ? '—' : ''),
      duties: duties ? duties[1].replace(/'/g, '').split(',').filter(Boolean) : [],
      dutyEn: grab('dutyEn'),
      grants: grants
    });
  }
  return out;
}

module.exports = { scan, uniq, find, positions };

if (require.main === module) {
  if (process.argv[2] === 'find') { find(process.argv[3]); process.exit(0); }
  const s = scan();
  console.log(s.mods.length + ' modules with wiring');
  console.log(Object.keys(s.channels).length + ' channels');
  console.log(Object.keys(s.events).length + ' event types');
  console.log('\n' + s.split.length + ' tables of the SAME NAME in two or more modules, with no channel between them:');
  s.split.forEach(i => console.log('  ' + i.list.padEnd(16) + i.modules.join(', ')));
  if (s.twinned.length) {
    console.log('\n' + s.twinned.length + ' table names held in TWO OR MORE modules with no channel joining them:');
    s.twinned.forEach(i => console.log('  ' + i.list.padEnd(16) + i.modules.join(', ') + (i.bridged ? '   [translated, not copied]' : '')));
  }
  console.log('\n' + s.alone.length + ' tables held in one module and shared with nobody:');
  console.log('  ' + s.alone.map(i => i.list + ' (' + i.module + ')').join(' · '));
  Object.keys(s.channels).sort().forEach(c => {
    const x = s.channels[c];
    console.log('  ' + c.padEnd(22) + ' owner: ' + (x.owners.join(', ') || '— NOBODY —') + '  · readers: ' + x.readers.length);
  });
}
