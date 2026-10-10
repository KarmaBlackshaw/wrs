# Customer name sweep Spec

## Overview

- **Target file:** multiple read-only consumers of `TCustomer.name` / the customers mock
- **Owned files (this builder only):** `src/pages/cashier/sell.vue`, `src/pages/cashier/collect.vue`, `src/pages/cashier/return-container.vue`, `src/pages/owner/money/index.vue`, `src/utils/reports.ts`
- **Complexity:** `[low]`
- **Wave:** 4 · **Depends-on:** customer-store (3), customer-utils (2)

## Responsibility

Migrate the remaining display-only customer consumers from `customer.name` / the raw mock to `fullName()` / the customer store, with no behaviour change.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-pinia-best-practices` (no store calls at module scope).
- **Builder MUST invoke before coding (action skills):** none
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` — the silent-blank risk (column key `name`) and the module-scope-Pinia crash only show at runtime: open `/owner/money`, `/owner/reports/credit-aging`, `/owner/reports/sales`, `/owner` dashboard, and each cashier page with a picked customer.

## Public API

N/A — edits inside existing files only.

## State & data — exact edits

1. `src/pages/cashier/sell.vue:104`, `src/pages/cashier/collect.vue:49`, `src/pages/cashier/return-container.vue:65`: `{{ customer.name }}` → `{{ fullName(customer) }}`. Nothing else in these files.
2. `src/pages/owner/money/index.vue`:
   - drop `import { customers } from "@/mocks/customers"`; add `const customerStore = useCustomerStore();` (hoisted at top) and filter `customerStore.customers` inside the `groups` computed.
   - SILENT BUG: column `{ key: "name", label: "Customer" }` renders `row.name`, which no longer exists (blank cell, vue-tsc green). Keep the key and add `<template #cell-name="{ row }">{{ fullName(row) }}</template>` to the `UiTable` (UiTable exposes `#cell-<key>` slots — see `src/components/ui/Table.vue:66`).
3. `src/utils/reports.ts`:
   - REMOVE module-scope `const { customerName } = useCustomerLookup();` (line 21) — `useCustomerLookup` now calls `useCustomerStore()`, and a module-scope store call throws "getActivePinia() was called but there was no active Pinia". Leave the `useEmployeeLookup()` module-scope line alone (not store-backed).
   - drop `import { customers } from "@/mocks/customers"` (line 7).
   - `credit-aging` entry's `summary` closure (≈line 64-68): `const customerStore = useCustomerStore();` as its first line, filter `customerStore.customers`.
   - `buildReportTable(slug)` (line 167): hoist `const { customerName } = useCustomerLookup();` and `const customerStore = useCustomerStore();` as the first lines of the function body (before the `switch`); `sales` case keeps calling `customerName(...)`; `credit-aging` case iterates `customerStore.customers` and uses `customer: fullName(customer)` instead of `customer.name` (≈line 278).
   - Both functions are only invoked from component setup/render (`REPORTS.map(... report.summary())` in `src/pages/owner/index.vue`, `buildReportTable` in `src/pages/owner/reports/[report].vue`), so a store call inside them is safe.

Unchanged and verified OK (do NOT edit): `src/pages/owner/sales.vue` and `src/pages/cashier/trips/[id]/reconcile.vue` use `customerName()` (API kept); `src/pages/owner/approvals.vue` is owned by another builder.

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `fullName`, `useCustomerStore`, `useCustomerLookup`, `computed`.
- **Explicit imports needed:** only removals listed above; keep all other imports.

## i18n

N/A.

## Conventions checklist

- [ ] No store/composable call at module scope in `reports.ts`.
- [ ] Hoist `useCustomerStore()` once per function/`<script setup>`; never `useCustomerStore().customers` inline.

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

- [ ] `grep -n "\.name\b" <owned files>` shows no customer `.name` reads (product/employee `.name` are fine).
- [ ] Credit-aging page and credit-aging report show customer names (not blank), e.g. "Mang Tomas Villaruel".
- [ ] `reports.ts` has no top-level `useCustomerLookup()`/`useCustomerStore()` call; no `@/mocks/customers` import in owned files.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/pages/cashier/sell.vue src/pages/cashier/collect.vue src/pages/cashier/return-container.vue src/pages/owner/money/index.vue src/utils/reports.ts --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/pages/cashier/sell.vue" -e "src/pages/cashier/collect.vue" -e "src/pages/cashier/return-container.vue" -e "src/pages/owner/money/index.vue" -e "src/utils/reports.ts"` → must print nothing.
