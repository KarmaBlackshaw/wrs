import type { TSyncPushBody, TSyncPushResult, TSyncSnapshot } from "@wrs/contract/sync";

import { http } from "@/lib/http";

export function pushOps(body: TSyncPushBody) {
  return http.post<TSyncPushResult>("/sync/ops", body);
}

export function pullSnapshot(cursor?: string, signal?: AbortSignal) {
  return http.get<TSyncSnapshot>("/sync/snapshot", { params: { cursor }, signal });
}
