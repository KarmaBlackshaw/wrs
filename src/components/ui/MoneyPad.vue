<script setup lang="ts">
const model = defineModel<number>({ default: 0 });

const { suggestion } = defineProps<{
  suggestion?: number;
}>();

const digits = computed({
  get: () => (model.value > 0 ? String(model.value) : ""),
  set: (value) => {
    model.value = Number(value || "0");
  },
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-center"><UiMoneyText :centavos="model" size="xl" /></p>
    <UiButton v-if="suggestion" variant="ghost" @click="model = suggestion">Use {{ formatMoney(suggestion) }}</UiButton>
    <UiNumberPad v-model="digits" />
  </div>
</template>
