<script setup lang="ts">
import type { TLabTest } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  submit: [value: Omit<TLabTest, "id">];
}>();

const toast = useToast();

const newType = ref("");
const newDate = ref(todayIso());
const newResult = ref("");
const newNextDue = ref("");
const newFile = ref<File>();

const canAddTest = computed(() => newType.value.trim().length > 0 && newResult.value.trim().length > 0 && newNextDue.value.length > 0);

function submitAddTest() {
  if (!canAddTest.value) {
    return;
  }

  emit("submit", {
    type: newType.value.trim(),
    date: newDate.value,
    result: newResult.value.trim(),
    fileUrl: newFile.value ? URL.createObjectURL(newFile.value) : "",
    nextDue: newNextDue.value,
  });

  newType.value = "";
  newResult.value = "";
  newNextDue.value = "";
  newFile.value = undefined;
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Add lab test">
    <div class="flex flex-col gap-4">
      <UiField v-model="newType" label="Test type" />
      <UiField v-model="newDate" label="Date" type="date" />
      <UiField v-model="newResult" label="Result" />
      <UiField v-model="newNextDue" label="Next due" type="date" />
      <UiFileInput v-model="newFile" label="Attachment" accept="image/*,.pdf" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canAddTest" @click="submitAddTest">Save lab test</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
