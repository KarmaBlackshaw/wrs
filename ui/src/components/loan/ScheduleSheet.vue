<script setup lang="ts">
import type { TLoan } from "@wrs/contract/loan";

import { getLoanSchedule } from "@/services/loan";

const loan = defineModel<TLoan>("loan");

const {
  data: installments,
  isLoading,
  error,
  reload,
} = useResource(async (signal) => (loan.value != null ? getLoanSchedule(loan.value.id, signal) : []), { watch: loan });

const isOpen = computed({
  get: () => loan.value != null,
  set: (value) => {
    if (!value) {
      loan.value = undefined;
    }
  },
});

const columns = [
  { key: "seq", label: "Installment" },
  { key: "amount", label: "Amount", align: "right" as const },
  { key: "status", label: "Status" },
];
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Installment schedule">
    <p v-if="loan" class="mb-2 text-sm text-zinc-500">
      {{ loan.employeeName }}
      <template v-if="loan.ratePct">· {{ loan.ratePct }}% {{ loan.method }} · {{ loan.termMonths }} months</template>
    </p>
    <UiDataTable bare :columns :rows="installments ?? []" :row-key="(row) => row.seq" :is-loading :error="error?.message" @retry="reload">
      <template #cell-seq="{ row }">
        <span class="text-zinc-700">#{{ row.seq }}, due {{ formatDate(row.due) }}</span>
      </template>
      <template #cell-amount="{ row }">
        <UiMoneyText :centavos="row.principalPart + row.interestPart" size="sm" />
      </template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="row.paid ? 'ok' : 'warn'">{{ row.paid ? "Paid" : "Pending" }}</UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No installments" />
      </template>
    </UiDataTable>
  </UiBottomSheet>
</template>
