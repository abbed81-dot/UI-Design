/* The wiring, read from the files rather than from memory: for every SL_*
   channel, which module WRITES it (owns it) and which modules READ it. A
   channel with two writers is two places one truth lives; a channel written
   and never read is a fact nobody acts on; one read and never written is a
   question with no owner. All three are reported. */
import { readdirSync, readFileSync } from 'node:fs';
const W = '/home/claude/work';
const files = readdirSync(W).filter(f => /^ShopyLink_.*\.html$/.test(f));
const chan = {};
for (const f of files) {
  const s = readFileSync(W + '/' + f, 'utf8');
  /* resolve `var SL_X = 'SL_Y_V1'` indirection, which a plain grep misses */
  const alias = {};
  for (const m of s.matchAll(/var\s+([A-Z_0-9]+)\s*=\s*['"](SL_[A-Z_0-9]+_V\d)['"]/g)) alias[m[1]] = m[2];
  const named = new Set([...s.matchAll(/['"](SL_[A-Z_0-9]+_V\d)['"]/g)].map(m => m[1]));
  for (const a of Object.values(alias)) named.add(a);
  for (const key of named) {
    const ids = [key, ...Object.keys(alias).filter(k => alias[k] === key)];
    const readRe = new RegExp('getItem\\s*\\(\\s*(?:' + ids.map(i => i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + "|['\"]" + key + "['\"])", 'g');
    const writeRe = new RegExp('setItem\\s*\\(\\s*(?:' + ids.map(i => i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + "|['\"]" + key + "['\"])", 'g');
    const reads = (s.match(readRe) || []).length;
    const writes = (s.match(writeRe) || []).length;
    if (!reads && !writes) continue;
    chan[key] = chan[key] || { readers: [], writers: [] };
    if (writes) chan[key].writers.push(f.replace('ShopyLink_', '').replace('.html', ''));
    if (reads) chan[key].readers.push(f.replace('ShopyLink_', '').replace('.html', ''));
  }
}
const keys = Object.keys(chan).sort();
console.log('channel                 owner (writes)                 readers');
console.log('------------------------+------------------------------+--------------------------------');
const findings = [];
for (const k of keys) {
  const c = chan[k];
  const w = c.writers.join(', ') || '— nobody';
  const r = c.readers.filter(x => !c.writers.includes(x));
  console.log(k.padEnd(24) + w.slice(0, 30).padEnd(31) + (r.join(', ').slice(0, 60) || '— nobody'));
  if (c.writers.length > 1) findings.push(`${k}: ${c.writers.length} writers (${c.writers.join(', ')}) — one truth, two places`);
  if (c.writers.length === 0) findings.push(`${k}: read by ${c.readers.join(', ')} but written by nobody`);
  if (c.readers.length === 0) findings.push(`${k}: written by ${c.writers.join(', ')} and read by nobody`);
}
console.log('\n' + keys.length + ' channels');
if (findings.length) { console.log('\nFINDINGS:'); findings.forEach(f => console.log('  · ' + f)); }
else console.log('\nno structural findings: every channel has exactly one owner and at least one reader');
