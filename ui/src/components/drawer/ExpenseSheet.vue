<script setup lang="ts">
import type { TExpense } from "@wrs/contract/expense";

import { createExpense } from "@/services/expense";
import { uploadFile } from "@/services/file";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{ submit: [expense: TExpense] }>();

const toast = useToast();
const expenseCategoryStore = useExpenseCategoryStore();
const { options: expenseCategoryOptions } = storeToRefs(expenseCategoryStore);
const { run: runUpload, isRunning: isUploading } = useAction(uploadFile);
const { run: runCreate, isRunning: isCreating, error } = useAction(createExpense);

const categoryId = ref<string>();
const amount = ref(0);
const note = ref("");
const receipt = ref<File>();

const isRunning = computed(() => isUploading.value || isCreating.value);
const canSubmit = computed(() => amount.value > 0 && categoryId.value != null);

watch(open, async (isOpen) => {
  if (!isOpen) {
    return;
  }

  categoryId.value = undefined;
  amount.value = 0;
  note.value = "";
  receipt.value = undefined;

  await expenseCategoryStore.load();
  categoryId.value = expenseCategoryOptions.value[0]?.value;
});

async function confirmExpense() {
  if (!canSubmit.value || categoryId.value == null) {
    return;
  }

  let receiptFileId: string | undefined;

  if (receipt.value) {
    const file = await runUpload(receipt.value);

    if (!file) {
      return;
    }

    receiptFileId = file.id;
  }

  const trimmedNote = note.value.trim();

  const expense = await runCreate({
    categoryId: categoryId.value,
    amount: amount.value,
    note: trimmedNote || undefined,
    receiptFileId,
  });

  if (!expense) {
    return;
  }

  emit("submit", expense);
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Drawer expense">
    <div class="flex flex-col gap-4">
      <UiSelect v-model="categoryId" label="Category" :options="expenseCategoryOptions" />
      <UiMoneyPad v-model="amount" />
      <UiField v-model="note" label="Note" hint="Optional" />
      <UiFileInput v-model="receipt" label="Receipt photo" accept="image/*" capture="environment" />
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <p v-if="error" role="alert" class="mr-auto text-sm text-red-700">{{ error.message }}</p>
        <UiButton :disabled="!canSubmit" :loading="isRunning" @click="confirmExpense">Save expense</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
