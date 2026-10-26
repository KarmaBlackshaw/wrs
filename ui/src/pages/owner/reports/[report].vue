<script setup lang="ts">
import type { TReportSlug, TReportTable } from "@wrs/contract/report";

import { IconClipboardText } from "@/components";
import { REPORTS } from "@/constants/reports";
import { getReport, getReportCsv } from "@/services/report";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Report" } });

const route = useRoute("/owner/reports/[report]");
const fileDownload = useFileDownload();

const MONTHLY_PROFIT: TReportSlug = "monthly-profit";

const { from, to, range: urlRange, label: dateLabel, clear: clearDates } = useDateRangeQuery();

const report = computed(() => REPORTS.find((candidate) => candidate.slug === route.params.report));
const slug = computed(() => report.value?.slug);
const isMonthly = computed(() => slug.value === MONTHLY_PROFIT);

const month = computed({
  get: () => from.value.slice(0, 7) || toManila(Date.now()).format("YYYY-MM"),
  set: (value) => {
    if (!value) {
      return;
    }

    from.value = `${value}-01`;
    to.value = toManila(`${value}-01`).endOf("month").format("YYYY-MM-DD");
  },
});

const range = computed(() => {
  if (isMonthly.value) {
    const [first, last] = [`${month.value}-01`, toManila(`${month.value}-01`).endOf("month").format("YYYY-MM-DD")];

    return { from: first, to: last };
  }

  return urlRange.value;
});

const { data, isLoading, error, reload } = useResource(
  async (signal) => {
    if (slug.value == null) {
      return undefined;
    }

    return getReport({ slug: slug.value, range: range.value }, signal);
  },
  { watch: [slug, range] }
);

const columns = computed(() => data.value?.columns ?? []);

const rows = computed<(TReportTable["rows"][number] & { rowId: number })[]>(() => {
  const reportRows: TReportTable["rows"] = data.value?.rows ?? [];

  return reportRows.map((row, index) => ({ ...row, rowId: index }));
});

const isExporting = ref(false);

async function exportCsv() {
  if (slug.value == null) {
    return;
  }

  const reportSlug = slug.value;
  const { from: start, to: end } = range.value;
  const filename = `${[reportSlug, start, end].filter((part) => part != null).join("_")}.csv`;

  isExporting.value = true;
  await fileDownload.download(() => getReportCsv(reportSlug, range.value), filename);
  isExporting.value = false;
}
</script>

<template>
  <div v-if="slug" class="flex flex-col gap-4">
    <UiDataTable
      :title="report?.title"
      :icon="IconClipboardText"
      :columns="columns"
      :rows="rows"
      :row-key="(row) => row.rowId"
      :is-loading="isLoading"
      :error="error?.message"
      @retry="reload"
    >
      <template #actions>
        <UiField v-if="isMonthly" v-model="month" label="Month" type="month" />
        <UiButton variant="secondary" :loading="isExporting" @click="exportCsv">Export CSV</UiButton>
      </template>
      <template v-if="!isMonthly" #filters>
        <UiFilterChip label="Date" :value="dateLabel" @clear="clearDates">
          <div class="grid grid-cols-2 gap-3">
            <UiField v-model="from" label="From" type="date" :max="to || undefined" />
            <UiField v-model="to" label="To" type="date" :min="from || undefined" />
          </div>
        </UiFilterChip>
      </template>
      <template v-for="column in columns" :key="column.key" #[`cell-${column.key}`]="{ row }">
        {{ formatReportCell(row[column.key] ?? null, column.format) }}
      </template>
      <template #empty>
        <UiEmptyState title="No rows in this range" description="Widen the date range to see more results." />
      </template>
    </UiDataTable>
  </div>

  <UiEmptyState v-else title="Report not found" description="This report type isn't available.">
    <template #action>
      <UiButton :to="ROUTES.OWNER.REPORTS">Back to reports</UiButton>
    </template>
  </UiEmptyState>
</template>
