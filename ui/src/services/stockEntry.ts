import type { TPage } from "@wrs/contract/common";
import type { TStockEntry, TStockEntryBody, TStockEntryListQuery } from "@wrs/contract/consumable";

import { http } from "@/lib/http";

export function listStockEntries(query: TStockEntryListQuery, signal?: AbortSignal) {
  return http.get<TPage<TStockEntry>>("/stock-entries", { params: query, signal });
}

export function createStockEntry(body: TStockEntryBody) {
  return http.post<TStockEntry>("/stock-entries", body);
}
