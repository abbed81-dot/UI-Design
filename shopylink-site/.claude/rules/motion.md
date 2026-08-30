---
paths:
  - "src/components/**/*.tsx"
  - "src/views/**/*.tsx"
  - "src/layouts/**/*.tsx"
description: Motion rules — springs only, with one narrow CSS exception
---

# Motion in this project

Full note: `obsidian/frontend/animation-system.md` · `obsidian/frontend/text-engine.md`

- **All real motion is spring-based** — `@react-spring/web` via
  `src/components/animation/springs/`. Text animates through `spring-text-engine`.
- **Banned:** `@keyframes`, `framer-motion`, GSAP, any other animation library.
- **The only CSS exception** (ADR-0014): `transition-*` utilities for simple
  discrete state changes — hover/focus colour, opacity, border, a few-px nudge.
  All three conditions must hold, or it is a spring:
  1. token-backed timing — `duration-[var(--duration-fast)] ease-entrance`
  2. `transition-*` only, never `@keyframes`
  3. lives in `className`, never in a CSS file

  `duration-fast` as a bare class does **nothing** — Tailwind v4 has no
  `--duration-*` namespace. Always `duration-[var(--duration-fast)]`.

## Picking a primitive

| Need | Component |
|------|-----------|
| Reveal on scroll-into-view | `<Inview mode="once">` |
| Continuous scroll motion (parallax, progress) | `<SpringTrigger mode="scrub">` |
| Snap at a scroll point | `<SpringTrigger mode="toggle">` |
| Hover | `<Hover>` |
| Heading / copy reveal | `spring-text-engine` — see the text-engine note |

## TextEngine traps

- **Never `mode="manual"`** — use `always` / `once` / `forward` / `progress`.
- Its container is **flex**: `text-center` alone will not centre it — pair with
  `justify-center` on the tag.
- `overflow` clips to the line-height box: keep leading ≥ 1.1 (`leading-display`).
  `leading-none` + `overflow` shaves glyphs.

Every animation component takes `tag` — pass the semantic element, never `div`.
Tailwind classes go on `className` / `innerClassName`, never into spring `from`/`to`.
