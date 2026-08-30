---
tags: [workflow, design, stable]
updated: 2026-08-18
---

# Workflow — Figma → Code

How a design becomes components here. The procedure lives in the
`figma-to-section` skill; this note is the reasoning and the project-specific
mapping.

## The rule that matters most

**Build from live Figma data, never from a description.** Call
`get_design_context` (values, exact copy) *and* `get_screenshot` (layout) for
every node. A summary — including one you wrote yourself earlier in the session —
has already lost the 4px that makes it wrong.

Record the `fileKey` and every section's node ID in `DESIGN-MAP.md`. A section
with no recorded node ID cannot be re-verified against its design later, which is
what [[qa-verification]] layer 2 depends on.

## Assets

Figma asset URLs expire (~7 days), so download immediately into
`public/assets/<section>/` — one folder per section, per [[folder-structure]].

Two checks that catch the usual failures:

- `file <path>` — Figma frequently returns an SVG where a raster was requested,
  or a PNG named `.jpg`. A mismatched extension renders as a broken image.
- Size sanity — a content photo under ~5KB is a vector placeholder, not the export
  you wanted.

A failed download is reported to the user immediately, never silently skipped.

## Design values → tokens

This is where a Figma-to-code pipeline usually degrades into hardcoded values.
Map **before** writing markup, per [[design-system]]:

- each colour → a `--raw-*` primitive **plus** a Tier 2 semantic token naming its
  purpose (`--action-primary`, not `--blue-500` used directly)
- spacing/radius/type → reuse an existing token, or add one with a comment naming
  the Figma frame it came from
- a value that resists tokenisation is a **design-review flag** in the summary,
  not a magic number in a class

This project scales the root font-size with the viewport (the adaptive grid in
`globals.css`), so design px map cleanly to `rem` at the design base width. Check
the Figma frame width against those breakpoints before converting anything.

## Where we deliberately diverge from the design

A static Figma frame does not describe motion. This starter's whole purpose is
spring motion, so **adding restrained reveals, parallax and text animation is
correct**, not an invention — see [[animation-system]] and [[text-engine]].

Everything else in the frame is authoritative: copy is character-for-character,
and shadows/gradients/overlays/card wrappers that are not in the design do not get
added. An invented wrapper background is the most common cause of "the logo
disappeared".

## Related

[[new-page]] · [[generic-layout-prompt]] · [[design-system]] · [[qa-verification]] · [[agent-harness]]
