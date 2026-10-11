<script setup lang="ts">
import { IconWallet } from "@/components";
import { customers } from "@/mocks/customers";
import { OWNER_TABS, ROUTES, type TAgingBucket } from "@/types";

definePage({ meta: { title: "Credit aging" } });

const router = useRouter();

const bucketOrder: TAgingBucket[] = ["current", "7", "15", "30+"];

const columns = [
  { key: "name", label: "Customer" },
  { key: "creditBalance", label: "Credit", align: "right" as const },
];

const groups = computed(() =>
  bucketOrder.map((bucket) => {
    const rows = customers.filter((customer) => customer.creditBalance > 0 && customer.agingBucket === bucket);

    return { bucket, rows, total: rows.reduce((sum, customer) => sum + customer.creditBalance, 0) };
  })
);

const grandTotal = computed(() => groups.value.reduce((sum, group) => sum + group.total, 0));
</script>

<template>
  <UiPanel title="Money" :icon="IconWallet" :tabs="OWNER_TABS.MONEY">
    <template #actions>
      <span class="text-sm text-zinc-500">Total outstanding credit</span>
      <UiMoneyText :centavos="grandTotal" size="lg" tone="danger" />
    </template>

    <UiPanelSection v-for="group in groups" :key="group.bucket" :title="AGING_LABEL[group.bucket]">
      <template #actions>
        <UiMoneyText :centavos="group.total" tone="muted" />
      </template>
      <UiTable
        :columns="columns"
        :rows="group.rows"
        :row-key="(row) => row.id"
        clickable
        @row-click="(row) => router.push(ROUTES.OWNER.CUSTOMERS.DETAIL(row.id))"
      >
        <template #cell-creditBalance="{ row }"><UiMoneyText :centavos="row.creditBalance" /></template>
        <template #empty>
          <UiEmptyState title="No customers in this bucket" />
        </template>
      </UiTable>
    </UiPanelSection>
  </UiPanel>
</template>
