export type TExpenseSource = "drawer" | "owner";

export type TExpense = {
  id: string;
  category: string;
  amount: number;
  date: string;
  paidBy: string;
  source: TExpenseSource;
  receiptUrl?: string;
  consumableId?: string;
  qty?: number;
};

export type TLocalExpense = { id: string; category: string; amount: number; note: string };
