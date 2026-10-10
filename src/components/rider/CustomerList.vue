<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

import { IconUsers } from "@/components";
import { customers } from "@/mocks/customers";
import { RIDER_TABS } from "@/types";
import type { TCustomer, TCustomerScope, TRowAction } from "@/types";

const { getTo, scope = "mine" } = defineProps<{
  getTo: (customer: TCustomer) => RouteLocationRaw;
  scope?: TCustomerScope;
}>();

const authStore = useAuthStore();
const toast = useToast();
const router = useRouter();

const columns = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
];

// ponytail: accepts live only in this component until the API persists them.
const acceptedIds = ref(new Set<string>());

function riderOf(customer: TCustomer) {
  return acceptedIds.value.has(customer.id) ? authStore.user?.id : customer.riderId;
}

const scoped = computed(() => {
  if (scope === "all") {
    return customers;
  }

  const riderId = scope === "mine" ? authStore.user?.id : undefined;

  return customers.filter((customer) => riderOf(customer) === riderId);
});

const query = ref("");
const filtered = useCustomerSearch(query, scoped);

const EMPTY_DESCRIPTION: Record<TCustomerScope, string> = {
  mine: "Accept customers from Open, or switch to All when covering for another rider.",
  open: "Every customer has a rider.",
  all: "Try a different name, phone, or address.",
};

function accept(customer: TCustomer) {
  acceptedIds.value.add(customer.id);
  toast.show(`${customer.name} added to your customers`);
}

function openCustomer(customer: TCustomer) {
  router.push(getTo(customer));
}

function acceptAction(customer: TCustomer): TRowAction[] {
  return [{ label: "Accept", variant: "secondary", onSelect: () => accept(customer) }];
}

const isOpenScope = computed(() => scope === "open");
const rowActions = computed(() => (isOpenScope.value ? acceptAction : undefined));
</script>

<template>
  <UiDataTable
    title="Customers"
    :icon="IconUsers"
    :tabs="RIDER_TABS.CUSTOMERS"
    :columns="columns"
    :rows="filtered"
    :row-key="(row) => row.id"
    :clickable="!isOpenScope"
    :row-actions="rowActions"
    @row-click="openCustomer"
  >
    <template #actions>
      <UiSearchInput v-model="query" label="Search customers by name, phone, or address" />
    </template>
    <template #empty>
      <UiEmptyState title="No customers found" :description="EMPTY_DESCRIPTION[scope]" />
    </template>
  </UiDataTable>
</template>
