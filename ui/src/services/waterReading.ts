import type { TPage } from "@wrs/contract/common";
import type { TWaterReading, TWaterReadingBody, TWaterReadingListQuery } from "@wrs/contract/water";

import { http } from "@/lib/http";

export function listWaterReadings(query: TWaterReadingListQuery, signal?: AbortSignal) {
  return http.get<TPage<TWaterReading>>("/water-readings", { params: query, signal });
}

export function createWaterReading(body: TWaterReadingBody) {
  return http.post<TWaterReading>("/water-readings", body);
}
