<script setup lang="ts">
import type { TApprovalStatus } from "@wrs/contract/approval";

import { IconStamp } from "@/components";
import { OWNER_TABS, ROUTES } from "@/types";

definePage({ meta: { title: "Approvals" } });

const route = useRoute();

const status = computed((): TApprovalStatus => (route.path === ROUTES.OWNER.APPROVALS_HANDLED ? "handled" : "pending"));
</script>

<template>
  <UiPanel title="Approvals" :icon="IconStamp" :tabs="OWNER_TABS.APPROVALS">
    <ApprovalLoansSection :status />
    <ApprovalCustomersSection :status />
    <ApprovalDeliveriesSection :status />
  </UiPanel>
</template>
