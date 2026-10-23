import type { TExpenseCategory } from "@wrs/contract/expense";

import { listExpenseCategories } from "@/services/expenseCategory";

export const useExpenseCategoryStore = defineStore("expenseCategory", () => {
  const categories = ref<TExpenseCategory[]>([]);
  const isLoaded = ref(false);

  const options = computed(() => categories.value.filter(({ active }) => active).map(({ id, name }) => ({ value: id, label: name })));

  async function load() {
    if (isLoaded.value) {
      return;
    }

    categories.value = await listExpenseCategories();
    isLoaded.value = true;
  }

  return { categories, options, load };
});
