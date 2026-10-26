<script setup lang="ts">
import type { TConsumable } from "@wrs/contract/consumable";

import { listStockEntries } from "@/services/stockEntry";

const consumable = defineModel<TConsumable>("consumable");

const page = ref(1);

const {
  data: entries,
  isLoading,
  error,
  reload,
} = useResource(async (signal) => (consumable.value != null ? listStockEntries({ consumableId: consumable.value.id, page: page.value }, signal) : undefined), {
  watch: [consumable, page],
});

const isOpen = computed({
  get: () => consumable.value != null,
  set: (value) => {
    if (!value) {
      consumable.value = undefined;
    }
  },
});

const columns = [
  { key: "createdAt", label: "When" },
  { key: "kind", label: "Type" },
  { key: "qty", label: "Qty", align: "right" as const },
  { key: "byName", label: "By" },
];

watch(consumable, () => {
  page.value = 1;
});
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Stock history">
    <p class="mb-2 text-sm text-zinc-500">{{ consumable?.name }}</p>
    <UiDataTable
      bare
      :columns
      :rows="entries?.items ?? []"
      :row-key="(row) => row.id"
      :total="entries?.total"
      :is-loading
      :error="error?.message"
      @retry="reload"
    >
      <template #cell-createdAt="{ row }">
        <span class="text-zinc-700">{{ formatDateTime(row.createdAt) }}</span>
      </template>
      <template #cell-kind="{ row }">
        <div class="flex flex-col">
          <span>{{ STOCK_ENTRY_KIND_LABEL[row.kind] }}</span>
          <span v-if="row.reason != null" class="text-xs text-zinc-500">{{ row.reason }}</span>
        </div>
      </template>
      <template #empty>
        <UiEmptyState title="No stock entries yet" />
      </template>
      <template v-if="entries != null" #footer>
        <UiPagination v-model:page="page" :total="entries.total" :page-size="entries.pageSize" />
      </template>
    </UiDataTable>
  </UiBottomSheet>
</template>
