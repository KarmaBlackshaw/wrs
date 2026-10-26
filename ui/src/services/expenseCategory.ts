import type { TExpenseCategory } from "@wrs/contract/expense";

import { http } from "@/lib/http";

export function listExpenseCategories(signal?: AbortSignal) {
  return http.get<TExpenseCategory[]>("/expense-categories", { signal });
}
