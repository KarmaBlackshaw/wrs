import type { TContainerReturnBody, TContainerReturnQuote } from "@wrs/contract/container";

import { http } from "@/lib/http";

export function quoteContainerReturn(body: TContainerReturnBody) {
  return http.post<TContainerReturnQuote>("/container-returns/quote", body);
}

export function commitContainerReturn(body: TContainerReturnBody) {
  return http.post<TContainerReturnQuote>("/container-returns", body);
}
