<script setup lang="ts">
import { deliveries, trips } from "@/mocks/trips";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Customer" } });

const { employeeName } = useEmployeeLookup();
const { findCustomer } = useCustomerLookup();

const route = useRoute("/owner/customers/[id]");
const toast = useToast();
const confirmDialog = useConfirm();

const customer = computed(() => findCustomer(route.params.id));
const riderName = computed(() => (customer.value?.riderId ? employeeName(customer.value.riderId) : "Open"));
const headerSubtitle = computed(() => (customer.value ? `${customer.value.phone} · ${customer.value.address} · ${riderName.value}` : ""));

const historyColumns = [
  { key: "date", label: "Date" },
  { key: "rider", label: "Rider" },
  { key: "delivered", label: "Delivered", align: "right" as const },
  { key: "empties", label: "Empties", align: "right" as const },
  { key: "amount", label: "Amount", align: "right" as const },
  { key: "paymentType", label: "Payment" },
];

function riderNameForTrip(tripId: string) {
  const trip = trips.find((candidate) => candidate.id === tripId);

  return trip ? employeeName(trip.riderId) : "Rider";
}

const history = computed(() =>
  deliveries
    .filter((delivery) => delivery.customerId === customer.value?.id)
    .map((delivery) => ({
      id: delivery.id,
      date: delivery.createdAt,
      rider: riderNameForTrip(delivery.tripId),
      delivered: delivery.delivered,
      empties: delivery.emptiesCollected,
      amount: delivery.amount,
      paymentType: delivery.paymentType,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
);

const creditSheetOpen = ref(false);
const editSheetOpen = ref(false);

async function toggleWaive() {
  const isConfirmed = await confirmDialog.confirm({
    title: "Deposit waiver",
    message: customer.value?.depositWaived ? "Stop waiving deposits for this customer?" : "Waive deposits for this customer going forward?",
  });

  if (isConfirmed) {
    toast.show("Deposit waiver saved");
  }
}
</script>

<template>
  <div v-if="customer" class="flex flex-col gap-4">
    <UiPageHeader :title="customer.name" :subtitle="headerSubtitle" :back="ROUTES.OWNER.CUSTOMERS.INDEX">
      <template #actions>
        <UiButton variant="secondary" @click="editSheetOpen = true">Edit</UiButton>
      </template>
    </UiPageHeader>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <UiStatCard label="Containers held">{{ customer.containersHeld }}</UiStatCard>
      <UiStatCard label="Deposit on file">
        <UiMoneyText :centavos="customer.depositOnFile" size="lg" />
      </UiStatCard>
      <UiStatCard label="Credit balance" :tone="customer.creditBalance > 0 ? 'warn' : 'default'">
        <UiMoneyText :centavos="customer.creditBalance" size="lg" />
        <template v-if="customer.creditEnabled">
          <span class="ml-2 text-sm font-normal"
            ><UiStatusPill :tone="AGING_TONE[customer.agingBucket]">{{ AGING_LABEL[customer.agingBucket] }}</UiStatusPill></span
          >
        </template>
      </UiStatCard>
    </div>

    <UiCard title="Credit and deposit">
      <template #actions>
        <UiButton variant="secondary" size="md" @click="creditSheetOpen = true">{{
          customer.creditEnabled ? "Change credit limit" : "Enable credit"
        }}</UiButton>
        <UiButton variant="secondary" size="md" @click="toggleWaive">{{ customer.depositWaived ? "Un-waive deposit" : "Waive deposit" }}</UiButton>
      </template>
      <div class="flex flex-col gap-1 text-base text-zinc-700">
        <p>Credit: {{ customer.creditEnabled ? `Enabled, limit ${formatMoney(customer.creditLimit ?? 0)}` : "Not enabled" }}</p>
        <p>Deposit: {{ customer.depositWaived ? "Waived" : "Charged per borrowed container" }}</p>
      </div>
    </UiCard>

    <UiDataTable title="Delivery history" :columns="historyColumns" :rows="history" :row-key="(row) => row.id">
      <template #cell-date="{ row }">{{ formatDateTime(row.date) }}</template>
      <template #cell-amount="{ row }">
        <UiMoneyText :centavos="row.amount" />
      </template>
      <template #cell-paymentType="{ row }">{{ PAYMENT_LABEL[row.paymentType] }}</template>
      <template #empty>
        <UiEmptyState title="No deliveries yet" />
      </template>
    </UiDataTable>

    <CustomerCreditSheet v-model:open="creditSheetOpen" :customer="customer" />
    <CustomerEditSheet v-model:open="editSheetOpen" :customer="customer" />
  </div>
  <UiEmptyState v-else title="Customer not found">
    <template #action>
      <UiButton :to="ROUTES.OWNER.CUSTOMERS.INDEX" variant="secondary">Back to customers</UiButton>
    </template>
  </UiEmptyState>
</template>
