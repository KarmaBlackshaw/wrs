<script setup lang="ts">
const model = defineModel<number>();

const {
  label,
  hint,
  error,
  id,
  disabled = false,
  required = false,
  min,
  max,
  step = 1,
  isInteger = true,
  inputmode,
} = defineProps<{
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  isInteger?: boolean;
  inputmode?: "numeric" | "decimal";
}>();

const draft = ref("");

const resolvedInputmode = computed(() => inputmode ?? (isInteger ? "numeric" : "decimal"));

function toNumber(text: string) {
  if (text.trim() === "") {
    return undefined;
  }

  const value = Number(text);

  return Number.isNaN(value) ? undefined : value;
}

watch(
  model,
  (value) => {
    if (toNumber(draft.value) !== value) {
      draft.value = value != null ? String(value) : "";
    }
  },
  { immediate: true }
);

watch(draft, (text) => {
  model.value = toNumber(text);
});
</script>

<template>
  <UiField v-model="draft" type="number" :inputmode="resolvedInputmode" :label :hint :error :id :disabled :required :min :max :step />
</template>
