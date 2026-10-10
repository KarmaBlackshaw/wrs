<script setup lang="ts">
import { IconUsers } from "@/components";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Customers" } });

const toast = useToast();
const { employeeName } = useEmployeeLookup();

function riderLabel(riderId?: string) {
  return riderId ? employeeName(riderId) : "Open";
}

const columns = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "rider", label: "Rider" },
  { key: "containersHeld", label: "Containers", align: "right" as const },
  { key: "depositOnFile", label: "Deposit", align: "right" as const },
  { key: "creditBalance", label: "Credit balance", align: "right" as const },
  { key: "agingBucket", label: "Aging" },
];

const query = ref("");
const filteredCustomers = useCustomerSearch(query);

const router = useRouter();

function openCustomer(customer: { id: string }) {
  router.push(ROUTES.OWNER.CUSTOMERS.DETAIL(customer.id));
}

const addSheetOpen = ref(false);
const nameDraft = ref("");
const phoneDraft = ref("");
const addressDraft = ref("");
const canSaveCustomer = computed(() => nameDraft.value.trim().length > 0 && phoneDraft.value.trim().length > 0);

function submitAdd() {
  if (!canSaveCustomer.value) {
    return;
  }

  toast.show("Customer saved");
  nameDraft.value = "";
  phoneDraft.value = "";
  addressDraft.value = "";
  addSheetOpen.value = false;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      clickable
      title="Customers"
      :icon="IconUsers"
      :columns="columns"
      :rows="filteredCustomers"
      :row-key="(row) => row.id"
      @row-click="openCustomer"
    >
      <template #actions>
        <UiSearchInput v-model="query" label="Search customers" />
        <UiButton @click="addSheetOpen = true">Add customer</UiButton>
      </template>
      <template #cell-rider="{ row }">{{ riderLabel(row.riderId) }}</template>
      <template #cell-depositOnFile="{ row }">
        <UiMoneyText :centavos="row.depositOnFile" />
      </template>
      <template #cell-creditBalance="{ row }">
        <UiMoneyText :centavos="row.creditBalance" />
      </template>
      <template #cell-agingBucket="{ row }">
        <UiStatusPill :tone="AGING_TONE[row.agingBucket]">{{ AGING_LABEL[row.agingBucket] }}</UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No customers match your search" />
      </template>
    </UiDataTable>

    <UiBottomSheet v-model:open="addSheetOpen" title="Add customer">
      <div class="flex flex-col gap-4">
        <UiField v-model="nameDraft" label="Name" />
        <UiField v-model="phoneDraft" label="Phone" type="tel" />
        <UiField v-model="addressDraft" label="Address" hint="Free text, landmarks welcome" />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton :disabled="!canSaveCustomer" @click="submitAdd">Save customer</UiButton>
        </div>
      </template>
    </UiBottomSheet>
  </div>
</template>
