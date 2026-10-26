import type { TWaiverRequest, TWaiverRequestCreate, TWaiverRequestRejectBody } from "@wrs/contract/customer";

import { http } from "@/lib/http";

export function createWaiverRequest(body: TWaiverRequestCreate) {
  return http.post<TWaiverRequest>("/waiver-requests", body);
}

export function approveWaiverRequest(id: string) {
  return http.post<TWaiverRequest>(`/waiver-requests/${id}/approve`);
}

export function rejectWaiverRequest({ id, body }: { id: string; body: TWaiverRequestRejectBody }) {
  return http.post<TWaiverRequest>(`/waiver-requests/${id}/reject`, body);
}
