<script setup lang="ts">
import type { TContainerTypeCode, TLocationKind } from "@wrs/contract/container";

import { IconCube } from "@/components";
import { listHoldings } from "@/services/container";
import { OWNER_TABS, type TOption } from "@/types";

definePage({ meta: { title: "Holdings" } });

type TKindFilter = "all" | TLocationKind;
type TTypeFilter = "all" | TContainerTypeCode;

const PAGE_SIZE = 20;

const columns = [
  { key: "label", label: "Location" },
  { key: "containerType", label: "Type" },
  { key: "full", label: "Full", align: "right" as const },
  { key: "empty", label: "Empty", align: "right" as const },
];

const locationKind = useRouteQuery<TKindFilter>("locationKind", "all", { mode: "push" });
const containerType = useRouteQuery<TTypeFilter>("containerType", "all", { mode: "push" });
const { page, resetPageOn, clampTo } = usePageQuery();

resetPageOn([locationKind, containerType]);

const { data, isLoading, error, reload } = useResource(
  (signal) =>
    listHoldings(
      {
        locationKind: locationKind.value === "all" ? undefined : locationKind.value,
        containerType: containerType.value === "all" ? undefined : containerType.value,
        page: page.value,
        pageSize: PAGE_SIZE,
      },
      signal
    ),
  { watch: [locationKind, containerType, page] }
);

const kindOptions: TOption<TKindFilter>[] = [
  { value: "all", label: "All" },
  { value: "station", label: LOCATION_KIND_LABEL.station },
  { value: "rider", label: LOCATION_KIND_LABEL.rider },
  { value: "customer", label: LOCATION_KIND_LABEL.customer },
  { value: "external", label: LOCATION_KIND_LABEL.external },
];

const typeOptions: TOption<TTypeFilter>[] = [{ value: "all", label: "All" }, ...CONTAINER_TYPE_OPTIONS];

const kindChipValue = computed(() => (locationKind.value === "all" ? undefined : LOCATION_KIND_LABEL[locationKind.value]));
const typeChipValue = computed(() => (containerType.value === "all" ? undefined : CONTAINER_TYPE_LABEL[containerType.value]));
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
    :row-key="(row) => `${row.locationKind}-${row.locationId}-${row.containerType}`"
    @retry="reload"
  >
    <template #filters>
      <UiFilterChip label="Location" :value="kindChipValue" @clear="locationKind = 'all'">
        <UiSegmentedControl v-model="locationKind" :options="kindOptions" />
      </UiFilterChip>
      <UiFilterChip label="Type" :value="typeChipValue" @clear="containerType = 'all'">
        <UiSegmentedControl v-model="containerType" :options="typeOptions" />
      </UiFilterChip>
    </template>
    <template #cell-containerType="{ row }">{{ CONTAINER_TYPE_LABEL[row.containerType] }}</template>
    <template #empty>
      <UiEmptyState title="No holdings match these filters" />
    </template>
    <template #footer>
      <UiPagination v-if="data != null" v-model:page="page" :total="data.total" :page-size="PAGE_SIZE" @clamp="clampTo" />
    </template>
  </UiDataTable>
</template>
