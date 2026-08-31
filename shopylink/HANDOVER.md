# ShopyLink — handover

## What is in the zip

    ShopyLink_Console_v5.3.html      the console, one self-contained file — open it, nothing to install
    shopylink/                       the package: 38 module files + the docs
    shopylink/console-v2-src/        the console's source (React + Tailwind + Vite)
    shopylink/console-v2-src/audit/  the browser audits that prove the claims below
    shopylink/console-v2-src/i18n/   the Arabic glossary and the script that applies it

## How the console relates to the modules

The console draws no form of its own. Each of the 22 modules it lists is gzipped
into the bundle, decompressed on demand, and shown inside a same-origin
`<iframe srcDoc>` — so the module keeps its own design, its own validation and
its own act, and reads and writes the very same `SL_*_V1` localStorage channels
the console reads. That sharing IS the wiring.

    tools/embed_modules.mjs    reads the file list out of src/lib/modules.ts and
                               embeds those files from disk; fails loudly if one
                               is missing
    src/lib/carry.ts           decompresses, folds the module's own shell away
                               (one sidebar per screen), and listens to the
                               channels
    test_carry.cjs             29 jsdom checks of that contract

A queue row is cleared by the module's own record on `SL_EVENTS_V1` — never by a
console-drawn button.

## Build

    cd shopylink/console-v2-src
    pnpm install
    node tools/embed_modules.mjs                 # module files must be on disk
    SKILL=<web-artifacts-builder> ./build.sh     # -> bundle.html
    node test_carry.cjs                          # 29 checks

`src/lib/modules_html.ts` is generated and gitignored; regenerate it before any
build. Typecheck with `npx tsc --noEmit --ignoreDeprecations 6.0`.

## The audits

Each is standalone Node + Playwright, run against the built bundle or the module
files directly. They are the record of what was measured, not a description of
it — re-run any of them.

    audit/fields.mjs      every pair of boxes standing side by side must share a
                          top edge and a height   -> 164 pairs, 0 dropped, 0 uneven
    audit/typing.mjs      types into every text box one keystroke at a time and
                          asks what it kept       -> 104 boxes, 0 lost input
    audit/nulls.mjs       no screen may print "null"/"undefined"/"NaN"  -> 0
    audit/harvest.mjs     every English string the Arabic build still shows
                          -> 366 down to 62, all of them Latin on purpose
    audit/carry_audit.mjs each module standalone vs in-console  -> 22/22, 0 errors
    audit/controls.mjs    every visible control pressed  -> 162 worked, 0 silent
    audit/contrast.mjs    WCAG AA on every text node     -> 0 failures
    audit/align.mjs       sidebar/topbar/page geometry    -> 0px mismatch
    audit/states.mjs      7 states and sizes              -> no clipping, 0 errors
    audit/wiring.mjs      owner and readers of all 24 SL_* channels

Chromium is at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` in this
environment and needs `--no-sandbox`; change `EXE` at the top of each script for
another machine. `audit2/english/controls/states` read a `SERVICES` env var —
a JSON array of `{file, ar}` extracted from `src/lib/modules.ts`.

## What was changed in the delivered module files

Every change is a repair, commented in place, and nothing was redesigned.

1. **7 unquoted attributes** in B1/B2 — `placeholder=t('Min. 7 characters')`
   inside an HTML template produced the literal `t('Min.` and made a screen
   reader announce `t('Search` as a field label.
2. **`<style id="sl-box-balance">`**, 21 files — five declarations. The RTL rule
   `.fl-label{display:block}` pushed the required asterisk onto a line of its
   own, and `.fl-req` carries no font-size, so that orphan line inherited 16px
   and stood 19px tall: a required field's box dropped 19px below the box beside
   it. Also `input.field{height:var(--ctl-h)}` — the existing height rule names
   input TYPES, and `<input class="field">` declares none, so plain fields stood
   38px beside 42px selects.
3. **`<!-- sl-keep-focus -->`**, 30 files — a search box that redraws its screen
   on every keystroke replaces the node being typed into; focus fell to the body
   and the second character went nowhere. Focus and caret are carried across the
   redraw. The box is re-identified by id, name, placeholder, then POSITION —
   a placeholder is a translated string and comes back in the other language.
4. **`<!-- SL Arabic sweep -->`**, 22 files — text written straight into markup,
   never through `t()`, is translated after every render from the module's own
   dictionary first, then the shared glossary. A string with no entry is left
   exactly as it is, and machine values are skipped by rule.
5. **5 null guards** — CreateTrip's trip number on the finished screen (the same
   `||'DRAFT'` its three other sites already use), and D1's `hubLabel`, `ME.id`
   and `timeAt`. An absent value now reads as an em dash.

Regenerate 2–4 with `i18n/apply.mjs` after editing `i18n/glossary.json`.

## Two items left open, by decision not oversight

- **Emoji.** The package's own emoji→icon conversion is incomplete: 10 files are
  emoji-free, 28 still carry emoji, 25 of those already hold the `SL_ICONS`
  helper. `iconize.js` is the tool. `RULES.md` G7/G9 records that a blind
  find-and-replace once broke 13 files, so this is per-file with a browser check
  after each. Not started — awaiting the owner.
- **Billing's centred amount.** In an invoice line the amount box is centred
  against a two-line cell, so it sits 10px above the note under it. That is an
  intentional alignment, not a wrap; changing it changes every invoice line.

## Wiring findings, reported and not acted on

- `SL_HUBS_V1` has two writers: C7 (the owner) and Pricing via `slRegPublish`.
- `SmartRegistration` DOES write `SL_CLIENTS_V1`, contradicting PROJECT_INDEX
  line 1052 ("no submit path at all").
- `SL_FLOAT_V1` and `SL_DRIVER_SPEND_V1` are written and read by nobody.
- B3's destination field is a search that shows and hints nothing until you
  type — a discoverability defect in the module's own design, not a bug.

`SL_EVENTS_V1`'s 17 writers and `SL_APPROVALS_V1`'s 7 are by design: an event
bus and an approvals queue.

## Source of truth

Branch `claude/remaining-files-xy5pn0` of `abbed81-dot/UI-Design`. Every claim
above is a commit message on it with the numbers that produced it.
