<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { TRowAction, TTab } from "@/types";

const { columns, rows, rowActions, total, isLoading, error } = defineProps<{
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: T[];
  rowKey: (row: T) => string | number;
  clickable?: boolean;
  activeKey?: string | number;
  title?: string;
  icon?: Component;
  tabs?: TTab[];
  rowActions?: (row: T) => TRowAction[];
  total?: number;
  isLoading?: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  "row-click": [row: T];
  retry: [];
}>();

const allColumns = computed(() => (rowActions ? [...columns, { key: "actions", label: "", align: "right" as const }] : columns));
const count = computed(() => (isLoading ? undefined : (total ?? rows.length)));
const collapsed = computed(() => rows.some((row) => (rowActions?.(row).length ?? 0) > 2));
</script>

<template>
  <UiPanel :title="title" :icon="icon" :count="count" :tabs="tabs">
    <template v-if="$slots.actions" #actions>
      <slot name="actions"></slot>
    </template>
    <template v-if="$slots.filters" #filters>
      <slot name="filters"></slot>
    </template>
    <div :aria-busy="isLoading">
      <UiEmptyState v-if="error" title="Couldn't load" :description="error">
        <template #action>
          <UiButton variant="secondary" @click="emit('retry')">Retry</UiButton>
        </template>
      </UiEmptyState>
      <template v-else>
        <div v-if="isLoading && rows.length === 0" class="flex flex-col gap-3 px-5 py-4">
          <div v-for="n in 5" :key="n" class="h-4 animate-pulse rounded bg-zinc-100 motion-reduce:animate-none"></div>
        </div>
        <div v-else :class="{ 'opacity-60': isLoading }">
          <UiTable
            :columns="allColumns"
            :rows="rows"
            :row-key="rowKey"
            :clickable="clickable"
            :active-key="activeKey"
            @row-click="(row) => emit('row-click', row)"
          >
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
        </div>
        <div v-if="$slots.footer" class="border-t border-zinc-200 px-5 py-3">
          <slot name="footer"></slot>
        </div>
      </template>
    </div>
  </UiPanel>
</template>
