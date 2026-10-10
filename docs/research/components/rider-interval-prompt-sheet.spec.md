# RiderIntervalPromptSheet Spec

## Overview

- **Target file:** `src/components/rider/IntervalPromptSheet.vue` (new) → auto-registered `<RiderIntervalPromptSheet>`
- **Owned files (this builder only):** `src/components/rider/IntervalPromptSheet.vue`
- **Complexity:** `[low]`
- **Wave:** 4 · **Depends-on:** customer-store (3), customer-utils (2), rider-interval-field (1)

## Responsibility

Ask the rider, right after claiming a customer by delivery, to set that customer's delivery interval (skippable).

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-best-practices`, `ui-ux-pro-max` (Esc/backdrop = the safe "skip" path; primary action last; 44px buttons).
- **Builder MUST invoke before coding (action skills):** none
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` (claim → prompt → save/skip/Esc all land on the rider home), `design-review`.

## Public API

- **Two-way binding:** `const open = defineModel<boolean>("open", { default: false })` (same as `src/components/cashier/CustomerPickerSheet.vue:5`; consumer uses `v-model:open`).
- **Props:** `customerId: string`.
- **Emits:** `settle: []` — fired exactly once each time the sheet closes, whatever the path (save, Skip, Esc, backdrop, X).
- **Slots:** none.

## State & data

- `const customerStore = useCustomerStore(); const toast = useToast();`
- `interval = ref("")`; `days = computed(() => parseIntervalDays(interval.value))`; `canSave = computed(() => days.value != null)`.
- `customerLabel = computed(() => { const customer = customerStore.findCustomer(customerId); return customer ? fullName(customer) : "this customer"; })`.
- `watch(open, (isOpen) => { if (isOpen) { interval.value = ""; return; } emit("settle"); })`.
- `save()`: `const value = days.value; if (value == null) return;` → `customerStore.setDeliveryInterval(customerId, value)` → `toast.show("Delivery interval saved")` → `open.value = false`.
- `skip()`: `open.value = false`.
- Template: `<UiBottomSheet v-model:open="open" title="Delivery interval">` body `flex flex-col gap-4`: `<p class="text-base text-zinc-700">How often does {{ customerLabel }} need a delivery?</p>` + `<RiderIntervalField v-model="interval" />`; `#footer` → `<div class="flex justify-end gap-2"><UiButton variant="ghost" size="lg" @click="skip">Skip for now</UiButton><UiButton size="lg" :disabled="!canSave" @click="save">Save interval</UiButton></div>` (footer pattern from the deliver page sheets).

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `ref`, `computed`, `watch`, `useCustomerStore`, `useToast`, `parseIntervalDays`, `fullName`; `UiBottomSheet`, `UiButton`, `RiderIntervalField`.
- **Explicit imports needed:** none.

## i18n

N/A.

## Conventions checklist

- [ ] `UiBottomSheet` already closes on Esc (`<dialog>` `close` event) and backdrop click and sets `open` false — rely on the `watch`, don't add key handlers.

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

- [ ] Save with "7" → customer's `deliveryIntervalDays` = 7, toast, sheet closes, `settle` emitted once.
- [ ] Skip / Esc / backdrop / X → no interval change, `settle` emitted once.
- [ ] Save disabled for blank, 0, non-integer.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/components/rider/IntervalPromptSheet.vue --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/components/rider/IntervalPromptSheet.vue"` → must print nothing.
