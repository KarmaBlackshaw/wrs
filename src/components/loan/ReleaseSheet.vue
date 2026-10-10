<script setup lang="ts">
import type { TLoan } from "@/types";

const loan = defineModel<TLoan>("loan");

const emit = defineEmits<{
  submit: [file: File];
}>();

const { employeeName } = useEmployeeLookup();
const toast = useToast();

const open = computed({
  get: () => loan.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      loan.value = undefined;
    }
  },
});

const releaseFile = ref<File>();

watch(open, (isOpen) => {
  if (isOpen) {
    releaseFile.value = undefined;
  }
});

function submit() {
  if (!loan.value || !releaseFile.value) {
    return;
  }

  emit("submit", releaseFile.value);
  loan.value = undefined;
  toast.show("Released, posted as expense");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Release with authorization">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ loan ? employeeName(loan.employeeId) : "" }}</p>
      <UiFileInput v-model="releaseFile" label="Signed authorization photo" accept="image/*" capture="environment" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!releaseFile" @click="submit">Release loan</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
