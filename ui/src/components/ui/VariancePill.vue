<script setup lang="ts">
const { value, isMoney = false } = defineProps<{
  value: number;
  isMoney?: boolean;
}>();
</script>

<template>
  <UiStatusPill :tone="value === 0 ? 'ok' : 'danger'">{{ formatVariance(value, isMoney) }}</UiStatusPill>
</template>
