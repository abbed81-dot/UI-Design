import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, MessageSquare, Pin, PinOff, ChevronDown, PanelRightClose, PanelRightOpen,
  AlertTriangle, Inbox, Ruler, Truck, MapPin, Wallet, Network, Settings2,
  ChevronRight, ChevronLeft, Send, X, CircleCheckBig, MoreVertical,
} from 'lucide-react';
import { Mark } from '@/components/Mark';
import { CATEGORIES, type Item } from '@/lib/modules';
import { LOCKUP_AR } from '@/lib/lockup_ar';
import { LOCKUP_EN } from '@/lib/lockup_en';
import { dayTasks, dayNotice, dayFigures, dayMe, dayThreads, denseTasks, type Task } from '@/lib/day';
import { readState, writeState, type SavedState } from '@/lib/store';

/* ─────────────────────────────────────────────────────────────────────
   ShopyLink operations console · v2 · screen one: the operator's home.
   Swiss structure at data-dense values. Every colour, size and duration
   comes from tokens.css, which is the identity sheet verbatim.
   ───────────────────────────────────────────────────────────────────── */

type Lang = 'ar' | 'en';
type Preview = 'normal' | 'empty' | 'loading' | 'error' | 'dense';
const PAGE = 25;

const CAT_ICONS: Record<string, typeof Inbox> = {
  intake: Inbox, trips: Truck, destination: MapPin, money: Wallet, network: Network, admin: Settings2,
};

function lateLabel(ms: number, ar: boolean): { text: string; tone: 'red' | 'amber' | 'green' } {
  const h = Math.round(Math.abs(ms) / 3600000);
  if (ms < 0) {
    const t = ar
      ? 'خلال ' + (h === 1 ? 'ساعة' : h === 2 ? 'ساعتين' : h + ' ساعات')
      : 'in ' + h + 'h';
    return { text: t, tone: 'green' };
  }
  const plural = (n: number, one: string, two: string, few: string, many: string) =>
    n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? n + ' ' + few : n + ' ' + many;
  if (h < 24) {
    return {
      text: ar ? 'متأخّر ' + plural(h, 'ساعة', 'ساعتين', 'ساعات', 'ساعة') : h + 'h late',
      tone: h >= 6 ? 'red' : 'amber',
    };
  }
  const d = Math.floor(h / 24);
  return { text: ar ? 'متأخّر ' + plural(d, 'يومًا', 'يومين', 'أيام', 'يومًا') : d + 'd late', tone: 'red' };
}

export default function App() {
  const saved = useMemo<SavedState>(() => readState(), []);
  const [lang, setLang] = useState<Lang>(saved.lang ?? 'ar');
  const [rail, setRail] = useState<boolean>(saved.rail ?? false);
  const [pinned, setPinned] = useState<string[]>(saved.pinned ?? []);
  const [openCat, setOpenCat] = useState<string | null>('intake');
  const [chat, setChat] = useState<Task | null>(null);
  const [finder, setFinder] = useState(false);
  const [preview, setPreview] = useState<Preview>('normal');
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const ar = lang === 'ar';

  useEffect(() => {
    document.documentElement.setAttribute('dir', ar ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [ar, lang]);

  useEffect(() => {
    writeState({ lang, pinned, rail, whoId: dayMe.id });
  }, [lang, pinned, rail]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ⌘K everywhere: a search you must aim at is one you stop using */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setFinder(v => !v); }
      if (e.key === 'Escape') { setFinder(false); setChat(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const t = useCallback((a: string, e: string) => (ar ? a : e), [ar]);

  const togglePin = useCallback((file: string) => {
    setPinned(prev => {
      if (prev.indexOf(file) > -1) return prev.filter(f => f !== file);
      const next = [...prev, file];
      if (next.length > 5) {
        next.shift();
        setToast(ar ? 'خمسة حدّ التثبيت — استُبدل الأقدم' : 'Five is the pin limit — the oldest was replaced');
      }
      return next;
    });
  }, [ar]);

  const openModule = useCallback((file: string) => {
    window.open(file, '_blank', 'noopener');
  }, []);

  const allItems = useMemo(() => CATEGORIES.flatMap(c => c.items), []);
  const pinnedItems = useMemo(
    () => pinned.map(f => allItems.filter(i => i.file === f)[0]).filter(Boolean) as Item[],
    [pinned, allItems],
  );

  const tasks: Task[] = useMemo(() => {
    if (preview === 'empty') return [];
    if (preview === 'dense') return denseTasks();
    return dayTasks;
  }, [preview]);
  const pages = Math.max(1, Math.ceil(tasks.length / PAGE));
  const shown = tasks.slice(page * PAGE, page * PAGE + PAGE);
  useEffect(() => { setPage(0); }, [preview]);

  /* an operator holds no grant filter in the demo — every category shows;
     the grant gate is exercised by the person switch in screens two/three */

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--cream)' }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════ */}
      <aside style={{
        width: rail ? 'var(--rail-w)' : 'var(--sb-w)', flex: '0 0 auto',
        background: 'var(--ink)', color: 'var(--paper)',
        display: 'flex', flexDirection: 'column',
        transition: 'width var(--t-panel) var(--ease)', overflow: 'hidden',
      }}>
        {/* the lockup — the asset, swapped with the language, never drawn */}
        <div style={{ padding: rail ? 'var(--s3) var(--s2)' : 'var(--s4)', display: 'flex', alignItems: 'center', minHeight: 56 }}>
          {rail
            ? <Mark size={22} />
            : <img src={ar ? LOCKUP_AR : LOCKUP_EN} alt="ShopyLink" style={{ height: 26, width: 'auto', display: 'block' }} />}
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 var(--s2)' }}>
          {/* ★ pinned — appears only once something is pinned */}
          {pinnedItems.length > 0 && !rail && (
            <div style={{ marginBottom: 'var(--s4)' }}>
              <div style={{
                fontSize: 'var(--fs-eyebrow)', letterSpacing: '.1em', textTransform: 'uppercase',
                color: 'var(--acc)', padding: 'var(--s2)', fontWeight: 800,
              }}>
                {t('المثبَّتة', 'Pinned')}
              </div>
              {pinnedItems.map(it => (
                <SideItem key={'pin-' + it.file} label={ar ? it.ar : it.en} onOpen={() => openModule(it.file)}
                  pinned onTogglePin={() => togglePin(it.file)} ar={ar} />
              ))}
              <div style={{ height: 1, background: 'rgba(244,251,255,.12)', margin: 'var(--s2) var(--s2) 0' }} />
            </div>
          )}

          {/* the seven: six categories + search at the foot */}
          {CATEGORIES.map(c => {
            const Icon = CAT_ICONS[c.id] || Inbox;
            const open = openCat === c.id && !rail;
            return (
              <div key={c.id}>
                <button
                  onClick={() => (rail ? (setRail(false), setOpenCat(c.id)) : setOpenCat(open ? null : c.id))}
                  title={ar ? c.ar : c.en}
                  aria-expanded={open}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--s3)', width: '100%',
                    height: 'var(--row-h)', padding: '0 var(--s2)', borderRadius: 'var(--radius-sm)',
                    color: open ? 'var(--paper)' : 'var(--n4)', fontWeight: 700, fontSize: 'var(--fs-hint)',
                    background: open ? 'rgba(244,251,255,.07)' : 'transparent',
                    transition: 'background var(--t-state) var(--ease), color var(--t-state) var(--ease)',
                  }}
                >
                  <Icon size={15} style={{ flex: '0 0 auto' }} />
                  {!rail && <span style={{ flex: 1, textAlign: 'start' }}>{ar ? c.ar : c.en}</span>}
                  {!rail && <ChevronDown size={13} style={{
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform var(--t-panel) var(--ease)', color: 'var(--n5)',
                  }} />}
                </button>
                <div style={{
                  display: 'grid', gridTemplateRows: open ? '1fr' : '0fr',
                  transition: 'grid-template-rows var(--t-panel) var(--ease)',
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    {c.items.map(it => (
                      <SideItem key={it.file} label={ar ? it.ar : it.en} indent
                        onOpen={() => openModule(it.file)}
                        pinned={pinned.indexOf(it.file) > -1}
                        onTogglePin={() => togglePin(it.file)} ar={ar} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          <button onClick={() => setFinder(true)} title={t('بحث', 'Search')} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s3)', width: '100%',
            height: 'var(--row-h)', padding: '0 var(--s2)', borderRadius: 'var(--radius-sm)',
            color: 'var(--n4)', fontWeight: 700, fontSize: 'var(--fs-hint)', marginTop: 'var(--s2)',
          }}>
            <Search size={15} />
            {!rail && <span style={{ flex: 1, textAlign: 'start' }}>{t('بحث شامل', 'Search everything')}</span>}
            {!rail && <kbd className="machine" style={{ fontSize: 10, color: 'var(--n6)' }}>⌘K</kbd>}
          </button>
        </nav>

        <div style={{ padding: 'var(--s2)' }}>
          <button onClick={() => setRail(v => !v)} title={t('طيّ الشريط', 'Collapse')} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s3)', width: '100%',
            height: 'var(--row-h)', padding: '0 var(--s2)', borderRadius: 'var(--radius-sm)',
            color: 'var(--n5)', fontSize: 'var(--fs-hint)', fontWeight: 700,
          }}>
            {rail ? <PanelRightOpen size={15} /> : <PanelRightClose size={15} />}
            {!rail && <span>{t('طيّ', 'Collapse')}</span>}
          </button>
        </div>
      </aside>

      {/* ══ PAGE ═════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* topbar */}
        <header style={{
          height: 'var(--top-h)', flex: '0 0 auto', display: 'flex', alignItems: 'center',
          gap: 'var(--s3)', padding: '0 var(--s6)', background: 'var(--paper)',
          borderBottom: '1px solid var(--n3)', boxShadow: 'var(--sh-1)', zIndex: 2,
        }}>
          <button onClick={() => setFinder(true)} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s2)', height: 32, minWidth: 260,
            padding: '0 var(--s3)', border: '1.5px solid var(--n3)', borderRadius: 'var(--radius-sm)',
            color: 'var(--n6)', fontSize: 'var(--fs-hint)', background: 'var(--cream)',
            transition: 'border-color var(--t-state) var(--ease)',
          }}>
            <Search size={14} />
            <span style={{ flex: 1, textAlign: 'start' }}>{t('خدمة أو شحنة برقمها…', 'A service, or a shipment by its number…')}</span>
            <kbd className="machine" style={{ fontSize: 10, color: 'var(--n5)' }}>⌘K</kbd>
          </button>
          <div style={{ flex: 1 }} />
          <span style={{
            background: 'var(--amber-tint)', color: 'var(--amber-deep)', padding: '4px 10px',
            borderRadius: 'var(--radius-pill)', fontSize: 'var(--fs-eyebrow)', fontWeight: 800,
            letterSpacing: '.06em',
          }}>
            {t('بيانات تجريبية', 'DEMONSTRATION DATA')}
          </span>
          <button onClick={() => setLang(ar ? 'en' : 'ar')} style={{
            height: 32, padding: '0 var(--s3)', border: '1.5px solid var(--n3)',
            borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-hint)', fontWeight: 800,
          }}>
            {ar ? 'EN' : 'ع'}
          </button>
          <div style={{ textAlign: ar ? 'left' : 'right', lineHeight: 1.25 }}>
            <div style={{ fontSize: 'var(--fs-hint)', fontWeight: 800 }}>{dayMe.name}</div>
            <div className="machine" style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)' }}>
              {dayMe.role} · L{dayMe.level}
            </div>
          </div>
        </header>

        {/* body */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 'var(--s6)' }}>
          <div style={{ maxWidth: 980, marginInline: 'auto' }}>

            {/* ① needs action */}
            <section style={{ marginBottom: 'var(--s7)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s3)', marginBottom: 'var(--s3)' }}>
                <h2 style={{ font: `800 var(--fs-title)/1.2 ${ar ? 'var(--ar)' : 'var(--disp)'}`, margin: 0 }}>
                  {t('يحتاج إجراء', 'Needs action')}
                </h2>
                <span className="machine" style={{ fontSize: 'var(--fs-lead)', color: 'var(--n6)', fontWeight: 600 }}>
                  {preview === 'loading' ? '—' : tasks.length}
                </span>
              </div>

              <div style={{
                background: 'var(--paper)', border: '1px solid var(--n3)',
                borderRadius: 'var(--radius)', boxShadow: 'var(--sh-1)', overflow: 'hidden',
              }}>
                {preview === 'error' && (
                  <div role="alert" style={{
                    display: 'flex', gap: 'var(--s3)', alignItems: 'flex-start',
                    background: 'var(--red-tint)', color: 'var(--red-deep)',
                    padding: 'var(--s4)', fontSize: 'var(--fs-hint)',
                    borderBottom: '1px solid var(--n3)',
                  }}>
                    <AlertTriangle size={15} style={{ flex: '0 0 auto', marginTop: 2 }} />
                    <div>
                      <b>{t('قناة لم تُقرأ', 'A channel could not be read')}</b>
                      <div style={{ marginTop: 'var(--s1)' }}>
                        {t('منشورة بشكل لا تستطيع هذه الصفحة قراءته. مالكها ينشرها، والكونسول لا يصلحها — وما يلي يومٌ تجريبي.',
                           'Published in a shape this page cannot read. Its owner publishes it; the console does not repair it — what follows is a demonstration day.')}
                      </div>
                      <div className="machine" style={{ marginTop: 'var(--s1)', fontWeight: 600 }}>SL_SHIPMENTS_V1 — Unexpected end of JSON input</div>
                    </div>
                  </div>
                )}

                {preview === 'loading' && Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--s4)',
                    height: 'var(--row-h)', padding: '0 var(--s4)',
                    borderTop: i ? '1px solid var(--n2)' : 'none',
                  }}>
                    <div className="skeleton" style={{ width: '38%', height: 12 }} />
                    <div className="skeleton" style={{ width: 110, height: 12 }} />
                    <div style={{ flex: 1 }} />
                    <div className="skeleton" style={{ width: 72, height: 20, borderRadius: 'var(--radius-pill)' }} />
                    <div className="skeleton" style={{ width: 56, height: 24 }} />
                  </div>
                ))}

                {preview !== 'loading' && shown.length === 0 && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 'var(--s3)', padding: 'var(--s8) var(--s6)', color: 'var(--n6)',
                  }}>
                    <CircleCheckBig size={28} strokeWidth={1.5} style={{ color: 'var(--green)' }} />
                    <div style={{ fontSize: 'var(--fs-lead)', fontWeight: 700, color: 'var(--ink)' }}>
                      {t('لا شيء متأخّر — وهذا هو المقصود.', 'Nothing is overdue — which is the point.')}
                    </div>
                    <div style={{ fontSize: 'var(--fs-hint)' }}>
                      {t('ما يصل مركزك يظهر هنا لحظة وصوله.', 'What reaches your centre appears here the moment it does.')}
                    </div>
                  </div>
                )}

                {preview !== 'loading' && shown.map((task, i) => {
                  const late = lateLabel(task.lateMs, ar);
                  return (
                    <div key={task.id} style={{
                      position: 'relative', display: 'flex', alignItems: 'center', gap: 'var(--s4)',
                      minHeight: 'var(--row-h)', padding: '0 var(--s4)',
                      borderTop: i ? '1px solid var(--n2)' : 'none',
                      transition: 'background var(--t-state) var(--ease)',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                      {/* severity stripe on the logical start edge */}
                      <span aria-hidden style={{
                        position: 'absolute', insetInlineStart: 0, top: 6, bottom: 6, width: 3,
                        borderRadius: 'var(--radius-pill)',
                        background: late.tone === 'red' ? 'var(--red)' : late.tone === 'amber' ? 'var(--amber)' : 'var(--green)',
                      }} />
                      <span style={{ flex: 1, fontSize: 'var(--fs-body)', fontWeight: 500, paddingInlineStart: 'var(--s2)' }}>
                        {ar ? task.ar : task.en}
                      </span>
                      <button className="machine" title={t('انسخ المرجع', 'Copy the reference')}
                        onClick={() => { try { navigator.clipboard.writeText(task.ref); setToast(t('نُسخ ', 'Copied ') + task.ref); } catch (e) { /* fine */ } }}
                        style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)', background: 'none', padding: 0 }}>
                        {task.ref}
                      </button>
                      <span style={{
                        fontSize: 'var(--fs-eyebrow)', fontWeight: 800, whiteSpace: 'nowrap',
                        padding: '3px 9px', borderRadius: 'var(--radius-pill)',
                        color: late.tone === 'red' ? 'var(--red-deep)' : late.tone === 'amber' ? 'var(--amber-deep)' : 'var(--green-deep)',
                        background: late.tone === 'red' ? 'var(--red-tint)' : late.tone === 'amber' ? 'var(--amber-tint)' : 'var(--green-tint)',
                      }}>
                        {late.text}
                      </span>
                      <button onClick={() => setChat(task)} title={t('المحادثة', 'Thread')} aria-label={t('المحادثة', 'Thread')}
                        style={{ color: 'var(--n5)', display: 'flex', transition: 'color var(--t-state) var(--ease)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--sky-deep)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--n5)'; }}>
                        <MessageSquare size={15} />
                      </button>
                      <button onClick={() => openModule(task.open)} style={{
                        height: 26, padding: '0 var(--s3)', background: 'var(--sky)',
                        color: 'var(--ink)', /* ink on sky = 5.38:1 — white fails at 2.77 */
                        borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-hint)', fontWeight: 800,
                        transition: 'filter var(--t-state) var(--ease)',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = ''; }}>
                        {ar ? task.verbAr : task.verbEn}
                      </button>
                    </div>
                  );
                })}

                {preview !== 'loading' && tasks.length > PAGE && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--s2) var(--s4)', borderTop: '1px solid var(--n2)',
                    fontSize: 'var(--fs-hint)', color: 'var(--n6)',
                  }}>
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      title={t('السابق', 'Previous')} style={{ display: 'flex', opacity: page === 0 ? .35 : 1 }}>
                      {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                    <span className="machine">{page * PAGE + 1}–{Math.min(tasks.length, (page + 1) * PAGE)} / {tasks.length}</span>
                    <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}
                      title={t('التالي', 'Next')} style={{ display: 'flex', opacity: page >= pages - 1 ? .35 : 1 }}>
                      {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* ② the management's word — on the page, not buried in a bell */}
            <section style={{ marginBottom: 'var(--s7)' }}>
              <div style={{
                background: 'var(--clean)', border: '1px solid var(--n3)',
                borderInlineStart: '3px solid var(--sky)',
                borderRadius: 'var(--radius)', padding: 'var(--s4) var(--s5)', boxShadow: 'var(--sh-1)',
              }}>
                <div className="machine" style={{
                  fontSize: 'var(--fs-eyebrow)', color: 'var(--sky-deep)', fontWeight: 800,
                  letterSpacing: '.08em', textTransform: 'uppercase',
                }}>{dayNotice.kind}</div>
                <div style={{ margin: 'var(--s2) 0', fontSize: 'var(--fs-lead)', fontWeight: 600, lineHeight: 1.55 }}>
                  {ar ? dayNotice.ar : dayNotice.en}
                </div>
                <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)' }}>
                  {dayNotice.by} · <span className="machine">{dayNotice.at}</span>
                </div>
              </div>
            </section>

            {/* ③ his figures, last — and every one a door */}
            <section>
              <div style={{ display: 'flex', gap: 'var(--s4)', flexWrap: 'wrap' }}>
                {dayFigures.map(f => (
                  <button key={f.en} onClick={() => setToast(t('يفتح القائمة خلف الرقم — في الشاشة الموصولة', 'Opens the list behind the figure — in the wired screen'))}
                    style={{
                      flex: '1 1 180px', textAlign: 'start', background: 'var(--paper)',
                      border: '1px solid var(--n3)', borderRadius: 'var(--radius)',
                      padding: 'var(--s4) var(--s5)', boxShadow: 'var(--sh-1)',
                      transition: 'border-color var(--t-state) var(--ease), box-shadow var(--t-state) var(--ease)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--n5)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--n3)'; }}>
                    <div style={{
                      fontSize: 'var(--fs-eyebrow)', color: 'var(--n6)', fontWeight: 800,
                      letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 'var(--s1)',
                    }}>{ar ? f.ar : f.en}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s2)' }}>
                      <span className="disp machine" style={{ fontSize: 'var(--fs-figure)', fontWeight: 800, lineHeight: 1.1 }}>{f.n}</span>
                      <span aria-hidden style={{
                        width: 8, height: 8, borderRadius: 'var(--radius-pill)',
                        background: f.tone === 'green' ? 'var(--green)' : f.tone === 'amber' ? 'var(--amber)' : 'var(--red)',
                      }} />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ══ CHAT PANEL — context is never left ═══════════════════════ */}
      <aside aria-hidden={!chat} style={{
        width: chat ? 'var(--panel-w)' : 0, flex: '0 0 auto', background: 'var(--paper)',
        borderInlineStart: chat ? '1px solid var(--n3)' : 'none',
        transition: 'width var(--t-panel) var(--ease)', overflow: 'hidden',
        boxShadow: chat ? 'var(--sh-2)' : 'none',
      }}>
        {chat && <ChatPanel task={chat} ar={ar} t={t} onClose={() => setChat(null)} />}
      </aside>

      {/* ══ ⌘K ═══════════════════════════════════════════════════════ */}
      {finder && <Finder ar={ar} t={t} onClose={() => setFinder(false)} onOpen={openModule} />}

      {/* ══ state preview — a review affordance, labelled as one ═════ */}
      <div style={{
        position: 'fixed', insetInlineEnd: 'var(--s4)', bottom: 'var(--s4)', zIndex: 30,
        display: 'flex', alignItems: 'center', gap: 'var(--s1)',
        background: 'var(--ink)', color: 'var(--n4)', borderRadius: 'var(--radius-pill)',
        padding: '4px 6px', boxShadow: 'var(--sh-2)', fontSize: 'var(--fs-eyebrow)',
      }}>
        <span style={{ padding: '0 var(--s2)', fontWeight: 800, letterSpacing: '.06em' }}>
          {t('معاينة الحالات', 'STATE PREVIEW')}
        </span>
        {([['normal', 'طبيعي', 'Normal'], ['empty', 'فارغ', 'Empty'], ['loading', 'تحميل', 'Loading'], ['error', 'خطأ', 'Error'], ['dense', '٥٠٠+', '500+']] as [Preview, string, string][]).map(([k, a, e]) => (
          <button key={k} onClick={() => setPreview(k)} style={{
            padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontWeight: 800, fontSize: 'var(--fs-eyebrow)',
            background: preview === k ? 'var(--sky)' : 'transparent',
            color: preview === k ? 'var(--ink)' : 'var(--n4)',
            transition: 'background var(--t-state) var(--ease), color var(--t-state) var(--ease)',
          }}>
            {ar ? a : e}
          </button>
        ))}
      </div>

      {toast && (
        <div role="status" style={{
          position: 'fixed', insetInlineStart: '50%', bottom: 'var(--s7)', transform: 'translateX(-50%)',
          background: 'var(--ink)', color: 'var(--paper)', borderRadius: 'var(--radius-sm)',
          padding: 'var(--s2) var(--s4)', fontSize: 'var(--fs-hint)', fontWeight: 700,
          boxShadow: 'var(--sh-2)', zIndex: 40,
        }}>{toast}</div>
      )}
    </div>
  );
}

/* ── a sidebar row: label + open + pin, all keyboard-reachable ──────── */
function SideItem({ label, indent, pinned, onOpen, onTogglePin, ar }: {
  label: string; indent?: boolean; pinned?: boolean;
  onOpen: () => void; onTogglePin: () => void; ar: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', height: 34,
        paddingInlineStart: indent ? 'var(--s6)' : 'var(--s2)', paddingInlineEnd: 'var(--s1)',
        borderRadius: 'var(--radius-sm)',
        background: hover ? 'rgba(244,251,255,.07)' : 'transparent',
        transition: 'background var(--t-state) var(--ease)',
      }}
    >
      <button onClick={onOpen} title={label} style={{
        flex: 1, textAlign: 'start', color: 'var(--n2)', fontSize: 'var(--fs-hint)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: 0,
      }}>
        {label}
      </button>
      <button onClick={onTogglePin}
        title={pinned ? (ar ? 'فكّ التثبيت' : 'Unpin') : (ar ? 'ثبّت' : 'Pin')}
        aria-label={pinned ? (ar ? 'فكّ التثبيت' : 'Unpin') : (ar ? 'ثبّت' : 'Pin')}
        style={{
          display: 'flex', padding: 6, color: pinned ? 'var(--acc)' : 'var(--n6)',
          opacity: pinned || hover ? 1 : 0, transition: 'opacity var(--t-state) var(--ease)',
        }}>
        {pinned ? <PinOff size={13} /> : <Pin size={13} />}
      </button>
      {!pinned && !hover && <MoreVertical size={13} style={{ position: 'absolute', opacity: 0 }} aria-hidden />}
    </div>
  );
}

/* ── the thread, beside the work ────────────────────────────────────── */
function ChatPanel({ task, ar, t, onClose }: {
  task: Task; ar: boolean; t: (a: string, e: string) => string; onClose: () => void;
}) {
  const thread = dayThreads[task.ref] || [];
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<{ by: string; at: string; ar: string; en: string }[]>([]);
  const all = [...thread, ...sent];
  return (
    <div style={{ width: 'var(--panel-w)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 'var(--s2)',
        padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--n2)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--fs-lead)', fontWeight: 800, lineHeight: 1.35 }}>{ar ? task.ar : task.en}</div>
          <div className="machine" style={{ fontSize: 'var(--fs-hint)', color: 'var(--n6)', marginTop: 2 }}>{task.ref}</div>
        </div>
        <button onClick={onClose} title={t('إغلاق', 'Close')} aria-label={t('إغلاق', 'Close')} style={{ color: 'var(--n6)', display: 'flex', padding: 4 }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s4) var(--s5)', display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
        {all.length === 0 && (
          <div style={{ color: 'var(--n6)', fontSize: 'var(--fs-hint)', textAlign: 'center', paddingTop: 'var(--s6)' }}>
            {t('لا محادثة بعد — ابدأها.', 'No thread yet — start it.')}
          </div>
        )}
        {all.map((m, i) => {
          const mine = m.by === dayMe.name;
          return (
            <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div style={{
                background: mine ? 'var(--sky-tint)' : 'var(--n1)',
                border: '1px solid ' + (mine ? 'var(--sky)' : 'var(--n2)'),
                borderRadius: 'var(--radius)', padding: 'var(--s2) var(--s3)',
                fontSize: 'var(--fs-hint)', lineHeight: 1.55,
              }}>
                {ar ? m.ar : m.en}
              </div>
              <div style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--n5)', marginTop: 2, paddingInline: 'var(--s1)' }}>
                {m.by} · <span className="machine">{m.at}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: 'var(--s3) var(--s4)', borderTop: '1px solid var(--n2)', display: 'flex', gap: 'var(--s2)' }}>
        <input
          value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) { setSent(s => [...s, { by: dayMe.name, at: t('الآن', 'now'), ar: draft, en: draft }]); setDraft(''); } }}
          placeholder={t('اكتب — تُحفظ عبر لوحة التحكم', 'Write — recorded through the control board')}
          style={{
            flex: 1, height: 34, padding: '0 var(--s3)', border: '1.5px solid var(--n3)',
            borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-hint)', background: 'var(--paper)',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={() => { if (draft.trim()) { setSent(s => [...s, { by: dayMe.name, at: t('الآن', 'now'), ar: draft, en: draft }]); setDraft(''); } }}
          title={t('أرسل', 'Send')} aria-label={t('أرسل', 'Send')}
          style={{
            width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--sky)', color: 'var(--ink)', borderRadius: 'var(--radius-sm)',
          }}>
          <Send size={15} style={{ transform: ar ? 'scaleX(-1)' : 'none' }} />
        </button>
      </div>
    </div>
  );
}

/* ── ⌘K: one search for the whole system ────────────────────────────── */
function Finder({ ar, t, onClose, onOpen }: {
  ar: boolean; t: (a: string, e: string) => string; onClose: () => void; onOpen: (f: string) => void;
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
                <span style={{ color: 'var(--n6)', fontSize: 'var(--fs-hint)' }}>
                  {t('افتحها في لوحة التحكم', 'Open it on the control board')}
                </span>
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
  return (
    <div style={{
      fontSize: 'var(--fs-eyebrow)', color: 'var(--n5)', fontWeight: 800,
      letterSpacing: '.1em', textTransform: 'uppercase', padding: 'var(--s2) var(--s3) var(--s1)',
    }}>{children}</div>
  );
}
