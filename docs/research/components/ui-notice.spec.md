# UiNotice Spec

## Overview

- **Target file:** `src/components/ui/Notice.vue` (new) → auto-registered as `<UiNotice>`
- **Owned files (this builder only):** `src/components/ui/Notice.vue`
- **Complexity:** `[low]`
- **Wave:** 1 · **Depends-on:** none

## Responsibility

Render one inline, tone-coloured notice box with a message and optional actions.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `web-component-design`, `tailwind-design-system`, `ui-ux-pro-max` (a11y: live-region role by severity, icon + text never colour alone, 44px targets are the caller's buttons).
- **Builder MUST invoke before coding (action skills):** none (no hex; only existing Tailwind palette).
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `design-review` (visual consistency with `UiStatusPill` tones). Runtime flow is exercised by consumers' `qa`.

## Public API

- **Props:** `tone?: TTone` (from `@/types`; `"ok" | "warn" | "danger" | "neutral" | "info"`), default `"info"`.
- **Outputs / events:** none.
- **Slots:** default = message content (required in practice); `action` (optional) = buttons row, rendered only when provided (`$slots.action`).
- **Two-way bindings:** none.
- **Generic / consumer-agnostic:** no other props. Never add consumer-specific props later.

## State & data

- Static maps in script (template renders, script decides):
  - `toneClasses: Record<TTone, string>` — container: `ok: "bg-emerald-50 text-emerald-900 ring-emerald-600/20"`, `warn: "bg-amber-50 text-amber-900 ring-amber-600/25"`, `danger: "bg-red-50 text-red-900 ring-red-600/20"`, `neutral: "bg-zinc-50 text-zinc-800 ring-zinc-500/20"`, `info: "bg-brand-50 text-brand-900 ring-brand-600/20"` (same palette family as `src/components/ui/StatusPill.vue`).
  - `toneIcons: Record<TTone, { icon: Component; class: string }>` — `ok` CheckCircleFill `text-emerald-600`, `warn` WarningFill `text-amber-600`, `danger` XCircleFill `text-red-600`, `neutral` InfoFill `text-zinc-500`, `info` InfoFill `text-brand-700` (mirrors `src/components/ui/Toast.vue` `toneIcons`).
  - `role = computed(() => (tone === "danger" ? "alert" : "status"))`.
- Markup: root `<div :role>` with `flex items-start gap-3 rounded-xl p-3 text-sm ring-1 ring-inset` + tone class; `<component :is="…icon" class="mt-0.5 size-5 shrink-0" …/>`; right column `flex min-w-0 flex-1 flex-col gap-2` containing `<div><slot></slot></div>` and, if `$slots.action`, `<div class="flex flex-wrap gap-2"><slot name="action"></slot></div>`.

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `computed`.
- **Explicit imports needed:** `import type { Component } from "vue"`; `import type { TTone } from "@/types"`; icon SFCs by file path exactly like `Toast.vue` does (`import IconCheckCircleFill from "@/components/icon/CheckCircleFill.vue"`, `…/WarningFill.vue`, `…/XCircleFill.vue`, `…/InfoFill.vue`) — they are passed as values to `:is`, and path imports avoid a barrel cycle inside `ui/`.
- **Third-party:** none.

## i18n

N/A.

## Conventions checklist

- [ ] Palette verified: `amber-*`, `red-*`, `emerald-*`, `zinc-*`, `brand-*` all resolve (Tailwind v4 defaults + `@theme inline` brand alias in `src/assets/style.css`); no new tokens, no hex.
- [ ] Icon is decorative (the SFCs already carry `aria-hidden`); message text carries meaning.

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

- [ ] `<UiNotice tone="danger">x</UiNotice>` renders `role="alert"`; every other tone renders `role="status"`.
- [ ] Action row appears only when an `action` slot is passed.
- [ ] Default tone is `info`; all 5 `TTone` keys mapped (both maps typed `Record<TTone, …>`).
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/components/ui/Notice.vue --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/components/ui/Notice.vue"` → must print nothing (errors elsewhere from the in-flight customer migration are expected; ignore).
