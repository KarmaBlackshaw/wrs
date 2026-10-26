import type { TApproval, TApprovalListQuery } from "@wrs/contract/approval";
import type { TPage } from "@wrs/contract/common";

import { http } from "@/lib/http";

export function listApprovals(query: TApprovalListQuery, signal?: AbortSignal) {
  return http.get<TPage<TApproval>>("/approvals", { params: query, signal });
}
