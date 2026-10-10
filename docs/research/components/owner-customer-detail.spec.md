# Owner customer detail Spec

## Overview

- **Target file:** `src/pages/owner/customers/[id].vue`
- **Owned files (this builder only):** `src/pages/owner/customers/[id].vue`
- **Complexity:** `[med]`
- **Wave:** 5 · **Depends-on:** customer-form (4), customer-ownership-history (4), ui-notice (1), customer-store (3), customer-utils (2)

## Responsibility

Compose the owner's customer page: ownership tags, pending-review Approve bar, edit sheet (details + rider + interval, BR-28), and the ownership history section.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-best-practices`, `vue-pinia-best-practices`, `web-component-design`, `ui-ux-pro-max` (tags are text + tone, never colour alone).
- **Builder MUST invoke before coding (action skills):** none
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` (approve cust-15; reassign cust-1 to Ramil → history row "Reassigned"; set rider Open → "Released"; edit phone to another customer's → blocked), `design-review`.

## Public API

Route page `/owner/customers/:id` (typed `useRoute("/owner/customers/[id]")`, unchanged).

## State & data

Keep everything not listed (stat cards, credit & deposit card + sheet, delivery history table, not-found state).

- Hoists: existing `useEmployeeLookup()` (`employeeName`, `riderOptions`), `useCustomerLookup()` (`findCustomer`, now store-backed and reactive), `useRoute`, `useToast`, `useConfirm`; add `const customerStore = useCustomerStore();`.
- Header: `title` → `displayName = computed(() => (customer.value ? fullName(customer.value) : ""))`; `headerSubtitle` back to `` `${phone} · ${address}` `` (remove the in-flight `riderName` from the subtitle — UX: no ownership info crammed into the subtitle string, don't modify UiPageHeader).
- Tag row directly under `UiPageHeader` (`<div class="flex flex-wrap items-center gap-2 text-sm text-zinc-600">`):
  - rider: `riderLabel = computed(() => customer.value?.riderId ? employeeName(customer.value.riderId) : undefined)` → `<span v-if="riderLabel">Rider: <span class="font-medium text-zinc-900">{{ riderLabel }}</span></span>` else `<UiStatusPill>Open</UiStatusPill>`;
  - `<UiStatusPill v-if="isPending" tone="warn">Pending</UiStatusPill>`;
  - `<UiStatusPill v-if="isOverdue" tone="danger">Overdue</UiStatusPill>`;
  - `<span v-if="intervalLabel">{{ intervalLabel }}</span>` where `intervalLabel` = `` `Every ${n} days` `` when `deliveryIntervalDays != null`.
  - `isPending`, `isOverdue` (`customerDueState(customer).status === "overdue"`) are computeds.
- Approve bar (between header/tags and the stat cards), only when `isPending`:
  `<UiNotice tone="warn">This customer was added by {{ createdBy }} and needs review.<template #action><UiButton size="md" @click="approve">Approve</UiButton><UiButton variant="secondary" size="md" @click="openEditSheet">Edit details</UiButton></template></UiNotice>`
  - `createdBy = computed(() => { const created = customerStore.historyFor(route.params.id).find((entry) => entry.event === "created"); return created ? employeeName(created.byEmployeeId) : "a staff member"; })`.
  - `approve()` → `customerStore.approve(route.params.id)` → `toast.show("Customer approved")`. No confirm (spec §3.2).
- Edit sheet (replace the four in-flight fields + footer):
  - Remove `nameDraft/phoneDraft/addressDraft/canSaveCustomer`. Keep `riderDraft = ref("")` and `riderDraftOptions` (`[{ value: "", label: "Open" }, ...riderOptions]` — keep it a script const). Add `intervalDraft = ref("")`, `isIntervalInvalid = computed(() => intervalDraft.value.trim() !== "" && parseIntervalDays(intervalDraft.value) == null)`.
  - `editInitial = computed(() => customer.value ? { firstName, lastName, phone, address } : undefined)` (typed by inference as `TCustomerFields`-compatible).
  - `openEditSheet()` sets `riderDraft = customer.riderId ?? ""`, `intervalDraft = customer.deliveryIntervalDays != null ? String(customer.deliveryIntervalDays) : ""`, opens the sheet.
  - `submitEdit(fields: TCustomerFields)` → `customerStore.update(route.params.id, { ...fields, riderId: riderDraft.value || undefined, deliveryIntervalDays: parseIntervalDays(intervalDraft.value) })` → `toast.show("Customer saved")` → close. The store logs reassigned/released (BR-29); no extra confirm (spec §3.5).
  - Markup:
    ```
    <UiBottomSheet v-model:open="editSheetOpen" title="Edit customer">
      <CustomerForm v-if="editSheetOpen" :initial="editInitial" :exclude-id="customer.id" submit-label="Save" :disabled="isIntervalInvalid" @submit="submitEdit">
        <div class="flex flex-col gap-1.5">
          <UiSelect v-model="riderDraft" label="Rider" :options="riderDraftOptions" />
          <p class="text-sm text-zinc-500">Changing this is logged in ownership history.</p>
        </div>
        <UiField v-model="intervalDraft" label="Delivery interval" type="number" inputmode="numeric" min="1" hint="Days between deliveries. Leave blank for none." :error="intervalError" />
        <template #duplicate="{ customer: match }">
          <UiButton variant="secondary" size="md" :to="ROUTES.OWNER.CUSTOMERS.DETAIL(match.id)">Open {{ fullName(match) }}</UiButton>
        </template>
      </CustomerForm>
    </UiBottomSheet>
    ```
    `intervalError = computed(() => (isIntervalInvalid.value ? "Enter a whole number of days, 1 or more" : undefined))`. (`UiSelect` has no `hint` prop — hence the sibling `<p>`; don't modify UiSelect.) Duplicate guard on edit runs with `excludeId` = this customer (user decision 2).
- Ownership history: after the "Delivery history" `UiDataTable`, add `<CustomerOwnershipHistory :customer-id="customer.id" />`.

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `ref`, `computed`, `useRoute`, `useToast`, `useConfirm`, `useEmployeeLookup`, `useCustomerLookup`, `useCustomerStore`, `fullName`, `customerDueState`, `parseIntervalDays`, `formatDateTime`, `formatMoney`, `AGING_*`, `PAYMENT_LABEL`; components `UiNotice`, `CustomerForm`, `CustomerOwnershipHistory`, `Ui*`.
- **Explicit imports needed:** keep `import { deliveries, trips } from "@/mocks/trips"`, `import { ROUTES } from "@/types"`; add `import type { TCustomerFields } from "@/types"`.

## i18n

N/A.

## Conventions checklist

- [ ] No pills in the `UiPageHeader` subtitle; header component untouched.
- [ ] `riderDraft` empty string ⇄ `undefined` conversion only at submit (`|| undefined`).

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

- [ ] `/owner/customers/cust-15`: tags "Open" + "Pending"; Approve bar "…added by Ligaya Santos and needs review."; Approve → toast, bar and Pending tag disappear.
- [ ] `/owner/customers/cust-1`: "Rider: Mario Cruz", "Overdue", "Every 3 days"; no Approve bar.
- [ ] Edit cust-1 → rider Ramil Bautista → Save: tag updates; history gets "Reassigned / Ramil Bautista / Demo Owner" on top. Rider → Open → "Released".
- [ ] Edit cust-1 phone to `09170000002` → blocked with danger notice + "Open Mang Tomas Villaruel".
- [ ] Interval blank saves as none; "0" shows the field error and disables Save.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint "src/pages/owner/customers/[id].vue" --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/pages/owner/customers/[id].vue"` → must print nothing.
