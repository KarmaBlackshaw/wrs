<script setup lang="ts">
import type { TEmployee } from "@wrs/contract/employee";

import { updateEmployee } from "@/services/employee";
import { ROLE_OPTIONS, type TRole } from "@/types";

const employee = defineModel<TEmployee>("employee");

const emit = defineEmits<{
  submit: [employee: TEmployee];
}>();

const toast = useToast();
const { run, isRunning, error } = useAction(updateEmployee, { inline: ["validation", "employee.last_owner"] });

const firstName = ref("");
const lastName = ref("");
const phone = ref("");
const hireDate = ref("");
const isActive = ref(true);
const roles = ref<TRole[]>([]);
const hasAttempted = ref(false);

const isOpen = computed({
  get: () => employee.value != null,
  set: (value) => {
    if (!value) {
      employee.value = undefined;
    }
  },
});

watch(employee, (current) => {
  if (current == null) {
    return;
  }

  firstName.value = current.firstName;
  lastName.value = current.lastName;
  phone.value = current.phone ?? "";
  hireDate.value = current.hireDate;
  isActive.value = current.active;
  roles.value = [...current.roles];
  hasAttempted.value = false;
});

const requiredErrors = computed(() => {
  if (!hasAttempted.value) {
    return {};
  }

  return {
    firstName: firstName.value.trim() ? undefined : "First name is required",
    lastName: lastName.value.trim() ? undefined : "Last name is required",
    hireDate: hireDate.value ? undefined : "Hire date is required",
    roles: roles.value.length > 0 ? undefined : "Pick at least one role",
  };
});

const formError = computed(() => error.value?.message);

const hasRequiredErrors = computed(() => Object.values(requiredErrors.value).some((message) => message != null));

async function submit() {
  hasAttempted.value = true;

  if (employee.value == null || hasRequiredErrors.value) {
    return;
  }

  const updated = await run({
    id: employee.value.id,
    body: {
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      phone: phone.value.trim(),
      roles: roles.value,
      active: isActive.value,
      hireDate: hireDate.value,
    },
  });

  if (error.value != null || updated == null) {
    return;
  }

  emit("submit", updated);
  employee.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Edit employee">
    <div class="flex flex-col gap-4">
      <UiField v-model="firstName" label="First name" :error="requiredErrors.firstName" />
      <UiField v-model="lastName" label="Last name" :error="requiredErrors.lastName" />
      <UiField v-model="phone" label="Phone" type="tel" />
      <UiField v-model="hireDate" label="Hire date" type="date" :error="requiredErrors.hireDate" />
      <UiCheckboxGroup v-model="roles" :options="ROLE_OPTIONS" legend="Roles" :error="requiredErrors.roles" />
      <UiCheckbox v-model="isActive" label="Active" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="formError" role="alert" class="text-sm text-red-700">{{ formError }}</p>
        <div class="flex justify-end gap-2">
          <UiButton size="lg" :loading="isRunning" @click="submit">Save changes</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
