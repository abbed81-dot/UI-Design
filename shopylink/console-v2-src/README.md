# ShopyLink operations console (v2 source)

The console is a **window and a carrier**, not a second design. It draws no
form of its own: every service page shows the package's own module file,
decompressed and mounted on the same origin, so the module keeps its design,
its validation and its act — and reads and writes the very same `SL_*`
channels the console reads. That sharing is the wiring.

## Build

```sh
node tools/embed_modules.mjs      # gzips the 24 module files into src/lib/modules_html.ts
npx tsc --noEmit --ignoreDeprecations 6.0
SKILL=/mnt/skills/examples/web-artifacts-builder ./build.sh
node test_carry.cjs               # the behaviour contract, against the built bundle
```

`src/lib/modules_html.ts` is **generated** (~1.9 MB of base64) and is not kept
in the repository: the module files it carries are the source of truth, and a
copy checked in beside them would be a second one that silently goes stale.
Regenerate it with `tools/embed_modules.mjs`, which reads the module list out
of `src/lib/modules.ts` and fails loudly on any file it cannot find.

## What clears a queue row

Not a button. The modules append to `SL_EVENTS_V1`; the console watches that
log (storage event, with a poll beside it) and when a record lands naming the
reference the person came for, the row leaves the queue and the toast names
the record that did it. The console files nothing itself.
