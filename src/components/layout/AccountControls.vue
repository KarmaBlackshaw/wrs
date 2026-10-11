<script setup lang="ts">
import { ROLE_HOME, ROLE_LABEL, ROUTES, type TRole } from "@/types";

const authStore = useAuthStore();
const router = useRouter();

const activeRole = computed({
  get: () => authStore.activeRole,
  set: (role: TRole | null) => {
    if (!role) {
      return;
    }

    authStore.switchRole(role);
    router.push(ROLE_HOME[role]);
  },
});

function logout() {
  authStore.logout();
  router.push(ROUTES.LOGIN);
}

const roleOptions = computed(() => authStore.user?.roles.map((role) => ({ value: role, label: ROLE_LABEL[role] })) ?? []);
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiSelect v-if="authStore.user && authStore.user.roles.length > 1" v-model="activeRole" label="Switch role" :options="roleOptions" />
    <UiButton variant="ghost" block @click="logout">
      <IconSignOut class="size-5" />
      Log out
    </UiButton>
  </div>
</template>
