<script setup lang="ts">
import type { TApprovalDecision } from "@wrs/contract/approval";

const { decision } = defineProps<{
  decision: TApprovalDecision | null;
}>();
</script>

<template>
  <UiStatusPill v-if="decision != null" :tone="DECISION_TONE[decision]">{{ DECISION_LABEL[decision] }}</UiStatusPill>
</template>
