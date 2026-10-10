# Rider deliver page Spec

## Overview

- **Target file:** `src/pages/rider/trip/[id]/deliver/[[customerId]].vue`
- **Owned files (this builder only):** `src/pages/rider/trip/[id]/deliver/[[customerId]].vue`
- **Complexity:** `[med]`
- **Wave:** 5 · **Depends-on:** rider-interval-prompt-sheet (4), ui-notice (1), customer-store (3), customer-utils (2)

## Responsibility

Record a delivery against the store so an open customer is claimed (BR-24), a covered customer is not (BR-25), and the interval prompt follows a claim when the interval is missing.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-best-practices`, `vue-pinia-best-practices`.
- **Builder MUST invoke before coding (action skills):** `investigate` (gstack) — only if the claim/prompt/navigation ordering misbehaves in your reasoning or checks.
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` (as emp-3: deliver to open cust-13 → claimed toast + interval prompt → home; deliver to emp-4's cust-2 → covering notice, ownership unchanged; deliver to own cust-1 → plain save, Overdue cleared), `design-review` (notices).

## Public API

Route page (unchanged route).

## State & data — edits

- Remove `import { customers } from "@/mocks/customers"`. Hoist `const authStore = useAuthStore(); const customerStore = useCustomerStore(); const { employeeName } = useEmployeeLookup();`.
- `customer` (line 28) → `computed(() => (customerId.value ? customerStore.findCustomer(customerId.value) : undefined))` — `undefined` sentinel, not `null`. Grep this file for every `customer` null-compare/`?? null` and keep them truthiness/`!= null` based (current reads use `?.`/`!customer.value` — keep).
- `customerLabel = computed(() => (customer.value ? fullName(customer.value) : undefined))` → use for: `UiPageHeader :subtitle="customerLabel"` (line 146), the Customer card name (155), "Credit balance for …" (217), confirm dialog (232), and the `blockReason` deposit message (97: `` `Deposit required, ${customerLabel.value ?? "customer"} has no deposit on file` ``).
- Ownership notice (above the Customer card, inside the `v-else` template):
  - `ownershipNotice = computed(() => { const riderId = customer.value?.riderId; if (!customer.value) return undefined; if (riderId == null) return { tone: "info", message: "This customer is open. Confirming will add them to your customers." }; if (riderId !== authStore.user?.id) return { tone: "neutral", message: \`Covering for ${employeeName(riderId)}. This customer stays with them.\` }; return undefined; })`— annotate the return so`tone`is`TTone`(e.g.`computed((): { tone: TTone; message: string } | undefined => …)`).
  - `<UiNotice v-if="ownershipNotice" :tone="ownershipNotice.tone">{{ ownershipNotice.message }}</UiNotice>`.
- `confirmDelivery()` (line 133) becomes:
  ```
  const current = customer.value; if (!current) return;
  confirmOpen.value = false;
  const { isClaimed } = customerStore.recordDelivery(current.id);
  toast.show(isClaimed ? `Delivered. ${fullName(current)} added to your customers` : "Saved");
  const shouldPromptInterval = isClaimed && current.deliveryIntervalDays == null;
  if (shouldPromptInterval) { intervalCustomerId.value = current.id; intervalSheetOpen.value = true; return; }
  router.push(ROUTES.RIDER.INDEX);
  ```
  `recordDelivery` MUST run before any `router.push`. Claimer is the signed-in user (store handles it) — never `trip.riderId`.
- Interval prompt: `intervalSheetOpen = ref(false)`, `intervalCustomerId = ref<string>()`; template (outside the `v-else` block so it survives any re-render): `<RiderIntervalPromptSheet v-if="intervalCustomerId" v-model:open="intervalSheetOpen" :customer-id="intervalCustomerId" @settle="goHome" />`; `goHome()` → `router.push(ROUTES.RIDER.INDEX)`. The prompt emits `settle` on save/skip/Esc/backdrop; delivery is already saved before it opens.
- The customer picker (`<RiderCustomerSearchList v-else-if="!customer" :get-to="pickCustomer" />`) stays as is — it gets Add customer from the list component and supplies NO release slot (user decision 7).
- Leave `trip`, `lastDelivery`, deposit, payment logic untouched.

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `ref`, `computed`, `watch`, `useRoute`, `useRouter`, `useToast`, `useAuthStore`, `useCustomerStore`, `useEmployeeLookup`, `fullName`, `currentPrice`, `creditBlockReason`, `padToCentavos`, `formatMoney`, `PAYMENT_*`; components `UiNotice`, `RiderIntervalPromptSheet`, `RiderCustomerSearchList`, `Ui*`.
- **Explicit imports needed:** keep existing mock imports except customers; add `TTone` to `import type { … } from "@/types"`.

## i18n

N/A.

## Conventions checklist

- [ ] No `customer.name` anywhere in the file.
- [ ] Notice data decided in script; template only renders it.

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

- [ ] Open customer (cust-13) shows the info notice; confirm → toast "Delivered. Marilou Espino added to your customers", interval prompt opens (no interval), save/skip → `/rider`; cust-13 now in emp-3's Mine with a `claimed_by_delivery` history row.
- [ ] Open customer that already has an interval → no prompt, straight home.
- [ ] emp-4's cust-2 as emp-3 → neutral notice "Covering for Ramil Bautista. This customer stays with them."; confirm → "Saved", rider unchanged.
- [ ] Own customer → no notice; confirm → "Saved"; `lastDeliveredAt` updated (cust-1 no longer overdue).
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint "src/pages/rider/trip/[id]/deliver/[[customerId]].vue" --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "deliver/[[customerId]].vue"` → must print nothing.
