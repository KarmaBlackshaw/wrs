# Owner approvals (customer kind) Spec

## Overview

- **Target file:** `src/pages/owner/approvals.vue`
- **Owned files (this builder only):** `src/pages/owner/approvals.vue`
- **Complexity:** `[low]`
- **Wave:** 4 · **Depends-on:** customer-store (3), customer-types (1)

## Responsibility

Show pending-customer reviews in the approvals queue with View customer + Approve only (spec §3.2, user decision 4).

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-best-practices`, `vue-pinia-best-practices`.
- **Builder MUST invoke before coding (action skills):** none
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` — queue shows "New customer: Teresita Navarro" (by Ligaya Santos) and "New customer: Josefina Ramos" (by Corazon Villanueva); View customer opens the detail; Approve removes the row and the customer is active.

## Public API

N/A (route page).

## State & data — edits

- Hoist `const customerStore = useCustomerStore();`.
- `const rows = computed(() => [...approvals, ...customerStore.customerApprovals]);` → bind `:rows="rows"` (was the static mock at line 100).
- `approvalActions` (line 34):
  - View customer for `credit`, `waiver` AND `customer` kinds (extend the kind test at line 36; move the kind list into a script const, e.g. `const CUSTOMER_KINDS: TApprovalKind[] = ["credit", "waiver", "customer"]`, test with `.includes`).
  - For `approval.kind === "customer"`: push ONLY `{ label: "Approve", icon: IconCheck, variant: "primary", onSelect: () => approveCustomer(approval) }` — no Reject — then return. Other kinds keep Approve + Reject + `handled` logic unchanged.
- `approveCustomer(approval: TApproval)`: `customerStore.approve(approval.refId)`; `toast.show("Customer approved")`. No confirm dialog (same as the detail page Approve bar; approval is reversible via edit). The row disappears because `customerApprovals` derives from pending customers.
- `#cell-details`: add a branch for `row.kind === 'customer'` showing phone and address muted (`flex flex-col gap-0.5 text-sm text-zinc-600`). Resolve the customer in script with a named function (e.g. `customerFor(refId)` → `findCustomer(refId)`) — no inline lookups beyond a call; use `v-else-if` with a bound value; no new `!` assertions (use a `v-if` guard on the function result; if you need it twice, compute a `detailsByApprovalId` map in a `computed`).

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `computed`, `useCustomerStore`, `useCustomerLookup`, `useToast`, `useConfirm`, `useEmployeeLookup`, `formatDateTime`.
- **Explicit imports needed:** existing icon imports; add `TApprovalKind` to the existing `import type { … } from "@/types"` if used.

## i18n

N/A.

## Conventions checklist

- [ ] Don't touch the loan/void/credit/waiver flows beyond the kind list.
- [ ] Existing `loanFor(row.refId)!` assertions are pre-existing — leave them, don't add new ones.

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

- [ ] Table has the 4 static rows + 2 customer rows on first load.
- [ ] Customer rows: summary "New customer: {First Last}", Requested by = creator name, Details = phone + address, actions = View customer + Approve (no Reject).
- [ ] Approve → toast "Customer approved", row gone, customer `status` active.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/pages/owner/approvals.vue --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/pages/owner/approvals.vue"` → must print nothing.
