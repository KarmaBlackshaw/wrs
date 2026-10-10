# CustomerOwnershipHistory Spec

## Overview

- **Target file:** `src/components/customer/OwnershipHistory.vue` (new) → auto-registered `<CustomerOwnershipHistory>`
- **Owned files (this builder only):** `src/components/customer/OwnershipHistory.vue`
- **Complexity:** `[low]`
- **Wave:** 4 · **Depends-on:** customer-store (3), customer-types (1)

## Responsibility

Show one customer's ownership-change log as a table (BR-29).

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-best-practices`.
- **Builder MUST invoke before coding (action skills):** none
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` (history grows after reassign/release on the owner detail page), `design-review`.

## Public API

- **Props:** `customerId: string`.
- **Emits / slots / models:** none.

## State & data

- `const customerStore = useCustomerStore(); const { employeeName } = useEmployeeLookup();`
- `columns` const: `[{ key: "date", label: "Date" }, { key: "change", label: "Change" }, { key: "rider", label: "Rider" }, { key: "by", label: "By" }]` (design §4 lists date, event, rider, by).
- `rows = computed(() => customerStore.historyFor(customerId).map((entry) => ({ id: entry.id, date: entry.createdAt, change: CUSTOMER_OWNERSHIP_EVENT_LABEL[entry.event], rider: entry.riderId ? employeeName(entry.riderId) : "Open", by: employeeName(entry.byEmployeeId) })))` — newest first comes from `historyFor`.
- Template — follow the "Delivery history" table in `src/pages/owner/customers/[id].vue:143-152`:
  `<UiDataTable title="Ownership history" :columns="columns" :rows="rows" :row-key="(row) => row.id">` with `#cell-date="{ row }"` → `{{ formatDateTime(row.date) }}` and `#empty` → `<UiEmptyState title="No ownership changes yet" />`.
- Every column key MUST exist on the row object (UiDataTable renders `row[key]`; a missing key renders blank with vue-tsc still green).

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `computed`, `useCustomerStore`, `useEmployeeLookup`, `CUSTOMER_OWNERSHIP_EVENT_LABEL`, `formatDateTime`; `UiDataTable`, `UiEmptyState`.
- **Explicit imports needed:** none.

## i18n

N/A.

## Conventions checklist

- [ ] "Open" shown as plain text in the Rider cell (it's a table, not a tag row).

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

- [ ] For `cust-2`: 3 rows newest first — Reassigned / Ramil Bautista / Demo Owner, Claimed by delivery / Mario Cruz / Mario Cruz, Created / Open / Demo Owner; dates via `formatDateTime`.
- [ ] Reacts to new events (computed over store state).
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/components/customer/OwnershipHistory.vue --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/components/customer/OwnershipHistory.vue"` → must print nothing.
