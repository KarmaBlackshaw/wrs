<script setup lang="ts">
const model = defineModel<string>({ default: "" });

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "backspace"] as const;

function press(key: (typeof keys)[number]) {
  if (key === "clear") {
    model.value = "";

    return;
  }

  if (key === "backspace") {
    model.value = model.value.slice(0, -1);

    return;
  }

  model.value += key;
}
</script>

<template>
  <div class="grid grid-cols-3 gap-2" role="group" aria-label="Number pad">
    <button
      v-for="key in keys"
      :key="key"
      type="button"
      class="flex h-12 items-center justify-center rounded-lg border border-zinc-200 bg-white text-xl font-semibold text-zinc-900 tabular-nums shadow-xs transition focus-visible:outline-2 focus-visible:outline-brand-600 active:scale-[0.97] active:bg-zinc-100 motion-reduce:active:scale-100"
      :aria-label="key === 'clear' ? 'Clear' : key === 'backspace' ? 'Backspace' : key"
      @click="press(key)"
    >
      <IconBackspace v-if="key === 'backspace'" class="size-6" />
      <span v-else-if="key === 'clear'" class="text-sm font-medium text-zinc-600">Clear</span>
      <span v-else>{{ key }}</span>
    </button>
  </div>
</template>
