import type { TLoginBody, TMe, TRole } from "@wrs/contract/auth";

import { getMe, login as loginRequest } from "@/services/auth";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const token = ref<string>();
    const activeRole = ref<TRole>();
    const me = ref<TMe>();

    const isAuthenticated = computed(() => token.value != null);
    const meName = computed(() => (me.value != null ? fullName(me.value) : undefined));

    async function login(body: TLoginBody) {
      const response = await loginRequest(body);

      token.value = response.token;
      me.value = response.me;
      activeRole.value = response.me.roles.length === 1 ? response.me.roles[0] : undefined;
    }

    async function fetchMe() {
      me.value = await getMe();
    }

    function switchRole(role: TRole) {
      if (!me.value?.roles.includes(role)) {
        throw new Error("Employee does not hold that role.");
      }

      activeRole.value = role;
    }

    function logout() {
      token.value = undefined;
      activeRole.value = undefined;
      me.value = undefined;
    }

    return { token, activeRole, me, isAuthenticated, meName, login, fetchMe, switchRole, logout };
  },
  { persist: { pick: ["token", "activeRole", "me"] } }
);
