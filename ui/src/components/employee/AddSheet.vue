<script setup lang="ts">
import { ROLE_LABEL, type TEmployee, type TRole } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  submit: [employee: Pick<TEmployee, "name" | "phone" | "roles">];
}>();

const toast = useToast();

const allRoles: TRole[] = ["owner", "cashier", "rider", "washer", "helper"];

const newName = ref("");
const newPhone = ref("");
const newRoles = ref<TRole[]>([]);

const canAddEmployee = computed(() => newName.value.trim().length > 0 && newPhone.value.trim().length > 0 && newRoles.value.length > 0);

function toggleRole(role: TRole) {
  newRoles.value = newRoles.value.includes(role) ? newRoles.value.filter((candidate) => candidate !== role) : [...newRoles.value, role];
}

function submit() {
  if (!canAddEmployee.value) {
    return;
  }

  emit("submit", {
    name: newName.value.trim(),
    phone: newPhone.value.trim(),
    roles: newRoles.value,
  });

  newName.value = "";
  newPhone.value = "";
  newRoles.value = [];
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Add employee">
    <div class="flex flex-col gap-4">
      <UiField v-model="newName" label="Full name" />
      <UiField v-model="newPhone" label="Phone" type="tel" />
      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-zinc-700">Roles</span>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="role in allRoles"
            :key="role"
            class="flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 shadow-xs"
          >
            <input type="checkbox" :checked="newRoles.includes(role)" @change="toggleRole(role)" />
            <span class="text-base text-zinc-700">{{ ROLE_LABEL[role] }}</span>
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canAddEmployee" @click="submit">Save employee</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
