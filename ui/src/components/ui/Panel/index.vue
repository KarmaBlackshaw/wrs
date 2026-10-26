<script setup lang="ts">
import type { TTab } from "@/types";

const { bare = false } = defineProps<{
  bare?: boolean;
  title?: string;
  icon?: Component;
  count?: number;
  tabs?: TTab[];
}>();
</script>

<template>
  <div class="flex flex-col overflow-hidden" :class="{ 'rounded-xl border border-zinc-200 bg-white shadow-xs': !bare }">
    <div v-if="title || tabs || $slots.actions || $slots.filters" class="flex flex-col gap-4 pb-2" :class="bare ? 'pt-0' : 'px-5 pt-5'">
      <div v-if="title || $slots.actions" class="flex flex-wrap items-center justify-between gap-3">
        <div v-if="title" class="flex min-w-0 items-center gap-2.5">
          <component :is="icon" v-if="icon" class="size-5 text-zinc-700" />
          <h2 class="text-xl font-medium text-zinc-900">{{ title }}</h2>
          <span v-if="count != null" class="rounded border border-zinc-200 bg-zinc-100 px-1.5 text-xs font-medium text-zinc-600">
            {{ count }} {{ count === 1 ? "record" : "records" }}
          </span>
        </div>
        <div v-if="$slots.actions" class="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:shrink-0">
          <slot name="actions"></slot>
        </div>
      </div>
      <UiTabs v-if="tabs" :tabs="tabs" />
      <div v-if="$slots.filters" class="flex flex-wrap items-center gap-2">
        <slot name="filters"></slot>
      </div>
    </div>
    <slot></slot>
  </div>
</template>
