<script setup lang="ts">
import type { TSyncOp } from "@wrs/contract/sync";

const open = defineModel<boolean>("open", { default: false });

const syncStore = useSyncStore();
const riderStore = useRiderStore();

function customerName(customerId: string) {
  const customer = riderStore.customer(customerId);

  return customer != null ? fullName(customer) : "Customer";
}

function opLabel(op: TSyncOp) {
  switch (op.kind) {
    case "customer.create":
      return `New customer · ${fullName(op.payload)}`;
    case "customer.release":
      return `Release · ${customerName(op.payload.customerId)}`;
    case "delivery.create": {
      const total = op.payload.lines.reduce((sum, { qty, unitPrice }) => sum + qty * unitPrice, 0);

      return `Delivery · ${customerName(op.payload.customerId)} · ${formatMoney(total)}`;
    }
    case "payment.create":
      return `Payment · ${customerName(op.payload.customerId)} · ${formatMoney(op.payload.amount)}`;
    case "waiver_request.create":
      return `Waiver request · ${customerName(op.payload.customerId)}`;
    case "trip.end":
      return "End trip";
  }
}

const rows = computed(() =>
  syncStore.pending.map((op) => ({ opId: op.opId, label: opLabel(op), detail: op.lastError ?? SYNC_OP_STATE_LABEL[op.state], isFailed: op.state === "failed" }))
);

const conflictRows = computed(() =>
  syncStore.conflicts.map(({ opId, op, codes }) => ({
    opId,
    label: opLabel(op),
    detail: `Sent to owner for review: ${codes.map((code) => SYNC_CONFLICT_CODE_LABEL[code] ?? code).join(", ")}`,
  }))
);

const isEmpty = computed(() => rows.value.length === 0 && conflictRows.value.length === 0);
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Sync status">
    <UiEmptyState v-if="isEmpty" title="All caught up" description="Nothing is waiting to sync." />
    <ul v-else class="divide-y divide-zinc-200">
      <li v-for="row in rows" :key="row.opId" class="py-3">
        <p class="text-sm font-medium text-zinc-900">{{ row.label }}</p>
        <p class="text-sm" :class="row.isFailed ? 'text-red-700' : 'text-zinc-500'">{{ row.detail }}</p>
      </li>
      <li v-for="row in conflictRows" :key="row.opId" class="flex items-start justify-between gap-3 py-3">
        <div class="min-w-0">
          <p class="text-sm font-medium text-zinc-900">{{ row.label }}</p>
          <p class="text-sm text-amber-800">{{ row.detail }}</p>
        </div>
        <UiButton variant="secondary" size="sm" @click="syncStore.dismissConflict(row.opId)">Dismiss</UiButton>
      </li>
    </ul>
  </UiBottomSheet>
</template>
