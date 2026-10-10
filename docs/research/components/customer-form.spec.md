# CustomerForm Spec

## Overview

- **Target file:** `src/components/customer/Form.vue` (new) → auto-registered `<CustomerForm>`
- **Owned files (this builder only):** `src/components/customer/Form.vue`
- **Complexity:** `[med]`
- **Wave:** 4 · **Depends-on:** customer-store (3), customer-utils (2), ui-notice (1)

## Responsibility

Collect a customer's first name, last name, phone, and address, gated by the duplicate guard (BR-22 block on phone, BR-23 warn on name).

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-best-practices`, `web-component-design` (composition over flags: extra fields + duplicate action are slots), `frontend-design`, `ui-ux-pro-max` (errors announced, field-level error + summary notice, autocomplete tokens, disabled submit reason visible).
- **Builder MUST invoke before coding (action skills):** none (no new colours; `UiNotice` supplies tones).
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` (duplicate phone blocks, duplicate name warns then allows, across all 4 consumers), `design-review`.

## Public API

- **Props:** `initial?: TCustomerFields` (prefill; read once on mount), `excludeId?: string` (the customer being edited — excluded from duplicate matching), `submitLabel: string`, `disabled?: boolean` (generic extra gate the consumer uses when its slot fields are invalid; default `false`).
- **Emits:** `submit: [fields: TCustomerFields]` (trimmed values; only emitted when the guard allows).
- **Slots:**
  - default — extra fields rendered after Address and before the submit button (rider interval, owner rider/interval, cashier hint).
  - `duplicate` — scoped `{ customer: TCustomer }`; rendered inside the action row of BOTH duplicate notices so the consumer supplies "Use {name}" / "Open {name}" (or nothing).
- **Two-way bindings:** none (the form owns its field state; consumers remount it with `v-if` on the sheet's open state to reset).

## State & data

- `const customerStore = useCustomerStore()`.
- `firstName`, `lastName`, `phone`, `address` = `ref(initial?.x ?? "")`.
- `duplicate = ref<TCustomerDuplicate>()`; `isNameConfirmed = ref(false)`.
- `fields = computed(() => ({ firstName: firstName.value.trim(), … }))`.
- `checkDuplicate()` → `duplicate.value = findCustomerDuplicate(fields.value, customerStore.customers, excludeId)`.
- `watch(phone, …)` → if current duplicate is a phone match, clear it (re-checked on blur/submit). `watch([firstName, lastName], …)` → `isNameConfirmed = false`; clear a name-match duplicate.
- `isPhoneTaken = computed(() => duplicate.value?.match === "phone")`; `isNameWarning = computed(() => duplicate.value?.match === "name" && !isNameConfirmed.value)`.
- `canSubmit = computed(() => all 4 trimmed fields non-empty && !disabled && !isPhoneTaken.value)`.
- `submit()` (form `@submit.prevent`): return if `!canSubmit`; `checkDuplicate()`; if phone match → return; if name match and not confirmed → return (notice now shows); else `emit("submit", fields.value)`.
- `existingName = computed(() => duplicate.value ? fullName(duplicate.value.customer) : "")`.

### Markup (`<form class="flex flex-col gap-4" novalidate @submit.prevent="submit">`)

1. `<UiField v-model="firstName" label="First name" autocomplete="given-name" />`
2. `<UiField v-model="lastName" label="Last name" autocomplete="family-name" />`
3. `<UiField v-model="phone" label="Phone" type="tel" inputmode="tel" autocomplete="tel" :error="phoneError" @blur="checkDuplicate" />` — `phoneError = computed(() => (isPhoneTaken.value ? "Phone number already in use" : undefined))`. (`UiField` forwards `$attrs` incl. `@blur`/`inputmode`/`autocomplete` to the `<input>`.)
4. `<UiField v-model="address" label="Address" autocomplete="street-address" hint="Free text, landmarks welcome" />`
5. `<slot></slot>`
6. Phone duplicate: `<UiNotice v-if="isPhoneTaken && duplicate" tone="danger">{{ existingName }} already uses this phone number.<template #action><slot name="duplicate" :customer="duplicate.customer"></slot></template></UiNotice>`
7. Name warning: `<UiNotice v-else-if="isNameWarning && duplicate" tone="warn">A customer named {{ existingName }} already exists ({{ duplicate.customer.phone }}). Is this a different person?<template #action><UiButton variant="secondary" size="md" @click="confirmDifferentPerson">Yes, different person</UiButton><slot name="duplicate" :customer="duplicate.customer"></slot></template></UiNotice>` — `confirmDifferentPerson()` sets `isNameConfirmed = true` (the user then presses submit again). Label is neutral so it reads right for add AND edit (UX fragment's "Add anyway" adapted).
8. `<UiButton type="submit" block size="lg" :disabled="!canSubmit">{{ submitLabel }}</UiButton>`

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `ref`, `computed`, `watch`, `useCustomerStore`, `findCustomerDuplicate`, `fullName`; components `UiField`, `UiNotice`, `UiButton`.
- **Explicit imports needed:** `import type { TCustomer, TCustomerDuplicate, TCustomerFields } from "@/types"` (only what's used).
- **Third-party:** none.

## i18n

N/A.

## Conventions checklist

- [ ] Consumer-agnostic: no role/consumer props (`showInterval`, `isOwner`, `showUseExisting`…) — extra fields and duplicate actions come ONLY through slots (Standards.md §Principles, user decision 7).
- [ ] Guard runs on phone blur AND on submit; phone comparison is digits-only (via `findCustomerDuplicate`).
- [ ] Danger notice uses `role="alert"` (UiNotice does this for `tone="danger"`); warn uses `status`.

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

- [ ] Entering phone `09170000001` then blurring shows the danger notice "Aling Rosa Hernandez already uses this phone number.", the phone field error, and disables submit; editing the phone clears it.
- [ ] With `excludeId="cust-1"` the same phone produces no notice.
- [ ] First "Aling Rosa" + last "Hernandez" + a new phone → submit shows the warn notice and does NOT emit; "Yes, different person" then submit emits `submit` with trimmed fields.
- [ ] `initial` prefills all four fields; `disabled` blocks submit.
- [ ] `duplicate` slot content appears inside both notices with the matched customer.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/components/customer/Form.vue --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/components/customer/Form.vue"` → must print nothing.
