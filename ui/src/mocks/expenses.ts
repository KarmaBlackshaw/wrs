import type { TExpense } from "@/types";

export const expenseCategories: string[] = ["Consumables", "Containers", "Utilities", "Fuel", "Repairs", "Payroll", "Loans", "Other"];

export const expenses: TExpense[] = [
  { id: "exp-1", category: "Utilities", amount: 850000, date: "2026-09-15", paidBy: "emp-1", source: "owner", receiptUrl: "/mocks/receipt-electric.jpg" },
  {
    id: "exp-2",
    category: "Consumables",
    amount: 500000,
    date: "2026-09-20",
    paidBy: "emp-1",
    source: "owner",
    receiptUrl: "/mocks/receipt-seals.jpg",
    consumableId: "cons-2",
    qty: 500,
  },
  { id: "exp-3", category: "Fuel", amount: 150000, date: "2026-09-24", paidBy: "emp-2", source: "drawer" },
  { id: "exp-4", category: "Containers", amount: 300000, date: "2026-09-20", paidBy: "emp-1", source: "owner", receiptUrl: "/mocks/receipt-containers.jpg" },
];
