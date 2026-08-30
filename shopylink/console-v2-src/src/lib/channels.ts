/* The console is a WINDOW. It reads what the modules publish and opens those
   modules by filename. It writes to no channel: a console that publishes is a
   second place the truth lives, and two places disagree within a month.

   Every channel is best-effort. With storage blocked, or a channel holding
   something that will not parse, the console still renders on its own seed and
   SAYS SO — a screen of invented figures that does not say so is a lie told in
   numbers. */

export type ChannelFault = { key: string; reason: string };

/* Faults are collected as the channels are read, so the page can name the
   channel that failed rather than rendering a blank. */
export class Reader {
  faults: ChannelFault[] = [];
  blocked = false;

  private raw(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      /* a browser with site data switched off throws on the accessor itself */
      this.blocked = true;
      return null;
    }
  }

  /* Returns the array under `field`, or null when the channel is absent, empty
     or unreadable. Null means "nobody has published this", which is a different
     answer from an empty array, and the caller must be able to tell them apart. */
  list<T>(key: string, field: string): T[] | null {
    const raw = this.raw(key);
    if (!raw) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      this.faults.push({ key, reason: (e as Error).message });
      return null;
    }
    /* the event log is published as a bare array; the registers as {field:[…]} */
    const value = Array.isArray(parsed)
      ? parsed
      : (parsed as Record<string, unknown>)?.[field];
    if (!Array.isArray(value)) {
      if (parsed !== null && typeof parsed === 'object') {
        this.faults.push({ key, reason: `no "${field}" list on the channel` });
      }
      return null;
    }
    return value.length ? (value as T[]) : null;
  }
}

/* ── the shapes the owners publish ───────────────────────────────────── */

export type Scope = { type: 'all' | 'country' | 'list'; countries: string[]; hubs: string[] };

export type Person = {
  id: string;
  name: string;
  role: string;
  level: number;
  status: string;
  onLeave: boolean;
  perms: string[];
  duties: string[];
  dutyAr?: string;
  dutyEn?: string;
  stmt?: string;
  stmtAr?: string;
  reportsTo: string | null;
  /* WHERE he may act — published by C9, which owns it. */
  scope?: Scope;
};

export type Shipment = {
  ship: string;
  client: string;
  from: string;
  to: string;
  mode: string;
  weight?: number;
  cartons?: number;
  stage: string;
  at: number;
  attempts: number;
  open: boolean;
};

export type Country = { id?: string; iso?: string; en?: string; ar?: string };

export type Trip = { trip: string; from?: string; to?: string; stage?: string; at?: number; mode?: string };

export type Notice = {
  id?: string;
  kind?: string;
  ar?: string;
  en?: string;
  by?: string;
  at?: string;
  audience?: { all?: boolean } & Record<string, unknown>;
};

export type Approval = {
  id?: string;
  kind?: string;
  origin?: string;
  ar?: string;
  en?: string;
  level?: number;
  status?: string;
  by?: string;
  at?: number;
  ref?: string;
};

export type LogEvent = {
  id: string;
  at: number;
  type: string;
  trip: string | null;
  ship: string | null;
  client: string | null;
  /* the log names the actor by NAME. The staff register keys by id. Resolving
     that is done once, at the source — see resolveActors(). */
  actor: string;
  payload: Record<string, unknown>;
};

export const CH = {
  staff: 'SL_STAFF_V1',
  shipments: 'SL_SHIPMENTS_V1',
  trips: 'SL_TRIPS_V1',
  notices: 'SL_NOTICES_V1',
  approvals: 'SL_APPROVALS_V1',
  events: 'SL_EVENTS_V1',
  hubs: 'SL_HUBS_V1',
  countries: 'SL_COUNTRIES_V1',
} as const;
