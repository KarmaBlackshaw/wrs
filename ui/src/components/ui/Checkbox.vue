<script setup lang="ts">
const model = defineModel<boolean>({ default: false });

const { label, description, disabled } = defineProps<{
  label: string;
  description?: string;
  disabled?: boolean;
}>();
</script>

<template>
  <label
    class="flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 shadow-xs has-focus-visible:border-brand-600 has-focus-visible:ring-4 has-focus-visible:ring-brand-600/15 has-disabled:cursor-not-allowed has-disabled:opacity-60"
  >
    <input v-model="model" type="checkbox" :disabled="disabled" class="focus-visible:outline-none" />
    <span class="flex flex-col">
      <span class="text-base text-zinc-700"
        ><slot>{{ label }}</slot></span
      >
      <span v-if="description" class="text-sm text-zinc-500">{{ description }}</span>
    </span>
  </label>
</template>
