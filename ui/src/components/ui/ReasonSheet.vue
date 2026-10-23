<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const {
  title,
  confirmLabel = "Confirm",
  label = "Reason",
  isSubmitting = false,
} = defineProps<{
  title: string;
  confirmLabel?: string;
  label?: string;
  isSubmitting?: boolean;
}>();

const emit = defineEmits<{
  submit: [reason: string];
}>();

const draft = ref("");
const reason = computed(() => draft.value.trim());

watch(open, (value) => {
  if (value) {
    draft.value = "";
  }
});

function submit() {
  if (reason.value) {
    emit("submit", reason.value);
  }
}
</script>

<template>
  <UiBottomSheet v-model:open="open" :title>
    <UiTextarea v-model="draft" :label :hint="reason ? undefined : 'A reason is required'" />

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton variant="ghost" @click="open = false">Cancel</UiButton>
        <UiButton :disabled="!reason" :loading="isSubmitting" @click="submit">{{ confirmLabel }}</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
