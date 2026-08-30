---
tags: [workflow, qa, stable]
updated: 2026-08-18
---

# Workflow — QA & Verification

How work in this repo is checked before it is called done. Two layers, because
half the hard rules are mechanically decidable and half are not.
ADR: [[decisions-log]] ADR-0019.

## Layer 1 — `.claude/scripts/verify.sh`

```bash
.claude/scripts/verify.sh                     # whole src/
.claude/scripts/verify.sh src/views/about.tsx # scoped
```

Exit code 1 on any **FAIL**. **WARN**s never fail the run — they are judgement
calls that must be fixed or justified, not ignored.

What it decides mechanically:

| Group | Checks |
|-------|--------|
| Motion | `@keyframes`, foreign animation libs, `mode="manual"`, `leading-none`+`overflow`, dead `duration-fast` class, untokenised transitions |
| Tokens | hex in `className`/`style`, arbitrary px, literals in `@theme inline` or a Tier 2 token |
| Architecture | route importing outside `views/`, `"use client"` on page/layout/view, `any`, `next/router`, `middleware.ts`, `process.env` outside `env.ts` |
| Markup | raw `<img>`, missing `alt`, raw `<a>` internal link, click handler on a `div`, multiple `<h1>`, `tag="div"` |
| Hygiene | `console.log`, TODO/FIXME, **any diff inside the vendored animation engine** |

It is deliberately conservative: it greps source, it does not parse TypeScript, so
it can miss things and occasionally flags a legitimate case. Prefer a false
positive you dismiss over a rule nobody checks.

> [!note] It does not replace `yarn lint` or `yarn build`
> Run all three. The script checks *this project's* rules; the compiler and
> linter check the language.

## Layer 2 — the `qa-verify` skill

The checks a script cannot make: design fidelity against a **re-fetched** Figma
node, whether a token is named for its purpose, whether the chosen spring
primitive is the right one, semantics and heading outline, responsive behaviour
down to 320px, and whether content genuinely arrives via props.

The loop: run layer 1 → fix every FAIL → walk layer 2 section by section → re-run
layer 1 (fixes introduce violations) → repeat until clean.

## When it runs

- `/qa` — on demand
- inside `/new-page` and `/section` before they report done
- inside `/ship` as the first gate
- by the `section-builder` agent before it hands back

## Known gaps

- No visual regression testing — no baseline screenshots, so "matches the design"
  remains a human/model judgement.
- No automated a11y engine (axe/Lighthouse CI) — contrast and focus order are
  checked by inspection.
- No unit or E2E tests in the project at all. If that changes, this workflow is
  where the gate belongs.

## Related

[[agent-harness]] · [[new-page]] · [[ship]] · [[ai-agent-guide]]
