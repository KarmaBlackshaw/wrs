import type { TContainerType, TContainerTypeCode, TContainerTypeUpdate } from "@wrs/contract/container";

import { http } from "@/lib/http";

export function listContainerTypes(signal?: AbortSignal) {
  return http.get<TContainerType[]>("/container-types", { signal });
}

export function updateContainerType({ code, body }: { code: TContainerTypeCode; body: TContainerTypeUpdate }) {
  return http.patch<TContainerType>(`/container-types/${code}`, body);
}
