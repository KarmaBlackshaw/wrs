<script setup lang="ts">
const model = defineModel<number>();

const { label, hint, error } = defineProps<{
  label: string;
  hint?: string;
  error?: string;
}>();

const PESOS_PATTERN = /^\d*(\.\d{0,2})?$/;

const draft = ref("");

function toCentavos(text: string) {
  if (!/\d/.test(text)) {
    return undefined;
  }

  return Math.round(Number(text) * 100);
}

watch(
  model,
  (centavos) => {
    if (toCentavos(draft.value) !== centavos) {
      draft.value = centavos != null ? String(centavos / 100) : "";
    }
  },
  { immediate: true }
);

watch(
  draft,
  (text, previous) => {
    if (!PESOS_PATTERN.test(text)) {
      draft.value = previous;

      return;
    }

    model.value = toCentavos(text);
  },
  { flush: "post" }
);
</script>

<template>
  <UiField v-model="draft" type="text" inputmode="decimal" :label :hint :error>
    <template #prefix>₱</template>
  </UiField>
</template>
