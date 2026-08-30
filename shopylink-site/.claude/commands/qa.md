---
description: Verify the current work against the hard rules and the design
argument-hint: [path-or-section?]
---

Run verification on: **$ARGUMENTS** (whole `src/` if empty).

Use the `qa-verify` skill. In short:

1. `.claude/scripts/verify.sh $ARGUMENTS` — every FAIL must be fixed; WARNs are
   fixed or explicitly justified.
2. `yarn lint` and `yarn build`.
3. The judgement pass: design fidelity against a re-fetched Figma node, token
   discipline, motion primitive choice, semantics and a11y, responsive behaviour
   down to 320px, architecture (routes delegate, server-first, props not
   hardcoded content).
4. Fix, then re-run from step 1 until clean.

Report what failed, what you fixed, what you consciously left, and anything you
could not verify.
