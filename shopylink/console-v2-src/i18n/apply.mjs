/* Arabic, finished — without touching one template.
   Every module already owns a dictionary and a t(); what stayed English is the
   text that was written straight into markup, never passed through t(). Rather
   than rewriting those templates one by one — the way a quoted attribute was
   broken once already — each module is given a SWEEP: a small pass that runs
   after its own setLang and after every re-render, and translates the text it
   meets using the module's own dictionary first, then the shared glossary the
   package's own vocabulary was harvested into.
   It reads; it never invents. A string with no entry is left exactly as it is,
   so nothing can be silently mistranslated, and English returns untouched when
   the language does. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const W = '/home/claude/work';
const G = JSON.parse(readFileSync('/home/claude/i18n/glossary.json', 'utf8'));
const files = JSON.parse(process.env.SERVICES).map(s => s.file);

const BLOCK = (dictName) => `
<script>
/* ── SL Arabic sweep ─────────────────────────────────────────────────────
   Added so the Arabic build is Arabic all the way down. Text that never went
   through t() is translated here from ${dictName || 'the shared glossary'} plus
   SL_GLOSS below; anything without an entry is left untouched, and machine
   values — codes, money, units, dates — are skipped by rule, not by luck. */
(function () {
  var EXACT = ${JSON.stringify(G.exact)};
  var FRAG = ${JSON.stringify(G.fragments)};
  var own = (typeof ${dictName || 'undefined'} !== 'undefined') ? ${dictName || 'null'} : null;
  /* the module's own dictionary always wins: it is the vocabulary its authors chose */
  if (own) for (var k in own) if (!EXACT[k]) EXACT[k] = own[k];

  var SKIP = /^[\\s\\d.,:%×\\/+\\-–—·|()\\[\\]]*$/;              /* pure machine value */
  var CODE = /^[A-Z]{2,5}[-–][A-Z0-9-]+$/;                      /* SL-9701, TRP-8842 */
  var ARABIC = /[\\u0600-\\u06FF]/;
  var busy = false;

  function phrase(s) {
    var t = s.trim();
    /* an address, a link or a filename is not prose: translating a word inside
       one breaks the thing it points at, so they are left exactly as written */
    if (!t || SKIP.test(t) || CODE.test(t) || ARABIC.test(t)) return null;
    if (/@|https?:|www\.|\.(com|net|org|ae|html|js|css)\b/i.test(t)) return null;
    if (EXACT[t]) return s.replace(t, EXACT[t]);
    /* a composed line — "3 shipments · 16 cartons" — keeps its figures and
       proper names and takes Arabic only where the glossary knows the word */
    var out = t, hit = false;
    for (var f in FRAG) {
      var re = new RegExp('(^|[^A-Za-z])' + f.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + '(?![A-Za-z])', 'g');
      if (re.test(out)) { out = out.replace(re, function (m, p) { return p + FRAG[f]; }); hit = true; }
    }
    return hit ? s.replace(t, out) : null;
  }

  function sweep() {
    if (busy) return;
    var lang = document.documentElement.getAttribute('lang');
    if (lang !== 'ar') return;
    busy = true;
    try {
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) {
        var p = n.parentNode;
        if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.nodeName === 'TEXTAREA') continue;
        var v = phrase(n.nodeValue || '');
        if (v !== null) n.nodeValue = v;
      }
      var els = document.querySelectorAll('[placeholder],[aria-label],[title]');
      for (var i = 0; i < els.length; i++) {
        var e = els[i];
        ['placeholder', 'aria-label', 'title'].forEach(function (a) {
          var raw = e.getAttribute(a);
          if (!raw) return;
          var t2 = phrase(raw);
          if (t2 !== null) e.setAttribute(a, t2);
        });
      }
    } finally { busy = false; }
  }

  /* after the module's own language switch, and after every re-render it does */
  if (typeof window.setLang === 'function') {
    var prev = window.setLang;
    window.setLang = function (l) { prev(l); setTimeout(sweep, 0); };
  }
  var obs = new MutationObserver(function () { if (!busy) setTimeout(sweep, 0); });
  /* a module with no language switch of its own — the VGM certificate — is told
     which language it is in by whoever shows it, so the sweep watches for that */
  var langObs = new MutationObserver(function () { setTimeout(sweep, 0); });
  function start() {
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    langObs.observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
    sweep();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>
`;

let done = 0;
for (const f of files) {
  const p = join(W, f);
  let s = readFileSync(p, 'utf8');
  if (s.indexOf('SL Arabic sweep') > -1) {
    /* the sweep is no longer the last thing before </body> — the focus repair
       sits there too — so the old block is found by its own boundaries, not by
       what follows it. Anchoring on </body> silently left the old block in
       place and added a second one. */
    s = s.replace(/\n<script>\n\/\* ── SL Arabic sweep[\s\S]*?<\/script>\n/, '');
  }
  const dict = (s.match(/var\s+(T_[A-Za-z0-9_]+)\s*=\s*\{/) || [])[1] || '';
  const block = BLOCK(dict);
  const end = s.search(/<\/body\s*>/i);
  s = end > -1 ? s.slice(0, end) + block + s.slice(end) : s + block;
  writeFileSync(p, s);
  done++;
  console.log('  swept ' + f.replace('ShopyLink_', '').replace('.html', '') + (dict ? ' (dictionary ' + dict + ')' : ' (glossary only)'));
}
console.log('\n' + done + ' modules given the Arabic sweep');
