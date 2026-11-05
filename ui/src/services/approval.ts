import type { TApprovalCategory, TApprovalListQuery, TApprovalOf } from "@wrs/contract/approval";
import type { TPage } from "@wrs/contract/common";

import { http } from "@/lib/http";

export function listApprovals<C extends TApprovalCategory>(query: TApprovalListQuery & { category: C }, signal?: AbortSignal) {
  return http.get<TPage<TApprovalOf<C>>>("/approvals", { params: query, signal });
}
