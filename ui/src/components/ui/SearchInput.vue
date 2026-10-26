<script setup lang="ts">
const model = defineModel<string>({ default: "" });

const { label = "Search" } = defineProps<{
  label?: string;
}>();

defineOptions({ inheritAttrs: false });

const id = useId();
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col gap-1.5">
    <label :for="id" class="sr-only">{{ label }}</label>
    <div class="relative flex items-center">
      <IconMagnifyingGlass class="pointer-events-none absolute left-3 size-4 text-zinc-500" />
      <input
        :id="id"
        v-model="model"
        type="search"
        :placeholder="label"
        class="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-3 pl-9 text-sm text-zinc-900 shadow-xs transition-shadow placeholder:text-zinc-500 focus-visible:border-brand-600 focus-visible:ring-4 focus-visible:ring-brand-600/15 focus-visible:outline-none"
        v-bind="$attrs"
      />
    </div>
  </div>
</template>
