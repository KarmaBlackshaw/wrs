import type { TPage } from "@wrs/contract/common";
import type { TDrawerCloseBody, TDrawerCurrent, TDrawerOpenBody, TDrawerSession, TDrawerSessionListQuery } from "@wrs/contract/drawer";

import { http } from "@/lib/http";

export function getCurrentDrawer(signal?: AbortSignal) {
  return http.get<TDrawerCurrent>("/drawer-sessions/current", { signal });
}

export function openDrawer(body: TDrawerOpenBody) {
  return http.post<TDrawerSession>("/drawer-sessions", body);
}

export function closeDrawer(body: TDrawerCloseBody) {
  return http.post<TDrawerSession>("/drawer-sessions/current/close", body);
}

export function listDrawerSessions(query: TDrawerSessionListQuery, signal?: AbortSignal) {
  return http.get<TPage<TDrawerSession>>("/drawer-sessions", { params: query, signal });
}
