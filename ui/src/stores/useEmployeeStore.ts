import type { TOption } from "@/types";

import { listEmployeeOptions } from "@/services/employee";

export const useEmployeeStore = defineStore("employee", () => {
  const riderOptions = ref<TOption[]>([]);
  const isLoaded = ref(false);

  async function refresh() {
    const options = await listEmployeeOptions({ role: "rider" });

    riderOptions.value = options.map(({ id, name }) => ({ value: id, label: name }));
    isLoaded.value = true;
  }

  async function load() {
    if (isLoaded.value) {
      return;
    }

    await refresh();
  }

  return { riderOptions, load, refresh };
});
