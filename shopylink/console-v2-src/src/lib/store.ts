/* Where the prototype's state lives between sessions.
   On claude.ai the page saves new versions of itself (the artifact
   capability): state is embedded as a JSON block in the document, and a
   publish carries it forward for every viewer. The pristine document text is
   captured BEFORE React mounts — never serialized from the live DOM.
   Anywhere the capability is absent (a file opened off the filesystem),
   localStorage stands in, and its absence too is survivable. */

export type SavedState = {
  lang?: 'ar' | 'en';
  pinned?: string[];        /* module files, max 5 */
  whoId?: string;
  rail?: boolean;
};

const KEY = 'SL_CONSOLE_V2_STATE';
const BLOCK_ID = 'sl-state';

/* captured at module-evaluation time — before any render */
const pristine: string =
  '<!doctype html>\n' + document.documentElement.outerHTML;

export function readState(): SavedState {
  try {
    const el = document.getElementById(BLOCK_ID);
    if (el && el.textContent) return JSON.parse(el.textContent);
  } catch (e) { /* fall through */ }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* storage blocked — fine */ }
  return {};
}

let artifactNS: { publish(html: string): Promise<unknown> } | null | undefined;

async function artifact() {
  if (artifactNS !== undefined) return artifactNS;
  try {
    const claude = (window as unknown as { claude?: { use(n: string): Promise<unknown> } }).claude;
    artifactNS = claude ? ((await claude.use('artifact')) as typeof artifactNS) ?? null : null;
  } catch (e) { artifactNS = null; }
  return artifactNS;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export function writeState(next: SavedState) {
  /* localStorage immediately — cheap, per-viewer */
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) { /* fine */ }
  /* artifact publish, debounced: rapid pin clicks become one version */
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    const ns = await artifact();
    if (!ns) return;
    const json = JSON.stringify(next);
    let html = pristine;
    /* the minifier strips attribute quotes (id=sl-state), so both the block
       and the root div are matched tolerantly */
    const re = new RegExp('(<script[^>]*id="?' + BLOCK_ID + '"?[^>]*>)[\\s\\S]*?(</script>)');
    html = re.test(html)
      ? html.replace(re, '$1' + json + '$2')
      : html.replace(/<div id="?root"?>/, '<script id="' + BLOCK_ID + '" type="application/json">' + json + '</script><div id=root>');
    try { await ns.publish(html); } catch (e) { /* conflict is routine — the winner reloads us */ }
  }, 1200);
}
