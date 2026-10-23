import type { TPage } from "@wrs/contract/common";
import type {
  TCustomer,
  TCustomerCreate,
  TCustomerCreditBody,
  TCustomerListQuery,
  TCustomerOwnership,
  TCustomerOwnershipListQuery,
  TCustomerReleaseBody,
  TCustomerUpdate,
  TCustomerWaiverBody,
  TDistributeCommit,
  TDistributePreviewBody,
  TDistributeProposal,
} from "@wrs/contract/customer";

import { http } from "@/lib/http";

export function listCustomers(query: TCustomerListQuery, signal?: AbortSignal) {
  return http.get<TPage<TCustomer>>("/customers", { params: query, signal });
}

export function getCustomer(id: string, signal?: AbortSignal) {
  return http.get<TCustomer>(`/customers/${id}`, { signal });
}

export function createCustomer(body: TCustomerCreate) {
  return http.post<TCustomer>("/customers", body);
}

export function updateCustomer({ id, body }: { id: string; body: TCustomerUpdate }) {
  return http.patch<TCustomer>(`/customers/${id}`, body);
}

export function approveCustomer(id: string) {
  return http.post<TCustomer>(`/customers/${id}/approve`);
}

export function setCustomerCredit({ id, body }: { id: string; body: TCustomerCreditBody }) {
  return http.put<TCustomer>(`/customers/${id}/credit`, body);
}

export function setCustomerDepositWaiver({ id, body }: { id: string; body: TCustomerWaiverBody }) {
  return http.put<TCustomer>(`/customers/${id}/deposit-waiver`, body);
}

export function releaseCustomer({ id, body }: { id: string; body: TCustomerReleaseBody }) {
  return http.post<TCustomer>(`/customers/${id}/release`, body);
}

export function listCustomerOwnerships({ id, query, signal }: { id: string; query: TCustomerOwnershipListQuery; signal?: AbortSignal }) {
  return http.get<TPage<TCustomerOwnership>>(`/customers/${id}/ownerships`, { params: query, signal });
}

export function previewDistribution(body: TDistributePreviewBody) {
  return http.post<TDistributeProposal>("/customers/distribute/preview", body);
}

export function commitDistribution(body: TDistributeCommit) {
  return http.post<void>("/customers/distribute", body);
}
