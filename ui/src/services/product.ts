import type { TPrice, TPriceCreate, TProduct, TProductCreate, TProductListQuery, TProductUpdate } from "@wrs/contract/product";

import { http } from "@/lib/http";

export function listProducts(query: TProductListQuery, signal?: AbortSignal) {
  return http.get<TProduct[]>("/products", { params: query, signal });
}

export function listProductPrices(productId: string, signal?: AbortSignal) {
  return http.get<TPrice[]>(`/products/${productId}/prices`, { signal });
}

export function createProduct(body: TProductCreate) {
  return http.post<TProduct>("/products", body);
}

export function updateProduct({ id, body }: { id: string; body: TProductUpdate }) {
  return http.patch<TProduct>(`/products/${id}`, body);
}

export function createPrice({ productId, body }: { productId: string; body: TPriceCreate }) {
  return http.post<TPrice>(`/products/${productId}/prices`, body);
}
