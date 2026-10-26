import type { TPage } from "@wrs/contract/common";
import type {
  TContainerCount,
  TContainerCountBody,
  TContainerMovement,
  THolding,
  THoldingListQuery,
  TMovementCreate,
  TMovementListQuery,
} from "@wrs/contract/container";

import { http } from "@/lib/http";

export function listHoldings(query: THoldingListQuery, signal?: AbortSignal) {
  return http.get<TPage<THolding>>("/containers/holdings", { params: query, signal });
}

export function listMovements(query: TMovementListQuery, signal?: AbortSignal) {
  return http.get<TPage<TContainerMovement>>("/container-movements", { params: query, signal });
}

export function createMovement(body: TMovementCreate) {
  return http.post<TContainerMovement>("/container-movements", body);
}

export function listCounts(signal?: AbortSignal) {
  return http.get<TContainerCount[]>("/container-counts", { signal });
}

export function createCounts(body: TContainerCountBody) {
  return http.post<TContainerCount[]>("/container-counts", body);
}
