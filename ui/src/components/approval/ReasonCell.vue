<script setup lang="ts">
const { reason } = defineProps<{
  reason: string | null;
}>();
</script>

<template>
  <span class="block max-w-48 text-sm whitespace-normal text-zinc-600">{{ reason || "-" }}</span>
</template>
