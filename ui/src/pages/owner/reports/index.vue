<script setup lang="ts">
import { REPORTS } from "@/constants/reports";
import { listReportSummaries } from "@/services/report";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Reports" } });

const { from, to, range, label: dateLabel, clear: clearDates } = useDateRangeQuery();

const { data: summaries, isLoading, error, reload } = useResource((signal) => listReportSummaries(range.value, signal), { watch: [range] });

const tiles = computed(() =>
  REPORTS.map((report) => {
    const summary = summaries.value?.find(({ slug }) => slug === report.slug);

    return { ...report, value: summary && formatReportTile(summary.value, report.kind), tone: summary?.tone };
  })
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Reports">
      <template #actions>
        <UiButton :to="ROUTES.OWNER.DIGEST" variant="secondary">Daily digest</UiButton>
      </template>
    </UiPageHeader>

    <UiFilterChip label="Date" :value="dateLabel" @clear="clearDates">
      <div class="grid grid-cols-2 gap-3">
        <UiField v-model="from" label="From" type="date" :max="to || undefined" />
        <UiField v-model="to" label="To" type="date" :min="from || undefined" />
      </div>
    </UiFilterChip>

    <UiEmptyState v-if="error != null" title="Couldn't load" :description="error.message">
      <template #action><UiButton variant="secondary" @click="reload">Retry</UiButton></template>
    </UiEmptyState>
    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" :aria-busy="isLoading">
      <RouterLink
        v-for="report in tiles"
        :key="report.slug"
        :to="ROUTES.OWNER.REPORT(report.slug)"
        class="rounded-xl transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <UiStatCard :label="report.title" :hint="report.hint" :tone="report.tone" class="h-full">{{ report.value ?? "…" }}</UiStatCard>
      </RouterLink>
    </div>
  </div>
</template>
