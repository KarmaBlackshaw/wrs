# RiderIntervalField Spec

## Overview

- **Target file:** `src/components/rider/IntervalField.vue` (new) → auto-registered `<RiderIntervalField>`
- **Owned files (this builder only):** `src/components/rider/IntervalField.vue`
- **Complexity:** `[low]`
- **Wave:** 1 · **Depends-on:** none

## Responsibility

Let a rider enter a delivery interval in days, with 7/14/30 quick-pick buttons.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-best-practices`, `web-component-design`, `ui-ux-pro-max` (mobile: 44px targets, numeric keypad, pressed state announced).
- **Builder MUST invoke before coding (action skills):** none
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `design-review`. Its flows are driven via the add sheet / interval prompt `qa`.

## Public API

- **Two-way binding:** `const model = defineModel<string>({ default: "" })` — the raw text value (UiField is string-based; consumers parse with `parseIntervalDays`).
- **Props / events / slots:** none.

## State & data

- `const PRESETS = ["7", "14", "30"]` as a script const (no inline array in template).
- Template: `flex flex-col gap-3` containing
  - `<UiField v-model="model" label="Days between deliveries" type="number" inputmode="numeric" min="1" />` (`UiField` forwards unknown attrs to the `<input>`; it has `label`, `type`, `hint`, `error` props).
  - a `flex gap-2` row: for each preset a `<UiButton variant="secondary" size="lg" :aria-pressed="model === preset" @click="model = preset">{{ preset }} days</UiButton>` (`UiButton` sizes: sm h-8, md h-10, lg h-11; variants primary/secondary/ghost/danger). Give the pressed one a visual cue via a `:class` binding on the button (e.g. `ring-2 ring-brand-600`) — computed in script via a function `presetClass(preset)` if more than a one-liner.

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `defineModel` macro, `UiField`, `UiButton`.
- **Explicit imports needed:** none.
- **Third-party:** none.

## i18n

N/A.

## Conventions checklist

- [ ] No parsing/validation here (YAGNI) — consumers own validity via `parseIntervalDays`.

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

- [ ] Typing a number updates `v-model`; tapping "7 days"/"14 days"/"30 days" sets `"7"`/`"14"`/`"30"`.
- [ ] The selected preset exposes `aria-pressed="true"`.
- [ ] Input shows numeric keypad on mobile (`inputmode="numeric"`), `min="1"`.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/components/rider/IntervalField.vue --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/components/rider/IntervalField.vue"` → must print nothing.
