# ShopyLink — developer handover

A working prototype of a freight-forwarding platform: 34 modules, 3 printable
documents, 3 apps, and a shell that unifies them under one sign-in. Everything
runs from the filesystem — **no build step, no framework, no dependencies.**

---

## Start here

1. Open **`ShopyLink_Shell.html`** in a browser.
2. Sign in as **Omar Al-Masri** to see everything, or **Khaled Omar** to see how
   little a warehouse clerk sees. That difference is the point.
3. Every other file also opens on its own — each module is self-contained.

Serve the folder over `http://` rather than `file://` if iframes or storage
behave oddly; any static server will do (`npx serve`, `python3 -m http.server`).

---

## What is in the box

| | Count | |
|---|---|---|
| Operations modules | 25 | intake · trips · destination · money · admin |
| Printable documents | 3 | invoice · quotation · consignment note (A4, own print rules) |
| Apps | 4 | individual · business · driver · combined screen gallery |
| Shell | 1 | sign-in, permission-filtered navigation, work queue |
| Behaviour contracts | 70 | `test_*.js` — **2,426 assertions, all passing** |
| Tooling | 13 | audit, contrast, duplicates, growth, roles, responsive… |
| Written rules | 5 | `RULES.md` and the prompt documents |

---

## Where is B3?

The files are named descriptively; the **B/C codes live inside them**, in the
`<title>` and the on-screen header. **`CODE_MAP.md` is the lookup** — every code
to its file, the gaps that genuinely do not exist (C3-C6, C11), and the one
filename that lies about its own code.

## Read these before changing anything

**`CODE_MAP.md`** — which file is B3, C7, D1.

**`RULES.md`** — the standing rules, each with the failure that produced it.
They are not style preferences; most were written after something broke.

**`PROJECT_INDEX.md`** — what each module does and why it is built that way,
in the order it was built.

**`SHELL_PROMPT.md`** — how the shell fits over the modules.

**`PHONE_FRAME.md`** and **`UNIVERSAL_PROMPT.md`** — the mobile device-frame
style, and how to ask any tool for it.

---

## How the modules talk

There is no server. Modules publish and read through nine `localStorage`
channels, same-origin:

| Channel | Owner | Carries |
|---|---|---|
| `SL_EVENTS_V1` | everyone | append-only event log |
| `SL_STAFF_V1` | C9 Staff | people, roles, permissions, leave |
| `SL_CLIENTS_V1` | D1 Control | the client register |
| `SL_DRIVERS_V1` | C2 Drivers | drivers and their documents |
| `SL_HUBS_V1` | C7 Hubs | hubs |
| `SL_APPROVALS_V1` | C12 | pending approvals |
| `SL_QUOTES_BIZ_V1` | Billing | quotations sent to a business client |
| `SL_QUOTE_V1` | Billing | the quotation a document sheet should draw |
| `SL_CMR_V1` | Trip journey | the trip a consignment note should draw |
| `SL_FLOAT_V1` | B4 Loading | each driver's float: given at departure, spent at the crossings |
| `SL_DRIVER_SPEND_V1` | Driver app | what a driver paid and photographed, awaiting the office's check |

**Every channel is best-effort.** With storage blocked, each module still works
alone — it falls back to its own seed data and says so. A module must never be
unusable because a channel is unavailable.

**One owner per record type.** The owner publishes; consumers read. Do not add a
second writer to a channel.

---

## The tests

```bash
node test_quoteflow.js      # one contract
for t in test_*.js; do node "$t" | tail -1; done   # all of them
```

They are **behaviour contracts, not unit tests**. Each assertion is written as a
sentence about what the software must do, and most exist because that exact thing
once went wrong. If one fails after a change, read the sentence before changing
the test.

**They drive the real interface.** Assertions click buttons and dispatch events
rather than calling functions directly, because a test that calls a function
passes happily while the button that should call it is unwired.

---

## Tooling

| Tool | Answers |
|---|---|
| `audit.js` | does it parse, render, and carry Arabic? |
| `ShopyLink_flow_check.js` | does every screen reach every other? |
| `contrast.js` | WCAG AA on text pairs |
| `controls.js` | does every control state a height? |
| `responsive.js` | flex rows that cannot wrap |
| `dupe.js` | functions defined twice |
| `growth.js` | grow every list 10× — what is the worst single page? |
| `roles.js` | every role × every module: what is visible? |
| `orphan.js` | unreachable functions |
| `slogan.js` | brand string, including inside base64 |

Run `audit.js` and `flow_check.js` on any module you touch.

---

## Constraints that are not negotiable

**ES5 only.** No `let`, no arrow functions, no template literals. Several files
are Babel-compiled, which means text inside `.concat()` does not sit beside its
tag — **print the rendered line before editing markup, do not guess its shape.**

**Bilingual everywhere.** Every warm string has an Arabic twin in that module's
dictionary — note the name, it is not always `T` (Billing's is `T_b9`). A pair
added to the wrong object fails silently and ships English under Arabic.

**Machine values stay left-to-right** under RTL: ids, codes, money, dates.

**The brand is never drawn.** Logos are the asset files in `assets/`, embedded.
Characters and shapes arranged to look like the wordmark have been removed from
this codebase three times.

**Money always carries two decimals.** `toLocaleString` is forbidden — it varies
by locale and has produced wrong figures on invoices.

---

## Where the prototype stops

Honest about the edges:

- **No backend.** `localStorage` stands in for a server; the channel shapes are
  the API contract when one is built.
- **No authentication.** Signing in is choosing a person from a list.
- **The individual and driver apps are screen galleries**, not wired apps —
   is the fullest of them, every screen as its own
  phone frame. The business app is wired, with one working screen.
- **Documents are specimens until published to.** A sheet with nothing on its
  channel shows sample data **and says so in its chrome** — that is deliberate.
- **Some seed data is fictional** — names, prices, HS codes. Treat none of it as
  reference data.

---

## If you change one thing, change it here

The permission model lives in **`ShopyLink_Action_C9_Staff.html`**: department ×
level, published to `SL_STAFF_V1`. Every module's `actorMay()` reads it.

**Permission is checked at the act, not only on the button.** A hidden control
is for clarity; the refusal happens inside the function. Keep both.
