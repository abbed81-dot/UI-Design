# The universal prompt

*"ShopyLink phone frame"* means nothing outside this project. What follows does
— it names the style in words any model already knows, then gives the numbers so
nothing is left to interpretation.

---

## The short version — paste this

> Build it as a **mobile app mockup inside a device frame**, not a responsive
> web page.
>
> Wrap the app in a phone: a dark rounded bezel, and inside it a **fixed 390 ×
> 783px** screen with `overflow:hidden` so content is clipped rather than making
> the page taller. Bezel `border-radius:46px` with `padding:12px`; screen
> `border-radius:34px`. Add a **48px status bar** at the top showing 9:41 and a
> battery, then the app content below it in the only scrolling area.
>
> Nothing inside the screen may state a width in pixels — use percentages and
> flex, so the layout survives a narrower phone. Tap targets at least 44px.
> Centre the phone on a plain background; **the phone must not grow with the
> window.**

That paragraph is the whole thing. Everything below is why each sentence is in
it, and what to add when you want more.

---

## Why each line is there

**"mobile app mockup inside a device frame, not a responsive web page"** — this
is the sentence that does most of the work. Without it a model reaches for its
default, which is a centred `max-width` column that fills whatever window it is
given. Naming the *opposite* is what prevents it.

**"fixed 390 × 783"** — a real iPhone 14/15 in CSS pixels. Fixed is the point:
it forces the honest decision about what fits on one line. Say *fixed*, or the
model will make it `max-width` and you are back to a web page.

**"overflow:hidden so content is clipped"** — this is what makes overflow
*visible as a fault* instead of the page quietly getting taller. Most models
omit it unless asked.

**"48px status bar"** — takes room away before the app starts, which is honest
about the space an app really has. Also the fastest visual signal that a mockup
is a phone.

**"nothing inside may state a width in pixels"** — otherwise the content is
built to exactly 390 and breaks on any other phone. The frame is fixed; what is
inside it must not be.

**"the phone must not grow with the window"** — say it explicitly. It is the
single instruction most often ignored.

---

## Words that get you the same thing

If you want to vary the phrasing, these all point at the same idea and models
recognise them:

- **"device frame mockup"** / **"in-device preview"**
- **"iPhone-frame mockup"** (most specific, least ambiguous)
- **"app screen in a phone bezel"**
- **"390×783 fixed viewport, clipped"**

Avoid **"mobile-friendly"**, **"responsive"** and **"mobile-first"** — those ask
for a page that *adapts to* a phone, which is a different thing and is exactly
what produced the desktop-looking result.

---

## Optional additions

**Several screens side by side**, to judge a flow:

> Lay the frames out in a flex row that wraps, one frame per screen, with a
> caption under each.

**A bottom tab bar:**

> Give the app a bottom tab bar as the last element inside the screen — stuck to
> the bottom of the phone, not fixed to the browser viewport, or it escapes the
> frame.

**Right-to-left, if the app is Arabic:**

> Set `dir="rtl"` on the frame; labels flip, but numbers, codes and IDs stay
> left-to-right.

---

## The exact CSS, if you want no ambiguity at all

```css
.stage     { display:flex; gap:34px; flex-wrap:wrap;
             justify-content:center; padding:40px 20px; }

.framewrap { border-radius:46px; padding:12px;
             background:linear-gradient(160deg,#12333F,#081821);
             box-shadow:0 30px 70px -30px rgba(11,42,59,.65),
                        inset 0 0 0 1.5px rgba(255,255,255,.06); }

.phone     { width:390px; height:783px; border-radius:34px;
             overflow:hidden; display:flex; flex-direction:column;
             background:#F7F4EC; position:relative; }

.sb        { height:48px; display:flex; align-items:flex-end;
             justify-content:space-between; padding:0 26px 7px;
             font-family:ui-monospace,monospace; font-size:13px; font-weight:700; }

.scr       { flex:1; overflow-y:auto; display:flex; flex-direction:column;
             padding:8px 22px 18px; }
```

Give a model this block and there is nothing left to guess. The prose version is
better when you want it to design; the CSS is better when you want it to match
something that already exists.

---

## The one-line test

After it builds, **make the browser window narrower.** If the phone shrinks, you
got a web page. If the phone stays 390px and the background around it shrinks,
you got what you asked for.
