import type { TShortage, TShortageBody } from "@wrs/contract/shortage";

import { http } from "@/lib/http";

export function createShortage(body: TShortageBody) {
  return http.post<TShortage>("/shortages", body);
}
