import type { TRejectBody } from "@wrs/contract/approval";
import type { TPage } from "@wrs/contract/common";
import type { TInstallment, TLoan, TLoanListQuery, TLoanReleaseBody, TLoanRequest } from "@wrs/contract/loan";

import { http } from "@/lib/http";

export function requestLoan(body: TLoanRequest) {
  return http.post<TLoan>("/loans", body);
}

export function listLoans(query: TLoanListQuery, signal?: AbortSignal) {
  return http.get<TPage<TLoan>>("/loans", { params: query, signal });
}

export function getLoanSchedule(id: string, signal?: AbortSignal) {
  return http.get<TInstallment[]>(`/loans/${id}/schedule`, { signal });
}

export function releaseLoan({ id, body }: { id: string; body: TLoanReleaseBody }) {
  return http.post<TLoan>(`/loans/${id}/release`, body);
}

export function rejectLoan({ id, body }: { id: string; body: TRejectBody }) {
  return http.post<TLoan>(`/loans/${id}/reject`, body);
}
