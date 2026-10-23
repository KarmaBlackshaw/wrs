<script setup lang="ts" generic="T extends string">
import type { TOption } from "@/types";
const model = defineModel<T>({ required: true });

const { options } = defineProps<{
  options: TOption<T>[];
}>();

const buttons = useTemplateRef<HTMLButtonElement[]>("buttons");

const focusableIndex = computed(() =>
  Math.max(
    0,
    options.findIndex((option) => option.value === model.value)
  )
);

function move(delta: number) {
  const next = (focusableIndex.value + delta + options.length) % options.length;
  const option = options[next];

  if (!option) {
    return;
  }

  model.value = option.value;
  buttons.value?.[next]?.focus();
}
</script>

<template>
  <div
    class="inline-flex rounded-lg bg-zinc-100 p-1"
    role="radiogroup"
    @keydown.right.prevent="move(1)"
    @keydown.down.prevent="move(1)"
    @keydown.left.prevent="move(-1)"
    @keydown.up.prevent="move(-1)"
  >
    <button
      v-for="(option, index) in options"
      ref="buttons"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="model === option.value"
      :tabindex="index === focusableIndex ? 0 : -1"
      class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-brand-600"
      :class="model === option.value ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-950/5' : 'text-zinc-600 hover:text-zinc-900'"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
