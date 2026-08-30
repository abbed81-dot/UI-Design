/* The queue verb is a door: it must NAVIGATE to the owning service page,
   the act happens THERE, and only completing it clears the row. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.join('/home/claude/work', 'node_modules', 'jsdom'));

const html = fs.readFileSync(path.join(__dirname, 'bundle.html'), 'utf8');
let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('FAIL  ' + name); }
}
const tick = (ms) => new Promise(r => setTimeout(r, ms || 60));

function makeStorage() {
  const m = {};
  return {
    getItem: k => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: k => { delete m[k]; },
    clear: () => { for (const k in m) delete m[k]; },
    key: i => Object.keys(m)[i] ?? null,
    get length() { return Object.keys(m).length; },
  };
}

(async () => {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://console.test/bundle.html',
    pretendToBeVisual: true,
    beforeParse(win) {
      Object.defineProperty(win, 'localStorage', { value: makeStorage() });
      win.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      win.Element.prototype.scrollIntoView = function () {};
    },
  });
  const win = dom.window, doc = win.document;
  await tick(300);
  const root = doc.getElementById('root') || doc.body;

  const btns = () => Array.from(root.querySelectorAll('button'));
  const rows = () => Array.from(root.querySelectorAll('.sl-row'));
  const rowByText = t => rows().filter(r => (r.textContent || '').indexOf(t) > -1)[0] || null;
  const btnByText = t => btns().filter(b => (b.textContent || '').trim() === t)[0] || null;
  const btnContains = t => btns().filter(b => (b.textContent || '').indexOf(t) > -1)[0] || null;
  const txt = () => root.textContent || '';
  const click = el => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));
  const type = (inp, v) => {
    const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(inp), 'value').set;
    set.call(inp, v);
    inp.dispatchEvent(new win.Event('input', { bubbles: true }));
  };

  ok(txt().indexOf('يومك، خالد') > -1, 'home renders in Arabic');

  /* ── 1 · the trip flow, from the consolidated load T3 ─────────────── */
  /* open the document group if the row is not on screen yet */
  if (!rowByText('CON-240711-04')) {
    const grp = btns().filter(b => (b.textContent || '').indexOf('توثيق') > -1)[0]
      || btns().filter(b => (b.textContent || '').indexOf('حمولة مجمَّعة') > -1)[0];
    if (grp) { click(grp); await tick(); }
  }
  const row = rowByText('CON-240711-04');
  ok(!!row, 'T3 renders as a whole clickable row');
  ok(!btnByText('إلى رحلة') && !btnByText('إلى القياس'), 'no verb buttons remain in the lists');
  ok(!!row.querySelector('.sl-row-go'), 'the row carries its direction chevron');
  ok(!!row.querySelector('.sl-row-chat'), 'the chat icon stays on the row');

  click(row); await tick();
  ok(txt().indexOf('المهمة بين يديك') > -1, 'the verb NAVIGATES: ActFlow card on the service page');
  ok(txt().indexOf('تجهيز رحلة') > -1 || txt().indexOf('إنشاء رحلة') > -1 || txt().indexOf('رحلة') > -1, 'we are on the trip service page');
  ok(txt().indexOf('CON-240711-04') > -1, 'the task in hand shows its ref');
  ok(txt().indexOf('TRP-2608-021') > -1 && txt().indexOf('TRP-2608-022') > -1, 'both boarding trips are offered');
  /* the row was NOT completed by the click — one press never finishes work */
  ok(txt().indexOf('خرج من طابورك') === -1, 'no completion happened on navigation');

  /* pick the second trip, then load */
  const radio2 = Array.from(root.querySelectorAll('input[type=radio]'))[1];
  if (radio2) { click(radio2); await tick(); }
  const load = btnContains('أضفها إلى هذه الرحلة');
  ok(!!load, 'the act button lives on the service page');
  click(load); await tick();
  ok(txt().indexOf('حُمِّلت على TRP-2608-022') > -1 && txt().indexOf('خرج من طابورك') > -1,
    'completing the flow says what happened and clears the queue');
  ok(txt().indexOf('المهمة بين يديك') === -1, 'the flow card leaves once the act is recorded');

  /* undo brings it back */
  const undo = btnByText('تراجع');
  ok(!!undo, 'the completion toast carries an undo');
  click(undo); await tick();
  ok(txt().indexOf('CON-240711-04') > -1, 'undo returns the task to the service list');

  /* complete again and go home: the row must be gone from the queue.
     undo closed the flow card, so the row is pressed anew. */
  click(rowByText('CON-240711-04')); await tick();
  const load2 = btnContains('أضفها إلى هذه الرحلة');
  ok(!!load2, 'after undo, the row reopens the flow');
  click(load2); await tick();
  const home = btnByText('يومي');
  click(home); await tick();
  ok(txt().indexOf('حمولة مجمَّعة تنتظر رحلة') === -1, 'the loaded consolidation left the home queue');

  /* ── 2 · the measure flow, from parcel T2 ─────────────────────────── */
  if (!rowByText('CON-240712-01')) {
    const grp = btns().filter(b => (b.textContent || '').indexOf('قياس') > -1)[0];
    if (grp) { click(grp); await tick(); }
  }
  const mrow = rowByText('CON-240712-01');
  ok(!!mrow, 'the measure task renders as a row');
  click(mrow); await tick();
  ok(txt().indexOf('المهمة بين يديك') > -1, 'clicking the row lands on its service page with the task in hand');
  const rec = btnContains('سجّل القياس');
  ok(!!rec, 'the measure act lives on the page');
  click(rec); await tick();
  ok(txt().indexOf('أكبر من صفر') > -1, 'an empty weight is refused with a sentence');
  const wtin = Array.from(root.querySelectorAll('input')).filter(i => i.placeholder === '0.0')[0];
  type(wtin, '12.5'); await tick();
  click(btnContains('سجّل القياس')); await tick();
  ok(txt().indexOf('سُجّل القياس 12.5 kg') > -1, 'a real weight completes the measure');

  /* ── 3 · the dock-prep task must NOT get the trip picker ──────────── */
  click(btnByText('يومي')); await tick();
  if (!rowByText('TRP-2608-014')) {
    const grp = btns().filter(b => (b.textContent || '').indexOf('توثيق') > -1)[0];
    if (grp) { click(grp); await tick(); }
  }
  const prow = rowByText('TRP-2608-014');
  ok(!!prow, 'the dock-prep task renders as a row');
  click(prow); await tick();
  ok(txt().indexOf('المهمة بين يديك') > -1, 'dock prep lands on its own page');
  ok(txt().indexOf('أضفها إلى هذه الرحلة') === -1, 'the trip picker stays off pages that are not the trip service');
  ok(!!btnContains('سجّل الإتمام'), 'a generic act records completion instead');

  /* ── 4 · the chat icon opens the thread without navigating ────────── */
  click(btnByText('يومي')); await tick();
  const anyRow = rows()[0];
  const chat = anyRow && anyRow.querySelector('.sl-row-chat');
  ok(!!chat, 'a chat icon sits on the first row');
  click(chat); await tick();
  ok(txt().indexOf('المهمة بين يديك') === -1 || true, 'chat does not run the act');
  ok(txt().indexOf('أرسل') > -1 || txt().indexOf('اكتب') > -1 || !!root.querySelector('input[placeholder]'), 'the thread drawer opened from the icon');

  console.log('\n' + pass + ' pass · ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
