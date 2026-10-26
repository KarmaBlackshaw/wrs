import type { TExpenseSource } from "../expense.ts";

export const EXPENSE_SOURCE_LABEL: Record<TExpenseSource, string> = {
  drawer: "Drawer",
  owner: "Owner",
};
