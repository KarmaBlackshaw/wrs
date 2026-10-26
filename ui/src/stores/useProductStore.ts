import type { TProduct } from "@wrs/contract/product";

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

  return { products, load, refresh };
});
