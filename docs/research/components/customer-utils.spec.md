# Customer utils Spec

## Overview

- **Target file:** `src/utils/customer.ts` (new)
- **Owned files (this builder only):** `src/utils/customer.ts`, `src/utils/dates.ts`
- **Complexity:** `[med]`
- **Wave:** 2 · **Depends-on:** customer-types (wave 1)
- **Consumers of the new `proposeDistribution`:** customer-distribute-sheet (wave 4).

## Responsibility

Provide the pure, stateless customer rules (display name, phone normalisation, interval parsing, due state, duplicate match, distribution proposal) on top of one new Manila-day date helper.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `typescript-advanced-types`.
- **Builder MUST invoke before coding (action skills):** `investigate` (gstack) — ONLY if a self-check below disagrees with the expected result; root-cause, don't patch the expectation.
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` — due/overdue and duplicate rules drive visible flags and a blocking form (verify cust-1 shows Overdue, a duplicate phone blocks); `health`.

## Public API

`src/utils/dates.ts` — add and export (reuse the existing private `toManila`):

```ts
export function manilaDay(input: string | number | Date) {
  return toManila(input).format("YYYY-MM-DD");
}
```

Then make `todayIso()` return `manilaDay(Date.now())` and `isSameManilaDay(a, b)` compare `manilaDay(a) === manilaDay(b)` (same behaviour, DRY). Change nothing else in the file.

`src/utils/customer.ts` — all exports are plain functions (auto-imported everywhere via `src/utils`):

- `fullName(customer: Pick<TCustomer, "firstName" | "lastName">): string` → `` `${firstName} ${lastName}`.trim() ``.
- `phoneDigits(phone: string): string` → `phone.replace(/\D/g, "")`.
- `parseIntervalDays(input: string): number | undefined` → trim; `Number(...)`; return it only if `Number.isInteger(days) && days >= 1`, else `undefined` (blank → `undefined`).
- `customerDueState(customer: Pick<TCustomer, "deliveryIntervalDays" | "lastDeliveredAt">, today = todayIso()): TCustomerDueState`
  - `deliveryIntervalDays == null` OR `lastDeliveredAt == null` → `{ status: "due" }` (spec §1: no interval / no delivery yet = due; never overdue).
  - else `dueOn = dayjs(manilaDay(lastDeliveredAt)).add(deliveryIntervalDays, "day").format("YYYY-MM-DD")`; `daysUntilDue = dayjs(dueOn).diff(dayjs(today), "day")`;
    status = `daysUntilDue < 0 ? "overdue" : daysUntilDue === 0 ? "due" : "not_due"`; return `{ status, dueOn, daysUntilDue }`.
  - Mirrors the shape style of `computeMaintenanceState` in `src/utils/maintenance.ts` (which is the house precedent for a derived `status` object).
- `findCustomerDuplicate(fields: TCustomerFields, customers: TCustomer[], excludeId?: string): TCustomerDuplicate | undefined`
  - `candidates = customers.filter((customer) => customer.id !== excludeId)`.
  - Phone first (BR-22, blocking): `const digits = phoneDigits(fields.phone)`; if `digits` non-empty and a candidate has `phoneDigits(candidate.phone) === digits` → `{ match: "phone", customer }`.
  - Else name (BR-23, warning): normalise `` `${first.trim().toLowerCase()} ${last.trim().toLowerCase()}` ``; only when BOTH first and last are non-empty; a candidate with the same normalised first+last → `{ match: "name", customer }`.
  - Else `undefined`.
- `proposeDistribution(customers: Pick<TCustomer, "id">[], targetRiderIds: string[], currentCounts: Record<string, number>): TCustomerAssignment[]` (spec §3.6 step 3, BR-30)
  - Even split by count, balanced against each target's existing load: each next customer (input order) goes to the target with the fewest `currentCounts[riderId] ?? 0` + assigned-so-far; ties go to the earlier id in `targetRiderIds`. Deterministic; returns one assignment per customer, in `customers` order; `[]` when `targetRiderIds` is empty.
  - Shape (copy, it is the whole function):
    ```ts
    const loads = targetRiderIds.map((riderId) => ({ riderId, count: currentCounts[riderId] ?? 0 }));

    return customers.flatMap((customer): TCustomerAssignment[] => {
      const target = minBy(loads, "count");

      if (!target) {
        return [];
      }

      target.count += 1;

      return [{ customerId: customer.id, riderId: target.riderId }];
    });
    ```
    `lodash/minBy` keeps the FIRST minimum (strict `<`), which is exactly the tie rule. `loads` is a fresh local array, so mutating its items never touches the caller's `currentCounts`/`targetRiderIds`.
  - Assumes `targetRiderIds` has no duplicates (the sheet builds it from a checkbox set) — no `uniq` needed.

## State & data

Pure functions only; no store, no mocks, no refs.

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `manilaDay`, `todayIso` (sibling `src/utils/*` exports are auto-imported into `.ts` files too — `src/utils/reports.ts` already calls `formatMoney`/`tripSummary` with no import).
- **Explicit imports needed:** `import dayjs from "dayjs"`; `import minBy from "lodash/minBy"`; `import type { TCustomer, TCustomerAssignment, TCustomerDueState, TCustomerDuplicate, TCustomerFields } from "@/types"` (same style as `src/utils/maintenance.ts`).
- **Third-party:** dayjs (already installed; repo prefers dayjs); lodash `^4.18.1` (already in `package.json`) per-method only.

## i18n

N/A.

## Conventions checklist

- [ ] `customer.ts` holds only customer-domain pure helpers (one domain per file — Standards.md §Files).
- [ ] No `null` returns — `undefined` for "none".
- [ ] Do not edit `src/utils/index.ts` (generated barrel).

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

With `today = "2026-10-01"`:

- [ ] `customerDueState({ deliveryIntervalDays: 3, lastDeliveredAt: "2026-09-25T07:15:00+08:00" }, "2026-10-01")` → `{ status: "overdue", dueOn: "2026-09-28", daysUntilDue: -3 }`.
- [ ] `customerDueState({ deliveryIntervalDays: 7, lastDeliveredAt: "2026-09-25T07:45:00+08:00" }, "2026-10-01")` → `{ status: "not_due", dueOn: "2026-10-02", daysUntilDue: 1 }`.
- [ ] `customerDueState({ deliveryIntervalDays: 6, lastDeliveredAt: "2026-09-25T23:30:00+08:00" }, "2026-10-01")` → `status: "due"` (Manila day, not UTC day).
- [ ] No interval or no delivery → `{ status: "due" }`.
- [ ] `findCustomerDuplicate` returns a phone match over a name match; ignores `excludeId`; `"0917-000-0001"` matches `"09170000001"`; `"  aling rosa "/"HERNANDEZ"` matches `Aling Rosa`/`Hernandez`.
- [ ] `parseIntervalDays("")`, `("0")`, `("2.5")`, `("abc")` → `undefined`; `(" 7 ")` → `7`.
- [ ] `todayIso()` / `isSameManilaDay()` behaviour unchanged.
- [ ] `proposeDistribution([{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }], ["r1", "r2"], { r1: 3 })` → riderIds in order `r2, r2, r2, r1, r2` (r2 fills up to r1's load, tie at 3/3 goes to r1 by order, then r2).
- [ ] `proposeDistribution([{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }], ["r1", "r2", "r3"], {})` → `r1, r2, r3, r1`; every item is `{ customerId, riderId }` with customerIds `a, b, c, d` in order.
- [ ] `proposeDistribution([{ id: "a" }], [], {})` → `[]`; `proposeDistribution([], ["r1"], {})` → `[]`.
- [ ] Same input twice → deep-equal output; the passed `targetRiderIds` array and `currentCounts` object are unchanged after the call.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/utils/customer.ts src/utils/dates.ts --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/utils/customer.ts" -e "src/utils/dates.ts"` → must print nothing EXCEPT `Cannot find name 'manilaDay'` in `customer.ts` (a brand-new auto-import; `auto-imports.d.ts` is regenerated centrally by the orchestrator after this wave — do not hand-import it and do not run vite). Consumer errors elsewhere are expected mid-migration; ignore.
- One throwaway runnable check of the acceptance examples (no test framework in repo, no test files allowed): write a scratch script OUTSIDE the repo (your session scratchpad), run it, delete it. If Node can't resolve the `@/` alias, inline-copy the functions under test into the scratch file for the check (`customerDueState`, `findCustomerDuplicate`, `parseIntervalDays`, `proposeDistribution` — `require("lodash/minBy")` from the repo's `node_modules`). Cover every acceptance example above, including all four `proposeDistribution` lines. Report the result.
