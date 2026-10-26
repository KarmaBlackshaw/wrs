import type { TRejectBody } from "@wrs/contract/approval";
import type { TSyncConflict } from "@wrs/contract/sync";

import { http } from "@/lib/http";

export function acceptSyncConflict(id: string) {
  return http.post<TSyncConflict>(`/sync-conflicts/${id}/accept`);
}

export function voidSyncConflict({ id, body }: { id: string; body: TRejectBody }) {
  return http.post<TSyncConflict>(`/sync-conflicts/${id}/void`, body);
}
