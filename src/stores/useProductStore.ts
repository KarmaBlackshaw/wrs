import { products as mockProducts } from "@/mocks/products";

export const useProductStore = defineStore("product", () => {
  const products = ref(mockProducts);

  function findProduct(id: string) {
    return products.value.find((product) => product.id === id);
  }

  function productName(id: string) {
    return findProduct(id)?.name ?? "Unknown";
  }

  return { products, findProduct, productName };
});
