<script setup lang="ts">
const model = defineModel<string>({ default: "" });

const {
  label,
  type = "text",
  hint,
  error,
  id,
} = defineProps<{
  label: string;
  type?: string;
  hint?: string;
  error?: string;
  id?: string;
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
    <div class="relative flex items-center">
      <span v-if="$slots.prefix" class="pointer-events-none absolute left-3 text-sm text-zinc-500">
        <slot name="prefix"></slot>
      </span>
      <input
        :id="fieldId"
        v-model="model"
        :type="type"
        :aria-describedby="describedBy"
        :aria-invalid="!!error"
        class="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-xs transition-shadow placeholder:text-zinc-500 focus-visible:border-brand-600 focus-visible:ring-4 focus-visible:ring-brand-600/15 focus-visible:outline-none"
        :class="[$slots.prefix ? 'pl-8' : '', error ? 'border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/15' : '']"
        v-bind="$attrs"
      />
    </div>
    <p v-if="error" :id="errorId" class="text-sm text-red-700">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="text-sm text-zinc-500">{{ hint }}</p>
  </div>
</template>
