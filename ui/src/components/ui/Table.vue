<script setup lang="ts" generic="T extends Record<string, unknown>">
const { clickable = false } = defineProps<{
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: T[];
  rowKey: (row: T) => string | number;
  clickable?: boolean;
  activeKey?: string | number;
}>();

const emit = defineEmits<{
  "row-click": [row: T];
}>();

function onRowClick(row: T) {
  if (!clickable) {
    return;
  }

  emit("row-click", row);
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-max text-left text-sm">
      <thead class="border-b border-zinc-200">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="px-4 py-3.5 text-sm font-medium text-zinc-700 first:pl-5 last:pr-5"
            :class="column.align === 'right' ? 'text-right' : 'text-left'"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-zinc-200">
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length">
            <slot name="empty"></slot>
          </td>
        </tr>
        <tr
          v-for="row in rows"
          :key="rowKey(row)"
          class="focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600"
          :class="[
            clickable ? 'cursor-pointer transition-colors hover:bg-zinc-50' : '',
            activeKey != null && rowKey(row) === activeKey ? 'bg-brand-50 hover:bg-brand-50' : '',
          ]"
          :aria-current="activeKey != null && rowKey(row) === activeKey ? 'true' : undefined"
          :tabindex="clickable ? 0 : undefined"
          :role="clickable ? 'button' : undefined"
          @click="onRowClick(row)"
          @keydown.enter="onRowClick(row)"
          @keydown.space.prevent="onRowClick(row)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-4 py-3.5 text-zinc-600 first:pl-5 last:pr-5"
            :class="column.align === 'right' ? 'text-right tabular-nums' : 'text-left'"
          >
            <slot :name="`cell-${column.key}`" :row="row">{{ row[column.key] }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
