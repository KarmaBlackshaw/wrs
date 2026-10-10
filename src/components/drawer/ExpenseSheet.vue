<script setup lang="ts">
import { expenseCategories } from "@/mocks/expenses";
import type { TLocalExpense } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{ submit: [expense: Omit<TLocalExpense, "id">] }>();

const toast = useToast();

const expenseCategory = ref(expenseCategories[0] ?? "");
const expenseCategoryOptions = expenseCategories.map((category) => ({ value: category, label: category }));
const expensePad = ref("");
const expenseNote = ref("");

const expenseAmount = computed(() => padToCentavos(expensePad.value));

function confirmExpense() {
  if (expenseAmount.value <= 0 || !expenseCategory.value) {
    return;
  }

  emit("submit", { category: expenseCategory.value, amount: expenseAmount.value, note: expenseNote.value.trim() });
  expensePad.value = "";
  expenseNote.value = "";
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Drawer expense">
    <div class="flex flex-col gap-4">
      <UiSelect v-model="expenseCategory" label="Category" :options="expenseCategoryOptions" />
      <p class="text-center"><UiMoneyText :centavos="expenseAmount" size="xl" /></p>
      <UiNumberPad v-model="expensePad" />
      <UiField v-model="expenseNote" label="Note" hint="Optional" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="expenseAmount <= 0" @click="confirmExpense">Save expense</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
