<script setup lang="ts">
import type { TContainerCount } from "@wrs/contract/container";

import { IconCube } from "@/components";
import { listCounts } from "@/services/container";
import { OWNER_TABS } from "@/types";

definePage({ meta: { title: "Count variances" } });

const PAGE_SIZE = 20;

const columns = [
  { key: "date", label: "Date" },
  { key: "containerType", label: "Type" },
  { key: "full", label: "Full", align: "right" as const },
  { key: "empty", label: "Empty", align: "right" as const },
  { key: "expected", label: "Expected", align: "right" as const },
  { key: "variance", label: "Variance", align: "right" as const },
  { key: "countedByName", label: "Counted by" },
];

const from = useRouteQuery("from", "", { mode: "push" });
const to = useRouteQuery("to", "", { mode: "push" });
const { page, resetPageOn, clampTo } = usePageQuery();

resetPageOn([from, to]);

const { data, isLoading, error, reload } = useResource(
  (signal) => listCounts({ from: from.value || undefined, to: to.value || undefined, page: page.value, pageSize: PAGE_SIZE }, signal),
  { watch: [from, to, page] }
);

function expected({ expectedFull, expectedEmpty }: TContainerCount) {
  return expectedFull + expectedEmpty;
}

function variance(row: TContainerCount) {
  return row.full + row.empty - expected(row);
}
</script>

<template>
  <UiDataTable
    title="Containers"
    :icon="IconCube"
    :tabs="OWNER_TABS.CONTAINERS"
    :columns="columns"
    :rows="data?.items ?? []"
    :total="data?.total"
    :is-loading="isLoading"
    :error="error?.message"
    :row-key="(row) => row.id"
    @retry="reload"
  >
    <template #filters>
      <UiFilterChip label="From" :value="from && formatDate(from)" @clear="from = ''">
        <UiField v-model="from" label="From" type="date" />
      </UiFilterChip>
      <UiFilterChip label="To" :value="to && formatDate(to)" @clear="to = ''">
        <UiField v-model="to" label="To" type="date" />
      </UiFilterChip>
    </template>
    <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
    <template #cell-containerType="{ row }">{{ CONTAINER_TYPE_LABEL[row.containerType] }}</template>
    <template #cell-expected="{ row }">{{ expected(row) }}</template>
    <template #cell-variance="{ row }">
      <UiVariancePill :value="variance(row)" />
    </template>
    <template #empty>
      <UiEmptyState title="No counts match these filters" />
    </template>
    <template #footer>
      <UiPagination v-if="data != null" v-model:page="page" :total="data.total" :page-size="PAGE_SIZE" @clamp="clampTo" />
    </template>
  </UiDataTable>
</template>
