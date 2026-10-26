import type { TMeSummary } from "@wrs/contract/me";
import type { TPayslip } from "@wrs/contract/payroll";

import { http } from "@/lib/http";

export function getMeSummary(signal?: AbortSignal) {
  return http.get<TMeSummary>("/me/summary", { signal });
}

export function getMyPayslip(runId: string, signal?: AbortSignal) {
  return http.get<TPayslip>(`/me/payslips/${runId}`, { signal });
}
