import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, MessageSquare, Pin, PinOff, ChevronDown, PanelRightClose, PanelRightOpen,
  AlertTriangle, Inbox, Truck, MapPin, Wallet, Network, Settings2,
  ChevronRight, ChevronLeft, Send, X, CircleCheckBig, Megaphone, PackageCheck,
  Boxes, ClipboardList, Timer, CalendarDays,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { CATEGORIES } from '@/lib/modules';
import { LOCKUP_AR } from '@/lib/lockup_ar';
import { LOCKUP_EN } from '@/lib/lockup_en';
import { MARK_LIGHT } from '@/lib/mark';
import {
  dayTasks, dayFigures, dayMe, dayThreads, denseTasks, dayNews, dayTrail, dayDetails,
  dayStaff, weekIntake, weekMeasured, weekLate, GROUP_META, intakeToTask, nextRef, openTrips, type Task, type NewsItem, type Intake,
} from '@/lib/day';
import { readState, writeState, type SavedState } from '@/lib/store';

/* ─────────────────────────────────────────────────────────────────────
   ShopyLink operations console · v2.1 · screen one: the operator's home.
   Swiss structure at data-dense values; every colour, size and duration
   from tokens.css, which is the identity sheet verbatim.
   ───────────────────────────────────────────────────────────────────── */

type Lang = 'ar' | 'en';
type Preview = 'normal' | 'empty' | 'loading' | 'error' | 'dense';

const CAT_ICONS: Record<string, typeof Inbox> = {
  intake: Inbox, trips: Truck, destination: MapPin, money: Wallet, network: Network, admin: Settings2,
};
const KIND_ICONS: Record<Task['kind'], typeof Inbox> = {
  deliver: PackageCheck, measure: Boxes, document: ClipboardList, approve: CircleCheckBig,
};
const TONES = {
  red:   { fg: 'var(--red-deep)',   bg: 'var(--red-tint)',   dot: 'var(--red)' },
  amber: { fg: 'var(--amber-deep)', bg: 'var(--amber-tint)', dot: 'var(--amber)' },
  sky:   { fg: 'var(--sky-deep)',   bg: 'var(--sky-tint)',   dot: 'var(--sky)' },
  green: { fg: 'var(--green-deep)', bg: 'var(--green-tint)', dot: 'var(--green)' },
} as const;

function lateLabel(ms: number, ar: boolean): { text: string; tone: 'red' | 'amber' | 'green' } {
  const h = Math.round(Math.abs(ms) / 3600000);
  if (ms < 0) return { text: ar ? 'خلال ' + (h === 1 ? 'ساعة' : h === 2 ? 'ساعتين' : h + ' ساعات') : 'in ' + h + 'h', tone: 'green' };
  const p = (n: number, one: string, two: string, few: string, many: string) =>
    n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? n + ' ' + few : n + ' ' + many;
  if (h < 24) return { text: ar ? 'متأخّر ' + p(h, 'ساعة', 'ساعتين', 'ساعات', 'ساعة') : h + 'h late', tone: h >= 6 ? 'red' : 'amber' };
  const d = Math.floor(h / 24);
  return { text: ar ? 'متأخّر ' + p(d, 'يومًا', 'يومين', 'أيام', 'يومًا') : d + 'd late', tone: 'red' };
}

/* the artifact context has no module files beside it — a dead link is worse
   than an honest sentence, so module-opening degrades to an explanation */
const HAS_MODULES = typeof (window as { claude?: unknown }).claude === 'undefined';

export default function App() {
  const saved = useMemo<SavedState>(() => readState(), []);
  const [lang, setLang] = useState<Lang>(saved.lang ?? 'ar');
  const [rail, setRail] = useState<boolean>(saved.rail ?? false);
  const [pinned, setPinned] = useState<string[]>(saved.pinned ?? []);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ deliver: true });
  const [drawer, setDrawer] = useState<{ task: Task; tab: 'info' | 'chat' } | null>(null);
  const [listDrawer, setListDrawer] = useState<{ title: string; tasks: Task[] } | null>(null);
  const [finder, setFinder] = useState(false);
  const [preview, setPreview] = useState<Preview>('normal');
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [news, setNews] = useState(0);
  /* where the person is: his day, or one service — the whole experience stays
     inside the console, in one language, and the ONLY bridge between the two
     experiences is the language toggle */
  const [view, setView] = useState<{ t: 'home' } | { t: 'svc'; file: string; focus?: Task }>({ t: 'home' });
  const [intakes, setIntakes] = useState<Intake[]>(saved.intakes ?? []);
  const ar = lang === 'ar';

  useEffect(() => {
    document.documentElement.setAttribute('dir', ar ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [ar, lang]);

  useEffect(() => { writeState({ lang, pinned, rail, whoId: dayMe.id, intakes }); }, [lang, pinned, rail, intakes]);

  useEffect(() => {
    if (!toast) return; const t = setTimeout(() => setToast(null), 5000); return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setFinder(v => !v); }
      if (e.key === 'Escape') { setFinder(false); setDrawer(null); setListDrawer(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const t = useCallback((a: string, e: string) => (ar ? a : e), [ar]);

  const togglePin = useCallback((file: string) => {
    setPinned(prev => {
      if (prev.indexOf(file) > -1) return prev.filter(f => f !== file);
      const next = [...prev, file];
      if (next.length > 5) { next.shift(); setToast({ text: ar ? 'خمسة حدّ التثبيت — استُبدل الأقدم' : 'Five is the pin limit — the oldest was replaced' }); }
      return next;
    });
  }, [ar]);

  const registerIntake = useCallback((f: Omit<Intake, 'ref' | 'at'>) => {
    const ref = nextRef(intakes.map(i => i.ref).concat(dayTasks.map(x => x.ref)));
    setIntakes(list => [{ ...f, ref, at: Date.now() }, ...list]);
    setToast({ text: t('سُجّل الاستلام — ', 'Intake recorded — ') + ref + t(' وينتظر القياس في طابورك', ' and awaits measuring on your queue') });
    return ref;
  }, [intakes, t]);

  const openService = useCallback((file: string) => {
    setView({ t: 'svc', file });
    setDrawer(null); setListDrawer(null);
  }, []);
  /* the owning module file — reachable from the task drawer only, and only
     where the package files actually exist beside the console */
  const openModuleFile = useCallback((file: string) => {
    if (HAS_MODULES) window.open(file, '_blank', 'noopener');
  }, []);

  const tasks: Task[] = useMemo(() => {
    const mine = intakes.map(intakeToTask);
    const base = preview === 'empty' ? [] : preview === 'dense' ? denseTasks() : [...mine, ...dayTasks];
    return base.filter(x => !done[x.id]);
  }, [preview, done, intakes]);

  /* the queue, grouped: the home shows the shape of the day; a group opens
     onto its complete list — five hundred rows stay one row here */
  const groups = useMemo(() => {
    const g: Record<string, Task[]> = {};
    tasks.forEach(x => { (g[x.kind] = g[x.kind] || []).push(x); });
    return (Object.keys(GROUP_META) as Task['kind'][])
      .filter(k => g[k]?.length)
      .map(k => ({ kind: k, items: g[k].sort((a, b) => b.lateMs - a.lateMs) }));
  }, [tasks]);

  /* the verb on a row is a DOOR, not a switch: no list finishes work in one
     press. It carries the person to the owning service page with the task in
     hand, and the act is performed THERE — a load is loaded from the trip page
     and only then leaves the queue. */
  const goAct = useCallback((task: Task) => {
    setDrawer(null); setListDrawer(null);
    setView({ t: 'svc', file: task.open, focus: task });
  }, []);

  /* completing the flow on the service page is the only thing that clears the
     row — and the toast carries an undo, because a real act needs a real way back */
  const completeTask = useCallback((task: Task, text: string) => {
    setDone(d => ({ ...d, [task.id]: true }));
    setView(v => (v.t === 'svc' ? { t: 'svc', file: v.file } : v));
    setToast({
      text,
      undo: () => { setDone(d => ({ ...d, [task.id]: false })); setToast(null); },
    });
  }, []);

  const allItems = useMemo(() => CATEGORIES.flatMap(c => c.items), []);
  const pinnedItems = useMemo(() => pinned.map(f => allItems.filter(i => i.file === f)[0]).filter(Boolean), [pinned, allItems]);

  const today = useMemo(() => new Intl.DateTimeFormat(ar ? 'ar-SY' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()), [ar]);

  const spark = (arr: number[]) => arr.map((v, i) => ({ i, v }));

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--cream)' }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════ */}
      <aside style={{
        width: rail ? 'var(--rail-w)' : 'var(--sb-w)', flex: '0 0 auto',
        background: 'var(--ink)', color: 'var(--paper)',
        display: 'flex', flexDirection: 'column',
        transition: 'width var(--t-panel) var(--ease)', overflow: 'hidden',
      }}>
        <div style={{
          height: 56, display: 'flex', alignItems: 'center',
          justifyContent: rail ? 'center' : 'flex-start',
          padding: rail ? 0 : '0 var(--s3)',
          borderBottom: '1px solid rgba(244,251,255,.08)',
        }}>
          {rail
            ? <img src={MARK_LIGHT} alt="ShopyLink" style={{ height: 18, width: 'auto', display: 'block' }} />
            : (
              /* the wordmark art sits on a pure-white plate, so it lives in a
                 pure-white chip — the plate merges into it, and the Arabic and
                 English builds get the exact same treatment */
              <span style={{
                display: 'inline-flex', alignItems: 'center', background: 'var(--paper)',
                borderRadius: 'var(--radius-sm)', padding: '5px 12px', boxShadow: 'var(--sh-1)',
              }}>
                <img src={ar ? LOCKUP_AR : LOCKUP_EN} alt="ShopyLink" style={{ height: 24, width: 'auto', display: 'block' }} />
              </span>
            )}
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 'var(--s3) var(--s2)' }}>
          {pinnedItems.length > 0 && !rail && (
            <div style={{ marginBottom: 'var(--s4)' }}>
              <div style={{ fontSize: 'var(--fs-eyebrow)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--acc)', padding: 'var(--s1) var(--s2) var(--s2)', fontWeight: 800 }}>
                {t('المثبَّتة', 'Pinned')}
              </div>
              {pinnedItems.map(it => (
                <SideItem key={'p' + it.file} label={ar ? it.ar : it.en}
                  onOpen={() => openService(it.file)}
                  pinned onTogglePin={() => togglePin(it.file)} ar={ar} />
              ))}
              <div style={{ height: 1, background: 'rgba(244,251,255,.1)', margin: 'var(--s3) var(--s2) 0' }} />
            </div>
          )}

          {CATEGORIES.map(c => {
            const Icon = CAT_ICONS[c.id] || Inbox;
            const open = openCat === c.id && !rail;
            return (
              <div key={c.id} style={{ marginBottom: 2 }}>
                <button
                  onClick={() => (rail ? (setRail(false), setOpenCat(c.id)) : setOpenCat(open ? null : c.id))}
                  title={ar ? c.ar : c.en} aria-expanded={open}
                  style={{
                    position: 'relative', display: 'flex', alignItems: 'center',
                    justifyContent: rail ? 'center' : 'flex-start', gap: 'var(--s3)',
                    width: '100%', height: 'var(--row-h)',
                    padding: rail ? 0 : '0 var(--s2)', borderRadius: 'var(--radius-sm)',
                    color: open ? 'var(--paper)' : 'var(--n4)', fontWeight: 700, fontSize: 'var(--fs-hint)',
                    background: open ? 'rgba(244,251,255,.08)' : 'transparent',
                    transition: 'background var(--t-state) var(--ease), color var(--t-state) var(--ease)',
                  }}
                  onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'rgba(244,251,255,.05)'; }}
                  onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {open && <span aria-hidden style={{ position: 'absolute', insetInlineStart: -8, top: 8, bottom: 8, width: 3, borderRadius: 'var(--radius-pill)', background: 'var(--acc)' }} />}
                  <Icon size={rail ? 18 : 15} strokeWidth={rail ? 1.75 : 2} style={{ flex: '0 0 auto' }} />
                  {!rail && <span style={{ flex: 1, textAlign: 'start' }}>{ar ? c.ar : c.en}</span>}
                  {!rail && <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-panel) var(--ease)', color: 'var(--n5)' }} />}
                </button>
                {!rail && (
                  <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows var(--t-panel) var(--ease)' }}>
                    <div style={{ overflow: 'hidden' }}>
                      {c.items.map(it => (
                        <SideItem key={it.file} label={ar ? it.ar : it.en} indent
                          onOpen={() => openService(it.file)}
                          pinned={pinned.indexOf(it.file) > -1}
                          onTogglePin={() => togglePin(it.file)} ar={ar} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={() => setFinder(true)} title={t('بحث شامل', 'Search everything')} style={{
            display: 'flex', alignItems: 'center', justifyContent: rail ? 'center' : 'flex-start',
            gap: 'var(--s3)', width: '100%', height: 'var(--row-h)',
            padding: rail ? 0 : '0 var(--s2)', borderRadius: 'var(--radius-sm)',
            color: 'var(--n4)', fontWeight: 700, fontSize: 'var(--fs-hint)', marginTop: 'var(--s2)',
          }}>
            <Search size={rail ? 18 : 15} strokeWidth={rail ? 1.75 : 2} />
            {!rail && <span style={{ flex: 1, textAlign: 'start' }}>{t('بحث شامل', 'Search everything')}</span>}
            {!rail && <kbd className="machine" style={{ fontSize: 10, color: 'var(--n6)' }}>⌘K</kbd>}
          </button>
        </nav>

        <div style={{ padding: 'var(--s2)', borderTop: '1px solid rgba(244,251,255,.08)' }}>
          <button onClick={() => setRail(v => !v)} title={t('طيّ الشريط', 'Collapse')} style={{
            display: 'flex', alignItems: 'center', justifyContent: rail ? 'center' : 'flex-start',
            gap: 'var(--s3)', width: '100%', height: 'var(--row-h)', padding: rail ? 0 : '0 var(--s2)',
            borderRadius: 'var(--radius-sm)', color: 'var(--n5)', fontSize: 'var(--fs-hint)', fontWeight: 700,
          }}>
            {rail ? <PanelRightOpen size={18} strokeWidth={1.75} /> : <PanelRightClose size={15} />}
            {!rail && <span>{t('طيّ', 'Collapse')}</span>}
          </button>
        </div>
      </aside>

      {/* ══ PAGE ═════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        <header style={{
          height: 'var(--top-h)', flex: '0 0 auto', display: 'flex', alignItems: 'center',
          gap: 'var(--s3)', padding: '0 var(--s6)', background: 'var(--paper)',
          borderBottom: '1px solid var(--n3)', boxShadow: 'var(--sh-1)', zIndex: 2,
        }}>
          <button onClick={() => setFinder(true)} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s2)', height: 32,
            width: 'clamp(150px, 26vw, 260px)', minWidth: 0,
            padding: '0 var(--s3)', border: '1.5px solid var(--n3)', borderRadius: 'var(--radius-sm)',
            color: 'var(--n6)', fontSize: 'var(--fs-hint)', background: 'var(--cream)',
          }}>
            <Search size={14} style={{ flex: '0 0 auto' }} />
            <span className="sl-nowrap" style={{ flex: 1, textAlign: 'start', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('خدمة أو شحنة برقمها…', 'A service, or a shipment by its number…')}</span>
            <kbd className="machine" style={{ fontSize: 10, color: 'var(--n5)' }}>⌘K</kbd>
          </button>
          <div style={{ flex: 1 }} />
          <span className="sl-demo-badge sl-nowrap" style={{
            background: 'var(--amber-tint)', color: 'var(--amber-deep)', padding: '4px 10px',
            borderRadius: 'var(--radius-pill)', fontSize: 'var(--fs-eyebrow)', fontWeight: 800, letterSpacing: '.06em',
          }}>
            {t('بيانات تجريبية', 'DEMONSTRATION DATA')}
          </span>
          <button onClick={() => setLang(ar ? 'en' : 'ar')} style={{
            height: 32, padding: '0 var(--s3)', border: '1.5px solid var(--n3)',
            borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-hint)', fontWeight: 800,
          }}>
            {ar ? 'EN' : 'ع'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
            <span aria-hidden style={{
              width: 30, height: 30, borderRadius: 'var(--radius-pill)', background: 'var(--sky-tint)',
              color: 'var(--sky-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 'var(--fs-hint)',
            }}>{dayMe.name.slice(0, 1)}</span>
            <div style={{ textAlign: ar ? 'left' : 'right', lineHeight: 1.3, flex: '0 0 auto' }}>
              <div className="sl-nowrap" style={{ fontSize: 'var(--fs-hint)', fontWeight: 800 }}>{dayMe.name}</div>
              <div className="machine sl-nowrap" style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)' }}>{dayMe.role} · L{dayMe.level}</div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 'var(--s6)' }}>
          {view.t === 'svc' ? (
            <ServiceView file={view.file} ar={ar} t={t}
              tasks={tasks.filter(x => x.open === view.file)}
              focus={view.focus && !done[view.focus.id] ? view.focus : undefined}
              onComplete={completeTask}
              onAct={goAct}
              onChat={task => setDrawer({ task, tab: 'chat' })}
              onRegister={view.file === 'ShopyLink_Action_01_ReceiveParcel.html' ? registerIntake : undefined}
              onBack={() => setView({ t: 'home' })}
              onOpenFile={HAS_MODULES ? openModuleFile : undefined} />
          ) : (
          <div style={{ maxWidth: 1160, marginInline: 'auto' }}>

            {/* page header — the five-second answer */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--s4)', marginBottom: 'var(--s5)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', color: 'var(--n6)', fontSize: 'var(--fs-eyebrow)', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  <CalendarDays size={12} /> <span>{today}</span>
                </div>
                <h1 style={{ font: `800 24px/1.25 ${ar ? 'var(--ar)' : 'var(--disp)'}`, margin: 'var(--s1) 0 0' }}>
                  {t('يومك، خالد', 'Your day, Khaled')}
                </h1>
                <div style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)', marginTop: 'var(--s1)' }}>
                  {preview === 'empty'
                    ? t('لا شيء ينتظر فعلك.', 'Nothing waits on you.')
                    : <>
                        {t('ينتظر فعلك ', 'Waiting on you: ')}
                        <b style={{ color: 'var(--ink)' }} className="machine">{tasks.length}</b>
                        {t(' في ', ' across ')}
                        <b style={{ color: 'var(--ink)' }} className="machine">{groups.length}</b>
                        {t(' فئات — أثقلها ', ' groups — the heaviest is ')}
                        <b style={{ color: 'var(--red-deep)' }}>{tasks.length ? lateLabel(Math.max(...tasks.map(x => x.lateMs)), ar).text : '—'}</b>
                      </>}
                </div>
              </div>
            </div>

            {/* main grid: the queue + the news board */}
            <div className="sl-main-grid">

              {/* ① needs action — grouped */}
              <Panel
                icon={<Timer size={14} />}
                eyebrow={t('الطابور', 'The queue')}
                title={t('يحتاج إجراء', 'Needs action')}
                meta={<span className="machine" style={{ fontSize: 'var(--fs-lead)', fontWeight: 700, color: 'var(--n6)' }}>{preview === 'loading' ? '—' : tasks.length}</span>}
              >
                {preview === 'error' && (
                  <div role="alert" style={{
                    display: 'flex', gap: 'var(--s3)', alignItems: 'flex-start', background: 'var(--red-tint)',
                    color: 'var(--red-deep)', padding: 'var(--s4)', fontSize: 'var(--fs-hint)', borderBottom: '1px solid var(--n2)',
                  }}>
                    <AlertTriangle size={15} style={{ flex: '0 0 auto', marginTop: 2 }} />
                    <div>
                      <b>{t('قناة لم تُقرأ', 'A channel could not be read')}</b>
                      <div style={{ marginTop: 'var(--s1)' }}>
                        {t('منشورة بشكل لا تستطيع هذه الصفحة قراءته — مالكها ينشرها والكونسول لا يصلحها. ما يلي يومٌ تجريبي.',
                           'Published in a shape this page cannot read — its owner publishes it; the console does not repair it. What follows is a demonstration day.')}
                      </div>
                      <div className="machine" style={{ marginTop: 'var(--s1)', fontWeight: 600 }}>SL_SHIPMENTS_V1 — Unexpected end of JSON input</div>
                    </div>
                  </div>
                )}

                {preview === 'loading' && Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)', height: 52, padding: '0 var(--s4)', borderBottom: '1px solid var(--n2)' }}>
                    <div className="skeleton" style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)' }} />
                    <div className="skeleton" style={{ width: '32%', height: 12 }} />
                    <div style={{ flex: 1 }} />
                    <div className="skeleton" style={{ width: 46, height: 20, borderRadius: 'var(--radius-pill)' }} />
                  </div>
                ))}

                {preview !== 'loading' && groups.length === 0 && preview !== 'error' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s3)', padding: 'var(--s8) var(--s6)', color: 'var(--n6)' }}>
                    <CircleCheckBig size={30} strokeWidth={1.5} style={{ color: 'var(--green)' }} />
                    <div style={{ fontSize: 'var(--fs-lead)', fontWeight: 700, color: 'var(--ink)' }}>
                      {t('لا شيء متأخّر — وهذا هو المقصود.', 'Nothing is overdue — which is the point.')}
                    </div>
                    <div style={{ fontSize: 'var(--fs-hint)' }}>
                      {t('ما يصل مركزك يظهر هنا لحظة وصوله.', 'What reaches your centre appears here the moment it does.')}
                    </div>
                  </div>
                )}

                {preview !== 'loading' && groups.map(g => {
                  const meta = GROUP_META[g.kind]; const tone = TONES[meta.tone];
                  const KIcon = KIND_ICONS[g.kind];
                  const worst = lateLabel(g.items[0].lateMs, ar);
                  const open = !!openGroups[g.kind];
                  return (
                    <div key={g.kind} style={{ borderBottom: '1px solid var(--n2)' }}>
                      <button
                        onClick={() => setOpenGroups(o => ({ ...o, [g.kind]: !o[g.kind] }))}
                        aria-expanded={open}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--s3)', width: '100%',
                          minHeight: 52, padding: 'var(--s2) var(--s4)', textAlign: 'start',
                          transition: 'background var(--t-state) var(--ease)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n1)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                      >
                        <span aria-hidden style={{
                          width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: tone.bg,
                          color: tone.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
                        }}><KIcon size={15} /></span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 800, fontSize: 'var(--fs-body)' }}>{ar ? meta.ar : meta.en}</span>
                          <span style={{ display: 'block', fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ar ? g.items[0].ar : g.items[0].en}
                          </span>
                        </span>
                        <span className="machine" style={{
                          fontSize: 'var(--fs-hint)', fontWeight: 800, color: tone.fg, background: tone.bg,
                          padding: '2px 9px', borderRadius: 'var(--radius-pill)', minWidth: 30, textAlign: 'center',
                        }}>{g.items.length}</span>
                        <span style={{
                          fontSize: 'var(--fs-eyebrow)', fontWeight: 800, whiteSpace: 'nowrap',
                          padding: '3px 9px', borderRadius: 'var(--radius-pill)',
                          color: TONES[worst.tone].fg, background: TONES[worst.tone].bg,
                        }}>{worst.text}</span>
                        <ChevronDown size={14} style={{ color: 'var(--n5)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-panel) var(--ease)' }} />
                      </button>
                      {open && (
                        <TaskList tasks={g.items} ar={ar} t={t} limit={3}
                          onMore={() => setListDrawer({ title: ar ? meta.ar : meta.en, tasks: g.items })}
                          onAct={goAct}
                          onChat={task => setDrawer({ task, tab: 'chat' })} />
                      )}
                    </div>
                  );
                })}
              </Panel>

              {/* ② the news board — the management's word, with a face */}
              <Panel
                icon={<Megaphone size={14} />}
                eyebrow={t('من الإدارة', 'From the management')}
                title={t('لوح الأخبار', 'The news board')}
                meta={<span className="machine" style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)' }}>{news + 1} / {dayNews.length}</span>}
              >
                <NewsBoard ar={ar} t={t} index={news} onIndex={setNews} />
              </Panel>
            </div>

            {/* ③ his figures, last — sparklines and doors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--s4)', marginTop: 'var(--s5)' }}>
              {dayFigures.map((f, fi) => {
                const series = fi === 0 ? weekIntake : fi === 1 ? weekMeasured : weekLate;
                const tone = TONES[f.tone === 'green' ? 'green' : f.tone === 'amber' ? 'amber' : 'red'];
                const backing = fi === 2 ? tasks.filter(x => x.lateMs > 0) : tasks.filter(x => x.kind === 'measure');
                return (
                  <button key={f.en}
                    onClick={() => setListDrawer({ title: ar ? f.ar : f.en, tasks: backing })}
                    style={{
                      textAlign: 'start', background: 'var(--paper)', border: '1px solid var(--n3)',
                      borderRadius: 'var(--radius)', padding: 'var(--s4) var(--s4) var(--s2)',
                      boxShadow: 'var(--sh-1)', transition: 'border-color var(--t-state) var(--ease)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--n5)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--n3)'; }}>
                    <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      {ar ? f.ar : f.en}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginTop: 'var(--s1)' }}>
                      <span className="disp machine" style={{ fontSize: 'var(--fs-figure)', fontWeight: 800, lineHeight: 1.05 }}>{f.n}</span>
                      <span aria-hidden style={{ width: 8, height: 8, borderRadius: 'var(--radius-pill)', background: tone.dot }} />
                      <span style={{ flex: 1 }} />
                    </div>
                    <div style={{ height: 40, margin: '0 calc(-1 * var(--s2))' }} aria-hidden>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={spark(series)} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={'g' + fi} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={tone.dot} stopOpacity={0.28} />
                              <stop offset="100%" stopColor={tone.dot} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="v" stroke={tone.dot} strokeWidth={1.75}
                            fill={'url(#g' + fi + ')'} isAnimationActive={false} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n5)', textAlign: 'end' }}>
                      {t('٧ أيام', '7 days')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          )}
        </main>
      </div>

      {/* ══ TASK DRAWER — details · trail · thread · the act ═════════ */}
      <aside aria-hidden={!drawer} className="sl-drawer" style={{
        width: drawer ? 'min(var(--panel-w), 92vw)' : 0,
        borderInlineStart: drawer ? '1px solid var(--n3)' : 'none',
        boxShadow: drawer ? 'var(--sh-2)' : 'none', zIndex: 26,
      }}>
        {drawer && <TaskDrawer task={drawer.task} tab={drawer.tab} ar={ar} t={t}
          detailsOf={ref => {
            const i = intakes.filter(x => x.ref === ref)[0];
            return i ? { client: i.client, route: i.from + ' ← ' + i.to, weight: i.weight.toFixed(1) + ' kg', cartons: i.cartons } : dayDetails[ref];
          }}
          onClose={() => setDrawer(null)} onAct={goAct}
          onOpenModule={HAS_MODULES ? () => openModuleFile(drawer.task.open) : undefined}
          onMention={names => setToast(
            (ar ? 'وُسم ' : 'Mentioned ') + names.map(n => '@' + n).join(ar ? ' و' : ', ') +
            (ar ? ' — يصله التنبيه عبر لوحة التحكم' : ' — notified through the control board'))} />}
      </aside>

      {/* ══ LIST DRAWER — the list behind a figure ═══════════════════ */}
      <aside aria-hidden={!listDrawer} className="sl-drawer" style={{
        width: listDrawer ? 'min(var(--panel-w), 92vw)' : 0,
        borderInlineStart: listDrawer ? '1px solid var(--n3)' : 'none',
        boxShadow: listDrawer ? 'var(--sh-2)' : 'none',
      }}>
        {listDrawer && (
          <div style={{ width: 'var(--panel-w)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--n2)' }}>
              <b style={{ flex: 1, fontSize: 'var(--fs-lead)' }}>{listDrawer.title}</b>
              <span className="machine" style={{ color: 'var(--n6)', fontSize: 'var(--fs-hint)' }}>{listDrawer.tasks.length}</span>
              <button onClick={() => setListDrawer(null)} title={t('إغلاق', 'Close')} aria-label={t('إغلاق', 'Close')} style={{ color: 'var(--n6)', display: 'flex', padding: 4 }}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {listDrawer.tasks.length === 0
                ? <div style={{ padding: 'var(--s6)', color: 'var(--n6)', fontSize: 'var(--fs-hint)', textAlign: 'center' }}>{t('لا شيء هنا — وهذا هو المقصود.', 'Nothing here — which is the point.')}</div>
                : <TaskList tasks={listDrawer.tasks} ar={ar} t={t}
                    onAct={goAct}
                    onChat={task => { setListDrawer(null); setDrawer({ task, tab: 'chat' }); }} />}
            </div>
          </div>
        )}
      </aside>

      {finder && <Finder ar={ar} t={t} onClose={() => setFinder(false)} onOpen={openService} />}

      {/* state preview — a review affordance, labelled as one */}
      <div style={{
        position: 'fixed', insetInlineEnd: 'var(--s4)', bottom: 'var(--s4)', zIndex: 30,
        display: 'flex', alignItems: 'center', gap: 'var(--s1)',
        background: 'var(--ink)', color: 'var(--n4)', borderRadius: 'var(--radius-pill)',
        padding: '4px 6px', boxShadow: 'var(--sh-2)', fontSize: 'var(--fs-eyebrow)',
      }}>
        <span style={{ padding: '0 var(--s2)', fontWeight: 800, letterSpacing: '.06em' }}>{t('معاينة الحالات', 'STATE PREVIEW')}</span>
        {([['normal', 'طبيعي', 'Normal'], ['empty', 'فارغ', 'Empty'], ['loading', 'تحميل', 'Loading'], ['error', 'خطأ', 'Error'], ['dense', '٥٠٠+', '500+']] as [Preview, string, string][]).map(([k, a, e]) => (
          <button key={k} onClick={() => setPreview(k)} style={{
            padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontWeight: 800, fontSize: 'var(--fs-eyebrow)',
            background: preview === k ? 'var(--sky)' : 'transparent',
            color: preview === k ? 'var(--ink)' : 'var(--n4)',
            transition: 'background var(--t-state) var(--ease), color var(--t-state) var(--ease)',
          }}>{ar ? a : e}</button>
        ))}
      </div>

      {toast && (
        <div role="status" style={{
          position: 'fixed', insetInlineStart: '50%', bottom: 'var(--s7)', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 'var(--s3)',
          background: 'var(--ink)', color: 'var(--paper)', borderRadius: 'var(--radius-sm)',
          padding: 'var(--s2) var(--s4)', fontSize: 'var(--fs-hint)', fontWeight: 700,
          boxShadow: 'var(--sh-2)', zIndex: 40, maxWidth: '80vw',
        }}>
          <span>{toast.text}</span>
          {toast.undo && (
            <button onClick={toast.undo} style={{
              color: 'var(--acc)', fontWeight: 800, fontSize: 'var(--fs-hint)',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>{t('تراجع', 'Undo')}</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── the shared panel chrome — one card language for the whole page ──── */
function Panel({ icon, eyebrow, title, meta, children }: {
  icon: React.ReactNode; eyebrow: string; title: string; meta?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section style={{
      background: 'var(--paper)', border: '1px solid var(--n3)', borderRadius: 'var(--radius)',
      boxShadow: 'var(--sh-1)', overflow: 'hidden',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 'var(--s3)',
        padding: 'var(--s3) var(--s4)', borderBottom: '1px solid var(--n2)', background: 'var(--paper)',
      }}>
        <span aria-hidden style={{
          width: 26, height: 26, borderRadius: 'var(--radius-sm)', background: 'var(--sky-tint)',
          color: 'var(--sky-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</span>
        <div style={{ flex: 1, lineHeight: 1.2 }}>
          <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n5)', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{eyebrow}</div>
          <div style={{ fontSize: 'var(--fs-lead)', fontWeight: 800 }}>{title}</div>
        </div>
        {meta}
      </header>
      {children}
    </section>
  );
}

/* ── a list of tasks. Inline in a group it shows the first THREE and a
      "more" button — the home shows the shape of the day, the drawer holds the
      day itself. In the drawer it reveals progressively, 120 at a time, so the
      500-row state scrolls clean without a wall of nodes. ─────────────────── */
function TaskList({ tasks, ar, t, onChat, onAct, limit, onMore }: {
  tasks: Task[]; ar: boolean; t: (a: string, e: string) => string;
  onChat: (x: Task) => void; onAct: (x: Task) => void;
  limit?: number; onMore?: () => void;
}) {
  const [cap, setCap] = useState(120);
  useEffect(() => { setCap(120); }, [tasks]);
  const shown = tasks.slice(0, limit ?? cap);
  const hiddenByLimit = limit !== undefined && tasks.length > limit;
  const hiddenByCap = limit === undefined && tasks.length > cap;
  return (
    <div style={{ background: 'var(--n1)' }}>
      {shown.map(task => {
        const late = lateLabel(task.lateMs, ar);
        const tone = TONES[late.tone];
        return (
          <div key={task.id} className="sl-row" role="button" tabIndex={0}
            aria-label={(ar ? task.ar : task.en) + ' — ' + late.text}
            onClick={() => onAct(task)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAct(task); } }}
            style={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 'var(--s3)',
              height: 44, padding: '0 var(--s4)', borderBottom: '1px solid var(--n2)', cursor: 'pointer',
            }}>
            <span aria-hidden style={{ position: 'absolute', insetInlineStart: 0, top: 8, bottom: 8, width: 3, borderRadius: 'var(--radius-pill)', background: tone.dot }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--fs-hint)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingInlineStart: 'var(--s2)' }}>
              {ar ? task.ar : task.en}
            </span>
            <span className="machine" style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)' }}>{task.ref}</span>
            <span style={{ fontSize: 'var(--fs-eyebrow)', fontWeight: 800, whiteSpace: 'nowrap', padding: '2px 8px', borderRadius: 'var(--radius-pill)', color: tone.fg, background: tone.bg }}>{late.text}</span>
            <button onClick={e => { e.stopPropagation(); onChat(task); }} title={t('المحادثة', 'Thread')} aria-label={t('المحادثة', 'Thread')}
              className="sl-row-chat" style={{ color: 'var(--n5)', display: 'flex', padding: 4, borderRadius: 'var(--radius-sm)' }}>
              <MessageSquare size={14} />
            </button>
            <span aria-hidden className="sl-row-go" style={{ color: 'var(--n4)', display: 'flex', transition: 'color var(--t-state) var(--ease), transform var(--t-state) var(--ease)' }}>
              {ar ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
            </span>
          </div>
        );
      })}
      {hiddenByLimit && onMore && (
        <button onClick={onMore} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s2)',
          width: '100%', height: 38, fontSize: 'var(--fs-hint)', fontWeight: 800,
          color: 'var(--sky-deep)', borderBottom: '1px solid var(--n2)',
          transition: 'background var(--t-state) var(--ease)',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--sky-tint)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
          {t('المزيد', 'More')}
          <span className="machine">+{tasks.length - (limit ?? 0)}</span>
        </button>
      )}
      {hiddenByCap && (
        <button onClick={() => setCap(c => c + 120)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s2)',
          width: '100%', height: 38, fontSize: 'var(--fs-hint)', fontWeight: 800, color: 'var(--sky-deep)',
        }}>
          {t('أظهر المزيد', 'Show more')}
          <span className="machine">{Math.min(120, tasks.length - cap)} / {tasks.length - cap}</span>
        </button>
      )}
    </div>
  );
}

/* ── the news board: a slide per item, image and title and all ───────── */
function NewsBoard({ ar, t, index, onIndex }: {
  ar: boolean; t: (a: string, e: string) => string; index: number; onIndex: (i: number) => void;
}) {
  const n: NewsItem = dayNews[index];
  const prev = () => onIndex((index - 1 + dayNews.length) % dayNews.length);
  const next = () => onIndex((index + 1) % dayNews.length);
  return (
    <div>
      {/* the slide */}
      <div key={n.id} style={{ animation: 'sl-news var(--t-panel) var(--ease)' }}>
        <style>{`@keyframes sl-news { from { opacity: 0; transform: translateX(${ar ? '-' : ''}10px); } to { opacity: 1; transform: none; } }`}</style>
        {n.image === 'brand' && (
          <div aria-hidden style={{
            height: 108, background: 'var(--ink)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', overflow: 'hidden', position: 'relative',
          }}>
            <img src={MARK_LIGHT} alt="" style={{ height: 40, opacity: .95 }} />
            <span style={{ position: 'absolute', insetInlineEnd: -30, top: -40, width: 160, height: 190, background: 'radial-gradient(closest-side, rgba(56,189,248,.25), transparent)' }} />
          </div>
        )}
        <div style={{ padding: 'var(--s4) var(--s5)' }}>
          <span className="machine" style={{
            fontSize: 'var(--fs-eyebrow)', color: 'var(--sky-deep)', fontWeight: 800,
            letterSpacing: '.08em', textTransform: 'uppercase', background: 'var(--sky-tint)',
            padding: '2px 8px', borderRadius: 'var(--radius-pill)',
          }}>{n.kind}</span>
          {/* the headline reads as a HEADLINE: the display face in Latin, a
              heavy Tajawal in Arabic, a full step up the type scale */}
          <h3 style={{
            fontSize: 'var(--fs-title)', fontWeight: 800, lineHeight: 1.35,
            fontFamily: ar ? 'var(--ar)' : 'var(--disp)',
            letterSpacing: ar ? 0 : '-0.01em', color: 'var(--ink)',
            margin: 'var(--s2) 0 var(--s1)',
          }}>
            {ar ? n.titleAr : n.titleEn}
          </h3>
          <p style={{ fontSize: 'var(--fs-hint)', color: 'var(--n7)', lineHeight: 1.65, margin: 0 }}>
            {ar ? n.ar : n.en}
          </p>
          <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)', marginTop: 'var(--s3)' }}>
            {n.by} · <span className="machine">{n.at}</span>
          </div>
        </div>
      </div>
      {/* the rail: dots + arrows */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--s2)',
        padding: 'var(--s2) var(--s4)', borderTop: '1px solid var(--n2)',
      }}>
        <button onClick={prev} title={t('السابق', 'Previous')} aria-label={t('السابق', 'Previous')}
          style={{ display: 'flex', color: 'var(--n6)', padding: 4 }}>
          {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {dayNews.map((x, i) => (
            <button key={x.id} onClick={() => onIndex(i)} aria-label={(ar ? 'خبر ' : 'item ') + (i + 1)} style={{
              width: i === index ? 18 : 6, height: 6, borderRadius: 'var(--radius-pill)',
              background: i === index ? 'var(--sky)' : 'var(--n3)',
              transition: 'width var(--t-panel) var(--ease), background var(--t-state) var(--ease)',
            }} />
          ))}
        </div>
        <button onClick={next} title={t('التالي', 'Next')} aria-label={t('التالي', 'Next')}
          style={{ display: 'flex', color: 'var(--n6)', padding: 4 }}>
          {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}

/* ── the task drawer: what it is, its trail, its thread, and the act ─── */
function TaskDrawer({ task, tab, ar, t, onClose, onAct, onOpenModule, onMention, detailsOf }: {
  task: Task; tab: 'info' | 'chat'; ar: boolean; t: (a: string, e: string) => string;
  onClose: () => void; onAct: (x: Task) => void; onOpenModule?: () => void;
  onMention?: (names: string[]) => void;
  detailsOf?: (ref: string) => { client: string; route: string; weight: string; cartons: number } | undefined;
}) {
  const late = lateLabel(task.lateMs, ar);
  const d = detailsOf ? detailsOf(task.ref) : dayDetails[task.ref];
  const trail = dayTrail[task.ref] || [];
  const thread = dayThreads[task.ref] || [];
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<{ by: string; at: string; ar: string; en: string }[]>([]);
  const [pick, setPick] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (tab === 'chat') chatRef.current?.scrollIntoView?.(); }, [tab]);
  const all = [...thread, ...sent];
  /* an open mention: the text ends in @ plus a fragment with no space yet */
  const frag = /@([^\s@]*)$/.exec(draft);
  const people = frag
    ? dayStaff.filter(p => (ar ? p.ar : p.en).startsWith(frag[1]) || (ar ? p.en : p.ar).toLowerCase().startsWith(frag[1].toLowerCase())).slice(0, 5)
    : [];
  useEffect(() => { setPick(0); }, [draft]);
  const choose = (name: string) => {
    setDraft(d => d.replace(/@([^\s@]*)$/, '@' + name + ' '));
  };
  const send = () => {
    if (!draft.trim()) return;
    const named = dayStaff.filter(p => draft.indexOf('@' + p.ar) > -1 || draft.indexOf('@' + p.en) > -1);
    setSent(s => [...s, { by: dayMe.name, at: t('الآن', 'now'), ar: draft, en: draft }]);
    setDraft('');
    if (named.length) onMention?.(named.map(p => (ar ? p.ar : p.en)));
  };
  return (
    <div style={{ width: 'var(--panel-w)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--n2)', display: 'flex', gap: 'var(--s2)', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--fs-lead)', fontWeight: 800, lineHeight: 1.35 }}>{ar ? task.ar : task.en}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginTop: 4 }}>
            <span className="machine" style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)' }}>{task.ref}</span>
            <span style={{ fontSize: 'var(--fs-eyebrow)', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-pill)', color: TONES[late.tone].fg, background: TONES[late.tone].bg }}>{late.text}</span>
          </div>
        </div>
        <button onClick={onClose} title={t('إغلاق', 'Close')} aria-label={t('إغلاق', 'Close')} style={{ color: 'var(--n6)', display: 'flex', padding: 4 }}><X size={16} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {d && (
          <div style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--n2)' }}>
            <SectionLabel>{t('الشحنة', 'The shipment')}</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s2) var(--s4)', fontSize: 'var(--fs-hint)' }}>
              <Field k={t('العميل', 'Client')} v={d.client} />
              <Field k={t('المسار', 'Route')} v={d.route} machine />
              <Field k={t('الوزن', 'Weight')} v={d.weight} machine />
              <Field k={t('الطرود', 'Cartons')} v={String(d.cartons)} machine />
            </div>
          </div>
        )}
        {trail.length > 0 && (
          <div style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--n2)' }}>
            <SectionLabel>{t('ما جرى', 'What happened')}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
              {trail.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--s3)' }}>
                  <span aria-hidden style={{ width: 7, height: 7, borderRadius: 'var(--radius-pill)', background: i === trail.length - 1 ? 'var(--sky)' : 'var(--n4)', marginTop: 5, flex: '0 0 auto' }} />
                  <div style={{ fontSize: 'var(--fs-hint)', lineHeight: 1.5 }}>
                    <div>{ar ? e.ar : e.en}</div>
                    <div className="machine" style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n5)' }}>{e.at}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div ref={chatRef} style={{ padding: 'var(--s4) var(--s5)' }}>
          <SectionLabel>{t('المحادثة', 'The thread')}</SectionLabel>
          {all.length === 0 && <div style={{ color: 'var(--n6)', fontSize: 'var(--fs-hint)' }}>{t('لا محادثة بعد — ابدأها.', 'No thread yet — start it.')}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
            {all.map((m, i) => {
              const mine = m.by === dayMe.name;
              return (
                <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                  <div style={{
                    background: mine ? 'var(--sky-tint)' : 'var(--n1)',
                    border: '1px solid ' + (mine ? 'rgba(14,165,233,.4)' : 'var(--n2)'),
                    borderRadius: 'var(--radius)', padding: 'var(--s2) var(--s3)', fontSize: 'var(--fs-hint)', lineHeight: 1.55,
                  }}><MsgText text={ar ? m.ar : m.en} ar={ar} /></div>
                  <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n5)', marginTop: 2, paddingInline: 'var(--s1)' }}>
                    {m.by} · <span className="machine">{m.at}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ position: 'relative', display: 'flex', gap: 'var(--s2)', marginTop: 'var(--s3)' }}>
            {people.length > 0 && (
              <div role="listbox" aria-label={t('وسم شخصاً', 'Mention someone')} style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', insetInlineStart: 0,
                width: 'min(280px, 100%)', background: 'var(--paper)', border: '1px solid var(--n3)',
                borderRadius: 'var(--radius-sm)', boxShadow: 'var(--sh-2)', overflow: 'hidden', zIndex: 5,
              }}>
                {people.map((p, i) => (
                  <button key={p.en} role="option" aria-selected={i === pick}
                    onMouseDown={e => { e.preventDefault(); choose(ar ? p.ar : p.en); }}
                    onMouseEnter={() => setPick(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--s2)', width: '100%',
                      padding: 'var(--s2) var(--s3)', textAlign: 'start', fontSize: 'var(--fs-hint)',
                      background: i === pick ? 'var(--sky-tint)' : 'transparent',
                    }}>
                    <span aria-hidden style={{
                      width: 22, height: 22, borderRadius: 'var(--radius-pill)', background: 'var(--n2)',
                      color: 'var(--n7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'var(--fs-eyebrow)', fontWeight: 800,
                    }}>{(ar ? p.ar : p.en).slice(0, 1)}</span>
                    <span style={{ flex: 1, fontWeight: 700 }}>{ar ? p.ar : p.en}</span>
                    <span className="machine" style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n5)' }}>{p.role}</span>
                  </button>
                ))}
              </div>
            )}
            <input value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (people.length) {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setPick(v => (v + 1) % people.length); return; }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setPick(v => (v - 1 + people.length) % people.length); return; }
                  if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); choose(ar ? people[pick].ar : people[pick].en); return; }
                  if (e.key === 'Escape') { e.stopPropagation(); setDraft(d => d.replace(/@([^\s@]*)$/, '')); return; }
                }
                if (e.key === 'Enter') send();
              }}
              placeholder={t('اكتب — و@ لوسم شخص', 'Write — @ mentions someone')}
              style={{ flex: 1, height: 34, padding: '0 var(--s3)', border: '1.5px solid var(--n3)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-hint)', fontFamily: 'inherit', background: 'var(--paper)' }} />
            <button onClick={send} title={t('أرسل', 'Send')} aria-label={t('أرسل', 'Send')} style={{
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--sky)', color: 'var(--ink)', borderRadius: 'var(--radius-sm)',
            }}><Send size={15} style={{ transform: ar ? 'scaleX(-1)' : 'none' }} /></button>
          </div>
        </div>
      </div>

      <div style={{ padding: 'var(--s3) var(--s5)', borderTop: '1px solid var(--n2)', display: 'flex', gap: 'var(--s2)' }}>
        <button onClick={() => onAct(task)} style={{
          flex: 1, height: 'var(--ctl-h)', background: 'var(--sky)', color: 'var(--ink)',
          borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: 'var(--fs-body)',
          transition: 'filter var(--t-state) var(--ease)',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = ''; }}>
          {ar ? task.verbAr : task.verbEn}
        </button>
        {onOpenModule && <button onClick={onOpenModule} title={t('افتح في الوحدة المالكة', 'Open in the owning module')} style={{
          height: 'var(--ctl-h)', padding: '0 var(--s4)', border: '1.5px solid var(--n3)',
          borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-hint)', fontWeight: 700, color: 'var(--n7)',
        }}>{t('الوحدة', 'Module')}</button>}
      </div>
    </div>
  );
}
/* a known name after @ becomes a chip — the thread names a person, and the
   name reads as one thing, not as text that happens to start with a sign */
function MsgText({ text, ar }: { text: string; ar: boolean }) {
  const names = dayStaff.map(p => (ar ? p.ar : p.en))
    .concat(dayStaff.map(p => (ar ? p.en : p.ar)));   /* either language sticks */
  const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('@(' + names.map(esc).join('|') + ')', 'g');
  const parts: React.ReactNode[] = [];
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span key={k++} style={{
        background: 'var(--sky-tint)', color: 'var(--sky-deep)', fontWeight: 800,
        borderRadius: 'var(--radius-pill)', padding: '0 6px', unicodeBidi: 'isolate',
      }}>@{m[1]}</span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n5)', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 'var(--s2)' }}>{children}</div>;
}
function Field({ k, v, machine }: { k: string; v: string; machine?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n5)', fontWeight: 700 }}>{k}</div>
      <div className={machine ? 'machine' : undefined} style={{ fontWeight: 700 }}>{v}</div>
    </div>
  );
}

/* ── sidebar row ─────────────────────────────────────────────────────── */
function SideItem({ label, indent, pinned, onOpen, onTogglePin, ar }: {
  label: string; indent?: boolean; pinned?: boolean;
  onOpen: () => void; onTogglePin: () => void; ar: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: 'flex', alignItems: 'center', height: 32,
      paddingInlineStart: indent ? 'var(--s7)' : 'var(--s2)', paddingInlineEnd: 'var(--s1)',
      borderRadius: 'var(--radius-sm)', background: hover ? 'rgba(244,251,255,.06)' : 'transparent',
      transition: 'background var(--t-state) var(--ease)',
    }}>
      <button onClick={onOpen} title={label} style={{
        flex: 1, textAlign: 'start', color: 'var(--n3)', fontSize: 'var(--fs-hint)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: 0,
      }}>{label}</button>
      <button onClick={onTogglePin}
        title={pinned ? (ar ? 'فكّ التثبيت' : 'Unpin') : (ar ? 'ثبّت' : 'Pin')}
        aria-label={pinned ? (ar ? 'فكّ التثبيت' : 'Unpin') : (ar ? 'ثبّت' : 'Pin')}
        style={{ display: 'flex', padding: 5, color: pinned ? 'var(--acc)' : 'var(--n6)', opacity: pinned || hover ? 1 : 0, transition: 'opacity var(--t-state) var(--ease)' }}>
        {pinned ? <PinOff size={12} /> : <Pin size={12} />}
      </button>
    </div>
  );
}

/* ── ⌘K ──────────────────────────────────────────────────────────────── */
function Finder({ ar, t, onClose, onOpen }: {
  ar: boolean; t: (a: string, e: string) => string; onClose: () => void;
  onOpen: (f: string) => void;
}) {
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);
  const services = CATEGORIES.flatMap(c => c.items)
    .filter(i => (i.ar + ' ' + i.en + ' ' + i.file).toLowerCase().indexOf(q.toLowerCase()) > -1);
  const refHit = /^(con|trp|shp)?-?\d/i.test(q.trim()) && q.trim().length >= 3;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(11,42,59,.34)', zIndex: 20,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '11vh',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(580px, 92vw)', background: 'var(--paper)', borderRadius: 'var(--radius)',
        border: '1px solid var(--n3)', boxShadow: 'var(--sh-2)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', padding: '0 var(--s4)', borderBottom: '1px solid var(--n2)' }}>
          <Search size={16} style={{ color: 'var(--n5)' }} />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)}
            placeholder={t('خدمة أو شحنة برقمها…', 'A service, or a shipment by its number…')}
            style={{ flex: 1, height: 46, border: 'none', outline: 'none', fontSize: 'var(--fs-body)', background: 'transparent', fontFamily: 'inherit' }} />
          <kbd className="machine" style={{ fontSize: 10, color: 'var(--n5)' }}>esc</kbd>
        </div>
        <div style={{ maxHeight: '46vh', overflowY: 'auto', padding: 'var(--s2)' }}>
          {refHit && (
            <>
              <GroupLabel>{t('شحنة', 'Shipment')}</GroupLabel>
              <button onClick={() => { onOpen('ShopyLink_D1_Control.html'); onClose(); }} style={rowStyle}>
                <span className="machine" style={{ fontWeight: 700 }}>{q.toUpperCase()}</span>
                <span style={{ color: 'var(--n6)', fontSize: 'var(--fs-hint)' }}>{t('افتحها في لوحة التحكم', 'Open it on the control board')}</span>
              </button>
            </>
          )}
          <GroupLabel>{t('خدمات', 'Services')}</GroupLabel>
          {services.slice(0, 9).map(i => (
            <button key={i.file} onClick={() => { onOpen(i.file); onClose(); }} style={rowStyle}>
              <span style={{ fontWeight: 600 }}>{ar ? i.ar : i.en}</span>
            </button>
          ))}
          {services.length === 0 && !refHit && (
            <div style={{ padding: 'var(--s5)', color: 'var(--n6)', fontSize: 'var(--fs-hint)', textAlign: 'center' }}>
              {t('لا شيء بهذا الاسم.', 'Nothing by that name.')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s3)',
  width: '100%', textAlign: 'start', padding: 'var(--s2) var(--s3)',
  borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-body)',
};
function GroupLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n5)', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', padding: 'var(--s2) var(--s3) var(--s1)' }}>{children}</div>;
}

/* ── one service, inside the console — and WORKABLE: it shows the service's
      own live work (act, open, thread — the same rows as the home), and the
      intake service carries the registering form itself. The experience never
      changes language or leaves the page. ─────────────────────────────────── */
function ServiceView({ file, ar, t, tasks, focus, onComplete, onAct, onChat, onRegister, onBack, onOpenFile }: {
  file: string; ar: boolean; t: (a: string, e: string) => string;
  tasks: Task[]; focus?: Task;
  onComplete: (x: Task, text: string) => void;
  onAct: (x: Task) => void; onChat: (x: Task) => void;
  onRegister?: (f: { client: string; from: string; to: string; mode: 'air' | 'land' | 'sea'; weight: number; cartons: number }) => string;
  onBack: () => void; onOpenFile?: (f: string) => void;
}) {
  const cat = CATEGORIES.filter(c => c.items.some(i => i.file === file))[0];
  const item = cat?.items.filter(i => i.file === file)[0];
  const Icon = cat ? (CAT_ICONS[cat.id] || Inbox) : Inbox;
  if (!item || !cat) return null;
  return (
    <div style={{ maxWidth: 860, marginInline: 'auto' }}>
      <nav aria-label={t('مسار', 'Breadcrumb')} style={{
        display: 'flex', alignItems: 'center', gap: 'var(--s2)',
        fontSize: 'var(--fs-hint)', color: 'var(--n6)', marginBottom: 'var(--s4)',
      }}>
        <button onClick={onBack} style={{ color: 'var(--sky-deep)', fontWeight: 700 }}>{t('يومي', 'My day')}</button>
        {ar ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        <span>{ar ? cat.ar : cat.en}</span>
        {ar ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        <b style={{ color: 'var(--ink)' }}>{ar ? item.ar : item.en}</b>
      </nav>

      <section style={{
        background: 'var(--paper)', border: '1px solid var(--n3)',
        borderRadius: 'var(--radius)', boxShadow: 'var(--sh-1)', overflow: 'hidden',
        marginBottom: 'var(--s5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)', padding: 'var(--s5) var(--s6)' }}>
          <span aria-hidden style={{
            width: 44, height: 44, borderRadius: 'var(--radius)', background: 'var(--sky-tint)',
            color: 'var(--sky-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon size={20} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n5)', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              {ar ? cat.ar : cat.en}
            </div>
            <h2 style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.3, margin: 0 }}>{ar ? item.ar : item.en}</h2>
            <p style={{ margin: 'var(--s1) 0 0', fontSize: 'var(--fs-hint)', color: 'var(--n6)' }}>
              {ar ? (item.descAr || '') : (item.descEn || '')}
            </p>
          </div>
          {onOpenFile && (
            <button onClick={() => onOpenFile(file)} style={{
              height: 32, padding: '0 var(--s3)', border: '1.5px solid var(--n3)',
              borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-eyebrow)', fontWeight: 700, color: 'var(--n7)',
            }}>{t('ملف الوحدة', 'Module file')}</button>
          )}
        </div>
      </section>

      {focus && <ActFlow task={focus} ar={ar} t={t} onComplete={onComplete} />}

      {onRegister && <IntakeForm ar={ar} t={t} onRegister={onRegister} />}

      <Panel
        icon={<Timer size={14} />}
        eyebrow={ar ? item.ar : item.en}
        title={t('عمل هذه الخدمة اليوم', "This service's work today")}
        meta={<span className="machine" style={{ fontSize: 'var(--fs-lead)', fontWeight: 700, color: 'var(--n6)' }}>{tasks.length}</span>}
      >
        {tasks.length === 0
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s2)', padding: 'var(--s7) var(--s6)', color: 'var(--n6)' }}>
              <CircleCheckBig size={26} strokeWidth={1.5} style={{ color: 'var(--green)' }} />
              <div style={{ fontSize: 'var(--fs-body)', fontWeight: 700, color: 'var(--ink)' }}>
                {t('لا عمل معلّقاً لهذه الخدمة الآن.', 'No pending work for this service right now.')}
              </div>
              <div style={{ fontSize: 'var(--fs-hint)' }}>
                {t('ما يخصّها يظهر هنا وعلى طابور يومك معاً.', 'What belongs to it appears here and on your day queue alike.')}
              </div>
            </div>
          )
          : <TaskList tasks={tasks} ar={ar} t={t} onAct={onAct} onChat={onChat} />}
      </Panel>
    </div>
  );
}

/* ── registering an intake: the act itself, workable in the prototype ──── */
function IntakeForm({ ar, t, onRegister }: {
  ar: boolean; t: (a: string, e: string) => string;
  onRegister: (f: { client: string; from: string; to: string; mode: 'air' | 'land' | 'sea'; weight: number; cartons: number }) => string;
}) {
  const [f, setF] = useState({ client: '', from: 'Dubai', to: 'Damascus', mode: 'air' as 'air' | 'land' | 'sea', weight: '', cartons: '1' });
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const field = (k: keyof typeof f) => (e: { target: { value: string } }) => { setF(v => ({ ...v, [k]: e.target.value })); setErr(null); };
  const submit = () => {
    /* refusal says WHICH field displeased it — a greyed button explains nothing */
    if (!f.client.trim()) { setErr(t('اسم العميل مطلوب — الطرد يُسجَّل على صاحبه.', "The client's name is required — a parcel is recorded to its owner.")); return; }
    const wt = parseFloat(f.weight);
    if (!(wt > 0)) { setErr(t('الوزن مطلوب ويكون أكبر من صفر.', 'A weight above zero is required.')); return; }
    const ct = parseInt(f.cartons, 10);
    if (!(ct > 0)) { setErr(t('عدد الطرود يكون واحداً فأكثر.', 'Cartons must be one or more.')); return; }
    const ref = onRegister({ client: f.client.trim(), from: f.from, to: f.to, mode: f.mode, weight: wt, cartons: ct });
    setLast(ref);
    setF(v => ({ ...v, client: '', weight: '', cartons: '1' }));
  };
  const box: React.CSSProperties = {
    height: 'var(--ctl-h)', padding: '0 var(--s3)', border: '1.5px solid var(--n3)',
    borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-body)', fontFamily: 'inherit',
    background: 'var(--paper)', width: '100%',
  };
  const lbl: React.CSSProperties = { fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: 'var(--s1)' };
  return (
    <section style={{
      background: 'var(--paper)', border: '1px solid var(--n3)', borderRadius: 'var(--radius)',
      boxShadow: 'var(--sh-1)', overflow: 'hidden', marginBottom: 'var(--s5)',
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', padding: 'var(--s3) var(--s4)', borderBottom: '1px solid var(--n2)' }}>
        <span aria-hidden style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', background: 'var(--green-tint)', color: 'var(--green-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Boxes size={14} />
        </span>
        <div style={{ flex: 1, lineHeight: 1.2 }}>
          <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n5)', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{t('الفعل', 'The act')}</div>
          <div style={{ fontSize: 'var(--fs-lead)', fontWeight: 800 }}>{t('سجّل استلام طرد', 'Record a parcel intake')}</div>
        </div>
        {last && <span className="machine" style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--green-deep)', background: 'var(--green-tint)', padding: '3px 9px', borderRadius: 'var(--radius-pill)', fontWeight: 800 }}>{last}</span>}
      </header>
      <div style={{ padding: 'var(--s4) var(--s5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--s3)' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={lbl}>{t('العميل', 'Client')}</label>
            <input value={f.client} onChange={field('client')} onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              placeholder={t('اسم صاحب الطرد', "The parcel owner's name")} style={box} />
          </div>
          <div>
            <label style={lbl}>{t('من', 'From')}</label>
            <select value={f.from} onChange={field('from')} style={box}>
              {['Dubai', 'Istanbul', 'Yiwu', 'Charlotte'].map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>{t('إلى', 'To')}</label>
            <select value={f.to} onChange={field('to')} style={box}>
              {['Damascus', 'Aleppo', 'Homs', 'Latakia'].map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>{t('الوسيلة', 'Mode')}</label>
            <select value={f.mode} onChange={field('mode')} style={box}>
              <option value="air">{t('جوي', 'Air')}</option>
              <option value="land">{t('بري', 'Land')}</option>
              <option value="sea">{t('بحري', 'Sea')}</option>
            </select>
          </div>
          <div>
            <label style={lbl}>{t('الوزن kg', 'Weight kg')}</label>
            <input value={f.weight} onChange={field('weight')} inputMode="decimal" placeholder="0.0" className="machine" style={box} />
          </div>
          <div>
            <label style={lbl}>{t('الطرود', 'Cartons')}</label>
            <input value={f.cartons} onChange={field('cartons')} inputMode="numeric" className="machine" style={box} />
          </div>
        </div>
        {err && (
          <div role="alert" style={{
            marginTop: 'var(--s3)', fontSize: 'var(--fs-hint)', fontWeight: 700,
            color: 'var(--red-deep)', background: 'var(--red-tint)',
            padding: 'var(--s2) var(--s3)', borderRadius: 'var(--radius-sm)',
          }}>{err}</div>
        )}
        <div style={{ marginTop: 'var(--s4)' }}>
          <button onClick={submit} style={{
            height: 'var(--ctl-h)', padding: '0 var(--s6)', background: 'var(--sky)', color: 'var(--ink)',
            borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-body)', fontWeight: 800,
            transition: 'filter var(--t-state) var(--ease)',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = ''; }}>
            {t('سجّل الاستلام', 'Record the intake')}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── the act, performed where it belongs ────────────────────────────────
   The verb on a queue row brings the person HERE, to the owning service,
   with the task in hand. The flow below is the act itself — pick the trip,
   record the measure, decide the failed delivery — and only completing it
   clears the row from the queue. */
function ActFlow({ task, ar, t, onComplete }: {
  task: Task; ar: boolean; t: (a: string, e: string) => string;
  onComplete: (x: Task, text: string) => void;
}) {
  const [tripPick, setTripPick] = useState(openTrips[0].ref);
  const [wt, setWt] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const box: React.CSSProperties = {
    height: 'var(--ctl-h)', padding: '0 var(--s3)', border: '1.5px solid var(--n3)',
    borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-body)', fontFamily: 'inherit', background: 'var(--paper)',
  };
  const primary: React.CSSProperties = {
    height: 'var(--ctl-h)', padding: '0 var(--s5)', background: 'var(--sky)', color: 'var(--ink)',
    borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-body)', fontWeight: 800,
  };
  const done = (txtAr: string, txtEn: string) =>
    onComplete(task, (ar ? txtAr : txtEn) + ' — ' + task.ref + (ar ? ' خرج من طابورك' : ' left your queue'));
  return (
    <section aria-label={t('تنفيذ', 'Act')} style={{
      background: 'var(--paper)', border: '1.5px solid var(--sky)', borderRadius: 'var(--radius)',
      boxShadow: 'var(--sh-2)', overflow: 'hidden', marginBottom: 'var(--s5)',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 'var(--s3)',
        padding: 'var(--s3) var(--s4)', background: 'var(--sky-tint)', borderBottom: '1px solid var(--n2)',
      }}>
        <span aria-hidden style={{
          width: 26, height: 26, borderRadius: 'var(--radius-sm)', background: 'var(--sky)',
          color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Timer size={14} /></span>
        <div style={{ flex: 1, lineHeight: 1.25 }}>
          <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--sky-deep)', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {t('المهمة بين يديك', 'The task in hand')}
          </div>
          <div style={{ fontSize: 'var(--fs-lead)', fontWeight: 800 }}>{ar ? task.ar : task.en}</div>
        </div>
        <span className="machine" style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)' }}>{task.ref}</span>
      </header>

      <div style={{ padding: 'var(--s4) var(--s5)' }}>
        {task.kind === 'document' && task.open === 'ShopyLink_Action_03_CreateTrip.html' && (
          <>
            <div style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)', marginBottom: 'var(--s3)' }}>
              {t('أضف الحمولة إلى رحلة ما تزال تُحمَّل، أو أنشئ رحلة جديدة لها.', 'Add the load to a trip still boarding, or create a new trip for it.')}
            </div>
            <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)', marginBottom: 'var(--s4)' }}>
              {openTrips.map(tr => (
                <label key={tr.ref} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--s3)', padding: 'var(--s3) var(--s4)',
                  border: '1.5px solid ' + (tripPick === tr.ref ? 'var(--sky)' : 'var(--n3)'),
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: tripPick === tr.ref ? 'var(--sky-tint)' : 'var(--paper)',
                  transition: 'border-color var(--t-state) var(--ease), background var(--t-state) var(--ease)',
                }}>
                  <input type="radio" name="trip" checked={tripPick === tr.ref} onChange={() => setTripPick(tr.ref)} style={{ accentColor: 'var(--sky)' }} />
                  <span className="machine" style={{ fontWeight: 700 }}>{tr.ref}</span>
                  <span style={{ flex: 1, fontSize: 'var(--fs-hint)', color: 'var(--n7)' }}>{tr.to} · {ar ? tr.departsAr : tr.departsEn}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap' }}>
              <button style={primary} onClick={() => done('حُمِّلت على ' + tripPick, 'Loaded onto ' + tripPick)}>
                {t('أضفها إلى هذه الرحلة', 'Add it to this trip')}
              </button>
              <button style={{ ...primary, background: 'var(--paper)', border: '1.5px solid var(--n3)', color: 'var(--n7)', fontWeight: 700 }}
                onClick={() => {
                  const ref = 'TRP-' + String(new Date().getMonth() + 1).padStart(2, '0') + String(new Date().getDate()).padStart(2, '0') + '-0' + (openTrips.length + 1);
                  done('أُنشئت الرحلة ' + ref + ' وحُمِّلت عليها', 'Trip ' + ref + ' created and loaded');
                }}>
                {t('أنشئ رحلة جديدة وأضفها', 'Create a new trip and add it')}
              </button>
            </div>
          </>
        )}

        {task.kind === 'measure' && (
          <>
            <div style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)', marginBottom: 'var(--s3)' }}>
              {t('سجّل الوزن المقيس — القياس هو ما يُفوتَر عليه.', 'Record the measured weight — the measure is what gets invoiced.')}
            </div>
            <div style={{ display: 'flex', gap: 'var(--s3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)', fontWeight: 800, display: 'block', marginBottom: 'var(--s1)' }}>{t('الوزن kg', 'Weight kg')}</label>
                <input value={wt} onChange={e => { setWt(e.target.value); setErr(null); }} inputMode="decimal" placeholder="0.0" className="machine" style={{ ...box, width: 140 }} />
              </div>
              <button style={primary} onClick={() => {
                const v = parseFloat(wt);
                if (!(v > 0)) { setErr(t('الوزن مطلوب ويكون أكبر من صفر.', 'A weight above zero is required.')); return; }
                done('سُجّل القياس ' + v.toFixed(1) + ' kg', 'Measured at ' + v.toFixed(1) + ' kg');
              }}>{t('سجّل القياس', 'Record the measure')}</button>
            </div>
          </>
        )}

        {task.kind === 'deliver' && (
          <>
            <div style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)', marginBottom: 'var(--s3)' }}>
              {t('محاولتان أخفقتا — القرار لك.', 'Two attempts failed — the decision is yours.')}
            </div>
            <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <button style={primary} onClick={() => done('جُدولت محاولة ثالثة', 'A third attempt is scheduled')}>
                {t('جدولة محاولة ثالثة', 'Schedule a third attempt')}
              </button>
              <div style={{ display: 'flex', gap: 'var(--s2)', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)', fontWeight: 800, display: 'block', marginBottom: 'var(--s1)' }}>{t('سبب الإرجاع', 'Return reason')}</label>
                  <input value={reason} onChange={e => { setReason(e.target.value); setErr(null); }}
                    placeholder={t('إلزامي عند الإرجاع', 'Required to return')} style={{ ...box, width: 220 }} />
                </div>
                <button style={{ ...primary, background: 'var(--red-tint)', color: 'var(--red-deep)' }} onClick={() => {
                  if (!reason.trim()) { setErr(t('الإرجاع يحتاج سبباً مكتوباً.', 'A return needs a written reason.')); return; }
                  done('أُرجعت إلى المرسل: ' + reason.trim(), 'Returned to sender: ' + reason.trim());
                }}>{t('إرجاع إلى المرسل', 'Return to sender')}</button>
              </div>
            </div>
          </>
        )}

        {task.kind === 'approve' && (
          <button style={primary} onClick={() => done('وُقّع الطلب', 'Signed')}>{t('وقّع', 'Sign')}</button>
        )}

        {task.kind === 'document' && task.open !== 'ShopyLink_Action_03_CreateTrip.html' && (
          <>
            <div style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)', marginBottom: 'var(--s3)' }}>
              {t('نفّذ الخطوة هنا ثم سجّل إتمامها — التسجيل هو ما يُخرجها من الطابور.', 'Do the step here, then record it done — the record is what clears the queue.')}
            </div>
            <button style={primary} onClick={() => done('سُجّل الإتمام', 'Recorded done')}>
              {t('سجّل الإتمام', 'Record it done')}
            </button>
          </>
        )}

        {err && (
          <div role="alert" style={{
            marginTop: 'var(--s3)', fontSize: 'var(--fs-hint)', fontWeight: 700,
            color: 'var(--red-deep)', background: 'var(--red-tint)',
            padding: 'var(--s2) var(--s3)', borderRadius: 'var(--radius-sm)',
          }}>{err}</div>
        )}
      </div>
    </section>
  );
}
