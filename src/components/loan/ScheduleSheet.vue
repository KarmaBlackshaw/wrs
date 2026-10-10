<script setup lang="ts">
import type { TInstallment, TLoan } from "@/types";

const loan = defineModel<TLoan>("loan");

defineProps<{
  installments: TInstallment[];
}>();

const { employeeName } = useEmployeeLookup();

const open = computed({
  get: () => loan.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      loan.value = undefined;
    }
  },
});
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Installment schedule">
    <div v-if="loan" class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">
        {{ employeeName(loan.employeeId) }}
        <template v-if="loan.ratePct">· {{ loan.ratePct }}% {{ loan.method }} · {{ loan.termMonths }} months</template>
      </p>
      <ul class="flex flex-col gap-1 text-sm text-zinc-600">
        <li v-for="installment in installments" :key="installment.seq" class="flex items-center justify-between">
          <span>#{{ installment.seq }}, due {{ formatDate(installment.due) }}</span>
          <span class="flex items-center gap-2">
            <UiMoneyText :centavos="installment.principalPart + installment.interestPart" size="sm" />
            <UiStatusPill :tone="installment.paid ? 'ok' : 'warn'">{{ installment.paid ? "Paid" : "Pending" }}</UiStatusPill>
          </span>
        </li>
      </ul>
    </div>
  </UiBottomSheet>
</template>
