import type { TExpenseSource } from "@wrs/contract/expense";

export const EXPENSE_SOURCE_LABEL: Record<TExpenseSource, string> = {
  drawer: "Drawer",
  owner: "Owner",
};
