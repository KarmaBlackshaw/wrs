import type { Component } from "vue";

import type { LayoutName, TRole } from "@/types";

const layouts = import.meta.glob<Component>("@/layouts/*.vue", { eager: true, import: "default" });

const ROLE_LAYOUT: Record<TRole, LayoutName> = {
  owner: "Owner",
  cashier: "Cashier",
  rider: "Rider",
  washer: "Staff",
  helper: "Staff",
};

export function useLayout() {
  const route = useRoute();
  const authStore = useAuthStore();

  const layoutName = computed<LayoutName>(() => {
    if (route.meta.layout) {
      return route.meta.layout;
    }

    return authStore.activeRole ? ROLE_LAYOUT[authStore.activeRole] : "Auth";
  });

  const layout = computed(() => layouts[`/src/layouts/${layoutName.value}.vue`]);

  return { layout };
}
