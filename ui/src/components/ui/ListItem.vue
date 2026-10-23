<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

defineProps<{
  title: string;
  subtitle?: string;
  to?: RouteLocationRaw;
}>();
</script>

<template>
  <component
    :is="to ? 'RouterLink' : 'div'"
    v-bind="to ? { to } : {}"
    class="flex min-h-11 items-center justify-between gap-3 px-4 py-2.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600"
    :class="to ? 'cursor-pointer transition-colors hover:bg-zinc-50' : ''"
  >
    <div class="flex min-w-0 flex-col">
      <span class="truncate text-sm font-medium text-zinc-900">{{ title }}</span>
      <span v-if="subtitle" class="truncate text-sm text-zinc-500">{{ subtitle }}</span>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <slot name="trailing"></slot>
      <IconCaretRight v-if="to" class="size-4 text-zinc-400" />
    </div>
  </component>
</template>
