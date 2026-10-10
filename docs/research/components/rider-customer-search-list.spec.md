# RiderCustomerSearchList Spec

## Overview

- **Target file:** `src/components/rider/CustomerSearchList.vue` (rewrite of the in-flight version)
- **Owned files (this builder only):** `src/components/rider/CustomerSearchList.vue`
- **Complexity:** `[med]`
- **Wave:** 6 · **Depends-on:** rider-customer-add-sheet (5), customer-store (3), customer-utils (2)

## Responsibility

Let a rider browse Mine/All customers, search them (All also by assigned rider's name, spec §3.7), add a new one, and open a customer's link — exposing a per-row action slot for the parent.

## Skills

- **Baked — already applied by the architect, do NOT re-invoke:** `vue-best-practices`, `web-component-design` (row action via scoped slot, not a `showRelease` boolean), `frontend-design`, `ui-ux-pro-max` (no nested interactive elements; 44px targets; overdue as text pill).
- **Builder MUST invoke before coding (action skills):** none
- **QA emphasis (Phase 5 — the ORCHESTRATOR runs these, not the builder):** `qa` (Mine/All, search incl. rider-name match on All, add → deliver form, Release row action on Customers page only), `design-review` (row layout, focus rings, full-width segmented control).

## Public API

- **Props:** `getTo: (customer: TCustomer) => RouteLocationRaw` (unchanged).
- **Slots:** `row-action` — scoped `{ customer: TCustomer }`, rendered as a SIBLING after each row's link (the Customers page supplies Release; the deliver picker supplies nothing).
- **Emits / models:** none.

## State & data

Remove from the in-flight version: the `"open"` scope + Open tab, `acceptedIds`, `riderOf`, `accept()`, the Accept button, the `@/mocks/customers` import.

- Hoists: `const authStore = useAuthStore(); const customerStore = useCustomerStore(); const router = useRouter(); const { employeeName } = useEmployeeLookup();`
- `type TScope = "mine" | "all";` `const scopeOptions: TOption<TScope>[] = [{ value: "mine", label: "Mine" }, { value: "all", label: "All" }];` `const scope = ref<TScope>("mine");`
- `const myId = computed(() => authStore.user?.id);`
- `const scoped = computed(() => (scope.value === "all" ? customerStore.customers : customerStore.customers.filter((customer) => customer.riderId === myId.value)));`
- `const query = ref(""); const searched = useCustomerSearch(query, scoped);` — `useCustomerSearch` stays UNCHANGED (generic name/phone/address matcher owned by customer-store); the rider-name match is this consumer's own rule (spec §3.7, §4 Rider), layered on top:
  ```
  const filtered = computed(() => {
    const term = query.value.trim().toLowerCase();

    if (!term || scope.value !== "all") {
      return searched.value;
    }

    const searchedIds = new Set(searched.value.map((customer) => customer.id));

    return scoped.value.filter((customer) => searchedIds.has(customer.id) || (customer.riderId != null && employeeName(customer.riderId).toLowerCase().includes(term)));
  });
  ```
  Keeps `scoped` order; only on the All tab (on Mine every row is the rider's own, so matching their own name would list everything). Open customers never match a rider name.
- `const searchLabel = computed(() => (scope.value === "all" ? "Search customers by name, phone, address, or rider" : "Search customers by name, phone, or address"));`
- Row view model (template renders, script decides):
  ```
  const rows = computed(() => filtered.value.map((customer) => {
    const isMine = customer.riderId === myId.value;
    return {
      customer,
      name: fullName(customer),
      isOverdue: isMine && customerDueState(customer).status === "overdue",
      ownerLabel: scope.value === "all" ? ownerLabel(customer) : undefined,
    };
  }));
  ```
  `ownerLabel(customer)` → `customer.riderId == null ? "Open" : firstName(employeeName(customer.riderId))` where the first name is `employeeName(...).split(" ")[0]` bound to a const (Overdue only on the rider's own customers — accepted assumption §7).
- Empty state: `const emptyState = computed(() => scope.value === "mine" && !query.value.trim() ? { title: "No customers yet", description: "Customers you add or deliver to first will show up here." } : { title: "No customers found", description: "Try a different name, phone, address, or rider." });`
- Add: `const isAddOpen = ref(false);` `function openCustomer(customer: TCustomer) { router.push(getTo(customer)); }` — used for the add sheet's `@pick` (a new or existing-duplicate customer goes straight to its link = the deliver form).

### Template

```
<div class="flex flex-col gap-3">
  <UiSegmentedControl v-model="scope" :options="scopeOptions" class="flex w-full [&>button]:min-h-10" />
  <UiSearchInput v-model="query" :label="searchLabel" />
  <UiButton variant="secondary" size="lg" block @click="isAddOpen = true">Add customer</UiButton>
  <UiEmptyState v-if="rows.length === 0" :title="emptyState.title" :description="emptyState.description" />
  <div v-else class="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
    <div v-for="row in rows" :key="row.customer.id" class="flex min-h-11 items-center gap-2 pr-2">
      <RouterLink :to="getTo(row.customer)" class="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600">
        <div class="flex min-w-0 flex-col gap-1">
          <span class="truncate text-sm font-medium text-zinc-900">{{ row.name }}</span>
          <span class="truncate text-sm text-zinc-500">{{ row.customer.address }}</span>
          <div v-if="row.isOverdue || row.ownerLabel" class="flex flex-wrap gap-1.5">
            <UiStatusPill v-if="row.isOverdue" tone="danger">Overdue</UiStatusPill>
            <UiStatusPill v-if="row.ownerLabel">{{ row.ownerLabel }}</UiStatusPill>
          </div>
        </div>
        <IconCaretRight class="size-4 shrink-0 text-zinc-400" />
      </RouterLink>
      <slot name="row-action" :customer="row.customer"></slot>
    </div>
  </div>
  <RiderCustomerAddSheet v-model:open="isAddOpen" @pick="openCustomer" />
</div>
```

Why not `UiListItem`: with `to` it renders a RouterLink and its `#trailing` slot is INSIDE the link, so a Release button there would be a nested interactive element. The row above copies UiListItem's classes instead (don't modify `ui/ListItem.vue`). If `pr-2` leaves no gap when the slot is empty, keep it — harmless. The `[&>button]:min-h-10` call-site class makes the segmented control ≥40px tall without touching `ui/SegmentedControl.vue`.

## Dependencies (imports)

- **Auto-provided (DO NOT import):** `ref`, `computed`, `useRouter`, `useAuthStore`, `useCustomerStore`, `useEmployeeLookup`, `useCustomerSearch`, `fullName`, `customerDueState`; components `UiSegmentedControl`, `UiSearchInput`, `UiButton`, `UiEmptyState`, `UiStatusPill`, `IconCaretRight`, `RiderCustomerAddSheet`, `RouterLink`.
- **Explicit imports needed:** `import type { RouteLocationRaw } from "vue-router"`; `import type { TCustomer, TOption } from "@/types"`.

## i18n

N/A.

## Conventions checklist

- [ ] No `showRelease`/`showAdd` style booleans; release comes only through `row-action` (user decision 7).
- [ ] No `toast`/`accept` leftovers from the in-flight version (spec §6 "To remove").

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

- [ ] As emp-3: Mine lists cust-1 (with "Overdue"), cust-5, cust-9; All lists 15 rows each with a neutral owner pill ("Mario", "Ramil", "Corazon", "Demo", or "Open"); Overdue pill never on others' rows.
- [ ] Only two scope options (Mine, All); no Accept button anywhere.
- [ ] As emp-4 on All, query `"mario"` lists exactly Mario Cruz's (emp-3) customers — cust-1, cust-5, cust-9 — plus any customer whose own name/phone/address contains "mario"; on Mine the same query does NOT match by rider name. Query `"rosa"` on All still finds cust-1 by name.
- [ ] `src/composables/useCustomerSearch.ts` untouched by this builder.
- [ ] Add customer → sheet → create → navigates to `getTo(newCustomer)`.
- [ ] `row-action` slot content renders beside (not inside) each row link.
- [ ] Mine + empty query + no rows → "No customers yet" copy.
- [ ] Every Conventions box satisfied; Verify clean.

## Verify

- `npx eslint src/components/rider/CustomerSearchList.vue --max-warnings=0`
- `npx vue-tsc --noEmit -p tsconfig.app.json 2>&1 | grep -F -e "src/components/rider/CustomerSearchList.vue"` → must print nothing.
