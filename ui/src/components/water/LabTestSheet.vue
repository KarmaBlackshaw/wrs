<script setup lang="ts">
import type { TLabTest } from "@wrs/contract/water";

import { createLabTest } from "@/services/labTest";
import { uploadFile } from "@/services/file";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  submit: [test: TLabTest];
}>();

const toast = useToast();
const { run: upload, isRunning: isUploading, error: uploadError } = useAction(uploadFile, { inline: ["validation"] });
const { run: create, isRunning: isCreating, error: createError } = useAction(createLabTest, { inline: ["validation"] });

const type = ref("");
const date = ref(todayIso());
const result = ref("");
const nextDue = ref("");
const file = ref<File>();

const isRunning = computed(() => isUploading.value || isCreating.value);
const error = computed(() => uploadError.value ?? createError.value);

const blockReason = computed(() => {
  if (type.value.trim().length === 0) {
    return "Enter the test type.";
  }

  if (result.value.trim().length === 0) {
    return "Enter the result.";
  }

  if (date.value.length === 0 || nextDue.value.length === 0) {
    return "Enter the test date and next due date.";
  }

  if (file.value == null) {
    return "Attach the lab report.";
  }

  return undefined;
});

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  type.value = "";
  date.value = todayIso();
  result.value = "";
  nextDue.value = "";
  file.value = undefined;
});

async function submit() {
  if (file.value == null) {
    return;
  }

  const uploaded = await upload(file.value);

  if (uploaded == null || uploadError.value != null) {
    return;
  }

  const saved = await create({
    type: type.value.trim(),
    date: date.value,
    result: result.value.trim(),
    fileId: uploaded.id,
    nextDue: nextDue.value,
  });

  if (saved == null || createError.value != null) {
    return;
  }

  emit("submit", saved);
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Add lab test">
    <div class="flex flex-col gap-4">
      <UiField v-model="type" label="Test type" />
      <UiField v-model="date" label="Date" type="date" />
      <UiField v-model="result" label="Result" />
      <UiField v-model="nextDue" label="Next due" type="date" />
      <UiFileInput v-model="file" label="Attachment" accept="image/*,.pdf" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="blockReason != null" id="lab-test-block-reason" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton
            size="lg"
            :disabled="blockReason != null"
            :loading="isRunning"
            :aria-describedby="blockReason != null ? 'lab-test-block-reason' : undefined"
            @click="submit"
            >Save lab test</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
