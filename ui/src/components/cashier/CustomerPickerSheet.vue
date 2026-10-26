<script setup lang="ts">
import type { TCustomer, TCustomerCreate } from "@wrs/contract/customer";

import { ApiError } from "@/lib/http";
import { createCustomer, getCustomer, listCustomers } from "@/services/customer";

const open = defineModel<boolean>("open", { default: false });

const {
  title = "Select customer",
  allowQuickAdd = true,
  balance = "any",
} = defineProps<{
  title?: string;
  allowQuickAdd?: boolean;
  balance?: "any" | "owing";
}>();

const emit = defineEmits<{
  select: [customer: TCustomer];
}>();

const dialog = useConfirm();
const query = ref("");
const isAdding = ref(false);
const firstName = ref("");
const lastName = ref("");
const phone = ref("");
const address = ref("");

const {
  data,
  isLoading,
  error: loadError,
  reload,
} = useResource((signal) => listCustomers({ q: query.value, balance, pageSize: 20 }, signal), {
  watch: [query, () => balance],
  debounce: 300,
});

const results = computed(() => data.value?.items ?? []);

const canAdd = computed(() => [firstName, lastName, phone, address].every(({ value }) => value.trim().length > 0));

async function createWithGuard(body: TCustomerCreate) {
  try {
    return await createCustomer(body);
  } catch (caught) {
    if (!(caught instanceof ApiError) || caught.code !== "customer.duplicate_name") {
      throw caught;
    }

    const isConfirmed = await dialog.confirm({
      title: "Customer name already exists",
      message: `${caught.message}\nAdd this as a separate customer anyway?`,
      confirmLabel: "Add anyway",
    });

    if (!isConfirmed) {
      return undefined;
    }

    return await createCustomer({ ...body, allowDuplicateName: true });
  }
}

const { run: add, isRunning: isAddingRunning, error: addError } = useAction(createWithGuard, { inline: ["customer.duplicate_phone"] });
const { run: fetchExisting, isRunning: isFetchingExisting } = useAction(getCustomer);

const existingId = computed(() => {
  const id = addError.value?.code === "customer.duplicate_phone" ? addError.value.details?.customerId : undefined;

  return typeof id === "string" ? id : undefined;
});

function reset() {
  query.value = "";
  isAdding.value = false;
  firstName.value = "";
  lastName.value = "";
  phone.value = "";
  address.value = "";
}

function pick(customer: TCustomer) {
  emit("select", customer);
  reset();
  open.value = false;
}

async function addCustomer() {
  if (!canAdd.value) {
    return;
  }

  const customer = await add({
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    phone: phone.value.trim(),
    address: address.value.trim(),
  });

  if (customer != null) {
    pick(customer);
  }
}

async function useExisting() {
  if (existingId.value == null) {
    return;
  }

  const customer = await fetchExisting(existingId.value);

  if (customer != null) {
    pick(customer);
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    reload();
  }
});
</script>

<template>
  <UiBottomSheet v-model:open="open" :title="isAdding ? 'Quick-add customer' : title">
    <div v-if="!isAdding" class="flex flex-col gap-3">
      <UiSearchInput v-model="query" label="Search customers" />
      <div class="flex max-h-80 flex-col divide-y divide-zinc-100 overflow-y-auto">
        <UiEmptyState v-if="loadError != null" title="Couldn't load" :description="loadError.message">
          <template #action>
            <UiButton variant="secondary" @click="reload">Retry</UiButton>
          </template>
        </UiEmptyState>
        <template v-else>
          <button
            v-for="customer in results"
            :key="customer.id"
            type="button"
            class="flex min-h-12 shrink-0 flex-col items-start px-1 py-3 text-left focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none"
            @click="pick(customer)"
          >
            <span class="text-base font-medium text-zinc-900">{{ fullName(customer) }}</span>
            <span class="text-sm text-zinc-500">{{ customer.address }}</span>
          </button>
          <p v-if="isLoading" class="py-6 text-center text-base text-zinc-500">Searching…</p>
          <p v-else-if="data != null && results.length === 0" class="py-6 text-center text-base text-zinc-500">No matching customers</p>
        </template>
      </div>
      <UiButton v-if="allowQuickAdd" variant="secondary" @click="isAdding = true">Quick-add new customer</UiButton>
    </div>
    <div v-else class="flex flex-col gap-3">
      <UiField v-model="firstName" label="First name" />
      <UiField v-model="lastName" label="Last name" />
      <UiField v-model="phone" label="Phone" type="tel" />
      <UiField v-model="address" label="Address" />
      <p v-if="addError != null" role="alert" class="text-sm text-red-600">{{ addError.message }}</p>
      <div class="flex flex-wrap justify-end gap-2">
        <UiButton v-if="existingId != null" variant="secondary" :loading="isFetchingExisting" @click="useExisting">Use existing customer</UiButton>
        <UiButton variant="ghost" @click="isAdding = false">Back to search</UiButton>
        <UiButton :disabled="!canAdd" :loading="isAddingRunning" @click="addCustomer">Add and select</UiButton>
      </div>
    </div>
  </UiBottomSheet>
</template>
