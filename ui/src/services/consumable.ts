import type { TConsumable, TConsumableCreate, TConsumableUpdate, TUsagesPutBody } from "@wrs/contract/consumable";

import { http } from "@/lib/http";

export function listConsumables(signal?: AbortSignal) {
  return http.get<TConsumable[]>("/consumables", { signal });
}

export function createConsumable(body: TConsumableCreate) {
  return http.post<TConsumable>("/consumables", body);
}

export function updateConsumable({ id, body }: { id: string; body: TConsumableUpdate }) {
  return http.patch<TConsumable>(`/consumables/${id}`, body);
}

export function putConsumableUsages({ id, body }: { id: string; body: TUsagesPutBody }) {
  return http.put<TConsumable>(`/consumables/${id}/usages`, body);
}
