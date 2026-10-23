<script setup lang="ts">
import type { TDistributeProposal } from "@wrs/contract/customer";

import { commitDistribution, previewDistribution } from "@/services/customer";

const open = defineModel<boolean>("open", { default: false });

const { customerIds, excludedRiderId } = defineProps<{
  customerIds: string[];
  excludedRiderId: string;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const employeeStore = useEmployeeStore();
const { riderOptions } = storeToRefs(employeeStore);
const authStore = useAuthStore();
const { me } = storeToRefs(authStore);
const toast = useToast();
const { run: runPreview, isRunning: isPreviewing, error: previewError } = useAction(previewDistribution, { inline: ["validation"] });
const { run: runCommit, isRunning: isCommitting, error: commitError } = useAction(commitDistribution, { inline: ["validation"] });

const title = computed(() => `Distribute ${customerIds.length} customers`);

const targetIds = ref<string[]>([]);
const proposal = ref<TDistributeProposal>();

const isWide = useMediaQuery("(min-width: 640px)");

const proposalColumns = computed(() =>
  isWide.value
    ? [
        { key: "customerName", label: "Customer" },
        { key: "toRiderId", label: "Rider" },
      ]
    : [{ key: "customerName", label: "Customer" }]
);

const targetOptions = computed(() => riderOptions.value.filter(({ value }) => value !== excludedRiderId && value !== me.value?.id));

const previewBlockReason = computed(() => {
  if (customerIds.length === 0) {
    return "No customers to distribute.";
  }

  if (targetOptions.value.length === 0) {
    return "No other riders to distribute to.";
  }

  return targetIds.value.length === 0 ? "Pick at least one rider." : undefined;
});

const confirmBlockReason = computed(() => (proposal.value?.length === 0 ? "No customers in the split." : undefined));
const actionError = computed(() => previewError.value ?? commitError.value);

watch(open, async (isOpen) => {
  if (!isOpen) {
    return;
  }

  targetIds.value = [];
  proposal.value = undefined;
  await employeeStore.load();
});

async function loadPreview() {
  const result = await runPreview({ customerIds, riderIds: targetIds.value });

  if (previewError.value != null || result == null) {
    return;
  }

  proposal.value = result;
}

function backToRiders() {
  proposal.value = undefined;
}

async function confirm() {
  if (proposal.value == null) {
    return;
  }

  await runCommit({ assignments: proposal.value.map(({ customerId, toRiderId }) => ({ customerId, riderId: toRiderId })) });

  if (commitError.value != null) {
    return;
  }

  toast.show("Customers distributed");
  open.value = false;
  emit("submit");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" :title="title">
    <UiCheckboxGroup v-if="proposal == null" v-model="targetIds" legend="Distribute to" :options="targetOptions" />

    <UiDataTable v-else :columns="proposalColumns" :rows="proposal" :row-key="(row) => row.customerId">
      <template #cell-customerName="{ row }">
        <div class="flex flex-col gap-2">
          <div class="flex flex-col">
            <span class="font-medium text-zinc-900">{{ row.customerName }}</span>
            <span class="text-xs text-zinc-500">From {{ row.fromRiderName ?? "Open" }}</span>
          </div>
          <UiSelect v-if="!isWide" v-model="row.toRiderId" :label="`Rider for ${row.customerName}`" :options="targetOptions" />
        </div>
      </template>
      <template #cell-toRiderId="{ row }">
        <UiSelect v-model="row.toRiderId" :label="`Rider for ${row.customerName}`" :options="targetOptions" class="min-w-36" />
      </template>
      <template #empty>No customers in the split.</template>
    </UiDataTable>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="actionError != null" role="alert" class="text-sm text-red-700">{{ actionError.message }}</p>
        <template v-if="proposal == null">
          <p v-if="previewBlockReason != null" class="text-sm text-zinc-600">{{ previewBlockReason }}</p>
          <div class="flex justify-end gap-2">
            <UiButton size="lg" :disabled="previewBlockReason != null" :loading="isPreviewing" @click="loadPreview">Preview split</UiButton>
          </div>
        </template>
        <template v-else>
          <p v-if="confirmBlockReason != null" class="text-sm text-zinc-600">{{ confirmBlockReason }}</p>
          <div class="flex justify-end gap-2">
            <UiButton variant="secondary" size="lg" :disabled="isCommitting" @click="backToRiders">Back</UiButton>
            <UiButton size="lg" :disabled="confirmBlockReason != null" :loading="isCommitting" @click="confirm">Confirm</UiButton>
          </div>
        </template>
      </div>
    </template>
  </UiBottomSheet>
</template>
