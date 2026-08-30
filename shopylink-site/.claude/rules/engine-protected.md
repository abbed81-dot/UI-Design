---
paths:
  - "src/components/animation/springs/**"
  - "src/hooks/animation/**"
description: Do-not-modify zone — the vendored animation engine
---

# STOP — this is the vendored animation engine

`src/components/animation/springs/` and `src/hooks/animation/` are treated as a
vendored library. **Do not edit them without explicit sign-off from the user.**

- Consume them; never modify them. Need different behaviour? Compose a wrapper
  in `src/components/` instead.
- One authorised performance refactor exists (ADR-0009) — it does not open the
  door to further edits.
- `.claude/scripts/verify.sh` FAILs if `git diff` shows changes here.

If a change genuinely belongs in the engine, say so explicitly, explain why a
wrapper cannot work, and get the user's approval before touching a file.

Reference: `obsidian/frontend/animation-system.md`, `obsidian/frontend/components/animation-springs.md`
