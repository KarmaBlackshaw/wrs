import type { TContainerType } from "@wrs/contract/container";
import { listContainerTypes } from "@/services/containerType";

export const useContainerTypeStore = defineStore("containerType", () => {
  const types = ref<TContainerType[]>([]);
  const isLoaded = ref(false);

  async function refresh() {
    types.value = await listContainerTypes();
    isLoaded.value = true;
  }

  async function load() {
    if (isLoaded.value) {
      return;
    }

    await refresh();
  }

  return { types, load, refresh };
});
