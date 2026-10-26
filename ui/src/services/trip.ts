import type { TPage } from "@wrs/contract/common";
import type { TLoadOutBody, TReceiveBody, TTrip, TTripDetail, TTripListQuery } from "@wrs/contract/trip";

import { http } from "@/lib/http";

export function listTrips(query: TTripListQuery, signal?: AbortSignal) {
  return http.get<TPage<TTrip>>("/trips", { params: query, signal });
}

export function getTrip(id: string, signal?: AbortSignal) {
  return http.get<TTripDetail>(`/trips/${id}`, { signal });
}

export function loadOutTrip(body: TLoadOutBody) {
  return http.post<TTripDetail>("/trips", body);
}

export function receiveTrip(id: string, body: TReceiveBody) {
  return http.post<TTripDetail>(`/trips/${id}/receive`, body);
}

export function reconcileTrip(id: string) {
  return http.post<TTripDetail>(`/trips/${id}/reconcile`);
}
