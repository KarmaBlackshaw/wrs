<script setup lang="ts">
import type { TCustomer } from "@wrs/contract/customer";

import { deliveries, trips } from "@/mocks/trips";
import { approveCustomer, getCustomer, setCustomerDepositWaiver } from "@/services/customer";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Customer" } });

const employeeStore = useEmployeeStore();

const route = useRoute("/owner/customers/[id]");
const toast = useToast();
const confirmDialog = useConfirm();

const { data: customer, error, reload } = useResource((signal) => getCustomer(route.params.id, signal), { watch: () => route.params.id });
const approveAction = useAction(approveCustomer);
const waiverAction = useAction(setCustomerDepositWaiver);

const isNotFound = computed(() => error.value?.code === "not_found");
const ownershipKey = ref(0);

const backTo = ref<string>(ROUTES.OWNER.CUSTOMERS.INDEX);

watch(
  () => route.params.id,
  () => {
    const { back } = window.history.state;
    const isFromList = typeof back === "string" && (back === ROUTES.OWNER.CUSTOMERS.INDEX || back.startsWith(`${ROUTES.OWNER.CUSTOMERS.INDEX}?`));

    backTo.value = isFromList ? back : ROUTES.OWNER.CUSTOMERS.INDEX;
  },
  { immediate: true }
);

const customerName = computed(() => (customer.value != null ? fullName(customer.value) : ""));

const headerSubtitle = computed(() =>
  customer.value != null ? `${customer.value.phone} · ${customer.value.address} · ${customer.value.riderName ?? "Open"}` : ""
);
const creditTone = computed(() => (customer.value != null && customer.value.creditBalance > 0 ? "warn" : "default"));
const dueTone = computed(() => (customer.value?.dueStatus === "overdue" ? "danger" : "default"));

const creditText = computed(() => {
  if (customer.value == null || !customer.value.creditEnabled) {
    return "Not enabled";
  }

  const { creditLimit } = customer.value;

  return creditLimit != null ? `Enabled, limit ${formatMoney(creditLimit)}` : "Enabled";
});

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

  return trip ? employeeStore.employeeName(trip.riderId) : "Rider";
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

const editTarget = ref<TCustomer>();
const creditTarget = ref<TCustomer>();
const releaseTarget = ref<TCustomer>();

async function refresh() {
  ownershipKey.value++;
  await reload();
}

function openEdit() {
  editTarget.value = customer.value;
}

function openCredit() {
  creditTarget.value = customer.value;
}

function openRelease() {
  releaseTarget.value = customer.value;
}

async function approve() {
  if (customer.value == null) {
    return;
  }

  const isConfirmed = await confirmDialog.confirm({ title: "Approve customer", message: `Approve ${customerName.value}?` });

  if (!isConfirmed) {
    return;
  }

  await approveAction.run(customer.value.id);

  if (approveAction.error.value != null) {
    return;
  }

  toast.show("Customer approved");
  await refresh();
}

async function toggleWaive() {
  if (customer.value == null) {
    return;
  }

  const { id, depositWaived } = customer.value;

  const isConfirmed = await confirmDialog.confirm({
    title: "Deposit waiver",
    message: depositWaived ? "Stop waiving deposits for this customer?" : "Waive deposits for this customer going forward?",
  });

  if (!isConfirmed) {
    return;
  }

  await waiverAction.run({ id, body: { waived: !depositWaived } });

  if (waiverAction.error.value != null) {
    return;
  }

  toast.show("Deposit waiver saved");
  await reload();
}
</script>

<template>
  <UiEmptyState v-if="isNotFound" title="Customer not found">
    <template #action>
      <UiButton :to="backTo" variant="secondary">Back to customers</UiButton>
    </template>
  </UiEmptyState>
  <UiEmptyState v-else-if="error != null" title="Couldn't load" :description="error.message">
    <template #action>
      <UiButton variant="secondary" @click="reload">Retry</UiButton>
    </template>
  </UiEmptyState>
  <div v-else-if="customer != null" class="flex flex-col gap-4">
    <UiPageHeader :title="customerName" :subtitle="headerSubtitle" :back="backTo">
      <template #actions>
        <UiButton variant="secondary" @click="openRelease">Release or reassign</UiButton>
        <UiButton variant="secondary" @click="openEdit">Edit</UiButton>
      </template>
    </UiPageHeader>

    <UiCard v-if="customer.status === 'pending'" title="Pending approval">
      <template #actions>
        <UiButton size="md" :loading="approveAction.isRunning.value" @click="approve">Approve</UiButton>
      </template>
      <p class="text-base text-zinc-700">Review the details, edit if needed, then approve.</p>
    </UiCard>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <UiStatCard label="Containers held">{{ customer.containersHeld }}</UiStatCard>
      <UiStatCard label="Deposit on file">
        <UiMoneyText :centavos="customer.depositOnFile" size="lg" />
      </UiStatCard>
      <UiStatCard label="Credit balance" :tone="creditTone">
        <UiMoneyText :centavos="customer.creditBalance" size="lg" />
        <template v-if="customer.creditEnabled && customer.agingBucket != null">
          <span class="ml-2 text-sm font-normal"
            ><UiStatusPill :tone="AGING_TONE[customer.agingBucket]">{{ AGING_LABEL[customer.agingBucket] }}</UiStatusPill></span
          >
        </template>
      </UiStatCard>
      <UiStatCard label="Next due" :tone="dueTone">{{ customer.nextDueOn != null ? formatDate(customer.nextDueOn) : "Not set" }}</UiStatCard>
    </div>

    <UiCard title="Credit and deposit">
      <div class="flex flex-col gap-1 text-base text-zinc-700">
        <p>Credit: {{ creditText }}</p>
        <p>Deposit: {{ customer.depositWaived ? "Waived" : "Charged per borrowed container" }}</p>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <UiButton variant="secondary" size="md" @click="openCredit">{{ customer.creditEnabled ? "Change credit limit" : "Enable credit" }}</UiButton>
        <UiButton variant="secondary" size="md" :loading="waiverAction.isRunning.value" @click="toggleWaive">{{
          customer.depositWaived ? "Un-waive deposit" : "Waive deposit"
        }}</UiButton>
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

    <CustomerHistoryOwnership :key="ownershipKey" :customer-id="customer.id" />

    <CustomerEditSheet v-model:customer="editTarget" @submit="refresh" />
    <CustomerCreditSheet v-model:customer="creditTarget" @submit="refresh" />
    <CustomerReleaseSheet v-model:customer="releaseTarget" @submit="refresh" />
  </div>
</template>
