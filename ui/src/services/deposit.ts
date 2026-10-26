import type { TPage } from "@wrs/contract/common";
import type { TDepositEntry, TDepositListQuery } from "@wrs/contract/deposit";

import { http } from "@/lib/http";

export function listDeposits(query: TDepositListQuery, signal?: AbortSignal) {
  return http.get<TPage<TDepositEntry>>("/deposits", { params: query, signal });
}
