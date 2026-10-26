<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { TCustomer } from "@wrs/contract/customer";
import { dueStatus } from "@wrs/contract/rules/dueStatus";
import { isEarlyRelease } from "@wrs/contract/rules/isEarlyRelease";

import { IconUsers } from "@/components";
import { RIDER_TABS, type TRiderCustomerScope, type TRowAction } from "@/types";

const { getTo, scope = "mine" } = defineProps<{
  getTo: (customer: TCustomer) => RouteLocationRaw;
  scope?: TRiderCustomerScope;
}>();

const authStore = useAuthStore();
const riderStore = useRiderStore();
const syncStore = useSyncStore();
const { myCustomers, isHydrated } = storeToRefs(riderStore);
const toast = useToast();
const confirmDialog = useConfirm();
const router = useRouter();

const columns = [
  { key: "name", label: "Name" },
  { key: "rider", label: "Rider" },
];

const q = useRouteQuery<string>("q", "", { mode: "push" });
const search = ref(q.value);

watchDebounced(
  search,
  (value) => {
    q.value = value;
  },
  { debounce: 300 }
);

watch(q, (value) => {
  search.value = value;
});

const rows = computed(() => {
  const matches = riderStore.search(search.value);

  if (scope === "all") {
    return matches;
  }

  const mineIds = new Set(myCustomers.value.map(({ id }) => id));

  return matches.filter(({ id }) => mineIds.has(id));
});

const today = todayIso();

const EMPTY_DESCRIPTION: Record<TRiderCustomerScope, string> = {
  mine: "Add a customer, or switch to All when covering for another rider.",
  all: "Try a different name, phone, address, or rider.",
};

const isAddOpen = ref(false);

function activeCoverage({ coverage, riderName }: TCustomer) {
  if (coverage == null || coverage.coveringRiderId !== authStore.me?.id || coverage.from > today || coverage.until < today) {
    return undefined;
  }

  return { riderName: riderName ?? "Open", until: formatDate(coverage.until) };
}

function dueOf(customer: TCustomer) {
  return dueStatus(customer, today);
}

function openCustomer(customer: TCustomer) {
  router.push(getTo(customer));
}

function releaseMessage(customer: TCustomer, name: string) {
  return customer.nextDueOn != null && isEarlyRelease(customer, today)
    ? { message: `Due on ${formatDate(customer.nextDueOn)}. Release ${name} anyway?`, confirmLabel: "Release anyway" }
    : { message: `Release ${name}? They become open for any rider.`, confirmLabel: "Release" };
}

async function release(customer: TCustomer) {
  const name = fullName(customer);
  const isEarly = isEarlyRelease(customer, today);
  const isConfirmed = await confirmDialog.confirm({ title: "Release customer", variant: "danger", ...releaseMessage(customer, name) });

  if (!isConfirmed) {
    return;
  }

  await syncStore.enqueue({ kind: "customer.release", payload: { customerId: customer.id, confirmEarly: isEarly } });
  toast.show(`${name} released`);
}

function rowActions(customer: TCustomer): TRowAction[] {
  return customer.riderId != null && customer.riderId === authStore.me?.id
    ? [{ label: "Release", variant: "secondary", onSelect: () => release(customer) }]
    : [];
}
</script>

<template>
  <UiDataTable
    title="Customers"
    :icon="IconUsers"
    :tabs="RIDER_TABS.CUSTOMERS"
    :columns="columns"
    :rows="rows"
    :is-loading="!isHydrated"
    :row-key="(row) => row.id"
    clickable
    :row-actions="rowActions"
    @row-click="openCustomer"
  >
    <template #actions>
      <UiSearchInput v-model="search" label="Search customers by name, phone, address, or rider" />
      <UiButton @click="isAddOpen = true">Add customer</UiButton>
    </template>
    <template #cell-name="{ row }">
      <span class="block">{{ fullName(row) }}</span>
      <span class="block max-w-72 text-sm whitespace-normal text-zinc-500">{{ row.phone }} · {{ row.address }}</span>
      <span class="mt-1 flex flex-wrap gap-1">
        <UiStatusPill v-if="row.status === 'pending'" tone="neutral">Pending</UiStatusPill>
        <UiStatusPill v-if="dueOf(row) === 'due'" tone="warn">Due</UiStatusPill>
        <UiStatusPill v-else-if="dueOf(row) === 'overdue'" tone="danger">Overdue</UiStatusPill>
        <UiStatusPill v-if="activeCoverage(row) != null" tone="info">
          Covering for {{ activeCoverage(row)?.riderName }}
          <span class="hidden sm:inline">until {{ activeCoverage(row)?.until }}</span>
        </UiStatusPill>
      </span>
    </template>
    <template #cell-rider="{ row }">{{ row.riderName ?? "Open" }}</template>
    <template #empty>
      <UiEmptyState title="No customers found" :description="EMPTY_DESCRIPTION[scope]" />
    </template>
  </UiDataTable>

  <CustomerAddSheet v-model:open="isAddOpen" is-rider-mode />
</template>
