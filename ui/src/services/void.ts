import type { TRejectBody } from "@wrs/contract/approval";
import type { TVoid, TVoidBody } from "@wrs/contract/void";

import { http } from "@/lib/http";

export function createVoid(body: TVoidBody) {
  return http.post<TVoid>("/voids", body);
}

export function approveVoid(id: string) {
  return http.post<TVoid>(`/voids/${id}/approve`);
}

export function rejectVoid({ id, body }: { id: string; body: TRejectBody }) {
  return http.post<TVoid>(`/voids/${id}/reject`, body);
}
