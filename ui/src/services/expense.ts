import type { TExpense, TExpenseCreate, TExpenseListQuery, TExpensePage, TExpenseUpdate } from "@wrs/contract/expense";

import { http } from "@/lib/http";

export function listExpenses(query: TExpenseListQuery, signal?: AbortSignal) {
  return http.get<TExpensePage>("/expenses", { params: query, signal });
}

export function createExpense(body: TExpenseCreate) {
  return http.post<TExpense>("/expenses", body);
}

export function updateExpense({ id, body }: { id: string; body: TExpenseUpdate }) {
  return http.patch<TExpense>(`/expenses/${id}`, body);
}

export function deleteExpense(id: string) {
  return http.delete<TExpense>(`/expenses/${id}`);
}
