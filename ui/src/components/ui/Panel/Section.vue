<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <section class="border-t border-zinc-200">
    <div class="flex min-h-14 flex-wrap items-center justify-between gap-3 px-5 py-3">
      <h3 class="text-base font-semibold text-zinc-900">{{ title }}</h3>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
    <slot></slot>
  </section>
</template>
