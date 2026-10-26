<script setup lang="ts">
import type { TExpense } from "@wrs/contract/expense";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{ submit: [expense: TExpense] }>();

const { categoryId, amount, note, consumableId, qty, receipt, isRunning, error, categoryOptions, consumableOptions, canSubmit, save } = useExpenseDraft({
  open,
  onSaved: (saved) => emit("submit", saved),
});

const padAmount = computed({
  get: () => amount.value ?? 0,
  set: (value) => {
    amount.value = value;
  },
});
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Drawer expense">
    <div class="flex flex-col gap-4">
      <UiSelect v-model="categoryId" label="Category" :options="categoryOptions" />
      <UiMoneyPad v-model="padAmount" />
      <UiField v-model="note" label="Note" hint="Optional" />
      <UiSelect v-model="consumableId" label="Restock consumable (optional)" placeholder="None" :options="consumableOptions" is-clearable />
      <UiNumberField v-if="consumableId" v-model="qty" label="Quantity" :min="1" :is-integer="false" />
      <UiFileInput v-model="receipt" label="Receipt photo" accept="image/*" capture="environment" />
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <p v-if="error" role="alert" class="mr-auto text-sm text-red-700">{{ error.message }}</p>
        <UiButton :disabled="!canSubmit" :loading="isRunning" @click="save">Save expense</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
