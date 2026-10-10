# Customer mocks Spec

## Overview

- **Target file:** `src/mocks/customers.ts`
- **Owned files (this builder only):** `src/mocks/customers.ts`, `src/mocks/customerOwnership.ts` (new)
- **Complexity:** `[low]`
- **Wave:** 2 · **Depends-on:** customer-types (wave 1)

## Responsibility

Reshape the customer seed data to the new contract and seed a coherent ownership history.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** none.
- **Builder MUST invoke before coding (action skills):** none
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` — the demo (Overdue on cust-1, pending approvals, open customers, history rows) is only visible if this seed is right.

## Public API

- `src/mocks/customers.ts`: `export const customers: TCustomer[]` (same export name).
- `src/mocks/customerOwnership.ts`: `export const customerOwnership: TCustomerOwnership[]`.

## State & data

### customers.ts — edit every one of the 15 records

1. Replace `name` with `firstName` + `lastName`: last whitespace token = `lastName`, the rest = `firstName` (display `fullName` stays identical). E.g. `"Aling Rosa Hernandez"` → `firstName: "Aling Rosa", lastName: "Hernandez"`; `"Mang Tomas Villaruel"` → `"Mang Tomas"`/`"Villaruel"`.
2. Keep every existing `riderId` exactly as on disk (cust-1..11 have one; cust-12..15 have none = open). Place new fields right after `riderId` (or after `phone` for records without it): `status`, `deliveryIntervalDays`.
3. `status`: `"active"` for all EXCEPT `cust-11` (`"pending"`, rider-created by emp-7) and `cust-15` (`"pending"`, cashier-created, open).
4. `deliveryIntervalDays`: cust-1 `3`, cust-2 `7`, cust-3 `5`, cust-4 `7`, cust-5 `7`, cust-6 `10`, cust-7 `14`, cust-8 `7`, cust-9 `5`, cust-10 `10`, cust-11 `7`; cust-12..15 omit (open / walk-in, no interval).
5. Do NOT add `lastDeliveredAt` — the store derives it from `deliveries` in `src/mocks/trips.ts`.

### customerOwnership.ts — new, `import type { TCustomerOwnership } from "@/types"`

Ids `own-1`, `own-2`, … in order. `riderId` = owner AFTER the event (omit the key when open). Exactly one `created` event per customer.

- cust-1: `created` by `emp-1` (open, no riderId) `2026-09-01T09:00:00+08:00`; `claimed_by_delivery` riderId `emp-3` by `emp-3` at `2026-09-25T07:15:00+08:00` (del-1, trip-1 rider emp-3).
- cust-2: `created` by `emp-1` open `2026-09-01T09:00:00+08:00`; `claimed_by_delivery` riderId `emp-3` by `emp-3` at `2026-09-25T07:45:00+08:00` (del-2); `reassigned` riderId `emp-4` by `emp-1` at `2026-09-26T09:00:00+08:00` (matches on-disk riderId emp-4).
- cust-4: `created` by `emp-1` open `2026-09-01T09:00:00+08:00`; `claimed_by_delivery` riderId `emp-4` by `emp-4` at `2026-09-26T08:05:00+08:00` (del-3, trip-2 rider emp-4); `reassigned` riderId `emp-1` by `emp-1` at `2026-09-27T09:00:00+08:00` (matches on-disk emp-1).
- cust-3, 5, 6, 7, 8, 9, 10: `created` riderId = its on-disk riderId, `byEmployeeId` = that same rider, `2026-09-01T09:00:00+08:00` (rider-created, approved since).
- cust-11: `created` riderId `emp-7` by `emp-7` at `2026-09-28T10:00:00+08:00` (pending).
- cust-12: `created` by `emp-1` open `2026-09-01T09:00:00+08:00`; `claimed_by_delivery` riderId `emp-3` by `emp-3` `2026-09-10T08:00:00+08:00`; `released_early` (open, no riderId) by `emp-3` `2026-09-20T17:00:00+08:00`.
- cust-13, cust-14: `created` by `emp-1` open `2026-09-01T09:00:00+08:00`.
- cust-15: `created` by `emp-2` (cashier) open `2026-09-29T11:00:00+08:00` (pending).

## Dependencies (imports)

- **Explicit imports needed:** `import type { TCustomer } from "@/types"` (existing) / `import type { TCustomerOwnership } from "@/types"`.
- **Third-party:** none.

## i18n

N/A.

## Conventions checklist

- [ ] Mocks are plain exported arrays, never mutated at runtime (the store copies them).
- [ ] Optional keys omitted, never set to `undefined`/`null`.
- [ ] No other file edited (`src/mocks/approvals.ts` gets NO new row — customer approvals are derived by the store).

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

- [ ] 15 customers, none with `name`; `fullName` of each equals the old `name` string exactly.
- [ ] Statuses/intervals/riderIds exactly as listed.
- [ ] `customerOwnership` has one `created` per customer plus the listed extra events, chronologically ordered per customer.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/mocks/customers.ts src/mocks/customerOwnership.ts --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/mocks/customers.ts" -e "src/mocks/customerOwnership.ts"` → must print nothing.
