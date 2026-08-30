# The prompt: one site, many roles

Paste this to any capable AI, together with the module files. It describes what
to build in terms of what already exists, so nothing has to be invented.

---

## The prompt

> Build a **single-page operations shell** that unifies a set of standalone HTML
> modules into one product a person can actually work in.
>
> **The problem to solve.** I have 37 self-contained HTML files (excluding the shell itself). Each works
> alone, each has its own header and simulator strip, and to move between them I
> open a different file. I want one site: sign in as a person, see only the work
> that person is allowed to do, and move between screens without ever thinking
> about files.
>
> **How it must work.**
>
> 1. **Sign in as a person, not as a role.** Show a list of real people from the
>    staff registry — name, job title, the hub they work at. Picking one *is* the
>    login. A "switch person" control stays reachable, because the whole point is
>    to see the same system through different eyes.
>
> 2. **The navigation is built from that person's permissions, not hard-coded.**
>    Each module declares which permission opens it. On sign-in, filter the list:
>    a warehouse clerk never sees the billing section — **not greyed out, absent.**
>    If the person has no permission for a module, it is not in the sidebar and
>    its URL does nothing.
>
> 3. **Modules load into one frame, keeping their own state.** Use an iframe per
>    module inside the shell, or inline them — either is fine — but the shell
>    supplies the chrome: sidebar, breadcrumb, the signed-in person, language
>    toggle. **Each module's own top bar and simulator strip must be hidden**
>    when it runs inside the shell, so there is one header on screen, not two.
>
> 4. **Deep links.** `#/billing/quotes` opens that module at that screen. The
>    browser back button walks the history. A refresh lands where you were.
>
> 5. **They already talk to each other — do not break it.** The modules share
>    state through `localStorage` channels (`SL_EVENTS_V1`, `SL_STAFF_V1`,
>    `SL_CLIENTS_V1`, `SL_DRIVERS_V1`, `SL_HUBS_V1`, `SL_APPROVALS_V1`,
>    `SL_QUOTES_BIZ_V1`, `SL_QUOTE_V1`, `SL_CMR_V1`, `SL_FLOAT_V1`, `SL_DRIVER_SPEND_V1`, `SL_TARIFF_V1`, `SL_GATES_V1`, `SL_CENTRES_V1`, `SL_ACCOUNT_V1`, `SL_SHIPMENTS_V1`, `SL_TRIPS_V1`, `SL_NOTICES_V1`, `SL_ZONES_V1`, `SL_THREADS_V1`, `SL_STOPS_V1`, `SL_TRUCKS_V1`, `SL_COUNTRIES_V1`, `SL_AGENTS_V1`). Same-origin iframes share
>    that storage, so a quotation confirmed in Billing appears in Receiving
>    without any work from you. **Do not proxy or wrap these channels.**
>
> 6. **A work queue on the landing page.** Read `SL_EVENTS_V1` and show what is
>    waiting *for this person* — shipments expected, quotations awaiting an
>    answer, approvals pending — each a link into the module that handles it.
>    Someone signing in should see what to do next, not a menu.
>
> **What good looks like.** I sign in as a warehouse clerk in Damascus, see three
> parcels expected today, click one, receive it, and the trip module knows.
> I switch to the accountant, and the same shipment is waiting to be invoiced.
> **At no point do I choose a file.**
>
> **Constraints.** ES5 only, no build step, no framework, no external
> dependencies. Every string bilingual English/Arabic with `dir` switching.
> Machine values — ids, codes, money, dates — stay left-to-right under RTL.

---

## What to attach

- Every `ShopyLink_*.html`
- `RULES.md` — the standing rules
- `PROJECT_INDEX.md` — what each module does

---

## The facts a model needs, so it does not guess

**The roles** are in `SL_STAFF_V1`, published by `Action_C9_Staff`. Ten of them:
`admin · acct · wh · disp · sales · driver · hubsup · customs · audit ·
support`, across 24 people, each carrying a `perms` array.

**The 32 permissions** are the connective tissue. Examples: `b1_ind` and
`b1_biz` open receiving, `b9_build` and `b9_issue` are billing's two levels,
`t_create` and `t_customs` belong to trips, `pr_agreed` opens agreed pricing.
A module maps to one or more of these.

**The modules group into five families**, which is the natural sidebar:

| Family | Modules |
|---|---|
| Intake | Receive parcel · Consolidation · Smart registration · Addresses |
| Trips | Create trip · Loading · Trip journey · Border fees |
| Destination | Arrival receive · Dispatcher · Delivery · Zones |
| Money | Billing · Pricing · Claims · Cards · Gift cards |
| Admin | Staff · Drivers · Trucks · Hubs · Agents · Approvals · Control · Dashboard |

Documents (`Doc_Invoice`, `Doc_Quotation`, `Doc_CMR`) are **printables, not
screens** — they open in a new tab, because they carry their own A4 print rules.

The three apps (`IndividualApp`, `BusinessApp`, `Driver_App`) are **not part of
the staff shell** — they are what customers and drivers use, and belong behind
their own sign-in.

---

## Two warnings worth passing on

**Do not rebuild the modules.** They hold months of decisions — permission Before writing anything new — a module, a table of records, or a rule — run `node wiring.js find <word>` and read the strongest match. Four things were built this week that already existed, and each original was better than its copy.
checks at the act rather than the button, growth caps, bilingual dictionaries,
audit attribution. The shell wraps them; it does not replace them.

**Hiding a module is not securing it.** The modules already refuse an
unpermitted act internally (`actorMay()` before doing, not just before showing).
The sidebar filter is for clarity, not safety — say this explicitly or a model
will treat navigation as the access control.

---

## The test that tells you it worked

Sign in as **Khaled Omar** (a warehouse clerk). Count the sidebar entries. Sign
in as **Omar Al-Masri** (admin). Count again. **If the two lists are the same
length, the permission filter is decorative and the build has failed.**
