import type { TExpense, TExpenseUpdate } from "@wrs/contract/expense";
import type { Ref } from "vue";

import { listConsumables } from "@/services/consumable";
import { createExpense, updateExpense } from "@/services/expense";
import { uploadFile } from "@/services/file";

export function useExpenseDraft({
  open,
  expense = ref<TExpense>(),
  onSaved,
}: {
  open: Ref<boolean>;
  expense?: Ref<TExpense | undefined>;
  onSaved: (expense: TExpense) => void;
}) {
  const toast = useToast();
  const expenseCategoryStore = useExpenseCategoryStore();
  const { options: categoryOptions } = storeToRefs(expenseCategoryStore);
  const { data: consumables, reload: reloadConsumables } = useResource(listConsumables);
  const { run: runUpload, isRunning: isUploading } = useAction(uploadFile);
  const { run: runCreate, isRunning: isCreating, error: createError } = useAction(createExpense, { inline: ["reference.not_found", "validation"] });

  const {
    run: runUpdate,
    isRunning: isUpdating,
    error: updateError,
  } = useAction(updateExpense, { inline: ["expense.session_closed", "reference.not_found", "validation"] });

  const categoryId = ref<string>();
  const amount = ref<number>();
  const note = ref("");
  const consumableId = ref<string | null>();
  const qty = ref<number>();
  const receipt = ref<File>();
  const isLocked = ref(false);

  const isEditing = computed(() => expense.value != null);
  const isRunning = computed(() => isUploading.value || isCreating.value || isUpdating.value);
  const error = computed(() => (isEditing.value ? updateError.value : createError.value));
  const hasLockedRestock = computed(() => expense.value?.consumableId != null);

  const consumableOptions = computed(() => (consumables.value ?? []).map(({ id, name }) => ({ value: id, label: name })));

  const canSubmit = computed(() => {
    const isRestockValid = consumableId.value ? qty.value != null && qty.value > 0 : true;

    return categoryId.value != null && amount.value != null && amount.value > 0 && isRestockValid;
  });

  watch(open, async (isOpen) => {
    if (!isOpen) {
      expense.value = undefined;

      return;
    }

    const current = expense.value;

    categoryId.value = current?.categoryId;
    amount.value = current?.amount;
    note.value = current?.note ?? "";
    consumableId.value = current?.consumableId;
    qty.value = current?.qty ?? undefined;
    receipt.value = undefined;
    isLocked.value = false;

    await Promise.all([expenseCategoryStore.load(), reloadConsumables()]);

    if (current == null) {
      categoryId.value = categoryOptions.value[0]?.value;
    }
  });

  async function uploadReceipt() {
    if (!receipt.value) {
      return { isOk: true, fileId: undefined };
    }

    const file = await runUpload(receipt.value);

    return { isOk: file != null, fileId: file?.id };
  }

  function buildUpdate(current: TExpense, receiptFileId?: string) {
    const body: TExpenseUpdate = {};
    const trimmedNote = note.value.trim();

    if (categoryId.value !== current.categoryId) {
      body.categoryId = categoryId.value;
    }

    if ((current.note ?? "") !== trimmedNote) {
      body.note = trimmedNote || null;
    }

    if (receiptFileId) {
      body.receiptFileId = receiptFileId;
    }

    if (amount.value !== current.amount) {
      body.amount = amount.value;
    }

    if (consumableId.value && (consumableId.value !== current.consumableId || qty.value !== current.qty)) {
      body.consumableId = consumableId.value;
      body.qty = qty.value;
    }

    return body;
  }

  function lockRestockFields(current: TExpense) {
    isLocked.value = true;
    amount.value = current.amount;
    consumableId.value = current.consumableId;
    qty.value = current.qty ?? undefined;
  }

  async function save() {
    if (!canSubmit.value || categoryId.value == null || amount.value == null) {
      return;
    }

    const { isOk, fileId } = await uploadReceipt();

    if (!isOk) {
      return;
    }

    const current = expense.value;

    const saved = current
      ? await runUpdate({ id: current.id, body: buildUpdate(current, fileId) })
      : await runCreate({
          categoryId: categoryId.value,
          amount: amount.value,
          note: note.value.trim() || undefined,
          receiptFileId: fileId,
          consumableId: consumableId.value || undefined,
          qty: consumableId.value ? qty.value : undefined,
        });

    if (!saved) {
      if (current && updateError.value?.code === "expense.session_closed") {
        lockRestockFields(current);
      }

      return;
    }

    onSaved(saved);
    open.value = false;
    toast.show(saved.consumableId ? "Saved, consumable restocked" : "Saved");
  }

  return {
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
  };
}
