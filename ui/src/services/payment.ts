import type { TPage } from "@wrs/contract/common";
import type { TPayment, TPaymentCreate, TPaymentListQuery } from "@wrs/contract/payment";

import { http } from "@/lib/http";

export function createPayment(body: TPaymentCreate) {
  return http.post<TPayment>("/payments", body);
}

export function listPayments(query: TPaymentListQuery, signal?: AbortSignal) {
  return http.get<TPage<TPayment>>("/payments", { params: query, signal });
}
