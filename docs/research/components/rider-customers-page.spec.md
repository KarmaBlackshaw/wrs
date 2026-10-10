# Rider customers page Spec

## Overview

- **Target file:** `src/pages/rider/customers.vue`
- **Owned files (this builder only):** `src/pages/rider/customers.vue`
- **Complexity:** `[low]`
- **Wave:** 7 · **Depends-on:** rider-customer-search-list (6), customer-store (3), customer-utils (2)

## Responsibility

Supply the Release row action (BR-26) to the rider's customer list.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-best-practices` (imperative confirm via `useConfirm`, Standards.md §Principles).
- **Builder MUST invoke before coding (action skills):** none
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` (release due/overdue → immediate + toast; release not-due → confirm with "Due in N day(s) (date)"; cancel keeps it; history logs released / released_early).

## Public API

Route page `/rider/customers` (unchanged).

## State & data

- Keep existing `openTrip`, `deliverTo`, the no-trip empty state.
- Hoists: `const authStore = useAuthStore(); const customerStore = useCustomerStore(); const confirmDialog = useConfirm(); const toast = useToast();`
- `isMine(customer: TCustomer)` → `customer.riderId === authStore.user?.id`.
- `releaseLabel(customer: TCustomer)` → `` `Release ${fullName(customer)}` `` (aria-label).
- `async function release(customer: TCustomer)`:
  ```
  const dueState = customerDueState(customer);
  if (dueState.status === "not_due" && dueState.dueOn != null && dueState.daysUntilDue != null) {
    const days = dueState.daysUntilDue;
    const isConfirmed = await confirmDialog.confirm({
      title: "Release customer",
      message: `Due in ${days} ${days === 1 ? "day" : "days"} (${formatDate(dueState.dueOn)}). Release anyway?`,
      confirmLabel: "Release",
      variant: "danger",
    });
    if (!isConfirmed) return;
  }
  customerStore.release(customer.id);
  toast.show(`Released ${fullName(customer)}`);
  ```
  (`useConfirm().confirm` takes `TConfirmOptions { title, message, confirmLabel?, variant? }`. The store picks `released_early` vs `released`.)
- Template: `<RiderCustomerSearchList v-else :get-to="deliverTo"><template #row-action="{ customer }"><UiButton v-if="isMine(customer)" variant="ghost" size="lg" :aria-label="releaseLabel(customer)" @click="release(customer)">Release</UiButton></template></RiderCustomerSearchList>` — Release only on the rider's own rows (Mine, or own rows under All).

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `useOpenTrip`, `useAuthStore`, `useCustomerStore`, `useConfirm`, `useToast`, `fullName`, `customerDueState`, `formatDate`; components.
- **Explicit imports needed:** keep `import { ROUTES } from "@/types"` and `import type { TCustomer } from "@/types"`.

## i18n

N/A.

## Conventions checklist

- [ ] Confirm is the imperative `await confirmDialog.confirm(...)`, bound to `isConfirmed` before branching.

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

- [ ] As emp-3 with the open trip: cust-1 (overdue) → Release → no confirm, toast "Released Aling Rosa Hernandez", row leaves Mine, appears as "Open" under All.
- [ ] A not-due own customer (e.g. deliver to cust-5 first — interval 7 — then release) → confirm "Due in 7 days (8 Oct 2026). Release anyway?"; Cancel keeps it; Release logs `released_early`.
- [ ] No Release button on other riders' or open rows; none on the deliver-page picker.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/pages/rider/customers.vue --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/pages/rider/customers.vue"` → must print nothing.
