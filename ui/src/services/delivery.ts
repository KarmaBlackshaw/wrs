import type { TPage } from "@wrs/contract/common";
import type { TDelivery, TDeliveryListQuery } from "@wrs/contract/trip";

import { http } from "@/lib/http";

export function listDeliveries(query: TDeliveryListQuery, signal?: AbortSignal) {
  return http.get<TPage<TDelivery>>("/deliveries", { params: query, signal });
}
