<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <div class="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
    <div v-if="title || $slots.actions" class="mb-3 flex items-center justify-between gap-2">
      <h3 v-if="title" class="text-base font-semibold text-zinc-900">{{ title }}</h3>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
    <slot></slot>
  </div>
</template>
