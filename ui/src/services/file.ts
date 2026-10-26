import type { TFile } from "@wrs/contract/file";

import { http } from "@/lib/http";

export function uploadFile(file: File) {
  const body = new FormData();

  body.append("file", file);

  return http.post<TFile>("/files", body, { timeout: 120_000 });
}

export function getFileBlob(id: string, signal?: AbortSignal) {
  return http.get<Blob>(`/files/${id}`, { responseType: "blob", signal });
}
