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

export function hasModule(file: string): boolean {
  return Object.prototype.hasOwnProperty.call(MODULE_GZ, file);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
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
  const html = await new Response(stream).text();
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
