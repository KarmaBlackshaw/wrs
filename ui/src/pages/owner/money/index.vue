<script setup lang="ts">
import type { TCustomer } from "@wrs/contract/customer";

import { IconWallet } from "@/components";
import { getCreditAging } from "@/services/customer";
import { OWNER_TABS, ROUTES } from "@/types";

definePage({ meta: { title: "Credit aging" } });

const router = useRouter();
const { data, error, reload } = useResource((signal) => getCreditAging(signal));

const columns = [
  { key: "name", label: "Customer" },
  { key: "creditBalance", label: "Credit", align: "right" as const },
];

const totalTone = computed(() => ((data.value?.grandTotal ?? 0) > 0 ? "danger" : "muted"));

function openCustomer({ id }: TCustomer) {
  router.push(ROUTES.OWNER.CUSTOMERS.DETAIL(id));
}
</script>

<template>
  <UiPanel title="Money" :icon="IconWallet" :tabs="OWNER_TABS.MONEY">
    <template #actions>
      <span class="text-sm text-zinc-500">Total outstanding credit</span>
      <UiMoneyText v-if="data != null" :centavos="data.grandTotal" size="lg" :tone="totalTone" />
    </template>

    <UiEmptyState v-if="error" title="Couldn't load" :description="error.message">
      <template #action>
        <UiButton variant="secondary" @click="reload">Retry</UiButton>
      </template>
    </UiEmptyState>
    <UiEmptyState v-else-if="data != null && data.grandTotal === 0" title="No outstanding credit" />
    <template v-else-if="data != null">
      <UiPanelSection v-for="{ bucket, total, customers } in data.buckets" :key="bucket" :title="AGING_LABEL[bucket]">
        <template #actions>
          <UiMoneyText :centavos="total" tone="muted" />
        </template>
        <UiDataTable bare clickable :columns :rows="customers" :row-key="(row) => row.id" @row-click="openCustomer">
          <template #cell-name="{ row }">{{ fullName(row) }}</template>
          <template #cell-creditBalance="{ row }"><UiMoneyText :centavos="row.creditBalance" /></template>
          <template #empty>
            <UiEmptyState title="No customers in this bucket" />
          </template>
        </UiDataTable>
      </UiPanelSection>
    </template>
    <div v-else aria-busy="true" class="flex flex-col gap-3 px-5 py-4">
      <div v-for="n in 5" :key="n" class="h-4 animate-pulse rounded bg-zinc-100 motion-reduce:animate-none"></div>
    </div>
  </UiPanel>
</template>
