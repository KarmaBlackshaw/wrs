<script setup lang="ts">
import type { TCustomer } from "@/types";
import { customers as baseCustomers } from "@/mocks/customers";

const open = defineModel<boolean>("open", { default: false });

const { title = "Select customer", allowQuickAdd = true } = defineProps<{
  title?: string;
  allowQuickAdd?: boolean;
}>();

const emit = defineEmits<{
  select: [customer: TCustomer];
}>();

const query = ref("");
const adding = ref(false);
const extraCustomers = ref<TCustomer[]>([]);
const newName = ref("");
const newPhone = ref("");
const newAddress = ref("");

const allCustomers = computed(() => [...baseCustomers, ...extraCustomers.value]);

const results = useCustomerSearch(query, allCustomers);

const canAdd = computed(() => newName.value.trim().length > 0 && newPhone.value.trim().length > 0 && newAddress.value.trim().length > 0);

function reset() {
  query.value = "";
  adding.value = false;
  newName.value = "";
  newPhone.value = "";
  newAddress.value = "";
}

function pick(customer: TCustomer) {
  emit("select", customer);
  reset();
  open.value = false;
}

function addCustomer() {
  if (!canAdd.value) {
    return;
  }

  const customer: TCustomer = {
    id: `cust-local-${Date.now()}`,
    name: newName.value.trim(),
    phone: newPhone.value.trim(),
    address: newAddress.value.trim(),
    creditEnabled: false,
    depositWaived: false,
    containersHeld: 0,
    depositOnFile: 0,
    creditBalance: 0,
    agingBucket: "current",
  };

  extraCustomers.value.push(customer);
  pick(customer);
}
</script>

<template>
  <UiBottomSheet v-model:open="open" :title="adding ? 'Quick-add customer' : title">
    <div v-if="!adding" class="flex flex-col gap-3">
      <UiSearchInput v-model="query" label="Search customers" />
      <div class="flex max-h-80 flex-col divide-y divide-zinc-100 overflow-y-auto">
        <button
          v-for="customer in results"
          :key="customer.id"
          type="button"
          class="flex min-h-12 shrink-0 flex-col items-start px-1 py-3 text-left focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none"
          @click="pick(customer)"
        >
          <span class="text-base font-medium text-zinc-900">{{ customer.name }}</span>
          <span class="text-sm text-zinc-500">{{ customer.address }}</span>
        </button>
        <p v-if="results.length === 0" class="py-6 text-center text-base text-zinc-500">No matching customers</p>
      </div>
      <UiButton v-if="allowQuickAdd" variant="secondary" @click="adding = true">Quick-add new customer</UiButton>
    </div>
    <div v-else class="flex flex-col gap-3">
      <UiField v-model="newName" label="Name" />
      <UiField v-model="newPhone" label="Phone" type="tel" />
      <UiField v-model="newAddress" label="Address" />
      <div class="flex justify-end gap-2">
        <UiButton variant="ghost" @click="adding = false">Back to search</UiButton>
        <UiButton :disabled="!canAdd" @click="addCustomer">Add and select</UiButton>
      </div>
    </div>
  </UiBottomSheet>
</template>
