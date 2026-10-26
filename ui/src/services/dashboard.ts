import type { TDashboard } from "@wrs/contract/report";

import { http } from "@/lib/http";

export function getDashboard(signal?: AbortSignal) {
  return http.get<TDashboard>("/dashboard", { signal });
}
