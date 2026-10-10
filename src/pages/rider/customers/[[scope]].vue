<script setup lang="ts">
import { ROUTES } from "@/types";
import type { TCustomer, TCustomerScope } from "@/types";

definePage({ meta: { title: "Customers" } });

const route = useRoute();
const openTrip = useOpenTrip();

const SCOPES: TCustomerScope[] = ["mine", "open", "all"];

const scope = computed(() => SCOPES.find((candidate) => candidate === route.params.scope) ?? "mine");

function deliverTo(customer: TCustomer) {
  return openTrip.value ? ROUTES.RIDER.DELIVER(openTrip.value.id, customer.id) : ROUTES.RIDER.INDEX;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <template v-if="!openTrip">
      <UiPageHeader title="Customers" />
      <UiEmptyState title="No open trip" description="Open a trip from your cashier before delivering to a customer." />
    </template>

    <RiderCustomerList v-else :scope="scope" :get-to="deliverTo" />
  </div>
</template>
