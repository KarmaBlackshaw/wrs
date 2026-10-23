# Customer Assignment — Spec

Riders own customers. Ownership is gained by creating a customer or by the first delivery to an open one, and given up by releasing. The owner sees and overrides everything. Extends `wrs-app-spec.md` §4.2 Customers; rule numbers continue from BR-20.

## 1. Concepts

| Term     | Meaning                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| Owner    | The rider a customer belongs to (`riderId`). None = **open**.                                              |
| Open     | Customer with no rider. Any rider claims it by delivering to it.                                           |
| Pending  | Customer details await owner review. Affects nothing else: deliveries, ownership and credit work as usual. |
| Interval | Expected days between deliveries (`deliveryIntervalDays`). Set by the rider. Walk-ins have none.           |
| Due      | No interval, no delivery yet, or last delivery + interval ≤ today.                                         |
| Overdue  | Has an interval and last delivery + interval < today. A flag only; nothing happens automatically.          |

Admin and owner are the same role.

## 2. Business rules

| #     | Rule                                                                                                                                                                                 | Enforced on          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| BR-21 | Owner-created customers are open and active. Cashier-created are open and pending. Rider-created belong to that rider and are pending.                                               | Customer create      |
| BR-22 | Creating a customer is blocked when the phone matches an existing customer; the form shows the existing one to use instead.                                                          | Customer create      |
| BR-23 | Same first + last name with a different phone warns but allows creating.                                                                                                             | Customer create      |
| BR-24 | The first delivery to an open customer assigns it to the delivering rider, immediately, no approval.                                                                                 | Delivery             |
| BR-25 | Delivering to another rider's customer (covering) never changes ownership.                                                                                                           | Delivery             |
| BR-26 | A rider can release their own customer anytime, no approval. Releasing before due asks for confirmation and is logged as early.                                                      | Release              |
| BR-27 | Nothing is ever released automatically. Overdue is a flag only.                                                                                                                      | —                    |
| BR-28 | The owner can reassign, release, edit and approve any customer directly.                                                                                                             | Owner                |
| BR-29 | Every ownership change is recorded in the customer's ownership history.                                                                                                              | All ownership events |
| BR-30 | The owner can distribute a set of customers across chosen riders in one step: the app proposes an even split, the owner adjusts and confirms. Each moved customer logs `reassigned`. | Owner                |

## 3. Flows

### 3.1 Create customer

1. Rider (Customers page, or deliver screen's picker) or cashier (customer picker sheet) taps Add customer: first name, last name, phone, address. Rider also sets interval.
2. On save, duplicate guard runs (BR-22, BR-23).
3. Customer is created per BR-21. Pending customers raise a `customer` item in the owner's approvals queue.
4. A new walk-in can be delivered to right away.

### 3.2 Review pending customer (owner)

1. Approvals queue item → opens the customer page with an Approve bar on top.
2. Owner edits details through the existing edit sheet if needed.
3. Approve → status active. No reject: duplicates are stopped at creation.

### 3.3 Claim by delivery

1. Rider delivers to an open customer (found via the All tab or search).
2. On confirm, customer is assigned to the rider (BR-24), history logs `claimed by delivery`.
3. If the customer has no interval, the rider is asked to set one.

### 3.4 Release (rider)

1. Mine list → row action Release.
2. Rider taps Release. Due → released on that tap, no confirmation. Not due → confirm: "Due in 2 days (Oct 3). Release anyway?" (BR-26).
3. Customer becomes open; history logs `released` or `released early`.

### 3.5 Owner overrides

Owner can reassign to any rider, release, or change the interval from the customer page. No confirmation beyond the usual save.

### 3.6 Distribute customers (owner, permanent)

1. Owner customers list → filter Rider = Mario (optionally narrowed by Show).
2. Distribute N customers → sheet: pick the target riders (the filtered rider and the owner are never targets).
3. The app proposes an even split by count across the targets, balancing by the targets' current customer count.
4. Owner adjusts any row's rider in the proposal, then confirms.
5. Each customer is reassigned (BR-30), history logs `reassigned`.

### 3.7 Find an absent rider's customers

- Owner: customers list Rider filter.
- Covering rider: All tab search also matches the assigned rider's name ("Mario" lists Mario's customers).

## 4. Screens

### Rider

- **Customers** (`/rider/customers`): tabs **Mine** / **All** (Mine default). Add customer button. Mine rows show an Overdue tag and a Release action. The Open tab and Accept button are removed. Search in All also matches the assigned rider's name.
- **Deliver** (`/rider/trip/:id/deliver/:customerId?`): picker gains Add customer. Delivering to an open customer claims it; interval prompt if missing.

### Cashier

- **Customer picker sheet**: existing Add customer flow gets first/last name split, duplicate guard, and creates the customer as open + pending.

### Owner

- **Customers list**: columns Rider (or "Open"), Status (Pending tag), Overdue flag. Filters in the URL: **Show** (All / Open / Pending / Overdue) and **Rider** (All riders / each rider). With a rider filter active: **Distribute N customers** action → distribute sheet (§3.6).
- **Customer detail**: Approve bar when pending. Header shows rider. Edit sheet: first name, last name, phone, address, rider (incl. Open), interval. New **Ownership history** section: date, event, rider, by.
- **Approvals**: new `customer` kind; View customer opens the detail page.
- **Dashboard**: overdue customers alert, alongside the existing pending approvals count.

## 5. Data contract changes

| Entity            | Change                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Customer          | `name` → `firstName`, `lastName`. Add `riderId?`, `status` (`pending`, `active`), `deliveryIntervalDays?`, `lastDeliveredAt?` (derived) |
| CustomerOwnership | New: id, customerId, riderId?, event, byEmployeeId, createdAt                                                                           |
| Approval          | `kind` gains `customer`                                                                                                                 |

Ownership events: `created`, `claimed_by_delivery`, `released`, `released_early`, `assigned`, `reassigned`.

## 6. Current code vs this spec

Already on disk (uncommitted), to keep: `riderId?` on `TCustomer`, owner Rider picker / "Open" label / Rider column, shared `riders` / `riderOptions` in `useEmployeeLookup`.

To remove: Open tab, Accept button and local accept state in `src/components/rider/CustomerSearchList.vue`.

## 7. Assumptions to confirm

- Owner-created customers skip pending (the owner would only be approving themselves).
- Interval is required when a rider creates a customer; on claim-by-delivery the prompt can be skipped.
- Display name stays "First Last" everywhere a single name is shown today.
- Rider sees Overdue on their own customers only.

## 8. Next phase (not in this build): absence coverage

Spec'd here so this build leaves room for it; built after this plan ships, reusing the distribute sheet (§3.6).

- Owner marks a rider absent for a date range (sick leave included). Coverage expires on its own after the last day; nothing to undo.
- The app proposes a split of the absent rider's **due and overdue** customers across riders working that day; owner adjusts and confirms (same sheet as §3.6, temporary instead of permanent).
- Covering riders see their assigned share in Mine, tagged "Covering for Mario", and can also see **all** of Mario's customers (riders ask customers personally on their route, so the whole route stays visible; due/overdue ones are the assigned share).
- Deliveries while covering never change ownership (BR-25). When the absence ends, everything is back with Mario.
- New data: `RiderAbsence` (riderId, from, to, createdBy) and `CoverageAssignment` (customerId, coveringRiderId, absenceId).
- **Paid time off (all employees):** a yearly allowance of paid leave days per calendar year (Jan 1 – Dec 31), resetting each Jan 1, with no carry-over. Shop-wide default in Settings (proposed 5 days, matching the Philippine Service Incentive Leave), with an optional per-employee override.
- Going over the allowance is never blocked: the employee is still marked absent, and days beyond the allowance are unpaid.
- Payroll: paid leave days count as paid; days beyond the allowance are deducted from that pay run.
- Still open: whether unused days are converted to cash at year end, and whether a new hire gets the full allowance or only after a qualifying period.
