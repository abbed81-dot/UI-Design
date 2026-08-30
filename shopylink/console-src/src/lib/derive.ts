import type { Person, Shipment, Trip, LogEvent, Approval, Scope } from './channels';

/* ── WHERE a person may act ───────────────────────────────────────────
   C9 owns the scope and publishes it. The console resolves it to a set of
   hubs and never decides it: a second answer to a question the staff register
   already owns is how two screens come to disagree. */

export type Hub = { id: string; name: string; city?: string; country?: string };

export type ResolvedScope = {
  kind: 'all' | 'country' | 'list' | 'unknown';
  hubs: Hub[];
  /* stated rather than left blank when C9 has published no scope for him */
  unknownReason?: string;
};

/* The staff register names a country "Syria"; the hub register names the same
   country "SY". Comparing the two strings answers NO for every hub a centres
   manager actually holds — the same shape as the log naming a client while the
   credit board asked by id. Both sides are resolved through the countries
   register, which owns the mapping, and a name that register does not carry
   falls back to comparing what was published rather than silently matching
   nothing. */
export type CountryRow = { id?: string; iso?: string; en?: string; ar?: string };

function countryKey(v: string | undefined, countries: CountryRow[]): string {
  if (!v) return '';
  const hit = countries.filter(
    (c) => c.iso === v || c.id === v || c.en === v || c.ar === v,
  )[0];
  return (hit?.iso || hit?.id || v).toString().toUpperCase();
}

export function resolveScope(me: Person | null, hubs: Hub[], countries: CountryRow[] = []): ResolvedScope {
  const sc: Scope | undefined = me?.scope;
  if (!sc) {
    return {
      kind: 'unknown',
      hubs: [],
      unknownReason: 'the staff register has published no scope for this person',
    };
  }
  if (sc.type === 'all') return { kind: 'all', hubs: hubs.slice() };
  if (sc.type === 'country') {
    const want = (sc.countries || []).map((c) => countryKey(c, countries));
    return {
      kind: 'country',
      hubs: hubs.filter((h) => want.indexOf(countryKey(h.country, countries)) > -1),
    };
  }
  const want = sc.hubs || [];
  return { kind: 'list', hubs: hubs.filter((h) => want.indexOf(h.id) > -1) };
}

/* ── WHO reports to him ───────────────────────────────────────────────
   reportsTo names a ROLE, not a person: the register says a warehouse clerk
   answers to `hubsup`, and every centres manager is one. Within a scope that
   is the right shape — a manager of the Syrian hubs holds the clerks in them. */
export function reportsOf(me: Person | null, staff: Person[]): Person[] {
  if (!me) return [];
  return staff.filter(
    (p) => p.id !== me.id && p.reportsTo === me.role && p.status !== 'archived',
  );
}

/* ── the actor, resolved ONCE ─────────────────────────────────────────
   The log names the actor — "Khaled Omar" — and the register keys by id —
   U-02. Matching on the name at each caller is how one question came to have
   two right-looking answers on the credit board. Resolved here, once, and a
   name that resolves to nobody is REPORTED rather than dropped: work done by
   somebody the register does not know is exactly what a supervisor must see. */
export type ActorIndex = { byName: Record<string, string>; unknown: string[] };

export function indexActors(staff: Person[], events: LogEvent[]): ActorIndex {
  const byName: Record<string, string> = {};
  staff.forEach((p) => {
    byName[p.name] = p.id;
  });
  const unknown: string[] = [];
  events.forEach((e) => {
    const a = (e.actor || '').trim();
    if (a && !byName[a] && unknown.indexOf(a) === -1) unknown.push(a);
  });
  return { byName, unknown };
}

/* ── how long a stage may sit before it is STOPPED rather than in hand ──
   These are the console's display thresholds and nothing else. The rules that
   decide who owns an item, when it escalates and to whom live in D1, which
   owns them; changing "amber at 70%" belongs there, not here. */
const STAGE_HOURS: Record<string, number> = {
  received: 8,
  consolidated: 24,
  loaded: 12,
  departed: 72,
  arrived: 24,
  cleared: 12,
  assigned: 8,
  delivered: 0,
};
const HOUR = 3600000;

export type PersonWork = {
  person: Person;
  /* what he declared: read off the append-only log, no threshold involved */
  finished: number;
  /* what he last touched, still open, and sitting longer than its stage allows */
  stopped: number;
  /* open work in his duty that nothing has moved yet */
  needsAction: number;
  /* the references behind the two figures that are not zero, so a number on
     this screen can be opened rather than only admired */
  stoppedRefs: string[];
  needsRefs: string[];
};

export function workOf(
  people: Person[],
  events: LogEvent[],
  shipments: Shipment[],
  now: number,
): PersonWork[] {
  /* the last event on each shipment, and who declared it */
  const last: Record<string, LogEvent> = {};
  events.forEach((e) => {
    if (!e.ship) return;
    const prev = last[e.ship];
    if (!prev || e.at >= prev.at) last[e.ship] = e;
  });
  const openShips = shipments.filter((s) => s.open);
  const byShip: Record<string, Shipment> = {};
  shipments.forEach((s) => {
    byShip[s.ship] = s;
  });

  return people.map((p) => {
    const mine = events.filter((e) => e.actor === p.name);
    const stoppedRefs: string[] = [];
    Object.keys(last).forEach((ship) => {
      const e = last[ship];
      const s = byShip[ship];
      if (!s || !s.open || e.actor !== p.name) return;
      const allow = (STAGE_HOURS[s.stage] ?? 24) * HOUR;
      if (allow > 0 && now - e.at > allow) stoppedRefs.push(ship);
    });
    /* work in his duty that carries no event yet — nobody has picked it up */
    const duties = p.duties || [];
    const needsRefs = openShips
      .filter((s) => !last[s.ship])
      .filter((s) => dutyCovers(duties, s.stage))
      .map((s) => s.ship);

    return {
      person: p,
      finished: mine.length,
      stopped: stoppedRefs.length,
      needsAction: needsRefs.length,
      stoppedRefs,
      needsRefs,
    };
  });
}

/* the six kinds of work the control board routes by duty — the same words the
   staff register uses, so a position cannot say one thing on the staff screen
   and receive another here */
function dutyCovers(duties: string[], stage: string): boolean {
  const map: Record<string, string> = {
    received: 'measure',
    consolidated: 'document',
    loaded: 'document',
    departed: 'clear',
    arrived: 'measure',
    cleared: 'deliver',
    assigned: 'deliver',
    delivered: 'invoice',
  };
  const need = map[stage];
  return !!need && duties.indexOf(need) > -1;
}

/* ── what waits on THIS person's signature ───────────────────────────
   Read only. C12 owns the queue and every module files onto it; the console
   shows a person the ones he can actually decide, and files none. */
export function awaitingMe(me: Person | null, approvals: Approval[], scope: ResolvedScope): Approval[] {
  if (!me) return [];
  const hubIds = scope.hubs.map((h) => h.id);
  return approvals.filter((a) => {
    if ((a.status || 'pending') !== 'pending') return false;
    if ((a.level ?? 1) > (me.level ?? 1)) return false;
    /* his own request is not his to sign */
    if (a.by && a.by === me.name) return false;
    if (scope.kind === 'all' || !a.hub) return true;
    return hubIds.indexOf(a.hub) > -1;
  });
}

export type Row = {
  id: string;
  ar: string;
  en: string;
  ref: string;
  lateMs: number;
  open: string;
  kind: 'ship' | 'trip' | 'approval';
};

/* the operator's own list: what he must do now, latest first by how late it is */
export function needsAction(
  shipments: Shipment[],
  trips: Trip[],
  approvals: Approval[],
  me: Person | null,
  scope: ResolvedScope,
  now: number,
): Row[] {
  const rows: Row[] = [];
  shipments.forEach((s) => {
    if (!s.open) return;
    const allow = (STAGE_HOURS[s.stage] ?? 24) * HOUR;
    const late = now - s.at - allow;
    if (s.attempts >= 2) {
      rows.push({
        id: 'F-' + s.ship, ar: 'تسليم أخفق مرّتين', en: 'A delivery that failed twice',
        ref: s.ship, lateMs: Math.max(late, HOUR), open: 'ShopyLink_Action_08_Delivery.html', kind: 'ship',
      });
      return;
    }
    if (allow > 0 && late > 0) {
      rows.push({
        id: 'S-' + s.ship, ar: stageAr(s.stage), en: stageEn(s.stage),
        ref: s.ship, lateMs: late, open: stageFile(s.stage), kind: 'ship',
      });
    }
  });
  trips.forEach((t) => {
    if (t.stage === 'departed' && t.mode === 'sea') {
      rows.push({
        id: 'V-' + t.trip, ar: 'شهادة الوزن لم تُرسل إلى الناقل', en: 'VGM not sent to the carrier',
        ref: t.trip, lateMs: 6 * HOUR, open: 'ShopyLink_Doc_VGM.html', kind: 'trip',
      });
    }
  });
  awaitingMe(me, approvals, scope).forEach((a) => {
    rows.push({
      id: 'A-' + (a.id || ''), ar: 'موافقة تنتظر توقيعك', en: 'An approval waiting on you',
      ref: a.ref || a.id || '', lateMs: a.at ? now - a.at : HOUR,
      open: 'ShopyLink_Action_C12_Approvals.html', kind: 'approval',
    });
  });
  return rows.sort((a, b) => b.lateMs - a.lateMs);
}

function stageAr(stage: string): string {
  const m: Record<string, string> = {
    received: 'طرد مستلَم ينتظر التجميع', consolidated: 'حمولة تنتظر رحلة',
    loaded: 'شاحنة محمّلة لم تغادر', departed: 'رحلة في الطريق تنتظر التخليص',
    arrived: 'شحنة وصلت تنتظر جولة', cleared: 'شحنة مخلَّصة تنتظر التوزيع',
    assigned: 'جولة مسندة لم تبدأ',
  };
  return m[stage] || 'شحنة تنتظر خطوتها التالية';
}
function stageEn(stage: string): string {
  const m: Record<string, string> = {
    received: 'A parcel received, waiting to be consolidated', consolidated: 'A load waiting for a trip',
    loaded: 'A truck loaded and not departed', departed: 'A trip on the road awaiting clearance',
    arrived: 'A shipment arrived, waiting for a round', cleared: 'A shipment cleared, waiting to go out',
    assigned: 'A round assigned and not started',
  };
  return m[stage] || 'A shipment waiting on its next step';
}
function stageFile(stage: string): string {
  const m: Record<string, string> = {
    received: 'ShopyLink_Action_02_Consolidation.html', consolidated: 'ShopyLink_Action_03_CreateTrip.html',
    loaded: 'ShopyLink_Action_05_TripJourney.html', departed: 'ShopyLink_Action_B5_BorderFees.html',
    arrived: 'ShopyLink_Action_07_Dispatcher.html', cleared: 'ShopyLink_Action_08_Delivery.html',
    assigned: 'ShopyLink_Action_08_Delivery.html',
  };
  return m[stage] || 'ShopyLink_D1_Control.html';
}

/* Arabic counts the thing it counts. One is not "1 ساعة" and two is not "2".  */
export function lateLabel(ms: number, ar: boolean): string {
  const h = Math.floor(ms / HOUR);
  if (h < 1) return ar ? 'الآن' : 'now';
  if (!ar) return h < 24 ? `${h}h late` : `${Math.floor(h / 24)}d late`;
  const plural = (n: number, one: string, two: string, few: string, many: string) =>
    n === 1 ? `${n} ${one}` : n === 2 ? `${n} ${two}` : n >= 3 && n <= 10 ? `${n} ${few}` : `${n} ${many}`;
  return h < 24
    ? 'متأخّر ' + plural(h, 'ساعة', 'ساعتين', 'ساعات', 'ساعة')
    : 'متأخّر ' + plural(Math.floor(h / 24), 'يومًا', 'يومين', 'أيام', 'يومًا');
}
