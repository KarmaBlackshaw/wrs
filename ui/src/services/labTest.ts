import type { TPage } from "@wrs/contract/common";
import type { TLabTest, TLabTestBody, TLabTestListQuery } from "@wrs/contract/water";

import { http } from "@/lib/http";

export function listLabTests(query: TLabTestListQuery, signal?: AbortSignal) {
  return http.get<TPage<TLabTest>>("/lab-tests", { params: query, signal });
}

export function createLabTest(body: TLabTestBody) {
  return http.post<TLabTest>("/lab-tests", body);
}
