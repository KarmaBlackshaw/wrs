# CustomerDistributeSheet Spec

## Overview

- **Target file:** `src/components/customer/DistributeSheet.vue` (new) → auto-registered `<CustomerDistributeSheet>`
- **Owned files (this builder only):** `src/components/customer/DistributeSheet.vue`
- **Complexity:** `[med]`
- **Wave:** 4 · **Depends-on:** customer-utils (2, `proposeDistribution`), customer-store (3, `customers` for current counts), customer-types (1, `TCustomerAssignment`)
- Same folder as `customer/Form.vue` (customer-form, also wave 4) — different file, no collision.

## Responsibility

Let the owner turn a given set of customers into a confirmed per-customer rider assignment (pick targets → proposed even split → adjust rows → confirm), emitting it for the consumer to apply.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-best-practices` (reactive props destructure, `defineModel`, `watch` reset), `web-component-design` (consumer-agnostic: the sheet never calls a store action — it emits `confirm`; no per-consumer booleans), `ui-ux-pro-max` (fieldset/legend for the target checkboxes, 44px+ targets, primary action last, disabled confirm until every row has a rider).
- **Builder MUST invoke before coding (action skills):** none
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` (from `/owner/customers?rider=emp-3`: Distribute → pick targets → proposal → change a row → confirm → rows move, history logs `reassigned`), `design-review` (sheet layout with ~15 rows, select listbox inside the modal `<dialog>` renders in the top layer).

## Public API

- **Two-way binding:** `const open = defineModel<boolean>("open", { default: false })` (consumer uses `v-model:open`, same as `src/components/rider/IntervalPromptSheet.vue`).
- **Props:** `customers: TCustomer[]` (the customers to move — the consumer passes a snapshot), `sourceRiderId: string` (their current rider; excluded from targets).
- **Emits:** `confirm: [assignments: TCustomerAssignment[]]` — one entry per customer, emitted once on Confirm, after which the sheet closes itself (`open.value = false`). Cancel / Esc / backdrop / X close without emitting.
- **Slots:** none.
- **Reuse point (do not build now):** this is the sheet spec §8 absence coverage will reuse ("same sheet as §3.6, temporary instead of permanent"). Permanent vs temporary is decided by the consumer's `confirm` handler (today: `customerStore.distribute`; later: a coverage action). If §8 needs to narrow the candidate riders (riders working that day), add a generic prop then — never a consumer boolean. Nothing here references "permanent".

## State & data

- Hoists: `const customerStore = useCustomerStore(); const { employeeName, riders } = useEmployeeLookup();`
- Props: `const { customers, sourceRiderId } = defineProps<{ customers: TCustomer[]; sourceRiderId: string }>();` `const emit = defineEmits<{ confirm: [assignments: TCustomerAssignment[]] }>();`
- `const sourceName = computed(() => employeeName(sourceRiderId));`
- `const currentCounts = computed(() => countBy(customerStore.customers.filter((customer) => customer.riderId != null), "riderId"));` (`lodash/countBy` → `Record<string, number>`).
- Candidate targets (every active rider except the source AND except anyone holding the `owner` role — the owner is never a distribution target, user decision; `riders` is `TEmployee[]` from `src/composables/useEmployeeLookup.ts`):
  `const candidates = computed(() => riders.filter((employee) => employee.id !== sourceRiderId && !employee.roles.includes("owner")).map((employee) => ({ value: employee.id, label: employee.name, count: currentCounts.value[employee.id] ?? 0 })));`
- `const selectedRiderIds = ref<string[]>([]);`
  `function toggleTarget(riderId: string) { selectedRiderIds.value = selectedRiderIds.value.includes(riderId) ? selectedRiderIds.value.filter((candidate) => candidate !== riderId) : [...selectedRiderIds.value, riderId]; }` (same toggle as `toggleRole` in `src/pages/owner/people/index.vue:30-32`).
  Keep `selectedRiderIds` in `candidates` order so the proposal tie-break is stable: derive `const targetRiderIds = computed(() => candidates.value.map((option) => option.value).filter((riderId) => selectedRiderIds.value.includes(riderId)));` and use `targetRiderIds` everywhere below.
- `const targetOptions = computed(() => candidates.value.filter((option) => targetRiderIds.value.includes(option.value)).map(({ value, label }) => ({ value, label })));` (`TOption` shape, reused — no new type).
- `const assignment = ref<Record<string, string>>({});` — customerId → riderId.
- `watch(targetRiderIds, (riderIds) => { assignment.value = Object.fromEntries(proposeDistribution(customers, riderIds, currentCounts.value).map(({ customerId, riderId }) => [customerId, riderId])); });` — changing targets re-proposes (manual row edits are dropped; acceptable: targets are picked first, rows adjusted after).
- `function setAssignment(customerId: string, riderId?: string | null) { if (!riderId) { return; } assignment.value = { ...assignment.value, [customerId]: riderId }; }` — `| null` only because `UiSelect`'s model contract is `defineModel<T | null>()` (`src/components/ui/Select.vue:3`).
- Rows (template renders, script decides): `const rows = computed(() => customers.map((customer) => ({ id: customer.id, name: fullName(customer), riderId: assignment.value[customer.id] })));`
- `const assignments = computed(() => customers.flatMap((customer): TCustomerAssignment[] => { const riderId = assignment.value[customer.id]; return riderId ? [{ customerId: customer.id, riderId }] : []; }));`
- `const canConfirm = computed(() => customers.length > 0 && assignments.value.length === customers.length);`
- `watch(open, (isOpen) => { if (isOpen) { selectedRiderIds.value = []; assignment.value = {}; } });` — fresh state every open.
- `function confirm() { if (!canConfirm.value) { return; } emit("confirm", assignments.value); open.value = false; }`
- ``const confirmLabel = computed(() => `Distribute ${customers.length} ${customers.length === 1 ? "customer" : "customers"}`);``

### Template

```
<UiBottomSheet v-model:open="open" title="Distribute customers">
  <div class="flex flex-col gap-5">
    <fieldset class="flex flex-col gap-2">
      <legend class="mb-2 text-sm font-medium text-zinc-700">Move {{ sourceName }}'s customers to</legend>
      <div class="flex flex-wrap gap-2">
        <label v-for="option in candidates" :key="option.value" class="flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 shadow-xs">
          <input type="checkbox" :checked="selectedRiderIds.includes(option.value)" @change="toggleTarget(option.value)" />
          <span class="text-base text-zinc-700">{{ option.label }}</span>
          <span class="text-sm text-zinc-500">{{ option.count }}</span>
        </label>
      </div>
    </fieldset>
    <p v-if="targetRiderIds.length === 0" class="text-sm text-zinc-500">Pick at least one rider to see the proposed split.</p>
    <div v-else class="flex flex-col gap-3">
      <UiSelect v-for="row in rows" :key="row.id" :label="row.name" :options="targetOptions" :model-value="row.riderId" @update:model-value="setAssignment(row.id, $event)" />
    </div>
  </div>
  <template #footer>
    <div class="flex justify-end gap-2">
      <UiButton variant="ghost" size="lg" @click="open = false">Cancel</UiButton>
      <UiButton size="lg" :disabled="!canConfirm" @click="confirm">{{ confirmLabel }}</UiButton>
    </div>
  </template>
</UiBottomSheet>
```

Checkbox label row copies `src/pages/owner/people/index.vue:94-101` (the house multi-select). The muted number after a rider's name is their current customer count (context for the balanced split). `UiBottomSheet` body already scrolls (`overflow-y-auto`); `UiSelect` panels render in the native top layer, so they work inside the modal `<dialog>` — don't teleport anything.

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `ref`, `computed`, `watch`, `useCustomerStore`, `useEmployeeLookup`, `fullName`, `proposeDistribution`; components `UiBottomSheet`, `UiSelect`, `UiButton`.
- **Explicit imports needed:** `import countBy from "lodash/countBy"`; `import type { TCustomer, TCustomerAssignment } from "@/types"`.
- **Third-party:** lodash per-method (installed).

## i18n

N/A.

## Conventions checklist

- [ ] Never calls `customerStore.distribute` (or any store action) — the consumer applies `confirm` (consumer-agnostic; §8 reuse). Reads the store only for `currentCounts`.
- [ ] No consumer-specific props/booleans (`isPermanent`, `showX`…); no toast here (the consumer toasts).
- [ ] Don't modify `UiSelect`, `UiBottomSheet`, `UiButton`.
- [ ] Imperative `useConfirm` is NOT used: the body is rich live content (checkboxes + per-row selects), the declarative `v-model:open` exception in Standards.md §Principles.

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

With the store seed, owner emp-1 signed in, `customers` = Mario's (emp-3) cust-1, cust-5, cust-9, `sourceRiderId="emp-3"`:

- [ ] Candidates = every active rider except Mario Cruz and except owners (Ramil Bautista, Corazon Villanueva — Demo Owner excluded because it holds the owner role), each with its current customer count; no checkbox for Mario or Demo Owner.
- [ ] No target picked → hint text, no rows, confirm disabled.
- [ ] Picking Ramil + Corazon shows 3 `UiSelect` rows labelled with the customers' full names, pre-filled with `proposeDistribution`'s result for those counts; each select offers only the picked targets.
- [ ] Changing a row's rider updates only that row; Confirm (`Distribute 3 customers`) emits `confirm` once with 3 `{ customerId, riderId }` entries reflecting the edit, then the sheet closes.
- [ ] Cancel / Esc / backdrop / X close without emitting; reopening starts with no targets picked.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/components/customer/DistributeSheet.vue --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/components/customer/DistributeSheet.vue"` → must print nothing.
