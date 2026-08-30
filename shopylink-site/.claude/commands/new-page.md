---
description: Build a new page or section following this starter's playbook
argument-hint: [page-name] [figma-url?]
---

Implement a page or section: **$ARGUMENTS**

Follow `obsidian/workflows/new-page.md`. If a Figma URL was given, use the
`figma-to-section` skill for extraction and asset handling.

1. **Read first** — `obsidian/workflows/ai-agent-guide.md` for the hard rules,
   then the topic notes you actually need (`design-system.md` for styling,
   `animation-system.md` + `text-engine.md` for motion,
   `component-conventions.md` for placement, `html-semantics.md` for markup).
   If the project is otherwise empty, build in `src/views/home.tsx` on `/` rather
   than scaffolding a new route.
2. **Plan the route** — `app/<route>/page.tsx`, ~3 lines, delegates to a view.
   Add the route to `src/app/sitemap.ts` in the same change.
3. **Build the view** in `src/views/<page>.tsx`, composed of components. Reuse
   `components/ui/` and `components/common/` before creating anything new.
4. **Tokens before styles.** Any new colour/spacing/type/radius value becomes a
   Tier 1 primitive + Tier 2 semantic token in `globals.css`, commented with its
   origin. Nothing hardcoded.
5. **Motion via springs** — the right primitive for each need, semantic `tag`.
6. **Content via props/hooks.** Mocks under `src/data/mocks/<page>.ts`. Async data
   gets loading/error/empty states.
7. **Server-first** — `"use client"` only at leaves.
8. **Assets** to `public/assets/<section>/`, referenced by absolute path.
9. **Verify** — run the `qa-verify` skill (script + judgement checks) and fix
   until clean.
10. **Document** — update the catalog notes for anything new, add a changelog
    entry, and an ADR if you made an architectural choice.

Report: files created, new tokens and why, values that could not map to tokens
(flag for design review), assumptions made.
