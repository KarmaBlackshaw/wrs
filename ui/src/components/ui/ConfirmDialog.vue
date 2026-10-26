<script setup lang="ts">
import type { TConfirmOptions } from "@/types";

const { title, message, confirmLabel = "Confirm", variant } = defineProps<TConfirmOptions>();

const emit = defineEmits<{
  settle: [isConfirmed: boolean];
}>();

const open = ref(false);

onMounted(() => {
  open.value = true;
});
</script>

<template>
  <UiDialog :open :title @update:open="emit('settle', false)">
    <p class="whitespace-pre-line">{{ message }}</p>

    <template #footer>
      <UiButton variant="secondary" @click="emit('settle', false)">Cancel</UiButton>
      <UiButton :variant @click="emit('settle', true)">{{ confirmLabel }}</UiButton>
    </template>
  </UiDialog>
</template>
