<script setup lang="ts">
const model = defineModel<string>({ default: "" });

const {
  label,
  hint,
  error,
  id,
  rows = 3,
} = defineProps<{
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  rows?: number;
}>();

defineOptions({ inheritAttrs: false });

const generatedId = useId();
const fieldId = computed(() => id ?? generatedId);
const hintId = computed(() => `${fieldId.value}-hint`);
const errorId = computed(() => `${fieldId.value}-error`);

const describedBy = computed(() => {
  if (error) {
    return errorId.value;
  }

  if (hint) {
    return hintId.value;
  }

  return undefined;
});
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="fieldId" class="text-sm font-medium text-zinc-700">{{ label }}</label>
    <textarea
      :id="fieldId"
      v-model="model"
      :rows
      :aria-describedby="describedBy"
      :aria-invalid="!!error"
      class="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs transition-shadow placeholder:text-zinc-500 focus-visible:border-brand-600 focus-visible:ring-4 focus-visible:ring-brand-600/15 focus-visible:outline-none"
      :class="error ? 'border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/15' : ''"
      v-bind="$attrs"
    ></textarea>
    <p v-if="error" :id="errorId" class="text-sm text-red-700">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="text-sm text-zinc-500">{{ hint }}</p>
  </div>
</template>
