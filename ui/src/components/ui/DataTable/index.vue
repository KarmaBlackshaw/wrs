<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { TRowAction, TTab } from "@/types";

const { columns, rows, rowActions } = defineProps<{
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: T[];
  rowKey: (row: T) => string | number;
  clickable?: boolean;
  activeKey?: string | number;
  title?: string;
  icon?: Component;
  tabs?: TTab[];
  rowActions?: (row: T) => TRowAction[];
}>();

const emit = defineEmits<{
  "row-click": [row: T];
}>();

const allColumns = computed(() => (rowActions ? [...columns, { key: "actions", label: "", align: "right" as const }] : columns));
const collapsed = computed(() => rows.some((row) => (rowActions?.(row).length ?? 0) > 2));
</script>

<template>
  <UiPanel :title="title" :icon="icon" :count="rows.length" :tabs="tabs">
    <template v-if="$slots.actions" #actions>
      <slot name="actions"></slot>
    </template>
    <template v-if="$slots.filters" #filters>
      <slot name="filters"></slot>
    </template>
    <UiTable :columns="allColumns" :rows="rows" :row-key="rowKey" :clickable="clickable" :active-key="activeKey" @row-click="(row) => emit('row-click', row)">
      <template v-for="column in columns" :key="column.key" #[`cell-${column.key}`]="{ row }">
        <slot :name="`cell-${column.key}`" :row="row">{{ row[column.key] }}</slot>
      </template>
      <template v-if="rowActions" #cell-actions="{ row }">
        <UiDataTableRowActions :actions="rowActions(row)" :collapsed="collapsed" />
      </template>
      <template #empty>
        <slot name="empty"></slot>
      </template>
    </UiTable>
  </UiPanel>
</template>
