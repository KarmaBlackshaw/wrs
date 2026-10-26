<script setup lang="ts">
import type { TCustomer } from "@wrs/contract/customer";

import { ROUTES, type TRiderCustomerScope } from "@/types";

definePage({ meta: { title: "Customers" } });

const route = useRoute();
const riderStore = useRiderStore();
const { trip, isHydrated } = storeToRefs(riderStore);

const SCOPES: TRiderCustomerScope[] = ["mine", "all"];

const scope = computed(() => SCOPES.find((candidate) => candidate === route.params.scope) ?? "mine");

function deliverTo(customer: TCustomer) {
  return trip.value ? ROUTES.RIDER.DELIVER(trip.value.id, customer.id) : ROUTES.RIDER.INDEX;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <template v-if="isHydrated && !trip">
      <UiPageHeader title="Customers" />
      <UiEmptyState title="No open trip" description="Open a trip from your cashier before delivering to a customer." />
    </template>

    <RiderCustomerList v-else :scope="scope" :get-to="deliverTo" />
  </div>
</template>
