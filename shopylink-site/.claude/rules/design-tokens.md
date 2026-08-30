---
paths:
  - "src/app/globals.css"
  - "src/style/**/*.css"
description: The three-tier design token convention
---

# Design tokens — three tiers, no skipping

Full note: `obsidian/frontend/design-system.md` (ADR-0015)

| Tier | Grammar | Lives in | Usable in markup |
|------|---------|----------|------------------|
| 1 — Primitive | `--raw-<category>-<name>[-<shade>]` | `:root` | never |
| 2 — Semantic | `--<role>[-<variant>][-<state>]` | `:root` | only via its binding |
| 3 — Component | `--<tw-namespace>-<component>` | `@theme inline` | yes |

Binding: `@theme inline { --color-background: var(--background); }`

## Rules

1. **Only Tier 1 holds literals.** A hex/px/ms anywhere else is a bug.
2. **Tier 2 names purpose, not appearance** — `--action-primary`, never `--blue`.
3. **Tier 2 is the themeable layer.** Dark mode overrides Tier 2 only.
4. **Every `@theme inline` entry is exactly `--<namespace>-<role>: var(--<role>)`.**
   No literals, no `calc()`, no jumping to `var(--raw-*)` — `inline` inlines the
   value, so a literal here freezes it and silently breaks theming.
5. kebab-case, singular, unabbreviated; state last (`--action-primary-hover`).
6. Tier 3 is rare — a repeated pattern is a React component, not a token (ADR-0012).

**There is no `--duration-*` namespace in Tailwind v4.** Durations stay Tier 2 and
are consumed as `duration-[var(--duration-fast)]`.

## Where a style goes (first match wins)

| Situation | Goes where |
|-----------|-----------|
| One-off | Tailwind utilities in `className` |
| Repeated pattern with structure/props | a React component in `components/ui/` |
| Repeated pure-utility combo | a Tailwind v4 `@utility` |
| Pseudo-elements, 3rd-party overrides | `@layer components` |
| A new colour/spacing/radius value | Tier 1 primitive + Tier 2 semantic token |

`globals.css` holds tokens and base resets only — it stays a few hundred lines forever.
The `html { font-size }` block is the adaptive scaling grid; keep it in sync with
`src/components/common/grid/grid.config.ts`.
