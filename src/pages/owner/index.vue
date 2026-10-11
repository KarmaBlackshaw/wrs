<script setup lang="ts">
import { digestDays } from "@/mocks/digest";
import { approvals } from "@/mocks/approvals";
import { shortages } from "@/mocks/shortages";
import { REPORTS } from "@/constants/reports";
import { ROUTES } from "@/types";
import type { TAlert, TAlertTone } from "@/types";

definePage({ meta: { title: "Dashboard" } });

const toneLabel: Record<TAlertTone, string> = {
  warn: "Attention",
  danger: "Rejected",
  info: "Pending",
};

const today = computed(() => digestDays.at(-1));

const alerts = computed(() => {
  const list: TAlert[] = [];
  const day = today.value;

  if (day && day.lowStockCount > 0) {
    list.push({ id: "low-stock", title: `${day.lowStockCount} consumable(s) low on stock`, to: ROUTES.OWNER.INVENTORY.CONSUMABLES, tone: "warn" });
  }

  if (day && day.maintenanceDueCount > 0) {
    list.push({
      id: "maintenance",
      title: `${day.maintenanceDueCount} maintenance item(s) due or overdue`,
      to: ROUTES.OWNER.INVENTORY.MAINTENANCE,
      tone: "warn",
    });
  }

  if (day && day.testsDueCount > 0) {
    list.push({ id: "lab-test", title: `${day.testsDueCount} lab test(s) due`, to: ROUTES.OWNER.INVENTORY.WATER_QUALITY, tone: "warn" });
  }

  const openShortages = shortages.filter((shortage) => !shortage.approvedForDeduction);

  if (openShortages.length > 0) {
    list.push({ id: "shortages", title: `${openShortages.length} rider shortage(s) pending review`, to: ROUTES.OWNER.REPORT("shortages"), tone: "warn" });
  }

  if (approvals.length > 0) {
    list.push({ id: "approvals", title: `${approvals.length} pending approval(s)`, to: ROUTES.OWNER.APPROVALS, tone: "info" });
  }

  return list;
});

const reportSummaries = REPORTS.map((report) => ({ ...report, ...report.summary() }));
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Dashboard" :subtitle="today ? `Today, ${formatDate(today.date)}` : undefined" />

    <div v-if="today" class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
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
      <UiStatCard label="Variances" :tone="today.variances > 0 ? 'warn' : 'default'">
        <UiMoneyText :centavos="today.variances" size="lg" :tone="today.variances > 0 ? 'warn' : 'default'" />
      </UiStatCard>
    </div>
    <UiEmptyState v-else title="No sales recorded yet today" />

    <div class="grid gap-4 lg:grid-cols-3">
      <UiSection title="Reports" class="lg:col-span-2">
        <template #actions>
          <UiButton :to="ROUTES.OWNER.DIGEST" variant="ghost" size="sm">
            Daily digest
            <IconArrowRight class="size-4" />
          </UiButton>
        </template>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <RouterLink
            v-for="report in reportSummaries"
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
        <UiEmptyState v-else title="All caught up" description="No alerts right now." />
      </UiCard>
    </div>
  </div>
</template>
