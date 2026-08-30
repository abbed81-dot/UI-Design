---
tags: [frontend, animation, stable]
updated: 2026-07-17
---

# Text Engine — `spring-text-engine`

All **text animation** is handled by the `spring-text-engine` package (`^0.1.5`).
**Do not build custom text-animation components.** For non-text motion see
[[animation-system]].

- Package: `spring-text-engine` · peer dep `@react-spring/web`
- Playground & docs: [textengine.textura.agency](https://textengine.textura.agency)
- Full API reference: [[text-engine-reference]]

## Import

```tsx
import TextEngine from 'spring-text-engine';
import { tengine } from 'spring-text-engine';            // factory pattern
import type { TextEngineInstance } from 'spring-text-engine';
```

## How it works

`TextEngine` splits `children` into **letter / word / line** slots and drives each
with an independent spring. Mixed children work — plain strings animate alongside
`<span>`, `<strong>`, icons, SVGs.

Nested layers (only rendered when their `*In` prop is set):

```
wrapLine → line → wrapWord → word → wrapLetter → letter
```

Each layer has an `In` (enter) and `Out` (resting/exit) target. Set `Out` to the
hidden resting state, `In` to the visible destination.

## Modes

| Mode | Behaviour |
|------|-----------|
| `"always"` *(default)* | Plays in on enter, out on leave. Repeats. |
| `"once"` | Plays in once, never replays. |
| `"forward"` | Plays in on downward scroll only. |
| `"manual"` | Imperative — `instance.playIn()` etc. **Avoid in this project.** |
| `"progress"` | Driven by scroll between `start`/`end`. Sub-modes `toggle` / `interpolate`. |

> [!important] Project rule
> **NEVER use `mode="manual"`.** Always use `"always"`, `"once"`, `"forward"`, or
> `"progress"` — project hard rule, see [[ai-agent-guide]].

## Alignment & line-height

> [!important] The two rules that bite every TextEngine block
> `TextEngine` renders its container as a **flex row with `flex-wrap: wrap`**, and
> `overflow` clips each layer to its **line-height box**. That breaks two things
> people assume "just work": `text-align`, and tight leading. Both are fixed with
> **classes on the `TextEngine` tag itself** — there is no wrapper component and
> no helper to import.

### 1. Aligning — `text-*` is not enough, pair it with `justify-*`

The container is `display: flex; flex-wrap: wrap`, so every word is a **flex
item**. `text-align` does not position flex items — only `justify-content` does.
A lone `text-center` therefore silently does nothing.

Always set **both**: `justify-*` does the real work; `text-*` keeps plain-text
fallbacks, the hidden SEO copy, and any nested inline content aligned.

| Intent | Class pair on the `TextEngine` tag |
|--------|-----------------------------------|
| Left *(default)* | `text-left justify-start` |
| Centre | `text-center justify-center` |
| Right | `text-right justify-end` |

```tsx
<TextEngine
  tag="h1"
  className="text-center justify-center"   // ← both, always
  lineIn={{ y: '0%', opacity: 1 }}
  lineOut={{ y: '100%', opacity: 0 }}
  overflow
>
  A centred heading
</TextEngine>
```

`className` lands on the container, so `justify-*` reaches the right element.
Because the container wraps, `justify-content` applies **per wrapped line** —
which is exactly the behaviour you want for a multi-line heading.

> [!warning] Never `justify-between` on a TextEngine
> The flex items are **words**, not lines. `justify-between` spreads the words of
> every line edge-to-edge — including the last one — which reads as broken
> justified text, not as a layout.

### 2. Clipped text — keep leading at `1.1` or looser

If letters look shaved along the top or bottom, this is why. With `overflow`, the
engine sets `overflow: hidden` on the wrap layers, which are `inline-block` spans
whose box height comes **from `line-height`**. Tight leading makes that box
shorter than the glyphs, so descenders (`g` `y` `p` `j`) and accented caps get
clipped. The clip itself is required — it is what hides the text before it slides
in — so the fix is the leading, not the `overflow`.

- **Never `leading-none` (1) with `overflow`.** It is the single most common
  cause of shaved text.
- **Use `leading-display` (1.1) as the floor** — the token exists for this. Any
  looser value is fine too.
- Set it **on the container**; `line-height` inherits to every wrap layer, so one
  class fixes all of them.

```tsx
<TextEngine tag="h1" className="leading-display text-center justify-center" overflow …>
```

Whenever you set `overflow`, **double-check the computed leading** on the
container — including whatever a `text-*` size utility brought with it, since
Tailwind's `text-5xl` and above ship `line-height: 1`, which clips.

If a design genuinely calls for tighter visual leading than `1.1`, do **not**
shrink the container's leading. Give the clip box room and pull the layout back
with a matching negative margin on a wrap layer:

```tsx
<TextEngine wrapWordClassName="py-[0.15em] -my-[0.15em]" overflow …>
```

## Common patterns

**Line-by-line heading reveal**
```tsx
<TextEngine
  tag="h1"
  className="leading-display"              // ≥1.1 — `overflow` clips to the leading box
  lineIn={{ y: '0%', opacity: 1 }}
  lineOut={{ y: '100%', opacity: 0 }}
  lineStagger={100}
  lineConfig={{ duration: 900, easing: easings.easeOutCubic }}
  overflow
>
  Your heading text
</TextEngine>
```

> [!warning] Match value types across `In` / `Out`
> A spring key must use the **same type** in its `In` and `Out` states — all
> numbers, or all unit strings. Mixing them (e.g. `y: 0` with `y: '100%'`) throws
> *"Cannot animate between _AnimatedString and _AnimatedValue"* at runtime. For a
> clipped line reveal use `y: '0%'` / `y: '100%'`; for a pixel slide use `y: 0` /
> `y: 60`.

**Word-by-word fade-up (body copy)**
```tsx
<TextEngine
  tag="p"
  wordIn={{ y: 0, opacity: 1 }}
  wordOut={{ y: 40, opacity: 0 }}
  wordStagger={60}
  wordConfig={{ duration: 700, easing: easings.easeOutQuart }}
>
  Animate every word independently
</TextEngine>
```

**Scroll-driven progress** — `mode="progress"` with `type="interpolate"` (smooth)
or `type="toggle"` (snap), plus `start`/`end` trigger positions. Used in
`views/home.tsx`.

**Factory shorthand** — `tengine.h2` returns a pre-tagged `TextEngine`:
```tsx
const H2 = tengine.h2;
<H2 mode="once" lineIn={{ y: 0, opacity: 1 }} lineOut={{ y: 60, opacity: 0 }}>…</H2>
```

## Key prop groups

- **Layout:** `className` (lands on the flex container — where `justify-*` and
  `leading-*` belong, see [Alignment & line-height](#alignment--line-height)),
  `wrapLineClassName` / `wrapWordClassName` / `wrapLetterClassName` (the clip
  layers), `columnGap` (word gap, in `em`).
- **Animation values:** `lineIn/Out`, `wordIn/Out`, `letterIn/Out` (+ `wrap*` variants).
- **Configs:** `lineConfig`, `wordConfig`, `letterConfig` (+ directional `*In`/`*Out`).
- **Timing:** `delayIn/Out`, per-layer `*DelayIn/Out`, `*Stagger` (+ directional).
- **Behaviour:** `overflow` (clip for slide-ins), `immediateOut`, `seo` (hidden
  plain-text copy for crawlers — default `true`).
- **Progress:** `type`, `start`, `end`, `trigger`, `interpolationStaggerCoefficient`.

Full prop tables: [[text-engine-reference]].

## Trigger position format

Shared with scroll components: `"<element-edge> <viewport-edge>[±=px]"`.

| Example | Meaning |
|---------|---------|
| `"top bottom"` | progress 0 when element top hits viewport bottom |
| `"bottom top"` | progress 1 when element bottom hits viewport top |
| `"top bottom+=200"` | start 200 px later |
| `"center center"` | element centre meets viewport centre |

## Imperative API

Via `ref` / `onTextEngine`: `playIn()`, `playOut()`, `togglePause()`,
`progress.current` (0–1), plus read-only `lines` / `words` / `letters`.
(Not used in normal scroll-driven flows.)

## Related

[[animation-system]] · [[text-engine-reference]]
