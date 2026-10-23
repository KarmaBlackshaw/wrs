import type { TSettingEntry, TSettingWrite } from "@wrs/contract/setting";

import { http } from "@/lib/http";

export function listSettings(signal?: AbortSignal) {
  return http.get<TSettingEntry[]>("/settings", { signal });
}

export function createSetting(body: TSettingWrite) {
  return http.post<TSettingEntry>("/settings", body);
}
