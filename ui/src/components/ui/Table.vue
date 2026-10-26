<script setup lang="ts" generic="T extends Record<string, unknown>">
const {
  columns,
  rows,
  rowKey,
  clickable = false,
  activeKey,
  ariaLabel = "Table",
  stickyFirstColumn = false,
} = defineProps<{
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: T[];
  rowKey: (row: T) => string | number;
  clickable?: boolean;
  activeKey?: string | number;
  ariaLabel?: string;
  stickyFirstColumn?: boolean;
}>();

const emit = defineEmits<{
  "row-click": [row: T];
}>();

const ACTIONS_KEY = "actions";

function isActive(row: T) {
  return activeKey != null && rowKey(row) === activeKey;
}

function stickyClass(key: string, isHeader: boolean) {
  if (key === ACTIONS_KEY) {
    return `sticky right-0 z-10 shadow-[-8px_0_8px_-8px_rgb(0_0_0/0.12)] ${isHeader ? "bg-white" : ""}`;
  }

  return stickyFirstColumn && key === columns[0]?.key ? `sticky left-0 z-10 ${isHeader ? "bg-white" : ""}` : "";
}

function cellClass(key: string, row: T) {
  const isFirst = key === columns[0]?.key;
  const isSticky = key === ACTIONS_KEY || (stickyFirstColumn && isFirst);
  const background = isActive(row) ? "bg-brand-50" : clickable ? "bg-white group-hover:bg-zinc-50" : "bg-white";

  return [
    isSticky ? background : "",
    stickyClass(key, false),
    isFirst ? "" : "pointer-events-none z-10 [&_:is(a,button,input,select,textarea)]:pointer-events-auto",
    isFirst || isSticky ? "" : "relative",
  ];
}
</script>

<template>
  <div
    class="overflow-x-auto focus-visible:ring-4 focus-visible:ring-brand-600/15 focus-visible:outline-none"
    tabindex="0"
    role="region"
    :aria-label="ariaLabel"
  >
    <table class="w-full min-w-max text-left text-sm">
      <thead class="border-b border-zinc-200">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="px-4 py-3.5 text-sm font-medium text-zinc-700 first:pl-5 last:pr-5"
            :class="[column.align === 'right' ? 'text-right' : 'text-left', stickyClass(column.key, true)]"
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
          class="group relative"
          :class="[clickable ? 'transition-colors hover:bg-zinc-50' : '', isActive(row) ? 'bg-brand-50 hover:bg-brand-50' : '']"
          :aria-current="isActive(row) ? 'true' : undefined"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-4 py-3.5 text-zinc-600 first:pl-5 last:pr-5"
            :class="[column.align === 'right' ? 'text-right tabular-nums' : 'text-left', cellClass(column.key, row)]"
          >
            <button
              v-if="clickable && column.key === columns[0]?.key"
              type="button"
              class="cursor-pointer text-left after:absolute after:inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600"
              @click="emit('row-click', row)"
            >
              <slot :name="`cell-${column.key}`" :row="row">{{ row[column.key] }}</slot>
            </button>
            <slot v-else :name="`cell-${column.key}`" :row="row">{{ row[column.key] }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
