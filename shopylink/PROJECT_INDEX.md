# ShopyLink — project index

> **Before shipping anything: `node verify.js`.** It runs every checker and prints the checklist.
> The rules those checks enforce are in **`RULES.md`** — each one with the fault that created it.
> Current state: **PASS on six checks, 670 behaviour checks, one declared open item** (module colours
> not yet migrated to the token sheet).

*Updated: 19 Aug 2026*

---


## THE CHAIN NAMED THE VEHICLE, NOT THE CARGO — and the client could not see either (28 Aug 2026)

Three pieces, one session. Verified from inside the unzipped package: **65 contracts, zero red**, `audit` / `dupe` / `flow_check` / `controls` / `contrast` / `responsive` clean on every touched file.

**1 · B9 reads the credit facility (`test_credit.js`, 61 checks).**
D1 publishes the facility on `SL_CLIENTS_V1` as an ANSWER — `hasCredit()` decides, so nobody reads `creditLimit:5000` off a revoked facility. B9 stops keeping its own opinion in `v.contract`: `setTerm('credit')`, `canIssue` and `issueInv` all read the published facility, and all three check at the act. Exposure is DERIVED from `invoice.issued` events (credit-term only; prepaid is not exposure, repeats counted once). Past the limit the invoice cannot be issued; a **level-3** manager may release it with a reason, recorded and named — and the release is bound to the figure it was given for, so a growing invoice voids it. Other currencies are REPORTED, never converted: there is no rate table, and an invented rate is a wrong invoice. `invoice.issued` is now declared, which closes D1's "invoice the delivered shipment" item.
*Caught by dupe.js:* `addClient` republished the channel in B9's own shape — which would have **erased the facility off every account**, and the check would then have read "prepaid" for a client with a 5,000 limit, silently. `clientsFanOut()` now preserves what the owner published and drops nobody.

**2 · Every step names its cargo (`test_cargolink.js`, 35 checks).**
B3–B8 declared TRIPS and RUNS. A real shipment therefore stalled at `consolidated` for ever while the board listed `TRP-2608-014` and `RUN-77` **as though they were shipments**. Now every trip- and run-level event carries `payload.ships`, the owner is declared once at `parcel.received` and never repeated, and D1 places a shipment at the furthest step that NAMES it — an id that never appears as cargo is not cargo and is not listed. `failedShips` identifies but does not advance: a failed attempt must never read as delivered.
*Two live faults found on the way:* `declareDelivered` read `s3.status`, a field B8 never writes (the real one is `s3.stt`) — so **every delivery event ever emitted said "delivered:0, failed:0"**. And the loose announcers in B4 and B6 passed the whole trip OBJECT as the id. `test_link.js` passed throughout, because it built its own events with the shipment id on every stage — the shape the modules never emit.

**3 · The client can see it (`test_track.js`, 46 checks).**
Business app: a tab bar, and a tracking screen that reads `SL_EVENTS_V1` in the same order D1 does. Seven stages from *Booked with us* to *Delivered*, each with the moment it was reached and "not yet" where it was not. Paged three to a card-page, Previous/Next always drawn and disabled at the ends. It shows no trip number, no run, no truck, no driver and **no name of any of our people** — the client asked where his goods are, not how the company is arranged. Cargo it cannot attribute is shown to nobody.

**4 · The individual app reads the log too (`test_indtrack.js`, 44 checks).**
It already drew the seven steps — from a number written into its own fixture. Now the position, the status chip and every moment on the timeline come from `SL_EVENTS_V1`, in the same order as D1 and the business app; a step nobody recorded carries no date rather than a plausible one, and the fixtures still draw so the gallery keeps working with an empty log.
The list now comes from the log too, not only the position: a parcel the warehouse received today appears even though no fixture mentions it, carrying the pieces and weight the log declared. It is listed once when a fixture also knows it, never when it belongs to somebody else, and a parcel whose origin is outside the rate table is **not payable** — "Pay now 0" is worse than no button at all.

*Found on the way:* the app had **no identity**. The account was known by a greeting — `'Obada'` in one dictionary and `'عبادة'` in the other — and a greeting changes with the language, so it can never be matched against the owner of a parcel. `ACCOUNT` now holds the person once; the greeting and the avatar letter are derived from it. The demo account is an individual who already exists in the client register and in the delivery data, so the chain runs end to end.

**5 · A parcel is priced when it is received, or it is not received (`test_receiptprice.js`, 35 checks).**
Two corrections from the owner, both turning a tolerance on the screen into a refusal at the source. B1 declared `to:'Damascus', mode:'land'` **written into the source** — the same two words for every parcel in the world — and priced nothing, which is why the customer app had grown a little rate table of invented figures. C-Pricing now OWNS and publishes the approved tariff on `SL_TARIFF_V1` (lanes for `ind` and `biz`, city extras, main hubs). B1 reads it, offers only routes the company actually sells (nothing is typed — a typed city drifts from the one in the tariff), prices the parcel by destination and method as it is chosen, and **refuses the receipt at the act** without an owner, a destination, a method, a weight or a price. Billing may reprice for the client later; the event says `source:'tariff'` so a reprice can be told from the original.
The owner then set the pricing law: **a parcel for a registered client is priced on his own category; a parcel for an account we do not hold is priced on the approved list, by destination, weight and method.** C-Pricing already held all of it — categories, personal discounts, agreed prices, and `resolveFor()`, the one function that knows the order (agreed first, then the higher of category and personal, never both). So the channel publishes the RESOLVED unit per client per lane, plus the base list for both tariffs: receiving reads an answer and never re-implements the rule, because a second implementation of one rule drifts the first time the rule changes. TechLine's 10 kg to Aleppo prices at 57.50 on his own record against 60.50 on the list, and **the screen names which of the two it used** — a clerk who cannot see the client rate applied cannot notice the day it stops applying.

*Found on the way, and worse than the rest:* B1 read its client from `st.customer` — **and `st` never existed in this module**. Every receipt ever declared carried an empty client. My own contract from earlier today passed on it, because it checked the source text for `client:` rather than the value that came out. Two chain contracts also had to be corrected: they received parcels with nothing filled in, which is exactly what is no longer allowed.

**6 · One approved exchange rate, owned and cited (`test_fx.js`, 31 checks).**
The tariff is written in USD and the customer apps speak Syrian pounds, and there was no rate anywhere — so a screen either showed a foreign currency to a local customer or somebody invented a rate. C-Pricing now holds `FX` and publishes it on the same channel as the tariff, and it changes the way every other published figure changes: type a new figure, give a reason, **L3 decides** — filing does not move it, and a second request cannot be stacked on the first. The customer app converts with that rate and **cites it**: the amount it converted from (to the cent, not rounded to whole dollars), the rate, and the day the rate was set. With no rate published the amount is shown in the currency it was actually priced in, and the screen says why. No module keeps a rate of its own, which the contract checks by reading the sources.

**7 · A lane may be sold by weight or by volume, and it is a choice (added to `test_receiptprice.js`, now 51 checks).**
The owner's answer to the sea contradiction was neither correction: the lane can be sold **both ways**, and the basis is chosen for the parcel — a light bulky pallet and a dense crate are not the same sale. B1 asks only where both are actually sold, showing the two measurements beside the question (`800.00 kg · 2.000 cbm`), and `totalCbm()` measures cubic metres from the dimensions the clerk already types for the volumetric weight — two different questions with two different answers (a metre cube is 1 cbm and 200 volumetric kg).
That also resolved the stranded agreement without inventing a list price: **a price agreed with a client IS a price the company sells at**, even on a basis the general list does not carry. TechLine's per-kg sea rate now travels on the channel for him alone and applies (1.60/kg); nobody else gains a per-kg sea price from it. Caught while looking at the rendered screen rather than the test: the picker was built from the general list while the price was worked out from the client's own lines, so a basis he could be sold on never appeared as a button — `basesFor()` is now the one answer both read.

**8 · Money that arrives is counted, and the ceiling finally empties (`test_paid.js`, 37 checks).**
`invoice.paid` exists. Exposure is now what was issued **less what came in**, so a client who pays on time stops filling his own ceiling — the opposite of what a facility is for was the behaviour until today. The owner set three rules and all three are enforced at the act:
· **Each collector declares what it took.** Billing declares cash and bank; delivery declares what a driver took at the door; the customer app declares nothing, because asking to pay is not paying. Receipts carry a number, so the same money counted by two modules shrinks the exposure once.
· **A part payment is a credit arrangement in miniature** — the client keeps the goods and owes the rest — so it is allowed exactly where credit is: a business with a granted facility. An individual pays the whole of it or does not pay yet.
· **A driver may take money only if he is permitted to.** The permission had no home at all, so it was added to the driver record in C2 (its owner) and published on `SL_DRIVERS_V1`. What he collects clears the client immediately and is held against **him** — the receipt names `holder:'driver:DRV-01'` and `remitted:false` — because between the door and the safe the money is in his pocket, not the company's.
What is owed at a door is read from the log, never typed there; the same door cannot be collected twice; and a stop carrying no shipment collects nothing rather than guessing which.
*A rule was retired, not deleted:* `test_b8.js` asserted that B8 handled no money at the door — not even the words. That was the earlier design; the owner has now ruled otherwise, and the old rule is written out in the file where it stood so nobody restores it by accident.

**9 · Remittance: the driver's pocket empties into the safe (`test_paid.js`, now 53 checks).**
Collections sat against the driver on the log with `remitted:false` for ever — the money existed and belonged to nobody in particular. Remittance is declared where the money arrives, at the billing counter, as `cash.remitted`, and what a driver holds is **derived**: collected less remitted, never a stored balance. He may hand over part and keep the rest; more than he holds is refused; an empty pocket gives nothing; and the receipt names both the driver and the person who received it. Billing shows the holdings unprompted, so nobody has to ask a driver what he is carrying. Moving cash between our own hands never touches the client's exposure — his debt cleared at the door, and §8 pins that down so the two ledgers are never confused for one.

**10 · Nothing leaves without its papers (`test_docgate.js`, 50 checks).**
The control board drew a gate and nothing was ever gated: a trip could be dispatched with no invoice, no permit and no packing list, and the first anybody heard of it was at a border. D1 owns the checklist — which papers, for which mode, at trip level or per shipment — and now publishes it on `SL_GATES_V1` with both languages' labels, so no reader invents a name for a document. B3 reads it and derives the list from the trip itself: a land trip with three shipments needs thirteen papers, the permit once for the whole trip and the invoice for **every** shipment.
A tick is not a file: it records that a **named** person says the paper is in hand, with the moment he said it, and it can be taken back. A conditional paper ("if insured", "if the lane requires it") counts as missing until somebody deliberately sets it aside. Dispatch is refused **at the act**, not by grey-ing a button; dispatching without them is a level-3 decision with a reason, recorded and named, and it covers only what was missing when it was granted — add a shipment afterwards and its papers are missing again, because they are. With the rules unpublished the module says so and still works, because a prototype that cannot dispatch while a bus is down is broken, not careful.
*Found on the way:* `askConfirm()` was called from three places in B3 and **defined in none** — every one of them threw the moment it was clicked, quietly, because nothing was watching. It is defined once now and mounted on every screen, so the crossing dialog works too. And `actorRec()` did not exist there either, so the module could not have told a manager from an operator even if it had wanted to.

**11 · The rate change actually lands (`test_fx.js`, now 42 checks).**
The rate could be requested but nobody had followed it through: the request went to C12 as op `base`, so an approver read **"Edit base price list"** on a screen that was about to move every price shown to a customer in pounds. `fx` is now an op of its own in the approvals catalogue at level 3, named in both languages, and the loop is driven end to end in the contract — filed in Pricing, refused to a level-1 approver, approved by a level-3, applied by Pricing on its next pass, republished, and read by the customer app in the same run.
*Caught by looking at the applied value:* `stampP()` is a **clock** — it returns `19:25` — and the applied rate carried it as its date. Sliced to ten characters it is still `19:25`. A date is a date; the rate now stamps `2026-08-28` and the contract asserts the shape, not merely that something was written.

**12 · The approved rate is set: 1 USD = 135 SYP (28 Aug 2026).**
Given by the owner, seeded on the record it belongs to, and changeable from the screen through the L3 request that was proven end to end above. Two contract assertions were rewritten so they follow the approved rate rather than a number typed into the test — a test that hard-codes the figure it is meant to be checking starts failing the day the business changes, and gets "fixed" by editing the expectation.
*What the real rate exposed:* the individual app's own `RATES` table (USA 95, China 60, Turkey 55 per kg, in pounds) is **not on the same scale as the published tariff**. Guangzhou air is 6.50 USD/kg — 878 SYP at 135 — while the app's table asks 60. The invented table was never merely a duplicate; it is out by more than an order of magnitude, and any parcel still priced from it under-charges by that much. It survives only as the fallback for the gallery fixtures, whose origins (USA, China, Turkey) are not lanes the tariff sells.

**13 · One tariff prices everything the customer sees (`test_indtrack.js`, now 56 checks).**
The owner chose to move the fixtures rather than keep two scales: the six gallery parcels now sit on lanes the company actually sells — Guangzhou, Istanbul, Dubai — each carrying a destination and a method, because a price needs both. `RATES` is deleted. Every figure on the screen is the published tariff unit × the weight, in the tariff's currency, converted by the same road a real parcel takes and cited with the approved rate and its date. With no tariff published nothing is priced and nothing is asked for.
*Found while looking at the result:* the arrival banner read "your USA warehouse" — a country written into the source — and went on saying it after no parcel came from there. It names the warehouse the arrived parcel is actually in.

**14 · Two rules from the owner (added to `test_receiptprice.js`, now 68 checks).**
· **Every published price changes through one door.** Editing a base price needed L3; **adding** a lane and **deleting** one needed nothing — so an operator could not move a price by a cent but could publish a whole new one, or remove one, alone. A deleted lane silently unprices a route until somebody notices at a counter. Both now file an L3 request like an edit, showing what would be published (`— → 9.50 USD`) or withdrawn, and neither takes effect until the approver signs.
· **An individual receives into Syria, always.** Business cargo goes wherever the company sells a lane; a forwarding address is a different thing — the person bought it because he is in Syria, and his goods come to him. The Syrian cities are the only destinations offered to an individual, the receipt refuses any other at the act, and the screen says why the list is short. A parcel routed abroad for a man sitting in Damascus is not a typo a border catches.

**15 · Three levels of service per destination (added to `test_receiptprice.js`, now 84 checks).**
Only three countries existed, written into the source, so cargo could not be sent anywhere else however much the company wanted to. The first attempt at a fix asked for a "main hub" per country — which quietly claimed a presence the company does not have. The owner corrected it: **a destination needs no hub of ours.** Three levels, all of them things the company sells:
· **port** — port-to-port or door-to-port. The cargo is handed over at the arrival port or airport; there is no local pickup and no local delivery. **Business cargo only**, because nobody sends a person who bought a forwarding address to clear his own carton at a port.
· **hub** — we keep a hub there and carry on from it.
· **door** — we keep a warehouse and deliver locally, which is the only thing that makes a country a local destination.
The arrival point is a port until we have something of our own there. An individual is offered only door-level destinations, and Syria remains his only country. The clerk sees the level beside the destination he picks, before he promises anybody a door. Opening one is an L3 request like every other published price, and so are adding or removing a lane and adding or removing a city — pressing "add" no longer publishes anything anywhere in this module.
*Removed rather than published:* the registry briefly carried `business:true` on every row, which told a reader nothing at all.

**16 · Which origins an individual may ship from (`test_indtrack.js`, now 68 checks).**
The line under "Buy an address" was a hard-coded string — `UAE · USA · China · Turkey` — so it would have gone on promising a warehouse after we closed it and hidden one after we opened it. Three facts, three owners: **C7** holds the hubs, **Pricing** decides which of them are offered to individuals, and the **app only reads**. The owner's rule is enforced: opening a hub does not put it in front of individuals — that is a separate L3 decision, and asking for it changes nothing until the approver signs.
*Found on the way:* C7 published each hub's id, name, city, country and phone **but not its type** — so no reader could tell a receiving warehouse from a delivery hub, and "which origins do we operate" was unanswerable outside that one file. The type and the status travel now, and a suspended hub is offered to nobody.
The app currently shows three countries because C7 holds no American hub; the owner creates it there (`Create hub` exists — my first search used the wrong name and I reported it missing, wrongly), then offers it to individuals at L3, and the fourth appears by itself.

**17 · The centres panel (`test_centres.js`, 33 checks).**
The owner remembered building this, and he had: the four centres lived in the customer-facing addresses screen with their real address lines, their rates and their subscription prices — **publishing nothing**. The address a man gives his shop was held in a file no other module could read, beside rates on the same wrong scale we deleted this morning.
A **centre is not a warehouse**, and the system had no way to say so. A centre is now a record of its own — the address a customer is given, the warehouse that **serves** it (which may be in another country and may serve several), the methods it ships by, and the fee for **owning the address**. Carriage is not there: that is the tariff's, and one price in two places is one price too many. All four are published on `SL_CENTRES_V1`, and America is registered — country, city and receiving hub at Charlotte, taken from the company's own address, not invented.
Opening a centre or moving a subscription fee is **level 3 and nothing less**, as the owner ruled. Opening one does not offer it to individuals: that stays the separate approval built earlier.
*Two faults found while building:* C7 had **no approvals door at all** — countries, cities and hubs are created there on the spot by anybody — so the company's own bus was wired in rather than a second mechanism invented beside it; and it had no dialog that hands a typed reason to the act, so one was added (a reason dialog that drops its sentence is worse than not asking). Then the new screen was the only one that did not prefix `modalHTML()`, so the approval dialog opened **invisibly** — the file could be approved only by calling the function directly, which is exactly the dead button nobody notices until a manager tries to use it.

**18 · The customer screen reads the panel (added to `test_centres.js`, now 42 checks).**
`ShopyLink_Addresses.html` showed the customer an address and a fee out of its own copy while the panel that manages them sat in C7 — two copies of one fact, and the first fee changed in the panel would have left this screen quoting the old one to the man whose money it is. It reads `SL_CENTRES_V1` now: the centres offered to individuals, their address lines character for character, and the fee the manager approved. The local rows survive only as `COUNTRIES_SEED` and `PLANS_SEED` for the gallery when nothing is published — named as seed so nobody mistakes them for the record — and nothing reads them directly any more. The contract drives it end to end: a monthly fee raised in the panel, approved at L3, is quoted by the customer screen in the same run.

**19 · Registration registers somebody (`test_registration.js`, 32 checks).**
Five screens existed and produced no record: every field was a picture of a field, no button was wired to anything, and the identity the whole customer app rests on could be changed only by editing a line in its source — which is not a system, it is a demo of a door. Registration now writes three things, each to its owner: the **client** onto `SL_CLIENTS_V1` without disturbing a field D1 owns on anybody already there (TechLine keeps its facility — the fan-out rule billing learned the hard way); a **`client.registered`** event on the shared log, with the time, the name and that he did it himself rather than a clerk doing it for him; and **`SL_ACCOUNT_V1`**, which is how this device knows whose it is. A new client is **prepaid and owns no cargo**: registration grants no facility and claims no shipments. The same name cannot be registered twice, and half an answer registers nobody.
*Fixed while testing:* the app read its account **once at load**, so somebody who registered while it was open stayed invisible until a reload — and no contract could see it either. It reads on every pass now.

**20 · The delivery nobody could attribute (contracts updated in `test_paid.js`, `test_b8_split.js`).**
The fourth stop on the driver's run was **a customer the gallery invented** — "Noor Trading Co", with a phone, an address, coordinates, three cartons and two failed attempts, everything a stop has except a shipment, because B8's run and B7's dispatch register were written as two islands and nobody had to go through the dispatcher to add a stop. It survived a year because nothing asked: receipts carried no client, deliveries declared a **count**, and B8 read a field it never wrote. The moment the chain began naming its cargo it stood out as the one delivery nobody could attribute, and once money could be collected at a door it became a receipt nobody could raise.
It is a real delivery now — Ahmad Khalil, `CON-240703-02`, from B7's own register — in **both** copies of the run (the ops module and the driver app), keeping the two failed attempts the screen exists to show. Its map pin is left **empty** rather than reused: those coordinates were in Mezzeh and this address is in Midan, and a wrong pin sends a driver to the wrong district. Every stop on the run now names its cargo: `delivered:4, named:4, unnamed:0`.
*A contract had to be rebuilt rather than retargeted:* `test_paid` proved "a stop with no shipment collects nothing" **by pointing at the fault**. With the fault gone the case is constructed inside the test, because a rule that needs a broken seed to be testable is not tested at all.

**21 · A shipment cannot appear or vanish (`test_continuity.js`, 26 checks).**
The owner stated the law and asked for it to be checked rather than believed. Half of it held and half did not.
**Held:** a shipment that fails delivery is not an ending. After one failure it stands at "out for delivery", after two it is still there and still **one** shipment rather than one per attempt, it stays in the in-flight list where somebody will look for it, and only a real delivery moves it to delivered and out of the list. All three attempts stay on the log, the two failures included; reading the board writes nothing and deletes nothing.
**Did not hold:** a shipment could **appear from nowhere in the middle of the chain**. Any step that listed an id was treated as proof the cargo existed, so a trip naming `GHOST-001` put it on the board as "arrived" though no warehouse ever received it. Now only being **taken in** — or **booked**, which is a promise made to a client — brings a shipment into existence; consolidation may name parcels it did not itself receive, because each was received a moment earlier on its own; and every later step **moves** a shipment without conjuring one. What a later step claims and cannot account for is reported by `shipGhosts()`, naming the first step that claimed it: a fault to be seen rather than a row to be drawn.
*Recorded, not asserted:* at runtime the log is the register and the law holds. But each module still **seeds its own shipment ids** — B7 holds seven deliveries of which five are not on D1's board, B9 invoices one that D1 has never heard of — and nothing reconciles them. The contract measures this and prints it rather than passing over it. A published shipment register is the honest next step.
*Also noted:* D1 counts six stages from receipt while the customer apps count seven from the booking. Worth knowing rather than wrong.

**22 · The shipment register, derived and published (added to `test_continuity.js`, now 41 checks).**
Nobody owned the shipments. The log said what happened to them and the board worked out where each stood, but that answer never left D1 — so every module seeded its own ids and B7 held five deliveries the board had never heard of. `SL_SHIPMENTS_V1` now carries, per shipment: the **owner** declared at receipt, its **origin, destination and method** (a shipment has all three or it was never received), the **price it was taken in at**, the stage it has reached, how many delivery attempts have **failed**, and whether it is still open. What claims to exist and cannot be accounted for travels alongside as `ghosts`, never as a shipment.
It is **derived on every pass and stored nowhere**: the facts stay in the log where the people who did them wrote them, and D1 owns the derivation rather than the events. Reading it twice does not double it.
*And one order of stages everywhere:* the board counted six from the receipt while both customer apps counted seven from the booking, so the same shipment read differently depending on who was looking at it. The board counts seven now, beginning where the promise to the client begins, and the contract asserts the three lists are the same seven events in the same order.
*Two of my own claims had to be retired:* the contract said the board shows no stage for a booking, and that no register is published. Both were true when written and false an hour later. They are rewritten rather than deleted, so the change is visible.

**23 · Booting from the register, and the district that made it possible (`test_continuity.js`, 53 checks).**
**B3** reads the register: what is ready to load is what was taken in and is not yet on a trip, so a parcel received minutes ago can be put on a trip — it could not before — and a shipment nobody received cannot be loaded at all.
**B7** was wired, reverted, and then wired properly. The dispatcher assigns a driver to a **district**, and the register only knew the city, because the district was nobody's field. The owner's answer: it comes from the **client's own address**. It is captured when he registers, held once on his record, published with him, carried on his shipment, and **translated** into a zone by the module that owns the zones — never typed per parcel. A district we do not serve translates to nothing, and such a shipment waits in the open as **unzoned** rather than vanishing because no column fitted it.
*Three live faults surfaced by the wiring, each one a thing that had never been asked before:*
· **D1 erased every self-registered client.** It republished its own client list on every pass, so somebody who registered on his phone was wiped a second later — the same fan-out fault billing had, in the other direction. It merges now: its own records win for its own, everyone else is kept.
· `drvById(r.driver).name` — an accepted run whose driver is no longer on the register **took the whole screen down**. Guarded, and it says so.
· `zById(d.zone).name` — the same, for a delivery whose district we do not serve: the one case the new wiring makes ordinary would have crashed the dispatcher every time.

**24 · The rest of the chain boots from the register (added to `test_continuity.js`, now 65 checks).**
· **B2** — consolidation now sees a parcel received an hour ago, and does not see one already consolidated. Its queue was seeded, so neither was true before.
· **B8** — the driver's run is **what the dispatcher assigned**, read from `run.assigned` and dressed from the register. A run naming cargo the register never saw produces **no stop**: the run cannot invent a delivery any more than a trip can invent a shipment. Once a real run is found it is **frozen**, because the driver's marks live on those objects and re-deriving mid-run would erase his work.
· **B9** — billing opens a draft for every shipment the register knows and it has no invoice for, carrying the identity and **the price it was taken in at**, marked as the intake price so a later reprice is not mistaken for it. A shipment merely **booked** gets no draft: it is not in our hands yet. Rendering twice does not open a second draft. The charges stay billing's own work — the register knows what a parcel was priced at, not what it finally costs after border fees, storage and a discount.
*Caught by the test, not by the screen:* B8 resolved its run **once at load** and cached whatever it found — which at load is the seed — so a driver would never have seen his actual run. The same "read once" fault as the customer app's account, in a different file.

**25 · Trips have a register too, and the chain is whole (`test_continuity.js`, 77 checks).**
B4 and B6 each held their own list of trips, so a trip created in B3 **never reached the men who load and receive it**, and the trip they worked on had been created by nobody. `SL_TRIPS_V1` is derived in D1 exactly as the shipment register is — from the events, on every pass, stored nowhere — carrying each trip's truck, driver, route, weight, **the cargo it declared** and the stage it has reached.
Loading now sees a trip the moment B3 creates it, with its shipments each carrying the owner from the shipment register. Arrival does **not** see it until it departs, and it drops off the list the moment it arrives. Both keep their seeds as gallery fallbacks, named `TRIPS_SEED`.
With this, every module in the chain boots from what the company actually recorded: **B2, B3, B4, B6, B7, B8, B9** — the seeds survive only for a gallery with an empty log, and each is named so nobody mistakes one for the record.

**26 · The system diagram, generated rather than drawn (`test_diagram.js`, 19 checks).**
The old one was drawn by hand, once, and described a system that had stopped existing — which is what happens to every hand-drawn diagram. This one is **generated from the source**: `wiring.js` reads each module for the channels it writes, the channels it only reads, what it declares on the log and what it listens for; `diagram.js` renders that. A wire that is not in the code cannot appear on it, and one that is cannot be left out.
It shows **17 channels, 15 event types and 27 modules**, in both languages, with machine values left as they are because a channel name is not translated. And it is honest about the awkward part: **8 channels are written by more than one module**, each marked in red with the count stated, rather than drawn as though the one-owner rule held everywhere. `SL_EVENTS_V1` is among them by design — every module declares its own steps on the log — which the contract records as a limitation of the check rather than a fault in the log.
The contract is what stops it drifting again: it **regenerates from the code and compares character for character**, so a wire added to a module and not to the diagram fails here rather than misleading somebody in six months.

**27 · The console — BUILT AND DELETED THE SAME DAY (`test_console.js`, removed).**
*Kept in this log because the mistake is worth more than the file was.*
The owner's answer about the React dashboard was that it **is** the final interface — one console per person, narrowed by his grants, with head-office messages at the top of the day and a sidebar of the services his account may use. So it was rebuilt as a ShopyLink module: **one ES5 file, brand tokens, brand lockup, no emoji anywhere** (an emoji renders differently on every machine and puts a face where a status belongs). Design direction from the ui-ux-pro-max skill: Swiss/minimal at dashboard density; the palette is the brand's, not the skill's generic blue.
**It owns nothing.** It writes to no channel and declares nothing on the log — the contract reads the source to prove it. Every figure is derived from the registers the modules publish, so a number here and the same number in D1 cannot disagree. That is the opposite of the 4.6 MB file it replaces, which held its own `MOCK` data, touched no channel, and shipped a Babel compiler to translate itself on every open.
**What you may not do, you do not see:** the sidebar comes from the staff registry. A full-grant manager sees eight services; a level-1 driver sees two — and asking for a screen he may not have is refused **at the act**, not merely hidden. A service opens on **any** of its grants: tying each screen to one grant meant a driver holding `b8_mon` could not see the delivery work he does every day.
**The day says what kind of day it is** — "Looks quiet today" when nothing is moving and nothing waits on him; the count on the move when it is; and when something has sat two days, that is what the page opens with. **Head-office messages** are owned and published by C9, beside the people they are addressed to, and carry the level they are meant for.
*Three faults found while building:* messages ignored the level they were addressed to; `haveAny()` could not tell **"published and empty"** from **"never published"**, so a genuinely quiet day read as an unbuilt system; and `slStaffRead()` had been **defined twice in C9 since long before today**, in two different hands, whichever loaded last silently winning.
*And one in my own test:* two probes wrote over the shared store and quietly emptied the register the later sections were reading — a test that damages the world it is measuring.

**28 · A demonstration day inside the console — deleted with it.**
Opened on its own the console had nothing to read and rightly said so — correct, and useless for trying it out. A demo set now stands **behind** the readers, exactly as every module keeps a `_SEED`: six people at three levels, eight shipments across every stage (two failed twice, one nobody received, one merely booked), two trips, three requests at two different levels, and two head-office messages. The page says **"Demonstration data"** in the state line and names what to open so it reads the real thing instead. One published channel and the demo is not consulted again — **not even for the parts still unpublished**, because half a demo and half a system is the worst of both.
*Two small things fixed by looking at it:* the switcher said "Switch person", which made you press it to find out who you become — it names him and his level now; and a person's **name** was shown in Latin inside an Arabic greeting. A name is not translated, it is transliterated, and only he owns the spelling — so the registry may carry `nameAr`, and where it does not the Latin form stands rather than a guess.

**29 · Auditing my own week, and the first of its findings: the zones (`test_continuity.js`, 78 checks).**
Asked whether anything else built in this session duplicates what already existed, I compared **every function and list added this week against the original package**. Most of what came up is the project's own single-file pattern — `slLockup`, `t`, `modalHTML` copied per module, and the register readers I wrote (`shipRegRead` in six modules, `tripRegRead` in two) are **byte-identical** in each. Four real duplications came out of it: the console (a second D1), the notices (D1 already has a richer board), `releaseOverLimit` implemented twice under two different rules, and `laneKey` — a key format agreed by copying rather than by publishing.
**The zones are fixed.** `C10-Zones` owns them and now publishes `SL_ZONES_V1` with the **districts inside each zone**. B7 kept three of its own with different ids and a different spelling of the same place — `Z-MEZ "Mezzeh"` against `Z-01 "Mazzeh"` — so the district-to-zone translation built yesterday ran on a table **nobody owned**, and the two files disagreed about the name of the district before they could disagree about a delivery. B7 reads the owner now; its delivery **fees** stay its own, keyed by the owner's ids, and a zone with no fee recorded says so rather than charging nothing.
*And the fault that exposed:* the district was a **free field at registration**. A man typed "Mezzeh", the register said "Mazzeh", and his parcel would have waited unzoned for ever with nobody able to say why. Districts are now offered from the zone register — picked, not typed, exactly as a date is picked from a calendar — and where nothing is published the field stays free but the record marks it `areaTyped`, so those can be found and corrected rather than trusted.

**30 · One rule about the company's money (`test_credit.js`, 69 checks).**
The second finding of the audit. D1 asked whether somebody was **called** `'manager'`; billing asked whether his **level** was 3. One question about the company's money with two answers — and the day a manager sits at level 2, or a level-3 person is not called a manager, they part company silently.
Credit is D1's, so the threshold is D1's: `CREDIT_POLICY.releaseLevel` travels **with the client records** on `SL_CLIENTS_V1`, and billing reads it rather than holding a 3 of its own. Lower it at the owner and billing follows in the same breath; with nothing published it falls back to the owner's current rule rather than to no rule.
*And the ask was not in one place.* D1 tested for the word in **ten** — granting a facility, revoking one, overriding a trip, reassigning a delivery, releasing past a limit. One `isSenior()` stands in all of them now. Three mentions remain and are correct: one routes a work item, two exclude "manager" from a list of people a message can be addressed to. Neither is a judgement.

**31 · The lane key, and the notice board (`test_console.js`, 43 checks).**
Two more of the audit's four, both fixed the same way — by publishing what was being agreed by copying.
**The lane key** was built by hand in **three** places: `laneKey` in Pricing, again inside `svcOptions` in the same file, and a third time in receiving where I copied the format across rather than reading it. An agreement by copying holds until somebody changes a separator, and then receiving prices nothing, **silently**, with every parcel refused for a reason nobody can see. One builder at the owner now, and the **shape itself** travels on the tariff: change the separator at Pricing and the key built in receiving follows in the same breath.
**The notice board** has always been D1's, and it is richer than the copy I put in C9 for a few hours: an audience (countries, hubs, roles, named people or everybody), a read state per person, and a warning when a message goes out untranslated. My copy is deleted; D1 publishes; the console applies **the owner's audience test** rather than the level shortcut I invented — which would have shown a Guangzhou warehouse closure to a driver in Damascus and hidden it from the clerk it was written for.
*Still open from the audit:* the console is a second D1 and is next.

**32 · The console deleted, and the last of the audit closed.**
The fourth finding was the console itself, and reading before rebuilding settled it: **nothing needed moving, because nothing was new.**
· The **shell** already signs a person in and hides every module he holds no grant in — `canOpen()` opens a module on **any** of its grants, the same rule I re-invented a day later. Omar sees five groups and twenty-five modules; Samer the driver sees one group and one module.
· **D1's own first screen** already opens with his greeting, his **obligation line** — *"Nothing overdue, nothing due today, and no handovers waiting on you"* — his priorities sorted by consequence then deadline, and his day laid out by the hour. It is a better day-state than the one I wrote, because it counts **his queue** rather than the company's totals.
· The **notice board** was already there, with a richer audience than I gave it.
So `ShopyLink_Console.html` and its contract are deleted, and the lesson is written at the top of `renderS0()` in the file it duplicated, where the next person will meet it: **I built before I read.** Three times this week the same fault — the addresses screen, the notices, the console — and each time the original was better than the copy.
*The audit that found all four is now closed.* What it leaves behind is `wiring.js`, which can list every channel with more than one writer on demand — the four found by hand this week would have taken one command.

**33 · The diagram can see an island now (`test_diagram.js`, 31 checks).**
Asked whether the **message threads** were in the diagram, the answer was no — and the reason mattered more than the omission. The diagram read the **wires**: who publishes a channel, who reads it, who declares an event. Threads publish nothing and declare nothing, so they were invisible to it **because they are invisible to the system**. Four islands were found by accident this week, one at a time — the tariff, the addresses, the zones, the notice board — and nothing was looking for the fifth.
`wiring.js` now reports **tables of record that exist in a file and on no channel**, ranked: a name held in **two or more modules with nothing between them** is the dangerous kind (two copies of one fact waiting to disagree), and one held in a single module is merely unshared, which may be fine. Seven of the first, forty-two of the second, all on the diagram under a heading that says what they mean.
*Two passes were needed to make it honest.* The first test — "does this table leave its own file" — flagged fifty-three, most of them legitimate local fallbacks of registers that do exist; the right question is whether the **system carries the thing at all**. And the scanner looked only for **seeded** tables (`var X=[{…}]`), so `MSGS` — which starts empty and fills at runtime — stayed invisible: the one table carrying what people said to each other was missed by the tool built to find exactly that.
*What it surfaced beyond threads:* `LEAVE_REQS` is held in **two** modules, C2 and C9 — leave requests in two copies, which nobody had noticed.

**34 · The thread travels with the record (`test_threads.js`, 24 checks).**
The board has always promised that *"messages are permanent — an edit keeps its history, and the thread exports with the job"*. It could not keep it: `MSGS` lived in D1 and nothing else could see it, so a clerk holding an invoice could not read the sentence that explains it — that the customer disputed the weight, or that a manager allowed the delay — and would rebuild the argument from nothing, or invoice as if none of it had happened.
`SL_THREADS_V1` is published per record: who said it, when, to which roles, and whether it was edited. The internal work item behind a message does **not** travel — a reader wants what was said, not how the board files it. Billing shows the thread beside the invoice it explains and says plainly where a reply belongs: **read here, answered there**. A shipment nobody discussed shows no panel at all, and with the channel unpublished billing does not invent a conversation.
*The tool had to be corrected twice more to tell the truth about it.* It looked only for **seeded** tables, so a table that starts empty and fills at runtime was invisible — the one table carrying what people said to each other. And once published it was **still** called an island, because the test matched names and the messages travel as `threads`: it now asks whether a publisher actually **reads** the table, whatever the channel calls the result.
`MSGS` was the fifth island, and the first found by being asked about rather than by accident.

**35 · A price lives in one place (`test_receiptprice.js`, 91 checks).**
The scanner's first ranked finding: **`CITYX` and `SERVICES` — city delivery extras and hub service prices — were held in both Pricing and Billing.** The two copies were **identical**, which is what makes a second copy dangerous rather than obvious: nothing looks wrong until the day somebody edits the real one, and from then on billing charges yesterday's price with nobody the wiser.
Both now travel on `SL_TARIFF_V1` and billing reads them; raise customs clearance at the owner and the next invoice carries the new figure. `CITYX_SEED` and `SERVICES_SEED` remain as the fallback for a module opened alone, named as seed. *Caught by the audit tool while doing it:* billing had no tariff reader at all — I called `slTariffRead()` there as though it existed, because B1 has one, and `audit.js` refused the file.
The ranked list is down from six to four, and one of those — `AUDIT` in eleven modules — is **correct**: a local audit log per module is not a shared fact. What is left is `BORDERS` (B3 and B5), `TRUCKS` (B3 and C1) and `STOPS` (C7 and the driver app).

**35 · "Don't build new — check whether the module exists" (`test_shellprompt.js`, 40 checks).**
The owner made it a standing instruction, and the first thing to do with it was obey it: **no new tool was written.** `wiring.js` already read the whole structure, so it answers the question now —
```
node wiring.js find notice
  D1 Control   channels: SL_NOTICES_V1 | tables: NOTICES | functions: canPostNotice, dismissNotice, noticeBoard, noticeComposer…
```
Asking that one question a week ago would have prevented all four duplications.
*And the rule was already written.* `RULES.md` has carried **G1 — reuse before writing** from the beginning; what it said was "check **the file**", and every one of my four mistakes was at the level of the **system**. So G1b stands beside it, with what it cost attached — the addresses screen, the notice board, the console, and a second rule for releasing past a credit limit (`role==='manager'` in one file, `level>=3` in another) — **and every time the original was better than the copy.** It is in the shell prompt too, and the contract checks both, because a rule that lives only in a prompt is a rule somebody will not read.

**36 · Fixing the tool before trusting it (`test_diagram.js`, 34 checks).**
The owner's rule sent me to `wiring.js` before touching anything, and the first thing it showed was that **the tool was wrong in both directions**.
*Crying wolf:* it reported `CITYX` and `SERVICES` as "prices in two places" the morning after they were fixed — the fix was `CITYX_SEED` beside a live reader, which is the pattern this codebase settled on. A tool that cries wolf stops being read, so a named seed no longer counts as a second copy.
*And worse, going quiet:* it had stopped reporting `LEAVE_REQS`. C9's copy is read by the staff publisher, which ships `onLeave:true` — **a summary, not the requests** — so the tool cleared it, and the two halves of one duplication sat in two different lists where neither looked like a pair. The question was over-thought: it is simply **is this name held in two modules, and does anything join them**.
Asked that plainly, nine come out, three of which no earlier version reported: **`LEAVE_REQS`** (leave built twice, C2 and C9, with the same functions in both), **`CUSTOMERS`** (receiving and pricing), and **`ROLES`** (C9 and D1).
*The lesson underneath:* I refined a measuring tool three times without re-checking that it still saw what it had already found. Each refinement was defensible; the net effect was a tool quietly blind in one eye.

**37 · Employee or contractor (`test_engagement.js`, 16 checks).**
The owner was asked which of the duplications to take next and said leave requests; reading first said otherwise. **All six drivers are in the staff registry too**, each under two ids — `Samer Haddad` is `DRV-01` to the dispatcher and `U-05` to the staff module — and no driver exists outside it. So duplicated leave was a **symptom**: fixing it alone would have produced one leave system running on two person registries.
The owner's answer settled the model: **a driver is an employee or a contractor, and a contractor has a file to prove who he is but takes no leave.** Neither case could be expressed — every driver sat in the registry as an employee, so the contracted half of the company had no way of existing, and the duplication had been hiding that absence rather than revealing it.
`engagement` is now one field on the **person**, published with him. Leave is refused for a contractor **at the act, in both files** — C9 where the person lives and C2 where a dispatcher would notice the gap — because a rule enforced in one file is a rule with a way round it. What belongs to the driving stays with the driving: the licence, the visas, the zones, the cash permission. What belongs to the person stays with the person, and the driver record does not repeat it.
*A correction I owe:* I reported "Yara Salem is a driver in one module and a warehouse hand in another" as a contradiction in the owner's company. It is a contradiction in a **demo seed** — the names and roles in C9 are generated from two arrays. Presenting gallery data as if it described his business was my error, and he caught it.

**38 · The borders: a point, and what is paid there (`test_borders.js`, 21 checks).**
Three files held three ideas of a border. B3 kept **twelve one-way gates** — "UAE Exit", "Jordan Entry" — under ids nobody else had ever seen. B5 kept **three crossings** with their fee schedules. And C7 — the network — has held them all along, as `STOPS` of kind `border`, **under the very ids B5 uses**: `SP-01` is Bab al-Hawa in both, and the two agreed by luck rather than by design. B3's list had **not one entry in common** with either, so a trip could be routed through a border the company does not work at.
The owner's three answers settled it: a crossing is **two points**; a border is **both network and fees**; and there is a **fixed tariff** with **extras the agent pays** on the day.
So C7 publishes the point — borders, ports and airports, with the two countries a border sits between and the agents cleared to work it. B3 derives **an exit and an entry** from each crossing, both carrying the crossing's id so that what it routes is what B5 prices, while the **order** stays B3's, because a sequence is trip data and not a property of the road. B5 reads the point and keeps the money: `std` for the fixed tariff, `extras` for what was paid on the day — a shape it already had. A crossing the network opens reaches both files the same day, and until somebody prices it, it says **"not priced yet"** rather than being charged at nothing.
*Nothing was built that existed:* the point, the fee shape, the payers (`driver float · agent account · office transfer`) were all already there. What was missing was **publication** — the fourth time this week that the fix was to let a module read what another already knew.

**39 · Two kinds of driver, and a client who is priced without being listed (`test_engagement.js`, 19 checks).**
Two owner rules, and the first of them **corrected something I had built hours earlier**. I had put `engagement` on the STAFF record; his answer — *a contractor is a service supplier, and the driver lives in the drivers register* — meant that was the wrong home. It is withdrawn from C9, which says so in the file, and lives on the **driver**: holding a contractor as staff gave him a level and a set of permissions that mean nothing to him and would have shown him on every screen asking "who is my team".
And the register was missing a second fact: **there are two kinds of driver** — one who runs the **trips** and one who runs **local** delivery. Every driver was published as though identical, so a dispatcher looking for somebody to take a run to Aleppo saw the man who does Mezzeh doorsteps. Each module asks for the kind it needs; with nothing published the answer is `null`, because *"we do not know"* is not *"there are none"*.
**And a client is priced whether or not pricing has heard of him.** The owner: *a client goes onto the general list automatically unless somebody gives him one of his own.* Pricing held its own customer table, so a man who registered on his phone this morning existed for D1 and for billing and **not for pricing** — asking what he pays returned nothing, which a screen reads as "no price" rather than "the published one". It reads the client register now and adds what is its own business: his category, his discount, and any lines agreed for him alone.
*Three contracts had to be repaired, and the repairs are the point:* `test_leave` picked its subject by **position** — `DRIVERS[0]` — and position one is now a contractor, so a leave test started failing on an engagement rule it predates. It picks an employed driver **by engagement** now. A test that says "the first row" is a test that will break the day the rows mean something.

**40 · The originals stay with one person (`test_docgate.js`, 62 checks).**
Asked how documents work, the owner named **four custodies, not one job**: shipping documents with the trip coordinator, staff documents with HR, transit documents with the **customs agent — who is external**, and the **original trip papers with the driver**. So "Documentation" is not a position, and D1's role table was wrong to make it one. Two rules came with it: **every responsible person uploads his documents into the system**, and **the papers of a shipment stay with one person — never handed on**.
Half of the first was already built: each tick records who put the paper there and when. The second was nowhere. The gate knew **which** papers a trip needs and not **who is carrying them**, so the question a border actually asks — *who has them right now* — had no answer anywhere in the system.
A trip now names one carrier of the originals, **cannot be declared without one**, and **refuses to hand them to anybody else**: "the originals are already with Salma Idris — they do not change hands". Losing the custodian means a new trip, not a quiet reassignment. The carrier travels on `trip.created`, so the answer follows the journey rather than sitting on a screen.
*Four contracts had to be told about the new rule, and one repair was mine to undo:* a blind `sed` rename hit two earlier sections that used the same variable names — the exact fault `RULES.md` G7 warns about, committed by the person who wrote the warning. Restored by hand, section by section.

**41 · Positions and authorities (`test_positions.js`, 35 checks).**
The owner asked for positions and authorities as a freight forwarder actually has them. Three things were in the way, and the first was a correction to something I had told him an hour earlier.
*I said the network modules had **no** permission gate. They had one — the wrong one.* Trucks, drivers, hubs, zones and agents all guarded themselves with **`st_manage`**, the grant for managing **staff**. So whoever kept the personnel records could retire a truck or close a hub, and the fleet manager could touch none of it unless somebody made him a personnel officer too. Six grants now exist for the work itself — `nw_fleet`, `nw_map`, `nw_agents`, each with a level-2 twin for **retiring** rather than keeping — and each module asks for its own.
*And the roles had permissions but no meaning.* Ten names here with not one word saying what any of them is for; seven in D1 with a statement of responsibility and a line of command, four of which this file had never heard of. One vocabulary now, taking from D1 what it had and this register lacked: **what the position owns, what it is accountable for, and who it answers to** — published with the person, so twenty modules that knew a man's grants can finally say what he is responsible for.
The owner's answers shaped it: there is **no documentation position** (four custodies, each with its own owner), clearance is done by an **external agent** so the role is dealing with agents rather than clearing, and **each centre has its own clerk with a manager over the four** — so a centre clerk answers to the centres manager, not to the owner.
*Fixed on the way:* the shell prompt stated "24 permissions" and the contract compared against a **24 typed into itself**. Both read the real number now — a figure written into a test is a figure that has stopped being checked.

**42 · One vocabulary, and an honest bridge (`test_positions.js`, 46 checks).**
The last of the role duplication. D1 named seven positions and C9 named ten, with four in each the other had never heard of: `ops` here was `disp` there, `finance` was `acct`, `manager` was `admin`, and **`docs` was a position the owner says does not exist**.
C9 owns the positions and publishes them. D1 **keeps its seven**, because its work items are routed by them and its own people are written in that vocabulary — but it now **reads** what a position owns from the register instead of restating it, and **everything that leaves speaks the register's language**. A notice addressed to `ops` would otherwise have reached nobody at all. `docs` maps to the coordinator, who is the man actually holding the shipping papers.
*Caught while wiring it:* `ops` and `docs` both map to the coordinator, so a notice addressed to both put **the same man in the audience twice**. De-duplicated on the way out.
*And the tool was taught a distinction rather than a lie.* `ROLES` still appears in two modules and `wiring.js` still reports it — but marked **`[translated, not copied]`**, because a table that maps to the owner's vocabulary is a bridge and not a second copy. The first attempt marked `COUNTRIES` and `AUDIT` too, since the alias merely lived in the same file; narrowed to the table it actually bridges. A reader deserves to know which kind he is looking at, and a comfortable lie in a measuring tool is worse than a noisy truth.

**43 · The fleet (added to `test_positions.js`, now 53 checks).**
The same shape a fourth time. C1 has always held the trucks — eight of them, with plates, tare, box, payload and the expiry of every paper — and **published none of it**. So the module that assigns a lorry to a trip **invented two of its own**, with plates C1 has never seen: a trip could be dispatched on something the company does not own.
C1 publishes what a coordinator needs to choose one; the maintenance history and the supplier stay with the fleet. B3 reads it and keeps only what belongs to a trip.
*The number that made it worth doing:* `TRK-01`'s real tare is **15,200 kg**. The invented lorry claimed **8,500**. Nearly seven tonnes of difference in every load calculation the trip module has ever made — and nobody would have found it by reading either file, because each was internally consistent.
And a lorry whose papers have expired is now a fact **the coordinator sees**, rather than one buried in a module he does not open.
*Duplicates remaining: five.* `AUDIT` (a per-module log, by design) · `COUNTRIES` in four modules · `CATS` · `LEAVE_REQS` (two populations, not two copies) · `ROLES` (translated, not copied).

**44 · The categories and the countries, and the end of the duplicate list (`test_positions.js`, 61 checks).**
**The categories were already published** — `cats` has been on the tariff channel all along — and billing kept an identical copy anyway. Identical today; the day VIP moves from 10% to 12%, that screen would go on invoicing at the old figure **with nothing to show that it had**. Two lines to fix, and only findable because something was counting.
**The countries were four lists in four shapes:** C7 with the currency, the dialling code and the status; C8 with a name; D1 with a name in two languages; gift cards with a flag and a symbol. Each was right for the screen that drew it and none could answer for the company — and when **America was registered this morning it appeared in exactly one of them**. C7 owns the country and publishes it with everything the four were keeping apart; each reads the shape it needs. America now reaches all of them.
**The duplicate list is down from nine to three, and all three are sound:** `AUDIT` is a per-module log by design, `LEAVE_REQS` is two populations rather than two copies, and `ROLES` is a translation. Every real duplication found this week is closed.
*Worth stating plainly:* not one of these was found by reading code or by a failing test. They were found because a tool counts them on every run, and each fix took minutes once it was named.

**45 · One book of invoices (`test_credit.js`, 79 checks).**
The last of the money duplications, and the worst of them. Billing held drafts with every line of pricing and **issued** from there, declaring `invoice.issued` on the log with the amount, the currency and the terms. D1 held a **second book** of amounts and due dates — three rows sharing not one reference with billing's three — and the credit board computed a client's **exposure and his overdue balance from it**. So what a client owed depended on which screen you asked.
Derived now, like every other figure on that board: **issued less paid**, from the events the modules that did the work declared. Its own rows survive as a named seed for an empty log.
*And the fix had a fault in it that the contract caught immediately.* The log names the client — "TechLine Trading" — while the credit board asks by id — `CL-001`. My first version matched on the name, which returned a **right-looking 840 for one question and 0 for the same question asked the other way**. The client is resolved to an id at the source now, once, rather than each caller guessing. That is the same shape as the fault it replaced: two answers to one question about money.

**46 · The VGM certificate (`test_vgm.js`, 28 checks).**
SOLAS will not let a container be loaded without a **certified gross mass**, and the system knew it: the document gate asks for a VGM on every sea trip, and the control board carries a work item — *"VGM to carrier"* — with an owner and a hard cut-off eight hours out. **Nothing could produce the paper.** (AWB needed no building: `renderAWB` in receiving prints it and B3 uses it throughout — checked before writing anything.)
The certificate invents nothing. The trip and its route come from the trip register, the cargo and each weight from the shipment register, the **tare from the fleet register**, the port from the network. The owner weighs actually, so the method is declared as **Method 1 — weighed**, which the convention requires to be stated.
*The figure that shows why it had to read rather than assume:* cargo 7,300 kg on a lorry whose real tare is **15,200** gives **22,500 kg**. The invented lorry the trip module used to carry claimed 8,500 — a certificate built on it would have been a **certified false weight, off by nearly seven tonnes**.
**Nothing is certified that was not weighed.** A shipment with no weight leaves the paper saying *"cannot be certified"* on its face and naming which one, and declaring it is refused at the act. **And the signature is left blank for the pen** — the owner's instruction: it is signed after printing, so nobody's name is printed under a figure he has not read.
*Found on the way:* the receipt has always measured the weight and the **shipment register threw it away**. Nothing downstream could ask what a shipment weighs. It travels now, with the carton count.
*And a contract that failed on its own words:* an assertion checking that no mass is hard-coded in the file matched **the sentence in which it said so**. Rewritten to test the source rather than its own description.

**47 · Registering a person, the agent who paid, and the third subscription model (`test_positions.js`, 84 checks).**
**Registration** existed and worked — it created the user, granted the position, issued an invitation with a first password. Four things were missing and all four are the same fault: it did not check that the **email was free** (an email is how somebody signs in, so two people would have shared one door), it refused by **greying out a button** rather than saying which field displeased it, it recorded nothing on the shared log, and it never asked whether the person is an **employee or a contractor** — decided later means somebody has already been given a roster he was never entitled to. It refuses with the reason now and declares `user.registered` with the position granted, where he works, and **who granted it**.
**The agent who paid.** C8 held the clearing agents in full and published none of it, so a border carried its agent as free text — "Rami Odeh — Odeh Border Services" — while the network carried `AGT-05`. *What has this agent spent on our behalf* was unanswerable. Published and joined; the answer comes crossing by crossing, so it can be checked against his invoice.
**And a third subscription model, found by searching rather than by luck.** Pricing has a whole screen — *"what the customer pays to buy a forwarding address"* — priced per **warehouse × governorate**, because the included door-to-door cost differs by destination. The owner confirmed the rule: **from the centre to the city's hub, and every further city adds its fee**. The model was right; what was wrong is that the governorate extras were a **second table** (five governorates, Aleppo at 5) beside the tariff's city extras (six cities, Aleppo at 180 flat). Raise the extra on the tariff and the address plans went on charging the old one. Derived now: Tartus is priced where it was missing, and a governorate nobody has priced answers **null rather than zero** — unpriced is not free.
*Also closed:* `test_b8_split` required `jsdom` by bare name where every other contract uses the absolute path, and it addressed the delivery run by the seed name from before the run was derived. Both fixed; it passes from inside the shipped package now.

**48 · What a position is FOR (`test_positions.js`, 95 checks).**
The owner declined to hand over names — his people register themselves through the admin, each with his own phone and address — and asked instead for the **positions to define the tasks**. Right boundary, and the more useful half.
A position already said what it **owns**, what it is **accountable for**, who it **answers to** and what it **may do**. It did not say what work actually **lands on it**. The control board routes six kinds of item by role — measure, document, clear, deliver, invoice, profile — and that routing lived **only in the board**, so a position could say one thing on the staff screen and receive another in practice. Each position now names the kinds it handles, in the system's own words, with a sentence describing its day; both travel with the person.
*What it fixed immediately:* an item with **no role on it** — "invoice a delivered shipment" — reached **nobody**. It reaches the accountant by his duty now. That is how work goes missing without anybody ever refusing it.
*And a duty stated by its absence:* the auditor's list is **empty**, deliberately — he receives no work, he reads and reports.

**Positions as they now stand, for the owner's correction:** `admin` (L3) · `hubsup` centres manager (L2) · `wh` centre clerk (L1) · `disp` trip coordinator (L2) · `customs` agent liaison (L2) · `support` delivery supervisor (L2) · `acct` accountant (L2) · `sales` (L1) · `driver` (L1) · `audit` (L2). Each carries a statement, a reporting line, its grants and its duties — **all of it my reading of his answers, and all of it a sentence he can correct.**

**49 · Sales: registers, quotes, builds — and asks (`test_positions.js`, 106 checks).**
The owner extended the position: sales may **register a shipment, issue quotations and create invoices**. Checking first turned one instruction into three findings.
**Registering he already had.** **Quotations had no grant at all** — the screen was open to anybody who could reach it, exactly as the network modules were before yesterday. `qt_make` and `qt_price` now exist.
**And `qt_price` is a deliberate exception to the owner's own L3 rule**, stated by him and written into the file so nobody later "fixes" it: sales prices from the published tariff and **may offer a different price without an approval**, because a quotation is an offer to **one client**, not a price published to everybody. The L3 door guards the published list.
**Issuing needed the finer distinction.** The owner: sales may create *and* issue, and the issuing needs an approval. So the grant alone could not be the answer — `b9_issue` says he is in this business at all, and his **level** says whether his own hand is enough. A level-1 salesman pressing issue **files a request** and the invoice stays a draft; a level-2 accountant with the same grant issues outright.
*A mistake worth recording:* I wrote the filing with `fileReq(...)` — a helper that exists in **Pricing and C7 and not in billing**. It threw. B9 runs its own bus (`apReq` + `busShape` + `slBusPush`), and that is what files it now. Calling a function by the name it has in another file is precisely the fault `G1` warns about, and I made it while implementing a rule about who may do what.

**50 · The map shows the people (`test_diagram.js`, 41 checks).**
Regenerated after the day's work — **24 channels, 15 events, 29 modules** — and it verified against the code unchanged, which is what the generator is for. But it drew only the wires: a whole structure of **positions** was built this week and a reader of the diagram could see none of it.
It now reads the positions from the register that owns them: **what each answers to, what work reaches it, and how much it may do**. Ten of them, with the auditor's empty duty list **stated rather than left blank**.
*A fault in my own reader, worth the note:* the pattern insisted on a literal list of grants, and `admin`'s grants are built from the catalogue — `setOf(FNS.map(…))` — so the one position that holds **everything** was the one position the map skipped. It matches the record first now and reads the grants either way.

**51 · The dashboard, built into the shell (`test_dashboard.js`, 27 checks).**
Asked for a comprehensive interface — a collapsible sidebar with organised categories, and cards per specialisation — the first move was to read the **shell**, which already signs a person in, groups twenty-five modules into five categories, and hides every one he holds no grant in. **A console was built beside it once and deleted the same day**; this went into the shell instead.
Three things were added and nothing rebuilt. The **sidebar collapses** to a rail of initials and remembers the choice, with the full name on hover because an initial alone is a guess. The **home reads the registers** the modules publish — what is taken in, what has arrived, what failed twice, what is delivered and unbilled, what waits on this person's approval — so a figure here and the same figure in D1 cannot disagree. And **every card is work this person owes**, drawn from his duties: the accountant is not shown parcels waiting in Dubai, because a screen full of other people's work teaches him to ignore it.
*Three faults, and only one of them was in the new code.*
· The shell's own footer read `ME.name` with no guard, so it **threw before anyone signed in** — the state the gate itself renders in.
· `currentLang` is D1's name for the language; this file calls it `LANG`. I used the wrong one, again.
· And the rail read its remembered state **once at load** — the third time this week I have written a reader that answers from a snapshot taken before the answer existed.
*And a fault of judgement the older contracts caught:* looking at the delivery cards I found `support` could not open the dispatcher, and gave it reassignment, returns and exceptions. `support` is a **support agent at level 1** — I read the position by its English name rather than by its level and its statement. Two contracts failed within the minute; the level-2 grants are withdrawn and the statement now says what he actually does: he assigns the round and watches it.

**52 · The React console — screen one (`ShopyLink_Console.html`, no contract yet).**
Built to the owner's brief, on his stack: React + Tailwind + shadcn tokens, recharts and lucide available, bundled by the web-artifacts-builder into **one HTML file of 257 KB**. It is a **window**: it reads the published channels and opens the existing modules by filename. Placed beside them it shows the real registers; opened alone it draws a demonstration day and **says so on the page**.
Home in the brief's exact order: **needs action** (each row: what it is, its reference, how late, the action button, and the thread) → **head-office notices on the page** → **the figures last**. Sidebar of six categories with search as the seventh entry at the foot of the list, ⌘K over everything, pinning kept in artifact storage.
*Design decisions, and the honest reasoning behind each:*
· **The lockup was wrong and I drew it from memory** — a word in two colours. The guide's mark is **two interlocking links**, masked so each passes over and under the other, in `--clean` and `--acc` on dark ground. Taken from the guide with its own masks and ratios.
· **The golden ratio, applied where it is true and refused where it is not.** φ governs a relation between two masses, so layout and spacing follow it — the sidebar 237 (`56 × φ³`, which is the brand sheet's 232 to within 2%), the panel 384, spacing on Fibonacci (5·8·13·21·34·55) because that is φ in integers a browser lays out honestly. Applied to **type** it produced a 5.3px label and a 26px row: unreadable, and too short for an Arabic descender. The type scale stays the brand's, and the reason is written in the stylesheet.
· **The sidebar turns with the language.** It read left-to-right while the page read right-to-left, which put every Arabic label at the far edge from its icon.
· **Zero colours outside the tokens** — including three Tailwind preflight values (border, placeholder, focus ring) which were replaced rather than excused. "It came with the framework" is not an exception the brief makes.
*What is not built:* the error and dense (500+ row) states, and the supervisor and manager homes. And it has **no contract yet** — the only artefact in this package without one.

**Open, honestly:** ~~five modules still boot from their own seeds (B2, B4, B6, B8, B9). §5 measures the drift; nothing yet removes it.~~ **Closed 30 Aug** — measured module by module rather than assumed: all six (B2 B4 B6 B7 B8 B9) read the register that owns their work and fall back to a seed only when nothing is published. B9 was the one real exception — it added the register's rows and KEPT its fixtures beside them, so an accountant saw invoices for cargo nobody received; its seed steps aside now, and an invoice a person built is never touched. `test_seeds.js` (24 checks) asserts all three properties for each module, so this cannot come back quietly.   the owner ships from the UAE, China, Turkey and the USA, and will add the US lane himself from the pricing panel — which is now an L3 request. Until it is approved, the two USA fixtures (Amazon, iHerb) sit on Dubai; moving them back is one field each.    The published FX figure (13,000) is a seed: it is now changeable through the L3 request, but nobody has yet set the real one.  The individual app has no tracking tab yet.

## File Structure

```
01_App_Files/
  ShopyLink_App_Combined_Designed_v2.html   ← 16 screens, login/logout flow, Syria flag SVG

02_Dashboard_Files/
  ShopyLink_Action_01_ReceiveParcel.html     ← B1 ✅ design reviewed 16 Jul 2026
  ShopyLink_Action_02_Consolidation.html     ← B2 ✅ design reviewed 16 Jul 2026
  ShopyLink_Action_03_CreateTrip.html        ← B3 ✅ approved
  ShopyLink_Action_04_Loading.html           ← B4 ✅ approved
  ShopyLink_Action_05_TripJourney.html       ← B5 ✅ approved
  ShopyLink_Action_06_ArrivalReceive.html    ← B6 ✅ approved 18 Aug 2026 (4-step rev)
  ShopyLink_Action_07_Dispatcher.html        ← B7 ✅ approved (rev: prepaid-only, no COD)
  ShopyLink_Action_08_Delivery.html          ← B8 ops side ✅ approved 18 Aug 2026
  ShopyLink_Driver_App.html                  ← B8 driver app (STANDALONE mobile) ✅ + tabs/Account/History
  ShopyLink_Action_09_Billing.html           ← B9 ✅ approved 18 Aug (invoice doc + engine-wired)
  ShopyLink_Pricing.html                     ← Pricing engine dashboard ✅ approved 18 Aug
  ShopyLink_System_Diagram.html              ← system map (files + flow), print-ready
  ShopyLink_Dashboard.html                   ← React prototype (reference)

03_Developer_Code/
  ShopyLink_DesignSystem.dart               ← Flutter DS (SLColor, SLRadius, SLType)
  screen_01–14.dart                         ← 14 Flutter screens, all DS-unified
  ShopyLink_Flutter_Handoff.zip             ← Complete Flutter project

04_Building_Files/
  ShopyLink_Brand.html                      ← Brand sheet (verbatim)
  ShopyLink_ComponentList.md               ← All components + dashboard system
  ShopyLink_Components.html                 ← Global component library

05_Docs/
  PROJECT_INDEX.md                          ← This file
```

---

## Module Status

### Individual App (Flutter + HTML prototype)
| Screen | Status |
|---|---|
| 01 Intro | ✅ |
| 02 Home | ✅ |
| 03 Shipments | ✅ |
| 04 Tracking | ✅ |
| 05 Notifications | ✅ |
| 06 Cards History | ✅ |
| 07 Account | ✅ |
| 08 Settings | ✅ |
| 09 Edit Profile | ✅ |
| 10 FAQ | ✅ |
| 11 Support | ✅ |
| 12 New Ticket | ✅ |
| 13 Pay | ✅ |
| 14 Pay Select | ✅ |
| **Login screen** | ✅ added 16 Jul 2026 |
| **Logout flow** | ✅ fixed 16 Jul 2026 |
| **Syria flag** | ✅ SVG (all locations) |

### Operations Dashboard (Web)
| Module | File | Status |
|---|---|---|
| B1 Receive Parcel | Action_01_ReceiveParcel.html | ✅ design reviewed |
| B2 Consolidation  | Action_02_Consolidation.html | ✅ design reviewed |
| B3 Create Trip    | Action_03_CreateTrip.html | ✅ approved |
| B4 Loading        | Action_04_Loading.html | ✅ approved |
| B5 Trip Journey   | Action_05_TripJourney.html | ✅ approved |
| B6 Arrival Hub    | Action_06_ArrivalReceive.html | ✅ approved 18 Aug 2026 |
| B7 Dispatcher     | Action_07_Dispatcher.html | ✅ approved 18 Aug 2026 |
| B8 Last Mile      | Action_08_Delivery.html + Driver_App.html | ✅ approved 18 Aug 2026 |
| B9 Billing        | Action_09_Billing.html + Pricing.html | ✅ approved 18 Aug 2026 |
| C9 Staff (IAM)    | Action_C9_Staff.html | ✅ approved 18 Aug 2026 |

---

## Design System

### Brand Tokens
| Token | Value | Use |
|---|---|---|
| `--ink` | #0B2A3B | Primary dark |
| `--pri` | #0EA5E9 | Sky blue — actions |
| `--acc` | #38BDF8 | Accent — logo ring |
| `--cream` | #F7F4EC | Background warm |
| `--paper` | #FFFFFF | Cards |
| `--green` | #10B981 | Success |
| `--danger` | #E1483B | Error |
| `--warm` | #FBBF24 | Warning |

### Fonts
| Variable | Family | Use |
|---|---|---|
| `--disp` | Bricolage Grotesque 800 | Headings, logo |
| `--body` | Manrope 400–800 | Body text |
| `--mono` | JetBrains Mono 500–700 | IDs, codes, prices |
| `--ar` | Tajawal + Cairo | Arabic text |

### Logo (LOCKED)
```
slLockup(size, tone)   — full wordmark shopy[mark]link
slMark(size, tone)     — chain mark only
tone: 'white' | 'dark' | 'brand'

Chain mark geometry (never alter):
  viewBox: 0 0 124 80
  Left ring:  x=6  y=20 rx=20 w=68 h=40  stroke=white/ink  sw=9
  Right ring: x=50 y=20 rx=20 w=68 h=40  stroke=acc/sky    sw=9
  Mask system: clipT x=46 y=6 w=32 h=34
               clipB x=46 y=40 w=32 h=34
```

---

## Auth Flow
```
Login screen
  → phone input (Syria flag SVG + +963 + number)
  → "Send verification code"
  → OTP screen (4 digits)
  → if registered: go home
  → if new user:   go registration flow
  
Account screen
  → "Log out" button
  → go('login') → Login screen
```

---

## Key Rules
1. Run `flow_check.js` → must be 0 fail 0 warn before shipping any file
2. Never alter `slMark` / `slLockup` geometry
3. No CDN in dashboard files — embed JsBarcode + QRCode inline
4. All `var(--)` resolved to hex in JS strings (no CSS var in JS)
5. Dashboard: each module = 1 standalone HTML file
6. Flutter: all raw `Color(0xFF...)` → `SLColor.token`

---

## RBAC — Role-Based Access Control (updated 16 Aug 2026)

### Staff Roles

| Role | Departure Hub Access | Create Trip | Notes |
|---|---|---|---|
| `warehouse` | Assigned hub(s) only | B1/B2 only | Cannot create trips |
| `operator` | Assigned hub(s) only | Yes — departure = assigned hubs | Set at staff creation |
| `manager` | All hubs in assigned country | Yes — any hub in their country | Country-scoped |
| `super_operator` | All hubs, all countries | Yes — any hub, any country | Full access |
| `admin` | All | All | + master data C-layer |
| `accountant` | Read-only | No | Finance only |
| `dispatcher` | Assigned hub | No | Last-mile only |
| `support` | Read-only | No | Customer support |

### Hub Assignment Rule
- **STAFF.hub_ids[]** — array of hub IDs the operator can depart from
- Set at staff creation in §C Admin (not changeable by the operator themselves)
- `manager` scope = country filter on HUB.country
- `super_operator` / `admin` = no filter (all hubs)

### B3 Create Trip — Departure Scoping
```
if role === 'operator':
  departure_options = HUB.filter(id IN staff.hub_ids)
elif role === 'manager':
  departure_options = HUB.filter(country === staff.country)
elif role IN ['super_operator', 'admin']:
  departure_options = HUB.all()
```

---

## B3 Create Trip — Flow (updated 16 Aug 2026)

### Step order
```
1. Departure hub     ← filtered by role (see RBAC above)
2. Destination       ← backend-registered: country / city / port / airport
3. Trip type         ← Land | Sea | Air  (shown AFTER departure+destination)
4. Mode details      ← Land: truck+driver+borders / Sea: vessel+containers / Air: flight
5. Parties           ← shipper / consignee / notify
6. Assign shipments  ← consolidated shipments filtered to this route
7. Review & confirm  ← TRIP record created, status = planned
```

### Destination options (backend-registered)
- Countries / cities → Land trips
- Ports (UNLOCODE) → Sea trips  
- Airports (IATA) → Air trips
- All stored in **LOCATION** entity (new — see data model)

---

## Design System Rules (updated 16 Aug 2026)

### Bilingual — ALL modules
- Every dashboard module (B1→B9, §C) includes EN|AR toggle in topbar
- AR mode: `html[dir="rtl"]` — full layout flip (sidebar right, content left)
- Pattern: `t('English text')` → returns AR translation when `currentLang === 'ar'`
- CSS: `html[dir="rtl"]` overrides for flex-direction, text-align, margins
- Registered in design system CSS at `/tmp/sl_dashboard_css.css`

---

## §C Admin/Setup — Build Queue (noted 17 Aug 2026)

> **Must exist before B3 runs in production** (B3 uses mock data in sim).

Build order: C9 Staff → C7 Hubs → C1 Trucks → C2 Drivers → C6 Cities → C4 Airports → C5 Ports → C8 Customs Agents → C10 Zones → C11 Rate Cards

| # | Module | Status |
|---|---|---|
| C1 | Trucks (fleet) | ✅ approved 19 Aug |
| C2 | Drivers + Visas | ✅ approved 19 Aug |
| C3 | Driver Visas | ✅ merged into C2 Drivers |
| C4 | Airports (IATA) | ✅ merged into C7 Network (stops layer) |
| C5 | Ports (UNLOCODE) | ✅ merged into C7 Network (stops layer) |
| C6 | Cities / Destinations | ✅ merged into C7 Network (cities layer) |
| C7 | Network: Countries→Cities→Hubs + Stops | ✅ approved 19 Aug |
| C8 | Agents (offices + multi-contacts) | ✅ approved 19 Aug |
| C9 | Staff & Roles (IAM) | ✅ approved 18 Aug |
| C10 | Zones | ✅ approved 19 Aug |
| C11 | Rate Cards | ✅ covered by ShopyLink_Pricing.html |

---

## B4 Loading — Key Decisions (noted 17 Aug 2026)

- **Pallet grouping** = documentation only → updates `CARTON.pallet_no`
- **Packing list** = 3 levels: summary strip → inline expand → print view
- **Load type** (FCL/LCL) = tentative in B3, confirmed in B4
- **Shipment filter** in B3 Page 2 = same hub + same mode + consolidated + no trip

---

## B4 Loading — Built (17 Aug 2026)

File: `02_Dashboard_Files/ShopyLink_Action_04_Loading.html` — ALL PASS, bilingual.
Flow: **S1** trip select (scan TRP number OR pick from planned list) → **S2** carton loading (scan-only per decision; big scan zone, per-shipment expected list with pallet tags, Loaded/Expected/Remaining counters) → **S3** weights (tare locked from truck, laden from weighbridge, net auto) + FCL/LCL confirm + missing-carton handling → dispatch.
Rules: scan-only carton confirm (no tap); partial dispatch allowed only with explicit "Detach & dispatch partial" checkbox — missing cartons return to consolidated pool; land trips require laden > tare to dispatch.
Next: user review of B4 → then B5 Trip journey.

---

## B5 Trip journey — Built (17 Aug 2026)

File: `02_Dashboard_Files/ShopyLink_Action_05_TripJourney.html` — ALL PASS, bilingual.
Flow: **S1** in-transit trips → **S2** border timeline (vertical spine: done/current/upcoming dots; current leg opens with customs-agent card — per-border required docs, Upload each, then **Move** stamps timestamp and advances) + shipment-level **Hold/Release** (held shipment stays behind, rest of trip continues) → **S3** arrived (crossing log with timestamps, held shipments excluded and flagged).
Decisions: operator monitors AND can intervene (both); hold at SHIPMENT level; **border/clearance fees deferred to a separate finance module** (not in B5).
Syria Entry = final import clearance leg (goods cleared BEFORE hub, per brief).
Next: B6 Arrival hub & receive.

---

## B6 Arrival & receive — Built (17 Aug 2026) · Brand sync

**Brand sync (Asset Hub, updated 17 Aug 2026):** Arabic font = **Tajawal** + tokens --soft/--clean/--sand applied to ALL modules B1–B6.

File: `02_Dashboard_Files/ShopyLink_Action_06_ArrivalReceive.html` — ALL PASS, bilingual.
Flow (per user): **receive trip first, then scan every shipment/carton**: **S1** arrived trips → tap = receive/unseal → **S2** unload verify (scan carton / scan PLT / tap chips — same B4 pattern) + **Damage mode toggle** (red; scans/taps mark damaged with note, chip shows ⚠) with counters Received/Expected/Issues → **S3** summary: damaged list (note + 📷 + CLM-ref) + missing list (CLM-refs) + acknowledge checkbox "claims routed to claims module" gates **Confirm arrival** → done (shipments → arrival hub inventory, next B7 last-mile).
Damage/missing handling = mix per user: recorded in B6 (photo+note) AND claim refs for future claims module.
Next: B7 last-mile delivery.

---

## B6 Arrival & receive — REVISED & approved (18 Aug 2026)

File: `02_Dashboard_Files/ShopyLink_Action_06_ArrivalReceive.html` — ALL PASS (43 jsdom tests), bilingual.
Change request implemented, now **4 steps**: S1 Receive trip → S2 Unload & verify → **S3 Hub secured** → S4 Summary.
1. **Shipment-level receive**: each shipment card has its own confirm button (green "Confirm received" when all cartons accounted; amber "Confirm with exception" when damaged/missing → exception flag + counts + timestamp). Confirm also via scanning the CON- shipment id (220ms settle window so carton scans passing through the CON- prefix are not intercepted). Button toggles off (undo); scan-confirm never toggles off.
2. **S3 Hub secured**: 🔒 "Hub secured — all shipments received" — locked until EVERY shipment confirmed; stamps time + destination; only then Summary unlocks. Summary shows custody row + exceptions count above claims.
3. **Pallet gap CLOSED**: scanning PLT-… receives NOTHING — it is a status check only ("Pallet is not a receiving unit — N/M cartons remaining, scan each one"; turns ✓ only when each carton was scanned individually). The receiving unit is the SHIPMENT; evidence = individual carton scans. A carton missing from a pallet always surfaces as missing on its shipment.

---

## B7 Dispatcher — Built & approved (18 Aug 2026)

File: `02_Dashboard_Files/ShopyLink_Action_07_Dispatcher.html` — ALL PASS (41 jsdom tests), bilingual.
Flow: **S1 Dispatch board** (zones with ready counts + covering drivers; stat bar Ready/Zones/Awaiting-payment) → **S2 Assign run** (zone deliveries ALL selected by default, untick to exclude; zone drivers with live dots, first available = ★ Suggested + auto-picked, offline unpickable) → **S3 Monitor** (runs: amber "Awaiting driver accept" with Simulate accept / Simulate decline / Reassign; accepted = green "Out for delivery" + timestamp, immune to reassign) → done (accepted runs → hands to B8).
Decisions (user-confirmed 18 Aug):
1. Unpaid individual deliveries = **separate section below the board** (🔒 Awaiting payment — individuals) with WhatsApp reminder button (stamps time). Pay-to-deliver gate strict: unpaid individual NEVER enters the pool; business COD deliveries DO enter (COD is a business term).
2. Assignment = all-selected-by-default with exclusion checkboxes.
3. Driver accept (separate driver app) = simulated in prototype (accept/decline buttons).
Model: one DELIVERY per customer address; a shipment is never split across drivers; decline/reassign returns deliveries to the board (reassign reopens S2 with zone + selection preset).

---

## ⚠ BUSINESS-RULE OVERRIDES (18 Aug 2026 — supersede DESIGN_BRIEF)

1. **PREPAID-ONLY — NO CASH, NO COD, anywhere in ShopyLink.** Every delivery (individual AND business) enters the dispatch pool only when its invoice is paid. This voids the brief's `collect_on_delivery` payment_term, driver cash PAYMENTs, and CASH_STATEMENT/accountant cash loop. B7+B8 already rebuilt on this rule; B9 must not reintroduce COD.
2. **Unavailable-customer photo is OPTIONAL** (reason alone is mandatory).
3. **Driver app is a STANDALONE mobile file** (`ShopyLink_Driver_App.html`) — not embedded in the dashboard. B8 dashboard covers ops side only (Monitor / Returns / Done) and links to it.

## ⚠ TARGET-VIEWER COMPAT RULES (learned 18 Aug — user's HTML viewer runs a legacy JS engine)

- **ES5 only** in all prototype scripts; polyfill `Array.prototype.find` (already breaks pages otherwise). No arrows, template literals, let/const, includes().
- Rule 4 reconfirmed the hard way: **ALL CSS `var(--)` in JS-generated inline styles resolved to literal hex** (fonts may stay var() — harmless fallback).
- No `calc()/vh/min()` for critical layout heights; no fixed-height+overflow shells around primary content.
- Every file ships with: window.onerror visual beacon + try/catch render guard + noscript notice.

## B8 Last-mile — Built & approved (18 Aug 2026, two files)

**`ShopyLink_Driver_App.html`** — standalone mobile app (the page IS the phone): sticky gradient header (contextual title, back button on stop screens, live progress bar), bottom tab bar **My Run / History / Account** with contextual action floating above (safe-area aware). Run: ordered stops, skip allowed, ● Next highlighted. Stop: map strip + tel:/wa.me action row + carton chips + prepaid badge; gates arrive → confirm recipient → signature (canvas pad + fallback confirm button) → delivered. Unavailable: reason mandatory, photo optional. End run: stop recap, no cash step. Account: profile, native-name language rows (English/العربية), vehicle/plate/zones, WhatsApp support link, 2-tap sign-out. History: resolved stops with times/signature.
**`ShopyLink_Action_08_Delivery.html`** — ops dashboard: Monitor (live stops, TRACKING_EVENTs, prepaid note, banner linking driver file) / Returns (reverse receive: scan每 carton individually, accept-return → attempts+1 → repool or `returned` terminal at MAX_ATTEMPTS=3) / Done ("Trip closed").

---

## B9 Billing + Pricing engine — Built & approved (18 Aug 2026)

### PRICING MODEL (user-corrected, final — supersedes brief's RATE_CARD-per-customer framing)
Three layers over TWO fixed bases:
1. **Two base price lists** (`BASE.ind` / `BASE.biz`): lanes = **departure × destination × method × basis** (per kg / per truck / per container / flat) × fixed price. No per-category price lists.
2. **Agreed prices (the real contract)**: per customer, per SPECIFIC service (a lane or a hub service) → agreed price, registered on the customer, **auto-links to his bill whenever he uses that service**. Contract is created from the customer account — NOT generated as standalone price lists (earlier logic deleted as wrong). Duplicate agreed per same service rejected. Discounts still apply ON TOP of agreed prices.
3. **ONE discount only — the HIGHER of**: category discount % (categories are pure discount tiers, e.g. VIP 10%) vs personal discount (% or fixed amount, amount capped at base). Discount is AUTOMATIC from the customer record; the invoice labels its source. VIP on a fixed/flat price works (e.g. 1800 flat − 10% = 1620).

`ShopyLink_Pricing.html` (6 sections): Price lists (two bases, inline-edited) · Categories (name+disc%) · Customers (category assign, personal disc %/amount, 📜 agreed prices with dropdown+prefill, 🧮 Billing-resolution-check widget) · Customs (HS): per-country HS tables, Upload-HS-file (batch+stamp), auto-duty calc (value × duty%) · Cards (GIFT cards — "rate cards" in user's vocabulary!): pull from supplier API, per category exchange rate + commission % + category discount, per-card special % override; sale = cost×rate×(1+comm)×(1−disc), SYP snapshot · Services (per hub/country registry: name+price+cur — feeds B9's fee dropdown).

`ShopyLink_Action_09_Billing.html`: Queue → Build → Issue&send → done ("Invoice issued & sent").
- Shipping charge auto-resolves via engine: agreed lane → base lane (by customer type); breakdown spelled out with 📜 badge when agreed; FCL = manual flat option kept.
- Discount row is READ-ONLY auto (source labeled, "higher one wins").
- Fees = dropdown add-row (per resolved hub; option shows registered price; picking prefills price editable + note; **Add resets to a fresh empty row**; agreed service price wins prefill). ⭐ exceptional free-form add-on kept.
- payment_term: prepaid all; credit 🔒 contract businesses only. No payment recording (customer app pays). Issue locks the invoice.
- **Branded INVOICE DOCUMENT**: ink band + lockup + slogan (**"World to Door" / "العالم إلى البيت" — copy brand text VERBATIM from Brand Guide, never from memory**), CODE128 barcode of INV no, Bill-to/Shipment columns, formula-transparent lines, per-currency total bands (never merged), pay-to-deliver notice + channels (ShamCash·Paymera·bank), 🖨 print = document alone (visibility trick).

---

## C9 Staff — Built & approved (18 Aug 2026, enterprise IAM design)

Rebuilt twice on user feedback (v1 matrix "not effective"; v2 "won't scale"). FINAL = standard IAM (NIST RBAC):
- **Users page**: search (name/email/phone) + filters (role/status/hub) + pagination (6/page). Create user = name/email/phone/role + **hub SCOPE** + 🔑 generate strong temp password (12ch) → "Create & send welcome email" → preview shows sign-in link + username + password + "change on first sign-in, link expires 24h". Lifecycle: Invited → Active → Suspended (never delete). Resend invite regenerates password. Audit log (every grant/revoke/suspend logged).
- **Hub SCOPES (scalability core)**: assignment = 🌐 all hubs (auto-includes new) | 🗺 by country (multi) | 🏭 specific list (grouped dropdown + chips). Never enumerate pills. Demo data: 12 hubs / 4 countries / 24 users / 10 roles.
- **Permissions**: per-user CHECKBOXES = role defaults ± overrides (added/removed badges, reset-to-defaults; role change clears overrides). Editor is shared: 5 collapsible groups × 24 functions, group check-all (tri-state), 🔍 function search auto-expands. Every dashboard function is a controlled item (build vs ISSUE invoice, assign vs reassign, each pricing sub-function...).
- **Role templates page**: search + sort(members/name) + updated stamp; template edits flow to holders instantly unless overridden; Approval level L1–L3 per role (pending-action confirmation concept); Admin locked 🔒 L3-all. Custom role via safe panel (Cancel/Create + live "will be able to" summary).
- DEFERRED by user: driver documents (license/passport/DRIVER_VISA expiry alerts) = separate later module (C2/C3).

---

## C7 Network + C8 Agents — Built & approved (19 Aug 2026)

### C7 `ShopyLink_Action_C7_Hubs.html` — the logistics NETWORK layer (absorbs C4 Airports, C5 Ports, C6 Cities)
Hierarchy (user-defined): **initiate 🌍 Country first → 🏙 logistic City → 🏭 Hubs (multiple per city allowed)**; plus 🛃 **Stops** at country level.
- **Countries**: name + ISO 3166 (OPTIONAL) + currency + phone prefix; live rollups (cities/hubs/stops); duplicates rejected.
- **Cities**: per country; UN/LOCODE OPTIONAL; shows its hubs (Damascus has TWO hubs — multi-hub proof).
- **Hubs**: 3 types (📥 receiving warehouse — customer-app address / 🎯 destination / 🔁 transit); full fields + **📍 map pin (WGS84 decimal "lat, lng", validated, mini-preview + Open-in-Google-Maps link)**; creation gated country→city; suspension hides from ALL dropdowns instantly (live 🧪 Dropdown-preview widget proves it), history kept.
- **Stops**: 🛃 border (name + country PAIR, e.g. Bab al-Hawa SY↔TR) / 🛫 airport (IATA optional) / ⚓ port (UN/LOCODE optional). **Presence per stop = 🏢 own office (link any hub) + 🤝 agents referencing C8 — several agents may be registered but exactly ONE active** (activating one deactivates others; removing the active one promotes a standby). All codes optional per user decision. B3/B5 consume these stops.

### C8 `ShopyLink_Action_C8_Agents.html` — standalone agents registry (user decision: separate from stops; stops only reference it)
- Agent = **Company** + country/city + 🏢 **Office details** (address, office phone, working hours) + 👥 **CONTACTS: each agent has MANY contacts; each contact = name + email + MANY phones** (chips + add-phone per contact; last phone & last contact protected) + services chips (customs clearance/handling/port agent/border services/airport cargo) + contract note.
- Search covers contact names AND phone numbers. Suspension hides agent from C7 stop dropdowns instantly (live preview widget). Audit log. Row header: company + first contact +N.

---

## ⚠ UX SAFETY + DENSITY STANDARD (adopted 19 Aug 2026 — RETROFIT COMPLETE across C1, C7, C8, C9, Pricing, B9)
User rejected the earlier pattern (tiny fonts, instant-save fields, one-click ✕ removals). Mandatory from now on:
1. **View / Edit mode**: records open READ-ONLY with an ✎ Edit button. Edit clones the record into a `draft`; the stored record is untouched until **✓ Save changes** (button disabled until `isDirty()`); amber "unsaved changes" flag; Cancel or closing the row while dirty → "Discard changes?" dialog.
2. **No destructive one-click**: every delete/remove/status change goes through a confirm modal that states the CONSEQUENCE (e.g. "will be pulled from trip assignment B3"). Removals inside an open editor apply to the DRAFT only.
3. **Type-to-confirm for the dangerous**: archive/delete requires typing the record's identifier (plate/name) verbatim; red button stays disabled until exact match.
4. **Archive, never hard-delete**: archived records vanish from lists + all dropdowns, stay in audit log, restorable.
5. **Density scale**: `:root` tokens `--fs-xs/sm/md/lg/xl` + `--ctl-h` with `html[data-density="compact"]` overrides; **Comfortable default = 13px body / 11px labels / 40px control height**; toggle in the toolbar. All JS-inline font sizes use `var(--fs-*)` (colors stay literal hex per compat rules).

## C1 Trucks — Built & approved (19 Aug 2026) — first module on the new standard
`ShopyLink_Action_C1_Trucks.html`: mixed fleet (🏢 own / 🤝 contracted — supplier mandatory when contracted), 5 types, bound to a **home hub from C7**. Full record: plate, make/model, year, **cargo box L×W×H → live volume m³**, **empty (tare) weight**, max payload, **GVW = tare + payload (computed)**, registration + insurance (doc no. + expiry) with **📎 registration-card attachment (image/PDF, thumbnail preview)**, maintenance log (date/km/work/cost, newest first).
**Expiry engine 🟢🟡🔴**: green valid · amber ≤30 days ("expires in N days") · red expired ("EXPIRED N days ago"); alerts panel aggregates all non-green as clickable chips.
**Assignability rule**: `active && no red doc` → anything else is EXCLUDED from B3 trip assignment automatically (live 🧪 dropdown-preview proves it; renewing a doc restores it instantly). Amber warns but does not block.

---

## 🚫 BUSINESS-RULE OVERRIDE — no domestic delivery charge (19 Aug 2026)
Supersedes the brief's `ZONE.delivery_fee`. **Door-to-door last-mile delivery is INCLUDED in the international shipping price**, which is fixed for the customer per location at the moment he buys his forwarding address in the app. Therefore:
- `ZONE` carries **no money field at all** — a zone is coverage + driver assignment only (C10 rebuilt accordingly; the rule is printed on the console and inside every zone record, EN + AR).
- No last-mile line may ever appear on an invoice (B9).
- The price the customer sees at address purchase already covers the door.
RESOLVED 19 Aug: **"Local transportation"** survives as a **business-only** hub service (`bizOnly:true`). It is filtered out of the fee dropdown on individual invoices, labelled "business only" on business ones, and gated in `svcAllowed()` so a forged add is refused too — the rule lives in the logic, not in the UI. Individual invoices print the reason under the dropdown (EN + AR).

## 💡 PRICING MODEL v3 — trunk lane + destination extra (19 Aug 2026, user idea, supersedes the cartesian lane table)
Storing every departure × destination × mode combination meant thousands of rows. New shape:
- **Trunk lane** = departure city → the country MAIN HUB city (Damascus for Syria), per mode, per basis. 8 rows cover everything today.
- **Destination extras** (`CITYX`) = one row per other city: **extra per kg** + **flat extra per truck/container** for full loads. The main hub row is 0 and cannot be deleted.
- **`price = trunk + city extra`** — resolved live; 4 lanes × 6 cities = 24 sellable services from 10 records; raising a trunk price moves every city at once; a city with no trunk lane resolves to nothing rather than inventing a price.
- The billing-resolution widget shows the split (`trunk 2.1 + extra 0.15 = 2.25`).
- **Address plans use the same shape**: a main-hub plan price per warehouse (per trip / monthly / yearly) + a flat **governorate extra** (yearly extra ×10). Editing the base moves every governorate at once. Still: subscription for the address only — international shipping is billed by weight separately, door-to-door included.
DONE 19 Aug: B9 mirrors the model — shipLane resolves trunk+extra (agreed price still wins and is never topped up), flatFor adds the flat city extra for full loads, and both the builder breakdown and the invoice document print the split (trunk 6.5 + extra 0.15 = 6.65/kg), suppressed at the main hub. Extras are categorised PER COUNTRY (Syria/Turkey/UAE, each with its own main hub) so a lane resolves against the right country trunk. Add-lane row now picks a destination COUNTRY and locks the endpoint to its main hub — the old free-text destination was why the button appeared dead.

## 💳 CARDS — built 19 Aug 2026 (`ShopyLink_Action_Cards.html`, three pages)
### Multi-supplier model (19 Aug 2026 — supersedes the single-API version)
A card denomination is not a price, it is a set of **offers** — one per supplier, each with **its own API, its own cost AND its own sale price**. Rules as decided:
- **Cheapest AVAILABLE offer wins** (out-of-stock offers and switched-off suppliers drop out of the race); the rest form the ordered **fallback chain**.
- **Failover is automatic and logged**; the **quoted price is honoured** — a failover changes OUR margin, never the customer's price (derived rule, printed in the UI: 26.00 quoted, fallback cost 24.10, margin 2.20 → 1.90).
- If every supplier fails, no code is issued and the attempt chain is logged (never a code without a successful response — rule 30).
- Cutting a cost, adding an offer, or switching a supplier off **re-elects the winner automatically**; switching one off states how many denominations it currently wins.
- A **provisioning simulator** on the console lets you force any supplier to fail and watch the chain resolve.

1. **Catalogue** — one record per card PER REGION (Amazon USA and Amazon UAE are separate, per rule 29, which is printed on the record). Each card holds **store pages** it works on (name + URL, Apple carries three) and its **denominations**: face value · supplier cost · our sale price · live **margin** in value and %. A denomination priced under cost turns the row red and is counted on the console header. Draft editing throughout; removing a denomination or a store page warns first; deactivating states it leaves the customer gallery while issued codes are untouched.
2. **Price review** — every card × denomination × **supplier offer** in one backend table (card · region · face · supplier · cost · sale · margin), 🏆 marks who issues today, below-cost rows flagged ⚠.
3. **Supplier API** — one card per supplier: endpoint, **masked key with per-supplier reveal**, connection state, last sync, offers/wins counters, Test connection, Sync catalogue, and an activate/deactivate guard. Prints rule 30.

## ⚖ CHARGEABLE WEIGHT (19 Aug 2026)
International standard, decided with the user, mirrored in Pricing and B9:
- **Air**: volumetric = L×W×H cm ÷ **6000** · **Land**: ÷ **3000** · chargeable = **the higher of actual and volumetric**, no rounding (2 decimals). A missing dimension yields no volumetric weight — never an invented charge.
- **Sea**: kilos do not apply. A per-**CBM** lane basis was added and sea trunks are priced per CBM (95 / 82 base; agreed prices too). Billing uses **W/M — the greater of volume (CBM) and weight tonne**. (This replaced a first pass that converted 1 CBM ≈ 1000 kg against a per-kg sea rate and produced a 1,728 USD invoice for a 1.08 CBM crate; the model now returns 75.60.)
- Destination extras carry three columns: **extra / kg · extra / CBM · flat extra per truck-container**, and the resolver picks the one matching the lane basis.
- **Where dimensions come from (decided 19 Aug):** B1 receiving measures the parcel as it arrives (estimate + tracking + supplier-discrepancy evidence); **B2 consolidation measures the outgoing carton and THAT is what B9 bills** — repacking usually shrinks the volume, in the customer's favour. Both entries are **optional**, but a weight-based invoice with no B2 measure raises a billing warning (`no consolidation measure — billing on actual weight only; the B1 intake size is for reference`, with the intake figures shown); with nothing measured anywhere the warning is starker. Billing is never blocked and a volumetric weight is never invented. Fixed-amount invoices show no dimension noise at all. The breakdown names the source: `📦 measured at B2 consolidation · at intake B1 65×48×60`.
- ✅ done: B1 already captured L×W×H per carton; B2 measures the outgoing carton and hands the figure to billing.
- B9 prints the working on both the builder and the invoice: air/land → `actual 12 kg · volumetric 24.75 kg (60×45×55 ÷ 6000) → volumetric wins`; sea → `volume 1.08 CBM · weight tonne 0.12 → W/M 1.08 CBM`.

## 🧯 COMPAT AUDIT (19 Aug 2026) — three killers found in older files
Added a permanent **ES5 parser check** (`acorn ecmaVersion:5`) to the test arsenal; the previous jsdom "legacy" simulation caught missing *functions* but not ES6 **syntax**, which dies before the first line runs.
- **B1 Receive + B2 Consolidation were written in ES6** (93 and 38 `let/const`, 59 arrows, 87 template literals) → would never have rendered on the user's engine. **Transpiled to ES5** with Babel (targets ie11); both render and translate correctly afterwards.
- **B3 Create Trip** was missing the `Array.prototype.find` polyfill (`HUBS.find is not a function`) — added. **B7** had the same gap, fixed earlier the same day.
- All 20 modules now pass: ES5 parse · strict legacy run (no `Intl`, no `Array.find`, `toLocaleString` rejecting options) · flow check 0/0.

## 📦 B2 → B9 MEASUREMENT HANDOVER (19 Aug 2026)
The review screen of B2 now ends with **Handover to billing**: trip mode selector (land/air/sea), the source of truth (📦 B2 repacked carton vs 📥 B1 as received), actual weight, volumetric (or CBM for sea), and the figure **B9 will bill** in its unit — land ÷3000, air ÷6000, sea W/M in CBM. Honest about gaps: a repacked carton with no dimensions counts its weight and is flagged; a batch that was never repacked says *dimensions stay on the B1 record* instead of inventing a volume.

## 🔌 THE APPROVALS BUS (19 Aug 2026) — C12 now runs on real requests
These are standalone files, so the queue lives in one shared `localStorage` key (`SL_APPROVALS_V1`) with a tiny ES5 helper set (`slBusRead/Push/Patch/Get`, all wrapped in try/catch).
- **Origins publish**: B9 (exceptional discount, L3), B5 (border extras, L2) and B6 Claims (L2) push a uniform record — `id · op · opName · module · ref · customer · hub · level · escalated · amount · detail · reason · by · at · status · decidedBy · dnote`.
- **C12 merges** live requests with its own samples, badging each **● live** or **sample**, honours the level each request was filed at (an L2 approver sees only the two L2 ones; the L3 admin sees all three), and has a **🔄 Refresh**.
- **Decisions write back**, and each origin re-syncs on its next render: approving a claim in the console makes the Claims module issue the credit note and settle; rejecting a border extra shows the reason there and keeps the crossing unsettleable.
- **Degrades honestly**: if storage is blocked the console still renders on samples and says *shared storage is blocked here* rather than pretending.
- ✅ **All six origins are on the bus** (19 Aug): B9 discount · B5 border extras · B6 claims · Pricing (base price + agreed beyond ceiling) · B7 reassign accepted run · B3 cancel trip. Verified end to end: six requests, six operation types, one queue; an L2 approver sees the four L2 ones and the L3 admin all six; approving in the console makes Pricing apply the new base price and B7 pull the accepted run back, and rejecting keeps the B3 trip planned with the reason shown. C12 renders an unknown operation type gracefully rather than crashing.

## 🌐 LANGUAGE FIRST (19 Aug 2026)
The app now opens on a **language screen** before the intro (`SCREENS` starts with it and `st.screen` defaults to `lang`). Both options are written in their own script (العربية / English) and the question is asked twice — *Choose your language* / *اختر لغتك* — so neither reader needs the other language in order to choose. The slogan appears as its verbatim pair (world to door · العالم إلى البيت). Continue carries the choice into the intro at slide 1, and a line notes it can be changed later in Settings.
**No tab bar before the app starts** — the frame now treats `lang`, `intro` and `login` as pre-app screens and renders no tabbar on any of them (previously only `intro` was exempt, so the language and login screens showed a dead bar).
**Language in the account**: the Account menu carries a 🌐 Language row showing the current choice (English / العربية) that opens Settings, where the existing EN/عربي switch flips the whole app.

## 📱 CUSTOMER APP ↔ PRICING (19 Aug 2026)
`ShopyLink_App_Combined_Designed_v2.html` used a flat `RATES[origin] × weight`. It now carries a mirror of pricing model v3:
- **trunk (origin → main hub) + the customer's city extra**, billed on the **chargeable weight** (÷6000 air, ÷3000 land; no dimensions → actual weight, nothing invented);
- the customer's own record — **agreed price wins outright** (and takes no city extra on top), otherwise base;
- **ONE discount = max(category %, personal %)**, applied once. Seeded as VIP 10% vs personal 5% → 10%.
- `shipCost()` now returns the net of `slQuote()`, so every screen that shows a price follows the dashboard.
- **Compat**: this file was ES6 (125 `let/const`, 148 arrows) and would not have run on the target engine — **transpiled to ES5**; it renders, prices correctly and passes the strict legacy sweep.
- ⚠ **Correction (19 Aug):** the address flow already existed — Home → *Buy an address* fires `data-go-addrmod` → `openModule('addr')`, which opens **`ShopyLink_Addresses.html` embedded as base64 in `MODS.addr`** and shown in an iframe. It is not a screen in `SCREENS`, which is why a grep of screen names missed it. A parallel `address-plan` screen was built by mistake and has been **removed**.
- ✅ **The real module now carries the pricing model**: `planTotal()` = main-hub plan price **+ the customer's registered governorate extra** (annual ×10), applied on the plan list, the pay summary and the pay button (USA annual 2,400,000 → **2,550,000** for Aleppo; monthly 250,000 → 265,000). Under the plan list it prints *includes 15,000 SYP for delivery to Aleppo over Damascus · the delivery itself is included*, EN + AR. The module was ES6 → transpiled to ES5, was missing the `Array.prototype.find` polyfill (added), and had a **dead suggestion chip** (`data-name` with no handler) — now wired. Flow check went 2 fails → **0**.
- The updated module was **re-embedded into the app's base64 payload**, so the real entry point serves the new prices.

## 🧾 REGISTRATION ASKS FOR THE CITY (19 Aug 2026)
`ShopyLink_SmartRegistration.html` — the **delivery governorate** is now captured on the same step as the name and phone, because it is what prices the account: it sets the **address-plan price** (main-hub plan + governorate extra, ×10 on annual) and the **per-kg city extra** on shipping.
- A live strip under the form shows the three plan prices for the chosen governorate and re-prices the moment it changes (Damascus monthly 250,000 → Aleppo 265,000).
- It states the truth in one line: *door-to-door to Aleppo is included in your price; shipping adds 9 SYP/kg over the Damascus rate* — and for Damascus, *the main hub, no extra*.
- The later address step is pre-filled with that governorate instead of a dummy select.
- The file was ES6 → **transpiled to ES5**; strict legacy sweep clean.

## 🇸🇾 FLAG RULE — green only (19 Aug 2026, non-negotiable)
The **green flag** (green · white · black with **three red stars**) is the only Syrian flag used anywhere in the project. The red one is forbidden.
- The `🇸🇾` emoji renders as the **red** flag on nearly every device — it is therefore **banned as a representation of Syria** and has been replaced everywhere with an inline SVG (App, Driver App, Individual App).
- A worse bug was already in the codebase: the hand-drawn SVG was green but carried **two** stars (a hybrid of both flags). Fixed to **three**, at 7.5 / 15 / 22.5.
- `#CE1126` remains in the files — correctly, as the colour of the three stars on the green flag.
- Checked: no `🇸🇾` anywhere; other countries' emoji flags (🇺🇸 🇦🇪 🇹🇷 🇨🇳) are untouched. Any new screen must use the SVG, never the emoji.

## ✅ FULL DELIVERY AUDIT (19 Aug 2026) — 28 files, all green
Every file was put through five checks: **ES5 syntax parse** (acorn `ecmaVersion:5`) · **renders** · **Arabic/RTL** · **strict legacy engine** (no `Intl`, no `Array.find`, `toLocaleString`/`toLocaleDateString` rejecting options) · **green-flag only** — plus the flow check (0 fail, 0 warn on all 28).
Five classes of defect were found and fixed during the audit:
1. **`toLocaleDateString('en-GB', {...})` in 20 files** — ECMA-402 options, unsupported on the target engine. Replaced everywhere with an ES5 `slDateStr()` formatter (23 calls, plus 3 single-argument calls which are equally locale-dependent).
2. **`Array.prototype.find` polyfill missing in 9 files** (B1 B2 B3 B4 B5-journey B6, App, Dashboard, Individual App) — added.
3. **B1 and B2 arrived as ES6 again** with the re-upload (the earlier transpile was overwritten) — re-transpiled.
4. **The app embeds THREE modules as base64** (`addr`, `card`, `reg`), not one. `card` and `reg` were still ES6 and `reg` still carried the red-flag emoji. All three fixed and re-embedded.
5. **A bug in my own transpiler**: it used `String.replace(a, b)` where `b` contained the code's `sym:'$'` — the `$'` sequence is a substitution pattern in JS and injected `</body></html>` into the script. Tool fixed to use a function replacement; every transpiled file re-scanned for the signature (all clean).
**Module inventory (28):** B1 B2 B3 B4 **B5 Trip journey** B6 B7 B8 B9 · Pricing · Border fees · Claims · Cards · C1 C2 C7 C8 C9 C10 C12 · Dashboard · System diagram · App combined · Individual app · Driver app · Addresses · Gift cards · Smart registration.

## 📜 DECISIONS ON THE FREIGHT-FORWARDING MASTER PROMPT (19 Aug 2026)
The uploaded `shipping_dashboard_master_prompt.md` is a reference map for me, **not** an instruction to rebuild. Its central structural claim — trip and shipment must be separate, one-to-many — is **already how ShopyLink is built** (B3 trips carry `assignedShipments`, B2 consolidates several clients into one box, B9 invoices per shipment), so no restructuring follows from it.

**Rule changes the user confirmed (these supersede earlier entries):**
1. **PREPAID IS THE DEFAULT FOR EVERY ACCOUNT — individuals and businesses alike.** Being a business grants nothing by itself. Credit exists only as a **facility that is explicitly granted**: manager only, written reason, both a term in days **and** a limit, and **an accounts-payable contact must already exist** or the grant is refused. It is revocable at any time, which returns the account to prepaid like everyone else. Grant and revocation both stay on the record with who, when and why.
2. **Quotations exist, for BUSINESS accounts only** — used for new destinations and shipments whose shape varies. Individuals keep the published fixed price (address plan + trunk/extra).
3. **Density and role clarity adopted, the dark control-room skin rejected.** Keep Design System v2 (cream canvas, white cards, Bricolage) and take from the prompt only what serves the work: information density, urgency-ordered screens, and above all **making roles and their work visible**.
4. **Stack: unchanged.** Static ES5 HTML for the prototype (the target engine is old — five compat defects were found today). The prompt's React/Tailwind line is for a future production build, not for these files.
5. **Sea/air: prepare the structure, do not build it out.** Support **uploading VGM and AWB files as references** on the record; do not build IATA AWB generation, check digits, AWB stock, telex release, devanning or TIR flows now.
6. Freight vocabulary from the prompt (B/L types, VGM, AWB, T1/TIR, CFS devanning, COO consistency checks) is **recorded for later**, not implemented.

**Adopted for build, in order:** (1) the anti-forgetting engine — owner · next action · due date, ageing, stalled queue, escalation ladder, unassigned tray, **handover acknowledgement**; (2) document gates; (3) trip-cost allocation across shipments; (4) provisional clients + duplicate detection. All four are **layers over the existing modules** — no entity changes, no design change, no ES5 break.

## ⏱ THE CONTROL DASHBOARD — `ShopyLink_D1_Control.html` (was W1; renamed on the user's preference)
Contract written first (`TEST_CONTRACT_anti_forgetting.md`, 41 behaviours), then the build, then 47 automated checks (`test_engine.js`) — **all pass**.
**The rule:** every work item has one owner, one next action, one due date. Any of the three missing → the item is `broken` and lands in the **Unassigned** tray; that tray being non-empty is itself the alert.
- **Ageing** reads an injectable clock (`NOW()`), so tests move time instead of waiting: green under 70%, **amber at exactly 70% inclusive**, red past due, **black past a hard cutoff and black outranks red**. Touching an item resets its age and never its due date.
- **Stalled** = 24h with no update, listed with the owner's name; a touch clears it.
- **Escalation ladder** L1 owner → L2 supervisor → L3 manager panel, **one rung per overdue day and never skipped** — a three-day jump in a single move still records all three. At L3 the item cannot be dismissed: only resolved, or reassigned **with a written reason**.
- **Handover** is where work is really lost, so: ownership **stays with the sender until the receiver acknowledges**; unacknowledged for 4h it is flagged on *both* strips; acknowledging transfers ownership and resets the clock; and a handover to a role that cannot perform the next action is **refused with a stated reason** (a document task cannot be pushed onto Operations).
- **Nothing is ever deleted.** Cancelling needs a reason and the manager; cancelled items stay reviewable with who and when.
- **Role visibility is by data**: `queueFor('wh')` does not return finance items at all. The manager alone sees everything.
- **Roles are surfaced, as the user asked**: seven roles, each with a written responsibility statement in EN and AR shown on its own dashboard, above the shared top strip — my overdue · due today · unacknowledged handovers — then the role's queue sorted by consequence, not by date.
- Seven screens: **My work** (role console) · **Manager** (unassigned · critical · stalled · stale handovers · team load · cancelled log) · **Clock** (advance +1h/+4h/+1d/+2d/+3d to watch the ladder run).
### The SHIPMENT LIFETIME clock (added the same day, on the user's point)
A **second, deliberately different clock**: the work-item age asks *"has anyone forgotten this?"*; the lifetime asks *"how long do we actually take?"* Merging them would let a staff member keep an item green by touching it hourly while the shipment sits for thirty days.
- **Runs from B1 receipt to POD at B8, and no internal action resets it** — touching, handover and reassignment were all tested against it. A delivered shipment freezes permanently; a running one keeps counting.
- **Milestone slices** (received → consolidated → departed → border → arrived → cleared → delivered) sum exactly to the total with no gap or overlap, so the board answers *where* the time went, and marks the worst stage.
- **Client-caused delay, decided by the user:** the total keeps running (that is what the customer lived through) **and beside it "time under our control"** with the client wait deducted. Overlapping wait windows are counted **once** (union, not sum), an open wait accrues live and freezes on close, and the wait can never exceed the total. Both figures are always displayed together and labelled — never one pretending to be the other.
- **The promise is per lane × mode** (Guangzhou→Damascus sea = 45d). A lane with no promise reports **unpromised** and never a default — one such lane is seeded so the state is visible. **Performance is judged on controlled time; the client is shown the total.** Green under 90%, amber to 100% inclusive, red beyond.
- **Averages come from delivered shipments only**, and `suggestPromise()` returns the observed controlled average with its sample size — **flagged "thin" under 5 deliveries**, an indication rather than a fact. This is how the promises stop being guesses and start coming from our own data.
- Fourth screen: **Speed**. Contract extended by 20 behaviours; **32 further automated checks, all pass** (`test_lifetime.js`), on top of the engine's 47.

### DOCUMENT GATES (added 19 Aug, contract `TEST_CONTRACT_document_gates.md`, 38 checks — all pass)
**A stage cannot be exited while a required document is missing. A refusal, not a warning.**
- The checklist is **generated** from mode + direction + stage (`requiredFor`), never typed on the job; land and sea produce different lists; a conditional document **states its condition** ("lane requires it") instead of appearing silently.
- **The pack covers every shipment on the trip.** Adding a shipment extends it; removing one takes only its own documents. The seeded land trip carries three shipments and is BLOCKED because the *third* has no COO — exactly the failure a first-shipment-only check would miss.
- The refusal lists **every** missing item and names the shipment, not just the document. **A void document does not satisfy the gate; an expired one does not either; a document filed on another trip does not.** The gate is evaluated at the moment of exit, never cached.
- **A trip with no shipments cannot depart at all.** The indicator is binary and loud — **BLOCKED / CLEARED** — and attaching the last missing document flips it in the same tick.
- **Override:** manager only, written reason mandatory, and it records who · when · why · what was missing. The trip stays marked overridden, all overrides are listed for weekly review, and — the rule that keeps it honest — **the override covers only what was missing at that moment**: a document that goes missing later closes the gate again.
- **Attachments are evidence:** who and when on every one, **nothing is ever deleted** (a wrong document is voided with a reason and stays), replacement supersedes and keeps both versions, and an expiry carries its days remaining.

### COST ALLOCATION (added 19 Aug, contract `TEST_CONTRACT_cost_allocation.md`, 30 checks — all pass)
**A cost is booked once at trip level and split across the shipments that caused it, so profit per client is calculated rather than guessed.**
- Four keys — **by CBM · by weight · by pieces · manual** — plus **direct costs** attributed wholly to one shipment. The key used is printed on every allocation ("allocated by CBM"), and changing it logs both names.
- **The parts always sum to the cost, to the cent.** Largest-remainder rounding, deterministic: 100 ÷ 3 → 33.34 / 33.33 / 33.33 with the *same* shipment carrying the odd cent every time. A manual split under 100% is refused with the shortfall named. **A key with no data refuses and names the shipments** instead of silently dividing equally — the quiet way costs get misallocated.
- **Profit per shipment = its own revenue − (allocated share + direct costs)**, and a loss is shown as a loss: the seeded trip proves it — the truck's 1,800 by CBM makes SL-9603 (5 CBM, plus its own 120 clearance) **lose 170** while the other two earn, and **the trip's profit equals the sum of its shipments** with no orphan money.
- **An unallocatable cost is visible as unallocated**, never absorbed. Voiding a cost re-computes every profit in the same tick, and nothing is ever deleted. Margins under 10% are flagged per shipment.
- Every share **traces back in one click** to the cost line that produced it.

### PROVISIONAL CLIENTS & DUPLICATE DETECTION (added 19 Aug, contract `TEST_CONTRACT_clients.md`, 40 checks — all pass)
Two rules that pull against each other, both held: **operations is never held up by paperwork**, and **the same client must not exist five times under five spellings**. Creating is easy; creating a *duplicate* is hard.
- **Dedupe runs before the form.** Fuzzy on the name — `تك لاين` ≈ `التكلاين` ≈ `Tech Line` ≈ `TECHLINE` (diacritics, the Arabic article, spacing, case and legal suffixes all normalised); **decisive on tax number, phone and email** — `+963944111222` ≡ `00963 944 111 222` ≡ `0944 111 222`. Matches are scored and ordered.
- **A strong match (≥85) blocks creation** until it is dismissed **with a written reason**; a weak one only warns.
- **Quick create needs four fields** — name, country, one contact, phone *or* email — saves as `PROVISIONAL`, and returns the id immediately so the shipment proceeds. A provisional client is **prepaid, zero credit, general tariff, and cannot hold a contract**. A completion task is created for Sales with owner · next action · due in 7 days, and it **runs on the same escalation ladder** as everything else. The tray shows each one's age.
- **Merging is the cure and it is safe:** contacts and shipments move, the losing record is **kept and marked merged** (never deleted) and its id still resolves to the survivor, a reason is mandatory, the **stricter credit terms survive**, the open-shipment count is stated before confirming, and a circular merge is refused.
- **Credit per the amended rule:** an individual can never be given credit days; a business may; a **provisional** business stays prepaid until its profile is complete. Outstanding and overdue are **derived from invoices**, never typed. A booking beyond the limit warns and states the overage (800 over 5,000); release past the limit needs the **manager plus a written reason**, and is logged.

### BUSINESS IDENTITY — type + contact people (added 19 Aug on the user's request, 33 checks — all pass)
- **Business type** on every business account: importer/trader · retailer · wholesaler/distributor · manufacturer · e-commerce · freight forwarder/agent · contractor · other. (List proposed by me — correct it if your book of clients says otherwise.)
- **Contact people, plural, each with the role it answers for**: owner/decision maker · operations · documentation · **accounts payable** — plus position, two phone numbers and an email. `contactFor(client,'ap')` is how an invoice finds where to go, and its absence is detectable.
- **Where it is asked matters.** Quick create stays at four fields so **operations is still never held up**; the type and the contact role are demanded at **profile completion** — a business cannot go ACTIVE without them, while an individual is never asked.
- **A client can never be left unreachable**: the last remaining contact cannot be removed, and any removal needs a reason and is logged.
- **Derived rule, stated in the UI:** credit days granted with **no accounts-payable contact** is flagged — an invoice with nobody to send it to is how receivables age quietly. Adding that contact clears the flag; individuals are never flagged since they hold no credit.

### CREDIT IS A GRANTED FACILITY, NOT A PROPERTY OF BEING A BUSINESS (corrected 19 Aug, 24 checks — all pass)
The user caught a loose reading in my first pass: *"not every business account pays on credit — all pay cash in advance unless we give them a credit facility."* The model was tightened accordingly.
- `hasCredit()` is true only when a **facility record exists and is active**. A business with no facility answers `prepaid` to every credit question, however large the booking.
- **Granting is an exception made on the record:** manager only · written reason · days **and** limit both required (no open-ended credit) · **refused outright if there is no accounts-payable contact** — the invoice must have somewhere to go. An individual can never be granted one; a provisional business stays prepaid until its profile is complete.
- **Revoking returns the account to prepaid**, clears the terms, and keeps both events in `facilityLog`.
- The board shows **PREPAID** on every account without a facility, and where one exists it names **who granted it and why**.
- A consequence worth noting: the accounts-payable gap can no longer be created through the sanctioned path — it is **prevented at the source**. The flag now serves the remaining real case: the accountant later leaves and the contact is removed.

**Defect the contract caught:** the audit feed was capped at 12 entries, so **escalation rungs were being evicted from the record**. Fixed — history is now uncapped per item (`historyOf(id)`), with the capped list kept only as the display feed.

## 🎛 CONTROL-PANEL LAWS + DELEGATION (19 Aug, from prompt 2 — 29 checks, all pass)
Three things taken from `prompt_2_shell_dashboards_chat.md`; the rest of that prompt is recorded as a map for the developer, not built.
1. **No number without context, and every number opens the list behind it.** A count that cannot be drilled into is a dead end and will be ignored within a month. Every figure on the dashboard is now a button: it carries a comparison or a state ("+2 vs last week", "nothing overdue") and clicking it renders **exactly the records behind it**, in place. An empty drill says *nothing here — which is the point*.
2. **The two figures that must always read zero**, on every role's screen and on the manager's: **deadlines missed** (a day overdue, or anything past a hard cutoff even before it is due) and **delivered but not invoiced** (a delivered shipment with no `invoice.issued` event). Both are computed live from the engine, both are drillable, both clear themselves the moment the work is done.
3. **Out of office and delegation** — the prompt calls it the main defence against work being forgotten while someone is on leave, and it is right. Setting it **moves every open item you own to your delegate at once** (nothing stays behind with the absent person), each item remembers who it belongs to, the absence is visible to the team, and coming back **returns everything automatically**. Delegating to yourself is refused; a reason is mandatory; both events are in the record.

## ☀ "MY DAY" — the landing page (19 Aug, contract `TEST_CONTRACT_my_day.md`, 32 checks all pass)
The dashboard now **opens on My Day**, not on a queue. It answers one question in three seconds: *what must I do right now, and what happens if I don't?*
- **The greeting states the obligation**, not the weather: *"You have 4 overdue, 11 due today, 2 handovers waiting for you to accept"* — counts taken from the engine, never a second tally — with the role's responsibility statement beneath it so it is read every morning. Time-aware from the injectable clock.
- **The priority list is ordered by consequence**: black → red → amber → green, nearest deadline within a tone. Proven by test that **a new red outranks an old green** — creation date is irrelevant.
- **Every row says what happens if it is missed**, and the sentence is specific to the kind of work: an unmeasured carton → *"the container is stuffed on a declared figure — the revenue difference is never recovered"*; an unissued invoice → *"work is delivered and unpaid — this is the figure that must read zero"*; a passed hard cutoff gets the strongest wording. Rows are actionable in place.
- **The shape of today** — an hour band from 07:00 to 20:00, each marker in the hour of its deadline, spent hours dimmed and the current hour ringed. An empty day says so instead of drawing an empty grid.
- **Since you were last here** — derived from the audit history, with a marker the reader moves.
- **Shift handover note, per role** — free text with who and when, shown at the top of the next person's day, **kept and never overwritten**, and an empty one is refused. Unglamorous, and it prevents a real share of dropped jobs.

## 💬 CONTEXTUAL CHAT (19 Aug, contract `TEST_CONTRACT_chat.md`, 31 checks all pass)
Built to the user's own rule, which is the right one: **every message targets a record and at least one role.** A message with no record is a rumour; a message with no role is an obligation with nobody to own it. Both are refused, with the reason said out loud.
- **Several roles at once** are allowed, and the composer names **who will actually read it** before you post.
- **A role is one person PER HUB** (added on the user's point). Five hubs — Damascus · Aleppo · Istanbul · Dubai · Guangzhou — and every person belongs to one, so `@documentation` at **Damascus is Rana** while `@documentation` at **Guangzhou is Layla**. The composer carries a hub selector and **names who will actually read the message before you post it**. If the chosen hub holds nobody in that role, the message still reaches the role holder elsewhere but is **flagged — "⚠ not at Aleppo"** with the person's real hub named; a role nobody holds anywhere returns nothing rather than a wrong person. Replies inherit the hub, an old message still resolves to its own hub when re-read, and **message → task hands the work to the person at that hub**.
- **A person is named on top of a role, never instead of it** — person-only is refused. This is what keeps the promise: `@documentation` reaches whoever holds the role now, and **if that person is out of office it resolves to their delegate**, so the message still lands.
- **Replies inherit** the record and the participants — no re-tagging, or people work around the rule.
- **One thread per record.** Anyone pulled in later reads it from message one. **System events post into the thread**, so it reads as a single timeline of human discussion and machine history.
- **Permanent**: no delete API, an edit keeps the original readable and is marked edited, and the interface says so.
- **The record number is a door** — one click resolves the record to its open work and lands on it, opened and ready to act. A record with nothing open says so instead of opening an empty page.
- **Message → task**: it inherits the record and the role, is owned by whoever holds that role, and enters the **same** engine — ageing, escalation, handover. With no due date it is `broken` and surfaces in the unassigned tray, so an obligation cannot hide in a conversation. Converting twice is refused. This is the bridge between *someone said something* and *someone is accountable*.
- **The record picker is a type-ahead, built for a real book of shipments** (corrected on the user's point that a wall of buttons collapses at scale). Nothing is drawn until a character is typed — the empty state says how many records exist and asks you to start. Each keystroke narrows it (**tested at 300 shipments: 307 → 100 → 10 → 1**), results are **ranked** — exact number first, then a number that starts with what you typed, then a name match — and the order is **stable** so the list does not jump between keystrokes. **At most 8 rows are ever drawn**, with *"showing 8 of 100 — keep typing to narrow it"* underneath, and the nagging stops once it fits. The thread chips are capped at six with the rest left to the search.
- **The record is chosen, never assumed** (corrected on the user's point). The screen opens with **nothing selected** and says so; the composer does not even appear until a shipment or trip is picked. A **search box** lists the real records (shipments, trips, anything with open work) with their client and route; a record with no thread yet can be chosen and the first message starts it. **A message about a record that does not exist is refused** — *pick it from the list rather than typing a number nobody knows*. Choosing "change the record" puts you back to choosing rather than silently keeping the last one.
- Deliberately **not** built: direct messages, group chats, presence, push. Those are a separate product.

## 🧭 THE SHELL — search · badges · notifications · port clock (19 Aug, 37 checks all pass)
The fourth layer from prompt 2, built on top of the engines rather than beside them: **nothing here invents data — every count and every result is derived.**
- **Global search, one field, everything**: shipments, trips, clients (by name, tax number **or a contact's phone**), work items, people, costs, **and the text inside the threads**. Results are **grouped by type with each record's status inline**, and clicking one lands on it. An empty query returns nothing rather than everything; no match says so in words.
- **Live badges on every tab, counting THIS user's work** — the queue, blocked packs, provisional clients, unallocated costs, shipments past their promise, unacknowledged handovers. Switching person switches the counts; a badge **turns red when anything inside it is overdue**.
- **One notification inbox**, grouped **Critical / Action required / Informational**, every row **actionable in place** (accept the handover, open it, give it an owner, open the thread) with no navigating away. **Reading is the acknowledgement** (on the user's point): there is no mark-as-read button at all — opening the panel marks them. The pass that shows them still renders them as new with a blue dot and an *"N new"* count, so nothing greys under your gaze; they read as seen the next time you look. Read notifications are **retained, not deleted**, new work raises its own notification unread, and the panel states the rule: *opening this marks them read — a critical alert is still resolved, never silenced*.
- **The clock, and the port clock.** Local time in the bar, and on a trip card **both ends of its route in their own local time** — Guangzhou reads five hours ahead of Damascus, verified arithmetically. An unknown place returns nothing rather than a wrong hour. Prompt 2 is right that timezone confusion causes more missed cutoffs than carelessness.

### Compliance against the two prompts — 64 requirements
**56 built · 8 outstanding.** The remaining eight, by decision or by scope:
`quick create (+)` · `company notice board` · `profile & preferences` — small shell items, not yet built.
`container utilisation` · `AWB check digit` · `cutoff calculator` · `daily brief` — parked by the user (sea/air prepared, not built out).
`trip ≠ shipment` shows as "not found" only because the checker greps for a literal string; the rule **is** implemented (a trip carries three shipments, `SHIPS` is a separate entity, profit is computed per shipment).

## ➕ THE LAST THREE SHELL ITEMS (19 Aug, 36 checks all pass) — compliance now 60/64
1. **Quick create (+)** in the bar on every screen: work item · client · message · trip cost · shift note. It is **context aware** — on a thread it pre-fills that record — and **it refuses to create a half-thing**, naming every field it still needs. The three-fields rule holds here too: a new work item cannot be made without a role, a next action and a due date, and it is owned by whoever holds that role **at that hub**. Creating a message through it still obeys record + role — the button is not a back door around the rule.
2. **Company notice board** on My Day, where it is actually read: advisories, policy changes, closures, each with who posted it and when. **Dismissing hides it for that user only and keeps it** in a "dismissed — kept, not deleted" archive it can be brought back from; another person still sees it. **Writing one happens on the board itself** (added when the user asked where and by whom): the manager gets a *write a notice* control there, with the kind — advisory · policy · closure — and **English and Arabic side by side**. Everyone else sees a plain line saying the manager writes here, **and is given the name to ask**; no dead control is shown to someone who cannot use it, and the rule is enforced in the engine, not only in the interface. A scrap of text is refused. **One language is enough when something is urgent** — it goes out marked **untranslated** and reads in the written language on both sides, so nobody mistakes a rushed advisory for a broken one.
3. **Profile & preferences** — the person, their role statement, their hub, and **their own settings only**; the page says plainly that company settings live under Admin. Language and density are real preferences that move the whole shell. Notification channels can be turned off **except the critical cutoff alert, which cannot be silenced — only resolved** — and the screen shows which one is locked. Out-of-office lives here too, where people look for it, alongside a personal activity log.

**Compliance against the two prompts: 60 of 64.** The four outstanding are all **parked by the user**: container utilisation · AWB check digit · cutoff calculator · daily brief. (A fifth line, "trip ≠ shipment", reads as missing only because the checker greps a literal string; the rule is implemented and tested.)

## 🔎 THE ORPHAN AUDIT (19 Aug) — capabilities that had no way in
The user found that `postNotice` existed in the engine with **no interface to reach it**, and asked whether there were others. There were. A detector (`orphan.js`) now lists every function defined in a file and never referenced anywhere in it — the signature of a capability built and forgotten. It found **24**; six were real features nobody could use, and all six are now wired:
1. **Void a document on a gate** — the engine could void and supersede; the screen offered neither. Each live document chip now carries ✕ void (reason required, gate closes again) and ⟳ replace (old version superseded and kept).
2. **Merge a duplicate client** — `askMerge` existed with nothing calling it, so the cure for the disease the dedupe detects was unreachable. Each client card now shows *"looks like a duplicate of X (100)"* with a merge control — **and a real duplicate is seeded** so the path is visible rather than theoretical.
3. **Client waiting on the Speed board** — measurable but never startable. A running shipment now has *we are waiting on the client* / *the client responded — resume*, and *POD signed — stop the clock*.
4. **Edit a message** — permitted by the engine, impossible on screen. Your own messages now carry an edit control; the original stays readable.
5. **Duplicate cost detection** — `duplicateOf` was computed and thrown away. Booking the same code, supplier and amount on one trip is now refused: *void that one or change this amount*.
6. **Credit limit and release** — `checkCredit` and `releaseOverLimit` had no surface. A client over its limit now shows the overage and *cargo is held until this is settled or overridden*, with a manager-only release that demands a reason.
The fifteen remaining are read-only helpers or the bus API used by other files (`slEmit`, `historyOf`, `roleStatement`), which is correct.

**A second defect fell out of the fix:** seeding the duplicate client collided with a **hard-coded id sequence** (`CLSEQ=3`), so the next quick-created client silently reused an existing id. The sequence is now derived from the data. Hard-coded counters against seeded records are now a thing to check for.

## 📌 NOTICE BOARD — aimed, and quiet when empty (on the user's three corrections)
- **Someone who cannot write here is told nothing about it** — no control, and no line explaining the restriction either. They simply read the board. The rule stays enforced in the engine.
- **A notice can be aimed** at everyone, or any mix of **roles · hubs · countries · named people** — the Guangzhou closure reaches the Guangzhou warehouse and not the Damascus finance clerk. The composer says **how many of the team will see it** and names the audience; an empty selection means *everyone*, never nobody; and each posted notice shows who it was aimed at.
- **An empty board does not apologise.** Instead of *"nothing from management"* it carries a line worth reading, chosen **once per day rather than per repaint** so it never flickers.

## 🧪 FULL SWEEP OF ALL 29 MODULES (19 Aug)
Every file was run through the whole battery — **ES5 parse · renders · Arabic/RTL · strict legacy engine · green flag · flow check** — and all 29 pass with **0 fail, 0 warn**. Then the orphan detector (fixed first: it had been scanning only `<script>` blocks, so every `setLang` wired in markup looked dead — a false report is worse than none) was run across all of them.

**70 orphaned functions found, classified rather than counted:**
- **Leftovers where a guarded version is already wired** — `rmLane`, `rmAgreed`, `rmSvc` (Pricing), `rmLine` (B9). The safe `askRm…` twins are the ones on screen; the bare ones are pre-guard remains. Harmless, worth deleting one day.
- **Shared API used by other files** — `slBusPatch`, `slBusPush`, `slEmit`, `slEvOf`. Correct by design.
- **Helpers and dead duplicates** — `fmt`, `slLockup`, `_shipChipOld`, and **twelve driver functions still sitting in B8** (`openStop`, `applySig`, `markDelivered`, `confirmUnavail`…) that moved to the standalone Driver App, where they are wired. Dead weight, not a hole.
- **Genuine holes, now fixed:**
  1. **B3 Create Trip — a border route could not be built.** `addBorder`, `moveBorder` and `validateBorders` all existed and nothing called them: crossings could only be deleted, never added or reordered, and the validator never spoke. Now there is an *add a crossing* picker, ↑↓ reordering, and the validator's warnings print in place (*"Missing exit from Jordan before entering Syria"*).
  2. **B3 — deletion was a one-click `splice` with no confirm**, in breach of our own UX safety standard. It now asks, and says the route will be re-checked without it.
  3. **C7 Network — an office could be linked to a stop and never unlinked.** `askUnlinkOffice` was written, guarded, and unreachable. Now on the card.

**A note on method:** the value of this pass was not the count. It was separating *a capability nobody can reach* from *a leftover that merely looks alive* — and fixing the tool that was lying about both before trusting its output.

## 🚫 NEVER DRAW THE LOGO — a standing rule (19 Aug)
The invoice shipped with a **logo I drew myself in SVG**. It was not the brand mark. The user caught it: *always use the correct logo, no guessing.*
- The document now embeds **`wordmarktagline.png` byte-for-byte** as base64 — verified in the test against the file on disk, so it cannot drift. Sized in **millimetres (46mm)** because it is going on paper, not a screen.
- **The rule:** brand assets are copied from `/mnt/project/`, never redrawn, never approximated. The available lockups are `wordmarkprimary` · `wordmarktagline` · `mark512` · `markduo` · `sloganen` · `sloganar` and the mono/white variants.

**The same fault, found wider.** Checking the slogan against the brand guide showed I had been writing it from memory for weeks: the brand says **`world · to · door`** with middle dots, and the build had *"world to door"*, *"World to Door"* and *"World to door"* — **21 wrong instances across nine files**, plus **4 more hidden inside the base64-embedded modules** in the customer app, which no plain text search would ever have found.
All 25 corrected. **`slogan.js` now checks every file — including inside embedded payloads — and is part of the standing battery.** The memory entry saying the slogan must be copied verbatim from the brand guide was right; I had not been obeying it.

## 📏 CODING RULES — adopted, with one exception (19 Aug)
The user proposed a reuse-first rule set. Adopted, with the substance separated from the parts that fight this architecture.

**Adopted in full:** check for existing code before writing; extend what is close; explain when new code is genuinely necessary; small focused units; keep changes minimal and consistent. This would have caught five faults already shipped in this session alone — `recordPicker` written twice (the second landing before `<!DOCTYPE`, so the stale one kept running), `slDateStr` recreated when 21 files already had it, `setCredit` duplicating `grantCredit`, the `rmLane`/`askRmLane` pairs, and twelve dead driver functions left in B8.

**One rule declined, with a substitute.** *"Do not copy-paste between files; extract shared logic to shared locations"* cannot apply literally here: this is **29 standalone files with no build step and no module system**, each of which must open alone on an old engine. Measured, **190 functions are defined in more than one file and 174 are byte-identical** — that is the architecture, not sloppiness. But the current state was not innocent either: fixing `slDateStr` meant remembering 21 files.
**Substitute:** `shellcheck.js` gives the shared shell **one canonical source** (`shell.src.json`) and reports every file whose copy has drifted, ignoring Babel reformatting and labelling renamed-parameter differences as cosmetic. First run: **51 drifted helpers across 15 files** — `askConfirm` alone exists in two incompatible generations (`reason:false` versus `word:null`). Duplication stays; silent divergence does not.

**`dupe.js`** enforces the rule that does apply: **a function defined twice inside one file is always a bug**, because the later definition silently wins. It ignores cross-file duplication and whitelists transpiler helpers. It lied on first run — counting Babel's scoped inner helpers — and was scoped to top-level declarations before being trusted.
**What it found and what was fixed:**
- **Cards carried two `toggleKey`** — the old single-supplier version and the per-supplier one. Plus a whole dead single-supplier API block and three shadowed margin helpers. Removed.
- **B1 and B2 each carried two `setLang`**, and the stale one wrote the breadcrumb in English instead of through `t()`. The stale copy removed in both.
- Identical duplicate copies of `slDateStr`, `slMark`, `slLockup`, `t` and `radio` removed across four files.
**All 29 files now report zero duplicate definitions**, with the full battery still green.

**Three rules added that the original set does not have, because they come from faults this project actually had:**
1. **Brand assets are copied, never drawn; brand strings are copied, never remembered.** (`slogan.js`)
2. **Derived values are never hard-coded.** `CLSEQ=3` collided with the first seeded record added after it.
3. **A capability with no way in is not a feature.** (`orphan.js`)

**On the required response format:** the reuse analysis will be written where it carries weight — a new module, or a function that touches an existing family — and skipped on small corrections, unless the user asks for it every time.

## 📐 CONTROL GEOMETRY AND ALIGNMENT (19 Aug) — one cause, 142 symptoms
The user saw a dropdown in the Cards module whose arrow was jammed on the edge and looked like it was escaping the box, and asked where the gap was and whether it repeated. It did, everywhere.

**The cause:** our controls were styled with **padding but no height**. A control with no stated height takes the browser's default, and that default differs per control type — so a `select` sits proud of the `input` beside it, and the **native arrow has no reserved room**, which is exactly the crowding that was noticed. `controls.js` (shipped) counts it: **142 controls across 17 files.**
**The fix is one rule per file, not 142 edits:** `select` gets `height:var(--ctl-h)`, `appearance:none`, **an arrow we draw ourselves** as an inline SVG background, and **32px of end padding reserved for it** — mirrored under RTL so the arrow moves to the left edge with the text. Inputs and textareas get the same height and size tokens. Applied to 30 files; the count is now **0** everywhere except the React reference build, which is left alone.

**The invoice meta strip — two faults, one visible.** The user reported that Terms sat a line above Issue date and Due date. **Cause one:** the cells were centred vertically, so the Terms value — longer, and wrapping to two lines — made its cell taller and lifted its own first line above its neighbours'. **Cause two, which nobody had reported:** the status cell had **no label at all**, so its single child landed on the *label* row, a whole row high.
**The fix is structural, not a nudge.** Every cell is now the same two-row grid — a fixed **14px label row and 18px value row**, anchored with `align-content:start` — so the two lines share a baseline whatever the content length or script height. Values cannot wrap. The status cell was given the label it was missing. **Right-to-left is now stated explicitly** on the strips rather than left to inheritance, the first cell hugs the right edge in Arabic, and the stamp ends at the left. The route strip got the same treatment. Swept for the pattern across every file: **the one other match is a single centred element inside a card, not a row of cells** — the fault was confined to this document.

**The invoice alignment, same disease.** The due-date cell, the terms cell and the *Unpaid* stamp did not line up because the strip was a flex row of **individually hand-padded cells with a one-off inline override on the last one**, and because **Arabic labels are taller than Latin ones**, so switching language pushed the values out of line. Rebuilt as a grid: equal columns, one padding rule, **a fixed 14px label line and a 46px floor height** so no glyph can shift a value, and dividers that move with the direction under RTL. The route strip and the parties row had the same construction and were rebuilt the same way.

**The Arabic invoice now carries the Arabic logo.** The brand ships `wordmarkarprimary.png` but **no Arabic tagline lockup**, so rather than draw one the Arabic slogan asset `sloganar.png` is stacked beneath the Arabic wordmark to the same 46mm block. All three images are verified **byte-for-byte against the files on disk** in the test, and CSS shows one lockup per language.

## 🧭 A PROTOTYPE SWITCHER IS NOT NAVIGATION (19 Aug)
The user pressed further: *I found it — but on the dashboard, as a real user, I should find the page and then have the option to view prices and go to the supplier API. And add a supplier too.* Correct on all three counts.
- **The dark strip at the top is a state switcher for a prototype**, not a way through the product. Making it legible fixed the symptom; it did not give the page a route. The Cards module now carries a **real in-page tab row** — Catalogue · Price review · Suppliers — styled as tabs, with an accent underline on the active one and **a count on each so the page says how much is behind it**. Same destinations, reachable the way a person expects.
- **Adding a supplier did not exist at all.** The registry could be read, toggled and tested, but never added to — a shop with no door. There is now a form on the supplier screen: name, **https endpoint** and key, all three required, an http endpoint refused, and **a duplicate name refused**. A new supplier arrives **switched off and untested**, and the interface says why: *nothing can be issued through it until you test and activate it*.

**`dupe.js` earned itself back within the hour.** My new supplier form declared `ns` and `setNs` — **names already in use by the store form in the same file**. The later definition would have silently shadowed the working one and broken adding a store. The checker caught it before it shipped; mine were renamed `nsup` / `setNsup`, and a test now asserts the store form still works.

## 🔢 BILLING AND CLAIMS PAGED — and a survey that saved three modules' work (19 Aug)
Continuing down the list, **the survey came first and paid for itself**: C8 Agents already paged properly, and C7 Network pages its cities screen. Only **two modules actually needed work**, not the four I had listed.
- **Claims was the worst thing left in the project: 163,328 characters at 154 claims**, every card drawn. Now paged — **42,147**, twenty cards a page, pager above and below.
- **Billing** moved from a cap-with-*show-all* to real paging, because an invoice is a record someone may need to reach, not an alert whose tail is noise.
**A detail worth stating: the pager counts the FILTERED list, not the raw array.** With 154 claims and one excluded by the active filter it reads *1–20 of 153* — my test asserted 154 and failed correctly. The number on screen must match what the reader is actually looking at.
**And the growth contract failed on a real behaviour change**, exactly as it should: it still expected billing's old cap of 12 rows and found 20. The assertions were updated to guard the new behaviour rather than the old — **a stale test that passes is worse than one that fails.**
`test_paging.js` — **45 checks**. All 19 suites green, flow 0/0, audits clean.

## 🚫 THE SIGN-IN REFUSED EVERY NUMBER (19 Aug)
The user opened the driver app and got *"that number is not on any driver record"* — then asked for a test number. **There was no test number to give: the app was unusable.**
It read `SL_DRIVERS_V1`, **a channel that only exists once C2 has been opened in the same browser.** Alone — which is how anybody opens a file — it saw zero drivers, so every number was correctly compared against an empty list and correctly refused. The sign-in logic was right and the app was broken.
**Fixed the way every other module handles its channels:** it falls back to what C2 last published, and the office list wins whenever it is present. The file now works alone, and improves when the rest of the system is running.
**And the numbers are offered on the screen**, tappable, marked *"Prototype — tap a number to try it"* — because a prototype nobody can get into is not a prototype, and the answer should be on the screen rather than in a message from me.
**One contradiction caught by my own contract:** I first listed the numbers **with the drivers' names beside them** — the exact thing the OTP sign-in had just replaced. The assertion *"names nobody before they have identified themselves"* failed, and it was right to. The numbers now carry their document state instead: `1 EXPIRED`, `✓`, or `suspended`.
`test_driverapp.js` — **52 checks**, six of them on the standalone case, so this cannot regress silently.

## 📲 A LIST OF NAMES IS NOT A SIGN-IN (19 Aug)
The user was right: the driver app opened on a list of drivers and let you tap one. Anyone who opened the file could be anyone, and **it named every driver before anybody had identified themselves.**
**He signs in on the phone the office gave him.** The number was not on any record, so it was added to C2 and published — **the number is the identity here.** Enter it, receive a six-digit code, verify.
**What is actually enforced**, not just drawn:
- **A number on no driver record is refused** — you cannot sign in as a driver who does not exist.
- **An inactive driver is sent to the office** rather than let in.
- **A wrong code is refused; three wrong guesses end the attempt** and discard the code rather than leaving it waiting.
- **A code expires after two minutes** and is then refused even when correct.
- **The number is matched on its last nine digits**, so `+963 944 210 118`, `0944 210 118` and `00963944210118` all reach the same driver — because a driver at a border post types what he remembers, not what a form prefers.
**Said plainly on the screen itself:** there is no SMS gateway in a prototype, so **the code is shown where a real build would send it**, labelled *"Prototype — no SMS gateway, so the code is shown here."* A fake "we've texted you" would be a lie in the interface, and the contract asserts that the disclosure is present.
**And a real fault found by testing it:** `verifyCode()` signed him in and **did not redraw** — he would press *Verify*, be authenticated, and watch nothing happen. Fixed.
`test_driverapp.js` — **44 checks**, thirteen of them on the sign-in alone.

## 🚛 THE DRIVER'S OWN APP (19 Aug)
`ShopyLink_Driver_Trip.html`, in the phone frame — 390 × 783, clipping, 48px status bar, **46px tap targets because a driver taps with a glove on.**
**Three things the office knew and he never did**, each read from a channel another module already publishes — this app computes nothing of its own:
- **His papers.** Every document with its expiry and state, straight from C2. An expired one is raised at the top and says what it costs him: *"you cannot be assigned a trip until this is renewed."* He learns it before the dispatcher does, not at a border post.
- **His float.** Given, spent, and **what is left leading the screen** — because that is the number he needs at a window with a queue behind him. *"Every fee you pay at a crossing comes off this. Keep the receipts."*
- **His trip and the note that rides with it.** Truck, route, every crossing in order, and the consignment note number — openable.
**The float is derived, not stored twice.** B5 already knew which crossings a driver paid; the office records only the hand-out, and **spent is computed from those crossings**. So the office and the driver read the same figure by construction, and there is no second number to disagree.
**A mistake caught by an old contract, and worth recording.** I built this over `ShopyLink_Driver_App.html` — **and that file was already a working last-mile app**: four stops, the prepaid banner, no cash-collect controls. `test_b8_split.js` failed and that failure was correct: **I had deleted working software.** Restored from the package copy; mine renamed to `Driver_Trip`. They are different jobs — the long haul and the last mile — and both now exist. **Third duplicate-or-delete of the day from the same cause: not asking what the file already did.**
`test_driverapp.js` — **31 checks**, including that another driver's trip does not show as his, and that the trip number stays Latin under Arabic.
49 contracts, zero red. `SL_FLOAT_V1` is a tenth channel and is now documented in the README and the shell prompt.

## 💳 AN APPROVED CLAIM REACHES THE INVOICE (19 Aug)
The last hole where money left without anybody being billed or credited for it. Claims **already issued a credit note** on approval — `CN-0447`, the assessed amount, properly attributed — and **told nobody.** The client was then invoiced in full for cargo we had already compensated them for.
**Approving now announces it**, and billing applies it as a **negative line carrying the claim number**, so anyone reading the invoice can trace *why* the bill is lower. Applied **once**, never twice.
**Two edges worth the checking:**
- **1200 less a 240 credit is 960** — the totals already handled a negative line correctly.
- **A credit larger than the bill leaves a negative total, and such an invoice cannot be issued.** That is right: it is **a refund to arrange, not a bill to send**, and `canIssue` refuses it without anybody having to add a rule.
**Two duplicates came in with the bus I lifted** — a second `setActor` that **did not redraw**, and a second `actorName` reading a differently-named registry function. Both won by hoisting. The first meant switching person changed nothing on screen. Removed; `dupe.js` found them within a minute of the change.
`test_credits.js` — **16 checks**. 52 contracts, zero red, flow 0/0, no duplicates.

## ✅ THE SEVEN ITEMS, RE-CHECKED ONE BY ONE (19 Aug)
The user asked whether the list was actually finished. Re-testing it rather than trusting my own summary **found one item I had reported as closed and had not closed.**
- **1 · C12** — closed, and verified beyond the level: `askApprove()` itself refuses a level-1 agent on a level-3 request, not merely `canDecide()`.
- **2 · Claims** — closed. A support agent cannot move the compensation cap; it held at 120.
- **3 · D1 cancel** — closed. Nobody cannot cancel, and neither can a non-manager.
- **3 · D1 reassign — STILL OPEN, and it was the worst of them.** `reassign()` had no guard at all: **with nobody signed in, a job moved from one person to another and returned `true`** — and the log recorded *"reassigned Rana → Mona"* **with no actor at all.** Work changing hands, and nobody answerable for why. Now it needs a signed-in person, the owner may hand on their own work, anyone else needs `b7_reassign` or a manager's authority, **and the log names who did it.**
- **4–6 · Addresses, SmartRegistration, GiftCards** — confirmed by inspection, not assumption: **their only controls are `pgGo` and `pgSet`.** Nothing to destroy, spend or approve, and the contract now asserts that so a future action cannot be added unnoticed.
- **7 · Dashboard** — unchanged: 4.6MB of compiled React, reading no channel. Still a rewrite, still the user's decision.
**A correction to something I said earlier:** I described SmartRegistration as *"creating clients nobody learns about."* Checked, that was wrong — **it has no submit path at all.** It is a screen gallery, like the individual app. Wiring it is a build, not a connection.
**And an older contract failed correctly:** `test_engine` reassigned an L3 item with nobody signed in. It now signs in a manager first, which is who moves an escalated item.
`test_guards.js` — **97 checks**. 51 contracts, zero red, flow 0/0, no duplicates.

## 🧯 CLAIMS AND D1 — THE LAST TWO GAPS (19 Aug)
**Claims, guarded on two different grants.** Setting the compensation cap decides what **every future claim is worth** — a pricing decision (`pr_base`), not something the person handling a crushed carton does. Deciding a claim **pays a client**, so it belongs to whoever owns returns (`b8_ret`). A support agent could do both before this.
**D1 had the same pinned-actor fault as C12, and worse consequences.** `ME=PEOPLE[0]` meant every reassignment and cancellation was attributed to **whoever happened to be first in the array** — and the manager-only check on cancelling a job passed or failed by accident of ordering. Now nobody is signed in until somebody is, an unknown id is nobody, **signing out actually signs out**, and **nobody cannot cancel a client's job**: an unattributed cancellation would erase work with no one answerable for it.
**A crash the sign-out fix exposed:** `roleById()` returned `null` for a person with no role, and every caller assumed an object — so the screen **broke the instant anybody signed out.** *Nobody signed in is a real state, not an error*: it now returns a role that says **"Sign in to see what you are responsible for."**
**Two older contracts failed, and both were right to.** `test_paging` seeded tasks owned by `ME.id`, and `test_last3` read a notice board — both silently assuming somebody was logged in, because somebody always was. They now sign in first, which is what a person does.
`test_guards.js` — **88 checks**. 51 contracts, zero red, flow 0/0, no duplicates.
**Every module that can destroy, spend or approve is now guarded.** What remains is not permission work: the isolated React dashboard, and SmartRegistration creating clients nobody learns about.

## ⚖️ THE MODULE THAT CHECKS EVERYTHING ELSE WAS UNCHECKED (19 Aug)
C12 Approvals decides whether an exception may go ahead — it exists to be the check on every other module. **It was the one with no guard.**
**Three faults, each worse than the last.**
**The level was published as `null`.** C9 sent `level:u.level||null` and nobody had ever set that field, so every consumer had to guess. **My own guess was `role==='admin'?3:2`** — which handed a warehouse clerk **level 2** and let him decide most approvals. Now C9 **derives the level from the grants held**: `FN_TIER` already records which tier each permission belongs to, so a person's level is the highest tier among their own permissions and **cannot drift away from them.** Read from `effectivePerms()` — the same source the publisher uses for the permissions beside it. Levels across the staff now come out 1, 2 and 3, all genuinely in use.
**Changing what an approval requires was unguarded.** `askSetLevel()` let anyone raise or lower the bar for every future request. That is **setting the rules, not applying them** — level 3 only.
**And signing out did not sign out.** `setActor(null)` matched nobody and **left `ME` exactly as it was**, so an admin stayed authenticated at level 3 after switching away. An unknown id did the same. Both now resolve to nobody, at level 1, holding no id.
`test_approvals.js` — **21 checks**, including that with nobody signed in **nothing above level 1 can be decided at all**.
51 contracts, zero red, flow 0/0, no duplicates.
**Still open:** Claims (`askSetCap` is an unguarded financial decision) · D1 (`askReassign`, `askCancel`) · the isolated React dashboard · SmartRegistration creating clients nobody learns about.

## ⛽ TWO KINDS OF MONEY, NOT ONE (19 Aug)
The user separated what I had merged: **a driver's trip costs are not border fees.** He buys diesel, replaces a tyre, pays for a repair on the road — and those are nothing like a transit fee at a post.
**They had been sharing one free-text field**, and two things followed from that, both wrong:
- **A diesel receipt could be apportioned across the cargo and recovered on a client's invoice.** Fuel is the company's own operating cost; a border fee is the shipment's.
- **A customs officer was signing off a garage repair 600km away** from a place he has never seen.
**Now the kind is chosen first**, because it decides everything after it: fuel · repair · tyre · road toll · food and rest · **border fee** · something else. Choosing one says which ledger it falls on, in words — *"ours, never billed to a client"* or *"apportioned across the cargo and recovered on the client invoice."* And the cost **names itself from the kind**, so a driver at a pump is not typing a description.
**Approval is routed by kind, not by one grant:** border fees to **customs**, who know what a post charges; fuel, tyres and repairs to **whoever owns the fleet** (`st_manage`). Neither can sign the other's, asserted both ways.
**And the two ledgers can be read apart:** `claimsBorder()` is what may be charged on to a client; `claimsTrip()` is what the company carries. **The driver's float is reduced by both**, because his pocket does not care which ledger a receipt belongs to.
`test_spend.js` — **39 checks**. 50 contracts, zero red, no duplicates, flow 0/0.

## 🧾 THE DRIVER PAYS, RECORDS AND PHOTOGRAPHS IT (19 Aug)
The user's correction went further than the float: **the driver pays the fees, writes them down in his own app, and uploads the photographs.** What existed was an office screen declaring a fee paid from nothing — **asking somebody who was not at the window to attest to money they never handed over.**
**In his app now:** what it was for, how much, a note if it is worth one, and **a photograph of the receipt — no photo, no filing.** *"Photograph the receipt. The office checks it against this before it is approved."*
**Filed is not approved.** His figure, our decision. A filed claim **does not count against his float**; only an approved one does. Customs checks it against the image and approves or refuses — **and a refusal must carry its reason, because he paid it out of his own hand and is owed an explanation.**
**One fault this exposed:** the money screen returned early when no float had been issued — **hiding the recording screen from exactly the driver who needs it most**, the one paying out of his own pocket with nothing advanced to him.
**The float now counts both** the crossings settled in the office and the claims he filed and we approved, so there is one balance and it is derived rather than kept.
`test_spend.js` — **25 checks** across the two files. 50 contracts, zero red. `SL_DRIVER_SPEND_V1` is an eleventh channel, documented.

## 💸 THE FLOAT IS ISSUED WHERE THE TRIP STARTS (19 Aug)
The user corrected the model: **a customs officer does not hand a driver cash.** He decides what a crossing costs — nothing more. **The float is issued at the departure point**, and I had put it on a border screen.
**The reasoning holds up, and it is not a technicality:** issuing a float from a crossing screen means paying a man who is already 400km down the road. **B4 Loading is the departing hub** — it knows the trip, the truck and the driver, and it is **the last place anybody sees him before the road.** So `issueFloat()` lives there, behind `t_depart`, and records **who handed the money over.**
**B5 keeps the spend side**, which is right: that is where the money actually leaves. `floatSpent()` is still **derived from the crossings the driver paid**, so the departing hub, the border and the driver's own app read one figure by construction — 500 given, 120 spent at a post, 380 left, and all three agree without any of them being told.
**A bug found while moving it:** `refuse()` answers `false` for the UI helpers, but `issueFloat()`'s callers read `.ok` — so a refusal came back as **neither yes nor no**, and `.ok===false` never matched. A function must refuse **in the shape its callers read.**
`test_guards.js` — **76 checks**. 49 contracts, zero red, flow 0/0, no duplicates.

## 🛡 THE GUARD REACHES THE CHAIN AND THE MONEY (19 Aug)
Ten modules were still unguarded, and the two most consequential were the operational chain and the one module that moves money out of the company.
**Border fees, guarded on two different grants — because they are two different jobs.** A customs officer **settles** what was paid at the post, issues a driver's float and raises an unplanned expense (`t_customs`). An accountant **charges it on** to a client (`b9_build`). **Neither can do the other's half**, so nobody both pays a fee and bills for it. Unguarded, anyone reaching the function could have declared a payment made or pushed a recovery onto an invoice.
**The chain, each step by the grant that names its work** rather than one blanket permission: receiving is `b1_ind`/`b1_biz` — **and B1 picks between them by account type, because some clerks handle only walk-ins** — consolidation `b2_con`, trip creation `t_create`, loading `t_depart`, border clearance `t_customs`, arrival `b6_conf`, delivery `b8_mon`. A clerk who may receive a parcel has no business declaring a truck departed.
**A silent failure worth recording.** My guard called `slStaffRead()` — and these seven files define it as **`slStaffRead2`**, a name that came from an earlier merge. `typeof slStaffRead==='function'` was simply false, so the guard fell through its own "no registry" branch and **returned true for everyone**. It looked installed, parsed clean, and permitted everything. The contract caught it because it asserts a **refusal**, not merely that the function exists — *a guard that only ever says yes passes any test that never checks for no.*
`test_guards.js` — **71 checks**. 49 contracts, zero red, flow 0/0 on all eight touched modules.
**Still open:** Claims and D1 unguarded · the React dashboard isolated (a rewrite, awaiting a decision) · five island modules, of which SmartRegistration creates clients nobody learns about.

## 🔒 THE GUARD, WHERE THE DAMAGE IS DONE (19 Aug)
Seventeen of twenty modules had no permission check at all. Someone holding a single grant — a support agent with `b8_mon` and nothing else — could **archive a hub, retire a truck, delete an agent's contact or switch a zone off.** The shell hid the menu entry; the function underneath answered to anyone who reached it.
**28 destructive actions now refuse at the act**, across seven registers: archive, status change, and every `askRm*` — hubs, trucks, drivers, agents and zones behind **`st_manage`**, permissions themselves behind **`st_roles`**, card offers behind **`pr_cards`**. The refusal **names the missing grant**, so the person knows what to ask for rather than meeting a dead button.
**Deliberately not locked down:** with the registry unreachable, or nobody signed in, the module behaves exactly as it always did. A prototype file that refuses everything when opened alone is not secure, it is broken — and the shell is where a person is identified.
**A failing assertion that was right, again.** I expected the admin's archive to complete on pressing OK; it did not, because **archiving a hub requires typing its name** (F12) — a protection that predates this session and that my test had simply not honoured. The code was correct; the expectation was lazy. The contract now types the name, the way a person does.
`test_guards.js` — **37 checks**: the guard present in all seven, refusing the clerk, allowing the admin, refusing **even when the function is called directly and the confirmation typed**, and the audit still naming the real actor.
48 contracts, zero red, flow 0/0 on all seven, `roles.js` clean.

## 🖋 THE AUDIT TRAIL WAS NAMING THE WRONG PERSON (19 Aug)
An audit before the next phase found something worse than a missing guard. I archived a hub with **nobody signed in**, and the audit line read **"Omar Al-Masri — suspended Mersin Hub."** Ten modules were writing a fixed name into the log at the moment of the act.
**A wrong name is worse than no name**, because it is read and believed: it credits work to someone who was not there, and blames them for what they did not do. Rule F17 existed for exactly this and had been applied to three modules only.
**Fixed in all ten**, and the distinction matters: the seeded rows in `var AUDIT=[…]` **keep their names** — they are yesterday's history, not a claim about now. Only the **write path** was changed, to `actorName()`, which resolves from the staff registry and returns *"unattributed — no signed-in user"* when nobody is.
**C12 Approvals was the worst of them**, in a way a grep would not show: `ME` was **pinned in the source** to one person, so every approval it recorded carried her name whoever pressed the button — and it offered a **hand-copied list of three people** while the registry holds 24. Now one switcher over the registry, 17 selectable, starting at nobody.
**And I broke that file while fixing it.** Cutting an inherited duplicate took one line too many; ES5 stopped parsing and I restored from the package copy rather than trying to repair a file I had damaged blind. Reapplied without touching the inherited duplicates — **they are identical copies and harmless, and a fix that breaks a working file is not a fix.**
`test_attribution.js` — **36 checks** across the ten modules: no fixed name in any write path, *unattributed* when nobody is signed in, the right name once somebody is, an unknown id still unattributed, and the seed history left alone.
47 contracts, zero red, flow 0/0 on all eight.

## ❌ I SAID FIVE MODULES WERE MISSING. THEY WERE MERGED (19 Aug)
Asked where B1–B4 and C3–C7 were, I answered from the filenames: **"C3, C4, C5, C6 and C11 do not exist — they were never built."** That was wrong, and it went into `CODE_MAP.md` and out to the developer.
**This project's own index had recorded the truth on 19 Aug**, under the C-series build order: each was **folded into the module that already owned its subject.** Checked, all five:
- **C3 driver visas** → inside **C2**, one visa per country with number and expiry — and it is exactly what now blocks a driver from a route.
- **C4 airports · C5 ports · C6 cities** → inside **C7 Network**, as its stops and cities layers.
- **C11 rate cards** → **Pricing**.
**The reasoning is sound and worth keeping:** a visa register separate from the driver who holds it, or an airport list separate from the network it belongs to, is **two records of one fact — and the second one goes stale.**
**How the error happened:** I read absent files as absent function. One `grep` of the index would have caught it, and I ran none. The map now says *merged, not missing*, tells the reader **not to rebuild them**, and the contract **verifies each merge in the code** rather than asserting a gap — so this particular mistake cannot be made again silently.
**On `Action_B5_BorderFees`, the decision is not to rename.** The filename is referenced by the shell's module map, the flow checks and the documents; renaming buys tidiness and risks a broken link in each. Disclosure in the map is the fix.
`test_codemap.js` — **65 checks**, five of them proving the merges are real.

## 🗣 THE CHAIN NOW SPEAKS (19 Aug)
An audit before handover found the largest gap in the system: **B1 announced its work and B2–B8 said nothing.** Cargo was consolidated, loaded, driven, received, assigned and delivered — and outside those six screens, none of it had happened. The shell's work queue could only ever show *shipments expected*, because that was the only thing anybody published.
**Now every link declares itself:** `parcel.consolidated` · `trip.created` · `trip.loaded` · `shipment.arrived` · `run.assigned` · `shipment.delivered` — each at the moment the work completes, **once**, guarded so a screen revisited does not claim the work again, and each carrying enough to be useful downstream (the driver, the truck, the weight aboard).
**And the picture is now derived, not kept.** D1 replays the log and places each shipment at **the furthest point it reached**. There is no counter to fall out of step and no screen that believes something the log contradicts — and with an empty log it says **"nothing has moved yet"** rather than showing a plausible number.
**A duplicate caught mid-task, the second of the day.** My first pass found six silent modules by grepping for the literal `slEmit('` — but **four of them already declared through their own `declare*()` functions**, one call level down. I had written a second announcer into each before checking. Removed; theirs kept. **Same root cause as the B5 engine: I did not ask what existed.** Both times `dupe.js` would have told me in one second.
**One module deliberately left alone:** the React dashboard is 4.6MB of compiled bundle. Deriving its numbers from the log is right, but not with text tools on a build artefact — that is a rewrite, not an edit, and it belongs in a decision rather than a patch.
`test_chain.js` — **28 checks**. 46 contracts, zero red, flow 0/0 on all seven touched modules.

## 🔁 I BUILT B5's ENGINE TWICE (19 Aug)
Packaging the handover exposed it: `dupe.js` reported **six functions defined twice** in the border-fees module, `crossTotal` among them **three times**. The cause was mine — **the finance engine already existed**, built in an earlier session, and I wrote a second copy without checking (G1: reuse before writing; G2: no duplicates).
**The original was better than my replacement.** It reports the **percentage** alongside each share, and where no declared values exist it **refuses to apportion** rather than falling back to an even split — *"an invented share is an argument with a client three weeks later."* My version guessed. The duplicate was removed and my contract rewritten onto the engine that was already there.
**Two older duplicates surfaced with it**, predating this session:
- Two `crossTotal` definitions **disagreeing on substance** — the earlier counted every extra, the later only **approved** ones. The later wins by hoisting and is the correct rule, so the earlier was dead code that read as if it were live.
- Two `actorName` pairs, the earlier **pasted from B1** and still returning *"B1 · unattributed"* — the wrong module's name in a border-fee audit trail.
**And a real fault the duplication had hidden:** billing was listening for an event called `border.fee`, a name **I had invented** while writing the second engine. B5 publishes `borderfee.apportioned`. So every apportioned fee was **published and heard by nobody** — the money went out and never came back on an invoice. The owner names the event; the consumer follows.
**The lesson, plainly:** I asked *"what exists?"* at the start of most tasks this session and skipped it for this one. A duplicate is not just untidy — it hid a broken channel for hours, and `dupe.js` had been reporting it the whole time.
**45 contracts, zero red**, verified from inside the unzipped archive.

## 📱 THE BUSINESS APP, REBUILT IN THE PHONE FRAME (19 Aug)
The user tested the universal prompt on it, which was the right thing to test it against. **The engine was kept whole** — 7kb of quotation logic, untouched — and only the shell was rebuilt: `.stage / .framewrap / .phone`, a fixed **390 × 783** glass that clips, a 48px status bar, the app writing into the one scrolling area.
**What the fixed width immediately exposed**, and a 520px column had hidden:
- **A long service name pushed its price off the screen.** *"Sea freight — 40ft container"* fits at 520 and does not at 390. Fixed with `overflow-wrap:anywhere` on the name cell, so it breaks inside its own column rather than shoving the figure out of the glass.
- **The buttons had to become two-across**, `flex:1;min-width:44%`, instead of sitting in a row that assumed room it did not have.
- **Nothing inside the glass may state a pixel width** — asserted in the suite, so the rule cannot quietly erode.
**The behaviour contract never moved**: all 20 assertions passed before and after, because the shell changed and the engine did not. Seven more were added for the frame itself.
`test_bizapp.js` — **27 checks**. All 31 suites green, controls clean, slogan verified.

## 🏢 TWO APPS, TWO AUDIENCES (19 Aug)
The user corrected the audience, and the correction was structural: **the individual app is for individuals**, who buy from a **pre-approved price list — fixed, not negotiable, nothing to approve.** I had wired a quotation-approval engine into it.
**The evidence I should have read:** `newQuote()` has refused individuals since the day it was written — *"quotations are for business accounts."* The engine knew; I connected it to the wrong app anyway. Removed, and the consumer app is back to exactly what it was.
**`ShopyLink_BusinessApp.html`** built instead, on the individual app's own tokens and shell so the two are siblings rather than strangers. It does the one thing a business client needs and an individual never does: **read the quotation whole — route, cargo, every priced line, validity — then accept it or say what is wrong with it.**
- **Discussing is not declining.** An objection opens a thread on the quotation and carries its text to the office — *"the sea rate is above the market this month"* — so the requote is informed rather than a guess.
- **An acceptance is final**: accepted once, and not reopened by a later message. A price agreed is a commitment on both sides.
- **An expired price cannot be accepted**, so nobody accepts a figure the office would have to dishonour.
**Rule F27: an audience decides what an app contains.** Putting an approval in front of someone with no decision to make is not a feature.
`test_bizapp.js` — **20 checks** across three files, replacing `test_clientquote.js`. All 30 suites green, contrast AA, controls clean, slogan verified.

**Parked here at the user's direction.** What exists is the engine and one working screen: quotations arrive from billing, are read whole, and are accepted or opened for discussion, with every path asserted in `test_bizapp.js`. What a business app will want beyond this — shipments in flight, statements, users under one account, standing rates — is not started.


## 💵 BORDER FEES AS MONEY, NOT AS A NOTE (19 Aug)
B5 recorded what was paid at a crossing — transit fee, scanner, stamp, agent handling: **120 USD** — and answered none of the four questions finance actually asks.
**Who paid, out of which pocket.** Driver advance, agent account, or office transfer. A **driver's float is a real balance**: 500 given, 120 spent, 380 left, and he cannot pay a fee his advance will not cover.
**Has the money left.** Recorded is not paid. An **office transfer settles the instant it is made**; a driver paid from his own float **is owed**; an agent bills monthly, so **what he paid for us is a debt until we settle it**. `owedTo()` is the ledger.
**Who bears it — by declared value, on the user's ruling.** A 20,000 USD consignment of electronics draws more customs attention than 20,000 USD of cotton at the same weight, and **it is the value the officer assesses**. Three shipments at 20,000 / 5,000 / 1,000 split the 120 as **92.31 / 23.08 / 4.62** — and the shares add back to **exactly 120**, with the rounding remainder given to the largest rather than lost or invented. Nothing declared falls back to an even split rather than silently charging one client.
**Did it come back.** Each share is announced, billing picks it up against the right shipment, and it lands as an invoice line **at cost, naming the crossing** — because **a disbursement recovered is not a service sold**. It is recovered **once**. **Rule F26.**
`test_borderfin.js` — **24 checks**. All 29 suites green, flow 0/0.

## 🪪 DRIVER DOCUMENTS — the gate, not the list (19 Aug)
C2 already held the documents — licence, passport, police clearance and **a visa per country**, each with its expiry and a computed state — and already ranked its expiry alerts. What was missing is the thing that makes them matter: **B3 kept its own thinner driver list**, a single `exp` string, so a driver whose UAE visa lapsed last week still looked assignable. **A licence that expired yesterday stops the truck at the first post, with the cargo aboard.**
**C2 publishes, B3 refuses.** `SL_DRIVERS_V1` carries each driver's documents with their states, whether they are on leave and when they return. B3 reads it and **names the reason**: *"Visa UAE expired 2026-08-15"*, not a greyed-out row.
**The part worth the work: a visa is judged against the route.** The countries come from the borders already chosen for this trip, so the same driver is assignable for Turkey and refused for the UAE — **the question is never "are his papers complete" but "can he make this journey."** With no borders chosen, no visa is demanded at all. **Rule F25.**
**Expiring and expired are different.** A document lapsing next week is raised as a warning and the trip proceeds; one that has lapsed is a bar. Treating them the same would ground half a fleet over paperwork that is still valid.
**And with no registry the dispatcher still dispatches** — unknown is not refusal, because a dispatcher who cannot dispatch is worse than one working from yesterday's paper.
**A failing assertion that was right:** I expected a missing UAE visa and got *expired* — the driver holds one, lapsed. Same wall at the post, different reason; the test now covers both, and a genuinely missing visa besides.
`test_driverdocs.js` — **19 checks**. All 28 suites green, flow 0/0.

## 🔗 THE LOOP CLOSED — quotation to receiving (19 Aug)
The thread broke at its most important point: a confirmed quotation created an invoice and **told nobody**, so when the cargo turned up the clerk searched for a client already on file and counted cartons that had already been counted. **The same facts, typed a third time.**
**Confirming now announces the shipment** on the event bus — client, route, mode, goods, cartons, weight, volume and the agreed price. The bus was **lifted from B1 verbatim** rather than written again, so there is one implementation of it.
**Receiving starts from it.** An *Expected — agreed and not yet received* panel sits above the customer search; picking a shipment fills the client, takes the mode from the quotation, **keeps the agreed shipment id so the sticker carries it**, and opens at the items because the client is already known. Once received it leaves the queue. **Rule F23.**
**And the bench compares.** A quotation priced 40 cartons at 1,250 kg; if 38 arrive at 1,180, the review step says **Different from what was agreed** with both figures and the difference — *"the invoice follows what arrived, not what was quoted — tell the client before it is issued."* **The person at the bench is the only one who can see a short shipment**; saying nothing there means it surfaces weeks later as an argument. **Rule F24.**
**One ordering fault worth recording:** `go()` clears the form on every transition — correct for a simulator — so filling the client *before* navigating was silently undone. Fill after the reset, not before.
`test_expected.js` — **16 checks** across both modules, including that with no bus the receive screen is exactly as it always was.

## 🖨 THE STICKER AT PRINT TIME — four faults on one screen (19 Aug)
Opening the receive module to look at printing found four, and three of them only bite **on paper**, which is why they had survived.
- **One sticker was drawn for two cartons.** The grid called `renderAWB(0)` and stopped, so the second box would have travelled unlabelled. `getAllStickersHTML()` already existed for exactly this and **was never called**.
- **The barcode was drawn for carton 0 only** — with a comment claiming the rest were generated at print time. They were not. Cartons 2 onward printed **a blank strip where their code belongs**, and a box nobody can scan is a box that goes missing.
- **Two print buttons, same handler** — one beside the labels, one in the footer. One action, one control (F7); the footer keeps *Receive another*, which is a different kind of decision.
- **And no print rules at all.** `window.print()` with nothing to guide it sends the whole console to the printer — sidebar, buttons, simulator strip. Now only `#stickers-grid` is visible on paper, each label is `page-break-inside:avoid`, on A4 with an 8mm margin.
**Verified with a delay**, because the barcodes are drawn on an 80ms timer: an assertion that runs immediately sees eight decorative rects and passes for the wrong reason. **46 bars each, different values, one label per box.**
`test_sticker.js` — **14 checks**. Flow 0/0, no duplicates, contrast AA.

## 📜 THE CONSIGNMENT NOTE — A4, and it travels with the truck (19 Aug)
`ShopyLink_Doc_CMR.html`. Built **on the quotation sheet rather than beside it**: the same A4 geometry, the same print rules, **the same two lockups byte for byte**. Only the obligations changed, and those are the document.
**What a border actually asks for:** sender, consignee and **carrier** — three parties, not two — place of loading and place of delivery with **the crossings between them**, then **packages and gross weight**, which is what an officer counts. **Three signature lines**: at loading, by the driver, at delivery.
**The terms are written for this trade, not adapted from the invoice:**
- **The carrier's undertaking** — goods received in apparent good order, and *"any damage or shortage visible at loading is written on this note before it leaves."*
- **Customs** — *"the driver carries the papers; he does not settle them."* Duty and transit fees fall on the party named in the shipment file, which is the single most common argument at a Syrian crossing.
- **Delay** — detention past the free time is recorded **with its hours**, charged at cost to the account that caused it.
- **Signatures** — *"an unsigned delivery is an open shipment."*
**The trip publishes, the note draws** — `SL_CMR_V1`, the same owner-publishes pattern. Trip number, truck, driver, loading stamp and **every crossing in order**. With nothing published it stays a specimen **and the chrome says so**.
**And the upload slot stays**, deliberately: our note and the customs agent's own paper are **two documents**, and the system should not pretend one replaces the other. *Print ours* sits beside *Attach*.
**The sticker is untouched and still correct** — it is printed and stuck to the carton, reads in both languages at once, and carries its own embedded wordmark. Asserted in the same suite so the two are never confused again.
`test_cmr.js` — **22 checks**. All 25 suites green, slogan verified, flow 0/0.

## 🔧 THE FOUR OPEN FAULTS, CLOSED (19 Aug)
**1 · A confirmed quotation was creating an empty shipment.** The clerk entered the route and the cargo, pressed *Confirmed — create shipment*, and got `from:''`, `dest:''`, `weight:0` — so they typed it all again, and the two records would disagree the moment either was corrected. **Everything the quotation knows now travels with it**: route, method, goods, cartons, weight and volume **as numbers**, the agreed lines, and a reference back. **Rule F21.**

**2 · The client register had four owners.** `CLIENTS` in B9 and D1, `CUSTOMERS` in B1 and Pricing — four lists, four shapes, one company spelled differently in each. **D1 holds the fullest record** (id, type, country, tax number) so D1 owns it and publishes on `SL_CLIENTS_V1`; B9 reads that list rather than seeding its own, **and a client registered during a quotation is pushed back to the owner**. With the bus down B9 still has clients to quote — the work is never blocked by a channel.

**3 · The quotations page showed everything to everyone**, which contradicts what the user asked for. Two grants decide it now: **whoever may price sees every quotation; anyone else sees only the ones they raised** — and the page says why the list is short. **Unknown is still not refusal**: with no staff registry the list is whole and says so.

**4 · Weight and volume were collected and never used.** Sea sells by CBM and air by chargeable kg, but the price was typed as one lump — so nobody could check how it was reached, and the next quote for the same lane started from memory. A carriage line is now **rate × quantity**, the quantity read from the cargo already entered, **with the arithmetic shown**: *95 per m³ × 8.4 = 798*. Where a volume is missing it **asks for one instead of accepting a guess**, a container stays flat because no unit applies, and an agreed figure still overrides everything. **Rule F22.**

`test_quoteflow.js` — **86 checks**. All 24 suites green, flow 0/0, contrast AA, no duplicates.
**Next, by the user's order:** the A4 consignment note · driver documents · border fees as a finance module.

## 📄 "I DON'T SEE IT" — the sheet was a specimen (19 Aug)
The user asked me to confirm whether the issued quotation really shows the designed sheet. **The honest answer was no.** The A4 document existed and was complete — golden-section totals, embedded lockup, 71 bilingual pairs, forwarder's terms — but it was **hard-coded**: `QTN-24-0207` for *TechLine Trading*, written into the markup. Opening it after issuing a quote for someone else showed **a beautiful document about the wrong client**, which is worse than no document because it looks correct.
**Fixed on the owner-publishes pattern**, the same one used for the hub and staff registries: Billing publishes the issued quotation on **`SL_QUOTE_V1`**, the sheet reads it and fills itself in — number, state, validity, **all three party blocks**, the priced lines and both totals. With nothing published it stays the specimen **and the chrome says so**, rather than pretending.
**Three things this cost me, each caught by looking rather than assuming:**
- I wrote the line rows against `.row` divs; **the sheet uses a `<table>`**. Read the markup, don't guess it.
- The totals are `.trow .v`, not `.machine` — and a quotation has no discount of its own, so the middle rows are **hidden rather than filled with an invented deduction**.
- And the client appears in **three party blocks**, not one. I filled the second and left *TechLine Trading* sitting in the consignee — the exact failure mode this whole fix was about.
`test_quotation.js` — **36 checks**, seven of them asserting the sheet draws the published quotation and none of the specimen survives.

## 🪟 THE DIALOG WAS CENTRED — in the wrong box (19 Aug)
The dialog looked pushed to the left, and the cause was not its own styling: it rendered **inside `#shell`, an 800px column**, so `position:fixed` with `inset:0` centred it *in that column*. Now hosted on `<body>` through a `sl-modal-host` node, so centring means the page. **Rule D7.**
**The fields were reordered as asked**, and the reasoning is worth keeping: **name, then country and city, then phone and email.** Country and city are now **chosen from lists, never typed** — a typed country becomes four spellings of Syria within a year — the city list follows the country, and **the dialling code comes with it**, shown against the phone box so nobody is asked to know their own prefix. Saving joins them: `+86 139 0000 1111`, and the country stored by name. **Rule C12.**
**The cargo is one line now** — goods · cartons · weight · volume in a single grid row at `2.2fr 1fr 1fr 1fr`, because it is one thought and reading it should take one glance.
**And the issued quotation opens the real sheet.** There was a temptation to rebuild the A4 layout inside this screen; that would have been **a second version of a document that already exists**, drifting the first time either changed. The issued view offers *Open the printed sheet* and hands over to `ShopyLink_Doc_Quotation.html`, which owns the golden-section totals, the embedded lockup and the print rules (**G1: reuse before writing**).
`test_quoteflow.js` — **69 checks**. All 24 suites green, flow 0/0, contrast AA.

## 📐 A ROW THAT DID NOT FIT, AND A BUTTON THAT DID TWO THINGS (19 Aug)
**The cargo row overflowed the page.** Four flex children, each with a minimum width of 120–180px, added up to more than the card could hold — so the last field pushed out and its label broke onto two lines. Rebuilt as a **grid**: the goods take the full width, the three measurements share a `repeat(auto-fit,minmax(110px,1fr))` row that **wraps rather than overflows**, inputs count their padding inside their width, and **the unit moved into the label** where it stops stealing room from the box. The route row above had the same fault and got the same fix. **Rule C11.**

**And *Issue & send* was one button doing two jobs.** The user's logic is right: **issuing mints the number and freezes the document; sending is a separate decision.** Now issuing opens the quotation **as a document** — client, route, cargo, every priced line, validity — and beneath it a send block offering **WhatsApp, Email, or Both**, each recording its own timestamp.
The consequences are what make it worth doing: **a quotation can be issued without going out**, **a resend is possible** because sending is not a one-time side effect of minting, and **a client with no phone on file is told so plainly** — the channel is refused **at the act as well as on the button** (F18), not quietly pretended. **Rule F20.**
`test_quoteflow.js` — **56 checks**. All 24 suites green, flow 0/0, contrast AA, controls clean, no overflow.

## 👤 THE CLIENT REGISTER, AND THE QUOTE AS A DOCUMENT (19 Aug)
Five corrections and three rulings, and together they changed what a quotation *is* in this system.

**One way to choose a client, one way to add one.** The free-text box beside the dropdown was the mistake: it invites a second spelling of a company already on file. Now the list is the only selector, and **+ Register a new client** opens a proper dialog — name, phone, email, city, country, **individual or business**, and for a business the **registered company name and address**. Saving **writes to the client register**, so the next quote finds them; it does not live inside this quotation. Cash is the standing term; **credit is granted by a manager elsewhere, never assumed here.**

**The cargo now sits under the route** — goods, cartons, weight, volume — because **sea is priced by volume and air by chargeable weight**, and a price with neither behind it cannot be checked or repeated later. It travels onto the quotation and into the shipment it becomes.

**On carriage prices, the user was right and I was half right:** freight moves with the market, so the price is **entered per job** — but the *lines* come from a list, and the local services keep their listed rates. Carriage lines therefore carry **no list price** by design, while a local service fills its own.

**Step 3 became a real review**: client, job, cargo and every priced line as the client will read them, with **an Edit beside each block** rather than one Back that unwinds the lot.

**And the quotations page is its own screen** — reached from the queue or after issuing — holding every quotation, each confirmed or closed from there.

`test_quoteflow.js` rewritten around the new design — **43 checks**. Nine assertions from the old design failed and were *supposed* to: they described what the user asked me to change. All 24 suites green, flow 0/0, contrast AA.

## ☑️ CHECKING MY OWN WORK AGAINST THE LIST (19 Aug)
The user asked me to go back over their instructions and find what I had not done. **One of twelve was missing** — the first item, renaming *Quotations* to **Create new quote** on the billing queue. My replacement had matched a different occurrence of the same string and I never verified which.
Now fixed in **both** places, so one action carries one name (E5): the queue button and the list button both say *Create new quote*, while the list heading stays **Quotations**, because that is what the page contains rather than what you go there to do.
**The more useful outcome is the contract.** The user's twelve instructions are now **twelve assertions** in `test_quoteflow.js`, each naming its item. A claim of "done" is no longer something I can assert — it is something the suite re-checks on every run.
`test_quoteflow.js` — **70 checks**. All 24 suites green, flow 0/0.

## ⌨️ ONE LETTER AT A TIME (19 Aug)
The user found the bug that explained another: *"the box allows you to enter one letter once."* Every `oninput` called `render()`, which rebuilt the screen and **destroyed the input being typed into**, taking the caret with it. **And it explained the mysterious "The job — D"**: the D was the client's name, one letter long because that was all anyone could type. Two reports, one root cause.
**Fixed by writing state silently** and refreshing only the control that depends on it — the Next button — rather than the page. **Rule C10.**
**A second fault surfaced while fixing it:** the + button was drawn `disabled`, so it carried **no `onclick` at all**; the quiet refresh then made it *look* live by changing its colour. A control that looks live and does nothing is exactly what rule E4 forbids — now recorded as **E4b: attach the handler always, let the guard refuse inside.**
**The rest of the list, done:**
- *Quotations* → **Create new quote**, which says what it does.
- **The payment control is gone** — cash is the default and needs no asking; the record still carries it.
- **A new client is asked for a phone and an email**, because a quotation that cannot be sent is not a quotation. A client already on file is not asked again.
- *What they asked about* → **Brief — what the client needs**.
- **Services now include the carriage**: 20ft and 40ft containers, LCL per CBM, air per chargeable kg, full and part truck loads, parcel shipments — **grouped apart from the local services**, and carrying **no list price**, because carriage is agreed per job while a local service has a rate.
- **A free line** for anything on neither list: type the service, price it, add it.
- **+ adds the row and opens a fresh one** in the same currency, with the focus back on the service list.
`test_quoteflow.js` — **58 checks**. All 24 suites green, flow 0/0, contrast AA.

## 🖼 THE BLANK WHITE BOX (19 Aug)
The screenshot answered the question I could not answer from the DOM: **a large empty white rectangle where the barcode belongs, and no visible logo at all.** Both elements existed and both were wrong.
- **The barcode library writes `width="219px"` as an *attribute* after it draws** — which beats an inline `style` width. So the white panel behind it sized itself to whatever the library chose and read as a blank box. The panel now **wraps** the svg instead of trying to size it, and **when there is no invoice number there is no panel at all**, because an empty barcode frame is worse than nothing.
- **The lockup was 46px tall by the time it rendered — 98px wide — sitting in a `flex:1` column**, which is why it looked absent. Given a stated height and a minimum column width, with the band centring both sides.
**What the header is for, stated plainly:** the brand on the left, and on the right the three things a person needs to identify this invoice — **what it is, its number, and the barcode that number encodes**. Nothing else belongs there.
`test_quoteflow.js` — **47 checks**, five of them on the band. All 24 suites green, flow 0/0, contrast AA.

## 🔢 A NUMBER BESIDE THE WRONG THING, AND 47 LOST TRANSLATIONS (19 Aug)
Three corrections, and the third exposed something larger.
- **"Quotations (3)"** — the 3 counted **invoices in the queue**, but sat after the Quotations button, so it described the wrong noun. **A number attached to the wrong thing is worse than no number**; it now follows the queue title it belongs to.
- **A new client is now asked how they pay** — Cash or Transfer, **defaulting to cash**, because every account is prepaid unless a manager grants credit in writing. It travels onto the quotation, so a confirmed job starts with the right terms rather than discovering them at the invoice.
- **Step 2 became a line editor, like the invoice**: choose the service, its list price fills in, **change it if this client agreed something else**, press **+** to add the row. The chips added instantly and gave no chance to adjust a price before it landed — and when the price does differ, the screen now says *"list price is 200.00 USD"*, so the difference reads as a decision rather than a typo.
**The larger finding:** every Arabic pair I added to this module today went to `var T={ar:{` — **which does not exist here**; the dictionary is `T_b9`. The replacements matched nothing, changed nothing, and **reported nothing**, so four screens had been shipping English-only under Arabic. **47 pairs** recovered and verified by rendering both steps in Arabic. *A silent no-op is worse than an error, because an error stops you.*
`test_quoteflow.js` — **42 checks**. All 24 suites green, flow 0/0, contrast AA, no duplicates.

## 🩹 THE ISSUE & SEND HEADER (19 Aug)
Three faults in one band, and the worst was the one a client would have seen.
- **It printed `null` twice** — once for the invoice number, once for the issue time — because both are empty until the invoice is actually issued. **A header that says *null* to a customer is not a cosmetic problem.** It now says *not issued yet*, and the time simply does not appear until there is one.
- **The brand was drawn again.** `slLockup()` composed the wordmark from typed letters and an SVG — the same A1 breach as the carton sticker, in a second place. Replaced with an **embedded white lockup**.
- **And the slogan was typed underneath it**, which made it both a duplicate and a second source of a brand string that must only come from the asset (A2). Removed; the lockup carries it.
**Building the white lockup took four attempts, each failing visibly:** the mono-white asset turned out to be **white ink on white paper with no alpha** — invisible on a dark band and unusable without a mask. Built instead from the **primary wordmark**, with alpha derived from **ink density** rather than a hard colour threshold, because the first threshold pass **ate the antialiased edges** and left the letters looking chewed. Each attempt was rendered onto the navy band and looked at before going further.
`test_quoteflow.js` — **31 checks**. All 24 suites green, flow 0/0, contrast AA.

## 🧭 THE QUOTATION SCREEN, REBUILT TO THE ACTUAL WORKFLOW (19 Aug)
Six corrections, and four of them were my own carelessness rather than a design question.

**The "3" beside the quotation** was the *billing* step bar — *Billing queue · Build invoice · Issue & send* — sitting on a screen that has no invoice to build. A quotation has **its own three steps**: **Client · The job · Issue**.

**The New-quotation button appeared twice** because the form rendered beneath the list that carries it. **And the pager was on a form with nothing to page** — I had added `pager()` across 27 modules and it went where it made no sense. Both gone.

**The screen now follows the work as described:**
- **Step 1 — who is asking.** Clients on file in a dropdown, **and a field to add one who is not**, marked provisional until the job is confirmed. Next stays disabled until somebody is named.
- **Step 2 — the job.** Departure, destination, method — then **services and prices drawn from the Pricing registry** rather than invented here (F10). Lines add and remove, the total follows. Next waits until the job is both described **and** priced.
- **Step 3 — issue.** A summary of what goes out, then the number is minted and it lands on **the list**, where it is confirmed or closed.

**A failing assertion that was right to fail, twice:** I expected the billing bar to reach step 3 on `go('s3')`. It does not — with no invoice open, and again with a draft one, the screen **correctly falls back to the queue**, because *Issue & send* means nothing before an invoice exists to send. **The code was right and my expectation was wrong**; the test now sets the invoice to issued first.
`test_quoteflow.js` — **25 checks**, walked by clicking. All 24 suites green, flow 0/0, roles clean, contrast AA.

## ↩️ THE QUOTATION CAME FIRST — I had built it backwards (19 Aug)
The user corrected the model, and the correction was structural: **a quotation is not something a shipment acquires. It is often what comes first.** A client asks what a job would cost; a shipment exists **only if they agree**.

```
enquiry → quotation → in review → confirmed → shipment created
                           └───── closed, no job
```
**What I had built could only ever quote a shipment that already existed**, which is the wrong way round and quietly assumed every quotation wins. Rebuilt: a quotation is **its own record** — a client, a description, a price, no shipment — on **its own screen**. Confirming **creates the shipment** at that moment and carries the agreed price into it. Closing **creates nothing** and keeps the reason, because a price refused for a reason is worth knowing the next time.
**And the third of the user's points was the one I would have missed:** *"not every shipment needs a quotation."* Every seeded shipment carries none, opens exactly as before, and is **never asked to acquire one**. The ordinary path is untouched — asserted, not assumed.
**Two display faults on Issue & send, both real:**
- **Every step read its number twice** — *"33 · Issue & send"* — because the circle printed the digit and the label printed it again.
- **The bar never advanced**: it only recognised `s1`/`s2`/`s3` while the screens in use are `s2-pre` and `s3-pre`, so it sat on step 1 throughout.
- And `qStatusChip()` had no entry for the new `closed` state, so the first close **crashed the list** — the identical fault I fixed in C9 Staff a few hours earlier. Fixed, and an unknown state now renders as itself rather than breaking the page.
`test_quoteflow.js` — **17 checks**. All 24 suites green, flow 0/0, roles clean.

## 🔵 THE LOCKUP — the rules were striking through the words (19 Aug)
The user reported the two blue rules sitting **over** the slogan rather than beside it, and the slogan too small. Looking at the assets settled it quickly: **`sloganen.png` was correct all along** — rules left and right, words clear between them. The fault was in **`wordmarktagline.png`**, the pre-combined lockup the documents used, where the slogan had been scaled down until the rule crossed the letters.
**So it was rebuilt, not redrawn (A1):** the mark from `wordmarkprimary.png`, the slogan from `sloganen.png`, composited at **+30% slogan width** and **centred beneath the mark** — 616px to 800px inside the same 1400px sheet. The Arabic lockup was built the same way from `wordmarkarprimary.png` and `sloganar.png`, which also **collapsed two images into one**: the Arabic side had carried the word and the slogan as separate files stacked by CSS.
**Checked the fit before shipping:** at 46mm wide the new lockup stands **15.5mm** against the old 13.8mm, and the header box reserves 16mm — so it grows without pushing anything.
Applied to **both the invoice and the quotation**. The rebuilt files live in `assets/` rather than `/tmp`, so the contract that verifies them still has something to compare against tomorrow.
`test_quotation.js` — **29 checks**, six of them asserting the lockups byte for byte.

## 🧾 QUOTATION STATES, WHERE THEY ARE MADE, AND THE CARTON STICKER (19 Aug)
Three rulings, three pieces of work.

**1 · A quotation has two states, and *unpaid* is not one of them.** It was there — inherited from the invoice along with a *30-day payment term*, both meaningless on a document that demands nothing. Removed, and replaced with **prepared by** and the **shipment reference**. The states are now **In review** (sent to the client) and **Confirmed** (becomes an invoice), plus **Expired** where the validity has passed, because a lapsed price cannot be confirmed — it is requoted. The document carries its state as **a word inside a border**, so it survives a photocopy and a black-and-white print.

**2 · "Where do I generate it?"** — the honest answer was **nowhere**: the document existed and no screen made one. It is now built **on the invoice detail screen, beside the price it quotes**. A business shipment offers *Quote this shipment*; an individual one does not, **and says why**. *Client confirmed* turns the quoted price into the **draft invoice** — a booking, not a debt, since the invoice is issued only once the cargo arrives.

**3 · The carton sticker.** The wordmark was **drawn** — an SVG mark beside the typed letters "shopy" — a direct breach of rule A1. It is now the **mono-white asset embedded byte for byte** from `/mnt/project/wordmarkmonowhite.png`. And **seven labels became bilingual in both modes at once**, because a sticker is read by the hand that packed the carton and the officer who receives it **at the same moment** — a language toggle is no use to a piece of card. Machine values stay Latin.

**4 · The A4 consignment note stays on hold, as instructed** — but the trip now has somewhere to keep one: **CMR, bill of lading or air waybill depending on the mode**, attached once **to the trip rather than to a leg**, since every officer along the route asks for the same sheet. An empty reference is refused — a document with no number cannot be found again.

**The cost of guessing, recorded honestly:** the Arabic labels took **ten attempts** and I broke the file once, because it is Babel-compiled and the label text sits inside `.concat()` rather than beside its tag. Two more inserts landed in the wrong function — one in the trip *picker*, one after a `return` where it never executed. **Every one of those was solved the moment I printed the actual line instead of guessing at its shape.** Same lesson as yesterday, relearned at full price.

`test_quotation.js` 23 · `test_awb.js` 12 · `test_tripdoc.js` 14. **All 23 suites green**, flow 0/0, audits clean.

## 📄 THE QUOTATION (19 Aug)
Built on the invoice sheet rather than beside it: the same A4 geometry, the same golden-section totals block, **the same three logo payloads carried over byte for byte** and verified as identical. What changed is the obligation, and that is the whole document.
**An invoice demands; a quotation promises and then expires.** So the due date became **Valid until**, *paid to date* became **prepayment on acceptance**, and an **acceptance block with two signature lines** was added — because a quotation nobody can sign is a letter, not an offer.
**The terms were written for a forwarder, not copied from the invoice:**
- **What the price covers** — and, said plainly, what it does not: duty, demurrage and storage past the free time are at cost when they arise.
- **How long it holds** — *"sea and road rates move with the market, and a price we cannot honour is worth less than no price."*
- **What it assumes** — if weight, volume or commodity differ at receiving, the price is recalculated **on what actually arrives, and the client is told before anything moves**.
- **Accepting it** — *"a booking, not a debt: the invoice follows once the cargo is received."*
- And the standing rule stated on the page: **quotations are issued to business accounts only.**
**Arabic carries the meaning, not the words:** *أرضيات* for demurrage, *مهلة السماح* for free time, *يُعاد التسعير* for requoting — **71 matched pairs**, every English string hidden under RTL, and the reference number keeping its Latin form.
**Two false alarms in my own checks**, both the same shape: a span reported as *empty* was the **brand lockup**, whose content is an image rather than words — once as the parent, once because the `<img>` itself carries the `en-t` class. The contract now excludes image-bearing spans instead of counting them as untranslated.
`test_quotation.js` — **23 checks**. Contrast AA, slogan verified inside the base64 payloads, print chrome excluded, and the validity survives black-and-white printing because it is a word.

## ✅ THE LAST OPEN ITEM, CLOSED (19 Aug)
Rule C7 — *option sets that scale* — has been the standing open item since the first session. It is now closed, and **most of it closed by reading rather than converting**.
The scan flagged rows in nine modules. Read one at a time:
- **D1 addressing a message to a hub** — one hub chosen, hubs grow with the business → **dropdown**. At 65 hubs the page holds at ×1.00.
- **C8 agent services** — a **multi-select** that grows as the company adds services → chips below ten, **a picker above it that also lists what is chosen**, because a multi-select must never be invisible (C7b). At 45 services the page went from ×1.42 to ×1.04.
- **Everything else stays as it is**, and that is the finding: 3 hub types, 3 stop kinds, 5 truck types, 4 trading countries, 5 QC kinds are **fixed vocabularies** — hiding one of three behind a click costs a click and gains nothing. And the border rows in Create Trip are **the chosen route displayed in order, not a choice at all**; the choice beside them was already a `<select>`. **Converting those would have hidden information rather than revealed it.**
The scan's own noise is worth noting: most of what it flagged was **`PAGE_SIZES`** — the three page-size buttons built last session. A tool that reports its own furniture needs reading, not obeying.
**Project state:** 31 files parse · **20 behaviour suites, 609 checks, all green** · no duplicate definitions anywhere · every stated text pair at AA · flow checks 0/0.

## 🔚 PAGING FINISHED — and two duplicates the tools caught (19 Aug)
The remaining modules are done. **Billing, Claims, Cards and D1 were drawing their pager only once the list overflowed** — the same fault as the cards screen, in four more places; the pager is now unconditional everywhere. **C7 Network was worse: it printed "page 1/5" as plain text with no buttons at all** — a label that tells you more exists and refuses to take you there. **C7 and C8 also opened at six rows per page**, an author's guess; both now open at twenty and offer 20 / 50 / 100.
**Every module is now verified by clicking**, not by calling the function behind the button: `dispatchEvent(new Event('click'))` on Previous, on Next, and on a numbered page.
**Two duplicates, both mine, both caught by `dupe.js` rather than by me:**
- `goPage3()` already existed in C7 — and the surviving copy took a **delta** while my buttons passed an **absolute page number**, so keeping the wrong one would have made Next jump unpredictably. Both forms now exist under distinct names.
- `slStaffRead()` was defined twice in Billing, once by the pager distribution and once by the permissions bridge. Verified byte-identical in behaviour before removing one.
`test_paging.js` — **68 checks**. All 19 suites green, no duplicate definitions anywhere in the project, flow 0/0.

## ⬅➡ "I STILL DON'T SEE NEXT AND PREVIOUS" (19 Aug)
The report was exact and the cause was mine: `pager()` hid Previous and Next whenever the list fitted on one page, and the cards screen seeds **six cards** — so all the reader saw was 20 / 50 / 100 with no way to page, which reads as a half-built control.
**They are now always drawn, disabled at the ends**, with **page 1 / 1** where there is a single page. The difference matters: a disabled Previous says *you are at the start*; a missing one says nothing at all, and the reader cannot tell a complete list from a broken control. **Rule C7f.** Applied to all **27 modules** carrying the pager.
**And the contract now clicks them.** The earlier assertions called `pgGo()` and `pgSet()` directly — which would have passed even if the buttons were never wired to anything. `dispatchEvent(new Event('click'))` on the actual button is what proves a control works, and it is what the user was doing when they found this.
`test_paging.js` — **38 checks**. All 19 suites green, every file parses, flow 0/0.

## 📑 PAGING EVERYWHERE — and the list of what must NOT be paged (19 Aug)
The user asked which other lists should page, naming six. **The inventory found thirty-one collections that grow without limit** — and, more useful, **thirty-five that must not page.**

**Page these** — anything the *work* creates, one row per real event: shipments · invoices · trips · deliveries · stops · crossings · claims · approval requests · work items · messages · tickets · the receiving queue · clients · customers · staff · drivers · trucks · agents · hubs · cities · zones · suppliers · cards · issued cards · addresses — **and the logs, which grow fastest of all**: `AUDIT`, `HIST`, `TRACK`.

**Never page these** — anything the *business defines*: roles, levels, departments, permission families, hub types, stop kinds, truck types, countries, plans, page sizes, app screens. **Paging three options hides one behind a click and gains nothing.**
> The rule that settles every future case: **page what the work creates; never page what the work defines.**

**Done this pass:** `pager()` distributed to all 26 modules; the **D1 work queue** paged with a pager **above and below** so you never scroll back to turn the page; and **C1 Trucks and C2 Drivers — which already paged at a fixed six rows — now let the reader choose 20 / 50 / 100.**
**A judgement left with the reader rather than made for them:** a truck row is heavy, so 100 per page is 261 KB against 65 KB at twenty. That is a long scroll — **but one the reader asked for**, which is the whole point of offering the choice.
`test_paging.js` — **31 checks**. All 19 suites green, flow 0/0, audits clean.

## 📄 THE CATALOGUE IS PAGED, NOT CAPPED (19 Aug)
The user drew a distinction I had flattened: **a cap with *show all* is right for an alert list**, where the tail is noise, **but wrong for a catalogue**, where every card is a real product someone may need to reach. The tail has to be reachable **in steps**.
`pager()` now gives the cards module: **20 / 50 / 100 per page** chosen by the reader, a stated range — *1–20 of 206 cards* — and Previous/Next with numbered pages. Applied to the **catalogue, the price review and the supplier registry**, each keeping **its own page and its own size**, so moving in one does not disturb another. The supplier registry opens at **10** rather than 20, because a supplier block carries endpoint, key and offers — twenty of them is a wall even when paged.
**The cases that break most pagers were tested first:** a filter that shortens the list **moves you to a page that still exists** instead of stranding you on an empty one; the final page holds **the remainder**, not a padded full page; and **Previous is disabled on page one** rather than silently doing nothing.
**And the growth contract caught the regression immediately** — Cards went to ×3.05 the moment paging landed, because a page of twenty supplier blocks is larger than the old cap. That is the contract doing its job: it failed on a real change in behaviour, not on a cosmetic one.
`test_paging.js` — **14 checks**. All 19 suites green.

## 📐 THE LAST THREE GROWERS — and a measurement I had been getting wrong (19 Aug)
| module | worst page before | after |
|---|---|---|
| Cards | 682,067 | **39,517** (×1.68) |
| Dispatcher | 150,251 | **11,563** (×2.04) |
| Delivery | 48,709 | **10,815** (×2.37) |

**What was drawn whole:** the price-review grid (cards × denominations × supplier offers — the fastest-growing thing in the build), the supplier registry at 203 blocks, the zone driver picker at 204, and the tracking log. Each is now **ordered by what needs attention** — losses first in price review, disconnected suppliers first, available drivers first — capped, and honest about what it holds back.
**The measurement was the harder part, and I had it wrong twice.** Summing all screens exaggerated; measuring after a chain of `go()` calls measured the chain, not the page. **A reader sees one page at a time**, so the honest number is the **worst single page, each measured in a fresh window** — that is what `test_growth.js` now asserts.
**And four times in a row my pattern-based edit reported "capped 0 lists" and I nearly accepted the number.** The lists were written as `zoneDrivers(z.id).map`, `TRACK.length?TRACK.map`, `st.runs.map` — a function call, a guard, a property. **Reading the actual line beat guessing at it every single time**, and the four wasted passes are the argument for rule G7 in its strongest form.
`test_growth.js` — **17 checks**, five of them the worst-page ceiling per module. All 18 suites green; flow checks 0/0.

## 📜 TEN AUDIT LOGS, ALL PAINTED WHOLE (19 Aug)
Working down the growth list, the same fault turned up in module after module: **the audit log was drawn in full**, oldest first. At 300 entries — a few weeks of real use — pages reached **×3 to ×4.8**.
**A log is read at its head.** Every one now shows its **twelve newest**, says *"12 of 301 — newest first"*, and keeps the rest as history rather than as page. Applied to **ten files**: B5, Cards, Claims, C10, C1, C2, C7, C8, C9 and D1. Measured after: **×1.00 to ×1.14** with 300 rows added.
**Three things this pass taught, all about the tools rather than the code:**
- **A sweep for `AUDIT.map(` missed two modules** whose heading is written inline with its container, and **flagged two that had none** — so the honest test is not the pattern but the behaviour: push 300 rows and measure the page.
- **Cards had a second audit log on another screen**, which the first fix did not touch. One occurrence is not the count.
- **C7 looked broken and was not** — its log lives on a screen my test never opened. The contract now **finds the screen that shows the log** per module rather than assuming it is the first.
`test_logs.js` — **24 checks** across eight modules, each locating its own log screen. Every suite still green, flow checks 0/0.

## 🧾 C12 APPROVALS — from ×9.2 to a flat ceiling (19 Aug)
The worst grower in the project, and the one worked every day. At 88 requests the page reached **×10.5** — every request card and every audit line drawn.
**An approvals queue is worked, not browsed.** It is now ordered by **what you can actually decide** first, then by level, then oldest; **capped at ten cards**, leading with *"3 you can decide"*; and the audit log shows its **twelve newest**. Nothing is hidden for good — *show all* opens the rest and folds back.
**Measured honestly, which took two attempts.** Growing from the seed showed ×1.6 and looked like a remaining leak; it was the cap **filling up** — six cards to ten. Measured from **already above the cap**, 28 requests to 428 changes the page by **three characters**, the width of the counter. *A ceiling is measured from above it, not from an empty room.*
**Two false alarms in my own tests, both instructive:** one counted `askApprove(` buttons, which are **permission-gated**, so it reported zero cards on a page full of them; the other searched for the word *showing*, which also appears on a **filter button**. The fold notice was given its own class so a test can find *it* rather than any sentence that resembles it.
`test_queue.js` — **13 checks**. C12 also passes the role sweep, the flow check, contrast and the audit.

## 📛 THE EVENT SAID WHICH SCREEN, NOT WHICH PERSON (19 Aug)
Working through the operational modules, the survey came first — and most of B1–B6 turned out to be **step wizards** that end on a "done" screen and persist nothing. Adding actors to them would have been ceremony. **B1 was different: it emits to the event bus, so what it does reaches the dashboard and becomes work.**
**And its events were stamped `actor:'B1 receive'` — the name of a screen.** So every shipment in D1 had been received by nobody, and a query about a wrong weight or a missing carton had no one to ask. It now names the person from the C9 registry, and says **unattributed** where nobody is signed in rather than inventing one.
**Traced end to end and asserted:** a warehouse clerk receives a parcel in B1 → the event on the bus carries **Khaled Omar** → D1 ingests it → **the name is on the manager board**. That chain crosses three modules and is now one test.
**A false alarm of my own making:** my check searched the whole file for the old string and kept failing — on the sentence in the comment I had just written explaining the fix. The comment was reworded; the lesson is that a check reading source rather than behaviour will find its own documentation.
`test_bridge.js` — **35 checks**.

## 🧑‍⚖️ THE APPROVALS CONSOLE DECIDED FROM A LIST OF THREE (19 Aug)
Closing the item declared last round: modules that passed the role sweep only because they had no actor.
- **C12 Approvals already had the right model** — a request carries a level, and you may decide it only if your level reaches it. What it lacked was the truth about who exists: **three names hard-coded in the file** while C9 holds twenty-four with their departments and levels. It now reads the roster — **20 active deciders**, each with a level, **and anyone on leave is not offered**. The local list survives as the fallback for an unreachable registry, never as a second opinion. Verified: an L1 person cannot decide an L3 request; an L3 person sees every pending one.
- **Pricing was showing the delete-a-lane control to a driver, a salesman and a support clerk.** Guarded, and checked across all 24 people.

**The sweep had to be corrected twice more, and both corrections matter:**
1. It matched **button labels**, so *"Approved"* — a status filter — was reported as a permission breach. It now matches the **handler**: `askApprove()` is an act, *Approved* is a word.
2. Every change was re-proved against the **planted fault** kept from earlier, so a tool that stops detecting is caught immediately rather than quietly reporting success.
`test_bridge.js` — **31 checks**. Every guarded control across six modules is now hidden from those without the grant, and that statement is one a tool can re-check rather than a claim in a document.

## 👁 WHAT YOU MAY NOT DO, YOU DO NOT SEE (19 Aug)
The user drew the distinction precisely: a warehouse clerk should not find the invoice button **disabled** — it should not be there. A greyed control says *you could, but not now*, and sends the reader hunting for a condition that will never be met.
`ifMay(perm, html)` now renders a guarded control only for those who hold the grant, in Billing and the Dispatcher. **Hiding does not replace the refusal** — calling `issueInv()` directly is still rejected, because hiding is presentation and the rule lives at the act. **Unknown is still not refusal**: with no registry the control stays, since the module cannot tell and must not guess *no*. **Rule F19.**
**Then the sweep the user asked for, across every role and every module** — `roles.js`, which loads each module as each person in the registry and lists any guarded control they can see. It found the Dispatcher showing **Reassign to eight roles including a driver and an auditor**. Fixed.
**The sweep reported "all clean" twice before it was worth believing**, and both times the reason was that it was measuring nothing:
1. It read only the landing screen, while the guarded buttons live inside an opened record.
2. A planted fault — `mayShow()` forced to `true` — went undetected until the tool was made to walk every screen and open the first record of each kind.
**A tool is not trusted until it fails on a fault you planted yourself.** The same trap caught a test written after it: the driver and the dispatcher both "saw 0 buttons" because the seed had no accepted run, so the assertion compared two zeroes and passed. Rewritten to test the guard directly.
`test_visibility.js` — **11 checks**, including one that walks **all 24 people through both modules and asserts each sees exactly what they were granted**.

## ✍️ THE AUDIT TRAIL WAS NAMING THE WRONG PERSON (19 Aug)
Connecting the operational modules to the registry, the audit began with a survey rather than a rewrite — and it found something worse than a missing check.
**Twelve approvals across five modules wrote the approver's name as a string literal.** Every border-fee approval claimed to be *Mona Said*; every pricing and dispatcher approval claimed *Omar Al-Masri* — whoever actually pressed it. **A log that attributes an act to the wrong person is worse than no log**: it looks authoritative and it is false. All twelve now name the actor from the C9 registry, and where nobody is signed in they say **unattributed — no signed-in user** rather than borrowing a name. **Rule F17.**
**And B9 had no notion of an actor at all**, so *issue invoice* — the act that bills a customer and locks the record — could be called by anyone who reached the screen. The grant is now checked **at the act, not only on the button**: a warehouse clerk calling `issueInv()` directly is refused, and the dialog says so before it is pressed. **Rule F18.**
**Deliberately not locked down:** with the registry unreachable the answer is **unknown, not no**, and the invoice still issues. A warehouse that cannot bill because a message bus is down is worse than one that bills with a name on the record.
**A false alarm worth noting:** the first sweep flagged a dozen modules for "unchecked dangerous actions" — they were `cancelCreate` functions that close a form, and CSS `cursor:not-allowed`. Reading them before acting saved a dozen pointless guards.
`test_bridge.js` — **24 checks**.

## 🔗 THE LOOP CLOSED — C9 publishes rights, D1 reads them (19 Aug)
The department model was C9's alone, which meant two opinions about what a person may do. Now there is one: **`SL_STAFF_V1`**, on the same best-effort pattern as the hub registry. C9 republishes on every render — **24 people** with their resolved permissions, their department and level, and whether they are on leave and when they are due back.
**A distinction that had to be preserved rather than merged.** D1's `ACTION_ROLES` answers *which role does this kind of work go to*; C9 answers *was this person granted it*. They are different questions, and **checking only the first is how a task lands on someone who cannot finish it**. `canOwn()` now checks both and **says which one refused** — routing, or permission. **Rule F16.**
- An accountant may build an invoice; a warehouse clerk may not, **and D1 no longer has to guess**.
- An unknown person returns **UNKNOWN, never a silent yes**.
- **Nobody on leave is offered work** — though D1 can still see they exist and when they return.
- **With the channel down**, D1 finds no registry, answers *unknown* rather than yes or no, falls back to its own routing **and says so on screen**, and the dashboard keeps working.
`test_bridge.js` — **18 checks** across both modules including the blocked-storage path. Suites now total **15 files**; the operational B-modules still read their own seeded roles and remain to be connected.

## 🏛 DEPARTMENT × LEVEL — permissions that survive the fifteenth hire (19 Aug)
The user was right that ticking permissions per person does not scale: whoever onboards the fifteenth clerk copies whatever the fourteenth had, and the reason it was granted is gone.
**Three of the four pieces already existed** — permissions grouped into five families, roles as templates rather than per-person choices, and a `level` field. What was missing is that **the department and the level were fields that did nothing**. Now they are the model:

| | Intake | Trips | Destination | Billing | Admin |
|---|---|---|---|---|---|
| **L1** does the work | 4 | 3 | 3 | 2 | 0 |
| **L2** approves and fixes | 4 | 3 | 6 | 4 | 1 |
| **L3** sets the rules | 4 | 3 | 6 | 9 | 2 |

Concretely: **Billing L1 builds and sends an invoice but cannot issue one; L2 issues it; L3 sets the price lists.** In the destination hub, **L1 assigns a run, L2 reassigns or cancels it** and handles the damaged-and-missing exceptions.
**A role remains for the exception, an override for the exception to the exception**, and **every permission reports which of the three granted it** — asked in layer order, so the answer to *why does she have this?* is the first reason it was granted, not the last one that also happens to cover it.
**Two faults found while building, both mine:** the first tiering read the *verb* out of permission ids that are abbreviations (`b9_issue`, `pr_base`), so **every level granted the identical set** — a model with no model in it; the tiers are now named explicitly. And the dialog **re-initialised its draft on every redraw**, so each choice erased the one before it.
`test_dept.js` — **22 checks**. Note this is C9's model; **the D1 dashboard and the operational modules still read the old per-role permissions** and will need connecting to it.

## 📅 A DATE IS PICKED, NOT SPELLED (19 Aug)
The return date was a text box demanding *YYYY-MM-DD*. That is a spelling test: it fails differently in every locale, and it makes the person prove they can format a string before they can grant a week's leave.
`askText()` gained a **kind**, and dates now render the browser's own **calendar** — with a `min` that blocks the impossible: **not before today** for a new leave, **not before the current return date** for an extension, so the control refuses backwards dates before the engine has to.
**And the format hint went with it.** Once a calendar is on screen, *(YYYY-MM-DD)* beside the field is noise the reader must ignore. Swept the project: **zero format-string hints left**, including the *expiry (YYYY-MM-DD)* labels on truck and driver documents, whose fields were already calendars.
**Checked the pattern everywhere before assuming:** every other module already used `type="date"` — 6 fields each — so this was a fault in the two dialogs I had just written, not a habit across the build. **Rule C9.**
Two assertions in `test_leave.js` were testing the text box I had just removed; they were rewritten to assert a calendar with a minimum. **44 checks.**

## 👤 "+16" AND A MISSING BUTTON (19 Aug)
Two questions, two real faults.
- **The `+16` on Omar's card was a dead label.** It counted sixteen permissions the reader could not see and offered no way to see them. It is now a button: **8 → 24 permissions**, with *show fewer* to fold them back. **Rule E6: a "+N" chip must open.**
- **"Where do I see the leave and the confirmation?"** — nowhere on the staff card, which was the honest answer. I built the engine and wired the roster panel but **never put the control where the person is**. The card now carries *Send on leave*; once away it reads **On leave · due 2099-03-03**; and on the due day **the card itself** offers *Confirm back*, alongside the board at the top. **Rule E7: an action belongs where its subject is.** Drivers already had it through their status control.
`test_leave.js` — **42 checks**.

## 🌴 LEAVE — a date to come back, an approval to go, a confirmation to return (19 Aug)
A driver could be sent on leave with a single click: **no return date, no approval, and no way back except another click**. The dispatcher had nobody to plan around and the record aged quietly.
**Built, and applied to drivers and staff from one engine rather than two copies:**
- **The return date is required.** No date, no leave — *leave with no end is not leave*. A date before the departure is refused too.
- **The request is `pending` until granted**, and **only a system administrator grants it**; an ops clerk cannot. The person stays on duty until then.
- **Nobody is assumed back.** On the due day the board raises *"Due back — confirm they have returned"*, counting the days already overdue. The record still says *on leave* until an administrator confirms, because **an assumed return is a driver who may still be away**.
- **A late return is recorded**, not quietly closed. And *still away — extend* moves the date rather than forcing a false confirmation.
**Three real faults surfaced while testing it, all mine, all caught before shipping:**
1. `askText()` **did not exist in either module** — every leave dialog I had just built was dead on click. Added to both.
2. `modalOk()` called the action **with no argument**, so the dialog collected a date and threw it away — worse than not asking.
3. `statusChip()` had no entry for `leave`, so **a person on leave crashed the roster**. Fixed, and an unknown status now renders as itself instead of breaking the page.
4. And the largest: **the staff roster never rendered the dialog layer at all** — `modalHTML()` was called on one screen only, so *every* dialog on the list opened invisibly. **Rule F14.**
`test_leave.js` — **36 checks**, including pressing the buttons as a user would rather than calling the functions behind them.

## ⏰ EXPIRY ALERTS — and the measurement that should have come first (19 Aug)
The user asked what the driver expiry alerts look like at a hundred instead of five. Measured: **the page grew 3.5×, and the alerts panel alone reached 55,438 characters** — every driver with an expiring document drawn as a chip.
**An alert list is triage, not an inventory.** A wall of a hundred names is the same as no alert at all: the eye stops reading and the urgent ones are lost inside it. It is now **ordered by expired first, then soonest expiry**, capped at eight, and it leads with **the number already expired** — the part that costs money. *Showing 8 of 100, most urgent first*, with show-all beside it. At 100 drivers the panel is **5,133 characters** and the page holds at **1.3×**.
**Then the question was turned on the whole project**, which is what should have happened when rule C8 was written rather than one screen at a time. `growth.js` grows every collection in a module tenfold and measures the page:

| | before |
|---|---|
| C12 Approvals | **×9.2** |
| B5 Border fees | ×8.9 · Cards ×8.8 · B8 Delivery ×8.3 · D1 ×8.1 · C10 Zones ×8.1 |
| Claims · C7 Network | ×6.0 |
| C9 Staff ×5.4 · B7 Dispatcher ×5.1 · Pricing ×4.8 · B3 ×4.0 · B2 ×3.5 |

**This is a project-wide fault, not a screen-level one**, and it is now a standing check in `verify.js` — declared open, with the three fixed modules named and the twelve outstanding counted. The user found it by asking the same question three times about three different screens; the honest response was to stop answering screen by screen and measure everything.

## 🔤 TWELVE MODULES EMOJI-FREE (19 Aug)
The conversion is now a routine rather than an adventure. `iconize.js` does one module at a time: inject the helper, wrap only the paints inside `render()` by exact match, then **refuse to accept the result unless the page still renders and gained icons** — an empty screen with no emoji is not a success, which is the trap that caught me on Fleet. It reverts on any failure and **names every emoji it could not map** rather than dropping it silently.
**Converted: D1 · Pricing · Cards · Fleet · Drivers · Agents · Staff · Network · Zones · Approvals · Claims · Border fees** — all clean in both languages, verified screen by screen.
**The icon family reached 51**, each added once at the source and distributed: van, pickup, wrench, id-card, key, shield, city, blocked. Where an emoji had a sibling already drawn, it was **mapped rather than redrawn** — inbound to the box, the tick to the shield.
**Two patterns keep recurring and are worth naming:**
- **Magnifiers inside `placeholder` attributes** — six of them. An attribute holds text; the word carries the meaning without decoration.
- **Coloured discs 🟢🟡🔴 are state, not pictures.** Each became a 9px token dot with its word beside it, which also survives black-and-white printing where an emoji disc does not.
`verify.js`'s render check now covers all twelve. Remaining: B1–B8 and the two client apps.

## 🚛 FLEET (C1) — the user was right, no correction needed (19 Aug)
The user asked whether they were mistaken about emoji in Fleet. They were not: **twelve pictographs were on that screen**, because the iconizer had only been wired into D1, Pricing and Cards. Fleet's turn had simply not come, and saying so is the whole answer.
**Converted, with three new icons** — van, pickup, wrench — bringing the family to 45, added once at the source.
**Two things were not icons at all, and treating them as such would have been wrong:**
- **A magnifier inside a `placeholder`.** An attribute holds text; an `<svg>` there shreds the tag, exactly as rule G9 records. The word carries it now.
- **Coloured discs 🟢🟡🔴 are state, not pictures.** The token sheet says status is **chip + dot + word**, so each became a 9px dot in the matching token colour with its label beside it — which also means it survives black-and-white printing, where an emoji disc does not.
**A failure worth recording:** my first attempt at wiring the helper broke the file — the shell rendered 218 characters, the error fallback. I noticed only because the icon count came back **zero while the emoji count also came back zero**: the emoji had been removed and nothing drawn in their place. Restored from the shipped copy and redone with an exact-match replacement. *A metric that improves for the wrong reason is worse than one that fails.*

## 🔢 ONE NUMBER FORMATTER, AND A DISTINCTION WORTH KEEPING (19 Aug)
`toLocaleString()` was in **fourteen live call sites across six modules** — a violation of the legacy-engine rule we set on day one, and the cause of the truncated `313.3`.
**Not a blind sweep.** Reading each one first showed they are not all money: **C1 Trucks formats kilograms and C10 Zones formats distances**, where two decimals would be wrong. So there are two forms — `fmt()` money with decimals, `fmt()` quantity without — and `slNum(n,dec)` injected where a file had neither. Four modules (B5, Cards, Claims, Zones) already carried the correct hand-written version and were left alone.
**Result:** every money surface reads `313.30` and `1,234,567.50`; kilograms read `3,500`. **No Intl call remains** outside the React reference build.
**A checker of mine lied twice in five minutes**, both times the same way: it searched `innerHTML` and then `textContent`, and jsdom includes `<script>` text in both — so it reported *undefined* on screens that were clean, and read CSS colours like `rgba(11,42,59,.15)` as numbers a customer would see. Stripping `<script>` and `<style>` before judging is now the pattern, and it is the third checker to need this correction. **Rule G10 was written for exactly this and I keep having to relearn it.**

## 🧾 "THIS POP-UP LOOKS WEIRD" — three faults in one dialog (19 Aug)
The user could not say what was wrong with the issue-invoice dialog, only that it felt off. Reading it carefully found three separate faults, and the vaguest report of the day turned out to be the most efficient.
1. **It demanded a 13-character reference be retyped.** Type-to-confirm belongs on **irreversible bulk actions** — deleting two hundred records. On a single invoice it teaches copy-paste, not care: the reader stops reading and starts transcribing, so the barrier prevents understanding rather than error. **Rule F12.**
2. **The money read `313.3`.** `fmt()` was `toLocaleString()` — which drops the trailing zero, **and is an Intl call our own legacy-engine rule forbids**. A figure that looks truncated on a billing screen makes the reader distrust the whole number. Rewritten by hand: two decimals always, thousands separated, negatives handled — tested at `0.00`, `1,234,567.50`, `-45.26`. **Rule B6.**
3. **A ⚠ and a red button on the act that bills the customer.** Issuing is not destruction; it is how the business gets paid. It does **lock** the record, so it is confirmed — now with what actually matters: the amount, what gets locked, and *"a mistake after this is corrected by a credit note against the same number, never by editing it."*

## 💰 B9 BILLING — the worst growth in the project (19 Aug)
Chosen next because a fault here costs money and because invoices are the fastest-growing thing in the business. The probe was ugly: **the billing screen grew 10.3× at 63 invoices** — it drew every invoice ever raised, with no search and no limit. A year of trading would have made it unusable.
**A billing queue is worked, not browsed.** It is now **ordered by what must be done** — drafts, then issued, then paid — **searchable by shipment or customer**, and **capped at twelve rows** with *"showing 12 of 403 — drafts first, then issued"* and a *show all* that opens the rest.
**Measured, not asserted:** at **403 invoices** the page draws **12 rows** and sits at **9,980 characters** against 39,794 unbounded — and going from 63 to 403 changes the page by **three characters**, the width of the counter. **A ceiling, not a slope.**
*A note on the test:* my first assertion demanded the page size be **identical** at 63 and 403, and it failed by those three characters. The assertion was wrong, not the code — a counter that reads *403* is longer than one that reads *63*, and it should be. Rewritten to assert a ceiling rather than a frozen number.
`test_growth.js` — **12 checks** covering the billing queue, the manager board and the partial-record crash. Total **695 behaviour checks**.

## 📊 GROWTH TESTING FOUND A CRASH (19 Aug)
Continuing the growth sweep, module by module — and the discipline paid immediately.
- **C7 Network was already sound.** Its `TYPES` and `KINDS` are **fixed vocabularies** — three hub types, three stop kinds — and turning three chips into a dropdown costs a click and gains nothing (**rule C7c**). Its `COUNTRIES` row is a statistics table, not a choice. Grown to **69 cities and 49 hubs**, the page did not change size: it already paginates and searches. Nothing to fix.
- **D1 crashed.** Pushing fifty trips onto the board threw `Cannot read properties of undefined` — `overrides()` assumed every trip carries an `overrides` array, and a trip that has never had one does not. **A real bug, found only by growing the data**, exactly what rule C8 is for. Fixed and tested.
- **D1's manager board grew 2.7×** at 93 people, because it drew every person in the team-load list. A manager does not need a roll call; they need to know **who is struggling**. It is now **ranked by overdue then by load, capped at 14** — a real team fits, a directory does not — labelled *"14 of 93 — busiest first"*, and **the rest are one click away, never hidden for good** (**rule C7d**).
Verified: 13 people show in full, 93 hold the board at 1.03× its size, and the fold opens and closes.

## 🔗 THE HUB REGISTRY — published once, read everywhere (19 Aug)
Asking someone to type a hub name that must match C7 *exactly* is a spelling test, and it fails the first time a name is corrected in one place and not the other. So C7 now **publishes** what it owns.
- **`SL_HUBS_V1`**, a registry channel on the same best-effort pattern as the approvals and events buses. C7 republishes on every render — **9 hubs**, each with the id, name, **city, country and phone that only C7 holds** — and closed hubs are not offered.
- **Pricing reads it.** *Add a services list* now offers a **dropdown of hubs that have no price list yet**, each showing its city, and attaches the **registry name character for character**. Nothing is typed, so nothing can drift; and a hub already priced is not offered twice.
- **The case that gets forgotten was tested first:** with `localStorage` blocked, the page still renders, `slRegHubs()` returns nothing, and the dialog **says the Network list is unreachable** and lets the name be typed. The bus never blocks the work — it only removes the spelling test when it is there.
`test_registry.js` — **13 checks** across both modules, including the blocked-storage path. **Rule F11:** the owner publishes, consumers read, and an unreachable channel is announced, not hidden.
Total: **683 behaviour checks.**

## 🏭 A HUB IS NOT A NAME — two sources of truth (19 Aug)
The user noticed that adding a hub in Pricing captured only a name: no country, no city, no phone. The missing fields were the symptom; **the fault was architectural.**
**The hub record already exists, in full, in C7 Network** — id, coordinates, name, type, city, address, phone, WhatsApp, opening hours, manager, status. Pricing was **minting a second, thinner hub from a name alone**, which is two sources of truth for the same entity and guarantees drift the first time someone edits an address.
**The fix is not to copy the form into Pricing.** Pricing does not own hubs; it prices their services. The action is now honest about that: *Add a services list* — *"a hub itself, its city, address, phone and manager, is created in Network (C7). Here you attach a price list to one that already exists."* The screen carries the same line, so nobody hunts for fields that were never this screen's to hold. The record it writes contains only what it owns: `hub` and `items`.
**C7 was then tested rather than assumed:** an empty hub form cannot be submitted, and **a name alone is still refused** — it wants city, address, phone and manager before it will create anything. The rule that was broken in Pricing was already being kept where it belonged.
**Rule F10:** one owner per record type; a consumer must not be able to create a thinner copy, and must say where the real one is made.

## ❓ "IS *REASON* THE RIGHT WORD?" — no, and it was worse than the word (19 Aug)
The user asked whether the add-hub prompt should say *reason* or *hub name*. Reading it properly showed the label was the smallest of three faults: I had reused `askReason()`, the **audit-trail** dialog, so naming a warehouse arrived as **"⚠ Add hub"** with a **red** confirm button, a field labelled **Reason**, a multi-line paragraph box, and a rule demanding **five characters of justification**.
**A name is not a reason.** `askText()` now exists beside it — same modal shell, no duplicate — asking for a value with the field **labelled by the thing itself** (*Hub name*), a single-line input, a **green** confirm because adding is constructive, a worked example (`Latakia Hub — Syria`), and a two-character floor instead of a justification test.
**Rule F9** written from it. And `askReason()` was re-tested to prove it kept its warning mark, its paragraph box and its five-character demand — a fix that quietly softens destructive dialogs would be worse than the bug.

## 🧹 A COUNT WITH NO MEANING, AND A BOX WITH NO PURPOSE (19 Aug)
Two more of my own additions, both removed on the user's reading:
- **The `3` between the dropdown and the field.** I had put a count on every picker by default. Beside a dropdown that *lists its own contents* it says nothing — counts are for places where the contents are hidden, like a tab or a tray. Now off by default across all 29 files; `count:true` is opt-in. **Rule E3b.**
- **The empty *Hub* text box.** It existed only to feed *+ Add hub*. But a button can ask for what it needs: pressing *+ Add hub* now opens a prompt — *the hub name as it should read on invoices, for example* `Latakia Hub — Syria` — validates it, and refuses with a reason. One action, one control. **Rule E5.**
Verified: one add control, the prompt names and adds the hub, it appears in the dropdown at once, and nothing reads *undefined*.

## 🔁 TWO BUTTONS FOR ONE ACTION, AND AN INVENTED FIELD (19 Aug)
The user found two *add a hub* buttons in Pricing services and reported the first one dead. Both were mine to answer for.
- **They called the same function.** `+ Add hub` was already there beside its text input; I added a second one next to the new dropdown. **Mine could never work** — `addHub()` reads the name from that input, and my button sat nowhere near it. Removed. **Rule F7:** never add a second control for an action that already has one; find the existing one first.
- **The real button was failing in silence.** `if(!nHub||svcHub(nHub))return;` — press it empty and nothing happens, with no explanation. It now says *type the hub name in the field first*, or *a hub with that name is already on the list*.
- **And a third fault came out of testing it:** I had given the new hub a `country` field. `SERVICES` has no such field — the hub name already carries it (*Damascus Hub — Syria*) — so **every option in the dropdown printed "undefined"**. **Rule F8:** never invent a field; read the record before writing to it.
Verified end to end: one control, refusals that explain themselves, a new hub selected and in the dropdown at once, and nothing reading *undefined* in either language.

## ⬇ A CHOICE IS A DROPDOWN — the threshold idea was wrong (19 Aug)
My first answer to growth was *chips below seven, search above it.* **The user rejected it and was right.** A control whose shape depends on the data makes the page rearrange itself as the business grows, and the reader has to relearn it. **The correct answer is simpler: a choice is always made from a dropdown**, the same size at five hubs and at a hundred, and the page then shows the content of the one that was chosen.
`slPicker()` was rewritten — **same call signature, so every existing site updated at once**: a `<select>` with a blank prompt, an optional **add** button beside it, and the count. Rule **C7** rewritten to match.
**Pricing services, verified at 98 hubs:** the dropdown simply holds 99 options, **nothing is laid out on the page**, the button count on screen stays at 11 whether there are 3 hubs or 98, choosing one shows that hub's services, and *add a hub* sits beside it. Shrink the list and the dropdown shrinks with it.
**Honest state:** the pattern is proven and the rule is written, but **23 rows in 8 modules still lay their options out** — my attempt to convert them by pattern found none, because each is written differently, and I will not run a blind replacement again after what that cost. They are listed by file and array in `verify.js`, and need doing by hand, module by module.

## 🔍 THE GAP WAS NOT THE TOOL — IT WAS ME (19 Aug)
The user asked where the gap was and why I had not found it myself. The honest answer:
**`options.js` did find it.** It reported **38 rows from its first run**, the services hub row among them. I converted **the first match I happened to open** — the address-plan warehouses — and reported success. **I treated a sample as the job.** And I never opened the screens to look, though rule **G10, which I wrote myself that same day**, says to check what the page renders.

**What the full sweep then showed, once every row was classified instead of counted:**
- **12 are single-choice** — `slPicker()` fits.
- **3 are multi-select** — `indexOf(x) > -1`, not `=== current`. Converting these with the single-choice picker would have **silently broken them**. They needed their own control, `slMultiPicker()`, which above the threshold **also keeps the chosen items visible** — with a hundred options a selection scrolled out of sight is a selection nobody can see. New rule **C7b**.
- **10 are not option sets at all** — `gaps`, `rows`, `missing`, `arch` are output, meant to be long. Converting them would have been damage dressed as progress.

That classification is the real lesson: **the count was never the work.** C9's country scope is converted and tested at 44 countries; the remaining single-choice rows are listed by file and array in the open item, so nothing is hidden behind a number.

## 📈 PRICING FULLY CONVERTED — tested at a hundred hubs (19 Aug)
The user pointed at the wrong fix being celebrated: I had converted the **address-plan** warehouse row, not the **services hub** row they meant, and asked the right question — *what if there are a hundred hubs?*
**Pricing is now converted throughout:** the services hub selector, the card categories, the customs countries and the address-plan warehouses all use `slPicker()`. Tested by pushing the arrays to **98 hubs, 43 countries and 34 categories** — each paints **at most seven** with a search box and *"showing 7 of 98"*, and each returns to plain chips when the set shrinks again.
**Two honest notes on the checker.** It counted a `.map()` that feeds a `<select>` as an unguarded chip row — the `<button>` it saw was in adjacent text. Rather than loosen the pattern until it passed, the one known false positive (`DCOUNTRIES`, which is genuinely a dropdown) is **named in the tool** so the count stays truthful. And a results list is not an option set: `gaps`, `rows`, `missing` are output meant to be long, and are excluded by name.
**True remaining count: 23 rows in 8 modules**, and `verify.js` states it.

## 📈 DESIGN FOR THE SET IT WILL HOLD (19 Aug) — rule C7
The user named a principle we were not honouring: **a design must be built for growth, not for today's numbers.** The example was exact — the warehouse choices in Pricing are a row of pressable chips, which reads well at five and becomes a wall at twenty.
**Measured before fixing:** `options.js` found the whole option set painted at once in **38 places across 11 files** — countries, suppliers, services, borders, document types, truck types. It was not one screen's mistake; it was a habit.
**One control, not 38 patches.** `slPicker()` paints chips while the set is small and **switches to a searchable list above seven**, showing at most seven matches with *"showing 7 of 20 — keep typing to narrow it"*. The threshold is read from the data on every render, so **the control follows the data rather than the day it was written** — proven by test in both directions: grow the array to 19 and it becomes a search; shrink it back to five and the chips return.
**Honest status:** the rule is adopted, the control is built and tested, and **the warehouse row the user pointed at is converted. Thirty-seven rows remain**, and `verify.js` now declares that as an open item rather than letting it pass quietly. Rule **C8** was added with it: anything that can grow is checked at scale — add twenty rows and look at the screen — before it ships.

## 🔤 UNITS 2 AND 3 — Pricing and Cards converted (19 Aug)
Same method, same discipline: apply, then read **the rendered page**, then verify.
- The icon family grew from 29 to **45 icons** — sixteen new ones (compass, ruler, departure, abacus, folders, scroll, tag, people, tools, bank, clipboard, export, gift, home, flask, trophy) added **once at the source and distributed to all 29 files**, rather than drawn per module.
- **Pricing paints from four places, not one.** Wrapping `render()` alone left three live-preview painters — the rate resolver, the duty calculator and the address-plan preview — still emitting emoji. Each was wrapped by name; no blanket regex, per rule G7.
- **Three emoji sat inside `placeholder` attributes** and could never become icons — an attribute holds text. The decoration was removed and the words kept: *Search card, store…* and *Departure* say what they are without a picture.
- **A false alarm worth recording:** my render checker read `innerHTML`, which includes any inline `<script>`, so it reported an emoji that no reader could ever see. It now strips script and style before judging — **the checker measures what the page shows, which is the whole point of rule G10.**
`rendercheck.js` is now part of `verify.js`: **nine checks, 670 behaviour checks, zero open items.** Three modules converted, 26 to go.

## 🩹 THE ICONIZER WAS SHREDDING A TAG (19 Aug)
The user reported broken code across the top of D1. **Cause:** `slIconize()` was a plain string replace over the whole HTML, so when it met the magnifier inside `placeholder="🔍 one field…"` it injected an `<svg>` **inside an attribute value**, shredding the tag — and the browser printed the remains as text at the top of the page.
**Fix:** the iconizer now splits the HTML on tags and converts **only the text between them**; an attribute is never touched. The search placeholder reads as words again.
**Two rules from it — G9 and G10:** never transform HTML with a plain string replace, and **test what the page renders, not what the file contains**. The source had looked correctly converted; only reading the rendered text exposed it — which is also how the three unmapped emoji were found an hour earlier.

## 🔤 UNIT ONE DONE — D1 is emoji-free (19 Aug)
Done the way the user asked and the way rule G7 now demands: **one module, then test, then verify.**
**The method changed after the earlier failure.** Instead of editing the strings — which is where thirteen files broke, because an emoji sits inside JS concatenation a find-and-replace cannot read — the swap happens **at paint time**. `slIconize()` wraps the eleven paint sites inside `render()` and nothing else: one bounded edit per module, incapable of corrupting a literal.
**Result for D1:** every one of its ten screens carries **no pictographic emoji**, in English and in Arabic, with **31 mapped symbols** rendered as our own SVG instead. Three more turned up only by testing the rendered output rather than the source — a red dot, a paperclip and a telephone — and three icons were drawn for them.
**Typographic marks are deliberately kept** and asserted by test: `✓ ✕ → ← ⚠` render identically on every device and survive monochrome print. They were never the problem.
**Two of my own tests were asserting the emoji** (`/📍/`) and correctly failed the moment it became an icon. Updated to assert the icon, not the character.
`node verify.js`: **eight checks, 670 behaviour checks, zero open items.** 28 modules still to convert, one at a time.

## 🔤 AN ICON FAMILY, AND A LESSON THAT COST MORE THAN THE FEATURE (19 Aug)
**Built:** `SL_ICONS` — 26 outline icons at one 1.7 stroke, 16px, `currentColor`, drawn as inline SVG and injected into all 29 files with a `slIcon(name,size)` helper. They exist because **an emoji is rendered by the device, not by us**: the same character is a different picture on Android, Windows and iOS, which is exactly how the wrong flag once reached a document.
**A distinction worth keeping:** `✓ ✕ → ← ⚠` are **typographic marks**, monochrome and identical everywhere, and they print correctly. They stay. Only the **pictographic** emoji need replacing — about 600 uses across roughly 110 symbols.

**What went wrong, and it was mine.** I ran a blind find-and-replace to swap the pictographs for `slIcon()` calls across every file at once. It broke **13 files**: the substitution landed inside string concatenations it could not understand. Then the textual "undo" broke more, in three different patterns, because reverting text is not the same as restoring a file. **The outputs folder had already received the damaged copies**, so the restore source was damaged too. Repairing it took four precise passes, each one diagnosed from the parser's actual error rather than guessed.
**Two rules written from it — G7 and G8:** never run a blind replacement across the codebase (change one file, verify, then widen), never "revert" by replacing text, and verify *what you shipped*, not just what you built.
**The icon set is in place and callable; the emoji replacement itself is not done** — it needs to be done file by file, verified each time. I would rather say that than claim it.

`node verify.js` is green again: **eight checks, 670 behaviour checks, zero open items.**

## 🎨 THE MODULES NOW CARRY THE TOKEN COLOURS — the open item is closed (19 Aug)
`node verify.js` reads **eight checks passing, 670 behaviour checks, zero open items.**
- **59 filled buttons** moved from the bright brand colour to its deep shade, then **36 more inside CSS rule bodies** that the inline pass could not see, and **144 places** where a brand colour was used as *text* rather than a fill.
- **The larger finding: 314 hint strings were `rgba(11,42,59,.6)`.** Transparent text has **no fixed contrast** — the same declaration read 3.98:1 on one surface and 4.16:1 on another, which is why the failures moved around as backgrounds changed. All of them are now the explicit token **n6 `#62707A`**, and **new rule A5** forbids transparent text colour outright.
- Two colours were outside the sheet entirely: a stray **`#8B5CF6`** avatar chip, and a timeline bullet with **white text on a white background** — invisible until it filled. Both corrected; **rule A6** added.
**Every one of the 30 files now passes contrast AA**, with the flow check, the ES5 parse, the legacy engine, the responsive guard and all behaviour contracts still green.

## 📲 RESPONSIVE, PROPERLY (19 Aug)
The user found that *simulate issue* vanished on a narrow window in the Cards module — correctly reading it as the system not being responsive yet, rather than one missing button.
**The cause, and it is everywhere:** the row holding the button is an inline flex row with a `margin-left:auto` spacer and **no `flex-wrap`**. On a narrow viewport the spacer takes all remaining room and **shoves the last item past the edge**. The button was always there, wired and working — it simply could not be seen. `responsive.js` now guards this, along with fixed widths that cannot fit a phone.
**The fix is a guard, not a per-button patch:** below 767px every inline flex row wraps, every auto-margin spacer collapses (**mirrored for RTL**), and modals size to the viewport instead of a fixed pixel width. Applied to all 30 files.

**The checker lied first, again.** Its initial version accepted *any* `flex-wrap` inside a 767px media query as evidence of a wrap guard — so it passed every file while the button was still being pushed off. It now looks for the **specific** guard. That is the third checker to do this, and the rule about it is written at the top of the tools section in `RULES.md`.

`node verify.js` now runs **seven checks plus 670 behaviour checks**, and reads: all pass, one declared open item.

## ✅ THE RULES ARE NOW A FILE, AND THE CHECKLIST IS A COMMAND (19 Aug)
Everything learned in this project is written down as **`RULES.md`** — 30 rules in seven areas, **each with the fault that created it**, so none of them can be argued away later as arbitrary. And **`verify.js`** runs the whole battery as one command and prints the checklist.

**The mobile fault the user found was mine.** Narrowing the Cards screen made the active box vanish. The modules already owned correct mobile behaviour at **767px**; the block I had added sat at **820px** and re-declared the sidebar **without width, top or z-index** — so between 768 and 820 the sidebar was `position:fixed` with no geometry and disappeared. Removed the duplicate, aligned the breakpoint. **New rule C6: never duplicate a breakpoint another rule already owns.**

**Two test suites were lying by being stale**, which `verify.js` exposed on its first run:
- `test_b8.js` called `collectCOD()` — **a capability the PREPAID-ONLY rule deleted**. Rewritten to guard the rule instead: it now asserts there is no cash function, and no cash wording in either language. That turned up **six dead dictionary strings** for cash collection still sitting in B8, waiting for someone to wire them back in. Removed.
- `test_b6.js` was written for a **four-step flow with `st.confirmed{}`** that no longer exists. Patching the names would have hidden that the contract described a vanished shape. Rewritten against the module as it stands; the original kept as `test_b6.legacy.txt` rather than discarded.

**One deliberate design decision in the runner:** contrast is reported as **OPEN**, not FAIL, with the reason printed — the modules have not yet been migrated to the token sheet. A checklist that always reads NOT READY stops being read; a declared open item keeps it honest and still usable.

## 📱 MOBILE IS A REQUIREMENT NOW, AND THE SWITCHER WAS HIDING (19 Aug)
**New standing rule from the user:** *every interface must be mobile-friendly, with all detail shown clearly and correctly.* Note this **amends design ruling #3**, which had said desktop rules apply to the operations consoles. The reconciliation actually built: the consoles stay **optimised** for desktop, but they must **work completely** on a phone — nothing hidden, nothing clipped, nothing unreachable. A mobile block was added to all 30 files: the sidebar becomes an off-canvas panel (mirrored under RTL) with the hamburger revealed, tables scroll **inside their own box** instead of pushing the page sideways, touch targets go to 44px, and inputs go to **16px so iOS stops zooming on focus**. A true per-screen mobile pass — deciding what each table becomes on a 380px viewport — remains a separate job.

**"Where can I actually open Price review and Supplier API?"** They were always there, at the top of the module: **Catalogue · Price review · Supplier API**. They could not be found because the switcher was **disguised as debug chrome** — 10px text in white at 40% opacity on the dark bar, measured at **3.35:1**, below AA and genuinely unreadable. That is a design defect, not a user error: the module's primary navigation was styled as a prototype toggle.
Now **11.5px at 72% (7.18:1)** with a solid active pill and a real hover state, across every module. Both destinations verified to open and render their content.

**Still outstanding and known:** the filled brand buttons (`#0EA5E9`, `#10B981`, `#E1483B` with white text) remain below AA in the modules. The token sheet already carries the fix — the deep shades — and migrating the modules onto the tokens is the next piece of design work, not a separate defect.

## 🎨 DESIGN PHASE — decisions and first artifacts (19 Aug)
Six rulings from the user on the UI master prompt, all recorded:
1. Brand inputs read **verbatim from the brand guide**, no palette invented. 2. **Cream stays** the canvas — it is the brand background. 3. **Desktop rules apply to the operations consoles; the customer app stays mobile.** 4. **Drawer-over-list adopted for tabular screens**, sequential wizards stay as steps — to be revisited if it does not serve. 5. **Undo replaces confirm for single reversible actions**; confirm stays for multi-record and irreversible. 6. **Emoji out** — ~940 to be replaced with one SVG icon family.

### The checkers came before the token sheet — and were right to
`contrast.js` (shipped) measures every text-on-surface pair against WCAG AA. **It lied twice before it was trustworthy**: it assumed the cream canvas whenever a block did not state a background, inventing 33 failures, and it flattened `rgba` over backgrounds it could not know. The rule written into it — *judge only what is stated together, never assume a background* — cut the list to **42 real failures**.
**What it found:** white text reads **2.77:1** on the brand sky, **2.54:1** on the green, **2.15:1** on the amber — all far below 4.5:1, in 42 places. The hint grey `rgba(11,42,59,.45)` reads **2.62:1** on cream. Had the token sheet been written first, these would have been baked into nine screens.

### `ShopyLink_Tokens.html` — approved
Brand colours **unchanged** for surfaces, borders and chips (ink on them reads 12.98–13.30). A **deeper shade added for filled buttons only** — `#0B6E9B · #0A7250 · #8A5A06 · #B23429`, white on them 5.65–6.15. Eight-step neutral scale from cream to ink; **hint text moves to n6 `#62707A`** (4.64:1) and **n5 is declared not a text colour**. A finding worth keeping: **ink on the bright red is 3.69 — no text ever sits on it**. Status is chip + dot + word, the dot a placeholder for the coming SVG set. Two shadow levels, 4px grid, 150/240ms motion, and an explicit forbidden list. *The sheet that bans emoji shipped with 14 ✓ marks in it; they were removed.*

### `ShopyLink_Doc_Invoice.html` — first document
Built before the screens because it is independent of the deferred sidebar and tests the tokens hardest: print, monospace numerics, and hierarchy. **A4 at true size**, 16mm margins, `@page` set so the browser adds nothing, screen chrome excluded from print. The **totals block sits on the golden section** of the live area (265 ÷ 1.618 = 163.8mm): evidence above it, what is owed below.
It carries our own rules rather than a generic template — **W/M chargeable weight showing both figures and the rule**, the **destination extra printed as 0.00 for the main hub** so the model is visible, **door-to-door printed as 0.00 with "included in the shipping price"**, and **one discount, the higher of tier and account**, stated as such. **21 checks pass, including the arithmetic**: the lines sum to the printed subtotal, 5% of it is the printed discount, and the difference is the printed payable. **Fully bilingual, not merely mirrored** (corrected on the user's point that an Arabic invoice was still showing English line items). Every translatable string exists as a **matched pair** — 66 of them — switched by CSS rather than script, so the document prints correctly in whichever language is on screen. That includes **every line description and the explanatory line beneath it**, the basis column, the parties' addresses, the payment and late-payment terms, and the page number. Bilingual labels that used to show both languages at once now switch as well, so the Arabic sheet reads Arabic throughout: a walk of the rendered text finds **zero English prose left** on it.
**What deliberately does not translate:** money, weights, dates, identifiers, IBAN. They stay Western digits and LTR in both languages, because they are machine data, not language — converting 1,293.71 to Arabic-Indic digits would break every downstream reader.
The RTL flip keeps **numeric columns LTR-aligned**, and a **black-and-white proof mode** that strips every colour to prove the status survives as a word.

`SPEC_sidebar.md` holds the sidebar specification with four reconciling edits, for building after the documents.

## 🎨 DESIGN SYSTEM v2 (adopted 19 Aug 2026 — console vs module)
**Know the artifact.** A module is a linear task wizard (enter-and-commit; speed + certainty). The dashboard/inbox is a console (scan-and-drill; glanceability). Never restyle one into the other.
**Type & surface.** Bricolage 800 at −0.025em for titles and big numbers · mono eyebrows at .14em, uppercase, for micro-labels · Manrope body at real sizes: `--fs-body:14px` inside `--ctl-h:42px` controls, `--fs-hint:12.5px` · cream canvas `#F7F4EC`, white `.card` at 13px radius. **Density comes from padding tokens (`--pad-card`, `--pad-row`), never from 10px text.**
**Voice.** Dry and human, one clause, sentence case. **Every warm string needs an Arabic twin** (checked by test).
**Bilingual — the three that matter.** Translate with a deny-list walker, not a selector list · units and machine values stay Latin everywhere (pick once, apply everywhere) · machine values need `.machine{direction:ltr;unicode-bidi:isolate}` under RTL; print artifacts never mirror; never hand-flip « ».
**Editing discipline.** Visual work changes no logic — run the design-lock check on both sides. Replace a stylesheet rather than stacking another `!important`. Grep every token before finishing.
**Debugging.** Probe computed style + rect on the element AND its parent, state the cause in one sentence, then one decisive edit. (Precedents in this project: RTL `row-reverse` cancelled native sidebar mirroring; a "stuck" rail width was a transition read synchronously — both causes far from the symptom.)

## ✅ APPROVALS — closed circuit (built 19 Aug 2026)
`ShopyLink_Action_C12_Approvals.html` (console) + the request sheet inside `ShopyLink_Action_09_Billing.html` (reference implementation).
**Decisions:** central catalogue of high-impact operations · a required LEVEL per operation type (discount/base-price/agreed-above-ceiling = L3; waive/cancel-trip/claim/reassign/border-fee-over-budget = L2) · **requests are HELD — nothing executes before approval** · while pending **only the affected field locks**, the rest of the record stays editable · **no approver in the hub scope → auto-escalate to the admin (L3) with a visible tag**.
**The seven stations:** origin (protected action inside its module → request sheet, reason mandatory) → hold (amber badge on the record, field locked) → routing (level ≥ required AND hub scope; escalation if none) → decision (approve, or reject with a mandatory reason) → **effect (approval really executes it — the invoice total moved 382.40 → 372.80)** → return (verdict + reason visible in the origin module; requester may file afresh) → permanent trace (audit both sides).
**Terminal states, all with an exit:** executed · rejected · withdrawn (requester pulls it back) · **lapsed** (record changed underneath — e.g. the invoice was issued; the issue dialog warns first). No open ends: an operation type without a real execution function is not accepted into the catalogue.

---

## B5 Border fees · Claims · C10 Zones — built 19 Aug 2026 (all on the approvals circuit)
**B5 `ShopyLink_Action_B5_BorderFees.html`** — standard fees registered per border (Bab al-Hawa 120 / Bab al-Salama 95 / Mersin gate 70), each crossing takes a **snapshot** of them (editing the registry never rewrites a past crossing) + **per-trip extra fees** with an **optional** invoice/document attachment. Any extra → held for **L2**; while pending only the extras lock; approval posts them (120 → 165) and unlocks **Settle crossing**, which posts to the trip cost and locks the record.
**Claims `ShopyLink_Action_Claims.html`** — raised at **B6 only**, carries its B6 evidence. Assessment = `min(declared value, flat cap × cartons)`; **insurance ceiling overrides the flat cap**. Held for L2 → approval issues a real **credit note (CN-…) on the customer account, applied to his next invoice**; rejection needs a reason and credits nothing. Policy page edits the flat cap (in-flight claims keep the cap they were assessed under).
**C10 `ShopyLink_Action_C10_Zones.html`** — ZONE = name · governorate · coverage · active · covering drivers (delivery_fee REMOVED per the override above) (last-mile, mirrored from C2). **An area belongs to one zone only** (conflict named on entry). **Rule 26** enforced and demonstrated: a coverage checker answers deliverable / not deliverable and says why (no zone · zone inactive · no covering driver), plus an **uncovered-areas** panel showing addresses with no zone. Deactivating a zone states the B7 effect with its address count and drops it from the live dispatch-board preview.

---

## 📌 OPEN ITEMS (true state, 19 Aug 2026 — everything else above is done)

**A. The control dashboard is being wired to the modules — phase 1 done.**
   **The pattern, decided 19 Aug:** *modules DECLARE what happened; the dashboard DERIVES what must be done.* A module never writes a work item — it emits a fact onto an **append-only event log** (`SL_EVENTS_V1`, same shared-storage mechanism as the approvals bus). The rules — who owns it, what happens next, when it is due, when it escalates — live in **one place**, the dashboard. Changing "amber at 70%" is one edit, not nine.
   - ✅ **Phase 1 (done):** B1 emits `parcel.received` on completion. The dashboard ingests it, creates the measuring work item **owned by the warehouse with a next action and a due date**, and **starts that shipment's lifetime clock at the moment of receipt**. Ingest is **idempotent and replayable** — re-running it changes nothing, and a fresh dashboard replays the log to the same state. Verified end to end (`test_link.js`, 23 checks): the chain `parcel.received → consolidated → trip.departed → pod.signed` produces the milestones, stops the clock at exactly 30h, and raises the Finance invoicing item. If storage is blocked, **B1 still receives and the dashboard still renders** — the bus is best-effort, never a dependency.
   - ⬜ Phase 2: B2/B4 stamp their milestones · ⬜ Phase 3: B3 calls the real gate so an incomplete pack blocks departure · ⬜ Phase 4: B9 reads the credit facility before issuing.
   - The eight event types: `parcel.received · consolidated · trip.departed · border.crossed · arrived · cleared · pod.signed · invoice.issued`.

**A-old. The remaining island surface** It holds the anti-forgetting engine, the lifetime clock, the gates, cost allocation and the client layer — on its own seeded data. Nothing in B1…B9 creates a work item, and no gate blocks a real departure. This is the one gap that decides whether the four layers are a demo or the system.
   1. **B1 receive → create a work item** (owner, next action, due) and **start the shipment lifetime clock**.
   2. **B2 / B3 / B4 → stamp the milestones** (consolidated, departed) the Speed board already expects.
   3. **B3 departure → call the real gate.** The trip cannot be released while a document is missing; the override goes through C12.
   4. **B8 POD → stop the lifetime clock**, and **B9 issue → close the finance work item**.
   5. **B9 → read the credit facility** before issuing to a business, and refuse release over the limit without a manager override.
   6. **W1 → the same approvals bus** as the other six origins, so a gate override appears in C12 rather than only in W1's own log.

**B. Smaller, genuinely outstanding**
   7. **Quotations for business accounts** — decided as in scope (new destinations, variable shipments), not yet built.
   8. **VGM / AWB file upload as references** — decided as in scope for sea/air, not yet built.
   9. **The system diagram** does not yet show the W1 layers or the approvals bus.
   10. **Handover of the test arsenal**: `audit.js`, the ES5 parser check and the seven contracts are in outputs, but there is no one-page note telling the developer how to run them.

**C. The React dashboard** (`ShopyLink_Dashboard.html`, 4.3 MB of inlined React) is **kept for reference only** — it is not part of the ES5 line and nothing depends on it.

**D. Explicitly parked (recorded, not to be built now)**
   - Dark control-room theme · React/Tailwind rebuild · B/L types, telex release, IATA AWB generation, VGM submission, TIR/T1, CFS devanning, COO consistency checks.

## ⏭ NEXT SESSION — START HERE (18 Aug 2026)

### Module status:
- B1→B9 ✅ + Pricing engine ✅ · Driver app standalone ✅ · System diagram ✅ 
- Brand: Tajawal AR font + Asset Hub tokens applied B1–B7.

### Retrofit log (all ✅ 19 Aug 2026)
- **C1 Trucks** (reference impl): view/edit draft, guarded status + maintenance delete + attachment removal, type-to-confirm archive.
- **C8 Agents**: read-only record, draft edit, guarded contact/phone removal (draft-scoped), suspend explains C7 impact, type-to-confirm archive; dead direct-mutation functions deleted.
- **C7 Network**: hub view/edit draft (incl. map pin), suspend dialog enumerates every affected dropdown, type-to-confirm archive, guarded agent removal at stops (warns when removing the ACTIVE agent → standby promotion), guarded office unlink.
- **C9 Staff**: user opens read-only (no clickable permission boxes), all permission/scope/role edits in draft; role change warns overrides are cleared; scope-hub removal, reset-overrides, suspend, resend-invite all confirmed; **role-template change warns how many members it hits**.
- **Pricing**: guarded delete for base lanes ("invoices fall back to no base price"), agreed prices ("his invoices revert to base"), services ("disappears from B9 fee dropdown"); out-of-range guards.
- **B9 Billing**: guarded invoice-line removal; **ISSUE requires typing the shipment code** + states it locks the invoice irreversibly; dialogs suppressed in print so the invoice document prints clean.

### Approvals — origins wired so far
- **B9 Billing** — exceptional discount (L3). Reference implementation.
- **B5 Border fees** — any per-trip extra (L2) before the crossing can be settled.
- **Claims** — every claim (L2) before a credit note is issued.
- **Pricing** — (a) **base trunk price change**: type the new price → *request* → held with a before→after strip on the lane; only that value locks; a second request on the same lane is refused; approval really moves the trunk (and therefore every city on it). (b) **agreed price beyond the CEILING (20% under base)**: registration is held until L3 signs; inside the ceiling it registers directly.
- **B7 Dispatcher** — **reassigning an ACCEPTED run (L2)**. While a run is merely *assigned* it stays freely reassignable, as before; once the driver accepts, the cartons are out for delivery and the pull-back is held: reason mandatory, run stays with its driver, second request refused, approver preview, and approval genuinely pulls the run back to the board with its deliveries pre-selected on that zone. Also fixed here: this older file was missing the `Array.prototype.find` polyfill required by the compat rules — it now passes the strict legacy sweep (B6, B8 and the driver app were swept too and are clean).
- **B3 Create Trip** — **cancelling a planned trip (L2)**. Cancel is a request, not an act: reason mandatory, the dialog states that the shipments return to the consolidated pool, the trip stays PLANNED with its shipments assigned while pending, a second request is refused, and approval genuinely cancels (the screen switches to *Trip cancelled — its shipments are back in the consolidated pool*, and it cannot be cancelled twice). Rejection leaves it planned and allows a fresh request.
- ✅ **All approval origins are now wired**: B9 discount · B5 border extras · Claims · Pricing (base price + agreed beyond ceiling) · B7 reassign accepted run · B3 cancel trip.
- ✅ done: C12 reads and decides real requests from all six origins through the shared bus.

### Next up:
- §C is complete (C1 C2 C7 C8 C9 C10 built; C3 merged into C2; C4/C5/C6 merged into C7; C11 covered by Pricing).
- Extend the approvals request sheet to the remaining origins: Pricing (base list / agreed above ceiling), Trips (cancel · reassign), and wire the C12 console to read them.
- Wire the customer-app account page to the pricing customer record (category, personal discount, agreed prices).
- Later: wire customer-app account page to pricing customer record; approvals inbox (L1–L3 pending-actions workflow); B5 border fees; Claims module.

### Patch pattern (unchanged):
edit last <script> block → node --check → flow_check (0 fail 0 warn) → jsdom suite (all states render, footers, 0 console errors) → copy to outputs.
Workflow rule: ASK design questions before building each module.
