# Code → file

The modules are named descriptively on disk, but carry a **B/C/D code** inside
them — it is in the `<title>` and in the on-screen header. Looking for *B3* and
finding no `B3.html` is the most likely first confusion, so this table is the
answer to it.

**The code is the identity. The filename is a description.**

---

## B — the operational chain

The path a shipment takes, in order.

| Code | File | What it does |
|---|---|---|
| **B1** | `ShopyLink_Action_01_ReceiveParcel.html` | receive a parcel, print carton stickers |
| **B2** | `ShopyLink_Action_02_Consolidation.html` | consolidate parcels into a load |
| **B3** | `ShopyLink_Action_03_CreateTrip.html` | create a trip, assign truck and driver |
| **B4** | `ShopyLink_Action_04_Loading.html` | load the truck |
| **B5** | `ShopyLink_Action_05_TripJourney.html` | the journey and its border crossings |
| **B6** | `ShopyLink_Action_06_ArrivalReceive.html` | arrival at the destination hub |
| **B7** | `ShopyLink_Action_07_Dispatcher.html` | assign to a last-mile driver |
| **B8** | `ShopyLink_Action_08_Delivery.html` | delivery, returns, proof |
| **B9** | `ShopyLink_Action_09_Billing.html` | quotations, invoices, issue and send |

---

## C — the registers

Things the operation is configured with, rather than steps it performs.

| Code | File | What it holds |
|---|---|---|
| **C1** | `ShopyLink_Action_C1_Trucks.html` | trucks and their papers |
| **C2** | `ShopyLink_Action_C2_Drivers.html` | drivers, documents, leave — **and visas (C3)** |
| **C7** | `ShopyLink_Action_C7_Hubs.html` | countries, cities, hubs and stops — **absorbs C4, C5, C6** |
| **C8** | `ShopyLink_Action_C8_Agents.html` | customs agents and their services |
| **C9** | `ShopyLink_Action_C9_Staff.html` | **people, roles, permissions** — the source of truth for access |
| **C10** | `ShopyLink_Action_C10_Zones.html` | delivery zones |
| **C12** | `ShopyLink_Action_C12_Approvals.html` | approvals waiting on someone senior |
| **D1** | `ShopyLink_D1_Control.html` | control dashboard, the client register |

## C3, C4, C5, C6, C11 — merged, not missing

There is no file for these, and **that is a decision, not a gap.** Each was
folded into a module that already owned the same subject, rather than becoming a
screen of its own. Every merge below has been checked against the code.

| Code | Was going to be | Lives in |
|---|---|---|
| **C3** | driver visas | **C2 Drivers** — one visa per country, each with number and expiry; this is what blocks a driver from a route |
| **C4** | airports (IATA) | **C7 Network** — the stops layer |
| **C5** | ports (UNLOCODE) | **C7 Network** — the same layer |
| **C6** | cities / destinations | **C7 Network** — the cities layer |
| **C11** | rate cards | **`ShopyLink_Pricing.html`** |

**Do not build them.** A visa register separate from the driver who holds it, or
an airport list separate from the network it belongs to, would be two records of
one fact — and the second one goes stale.

`PROJECT_INDEX.md` records these merges under the C-series build order, dated
19 Aug.

---

## One naming collision, worth knowing

`ShopyLink_Action_B5_BorderFees.html` **has B5 in its filename but is not B5.**
B5 is the trip journey. Border fees were given that prefix in error when the
file was created and it stuck.

- **B5** = `Action_05_TripJourney` — the journey
- **Border fees** = `Action_B5_BorderFees` — the money side of a crossing

The two are related but separate: the journey records the crossing, the fees
module answers who paid, whether it has been settled, who bears it and whether
it came back on an invoice.

**It is deliberately not renamed.** The filename is referenced by the shell's
module map, the flow checks and every document here; changing it buys tidiness
and risks a broken link in each of those. `BorderFees` describes the file
correctly, and its own header says *Border fees* rather than *B5*. **This table
is the fix — disclosure, not a rename.**

---

## No code

These carry no B/C letter because they are not steps or registers.

| File | What it is |
|---|---|
| `ShopyLink_Pricing.html` | rate cards **(C11)**, services, HS codes, discounts |
| `ShopyLink_Action_Cards.html` | prepaid cards |
| `ShopyLink_GiftCards.html` | gift cards |
| `ShopyLink_Action_Claims.html` | damage and loss claims |
| `ShopyLink_Addresses.html` | shopping addresses given to clients |
| `ShopyLink_SmartRegistration.html` | client self-registration |
| `ShopyLink_Dashboard.html` | operations overview |
| `ShopyLink_Shell.html` | **the shell** — sign-in and navigation over everything above |

### Printables — A4, own print rules, open in their own tab

| File | Document |
|---|---|
| `ShopyLink_Doc_Invoice.html` | invoice |
| `ShopyLink_Doc_Quotation.html` | quotation |
| `ShopyLink_Doc_CMR.html` | consignment note (CMR / bill of lading / air waybill) |

### Apps — behind their own sign-in, not part of the staff shell

| File | Audience |
|---|---|
| `ShopyLink_IndividualApp.html` | individual customers — fixed price list, nothing to approve |
| `ShopyLink_App_Combined_Designed_v2.html` | the individual app as a screen gallery, every screen in its own phone frame |
| `ShopyLink_BusinessApp.html` | business customers — accept or discuss a quotation |
| `ShopyLink_Driver_App.html` | drivers — the last-mile run: stops, prepaid banner, no cash collection |
| `ShopyLink_Driver_Trip.html` | drivers — the long haul: his trip, his papers, his float |

### Reference

| File | |
|---|---|
| `ShopyLink_Tokens.html` | the token sheet: colours, type, spacing |
| `ShopyLink_System_Diagram.html` | how the modules relate |

---

## Finding a module by code, from the shell

Open `ShopyLink_Shell.html`, sign in, and the sidebar groups them by family
rather than by code — Intake, Trips, Destination, Money, Admin. The code appears
in each module's own header once it opens.
