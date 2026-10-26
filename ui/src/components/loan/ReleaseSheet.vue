<script setup lang="ts">
import type { TLoan } from "@wrs/contract/loan";

import { uploadFile } from "@/services/file";
import { releaseLoan } from "@/services/loan";

const loan = defineModel<TLoan>("loan");

const emit = defineEmits<{ submit: [loan: TLoan] }>();

const toast = useToast();
const { run: runUpload, isRunning: isUploading, error: uploadError } = useAction(uploadFile, { inline: ["validation"] });

const {
  run: runRelease,
  isRunning: isReleasing,
  error: releaseError,
} = useAction(releaseLoan, {
  inline: ["loan.authorization_required", "approval.not_pending"],
});

const releaseFile = ref<File>();

const isOpen = computed({
  get: () => loan.value != null,
  set: (value) => {
    if (!value) {
      loan.value = undefined;
    }
  },
});

const isRunning = computed(() => isUploading.value || isReleasing.value);
const error = computed(() => uploadError.value ?? releaseError.value);

watch(loan, (value) => {
  if (value != null) {
    releaseFile.value = undefined;
  }
});

async function submit() {
  const current = loan.value;
  const file = releaseFile.value;

  if (current == null || file == null) {
    return;
  }

  const uploaded = await runUpload(file);

  if (uploaded == null) {
    return;
  }

  const released = await runRelease({ id: current.id, body: { authorizationFileId: uploaded.id } });

  if (released == null) {
    return;
  }

  emit("submit", released);
  loan.value = undefined;
  toast.show("Released, posted as expense");
}
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Approve and release loan">
    <div v-if="loan" class="flex flex-col gap-4">
      <div class="flex flex-col gap-1 text-base text-zinc-700">
        <p class="font-semibold">{{ loan.employeeName }}</p>
        <p>Principal <UiMoneyText :centavos="loan.principal" /></p>
        <p v-if="loan.type === 'loan'">
          Total interest <UiMoneyText :centavos="loan.preview.totalInterest" /> · Installment
          <UiMoneyText :centavos="loan.preview.installment" />
        </p>
      </div>
      <UiFileInput v-model="releaseFile" label="Signed IOU photo" accept="image/*" capture="environment" />
      <p v-if="!releaseFile" class="text-sm text-zinc-500">Attach the signed IOU to continue</p>
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton :disabled="!releaseFile" :loading="isRunning" @click="submit">Release loan</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
