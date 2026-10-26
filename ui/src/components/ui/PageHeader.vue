<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

defineProps<{
  title: string;
  subtitle?: string;
  back?: RouteLocationRaw;
}>();
</script>

<template>
  <div class="flex flex-col gap-1">
    <RouterLink
      v-if="back"
      :to="back"
      class="-ml-1 inline-flex w-fit items-center gap-1 rounded-md px-1 py-0.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-brand-600"
    >
      <IconArrowLeft class="size-4" />
      Back
    </RouterLink>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">{{ title }}</h1>
        <p v-if="subtitle" class="mt-0.5 text-sm text-zinc-500">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>
