<script setup lang="ts">
import type { TSettingEntry, TSettingKey } from "@wrs/contract/setting";

import { IconGear } from "@/components";
import { listSettings } from "@/services/setting";
import { OWNER_TABS, ROUTES, type TRowAction } from "@/types";
import type { TSettingTarget } from "@/types/labels/setting";

type TSettingRow = { key: string; label: string; display?: string; scheduled?: string; target?: TSettingTarget };

definePage({ meta: { title: "Settings" } });

const route = useRoute("/owner/settings/[[group]]");
const containerTypeStore = useContainerTypeStore();
const { types: containerTypes } = storeToRefs(containerTypeStore);
const { data: entries, isLoading, error, reload } = useResource(listSettings);

containerTypeStore.load();

const groupKeys: Record<string, TSettingKey[]> = {
  [ROUTES.OWNER.SETTINGS.INDEX]: ["rider.dailyQuota", "rider.incentivePerContainer", "pay.frequency", "pay.baseRate", "pay.deductionCapPct", "pto.daysPerYear"],
  [ROUTES.OWNER.SETTINGS.LOANS]: ["loan.interestRatePct", "loan.interestMethod", "loan.maxAmount", "loan.maxTermMonths"],
  [ROUTES.OWNER.SETTINGS.CONTAINERS_CREDIT]: ["customer.creditLimit", "void.approvalThreshold"],
  [ROUTES.OWNER.SETTINGS.WATER_QUALITY]: ["water.tdsRangePpm", "labTest.reminderDays"],
  [ROUTES.OWNER.SETTINGS.DIGEST]: ["digest.sendTime"],
};

const title = computed(() => OWNER_TABS.SETTINGS.find((tab) => tab.to === route.path)?.label ?? "Settings");

const isWide = useMediaQuery("(min-width: 640px)");

const columns = computed(() =>
  isWide.value
    ? [
        { key: "setting", label: "Setting" },
        { key: "value", label: "Value" },
      ]
    : [{ key: "setting", label: "Setting" }]
);

function scheduledHint({ key, history }: TSettingEntry) {
  const today = todayIso();
  const upcoming = history.filter(({ effectiveFrom }) => effectiveFrom > today).sort((x, y) => x.effectiveFrom.localeCompare(y.effectiveFrom))[0];

  return upcoming != null ? `Scheduled: ${formatSettingValue({ key, value: upcoming.value })} from ${formatDate(upcoming.effectiveFrom)}` : undefined;
}

const rows = computed((): TSettingRow[] => {
  const settingRows = (groupKeys[route.path] ?? []).flatMap((key) => {
    const entry = entries.value?.find((item) => item.key === key);

    return entry != null
      ? [
          {
            key,
            label: SETTING_LABEL[key],
            display: entry.value != null ? formatSettingValue(entry) : undefined,
            scheduled: scheduledHint(entry),
            target: { kind: "setting" as const, entry },
          },
        ]
      : [];
  });

  if (route.path !== ROUTES.OWNER.SETTINGS.CONTAINERS_CREDIT) {
    return settingRows;
  }

  const depositRows = containerTypes.value.map((containerType) => ({
    key: `deposit.${containerType.code}`,
    label: `${CONTAINER_TYPE_LABEL[containerType.code]} container deposit`,
    display: formatMoney(containerType.depositAmount),
    target: { kind: "deposit" as const, containerType },
  }));

  return [...depositRows, ...settingRows];
});

async function refresh() {
  await Promise.all([reload(), containerTypeStore.refresh()]);
}

const editTarget = ref<TSettingTarget>();
const historyEntry = ref<TSettingEntry>();

function rowActions({ target }: TSettingRow): TRowAction[] {
  if (target == null) {
    return [];
  }

  const actions: TRowAction[] = [{ label: "Edit", onSelect: () => (editTarget.value = target) }];

  if (target.kind === "setting") {
    actions.push({ label: "History", onSelect: () => (historyEntry.value = target.entry) });
  }

  return actions;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-zinc-500">Changing settings requires an online connection.</p>

    <UiDataTable
      :row-actions
      :title
      :icon="IconGear"
      :columns
      :rows
      :row-key="(row) => row.key"
      :row-label="(row) => row.label"
      :is-loading="isLoading"
      :error="error?.message"
      @retry="reload"
    >
      <template #cell-setting="{ row }">
        <div class="flex max-w-40 flex-col whitespace-normal sm:max-w-none">
          <span>{{ row.label }}</span>
          <div class="flex flex-col sm:hidden">
            <span v-if="row.display != null" class="text-zinc-700">{{ row.display }}</span>
            <UiStatusPill v-else tone="warn" class="self-start">Not set</UiStatusPill>
            <span v-if="row.scheduled != null" class="text-xs text-zinc-500">{{ row.scheduled }}</span>
          </div>
        </div>
      </template>
      <template #cell-value="{ row }">
        <div v-if="row.display != null" class="flex flex-col">
          <span class="text-zinc-700">{{ row.display }}</span>
          <span v-if="row.scheduled != null" class="text-xs text-zinc-500">{{ row.scheduled }}</span>
        </div>
        <UiStatusPill v-else tone="warn">Not set</UiStatusPill>
      </template>
    </UiDataTable>

    <p class="text-sm text-zinc-500">
      Stock and maintenance settings (reorder levels, intervals) are configured per item in
      <RouterLink :to="ROUTES.OWNER.INVENTORY.CONSUMABLES" class="underline">Consumables</RouterLink> and
      <RouterLink :to="ROUTES.OWNER.INVENTORY.MAINTENANCE" class="underline">Maintenance</RouterLink>.
    </p>

    <SettingEditSheet v-model:target="editTarget" @submit="refresh" />
    <SettingHistorySheet v-model:entry="historyEntry" />
  </div>
</template>
