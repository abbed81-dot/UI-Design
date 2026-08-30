import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Search, PanelLeftClose, PanelLeftOpen, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Mark } from '@/components/Mark';
import { CATEGORIES, type Item } from '@/lib/modules';
import { CH, Reader, type Approval, type Country, type LogEvent, type Notice, type Person, type Shipment, type Trip } from '@/lib/channels';
import { indexActors, lateLabel, needsAction, reportsOf, resolveScope, workOf, type Hub, type Row } from '@/lib/derive';
import { seedApprovals, seedEvents, seedHubs, seedMe, seedNotices, seedShips, seedTrips } from '@/lib/seed';

/* ── reading the channels ─────────────────────────────────────────────
   Read on mount AND on every storage event. A reader that answers from a
   snapshot taken before the answer existed is a fault this project has made
   three times; the listener is the fix, not a nicety. */
function useChannels() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener('storage', bump);
    return () => window.removeEventListener('storage', bump);
  }, []);

  return useMemo(() => {
    const r = new Reader();
    const staff = r.list<Person>(CH.staff, 'staff');
    const ships = r.list<Shipment>(CH.shipments, 'shipments');
    const trips = r.list<Trip>(CH.trips, 'trips');
    const notices = r.list<Notice>(CH.notices, 'notices');
    const approvals = r.list<Approval>(CH.approvals, 'approvals');
    const events = r.list<LogEvent>(CH.events, 'events');
    const hubs = r.list<Hub>(CH.hubs, 'hubs');
    const countries = r.list<Country>(CH.countries, 'countries');
    /* live = a register answered. Everything else on this page is a
       demonstration day, and the page must say which one it is drawing. */
    const live = !!ships;
    return {
      live,
      faults: r.faults,
      blocked: r.blocked,
      staff,
      ships: ships ?? seedShips,
      trips: trips ?? seedTrips,
      notices: notices ?? seedNotices,
      approvals: approvals ?? seedApprovals,
      events: events ?? seedEvents,
      hubs: hubs ?? seedHubs,
      countries: countries ?? [],
      me: staff?.[0] ?? seedMe,
    };
  }, [tick]);
}

const PAGE = 25;

export default function App() {
  const [ar, setAr] = useState(true);
  const [rail, setRail] = useState(false);
  const [thread, setThread] = useState<Row | null>(null);
  const [finder, setFinder] = useState(false);
  const [page, setPage] = useState(0);
  const [refused, setRefused] = useState<string | null>(null);
  /* WHO is viewing. Nothing publishes the signed-in person — the shell keeps it
     in memory — so the console asks, which is what signing in is in this
     prototype: choosing a person from a list. It is held in React state and
     written to no channel. */
  const [whoId, setWhoId] = useState<string | null>(null);
  const ch = useChannels();
  const now = Date.now();

  useEffect(() => {
    document.documentElement.setAttribute('dir', ar ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', ar ? 'ar' : 'en');
  }, [ar]);

  /* ⌘K over everything: a search you must aim at is one you stop using */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && 'k' === e.key.toLowerCase()) {
        e.preventDefault();
        setFinder((v) => !v);
      }
      if (e.key === 'Escape') {
        setFinder(false);
        setThread(null);
        setRefused(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const me = useMemo(
    () => (whoId && ch.staff ? (ch.staff.filter((p) => p.id === whoId)[0] ?? ch.me) : ch.me),
    [whoId, ch.staff, ch.me],
  );
  const scope = useMemo(() => resolveScope(me, ch.hubs, ch.countries), [me, ch.hubs, ch.countries]);
  const team = useMemo(() => reportsOf(me, ch.staff ?? []), [me, ch.staff]);
  const actors = useMemo(() => indexActors(ch.staff ?? [], ch.events), [ch.staff, ch.events]);
  const teamWork = useMemo(() => workOf(team, ch.events, ch.ships, now), [team, ch.events, ch.ships, now]);
  const rows = useMemo(
    () => needsAction(ch.ships, ch.trips, ch.approvals, me, scope, now),
    [ch.ships, ch.trips, ch.approvals, me, scope, now],
  );

  const t = (a: string, e: string) => (ar ? a : e);

  /* Permission is checked at the ACT, not only on the button. A dimmed control
     is for clarity; the refusal happens here. */
  const mayOpen = useCallback(
    (item: Item) => !item.perm || !ch.live || (me?.perms || []).indexOf(item.perm) > -1,
    [ch.live, me],
  );
  const openModule = useCallback(
    (item: Item) => {
      if (!mayOpen(item)) {
        setRefused((ar ? 'لا تملك صلاحية فتح ' : 'You hold no grant for ') + (ar ? item.ar : item.en));
        return;
      }
      window.open(item.file, '_blank', 'noopener');
    },
    [mayOpen, ar],
  );
  const openFile = useCallback((file: string) => {
    window.open(file, '_blank', 'noopener');
  }, []);

  const figures = useMemo(() => {
    const s = ch.ships;
    const moving = ['consolidated', 'loaded', 'departed', 'arrived', 'cleared', 'assigned'];
    return [
      { ar: 'مستلَمة', en: 'Taken in', n: s.filter((x) => x.stage === 'received').length },
      { ar: 'في الطريق', en: 'On the way', n: s.filter((x) => moving.indexOf(x.stage) > -1).length },
      { ar: 'أخفقت مرّتين', en: 'Failed twice', n: s.filter((x) => x.attempts >= 2).length },
      { ar: 'رحلات جارية', en: 'Trips running', n: ch.trips.filter((x) => x.stage === 'departed').length },
    ];
  }, [ch.ships, ch.trips]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--cream)' }}>
      <aside
        style={{
          width: rail ? 'var(--rail-w)' : 'var(--sb-w)',
          flex: '0 0 auto',
          background: 'var(--ink)',
          color: 'var(--paper)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width .16s ease',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', padding: 'var(--s3)' }}>
          <Mark size={24} />
          {!rail && <span style={{ fontSize: 'var(--fs-lead)', fontWeight: 800, letterSpacing: '-.01em' }}>shopylink</span>}
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 var(--s2)' }}>
          {CATEGORIES.map((c) => (
            <div key={c.id} style={{ marginBottom: 'var(--s3)' }}>
              <div
                title={ar ? c.ar : c.en}
                data-i={(ar ? c.ar : c.en).slice(0, 1)}
                style={{
                  fontSize: 'var(--fs-eyebrow)', textTransform: 'uppercase', letterSpacing: '.09em',
                  color: 'var(--n4)', padding: '0 var(--s2)', height: 'var(--row-h)',
                  display: 'flex', alignItems: 'center', fontWeight: 700,
                }}
              >
                {rail ? (ar ? c.ar : c.en).slice(0, 1) : ar ? c.ar : c.en}
              </div>
              {!rail &&
                c.items.map((it) => (
                  <button
                    key={it.file}
                    onClick={() => openModule(it)}
                    title={ar ? it.ar : it.en}
                    style={{
                      display: 'block', width: '100%', textAlign: ar ? 'right' : 'left',
                      height: 'var(--row-h)', padding: '0 var(--s2)', borderRadius: 'var(--radius-ctl)',
                      fontSize: 'var(--fs-hint)', color: mayOpen(it) ? 'var(--n2)' : 'var(--n5)',
                    }}
                  >
                    {ar ? it.ar : it.en}
                  </button>
                ))}
            </div>
          ))}

          <button
            onClick={() => setFinder(true)}
            title={ar ? 'بحث' : 'Search'}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--s2)', width: '100%',
              height: 'var(--row-h)', padding: '0 var(--s2)', borderRadius: 'var(--radius-ctl)',
              fontSize: 'var(--fs-hint)', color: 'var(--n2)', fontWeight: 700,
            }}
          >
            <Search size={14} />
            {!rail && <span>{ar ? 'بحث' : 'Search'}</span>}
            {!rail && <kbd className="machine" style={{ fontSize: 10, color: 'var(--n5)' }}>⌘K</kbd>}
          </button>
        </nav>

        <button
          onClick={() => setRail((v) => !v)}
          title={ar ? 'طيّ الشريط' : 'Collapse the sidebar'}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s2)', height: 'var(--tl-h)',
            padding: '0 var(--s3)', color: 'var(--n4)', fontSize: 'var(--fs-hint)',
          }}
        >
          {rail ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          {!rail && <span>{ar ? 'طيّ' : 'Collapse'}</span>}
        </button>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            height: 'var(--tl-h)', display: 'flex', alignItems: 'center', gap: 'var(--s3)',
            padding: '0 var(--s4)', background: 'var(--paper)', borderBottom: '1px solid var(--n3)',
          }}
        >
          <button
            onClick={() => setFinder(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--s2)', height: 30, minWidth: 240,
              padding: '0 var(--s3)', border: '1.5px solid var(--n3)', borderRadius: 'var(--radius-ctl)',
              color: 'var(--n6)', fontSize: 'var(--fs-hint)',
            }}
          >
            <Search size={14} />
            <span style={{ flex: 1, textAlign: 'start' }}>{ar ? 'ابحث عن خدمة أو شحنة' : 'Find a service or a shipment'}</span>
            <kbd className="machine" style={{ fontSize: 10, color: 'var(--n5)' }}>⌘K</kbd>
          </button>
          <div style={{ flex: 1 }} />
          {!ch.live && (
            <span
              style={{
                background: 'var(--amber-tint)', color: 'var(--amber-deep)', padding: '4px 9px',
                borderRadius: 'var(--radius-pill)', fontSize: 'var(--fs-eyebrow)', fontWeight: 800,
              }}
            >
              {ar ? 'بيانات تجريبية' : 'DEMONSTRATION DATA'}
            </span>
          )}
          <button
            onClick={() => setAr((v) => !v)}
            style={{
              height: 30, padding: '0 var(--s3)', border: '1.5px solid var(--n3)',
              borderRadius: 'var(--radius-ctl)', fontSize: 'var(--fs-hint)', fontWeight: 700,
            }}
          >
            {ar ? 'EN' : 'ع'}
          </button>
          <div style={{ textAlign: ar ? 'left' : 'right' }}>
            {ch.staff && ch.staff.length > 1 ? (
              <select
                aria-label={ar ? 'من أنت' : 'Who is viewing'}
                title={ar ? 'من أنت' : 'Who is viewing'}
                value={me?.id}
                onChange={(e) => setWhoId(e.target.value)}
                style={{
                  fontSize: 'var(--fs-hint)', fontWeight: 700, background: 'transparent',
                  border: '1.5px solid var(--n3)', borderRadius: 'var(--radius-ctl)',
                  height: 30, padding: '0 var(--s2)', color: 'var(--ink)',
                }}
              >
                {ch.staff.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role} L{p.level}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: 'var(--fs-hint)', fontWeight: 700 }}>{me?.name}</div>
            )}
            <div className="machine" style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)' }}>
              {me?.role} · L{me?.level}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 'var(--s4)' }}>
          {(ch.faults.length > 0 || ch.blocked) && (
            <section
              role="alert"
              style={{
                display: 'flex', gap: 'var(--s2)', alignItems: 'flex-start', background: 'var(--red-tint)',
                color: 'var(--red-deep)', border: '1px solid var(--red)', borderRadius: 'var(--radius-card)',
                padding: 'var(--s3)', marginBottom: 'var(--s4)', fontSize: 'var(--fs-hint)',
              }}
            >
              <AlertTriangle size={15} style={{ flex: '0 0 auto', marginTop: 2 }} />
              <div>
                <b>{ar ? 'قناة لم تُقرأ' : 'A channel could not be read'}</b>
                <div style={{ marginTop: 'var(--s1)' }}>
                  {ch.blocked
                    ? ar
                      ? 'التخزين محجوب في هذا المتصفح. الكونسول يرسم يوماً تجريبياً، ولا شيء ضاع.'
                      : 'Storage is blocked in this browser. The console draws a demonstration day; nothing is lost.'
                    : ar
                      ? 'ما يلي مَنشور بشكل لا تستطيع هذه الصفحة قراءته. مالكه ينشره، والكونسول لا يصلحه.'
                      : 'What follows was published in a shape this page cannot read. Its owner publishes it; the console does not repair it.'}
                </div>
                {ch.faults.map((f) => (
                  <div key={f.key} className="machine" style={{ marginTop: 'var(--s1)' }}>
                    {f.key} — {f.reason}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section style={{ marginBottom: 'var(--s4)' }}>
            <h2 style={{ fontSize: 'var(--fs-title)', fontWeight: 800, margin: '0 0 var(--s3)' }}>
              {ar ? 'يحتاج إجراء' : 'Needs action'}{' '}
              <span className="machine" style={{ color: 'var(--n6)' }}>{rows.length}</span>
            </h2>
            <div style={{ background: 'var(--paper)', border: '1px solid var(--n3)', borderRadius: 'var(--radius-card)' }}>
              {shown.length === 0 && (
                <div style={{ padding: 'var(--s4)', color: 'var(--n6)', fontSize: 'var(--fs-hint)' }}>
                  {ar ? 'لا شيء متأخّر — وهذا هو المقصود.' : 'Nothing is overdue — which is the point.'}
                </div>
              )}
              {shown.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--s3)', padding: 'var(--s2) var(--s3)',
                    borderTop: '1px solid var(--n2)', minHeight: 'var(--row-h)',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 'var(--fs-body)' }}>{ar ? r.ar : r.en}</span>
                  <span className="machine" style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)' }}>{r.ref}</span>
                  <span
                    style={{
                      fontSize: 'var(--fs-eyebrow)', fontWeight: 800, color: 'var(--red-deep)',
                      background: 'var(--red-tint)', padding: '3px 8px', borderRadius: 'var(--radius-pill)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {lateLabel(r.lateMs, ar)}
                  </span>
                  <button
                    onClick={() => setThread(r)}
                    title={ar ? 'المحادثة' : 'Thread'}
                    aria-label={ar ? 'المحادثة' : 'Thread'}
                    style={{ color: 'var(--n6)' }}
                  >
                    <MessageSquare size={14} />
                  </button>
                  <button
                    onClick={() => openFile(r.open)}
                    style={{
                      height: 26, padding: '0 var(--s3)', background: 'var(--sky)', color: '#fff',
                      borderRadius: 'var(--radius-ctl)', fontSize: 'var(--fs-hint)', fontWeight: 700,
                    }}
                  >
                    {ar ? 'افتح' : 'Open'}
                  </button>
                </div>
              ))}
              {rows.length > PAGE && (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--s2) var(--s3)', borderTop: '1px solid var(--n2)',
                    fontSize: 'var(--fs-hint)', color: 'var(--n6)',
                  }}
                >
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} title={ar ? 'السابق' : 'Previous'}>
                    {ar ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                  </button>
                  <span className="machine">
                    {page * PAGE + 1}–{Math.min(rows.length, (page + 1) * PAGE)} / {rows.length}
                  </span>
                  <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} title={ar ? 'التالي' : 'Next'}>
                    {ar ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
                  </button>
                </div>
              )}
            </div>
          </section>

          <section style={{ marginBottom: 'var(--s4)' }}>
            {ch.notices.map((nt, i) => (
              <div
                key={nt.id || i}
                style={{
                  background: 'var(--paper)', border: '1px solid var(--n3)',
                  borderInlineStart: '3px solid var(--sky)', borderRadius: 'var(--radius-card)', padding: 'var(--s3)',
                }}
              >
                <div className="machine" style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--sky-deep)', fontWeight: 800 }}>
                  {nt.kind}
                </div>
                <div style={{ margin: 'var(--s1) 0', fontSize: 'var(--fs-body)' }}>{ar ? nt.ar : nt.en}</div>
                <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)' }}>
                  {nt.by} · <span className="machine">{nt.at}</span>
                </div>
              </div>
            ))}
          </section>

          {team.length > 0 && (
            <section style={{ marginBottom: 'var(--s4)' }}>
              <h2 style={{ fontSize: 'var(--fs-title)', fontWeight: 800, margin: '0 0 var(--s1)' }}>
                {ar ? 'مركزه وفريقه' : 'His centre and his people'}
              </h2>
              <div style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)', marginBottom: 'var(--s3)' }}>
                {scope.kind === 'unknown' ? (
                  <span style={{ color: 'var(--amber-deep)' }}>
                    {ar
                      ? 'سجل الموظفين لم ينشر نطاقاً لهذا الشخص — فلا يمكن قول أي مركز له.'
                      : 'The staff register has published no scope for this person, so no hub can be named.'}
                  </span>
                ) : scope.hubs.length === 0 ? (
                  ar ? 'نطاقه لا يطابق أي مركز منشور.' : 'His scope matches no published hub.'
                ) : (
                  <>
                    {scope.kind === 'all'
                      ? ar ? 'كل المراكز' : 'Every hub'
                      : scope.kind === 'country'
                        ? (ar ? 'مراكز ' : 'The hubs of ') +
                          scope.hubs
                            .map((h) => h.country)
                            .filter((c, i, a) => a.indexOf(c) === i)
                            /* the countries register owns the Arabic name; inventing
                               one here would be a second answer to its question */
                            .map((c) => countryName(c, ch.countries, ar))
                            .join(ar ? '، ' : ', ')
                        : ar ? 'مركزه' : 'His centre'}
                    {' · '}
                    <span className="machine">{scope.hubs.map((h) => h.id).join(' · ')}</span>
                  </>
                )}
              </div>

              <div style={{ background: 'var(--paper)', border: '1px solid var(--n3)', borderRadius: 'var(--radius-card)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-hint)' }}>
                  <thead>
                    <tr style={{ color: 'var(--n6)', fontSize: 'var(--fs-eyebrow)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                      <th style={{ textAlign: ar ? 'right' : 'left', padding: 'var(--s2) var(--s3)' }}>{ar ? 'الموظف' : 'Person'}</th>
                      <th style={{ textAlign: ar ? 'right' : 'left', padding: 'var(--s2) var(--s3)' }}>{ar ? 'عمله' : 'What he does'}</th>
                      <th style={{ textAlign: 'end', padding: 'var(--s2) var(--s3)' }}>{ar ? 'أنجز' : 'Finished'}</th>
                      <th style={{ textAlign: 'end', padding: 'var(--s2) var(--s3)' }}>{ar ? 'متوقّف' : 'Stopped'}</th>
                      <th style={{ textAlign: 'end', padding: 'var(--s2) var(--s3)' }}>{ar ? 'يحتاج فعلاً' : 'Needs action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamWork.map((w) => (
                      <tr key={w.person.id} style={{ borderTop: '1px solid var(--n2)' }}>
                        <td style={{ padding: 'var(--s2) var(--s3)' }}>
                          {w.person.name}
                          {w.person.onLeave && (
                            <span style={{ color: 'var(--amber-deep)', marginInlineStart: 6 }}>{ar ? '· في إجازة' : '· on leave'}</span>
                          )}
                        </td>
                        <td style={{ padding: 'var(--s2) var(--s3)', color: 'var(--n6)' }}>
                          {(ar ? w.person.dutyAr : w.person.dutyEn) || (w.person.duties || []).join(' · ') || (
                            <i>{ar ? 'لا يصله عمل — يقرأ ويبلّغ' : 'receives no work — reads and reports'}</i>
                          )}
                        </td>
                        <td className="machine" style={{ textAlign: 'end', padding: 'var(--s2) var(--s3)', color: 'var(--green-deep)', fontWeight: 700 }}>{w.finished}</td>
                        <td className="machine" style={{ textAlign: 'end', padding: 'var(--s2) var(--s3)', color: w.stopped ? 'var(--red-deep)' : 'var(--n5)', fontWeight: 700 }}>{w.stopped}</td>
                        <td className="machine" style={{ textAlign: 'end', padding: 'var(--s2) var(--s3)', color: w.needsAction ? 'var(--amber-deep)' : 'var(--n5)', fontWeight: 700 }}>{w.needsAction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {actors.unknown.length > 0 && (
                <div style={{ marginTop: 'var(--s2)', fontSize: 'var(--fs-hint)', color: 'var(--amber-deep)' }}>
                  {ar ? 'عمل باسم لا يعرفه السجل: ' : 'Work declared by a name the register does not hold: '}
                  <span className="machine">{actors.unknown.join(' · ')}</span>
                </div>
              )}
            </section>
          )}

          <section>
            <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap' }}>
              {figures.map((f) => (
                <div
                  key={f.en}
                  style={{
                    flex: '1 1 150px', background: 'var(--paper)', border: '1px solid var(--n3)',
                    borderRadius: 'var(--radius-card)', padding: 'var(--s3)',
                  }}
                >
                  <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>
                    {ar ? f.ar : f.en}
                  </div>
                  <div className="machine" style={{ fontSize: 'var(--fs-figure)', fontWeight: 800, lineHeight: 1.15 }}>{f.n}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {thread && (
        <aside
          style={{
            width: 'var(--panel-w)', flex: '0 0 auto', background: 'var(--paper)',
            borderInlineStart: '1px solid var(--n3)', padding: 'var(--s4)', overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
            <b style={{ flex: 1, fontSize: 'var(--fs-lead)' }}>{ar ? thread.ar : thread.en}</b>
            <button onClick={() => setThread(null)} title={ar ? 'إغلاق' : 'Close'} style={{ color: 'var(--n6)' }}>✕</button>
          </div>
          <div className="machine" style={{ color: 'var(--n6)', fontSize: 'var(--fs-hint)', marginTop: 'var(--s1)' }}>{thread.ref}</div>
          <p style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)', marginTop: 'var(--s3)' }}>
            {ar
              ? 'المحادثة تُكتب في الوحدة التي تملك العمل، لا هنا — الكونسول نافذة، وليس مكاناً ثانياً تُحفظ فيه الحقيقة.'
              : 'The thread is written in the module that owns the work, not here — the console is a window, not a second place the truth lives.'}
          </p>
          <button
            onClick={() => openFile(thread.open)}
            style={{
              marginTop: 'var(--s3)', height: 30, padding: '0 var(--s3)', background: 'var(--sky)',
              color: '#fff', borderRadius: 'var(--radius-ctl)', fontSize: 'var(--fs-hint)', fontWeight: 700,
            }}
          >
            {ar ? 'افتح الوحدة' : 'Open the module'}
          </button>
        </aside>
      )}

      {finder && <Finder ar={ar} onClose={() => setFinder(false)} onPick={openModule} mayOpen={mayOpen} />}

      {refused && (
        <div
          role="alert"
          style={{
            position: 'fixed', insetInlineStart: '50%', bottom: 'var(--s4)', transform: 'translateX(-50%)',
            background: 'var(--red-tint)', color: 'var(--red-deep)', border: '1px solid var(--red)',
            borderRadius: 'var(--radius-ctl)', padding: 'var(--s2) var(--s3)', fontSize: 'var(--fs-hint)', fontWeight: 700,
          }}
        >
          {refused}
        </div>
      )}
    </div>
  );
}

/* One name, from the register that owns it. A country the register does not
   carry keeps the name the hub gave it rather than being blanked. */
function countryName(c: string | undefined, countries: Country[], ar: boolean): string {
  if (!c) return '';
  const hit = countries.filter((x) => x.en === c || x.ar === c || x.iso === c || x.id === c)[0];
  if (!hit) return c;
  return (ar ? hit.ar : hit.en) || c;
}

function Finder({
  ar, onClose, onPick, mayOpen,
}: { ar: boolean; onClose: () => void; onPick: (i: Item) => void; mayOpen: (i: Item) => boolean }) {
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  const hits = CATEGORIES.flatMap((c) => c.items).filter(
    (i) => (i.ar + ' ' + i.en + ' ' + i.file).toLowerCase().indexOf(q.toLowerCase()) > -1,
  );
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(11,42,59,.32)', display: 'flex',
        alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 92vw)', background: 'var(--paper)', borderRadius: 'var(--radius-card)',
          border: '1px solid var(--n3)', overflow: 'hidden',
        }}
      >
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ar ? 'ابحث عن خدمة أو شحنة' : 'Find a service or a shipment'}
          style={{ width: '100%', height: 42, padding: '0 var(--s3)', fontSize: 'var(--fs-body)', borderBottom: '1px solid var(--n2)' }}
        />
        <div style={{ maxHeight: '46vh', overflowY: 'auto' }}>
          {hits.map((i) => (
            <button
              key={i.file}
              onClick={() => {
                onPick(i);
                onClose();
              }}
              style={{
                display: 'block', width: '100%', textAlign: ar ? 'right' : 'left',
                padding: 'var(--s2) var(--s3)', fontSize: 'var(--fs-hint)',
                color: mayOpen(i) ? 'var(--ink)' : 'var(--n5)',
              }}
            >
              {ar ? i.ar : i.en}
            </button>
          ))}
          {hits.length === 0 && (
            <div style={{ padding: 'var(--s4)', color: 'var(--n6)', fontSize: 'var(--fs-hint)' }}>
              {ar ? 'لا شيء بهذا الاسم.' : 'Nothing by that name.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
