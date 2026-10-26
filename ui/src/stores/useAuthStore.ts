import type { TLoginBody, TMe, TRole } from "@wrs/contract/auth";

import { getMe, login as loginRequest } from "@/services/auth";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const token = ref<string>();
    const activeRole = ref<TRole>();
    const me = ref<TMe>();

    const toast = useToast();

    const isAuthenticated = computed(() => token.value != null);
    const meName = computed(() => (me.value != null ? fullName(me.value) : undefined));

    async function login(body: TLoginBody) {
      const response = await loginRequest(body);

      token.value = response.token;
      me.value = response.me;
      activeRole.value = response.me.roles.length === 1 ? response.me.roles[0] : undefined;

      await persistStorage();
    }

    async function persistStorage() {
      if (activeRole.value === "rider") {
        await navigator.storage?.persist?.();
      }
    }

    async function fetchMe() {
      me.value = await getMe();
    }

    function switchRole(role: TRole) {
      if (!me.value?.roles.includes(role)) {
        throw new Error("Employee does not hold that role.");
      }

      activeRole.value = role;
      persistStorage();
    }

    function logout({ isForced = false } = {}) {
      if (!isForced) {
        const sync = useSyncStore();
        const count = sync.pending.length;

        if (count > 0) {
          toast.show(`You have ${count} unsynced ${count === 1 ? "item" : "items"}. Connect and wait for 'Synced' before logging out.`, "warning");

          return false;
        }
      }

      token.value = undefined;
      activeRole.value = undefined;
      me.value = undefined;

      return true;
    }

    return { token, activeRole, me, isAuthenticated, meName, login, fetchMe, switchRole, logout };
  },
  { persist: { pick: ["token", "activeRole", "me"] } }
);
