<script setup lang="ts">
import type { TSettingEntry } from "@wrs/contract/setting";

type THistoryRow = { effectiveFrom: string; value: string; isScheduled: boolean };

const columns = [
  { key: "value", label: "Value" },
  { key: "effectiveFrom", label: "Effective from" },
];

const entry = defineModel<TSettingEntry>("entry");

const isOpen = computed({
  get: () => entry.value != null,
  set: (value) => {
    if (!value) {
      entry.value = undefined;
    }
  },
});

const title = computed(() => (entry.value != null ? SETTING_LABEL[entry.value.key] : "History"));

const rows = computed((): THistoryRow[] => {
  if (entry.value == null) {
    return [];
  }

  const { key, history } = entry.value;
  const today = todayIso();

  return history
    .map(({ value, effectiveFrom }) => ({ effectiveFrom, value: formatSettingValue({ key, value }), isScheduled: effectiveFrom > today }))
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
});
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" :title>
    <UiDataTable :columns :rows :row-key="(row) => row.effectiveFrom">
      <template #cell-effectiveFrom="{ row }">
        <div class="flex items-center gap-2">
          <span class="text-zinc-700">{{ formatDate(row.effectiveFrom) }}</span>
          <UiStatusPill v-if="row.isScheduled" tone="info">Scheduled</UiStatusPill>
        </div>
      </template>
    </UiDataTable>
  </UiBottomSheet>
</template>
