import type {
  TPayAdjustmentBody,
  TPayLineDaysBody,
  TPayRun,
  TPayRunCreate,
  TPayRunDetail,
  TShortageDismissBody,
  TShortageExcludeBody,
} from "@wrs/contract/payroll";

import { http } from "@/lib/http";

export function listPayRuns(signal?: AbortSignal) {
  return http.get<TPayRun[]>("/pay-runs", { signal });
}

export function createPayRun(body: TPayRunCreate) {
  return http.post<TPayRunDetail>("/pay-runs", body);
}

export function getPayRun(id: string, signal?: AbortSignal) {
  return http.get<TPayRunDetail>(`/pay-runs/${id}`, { signal });
}

export function updatePayLineDays({ id, employeeId, body }: { id: string; employeeId: string; body: TPayLineDaysBody }) {
  return http.patch<TPayRunDetail>(`/pay-runs/${id}/lines/${employeeId}`, body);
}

export function addPayAdjustment({ id, body }: { id: string; body: TPayAdjustmentBody }) {
  return http.post<TPayRunDetail>(`/pay-runs/${id}/adjustments`, body);
}

export function recomputePayRun(id: string) {
  return http.post<TPayRunDetail>(`/pay-runs/${id}/recompute`);
}

export function finalizePayRun(id: string) {
  return http.post<TPayRunDetail>(`/pay-runs/${id}/finalize`);
}

export function excludePayRunShortage({ id, shortageId, body }: { id: string; shortageId: string; body: TShortageExcludeBody }) {
  return http.post<TPayRunDetail>(`/pay-runs/${id}/shortages/${shortageId}/exclude`, body);
}

export function dismissPayRunShortage({ id, shortageId, body }: { id: string; shortageId: string; body: TShortageDismissBody }) {
  return http.post<TPayRunDetail>(`/pay-runs/${id}/shortages/${shortageId}/dismiss`, body);
}
