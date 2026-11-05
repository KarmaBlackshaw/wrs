<script setup lang="ts">
import type { TApprovalDecision } from "@wrs/contract/approval";

const { decision, decidedByName } = defineProps<{
  decision: TApprovalDecision | null;
  decidedByName: string | null;
}>();
</script>

<template>
  <span class="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
    <ApprovalDecisionPill :decision="decision" />
    <span v-if="decidedByName != null">{{ decidedByName }}</span>
  </span>
</template>
