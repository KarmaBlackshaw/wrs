import type { TPage } from "@wrs/contract/common";
import type { TMeterReading, TMeterReadingBody, TMeterReadingListQuery } from "@wrs/contract/maintenance";

import { http } from "@/lib/http";

export function listMeterReadings(query: TMeterReadingListQuery, signal?: AbortSignal) {
  return http.get<TPage<TMeterReading>>("/meter-readings", { params: query, signal });
}

export function createMeterReading(body: TMeterReadingBody) {
  return http.post<TMeterReading>("/meter-readings", body);
}
