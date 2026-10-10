# useCustomerStore Spec

## Overview

- **Target file:** `src/stores/useCustomerStore.ts` (new)
- **Owned files (this builder only):** `src/stores/useCustomerStore.ts`, `src/composables/useCustomerLookup.ts`, `src/composables/useCustomerSearch.ts`
- **Complexity:** `[high]`
- **Wave:** 3 · **Depends-on:** customer-types (1), customer-utils (2), customer-mocks (2)
- **Consumers of the new `distribute`:** owner-customers-list (wave 5) — via the `confirm` emit of `<CustomerDistributeSheet>` (wave 4, which never calls this action itself).

## Responsibility

Own the session's customer + ownership-history state as the single source of truth, including the two existing read adapters that now read from it.

> The two composables are 5-line read adapters over this store (API unchanged); splitting them out would add a wave for no gain.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-pinia-best-practices` (setup store returns ALL state; never call `useXStore()` at module scope; store-to-store use inside the setup fn is fine), `vue-best-practices`, `typescript-advanced-types`.
- **Builder MUST invoke before coding (action skills):** `investigate` (gstack) — only if a Verify/acceptance check fails; root-cause first.
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` (drives create/claim/release/approve/reassign/distribute flows end-to-end — BR-21…BR-30), `health`, `review` (heavy lane — this is the risk centre).

## Public API

```ts
export const useCustomerStore = defineStore("customer", () => { … return { customers, ownership, pendingCustomers, overdueCustomers, customerApprovals, findCustomer, historyFor, create, update, setDeliveryInterval, approve, recordDelivery, release, distribute }; });
```

NOT persisted (no `persist` option) — resets on reload by design.

**State**

- `customers = ref<TCustomer[]>(seed)` where seed = `customers` mock mapped to copies `{ ...customer, lastDeliveredAt }`; `lastDeliveredAt` = `createdAt` of the latest `deliveries` row (from `@/mocks/trips`) for that customer (`maxBy` from `lodash/maxBy`, compare ISO strings), omitted when none. Never mutate the mock arrays.
- `ownership = ref<TCustomerOwnership[]>([...customerOwnership])` (from `@/mocks/customerOwnership`).

**Getters (computed / plain fns)**

- `pendingCustomers` → `status === "pending"`.
- `overdueCustomers` → `customerDueState(customer).status === "overdue"`.
- `customerApprovals` → `TApproval[]` for each pending customer that has a `created` event: `{ id: \`appr-${customer.id}\`, kind: "customer", refId: customer.id, summary: \`New customer: ${fullName(customer)}\`, requestedBy: created.byEmployeeId, createdAt: created.createdAt }`. Use `flatMap`returning`[]`when no created event (no`?? ""`fakes); annotate the callback return`(…): TApproval[] =>`so`kind` stays the literal.
- `findCustomer(id: string)` → `TCustomer | undefined`.
- `historyFor(customerId: string)` → that customer's events, newest first (`b.createdAt.localeCompare(a.createdAt)`).

**Actions** (actor = `authStore.user?.id`; role = `authStore.activeRole`; `const authStore = useAuthStore()` once inside the setup fn). A private `actorId()` throws `new Error("Not signed in.")` when no user (same style as `useAuthStore.login`). One private `log(customerId, event, riderId?)` pushes `{ id: \`own-${Date.now()}-${counter++}\`, customerId, riderId, event, byEmployeeId: actorId(), createdAt: new Date().toISOString() }`.

- `create(draft: TCustomerDraft): TCustomer` — BR-21 branches on `authStore.activeRole` (NOT `user.roles`; emp-1 holds every role):
  - `"owner"` → open (`riderId` omitted) + `status: "active"`;
  - `"rider"` → `riderId: actorId()` + `"pending"`;
  - anything else (cashier) → open + `"pending"`.
    Fields: trimmed `firstName`/`lastName`/`phone`/`address`, `deliveryIntervalDays` when provided; defaults `creditEnabled: false, depositWaived: false, containersHeld: 0, depositOnFile: 0, creditBalance: 0, agingBucket: "current"`; id `` `cust-${Date.now()}` ``. Push, `log(id, "created", riderId)`, return the customer. (No duplicate check here — the form guards; see Risks.)
- Private `assignRider(customer: TCustomer, riderId?: string): void` — the ONE owner-side ownership-change rule, shared by `update` and `distribute` (DRY): no-op when `riderId === customer.riderId`; else event = `riderId == null ? "released" : customer.riderId == null ? "assigned" : "reassigned"`; set `customer.riderId = riderId`; `log(customer.id, event, riderId)`. Not returned from the store.
- `update(id: string, changes: TCustomerEdit): void` — owner edit (BR-28). Assign trimmed fields and `deliveryIntervalDays` (undefined clears); then `assignRider(customer, changes.riderId)` (logs only when the rider changed).
- `setDeliveryInterval(id: string, days: number): void` — sets `deliveryIntervalDays` only (rider interval prompt).
- `approve(id: string): void` — `status = "active"`.
- `recordDelivery(id: string): { isClaimed: boolean }` — sets `lastDeliveredAt = new Date().toISOString()`. If the customer is open (`riderId == null`) → BR-24: `riderId = actorId()`, `log(id, "claimed_by_delivery", riderId)`, `isClaimed: true`. Another rider's customer → BR-25: no ownership change. Claimer is the signed-in user, NOT `trip.riderId` (`useOpenTrip` falls back to any open trip).
- `release(id: string): void` — BR-26/29: no-op when the customer is not found or `riderId == null` (already open — logs nothing); also no-op when `authStore.activeRole === "rider"` and `riderId !== actorId()`. Otherwise compute `customerDueState(customer)` BEFORE clearing; event = `status === "not_due" ? "released_early" : "released"`; clear `riderId`; `log(id, event)`. (Confirmation UI is the caller's job.)
- `distribute(assignments: TCustomerAssignment[]): void` — owner bulk reassign (BR-30, spec §3.6). For each `{ customerId, riderId }`: `const customer = findCustomer(customerId)`; skip when not found; else `assignRider(customer, riderId)` (unchanged rider → skipped, logs nothing; was open → `assigned`; else `reassigned`). No role guard — same as `update`, the owner page is the only caller. One plain `for…of` loop; no return value.
  All actions no-op (return early / `{ isClaimed: false }`) when the id isn't found.

### Adapters (API unchanged — existing call sites keep working)

- `src/composables/useCustomerLookup.ts`: drop the mock import; `const customerStore = useCustomerStore()` at the top of `useCustomerLookup()`; `findCustomer(id)` → `customerStore.findCustomer(id)`; `customerName(id)` → customer ? `fullName(customer)` : `"Unknown"` (bind the lookup to a const first).
- `src/composables/useCustomerSearch.ts`: signature becomes `useCustomerSearch(query: MaybeRefOrGetter<string>, source?: MaybeRefOrGetter<TCustomer[]>)`; `const customerStore = useCustomerStore()` at the top; list = `toValue(source ?? (() => customerStore.customers))` inside the computed. Match when `term` is a substring of lower-cased `fullName(customer)` (covers first, last, and "first last"), `address`, or `phone`, OR when `phoneDigits(term)` is non-empty and a substring of `phoneDigits(customer.phone)`.

## State & data

- **State management:** this IS the store; reads `useAuthStore` (`user`, `activeRole`).
- **Data fetching:** none (mock seed only; no API).
- **Shared logic:** `fullName`, `phoneDigits`, `customerDueState` (auto-imported utils from wave 2).

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `defineStore`, `ref`, `computed`, `toValue`, `useAuthStore`, `useCustomerStore` (in the composables), `fullName`, `phoneDigits`, `customerDueState`.
- **Explicit imports needed:** `import maxBy from "lodash/maxBy"`; `import { customers as seedCustomers } from "@/mocks/customers"`; `import { customerOwnership } from "@/mocks/customerOwnership"`; `import { deliveries } from "@/mocks/trips"`; `import type { TApproval, TCustomer, TCustomerAssignment, TCustomerDraft, TCustomerEdit, TCustomerOwnership, TCustomerOwnershipEvent } from "@/types"`; `useCustomerSearch.ts` keeps `import type { MaybeRefOrGetter } from "vue"` and `import type { TCustomer } from "@/types"`.
- **Third-party:** lodash per-method.

## i18n

N/A.

## Conventions checklist

- [ ] Setup-store shape mirrors `src/stores/useAuthStore.ts` (`defineStore("customer", () => { … })`), returns every ref (Pinia devtools need all state returned).
- [ ] No module-scope `useXStore()` calls anywhere in owned files.
- [ ] Mutate state only inside actions; getters are `computed`.
- [ ] No `null`: `riderId` absent/undefined = open.

### House conventions (global `Standards.md` + personal-org `Standards.md` + this repo) — all apply

- [ ] `<script setup lang="ts">` + Composition API; `defineProps` generic syntax with destructured defaults (`const { size = "md" } = defineProps<{ size?: … }>()`), `defineModel` for two-way binding, `defineEmits` tuple syntax (`defineEmits<{ settle: [] }>()`) (Standards.md §Vue 3; org Standards §Vue 3).
- [ ] **Auto-imported — never hand-import:** everything from `vue`, `vue-router`, `pinia`, `@vueuse/core`; every export of `src/composables/*` (`useToast`, `useConfirm`, `useEmployeeLookup`, `useCustomerLookup`, `useCustomerSearch`, `useOpenTrip`), `src/utils/*` (`formatDate`, `formatDateTime`, `todayIso`, `manilaDay`, `fullName`, `phoneDigits`, `parseIntervalDays`, `customerDueState`, `findCustomerDuplicate`, `formatMoney`…), `src/types/labels/*` (`AGING_LABEL`, `CUSTOMER_OWNERSHIP_EVENT_LABEL`…), `src/stores/*` (`useAuthStore`, `useCustomerStore`). Components under `src/components/**` are auto-registered by path (`ui/Notice.vue` → `<UiNotice>`, `customer/Form.vue` → `<CustomerForm>`, `rider/IntervalField.vue` → `<RiderIntervalField>`); don't import them for template use (Standards.md §Dependencies).
- [ ] **Explicit imports that stay:** types via `import type { … } from "@/types"`; `ROUTES` via `import { ROUTES } from "@/types"`; mock data via `import { x } from "@/mocks/x"`; an icon SFC only when passed as a value (`import { IconUsers } from "@/components"`); lodash per-method (`import maxBy from "lodash/maxBy"`, never `from "lodash"`).
- [ ] **TS:** no `any`, no `as` casts, no new `!` non-null assertions; no redundant annotations (`ref("")`, not `ref<string>("")`; keep `ref<T>()`, `ref<T[]>([])`, `ref<Union>("x")`); empty = `undefined` (`ref<T>()`), never `null`; test customer emptiness with `!= null`/truthiness, never `=== null`/`!== null`; closed unions, not `string`; reuse `TOption<T>` from `@/types` (Standards.md §TypeScript). `noUncheckedIndexedAccess` is ON — indexed reads are `T | undefined`.
- [ ] **Naming/style:** booleans start `is/has/can/should`; no `_`/`fn` prefixes; bind a call's result to a named const before branching (`const isConfirmed = await confirmDialog.confirm(…); if (!isConfirmed)`); `async/await`, never `.then()`; `console.error` only (Standards.md §Code style).
- [ ] **Stores/composables:** call `useX()` once at the top of `<script setup>` and reuse the instance (`const customerStore = useCustomerStore()`); call store actions on the instance (`customerStore.release(id)`), never destructure actions; read state as `customerStore.customers` or via `storeToRefs` (Standards.md §State management).
- [ ] **Templates:** template renders, script decides — no inline array/object literals or multi-branch logic in bindings (move to a `const`, `computed`, or named function); `true` boolean props as bare attributes (`block`, `disabled`) (Standards.md §Templates).
- [ ] **Styling:** Tailwind utilities only — no `<style>`, no inline `style`, no raw hex. Available palette: `zinc`, `brand-50…950` (teal alias in `src/assets/style.css`), and Tailwind defaults `amber`/`red`/`emerald` (already used by `UiStatusPill`). No class prefix (Standards.md §Styling).
- [ ] **Comments:** write ZERO comments by default (Standards.md §Comments). Only a `// ponytail:` note for a deliberate known-ceiling shortcut.
- [ ] **Dates:** only through `src/utils/dates.ts` helpers / dayjs — never date-fns, never `toLocaleDateString` (repo memory: prefer-dayjs).
- [ ] **Icons:** SFCs in `src/components/icon` (`<IconX />`); no icon packages, no inline `<svg>` (repo memory; org Standards §Core).
- [ ] **Shared UI is closed:** never edit `src/components/ui/*` (except the one spec that owns `ui/Notice.vue`); extend with slots at the call site, no per-consumer props (Standards.md §Principles — Open/Closed).
- [ ] **ESLint house rules:** blank line before every `if` / `return` / multi-line `const`; `curly` always; plain HTML elements never self-closed (`<slot></slot>`, `<div></div>`), empty components self-closed (`<UiButton />`); hyphenated attributes (`:get-to`, `:exclude-id`).
- [ ] **Guardrails:** no test/spec files; no commits; do NOT run `vite`, `npm run dev`, `npm run build`, `npm run build-only` (they rewrite the generated barrels `src/components/index.ts`, `src/types/index.ts`, `src/utils/index.ts`, `auto-imports.d.ts`, `components.d.ts` and race other builders — the orchestrator regenerates them centrally between waves). Never hand-edit those generated files. Touch ONLY your owned files.

## Acceptance criteria

- [ ] Signed in as rider emp-3: `create(draft)` → `riderId: "emp-3"`, `status: "pending"`, `created` event by emp-3 with riderId emp-3; appears in `customerApprovals`.
- [ ] As cashier: open + pending; as owner: open + active and NOT in `customerApprovals`.
- [ ] `recordDelivery` on open `cust-13` as emp-3 → `{ isClaimed: true }`, riderId emp-3, `claimed_by_delivery` logged; on emp-4's `cust-2` → `{ isClaimed: false }`, riderId unchanged, no event.
- [ ] `release` on a not-due customer logs `released_early`; on a due/overdue/no-interval one logs `released`; riderId cleared either way.
- [ ] `update` changing rider emp-3→emp-4 logs `reassigned` (riderId emp-4); open→emp-3 logs `assigned`; →undefined logs `released`; unchanged rider logs nothing.
- [ ] `release` on an already-open customer logs nothing; a rider cannot release another rider's customer (no-op).
- [ ] As owner emp-1: `distribute([{ customerId: "cust-1", riderId: "emp-4" }, { customerId: "cust-5", riderId: "emp-7" }])` → cust-1.riderId `emp-4`, cust-5.riderId `emp-7`; two `reassigned` events by emp-1 with those riderIds; `historyFor("cust-1")[0].event === "reassigned"`.
- [ ] `distribute([{ customerId: "cust-13", riderId: "emp-3" }])` (open customer) → logs `assigned` with riderId emp-3.
- [ ] `distribute` with an unchanged pair (`{ customerId: "cust-1", riderId: <its current rider> }`) or an unknown customerId logs nothing and changes nothing.
- [ ] `update` still logs exactly as before (it now goes through `assignRider`).
- [ ] Risk noted: `authStore.activeRole` undefined falls into the cashier branch in `create`; acceptable because `actorId()` throws when nobody is signed in.
- [ ] `overdueCustomers` contains `cust-1` on 2026-10-01 (delivered 09-25, interval 3); not `cust-2`.
- [ ] Seed has `cust-11` and `cust-15` in `pendingCustomers`; `customerApprovals` has 2 rows with requestedBy `emp-7` / `emp-2`.
- [ ] `useCustomerLookup().customerName("cust-1")` → `"Aling Rosa Hernandez"`; `useCustomerSearch` finds `"rosa"`, `"hernandez"`, `"aling rosa hernandez"`, `"0917 000 0001"`.
- [ ] Mock arrays are never mutated (spot-check: `seedCustomers[0].riderId` unchanged after a release).
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/stores/useCustomerStore.ts src/composables/useCustomerLookup.ts src/composables/useCustomerSearch.ts --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/stores/useCustomerStore.ts" -e "src/composables/useCustomerLookup.ts" -e "src/composables/useCustomerSearch.ts"` → must print nothing EXCEPT `Cannot find name 'useCustomerStore'` inside the two composables (brand-new auto-import, regenerated centrally after this wave — do not hand-import, do not run vite). Consumer errors elsewhere are expected; ignore.
