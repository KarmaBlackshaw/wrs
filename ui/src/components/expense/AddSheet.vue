<script setup lang="ts">
import { consumables } from "@/mocks/consumables";
import { employees } from "@/mocks/employees";
import { expenseCategories } from "@/mocks/expenses";
import type { TExpense, TExpenseSource, TOption } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  submit: [expense: Omit<TExpense, "id">];
}>();

const toast = useToast();

const newCategory = ref(expenseCategories[0] ?? "");
const newAmount = ref("");
const newDate = ref(todayIso());
const newPaidBy = ref(employees[0]?.id ?? "");
const newSource = ref<TExpenseSource>("owner");
const newConsumableId = ref("");
const newQty = ref(0);
const newReceipt = ref<File>();

const categoryOptions = computed(() => expenseCategories.map((category) => ({ value: category, label: category })));
const employeeOptions = computed(() => employees.map((employee) => ({ value: employee.id, label: employee.name })));

const sourceOptions: TOption<TExpenseSource>[] = [
  { value: "owner", label: "Owner" },
  { value: "drawer", label: "Drawer" },
];

const consumableOptions = computed(() => [
  { value: "", label: "None" },
  ...consumables.map((consumable) => ({ value: consumable.id, label: consumable.name })),
]);

const canAddExpense = computed(() => Number(newAmount.value) > 0 && newDate.value.length > 0 && newPaidBy.value.length > 0);

function submit() {
  if (!canAddExpense.value) {
    return;
  }

  emit("submit", {
    category: newCategory.value,
    amount: Math.round(Number(newAmount.value) * 100),
    date: newDate.value,
    paidBy: newPaidBy.value,
    source: newSource.value,
    receiptUrl: newReceipt.value ? URL.createObjectURL(newReceipt.value) : undefined,
    consumableId: newConsumableId.value || undefined,
    qty: newConsumableId.value ? newQty.value : undefined,
  });

  newAmount.value = "";
  newConsumableId.value = "";
  newQty.value = 0;
  newReceipt.value = undefined;
  open.value = false;
  toast.show(newConsumableId.value ? "Saved, consumable restocked" : "Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Add expense">
    <div class="flex flex-col gap-4">
      <UiSelect v-model="newCategory" label="Category" :options="categoryOptions" />
      <UiField v-model="newAmount" label="Amount (₱)" type="number" inputmode="decimal" />
      <UiField v-model="newDate" label="Date" type="date" />
      <UiSelect v-model="newPaidBy" label="Paid by" :options="employeeOptions" />
      <UiSelect v-model="newSource" label="Source" :options="sourceOptions" />
      <UiSelect v-model="newConsumableId" label="Restock consumable (optional)" :options="consumableOptions" />
      <div v-if="newConsumableId" class="flex flex-col gap-1.5">
        <UiStepper v-model="newQty" label="Quantity" :min="0" :max="99999" />
        <p class="text-sm text-zinc-500">Restocks that consumable's stock on hand.</p>
      </div>
      <UiFileInput v-model="newReceipt" label="Receipt photo" accept="image/*" capture="environment" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canAddExpense" @click="submit">Save expense</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
