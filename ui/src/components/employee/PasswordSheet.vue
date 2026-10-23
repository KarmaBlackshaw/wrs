<script setup lang="ts">
import type { TEmployee } from "@wrs/contract/employee";

import { PASSWORD_MIN_LENGTH } from "@wrs/contract/rules/employeeLimits";

import { setEmployeePassword } from "@/services/employee";

const employee = defineModel<TEmployee>("employee");

const emit = defineEmits<{
  submit: [];
}>();

const toast = useToast();
const { run, isRunning, error } = useAction(setEmployeePassword, { inline: ["validation"] });

const password = ref("");

const isOpen = computed({
  get: () => employee.value != null,
  set: (value) => {
    if (!value) {
      employee.value = undefined;
    }
  },
});

watch(employee, () => {
  password.value = "";
});

const canSubmit = computed(() => password.value.length >= PASSWORD_MIN_LENGTH);

async function submit() {
  if (employee.value == null) {
    return;
  }

  await run({ id: employee.value.id, body: { password: password.value } });

  if (error.value != null) {
    return;
  }

  emit("submit");
  employee.value = undefined;
  toast.show("Password reset");
}
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Reset password">
    <div class="flex flex-col gap-4">
      <UiField v-model="password" label="New password" type="password" autocomplete="new-password" :hint="`At least ${PASSWORD_MIN_LENGTH} characters.`" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <p v-if="!canSubmit" id="password-block-reason" class="text-sm text-zinc-600">Enter at least {{ PASSWORD_MIN_LENGTH }} characters to reset.</p>
        <div class="flex justify-end gap-2">
          <UiButton size="lg" :disabled="!canSubmit" :loading="isRunning" :aria-describedby="canSubmit ? undefined : 'password-block-reason'" @click="submit"
            >Reset password</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
