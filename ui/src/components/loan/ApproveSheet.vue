<script setup lang="ts">
import type { TApproval } from "@/types";

const approval = defineModel<TApproval>("approval");

const emit = defineEmits<{
  submit: [approval: TApproval];
}>();

const toast = useToast();

const open = computed({
  get: () => approval.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      approval.value = undefined;
    }
  },
});

const authFile = ref<File>();

watch(open, (isOpen) => {
  if (isOpen) {
    authFile.value = undefined;
  }
});

function submit() {
  if (!approval.value || !authFile.value) {
    return;
  }

  emit("submit", approval.value);
  toast.show("Loan approved");
  approval.value = undefined;
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Approve loan">
    <div class="flex flex-col gap-4">
      <p v-if="approval">{{ approval.summary }}</p>
      <p class="text-sm text-zinc-500">A signed authorization photo is required before releasing a loan (BR-15).</p>
      <UiFileInput v-model="authFile" label="Authorization photo" accept="image/*" capture="environment" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!authFile" @click="submit">Approve and release</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
