# The phone frame — what to ask for

**Name it: the ShopyLink phone frame.**

Say *"build it in the ShopyLink phone frame"* and this is what you mean. The
business app was built without it, which is why it reads as a web page: the
content was correct, the container was missing.

---

## What it is

Three nested pieces, and each does one job.

| Piece | Role |
|---|---|
| `.stage` | the desk the phones sit on — a flex row, so several screens line up side by side |
| `.framewrap` | the **hardware**: the dark bezel, its radius and its shadow |
| `.phone` | the **glass**: a fixed 390 × 783 window that clips everything inside it |
| `.sb` | the **status bar** — 9:41 and the battery, 48px tall |
| `.scr` | the **screen content** — the only part an app actually writes |

The app writes into `.scr`. Everything above it is the device, and the device
never changes between apps.

---

## The measurements

```css
.stage      { display:flex; gap:34px; flex-wrap:wrap; }

.framewrap  { border-radius:46px; padding:12px; position:relative;
              background:linear-gradient(160deg,#12333F,#081821);
              box-shadow:0 30px 70px -30px rgba(11,42,59,.65),
                         0 4px 14px -6px rgba(11,42,59,.4),
                         inset 0 0 0 1.5px rgba(255,255,255,.06); }

.phone      { width:390px; height:783px; border-radius:34px;
              overflow:hidden; display:flex; flex-direction:column;
              background:var(--canvas); position:relative; }

.sb         { height:48px; display:flex; align-items:flex-end;
              justify-content:space-between; padding:0 26px 7px;
              font-family:var(--mono); font-size:13px; font-weight:700; }

.scr        { flex:1; overflow-y:auto; display:flex; flex-direction:column;
              padding:8px 22px 18px; }
```

**390 × 783** is an iPhone 14/15 at CSS pixels. The bezel radius (46) is larger
than the glass radius (34) by exactly the padding (12) — that is what makes the
corners look machined rather than drawn.

---

## Why the business app looked like a desktop

It had `max-width:520px` and a full-page background. That is a **responsive web
layout**: it fills whatever window it is given, and on a laptop it fills a
laptop. A phone frame is the opposite — **a fixed window that does not grow**,
so the design is judged at the size it will actually be used.

The two are not interchangeable, and the difference is not decoration:

- **A fixed 390px width** forces the real decision — what fits on one line, what
  wraps, what has to be cut. A 520px column quietly hides that.
- **Clipping** (`overflow:hidden` on `.phone`) shows you when content runs past
  the bottom, instead of the page simply getting taller.
- **The status bar** takes 48px away before the app starts, which is honest
  about the room an app really has.

---

## Two ways to use it

**One screen at a time** — how the combined app runs by default (`st.mode ===
'walk'`): a single `.framewrap` on the `.stage`, and you step through the flow.
This is the mode to build in.

**Several at once** — `.stage` is a flex row, so more than one `.framewrap` can
sit side by side to compare screens. Worth doing when judging whether a flow
holds together; the combined file has a gallery mode for this, though it renders
its frames differently from the walk view.

---

## The rules that come with it

- **Only `.scr` scrolls.** The bezel and status bar never move.
- **Nothing inside states a width in pixels** — the glass is the width. Use
  percentages and flex, so the same content survives a 360px phone.
- **44px minimum for anything tapped** (D4), which matters far more at 390px
  than it does at 520.
- **The tab bar, if there is one, is the last child of `.scr`** and sticks to
  the bottom — not fixed to the viewport, or it escapes the frame.

---

## What to say next time

> "Build it in the ShopyLink phone frame — `.stage` / `.framewrap` / `.phone`,
> 390 × 783, status bar, one frame per screen."

That sentence is enough. The spec above is the answer to it.
