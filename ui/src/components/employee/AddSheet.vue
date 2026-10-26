<script setup lang="ts">
import type { TEmployee } from "@wrs/contract/employee";
import { PASSWORD_MIN_LENGTH } from "@wrs/contract/rules/employeeLimits";

import { createEmployee } from "@/services/employee";
import { ROLE_OPTIONS, type TRole } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  submit: [employee: TEmployee];
}>();

const toast = useToast();
const { run, isRunning, error } = useAction(createEmployee, { inline: ["validation", "employee.duplicate_username"] });

const passwordHint = `At least ${PASSWORD_MIN_LENGTH} characters`;

const firstName = ref("");
const lastName = ref("");
const phone = ref("");
const username = ref("");
const password = ref("");
const hireDate = ref(todayIso());
const roles = ref<TRole[]>([]);
const hasAttempted = ref(false);

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  firstName.value = "";
  lastName.value = "";
  phone.value = "";
  username.value = "";
  password.value = "";
  hireDate.value = todayIso();
  roles.value = [];
  hasAttempted.value = false;
});

const requiredErrors = computed(() => {
  if (!hasAttempted.value) {
    return {};
  }

  return {
    firstName: firstName.value.trim() ? undefined : "First name is required",
    lastName: lastName.value.trim() ? undefined : "Last name is required",
    username: username.value.trim() ? undefined : "Username is required",
    password: password.value.length >= PASSWORD_MIN_LENGTH ? undefined : `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    hireDate: hireDate.value ? undefined : "Hire date is required",
    roles: roles.value.length > 0 ? undefined : "Pick at least one role",
  };
});

const usernameError = computed(() => {
  if (requiredErrors.value.username) {
    return requiredErrors.value.username;
  }

  return error.value?.code === "employee.duplicate_username" ? error.value.message : undefined;
});

const formError = computed(() => {
  if (error.value == null || error.value.code === "employee.duplicate_username") {
    return undefined;
  }

  return error.value.message;
});

const hasRequiredErrors = computed(() => Object.values(requiredErrors.value).some((message) => message != null));

async function submit() {
  hasAttempted.value = true;

  if (hasRequiredErrors.value) {
    return;
  }

  const employee = await run({
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    phone: phone.value.trim() || undefined,
    username: username.value.trim(),
    password: password.value,
    roles: roles.value,
    hireDate: hireDate.value,
  });

  if (error.value != null || employee == null) {
    return;
  }

  emit("submit", employee);
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Add employee">
    <div class="flex flex-col gap-4">
      <UiField v-model="firstName" label="First name" :error="requiredErrors.firstName" />
      <UiField v-model="lastName" label="Last name" :error="requiredErrors.lastName" />
      <UiField v-model="phone" label="Phone" type="tel" />
      <UiField v-model="username" label="Username" autocomplete="username" :error="usernameError" />
      <UiField v-model="password" label="Password" type="password" autocomplete="new-password" :hint="passwordHint" :error="requiredErrors.password" />
      <UiField v-model="hireDate" label="Hire date" type="date" :error="requiredErrors.hireDate" />
      <UiCheckboxGroup v-model="roles" :options="ROLE_OPTIONS" legend="Roles" :error="requiredErrors.roles" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="formError" role="alert" class="text-sm text-red-700">{{ formError }}</p>
        <div class="flex justify-end gap-2">
          <UiButton size="lg" :loading="isRunning" @click="submit">Save employee</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
