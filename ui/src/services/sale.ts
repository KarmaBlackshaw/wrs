import type { TSalesListQuery, TSalesPage } from "@wrs/contract/sale";

import { http } from "@/lib/http";

export function listSales(query: TSalesListQuery, signal?: AbortSignal) {
  return http.get<TSalesPage>("/sales", { params: query, signal });
}
