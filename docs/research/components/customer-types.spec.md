# Customer types Spec

## Overview

- **Target file:** `src/types/entities/customer.ts`
- **Owned files (this builder only):** `src/types/entities/customer.ts`, `src/types/entities/approval.ts`, `src/types/labels/customer.ts` (new)
- **Complexity:** `[low]`
- **Wave:** 1 · **Depends-on:** none

## Responsibility

Define the customer-assignment data contract (entity, ownership log, draft, due-state, duplicate, assignment types) plus its event label map.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `typescript-advanced-types` (closed unions, `Pick`/intersection over hand-typed shapes).
- **Builder MUST invoke before coding (action skills):** none
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `health` — contract change ripples into ~20 consumers; the whole-project type-check is the gate. Runtime is covered by the consumer specs' `qa`.

## Public API

Exact shapes (keep field order readable; keep existing fields untouched):

`src/types/entities/customer.ts`

```ts
export type TAgingBucket = "current" | "7" | "15" | "30+"; // unchanged
export type TCustomerStatus = "pending" | "active";

export type TCustomer = {
  id: string;
  firstName: string; // replaces `name`
  lastName: string; // replaces `name`
  address: string;
  phone: string;
  riderId?: string; // already on disk — keep; undefined = open
  status: TCustomerStatus;
  deliveryIntervalDays?: number;
  lastDeliveredAt?: string; // ISO; derived by the store, never in mocks
  creditEnabled: boolean;
  creditLimit?: number;
  depositWaived: boolean;
  containersHeld: number;
  depositOnFile: number;
  creditBalance: number;
  agingBucket: TAgingBucket;
};

export type TCustomerFields = Pick<TCustomer, "firstName" | "lastName" | "phone" | "address">;
export type TCustomerDraft = TCustomerFields & Pick<TCustomer, "deliveryIntervalDays">;
export type TCustomerEdit = TCustomerDraft & Pick<TCustomer, "riderId">;

export type TCustomerOwnershipEvent = "created" | "claimed_by_delivery" | "released" | "released_early" | "assigned" | "reassigned";

export type TCustomerOwnership = {
  id: string;
  customerId: string;
  riderId?: string; // the owner AFTER the event; undefined = open
  event: TCustomerOwnershipEvent;
  byEmployeeId: string;
  createdAt: string; // ISO
};

export type TCustomerDueStatus = "not_due" | "due" | "overdue";

export type TCustomerDueState = {
  status: TCustomerDueStatus;
  dueOn?: string; // "YYYY-MM-DD" (Manila day)
  daysUntilDue?: number; // negative when overdue
};

export type TCustomerDuplicate = {
  match: "phone" | "name";
  customer: TCustomer;
};

export type TCustomerAssignment = {
  customerId: string;
  riderId: string;
};
```

`TCustomerAssignment` is the one "customer → rider" pair shared by `proposeDistribution` (utils), `useCustomerStore.distribute` (store) and `<CustomerDistributeSheet>`'s `confirm` emit (spec §3.6, BR-30; also the shape the future §8 coverage flow reuses). `riderId` is required — a distribution never targets "open".
The `// …` notes above are for you, NOT to be written into the file (zero-comment rule).

`src/types/entities/approval.ts` — only change: `export type TApprovalKind = "void" | "loan" | "credit" | "waiver" | "customer";`

`src/types/labels/customer.ts` (new) — mirror `src/types/labels/loan.ts` exactly in style:

```ts
import type { TCustomerOwnershipEvent } from "@/types/entities/customer";

export const CUSTOMER_OWNERSHIP_EVENT_LABEL: Record<TCustomerOwnershipEvent, string> = {
  created: "Created",
  claimed_by_delivery: "Claimed by delivery",
  released: "Released",
  released_early: "Released early",
  assigned: "Assigned",
  reassigned: "Reassigned",
};
```

(Label files import from the entity path `@/types/entities/customer`, not the `@/types` barrel — follow `labels/loan.ts`.)

## State & data

N/A — types only.

## Dependencies (imports)

- **Auto-provided:** N/A (type files).
- **Explicit imports needed:** `labels/customer.ts` → `import type { TCustomerOwnershipEvent } from "@/types/entities/customer"`.
- **Third-party:** none.

## i18n

N/A — not localized.

## Conventions checklist

- [ ] No `TCustomer.name` remains; no `string` where a union above is specified.
- [ ] Optional fields use `?:`, never `| null`.
- [ ] Do not edit `src/types/index.ts` (generated barrel — orchestrator regenerates it so `labels/customer.ts` is exported).

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

- [ ] `TCustomer`, `TCustomerStatus`, `TCustomerFields`, `TCustomerDraft`, `TCustomerEdit`, `TCustomerOwnershipEvent`, `TCustomerOwnership`, `TCustomerDueStatus`, `TCustomerDueState`, `TCustomerDuplicate`, `TCustomerAssignment` exported exactly as above.
- [ ] `TApprovalKind` includes `"customer"`.
- [ ] `CUSTOMER_OWNERSHIP_EVENT_LABEL` exported from `src/types/labels/customer.ts` covering all 6 events.
- [ ] Every Conventions box satisfied; Verify clean for owned files.

## Verify

- `npx eslint src/types/entities/customer.ts src/types/entities/approval.ts src/types/labels/customer.ts --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/types/"` → must print nothing. Errors in consumer files (e.g. `Property 'name' does not exist on type 'TCustomer'`) are EXPECTED — later-wave builders own them. Do not touch them.
