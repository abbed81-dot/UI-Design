# ShopyLink — standing rules and checklists

Every rule here exists because something broke. The note after each one is the fault that
created it, kept so nobody argues the rule away later.

Run `node verify.js` before shipping anything. It is the checklist, executed.

---

## A · Brand

| # | Rule | Why it exists |
|---|---|---|
| A1 | **Never draw a logo.** Brand assets are embedded byte-for-byte from `/mnt/project/`. | An invented SVG mark shipped on the invoice. |
| A2 | **Never write a brand string from memory.** The slogan is `world · to · door`, copied. | 25 wrong instances across nine files, four hidden inside base64 payloads. |
| A3 | **Arabic gets the Arabic lockup.** Where no Arabic tagline lockup exists, stack `sloganar.png` — do not draw one. | The Arabic invoice was showing the Latin mark. |
| A4 | Brand colours are for **surfaces, borders and chips**; the deep shades are for **filled buttons**. | White on `#0EA5E9` is 2.77:1. |
| A5 | **Text colour is never transparent.** `rgba` has no fixed contrast — it depends on whatever sits behind it. Hint text is the explicit token **n6 `#62707A`**. | 314 hint strings were `rgba(11,42,59,.6)`, passing on one background and failing on another. |
| A6 | **No colour outside the token sheet.** | A stray `#8B5CF6` avatar chip, and white text on a white bullet. |

## B · Language

| # | Rule | Why it exists |
|---|---|---|
| B1 | **Every warm string has an Arabic twin.** A screen in Arabic must contain no English prose. | The Arabic invoice kept English line items. |
| B6 | **Money always carries its decimals** — `313.30`, never `313.3` — with thousands separated. A truncated-looking figure on a billing screen makes the reader distrust the whole number. And `toLocaleString()` is an Intl call the legacy-engine rule already forbids. | The issue-invoice dialog read *313.3 USD*. |
| B2 | **Machine values never translate**: money, weights, dates, identifiers, IBAN stay Western digits, LTR, monospace. | Converting them breaks banks, accountants and the developer's parser. |
| B3 | Under RTL, **numeric columns stay left-aligned** and dividers move with the direction. | |
| B4 | Labels switch language; they do not show both at once. | |
| B5 | **Arabic carries the meaning, not the words.** Write what a Syrian forwarder would actually say, then check it against the English — never translate term by term. Trade words are the trade's own: *أرضيات* not *غرامة التأخير*, *مهلة السماح* not *الوقت المجاني*, *ما انقبض ثمنها* not *لم يُقبَض*. | Several consequence lines read as dictionary output: *تشيخ الذمّة سلّةً أخرى* is English grammar in Arabic words. |

## C · Layout and geometry

| # | Rule | Why it exists |
|---|---|---|
| C1 | **Every control states its height.** Padding alone is not a height. | 142 controls had none; selects sat proud of inputs. |
| C2 | **A drawn arrow needs reserved room** — `appearance:none` plus 32px of end padding, mirrored under RTL. | The Cards dropdown arrow was jammed on the edge. |
| C3 | **A row of label+value cells is a grid with fixed rows**, never centred cells. | A longer value lifted its own line above its neighbours'. |
| C4 | **Every cell in such a row has a label**, even if it is one word. | The status cell had none and sat a whole row high. |
| C5 | Values in a strip **do not wrap**. | |
| C11 | **Several fields on one row belong in a grid, not a flex.** Four flex children each demanding a minimum width add up past the card and push the last one off the page. `repeat(auto-fit,minmax(…,1fr))` wraps them as columns instead. Inputs state `box-sizing:border-box`, and a unit belongs in the label rather than beside the box stealing its room. | The cargo row overflowed and its labels broke onto two lines. |
| C9 | **A date is picked from a calendar, never typed.** `type="date"` with a `min` that blocks the impossible — the past for a new leave, the current date for an extension. **And once there is a calendar, the format hint goes**: naming the string format is noise the reader must ignore. | Leave asked for *YYYY-MM-DD* as text — a spelling test that fails differently in every locale. |
| C6 | **Do not duplicate a breakpoint another rule already owns.** | An added 820px block left a dead band where the sidebar had no geometry and vanished. |

## C7 · Growth — the design is built for the set it will hold, not the set it holds today

| # | Rule | Why it exists |
|---|---|---|
| C7 | **A choice is made from a dropdown. The option set is never laid out on the page — not at five, not at five hundred.** `slPicker()` renders a `<select>` with a blank prompt, an optional **add** button beside it, and the count. Pick one, and the page shows *that one's* content. | Chips were tried first at a threshold of seven; the user rejected it and was right — a control whose size depends on the data makes the page change shape as the business grows. A dropdown is the same size at 5 hubs and at 100. |
| C7b | **Multi-select is a different control from single-choice.** Above the threshold it also has to **keep the chosen items visible**, because with a hundred options a selection scrolled out of view is a selection nobody can see. `slMultiPicker()`. | Three rows were multi-select and would have been silently broken by converting them to a single-choice picker. |
| C7c | **A fixed vocabulary is not an option set.** Three hub types or three stop kinds stay as chips — hiding one of three behind a dropdown costs a click and gains nothing. The rule is about sets that **grow with the business**. | |
| C7f | **Previous and Next are always drawn, disabled at the ends.** Hiding them when the list fits on one page means the reader cannot tell whether the list is complete or the control is missing — and *page 1 / 1* says the former plainly. | They were reported missing on the cards screen, which had six cards and therefore one page. |
| C7e | **A catalogue is paged, not capped.** A cap with *show all* suits an alert list, whose tail is noise. In a catalogue every row is a real thing someone may need to reach, so the tail is reachable **in steps**: page size **20 / 50 / 100** chosen by the reader, a stated range (*1–20 of 206*), and Previous/Next. **Each list keeps its own page and size**, and a filter that shortens the list moves you to a page that still exists rather than stranding you on an empty one. | |
| C7d | **A long list of records is ranked, capped and labelled, not truncated.** Show the ones that need attention first, say *"14 of 93 — busiest first"*, and keep a way to see the rest. | The manager board drew every person: at 93 it grew 2.7× into a roll call, when what a manager needs is who is struggling. |
| C8 | **Anything that can grow must be checked at scale before it ships**: add twenty rows to the array and look at the screen. **This is how the crash below was found.** | |

## D · Mobile — every interface, all detail, nothing hidden

| # | Rule | Why it exists |
|---|---|---|
| D1 | Consoles stay optimised for desktop but must **work completely** on a phone. | User ruling, amending the desktop-only reading. |
| D2 | **Tables scroll inside their own box**, never push the page sideways. | |
| D3 | Touch targets ≥ 44px; **inputs 16px so iOS does not zoom on focus**. | |
| D4 | Nothing is hidden to make it fit. If it does not fit, it changes shape. | |
| D5 | **Inline flex rows wrap below 767px, and auto-margin spacers stop pushing.** | *Simulate issue* was shoved past the edge of a narrow window by a `margin-left:auto` in a row that could not wrap. |
| D6 | **Modals size to the viewport**, never to a fixed pixel width. | |

## E · Navigation

| # | Rule | Why it exists |
|---|---|---|
| E1 | **A prototype state switcher is not navigation.** Every page carries its own way through. | Price review and Supplier API were unreachable in practice. |
| E2 | Navigation must be **legible**: ≥11.5px and ≥4.5:1. | The switcher was 10px at 3.35:1. |
| E3 | A destination shows **how much is behind it** — a tab, a queue, a tray. | |
| E6 | **A "+N" chip must open.** A count of hidden things that cannot be shown is a label that tells you something is missing and refuses to help. | *+16* on a staff card listed sixteen permissions nobody could read. |
| E7 | **An action belongs where its subject is.** A person's leave is granted from the person's card, not only from a board elsewhere. | Leave was built and reachable only through the roster panel. |
| E3b | **But a count beside a control that already shows its contents says nothing.** A dropdown listing three hubs does not need a "3" next to it. Counts belong where the contents are hidden. | A bare `3` sat between the hub dropdown and the field, meaning nothing to anyone. |
| E5 | **One action, one control.** If a button can ask for what it needs, it does not also need a field sitting empty beside it. | An empty *Hub* text box duplicated what *+ Add hub* could ask for itself. |
| E4 | **No dead link, no silent button.** | Enforced by the flow check. |

## F · Safety and honesty

| # | Rule | Why it exists |
|---|---|---|
| F17 | **An audit entry names whoever acted, never a literal.** A log that attributes every approval to the same hard-coded person is worse than no log: it looks authoritative and is false. Where the actor is unknown, it says **unattributed** rather than borrowing a name. | Twelve approvals across five modules recorded *Omar Al-Masri* or *Mona Said* whoever pressed them. |
| F19 | **What you may not do, you do not see.** A disabled control says *you could, but not now* and sends the reader hunting for a condition that will never be met; an absent one says *this is not your work*. Hide it — and still refuse the call, because hiding is presentation. **Unknown is not refusal**: with no registry the control stays, since the module cannot tell and must not guess "no". | A warehouse clerk saw an enabled *Issue invoice*; eight roles including a driver saw *Reassign*. |
| F18 | **A permission is enforced at the act, not only in the interface.** Hiding the button is presentation; refusing the call is the rule. | *Issue invoice* could be called directly by anyone who reached the screen. |
| F1 | **Nothing is ever deleted** — void, archive or cancel, always with a reason. | |
| F20 | **Issuing and sending are two acts.** Issuing mints the number and freezes the document; sending is a separate decision, by a named channel, to an address the client actually has. Merged, a document can never be issued without going out and a resend is impossible. | *Issue & send to client* was one button. |
| F2 | Reversible single actions execute with **Undo**; multi-record and irreversible ask first. | |
| F12 | **Type-to-confirm is for irreversible bulk actions only.** On a single act it teaches copy-paste, not care — the reader stops reading and starts transcribing. Confirm with a clear statement of consequence instead. | *Issue invoice* demanded a 13-character reference be retyped to bill one customer. |
| F3 | **A refusal states the reason** in the user's language. | |
| F9 | **A dialog must ask for what it actually wants.** A name is not a reason: `askText()` for a value, labelled with the thing itself; `askReason()` only for a justification that goes on the record. **A constructive act is never dressed as a warning** — no ⚠, no red button. | *Add hub* was reusing the reason dialog, so it read *"⚠ Add hub"* with a field labelled **Reason** and a red confirm — and demanded five characters of justification to name a warehouse. |
| F7 | **Never add a second control for an action that already has one.** Find the existing one first. | An *add a hub* button was added beside the dropdown while *+ Add hub* already existed beside its input — and mine could never work, because the name is typed in that input. |
| F27 | **An audience decides what an app contains.** An individual buys from a fixed list — nothing to negotiate, nothing to approve. A business account was quoted for a job and must be able to accept it or say what is wrong with it. Putting an approval into a consumer app gives a decision to someone who has none to make. | A quotation engine was wired into the individual app; billing had refused to quote an individual all along. |
| F26 | **Money spent for a client is followed to the end.** Four questions, all answered or the record is incomplete: **who paid it**, out of which pocket · **has it actually left** — recorded is not paid, and an agent's account is a debt until settled · **who bears it**, allocated by declared value across the trip · **did it come back**, as an invoice line **at cost**. A disbursement recovered is not a service sold, and is recovered once. | 120 USD at a crossing, billed to nobody. |
| F25 | **A permission to work is checked against the work.** A driver's visa matters only for the countries this route crosses; a document expiring next week is a warning, one that expired yesterday is a bar. Judge the person against the journey, not against a checklist. | |
| F23 | **A fact is keyed once.** When a module learns something another will need, it announces it — the second module starts from what was agreed rather than a blank form. The client, the route and the carton count were being typed three times before this. | |
| F24 | **What was promised is compared with what arrived, at the moment it arrives.** The person at the bench is the only one who can see a short shipment; saying nothing there means it surfaces at the invoice, weeks later, as an argument. | |
| F21 | **A record created from another carries everything that other one knew.** A quotation holds the route and the cargo; the shipment it becomes must not start blank, or the clerk retypes what they typed a minute ago and the two records disagree the first time one is corrected. | Confirming a quotation created a shipment with `from:''`, `dest:''`, `weight:0`. |
| F22 | **A figure that cannot be explained cannot be checked.** Where a trade prices by a unit — sea by CBM, air by chargeable kg — the quote is **rate × quantity**, with the quantity read from the cargo already entered. The result stays editable, because an agreed rate beats arithmetic; but the arithmetic is on screen. | Carriage prices were typed as one lump. |
| F16 | **Routing and permission are different questions, and work needs both.** *Which role does this kind of job go to* is not *was this person granted it*. Checking only the first is how a task lands on someone who cannot finish it. | D1 routed by role table alone while C9 held the grants. |
| F11 | **The owner publishes; consumers read.** A shared record is carried on a registry channel, never retyped in the module that needs it. Best effort: if the channel is unreachable the consumer **says so** and falls back, and no work is ever blocked by the bus. | Pricing was asking people to type a hub name that had to match C7 exactly. |
| F10 | **One owner per record type.** A screen that consumes a record must not be able to create a thinner copy of it. If it is missing, the screen says **where it is created** and sends you there. | Pricing was minting hubs from a name alone, while C7 Network holds the real hub with city, address, phone, WhatsApp, hours, manager and coordinates. Two sources of truth for one thing. |
| F8 | **Never invent a field.** Read the record before writing to it. | A `country` field was added to `SERVICES`, which has none — the hub name already carries it — and every option printed *undefined*. |
| F4 | **Never assume a default that could be wrong** — no assumed background, no assumed record, no invented promise. | Three checkers lied by assuming. |
| F13 | **An absence has an end date, a grant, and a return that is confirmed.** Leave with no return date is refused; the request is *pending* until a system administrator grants it; on the due day the board asks whether they are actually back and **does not assume it**; a late return is recorded; and *still away* extends the date rather than forcing a false confirmation. | A driver could be sent on leave with one click — no date, no approval, no way back. |
| F14 | **Every screen renders the dialog layer.** A screen that omits `modalHTML()` has buttons that silently do nothing. | The staff roster called it on one screen only, so *every* dialog on the list — leave, suspend, reactivate — opened invisibly. |
| F15 | **Permissions come from a department and a level, not from ticking a list per person.** The department says which family of work they touch; the level says how far inside it — **L1 does the work · L2 approves and corrects it · L3 sets the rules.** A role stays for exceptions and an override for the exception to the exception, and **every permission on a card names which of the three granted it**. | Twenty-four ticks per person does not survive the fifteenth hire: whoever does it copies the last person's boxes and the reason is lost. |
| F5 | A new thing arrives **inert**: a supplier switched off and untested, a client provisional and prepaid. | |
| F6 | **Derived values are never hard-coded.** | `CLSEQ=3` collided with the first seeded record. |

## G · Code

| # | Rule | Why it exists |
|---|---|---|
| G1 | **Reuse before writing.** Check the file for an existing function, constant or pattern first. | |
| G1b | **And check the SYSTEM before building a module, a table or a rule.** `node wiring.js find <word>` — read the strongest match before writing anything. If the thing exists, extend it or read from it; a second copy is not a second opinion, it is a future disagreement. | Four in one week: an addresses screen beside the centres panel, a notice board beside D1's, a whole console beside D1, and a second rule for releasing past a credit limit (`role==='manager'` here, `level>=3` there). **Every time the original was better than the copy.** The cost of asking is a second; the cost of not asking was a day. |
| G2 | **A function defined twice in one file is always a bug** — the later one silently wins. | `toggleKey`, `setLang`, `ns`/`setNs` collisions. |
| G3 | Cross-file duplication is **the architecture**, but the shared shell has **one canonical source**. | |
| G4 | **A capability with no way in is not a feature.** | Six unreachable capabilities found. |
| G5 | **ES5 only**, `Array.prototype.find` polyfill, literal hex, no `calc()`/`vh` for critical heights. | |
| G6 | Every file: `window.onerror` beacon, try/catch render, `<noscript>` fallback. | |
| G7 | **Never run a blind find-and-replace across the codebase.** Change one file, verify it, then widen. And **never "revert" by replacing text** — restore the file. | A one-line emoji swap broke 13 files at once; the textual undo broke more; repairing it took four passes. |
| G9 | **Never transform HTML with a plain string replace.** Split on tags and touch only the text between them — an attribute value is not content. | The emoji-to-icon pass injected an `<svg>` inside a `placeholder="…"`, shredding the tag and printing raw code across the top of the page. |
| G10 | **Test what the page renders, not what the file contains.** | The source looked converted; the screen showed markup. |
| G8 | **Verify before shipping, and verify what you shipped.** The damaged files were copied to outputs before the check ran, so the restore source was damaged too. | |

## H · Tools — and the rule about tools

> **A tool that lies is worse than no tool.** Every checker here reported false results on its
> first run and was corrected before its output was trusted: the contrast checker assumed a
> background, the orphan checker read only `<script>` blocks, the duplicate checker counted
> scoped inner helpers, the control checker accepted a global rule that set no height.
> **Verify the tool against a known case before believing the report.** The responsive checker
> did it too: it accepted *any* `flex-wrap` inside a 767px query as proof of a wrap guard, and
> so passed every file while a button was still being pushed off the edge. It now looks for the
> specific guard, not for something that resembles it.

| Tool | Guards |
|---|---|
| `verify.js` | runs everything below and prints the checklist |
| `contrast.js` | WCAG AA on every stated text-on-surface pair |
| `slogan.js` | the brand string, including inside base64 payloads |
| `controls.js` | control height and arrow room |
| `responsive.js` | controls pushed out of view, rows that cannot wrap, fixed widths |
| `dupe.js` | duplicate definitions inside one file |
| `orphan.js` | capabilities with no way in |
| `shellcheck.js` | drift in the shared shell |
| `ShopyLink_flow_check.js` | dead buttons and silent state flips |
| `audit.js` | ES5 parse · renders · Arabic · legacy engine · green flag |
| `test_*.js` | 544 behaviour checks against the written contracts |
