# CashierCustomerPickerSheet Spec

## Overview

- **Target file:** `src/components/cashier/CustomerPickerSheet.vue`
- **Owned files (this builder only):** `src/components/cashier/CustomerPickerSheet.vue`
- **Complexity:** `[med]`
- **Wave:** 5 · **Depends-on:** customer-form (4), customer-store (3)

## Responsibility

Let a cashier search for a customer or quick-add one (open + pending, BR-21) and emit the pick.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-best-practices`, `vue-pinia-best-practices`, `web-component-design`.
- **Builder MUST invoke before coding (action skills):** none (builders must not start vite — it rewrites the generated barrels; the render-check happens in Phase 5 `qa`/`design-review`).
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` (cashier quick-add: duplicate phone → Use existing selects them; new customer → selected, appears in owner approvals), `design-review`.

## Public API (unchanged for consumers `sell.vue`, `collect.vue`, `return-container.vue`)

- `v-model:open` (`defineModel<boolean>("open", { default: false })`), props `title = "Select customer"`, `allowQuickAdd = true`, emit `select: [customer: TCustomer]`.

## State & data

- Remove `import { customers as baseCustomers } from "@/mocks/customers"`, `extraCustomers`, `allCustomers`, `newName/newPhone/newAddress`, `canAdd`.
- Hoist `const customerStore = useCustomerStore();`.
- `results = useCustomerSearch(query)` (default source is now the store, so newly created customers appear).
- `reset()` → `query = ""`, `adding = false`.
- `addCustomer(fields: TCustomerFields)` → `const customer = customerStore.create(fields); pick(customer);` (store decides open + pending from the cashier's active role — do not set status/rider here).
- Template:
  - Search view: list button text `{{ fullName(customer) }}` (was `customer.name`, line 78). Rest unchanged.
  - Add view (`v-else`): replace the three `UiField`s + button row with
    ```
    <CustomerForm submit-label="Add and select" @submit="addCustomer">
      <p class="text-sm text-zinc-500">New customers are reviewed by the owner.</p>
      <template #duplicate="{ customer }">
        <UiButton variant="secondary" size="md" @click="pick(customer)">Use {{ fullName(customer) }}</UiButton>
      </template>
    </CustomerForm>
    <UiButton variant="ghost" block @click="adding = false">Back to search</UiButton>
    ```
    Because the add view is behind `v-if="!adding"`/`v-else`, the form remounts fresh on each open — no manual field reset.
  - Sheet title stays `adding ? 'Quick-add customer' : title` (move the ternary into a `computed` `sheetTitle` — template renders, script decides).

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `ref`, `computed`, `useCustomerStore`, `useCustomerSearch`, `fullName`; `CustomerForm`, `UiBottomSheet`, `UiSearchInput`, `UiButton`.
- **Explicit imports needed:** `import type { TCustomer, TCustomerFields } from "@/types"`.

## i18n

N/A.

## Conventions checklist

- [ ] No rider control in the cashier form (spec §4 Cashier).
- [ ] No local customer arrays — the store is the only source.

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

- [ ] Quick-add with phone `09170000002` shows the danger notice with "Use Mang Tomas Villaruel"; tapping it emits `select` with cust-2 and closes.
- [ ] Quick-add of a new person emits `select` with a customer that is open + `status: "pending"` and appears in `/owner/approvals`.
- [ ] Search matches first/last/full name, address, phone; list shows full names.
- [ ] `allowQuickAdd=false` consumers (collect, return-container) unaffected.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/components/cashier/CustomerPickerSheet.vue --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/components/cashier/CustomerPickerSheet.vue"` → must print nothing.
