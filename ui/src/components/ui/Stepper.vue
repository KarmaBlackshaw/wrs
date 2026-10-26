<script setup lang="ts">
const model = defineModel<number>({ required: true });

const {
  label,
  min = 0,
  max = Infinity,
  step = 1,
} = defineProps<{
  label?: string;
  min?: number;
  max?: number;
  step?: number;
}>();

function decrement() {
  model.value = Math.max(min, model.value - step);
}

function increment() {
  model.value = Math.min(max, model.value + step);
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span v-if="label" class="text-sm font-medium text-zinc-700">{{ label }}</span>
    <div class="flex items-center gap-3">
      <button
        type="button"
        :disabled="model <= min"
        :aria-label="`Decrease ${label ?? 'value'}`"
        class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 shadow-xs transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-brand-600 active:scale-[0.97] disabled:opacity-40 motion-reduce:active:scale-100"
        @click="decrement"
      >
        <IconMinus class="size-4" />
      </button>
      <span class="min-w-12 text-center text-xl font-semibold text-zinc-900 tabular-nums">{{ model }}</span>
      <button
        type="button"
        :disabled="model >= max"
        :aria-label="`Increase ${label ?? 'value'}`"
        class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 shadow-xs transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-brand-600 active:scale-[0.97] disabled:opacity-40 motion-reduce:active:scale-100"
        @click="increment"
      >
        <IconPlus class="size-4" />
      </button>
    </div>
  </div>
</template>
