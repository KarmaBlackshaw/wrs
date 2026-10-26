<script setup lang="ts">
import type { TExpense } from "@wrs/contract/expense";

const open = defineModel<boolean>("open", { default: false });
const expense = defineModel<TExpense>("expense");

const emit = defineEmits<{ submit: [expense: TExpense] }>();

const {
  categoryId,
  amount,
  note,
  consumableId,
  qty,
  receipt,
  isLocked,
  isEditing,
  isRunning,
  error,
  hasLockedRestock,
  categoryOptions,
  consumableOptions,
  canSubmit,
  save,
} = useExpenseDraft({ open, expense, onSaved: (saved) => emit("submit", saved) });
</script>

<template>
  <UiBottomSheet v-model:open="open" :title="isEditing ? 'Edit expense' : 'Add expense'">
    <div class="flex flex-col gap-4">
      <UiSelect v-model="categoryId" label="Category" :options="categoryOptions" />
      <UiMoneyField v-model="amount" label="Amount" :disabled="isLocked" />
      <UiSelect
        v-model="consumableId"
        label="Restock consumable (optional)"
        placeholder="None"
        :options="consumableOptions"
        :is-clearable="!hasLockedRestock && !isLocked"
        :disabled="isLocked"
      />
      <UiNumberField
        v-if="consumableId"
        v-model="qty"
        label="Quantity"
        hint="Restocks that consumable's stock on hand."
        :min="1"
        :is-integer="false"
        :disabled="isLocked"
      />
      <p v-if="isLocked" class="text-sm text-amber-700">Locked: the drawer session is closed</p>
      <UiField v-model="note" label="Note" hint="Optional" />
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
