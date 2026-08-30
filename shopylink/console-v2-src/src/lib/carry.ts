/* Carrying the package's own modules — and listening to what they publish.

   The console draws no form of its own. It decompresses the real file and
   shows it inside a same-origin frame, so the module keeps its own design,
   its own validation and its own act. Because the frame shares this origin,
   it reads and writes the very same SL_* channels — which is how the console
   learns that the work was actually done, rather than being told by a button
   the console drew itself. */
import { MODULE_GZ } from './modules_html';

export const EVENTS_KEY = 'SL_EVENTS_V1';
export const SHIPMENTS_KEY = 'SL_SHIPMENTS_V1';
export const TRIPS_KEY = 'SL_TRIPS_V1';
export const NOTICES_KEY = 'SL_NOTICES_V1';

export function hasModule(file: string): boolean {
  return Object.prototype.hasOwnProperty.call(MODULE_GZ, file);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ── merging, not redrawing ─────────────────────────────────────────────
   Every module carries its own shell: a navy sidebar, a topbar with its own
   breadcrumb, language switch and date. Inside the console that shell is a
   SECOND one — two sidebars on one screen, two languages side by side. The
   sheet below folds the module's shell away and leaves its working surface,
   which is the part the console came for. Nothing of the form is touched:
   no colour, no spacing, no control is overridden — only the chrome that the
   console already provides is told to stand down. The module's own layout is
   a flex row, so the working column simply takes the width the sidebar left. */
const MERGE_SHEET = `<style id="sl-console-merge">
  /* the console owns navigation; the module's shell stands down */
  .sl-sb, .sl-overlay, .sl-top { display: none !important; }
  /* the module's frame is the console's panel now, not a window of its own */
  html, body { height: 100%; }
  .sl-app { height: 100%; min-height: 100%; }
</style>`;

/* A stylesheet still being fetched BLOCKS the scripts that follow it. Every
   module links the four brand faces from Google Fonts at the top of its head,
   so on a slow, throttled or blocked network the module's own boot script does
   not run and its working area stays blank — measured here at twenty seconds
   before the request finally reset. The link is made non-blocking rather than
   removed: the faces still arrive when the network answers, every family
   already declares a real fallback stack, and the form is usable meanwhile. */
function unblockFonts(html: string): string {
  return html.replace(
    /<link\b(?![^>]*\bmedia=)([^>]*\bhref=["']https:\/\/fonts\.googleapis\.com[^"']*["'][^>]*)>/gi,
    (m, rest) => `<link${rest} media="print" onload="this.media='all'">`,
  );
}

function merge(html: string): string {
  if (html.indexOf('sl-console-merge') > -1) return html;
  html = unblockFonts(html);
  /* planted at the end of the head so it wins on order without !important
     doing the arguing — and if a module has no head, at the top of the body */
  const head = html.search(/<\/head\s*>/i);
  if (head > -1) return html.slice(0, head) + MERGE_SHEET + html.slice(head);
  const body = html.search(/<body[^>]*>/i);
  if (body > -1) {
    const end = html.indexOf('>', body) + 1;
    return html.slice(0, end) + MERGE_SHEET + html.slice(end);
  }
  return MERGE_SHEET + html;
}

/* One decompression per module per session; the frame is remounted often. */
const cache: Record<string, string> = {};

export async function loadModule(file: string): Promise<string> {
  if (cache[file]) return cache[file];
  const gz = MODULE_GZ[file];
  if (!gz) throw new Error('the console does not carry ' + file);
  const bytes = b64ToBytes(gz);
  const DS = (window as { DecompressionStream?: typeof DecompressionStream }).DecompressionStream;
  if (!DS) throw new Error('no-decompressor');
  const stream = new Blob([bytes as unknown as BlobPart]).stream().pipeThrough(new DS('gzip'));
  const html = merge(await new Response(stream).text());
  cache[file] = html;
  return html;
}

/* ── what the modules publish ──────────────────────────────────────────
   Read-only, and tolerant: a channel nobody has written yet is not an error,
   it is an unanswered question, and the caller must be able to tell the two
   apart. */
export type LogEvent = {
  id?: string; at?: number; type?: string;
  trip?: string | null; ship?: string | null; actor?: string;
  payload?: Record<string, unknown>;
};

export function readEvents(): LogEvent[] {
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v as LogEvent[];
    const list = (v as { events?: unknown })?.events;
    return Array.isArray(list) ? (list as LogEvent[]) : [];
  } catch { return []; }
}

export function readList<T>(key: string, field: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v as T[];
    const list = (v as Record<string, unknown>)?.[field];
    return Array.isArray(list) ? (list as T[]) : [];
  } catch { return []; }
}

/* An event names its subject in more than one place depending on the module
   that filed it — the shipment, the trip, or a reference inside the payload.
   Asking only one of them is how a completed act goes unnoticed. */
export function eventTouches(e: LogEvent, ref: string): boolean {
  if (!ref) return false;
  if (e.ship === ref || e.trip === ref) return true;
  const p = e.payload || {};
  for (const k of Object.keys(p)) {
    const v = p[k];
    if (typeof v === 'string' && v === ref) return true;
    if (Array.isArray(v) && v.indexOf(ref) > -1) return true;
  }
  return false;
}

/* The frame writes; this window is a different Document on the same origin, so
   the storage event reaches it. Polling stands beside the event rather than
   instead of it: a browser that withholds one still answers the other. */
export function watchEvents(onChange: (events: LogEvent[]) => void): () => void {
  let last = readEvents().length;
  const check = () => {
    const now = readEvents();
    if (now.length !== last) { last = now.length; onChange(now); }
  };
  const onStorage = (e: StorageEvent) => { if (!e.key || e.key === EVENTS_KEY) check(); };
  window.addEventListener('storage', onStorage);
  const timer = window.setInterval(check, 900);
  return () => { window.removeEventListener('storage', onStorage); window.clearInterval(timer); };
}

/* ── the management's word, from the register that owns it ───────────────
   D1 publishes the notice board on SL_NOTICES_V1 and, until now, nobody read
   it: a fact declared into an empty room. The console's news board reads it,
   and its own seed steps aside the moment the register answers — a seed that
   refuses to move is how a screen comes to show yesterday. */
export type Notice = {
  id?: string; at?: string | number; by?: string; kind?: string;
  ar?: string; en?: string;
  audience?: { all?: boolean; roles?: string[]; hubs?: string[]; countries?: string[] };
};

export function readNotices(): Notice[] {
  return readList<Notice>(NOTICES_KEY, 'notices');
}

/* A notice is addressed. One that names roles, hubs or countries reaches the
   people it names and nobody else; one that names none is for everybody. */
export function noticeReaches(n: Notice, role: string, hub: string): boolean {
  const a = n.audience;
  if (!a || a.all) return true;
  const named = (a.roles?.length || 0) + (a.hubs?.length || 0) + (a.countries?.length || 0);
  if (named === 0) return true;
  if (a.roles?.length && a.roles.indexOf(role) > -1) return true;
  if (a.hubs?.length && a.hubs.indexOf(hub) > -1) return true;
  return false;
}
