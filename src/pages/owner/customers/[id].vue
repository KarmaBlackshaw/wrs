<script setup lang="ts">
import { deliveries, trips } from "@/mocks/trips";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Customer" } });

const { employeeName, riderOptions } = useEmployeeLookup();
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
const creditEnabledDraft = ref("enabled");

const creditOptions = [
  { value: "enabled", label: "Enabled" },
  { value: "disabled", label: "Disabled" },
];
const limitDraft = ref(0);

function openCreditSheet() {
  if (!customer.value) {
    return;
  }

  creditEnabledDraft.value = customer.value.creditEnabled ? "enabled" : "disabled";
  limitDraft.value = (customer.value.creditLimit ?? 0) / 100;
  creditSheetOpen.value = true;
}

function submitCredit() {
  toast.show("Credit settings saved");
  creditSheetOpen.value = false;
}

async function toggleWaive() {
  const isConfirmed = await confirmDialog.confirm({
    title: "Deposit waiver",
    message: customer.value?.depositWaived ? "Stop waiving deposits for this customer?" : "Waive deposits for this customer going forward?",
  });

  if (isConfirmed) {
    toast.show("Deposit waiver saved");
  }
}

const editSheetOpen = ref(false);
const nameDraft = ref("");
const phoneDraft = ref("");
const addressDraft = ref("");
const riderDraft = ref("");
const riderDraftOptions = [{ value: "", label: "Open" }, ...riderOptions];
const canSaveCustomer = computed(() => nameDraft.value.trim().length > 0 && phoneDraft.value.trim().length > 0);

function openEditSheet() {
  if (!customer.value) {
    return;
  }

  nameDraft.value = customer.value.name;
  phoneDraft.value = customer.value.phone;
  addressDraft.value = customer.value.address;
  riderDraft.value = customer.value.riderId ?? "";
  editSheetOpen.value = true;
}

function submitEdit() {
  toast.show("Customer saved");
  editSheetOpen.value = false;
}
</script>

<template>
  <div v-if="customer" class="flex flex-col gap-4">
    <UiPageHeader :title="customer.name" :subtitle="headerSubtitle" :back="ROUTES.OWNER.CUSTOMERS.INDEX">
      <template #actions>
        <UiButton variant="secondary" @click="openEditSheet">Edit</UiButton>
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
        <UiButton variant="secondary" size="md" @click="openCreditSheet">{{ customer.creditEnabled ? "Change credit limit" : "Enable credit" }}</UiButton>
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

    <UiBottomSheet v-model:open="creditSheetOpen" title="Credit settings">
      <div class="flex flex-col gap-4">
        <UiSegmentedControl v-model="creditEnabledDraft" :options="creditOptions" />
        <UiStepper v-if="creditEnabledDraft === 'enabled'" v-model="limitDraft" label="Credit limit (pesos)" :min="0" :step="500" />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton @click="submitCredit">Save</UiButton>
        </div>
      </template>
    </UiBottomSheet>

    <UiBottomSheet v-model:open="editSheetOpen" title="Edit customer">
      <div class="flex flex-col gap-4">
        <UiField v-model="nameDraft" label="Name" />
        <UiField v-model="phoneDraft" label="Phone" type="tel" />
        <UiField v-model="addressDraft" label="Address" />
        <UiSelect v-model="riderDraft" label="Rider" :options="riderDraftOptions" />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton :disabled="!canSaveCustomer" @click="submitEdit">Save</UiButton>
        </div>
      </template>
    </UiBottomSheet>
  </div>
  <UiEmptyState v-else title="Customer not found">
    <template #action>
      <UiButton :to="ROUTES.OWNER.CUSTOMERS.INDEX" variant="secondary">Back to customers</UiButton>
    </template>
  </UiEmptyState>
</template>
