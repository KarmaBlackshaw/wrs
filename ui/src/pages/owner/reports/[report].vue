<script setup lang="ts">
import { IconClipboardText } from "@/components";
import { REPORTS } from "@/constants/reports";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Report" } });

const route = useRoute("/owner/reports/[report]");
const toast = useToast();

const report = computed(() => REPORTS.find((candidate) => candidate.slug === route.params.report) ?? null);

const dateFrom = ref("2026-09-01");
const dateTo = ref("2026-09-30");

const table = computed(() => (report.value ? buildReportTable(report.value.slug) : null));

const filteredRows = computed(() => {
  if (!table.value) {
    return [];
  }

  return table.value.rows
    .filter((row) => {
      const date = row._date?.slice(0, 10);

      return !date || ((!dateFrom.value || date >= dateFrom.value) && (!dateTo.value || date <= dateTo.value));
    })
    .map((row, index) => ({ ...row, _rowId: index }));
});

const dateLabel = computed(() => {
  if (dateFrom.value && dateTo.value) {
    return formatPeriod(dateFrom.value, dateTo.value);
  }

  if (dateFrom.value) {
    return `From ${formatDate(dateFrom.value)}`;
  }

  return dateTo.value && `Until ${formatDate(dateTo.value)}`;
});

function clearDates() {
  dateFrom.value = "";
  dateTo.value = "";
}

function exportCsv() {
  toast.show("Export ready (demo)");
}
</script>

<template>
  <div v-if="report && table" class="flex flex-col gap-4">
    <UiDataTable :title="report.title" :icon="IconClipboardText" :columns="table.columns" :rows="filteredRows" :row-key="(row) => row._rowId">
      <template #actions>
        <UiButton variant="secondary" @click="exportCsv">Export CSV</UiButton>
      </template>
      <template #filters>
        <UiFilterChip label="Date" :value="dateLabel" @clear="clearDates">
          <div class="grid grid-cols-2 gap-3">
            <UiField v-model="dateFrom" label="From" type="date" :max="dateTo || undefined" />
            <UiField v-model="dateTo" label="To" type="date" :min="dateFrom || undefined" />
          </div>
        </UiFilterChip>
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
