<script setup lang="ts">
import type { TAlertKind } from "@wrs/contract/report";

import { REPORTS } from "@/constants/reports";
import { getDashboard } from "@/services/dashboard";
import { listReportSummaries } from "@/services/report";
import { ROUTES, type TAlert, type TAlertTone } from "@/types";

definePage({ meta: { title: "Dashboard" } });

const toneLabel: Record<TAlertTone, string> = {
  warn: "Attention",
  danger: "Rejected",
  info: "Pending",
};

const alertDefs: Record<TAlertKind, { label: string; to: string; tone: TAlertTone }> = {
  low_stock: { label: "consumable(s) low on stock", to: ROUTES.OWNER.INVENTORY.CONSUMABLES, tone: "warn" },
  maintenance_due: { label: "maintenance item(s) due or overdue", to: ROUTES.OWNER.INVENTORY.MAINTENANCE, tone: "warn" },
  tests_due: { label: "lab test(s) due", to: ROUTES.OWNER.INVENTORY.WATER_QUALITY, tone: "warn" },
  tds_out_of_range: { label: "TDS reading(s) out of range", to: ROUTES.OWNER.INVENTORY.WATER_QUALITY, tone: "warn" },
  open_shortages: { label: "rider shortage(s) pending review", to: ROUTES.OWNER.PEOPLE.PAYROLL.INDEX, tone: "warn" },
  overdue_customers: { label: "customer(s) overdue", to: `${ROUTES.OWNER.CUSTOMERS.INDEX}?show=overdue`, tone: "warn" },
  pending_approvals: { label: "pending approval(s)", to: ROUTES.OWNER.APPROVALS, tone: "info" },
};

const { data: dashboard, isLoading: isDashboardLoading, error: dashboardError, reload: reloadDashboard } = useResource(getDashboard);

const { data: summaries, error: summariesError, reload: reloadSummaries } = useResource((signal) => listReportSummaries({}, signal));

const today = computed(() => dashboard.value?.today);
const hasVariance = computed(() => today.value != null && today.value.variances !== 0);

const alerts = computed(() =>
  (dashboard.value?.alerts ?? [])
    .filter(({ count }) => count > 0)
    .map<TAlert>(({ kind, count }) => ({ id: kind, title: `${count} ${alertDefs[kind].label}`, to: alertDefs[kind].to, tone: alertDefs[kind].tone }))
);

const reportTiles = computed(() =>
  REPORTS.flatMap((report) => {
    const summary = summaries.value?.find(({ slug }) => slug === report.slug);

    return summary == null ? [] : [{ ...report, value: formatReportTile(summary.value, report.kind), tone: summary.tone }];
  })
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Dashboard" :subtitle="today ? `Today, ${formatDate(today.date)}` : undefined" />

    <UiEmptyState v-if="dashboardError != null" title="Couldn't load" :description="dashboardError.message">
      <template #action><UiButton variant="secondary" @click="reloadDashboard">Retry</UiButton></template>
    </UiEmptyState>
    <div v-else-if="today" class="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
      <UiStatCard label="Cash sales">
        <UiMoneyText :centavos="today.salesCash" size="lg" />
      </UiStatCard>
      <UiStatCard label="Credit sales">
        <UiMoneyText :centavos="today.salesCredit" size="lg" />
      </UiStatCard>
      <UiStatCard label="Collections">
        <UiMoneyText :centavos="today.collections" size="lg" />
      </UiStatCard>
      <UiStatCard label="Expenses">
        <UiMoneyText :centavos="today.expenses" size="lg" />
      </UiStatCard>
      <UiStatCard label="Variances" :tone="hasVariance ? 'warn' : 'default'">
        <UiMoneyText :centavos="today.variances" size="lg" :tone="hasVariance ? 'warn' : 'default'" />
      </UiStatCard>
    </div>
    <UiEmptyState v-else-if="!isDashboardLoading" title="No sales recorded yet today" />

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <UiSection title="Reports" class="lg:col-span-2">
        <template #actions>
          <UiButton :to="ROUTES.OWNER.DIGEST" variant="ghost" size="sm">
            Daily digest
            <IconArrowRight class="size-4" />
          </UiButton>
        </template>
        <UiEmptyState v-if="summariesError != null" title="Couldn't load" :description="summariesError.message">
          <template #action><UiButton variant="secondary" @click="reloadSummaries">Retry</UiButton></template>
        </UiEmptyState>
        <div v-else class="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:grid-cols-3">
          <RouterLink
            v-for="report in reportTiles"
            :key="report.slug"
            :to="ROUTES.OWNER.REPORT(report.slug)"
            class="rounded-xl transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <UiStatCard :label="report.title" :hint="report.hint" :tone="report.tone" class="h-full">{{ report.value }}</UiStatCard>
          </RouterLink>
        </div>
      </UiSection>
      <UiCard title="Alerts" class="self-start">
        <template v-if="alerts.length > 0" #actions>
          <UiStatusPill>{{ alerts.length }}</UiStatusPill>
        </template>
        <div v-if="alerts.length > 0" class="-mx-4 -mb-4 flex flex-col divide-y divide-zinc-100 border-t border-zinc-100">
          <UiListItem v-for="alert in alerts" :key="alert.id" :title="alert.title" :to="alert.to">
            <template #trailing>
              <UiStatusPill :tone="alert.tone">{{ toneLabel[alert.tone] }}</UiStatusPill>
            </template>
          </UiListItem>
        </div>
        <UiEmptyState v-else-if="dashboardError != null" title="Couldn't load" :description="dashboardError.message" />
        <UiEmptyState v-else-if="!isDashboardLoading" title="All caught up" description="No alerts right now." />
      </UiCard>
    </div>
  </div>
</template>
