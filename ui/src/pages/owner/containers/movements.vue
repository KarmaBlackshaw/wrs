<script setup lang="ts">
import type { TLocationKind, TMovementType } from "@wrs/contract/container";

import { IconCube } from "@/components";
import { listMovements } from "@/services/container";
import { OWNER_TABS, type TOption } from "@/types";

definePage({ meta: { title: "Movement log" } });

type TTypeFilter = "all" | TMovementType;
type TLocationFilter = "all" | TLocationKind;

const PAGE_SIZE = 20;

const columns = [
  { key: "createdAt", label: "Date" },
  { key: "type", label: "Movement" },
  { key: "containerType", label: "Type" },
  { key: "qty", label: "Qty", align: "right" as const },
  { key: "from", label: "From" },
  { key: "to", label: "To" },
  { key: "reason", label: "Reason" },
];

const type = useRouteQuery<TTypeFilter>("type", "all", { mode: "push" });
const from = useRouteQuery("from", "", { mode: "push" });
const to = useRouteQuery("to", "", { mode: "push" });
const location = useRouteQuery<TLocationFilter>("location", "all", { mode: "push" });
const { page, resetPageOn, clampTo } = usePageQuery();

resetPageOn([type, from, to, location]);

const { data, isLoading, error, reload } = useResource(
  (signal) =>
    listMovements(
      {
        type: type.value === "all" ? undefined : type.value,
        from: from.value || undefined,
        to: to.value || undefined,
        location: location.value === "all" ? undefined : location.value,
        page: page.value,
        pageSize: PAGE_SIZE,
      },
      signal
    ),
  { watch: [type, from, to, location, page] }
);

const typeOptions: TOption<TTypeFilter>[] = [{ value: "all", label: "All" }, ...MOVEMENT_TYPE_OPTIONS];

const locationOptions: TOption<TLocationFilter>[] = [
  { value: "all", label: "All" },
  { value: "station", label: LOCATION_KIND_LABEL.station },
  { value: "rider", label: LOCATION_KIND_LABEL.rider },
  { value: "customer", label: LOCATION_KIND_LABEL.customer },
  { value: "external", label: LOCATION_KIND_LABEL.external },
];

const typeChipValue = computed(() => (type.value === "all" ? undefined : MOVEMENT_TYPE_LABEL[type.value]));
const locationChipValue = computed(() => (location.value === "all" ? undefined : LOCATION_KIND_LABEL[location.value]));

const isMovementSheetOpen = ref(false);
</script>

<template>
  <div class="flex flex-col gap-4">
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
      <template #actions>
        <UiButton @click="isMovementSheetOpen = true">Record movement</UiButton>
      </template>
      <template #filters>
        <UiFilterChip label="Movement" :value="typeChipValue" @clear="type = 'all'">
          <UiSelect v-model="type" label="Movement" :options="typeOptions" />
        </UiFilterChip>
        <UiFilterChip label="Location" :value="locationChipValue" @clear="location = 'all'">
          <UiSegmentedControl v-model="location" :options="locationOptions" />
        </UiFilterChip>
        <UiFilterChip label="From" :value="from && formatDate(from)" @clear="from = ''">
          <UiField v-model="from" label="From" type="date" />
        </UiFilterChip>
        <UiFilterChip label="To" :value="to && formatDate(to)" @clear="to = ''">
          <UiField v-model="to" label="To" type="date" />
        </UiFilterChip>
      </template>
      <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      <template #cell-type="{ row }">{{ MOVEMENT_TYPE_LABEL[row.type] }}</template>
      <template #cell-containerType="{ row }">{{ CONTAINER_TYPE_LABEL[row.containerType] }}</template>
      <template #cell-from="{ row }">{{ row.fromLabel }}</template>
      <template #cell-to="{ row }">{{ row.toLabel }}</template>
      <template #empty>
        <UiEmptyState title="No movements match these filters" />
      </template>
      <template #footer>
        <UiPagination v-if="data != null" v-model:page="page" :total="data.total" :page-size="PAGE_SIZE" @clamp="clampTo" />
      </template>
    </UiDataTable>

    <ContainerMovementSheet v-model:open="isMovementSheetOpen" @submit="reload" />
  </div>
</template>
