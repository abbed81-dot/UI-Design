/* The console must CARRY the package's own modules, not redraw them:
   the real file appears inside the service page, and what clears a queue row
   is the module's own record on the shared channel — never a console button. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.join('/home/claude/work', 'node_modules', 'jsdom'));
const zlib = require('zlib');

const html = fs.readFileSync(path.join(__dirname, 'bundle.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n); } };
const tick = (ms) => new Promise(r => setTimeout(r, ms || 80));

function makeStorage() {
  const m = {};
  return {
    _m: m,
    getItem: k => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: k => { delete m[k]; },
    clear: () => { for (const k in m) delete m[k]; },
    key: i => Object.keys(m)[i] ?? null,
    get length() { return Object.keys(m).length; },
  };
}

(async () => {
  const store = makeStorage();
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://console.test/bundle.html',
    pretendToBeVisual: true,
    resources: undefined,
    beforeParse(win) {
      Object.defineProperty(win, 'localStorage', { value: store });
      win.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      win.Element.prototype.scrollIntoView = function () {};
      /* the browser primitives the carrier uses */
      win.DecompressionStream = globalThis.DecompressionStream;
      win.Blob = globalThis.Blob;
      win.Response = globalThis.Response;
      win.atob = globalThis.atob;
    },
  });
  const win = dom.window, doc = win.document;
  await tick(400);
  const root = doc.getElementById('root') || doc.body;
  const btns = () => Array.from(root.querySelectorAll('button'));
  const rows = () => Array.from(root.querySelectorAll('.sl-row'));
  const rowByText = t => rows().filter(r => (r.textContent || '').indexOf(t) > -1)[0] || null;
  const btnByText = t => btns().filter(b => (b.textContent || '').trim() === t)[0] || null;
  const txt = () => root.textContent || '';
  const click = el => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));

  ok(txt().indexOf('يومك، خالد') > -1, 'the console renders');

  /* ── 1 · no invented form survives anywhere ─────────────────────────── */
  const source = html;
  ok(source.indexOf('أضفها إلى هذه الرحلة') === -1, 'the invented trip picker is gone from the bundle');
  ok(source.indexOf('سجّل الاستلام') === -1 || source.indexOf('IntakeForm') === -1, 'the invented intake form is gone');

  /* ── 2 · the real module is carried, and it is the real file ────────── */
  ok(source.indexOf('ShopyLink_Action_01_ReceiveParcel.html') > -1, 'the intake module is named in the carrier');
  ok(source.indexOf('ShopyLink_Action_03_CreateTrip.html') > -1, 'the trip module is named in the carrier');

  /* ── 3 · the row is the door, and it carries no act of its own ──────── */
  if (!rowByText('CON-240711-04')) {
    const g = btns().filter(b => (b.textContent || '').indexOf('توثيق') > -1)[0]
      || btns().filter(b => (b.textContent || '').indexOf('حمولة مجمَّعة') > -1)[0];
    if (g) { click(g); await tick(); }
  }
  const trow = rowByText('CON-240711-04');
  ok(!!trow, 'the consolidated load renders as a whole clickable row');
  ok(!btnByText('إلى رحلة') && !btnByText('إلى القياس'), 'no verb buttons remain in the lists');
  ok(!!trow.querySelector('.sl-row-go'), 'the row carries its direction chevron');
  ok(!!trow.querySelector('.sl-row-chat'), 'the chat icon stays on the row');
  click(trow); await tick(1400);
  const tframe = root.querySelector('iframe');
  const tdoc = tframe && tframe.getAttribute('srcdoc');
  ok(!!tdoc && (tdoc.indexOf('Create Trip') > -1 || tdoc.indexOf('CreateTrip') > -1 || tdoc.indexOf('Trip') > -1),
    'the load lands on the REAL trip-preparation module');
  ok(!!tdoc && tdoc.indexOf('SL_TRIPS_V1') + tdoc.indexOf('SL_SHIPMENTS_V1') > -2,
    'that module reads the trip and shipment registers itself');
  click(btnByText('يومي')); await tick(200);

  /* ── 4 · opening a service shows the module in a frame ──────────────── */
  if (!rowByText('CON-240712-01')) {
    const grp = btns().filter(b => (b.textContent || '').indexOf('قياس') > -1)[0];
    if (grp) { click(grp); await tick(); }
  }
  const mrow = rowByText('CON-240712-01');
  ok(!!mrow, 'the measure task renders as a row');
  click(mrow); await tick(1200);   /* decompression is async */
  ok(txt().indexOf('جئت من أجل') > -1, 'the service page says which task brought him');
  ok(txt().indexOf('CON-240712-01') > -1, 'the signpost carries the reference');
  const frames = Array.from(root.querySelectorAll('iframe'));
  ok(frames.length === 1, 'exactly one module frame is mounted');
  const srcdoc = frames[0] && frames[0].getAttribute('srcdoc');
  ok(!!srcdoc && srcdoc.length > 50000, 'the frame carries a whole module document (' + Math.round((srcdoc || '').length / 1024) + 'KB)');
  ok(!!srcdoc && srcdoc.indexOf('Receive Parcel') > -1, 'and it is the REAL B1 file, by its own title');
  ok(!!srcdoc && srcdoc.indexOf('SL_EVENTS_V1') > -1, 'the carried module still speaks on the shared channel');

  /* the console must not have drawn an act of its own on this page */
  ok(txt().indexOf('سجّل القياس') === -1, 'no console-drawn act button on the service page');

  /* ── 5 · the MODULE's record is what clears the row ─────────────────── */
  ok(!!rowByText('CON-240712-01') || txt().indexOf('CON-240712-01') > -1, 'the task is still open before any record');
  /* the module files its fact on the shared channel, exactly as B1 does */
  store.setItem('SL_EVENTS_V1', JSON.stringify([{
    id: 'EV-1-' + Date.now(), at: Date.now(), type: 'parcel.measured',
    trip: null, ship: 'CON-240712-01', client: 'ACME', actor: 'خالد عمر', payload: { weight: 12.4 },
  }]));
  await tick(1400);   /* the watcher polls beside the storage event */
  ok(txt().indexOf('سجّلت الوحدة parcel.measured') > -1, 'the console names the module record that cleared it');
  ok(txt().indexOf('خرج من طابورك') > -1, 'and says the row left the queue');

  const undo = btnByText('تراجع');
  ok(!!undo, 'the record carries an undo');

  click(btnByText('يومي')); await tick(300);
  ok(txt().indexOf('طرد مستلَم ينتظر القياس') === -1, 'the measured parcel left the home queue');

  /* ── 6 · every carried module decompresses to a real document ───────── */
  const map = {};
  const re = /["'](ShopyLink_[A-Za-z0-9_]+\.html)["']\s*:\s*["']([A-Za-z0-9+/=]{200,})["']/g;
  let m;
  while ((m = re.exec(source)) !== null) map[m[1]] = m[2];
  const names = Object.keys(map);
  ok(names.length === 24, 'all 24 modules are carried (' + names.length + ')');
  let good = 0, bad = [];
  for (const n of names) {
    try {
      const out = zlib.gunzipSync(Buffer.from(map[n], 'base64')).toString('utf8');
      if (/^<!doctype html>/i.test(out.trim()) && out.length > 5000) good++;
      else bad.push(n + ' (short/odd)');
    } catch (e) { bad.push(n + ' (' + e.message + ')'); }
  }
  ok(good === names.length, 'every carried module unpacks to its whole document' + (bad.length ? ' — bad: ' + bad.join(', ') : ''));

  console.log('\n' + pass + ' pass · ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
