<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center gap-1 px-4 py-6 text-center">
    <span class="mb-2 grid size-10 place-items-center rounded-full bg-zinc-100 text-zinc-500">
      <IconTray class="size-5" />
    </span>
    <p class="text-base font-semibold text-zinc-900">{{ title }}</p>
    <p v-if="description" class="max-w-sm text-sm text-zinc-500">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action"></slot>
    </div>
  </div>
</template>
