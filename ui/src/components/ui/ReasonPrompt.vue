<script setup lang="ts">
import type { TReasonPromptOptions } from "@/types";

const { title, confirmLabel, submit } = defineProps<TReasonPromptOptions>();

const emit = defineEmits<{
  settle: [isDone: boolean];
}>();

const isOpen = ref(false);
const isSubmitting = ref(false);

onMounted(() => {
  isOpen.value = true;
});

async function submitReason(reason: string) {
  isSubmitting.value = true;
  try {
    const isDone = await submit(reason);

    if (isDone) {
      emit("settle", true);
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UiReasonSheet :open="isOpen" :title :confirm-label :is-submitting @update:open="emit('settle', false)" @submit="submitReason" />
</template>
