<script setup lang="ts">
import type { TCustomer, TCustomerListQuery } from "@wrs/contract/customer";

import { IconUsers } from "@/components";
import { listCustomers } from "@/services/customer";
import { ROUTES, type TOption } from "@/types";

type TShow = NonNullable<TCustomerListQuery["show"]>;

definePage({ meta: { title: "Customers" } });

const router = useRouter();
const employeeStore = useEmployeeStore();
const { riderOptions } = storeToRefs(employeeStore);

employeeStore.load();

const q = useRouteQuery<string>("q", "", { mode: "push" });
const show = useRouteQuery<TShow>("show", "all", { mode: "push" });
const riderId = useRouteQuery<string>("riderId", "", { mode: "push" });
const { page, resetPageOn, clampTo } = usePageQuery();

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

resetPageOn([q, show, riderId]);

const filterQuery = computed(() => ({ q: q.value || undefined, show: show.value, riderId: riderId.value || undefined }));

const { data, isLoading, error, reload } = useResource((signal) => listCustomers({ ...filterQuery.value, page: page.value }, signal), {
  watch: [filterQuery, page],
});

const rows = computed(() => data.value?.items ?? []);

const columns = [
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
  { key: "rider", label: "Rider" },
  { key: "containersHeld", label: "Containers", align: "right" as const },
  { key: "depositOnFile", label: "Deposit", align: "right" as const },
  { key: "creditBalance", label: "Credit balance", align: "right" as const },
  { key: "agingBucket", label: "Aging" },
];

const showOptions: TOption<TShow>[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
];

const showLabel = computed(() => (show.value === "all" ? undefined : showOptions.find(({ value }) => value === show.value)?.label));

const riderFilterOptions = computed(() => [{ value: "", label: "All riders" }, ...riderOptions.value]);
const riderLabel = computed(() => riderOptions.value.find(({ value }) => value === riderId.value)?.label);

const riderSelection = computed({
  get: () => riderId.value,
  set: (value: string | null) => {
    riderId.value = value ?? "";
  },
});

const isAddOpen = ref(false);
const isDistributeOpen = ref(false);
const distributeIds = ref<string[]>([]);

const distributeLabel = computed(() => `Distribute ${data.value?.total ?? 0} customers`);

async function listFilteredIds() {
  const ids: string[] = [];

  for (let current = 1; ; current++) {
    const { items, total } = await listCustomers({ ...filterQuery.value, page: current, pageSize: 100 });

    ids.push(...items.map(({ id }) => id));

    if (items.length === 0 || ids.length >= total) {
      return ids;
    }
  }
}

const { run: runListIds, isRunning: isListingIds } = useAction(listFilteredIds);

async function openDistribute() {
  const ids = await runListIds();

  if (ids == null) {
    return;
  }

  distributeIds.value = ids;
  isDistributeOpen.value = true;
}

function hasAgingFlag({ agingBucket, dueStatus }: TCustomer) {
  return agingBucket != null || dueStatus === "overdue";
}

function openCustomer({ id }: TCustomer) {
  router.push(ROUTES.OWNER.CUSTOMERS.DETAIL(id));
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      clickable
      title="Customers"
      :icon="IconUsers"
      :columns
      :rows
      :row-key="(row) => row.id"
      :row-label="fullName"
      :total="data?.total"
      :is-loading="isLoading"
      :error="error?.message"
      @retry="reload"
      @row-click="openCustomer"
    >
      <template #actions>
        <UiSearchInput v-model="search" label="Search customers" />
        <UiButton v-if="riderId && data?.total" variant="secondary" :loading="isListingIds" @click="openDistribute">{{ distributeLabel }}</UiButton>
        <UiButton @click="isAddOpen = true">Add customer</UiButton>
      </template>
      <template #filters>
        <UiFilterChip label="Show" :value="showLabel" @clear="show = 'all'">
          <UiSegmentedControl v-model="show" :options="showOptions" />
        </UiFilterChip>
        <UiFilterChip label="Rider" :value="riderLabel" @clear="riderId = ''">
          <UiSelect v-model="riderSelection" label="Rider" :options="riderFilterOptions" />
        </UiFilterChip>
      </template>
      <template #cell-name="{ row }">
        <span class="block">{{ fullName(row) }}</span>
        <span class="block max-w-72 text-sm whitespace-normal text-zinc-500">{{ row.phone }} · {{ row.address }}</span>
      </template>
      <template #cell-status="{ row }">
        <UiStatusPill v-if="row.status === 'pending'" tone="warn">Pending</UiStatusPill>
        <template v-else>—</template>
      </template>
      <template #cell-rider="{ row }">{{ row.riderName ?? "Open" }}</template>
      <template #cell-depositOnFile="{ row }">
        <UiMoneyText :centavos="row.depositOnFile" />
      </template>
      <template #cell-creditBalance="{ row }">
        <UiMoneyText :centavos="row.creditBalance" />
      </template>
      <template #cell-agingBucket="{ row }">
        <div v-if="hasAgingFlag(row)" class="flex flex-wrap gap-1">
          <UiStatusPill v-if="row.agingBucket != null" :tone="AGING_TONE[row.agingBucket]">{{ AGING_LABEL[row.agingBucket] }}</UiStatusPill>
          <UiStatusPill v-if="row.dueStatus === 'overdue'" tone="danger">Overdue</UiStatusPill>
        </div>
        <template v-else>—</template>
      </template>
      <template #empty>
        <UiEmptyState title="No customers match your filters" />
      </template>
      <template v-if="data != null" #footer>
        <UiPagination v-model:page="page" :total="data.total" :page-size="data.pageSize" @clamp="clampTo" />
      </template>
    </UiDataTable>

    <CustomerAddSheet v-model:open="isAddOpen" @submit="reload" />
    <CustomerDistributeSheet v-model:open="isDistributeOpen" :customer-ids="distributeIds" :excluded-rider-id="riderId" @submit="reload" />
  </div>
</template>
