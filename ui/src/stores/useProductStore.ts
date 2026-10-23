import type { TProduct } from "@wrs/contract/product";

import { products as mockProducts } from "@/mocks/products";
import { listProducts } from "@/services/product";

export const useProductStore = defineStore("product", () => {
  const products = ref<TProduct[]>([]);
  const isLoaded = ref(false);

  async function refresh() {
    products.value = await listProducts({});
    isLoaded.value = true;
  }

  async function load() {
    if (isLoaded.value) {
      return;
    }

    await refresh();
  }

  function findProduct(id: string) {
    return mockProducts.find((product) => product.id === id);
  }

  function productName(id: string) {
    return findProduct(id)?.name ?? "Unknown";
  }

  return { products, isLoaded, load, refresh, findProduct, productName };
});
