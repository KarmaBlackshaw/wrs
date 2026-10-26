<script setup lang="ts">
import type { TApproval } from "@wrs/contract/approval";
import type { TLoan } from "@wrs/contract/loan";

const approval = defineModel<TApproval>("approval");

const emit = defineEmits<{ submit: [loan: TLoan] }>();

const loan = computed({
  get: () => (approval.value?.kind === "loan" ? approval.value.item : undefined),
  set: (value) => {
    if (value == null) {
      approval.value = undefined;
    }
  },
});
</script>

<template>
  <LoanReleaseSheet v-model:loan="loan" @submit="emit('submit', $event)" />
</template>
