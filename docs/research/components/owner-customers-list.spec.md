# Owner customers list Spec

## Overview

- **Target file:** `src/pages/owner/customers/index.vue`
- **Owned files (this builder only):** `src/pages/owner/customers/index.vue`
- **Complexity:** `[med]`
- **Wave:** 5 · **Depends-on:** customer-form (4), customer-distribute-sheet (4), customer-store (3, incl. `distribute`), customer-utils (2)

## Responsibility

Show the owner every customer with rider/status/overdue columns, URL-synced Show + Rider filters, an add sheet (open + active, BR-21), and the entry point that applies a rider's distribution (BR-30, §3.6).

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-best-practices`, `vue-pinia-best-practices` (ephemeral filter lives in the URL query, not a store), `web-component-design`.
- **Builder MUST invoke before coding (action skills):** none
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` (filter chips + `?filter=overdue` deep link from the dashboard; `?rider=emp-3` → Distribute → confirm → rows leave Mario's list; add with duplicate phone blocked; names not blank), `design-review`.

## Public API

- Route page. **Query contract:** `?filter=open|pending|overdue` (consumed by the dashboard spec); `?rider=<employeeId>` (an active rider's id from `useEmployeeLookup().riders`); both combine (`?rider=emp-3&filter=overdue`); absent/unknown value = no filter on that key. "Open" stays a Show value, never a Rider value.

## State & data

Keep the in-flight baseline (Rider column) but restructure:

- Hoists: `const toast = useToast(); const router = useRouter(); const route = useRoute("/owner/customers/"); const customerStore = useCustomerStore(); const { employeeName, riders, riderOptions } = useEmployeeLookup();`
- Local types/consts (page-only, not shared):
  - `type TCustomerFilter = "open" | "pending" | "overdue";`
  - `const FILTER_LABEL: Record<TCustomerFilter, string> = { open: "Open", pending: "Pending", overdue: "Overdue" };`
  - `const filterOptions: TOption<TCustomerFilter | "all">[] = [{ value: "all", label: "All" }, { value: "open", label: "Open" }, { value: "pending", label: "Pending" }, { value: "overdue", label: "Overdue" }];`
  - `const FILTER_MATCH: Record<TCustomerFilter, (customer: TCustomer) => boolean> = { open: (c) => c.riderId == null, pending: (c) => c.status === "pending", overdue: (c) => customerDueState(c).status === "overdue" };` (use full param names, not `c`).
- URL-synced filter (no cast):
  - Cast-free narrowing: `const FILTERS: TCustomerFilter[] = ["open", "pending", "overdue"]; const filter = computed(() => FILTERS.find((value) => value === route.query.filter));`
  - `function setFilter(value?: TCustomerFilter) { router.replace({ query: { ...route.query, filter: value } }); }` — spread keeps the other key; vue-router drops `undefined` values from the URL.
  - `const filterChoice = computed({ get: () => filter.value ?? "all", set: (choice) => setFilter(choice === "all" ? undefined : choice) });` (writable computed for the segmented control's required `defineModel<T>`).
  - `const filterLabel = computed(() => (filter.value ? FILTER_LABEL[filter.value] : undefined));`
- URL-synced Rider filter (same cast-free pattern):
  - `const rider = computed(() => riders.find((employee) => employee.id === route.query.rider));` (`TEmployee | undefined`).
  - `function setRider(riderId?: string) { router.replace({ query: { ...route.query, rider: riderId } }); }`
  - `const riderFilterOptions: TOption[] = [{ value: "all", label: "All riders" }, ...riderOptions];` (script const; employee ids are `emp-N`, never `"all"`).
  - `const riderChoice = computed({ get: () => rider.value?.id ?? "all", set: (choice) => setRider(choice === "all" ? undefined : choice) });`
- `const scopedCustomers = computed(() => { const riderId = rider.value?.id; const value = filter.value; return customerStore.customers.filter((customer) => (riderId == null || customer.riderId === riderId) && (value == null || FILTER_MATCH[value](customer))); });` (rider narrows first, Show narrows within it — §3.6 step 1).
- `const query = ref(""); const filteredCustomers = useCustomerSearch(query, scopedCustomers);`
- Columns (add `status` after `rider`): `name, phone, address, rider, status, containersHeld, depositOnFile, creditBalance, agingBucket`.
- `isOverdue(customer: TCustomer)` → `customerDueState(customer).status === "overdue"`.
- Add sheet: `addSheetOpen = ref(false)`; remove `nameDraft/phoneDraft/addressDraft/canSaveCustomer`; `submitAdd(fields: TCustomerFields)` → `customerStore.create(fields)` (owner role → open + active) → `toast.show("Customer saved")` → `addSheetOpen.value = false`.
- Remove the old `riderLabel` helper (replaced by the cell template).
- Distribute (BR-30, §3.6) — the page owns the action; the sheet only emits:
  - `const isDistributeOpen = ref(false); const distributeCustomers = ref<TCustomer[]>([]);`
  - `const canDistribute = computed(() => rider.value != null && filteredCustomers.value.length > 0);`
  - ``const distributeLabel = computed(() => { const count = filteredCustomers.value.length; return `Distribute ${count} ${count === 1 ? "customer" : "customers"}`; });`` (N = the currently listed rows, after Show + search).
  - `function openDistribute() { distributeCustomers.value = [...filteredCustomers.value]; isDistributeOpen.value = true; }` — snapshot, so the sheet's list doesn't shift when the store mutates on confirm.
  - ``function distribute(assignments: TCustomerAssignment[]) { customerStore.distribute(assignments); toast.show(`${assignments.length} ${assignments.length === 1 ? "customer" : "customers"} distributed`); }``

### Template

- `UiDataTable` as today, `:rows="filteredCustomers"`, plus:
  - `#filters` (same multi-chip pattern as `src/pages/owner/sales.vue:103-113`), Rider chip FIRST then Show:
    - `<UiFilterChip label="Rider" :value="rider?.name" @clear="setRider()"><UiSegmentedControl v-model="riderChoice" :options="riderFilterOptions" /></UiFilterChip>`
    - `<UiFilterChip label="Show" :value="filterLabel" @clear="setFilter()"><UiSegmentedControl v-model="filterChoice" :options="filterOptions" /></UiFilterChip>`
  - `#actions` keeps the existing `UiSearchInput` + "Add customer" button and adds, before "Add customer": `<UiButton v-if="canDistribute" variant="secondary" @click="openDistribute">{{ distributeLabel }}</UiButton>`.
  - `#cell-name="{ row }"` → `<span class="flex items-center gap-2">{{ fullName(row) }}<UiStatusPill v-if="isOverdue(row)" tone="danger">Overdue</UiStatusPill></span>` — REQUIRED: rows have no `name` key any more (silent blank cell otherwise).
  - `#cell-rider="{ row }"` → `<UiStatusPill v-if="row.riderId == null">Open</UiStatusPill><template v-else>{{ employeeName(row.riderId) }}</template>` (neutral pill = default tone).
  - `#cell-status="{ row }"` → `<UiStatusPill v-if="row.status === 'pending'" tone="warn">Pending</UiStatusPill>` (empty for active).
  - `#empty` → `<UiEmptyState title="No customers match these filters" />`.
- Add sheet: `<UiBottomSheet v-model:open="addSheetOpen" title="Add customer"><CustomerForm v-if="addSheetOpen" submit-label="Save customer" @submit="submitAdd"><template #duplicate="{ customer }"><UiButton variant="secondary" size="md" :to="ROUTES.OWNER.CUSTOMERS.DETAIL(customer.id)">Open {{ fullName(customer) }}</UiButton></template></CustomerForm></UiBottomSheet>` (no footer; the form owns its submit button; no rider field on add per UX fragment).
- Distribute sheet (after the add sheet): `<CustomerDistributeSheet v-if="rider" v-model:open="isDistributeOpen" :customers="distributeCustomers" :source-rider-id="rider.id" @confirm="distribute" />`.

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `ref`, `computed`, `useRoute`, `useRouter`, `useToast`, `useCustomerStore`, `useEmployeeLookup`, `useCustomerSearch`, `customerDueState`, `fullName`, `AGING_TONE`, `AGING_LABEL`; all `Ui*` + `CustomerForm` + `CustomerDistributeSheet` components.
- **Explicit imports needed:** keep `import { IconUsers } from "@/components"`, `import { ROUTES } from "@/types"`; add `import type { TCustomer, TCustomerAssignment, TCustomerFields, TOption } from "@/types"`.

## i18n

N/A.

## Conventions checklist

- [ ] No `as` for the query values — narrow via `FILTERS.find` / `riders.find`.
- [ ] Filter state lives only in the URL (`router.replace`, so Back isn't spammed); setting one key never drops the other.
- [ ] The page (not the sheet) calls `customerStore.distribute` and toasts.
- [ ] Don't modify `UiFilterChip`, `UiDataTable`, `UiStatusPill`.

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

- [ ] `/owner/customers?filter=overdue` shows only cust-1 (Aling Rosa Hernandez) with a danger "Overdue" pill; chip reads "Show | Overdue"; clearing the chip drops the query and shows all 15.
- [ ] `?filter=open` → cust-12..15; `?filter=pending` → cust-11, cust-15.
- [ ] Name cells show full names (not blank); Rider cell shows name or neutral "Open" pill; Status shows warn "Pending" only for pending.
- [ ] `?rider=emp-3` → cust-1, cust-5, cust-9; chip reads "Rider | Mario Cruz"; "Distribute 3 customers" shows. `?rider=emp-3&filter=overdue` → cust-1 only, "Distribute 1 customer". Clearing Rider keeps `filter`; clearing Show keeps `rider`. No rider filter (or `?rider=bogus`) → no Distribute button.
- [ ] Distribute → sheet with those rows → confirm → `customerStore.distribute` called with the emitted assignments, toast "3 customers distributed", rows leave Mario's list, cust-1's history shows `Reassigned`.
- [ ] Add sheet: duplicate phone blocks with "Open {name}" link; new customer saved as open + active and appears in the table.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint "src/pages/owner/customers/index.vue" --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/pages/owner/customers/index.vue"` → must print nothing.
