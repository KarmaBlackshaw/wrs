<script setup lang="ts">
import type { TErrorCode } from "@wrs/contract/common";

import { ApiError } from "@/lib/http";
import { ROLE_HOME, ROLE_LABEL, type TRole } from "@/types";

definePage({ meta: { layout: "Auth", title: "Log in" } });

const LOGIN_ERROR_MESSAGE: Partial<Record<TErrorCode | "network", string>> = {
  "auth.invalid_credentials": "Incorrect username or password",
  "auth.inactive": "This account is inactive",
};

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const username = ref("");
const password = ref("");
const errorMessage = ref<string>();
const isSubmitting = ref(false);
const roleHeading = useTemplateRef("roleHeading");

const isPickingRole = computed(() => authStore.me != null && authStore.activeRole == null);
const title = computed(() => (isPickingRole.value ? "Choose a role" : "Log in"));
const subtitle = computed(() => (isPickingRole.value ? `Log in as ${authStore.meName}` : "Enter your username and password"));

watch(isPickingRole, async (isPicking) => {
  if (!isPicking) {
    return;
  }

  await nextTick();
  roleHeading.value?.focus();
});

function goHome(role: TRole) {
  const redirect = route.query.redirect;

  router.push(typeof redirect === "string" && redirect.startsWith("/") ? redirect : ROLE_HOME[role]);
}

async function submit() {
  errorMessage.value = undefined;
  isSubmitting.value = true;

  try {
    await authStore.login({ username: username.value, password: password.value });
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught;
    }

    errorMessage.value = LOGIN_ERROR_MESSAGE[caught.code] ?? caught.message;

    return;
  } finally {
    isSubmitting.value = false;
  }

  if (authStore.activeRole != null) {
    goHome(authStore.activeRole);
  }
}

function pickRole(role: TRole) {
  authStore.switchRole(role);
  goHome(role);
}

function back() {
  authStore.logout();
  password.value = "";
}
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-8">
    <div class="flex items-center">
      <span class="flex items-center gap-2 lg:invisible">
        <span class="grid size-9 place-items-center rounded-lg bg-brand-700 text-white">
          <IconDropFill class="size-5" />
        </span>
        <span class="text-lg font-semibold tracking-tight">WRS</span>
      </span>
    </div>

    <div class="flex flex-col gap-1">
      <h1 ref="roleHeading" tabindex="-1" class="text-2xl font-semibold tracking-tight outline-none">{{ title }}</h1>
      <p class="text-sm text-zinc-500">{{ subtitle }}</p>
    </div>

    <form v-if="!isPickingRole" class="flex flex-col gap-4" @submit.prevent="submit">
      <UiField v-model="username" label="Username" autocomplete="username" autocapitalize="none" spellcheck="false" />
      <UiField v-model="password" label="Password" type="password" autocomplete="current-password" />
      <p v-if="errorMessage" role="alert" class="text-sm text-red-700">{{ errorMessage }}</p>
      <UiButton type="submit" size="lg" block :loading="isSubmitting">Log in</UiButton>
    </form>

    <div v-else-if="authStore.me" class="flex flex-col gap-3">
      <UiButton v-for="role in authStore.me.roles" :key="role" block @click="pickRole(role)">
        {{ ROLE_LABEL[role] }}
      </UiButton>
      <UiButton variant="ghost" block @click="back">
        <IconArrowLeft class="size-5" />
        Back
      </UiButton>
    </div>
  </div>
</template>
