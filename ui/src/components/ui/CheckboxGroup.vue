<script setup lang="ts" generic="T extends string">
import type { TOption } from "@/types";

const model = defineModel<T[]>({ default: () => [] });

const { options, legend, error } = defineProps<{
  options: TOption<T>[];
  legend: string;
  error?: string;
}>();

const errorId = useId();

function isChecked(value: T) {
  return model.value.includes(value);
}

function toggle(value: T, isOn: boolean) {
  const selected = new Set(model.value);

  if (isOn) {
    selected.add(value);
  } else {
    selected.delete(value);
  }

  model.value = options.map(({ value: optionValue }) => optionValue).filter((optionValue) => selected.has(optionValue));
}
</script>

<template>
  <fieldset class="flex flex-col gap-1.5" :aria-describedby="error ? errorId : undefined" :aria-invalid="!!error">
    <legend class="mb-1.5 text-sm font-medium text-zinc-700">{{ legend }}</legend>
    <div class="flex flex-wrap gap-2">
      <UiCheckbox
        v-for="option in options"
        :key="option.value"
        :model-value="isChecked(option.value)"
        :label="option.label"
        @update:model-value="toggle(option.value, $event)"
      />
    </div>
    <p v-if="error" :id="errorId" role="alert" class="text-sm text-red-700">{{ error }}</p>
  </fieldset>
</template>
