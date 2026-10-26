import type { TWalkInSale, TWalkInSaleBody, TWalkInSaleQuote } from "@wrs/contract/sale";

import { http } from "@/lib/http";

export function quoteWalkInSale(body: TWalkInSaleBody, signal?: AbortSignal) {
  return http.post<TWalkInSaleQuote>("/walk-in-sales/quote", body, { signal });
}

export function createWalkInSale(body: TWalkInSaleBody) {
  return http.post<TWalkInSale>("/walk-in-sales", body);
}
