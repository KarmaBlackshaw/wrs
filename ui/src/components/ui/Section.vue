<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <section class="flex flex-col gap-2">
    <div class="flex min-h-8 items-center justify-between gap-3">
      <h2 class="text-base font-semibold text-zinc-900">{{ title }}</h2>
      <slot name="actions"></slot>
    </div>
    <slot></slot>
  </section>
</template>
