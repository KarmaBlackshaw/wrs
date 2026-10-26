<script setup lang="ts">
import type { TAbsence, TCoverageProposal } from "@wrs/contract/employee";

import { createAbsence, previewAbsence } from "@/services/absence";

const open = defineModel<boolean>("open", { default: false });

const { employeeId } = defineProps<{
  employeeId: string;
}>();

const emit = defineEmits<{
  submit: [absence: TAbsence];
}>();

const toast = useToast();
const { run: preview, isRunning: isPreviewing, error: previewError } = useAction(previewAbsence, { inline: ["validation", "conflict"] });
const { run: create, isRunning: isCreating, error: createError } = useAction(createAbsence, { inline: ["validation", "conflict", "reference.not_found"] });

const from = ref(todayIso());
const to = ref(todayIso());
const proposal = ref<TCoverageProposal>();

const error = computed(() => previewError.value ?? createError.value);

const riderOptions = computed(() => (proposal.value?.riders ?? []).map(({ id, name }) => ({ value: id, label: name })));

const blockReason = computed(() => (to.value < from.value || from.value.length === 0 ? "Enter a valid date range." : ""));

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  from.value = todayIso();
  to.value = todayIso();
  proposal.value = undefined;
});

async function loadPreview() {
  const result = await preview({ employeeId, from: from.value, to: to.value });

  if (error.value != null || result == null) {
    return;
  }

  proposal.value = result;
}

async function submit() {
  if (proposal.value == null) {
    return;
  }

  const coverage = proposal.value.assignments.map(({ customerId, coveringRiderId }) => ({ customerId, coveringRiderId }));
  const absence = await create({ employeeId, from: from.value, to: to.value, coverage });

  if (error.value != null || absence == null) {
    return;
  }

  emit("submit", absence);
  open.value = false;
  toast.show("Marked absent");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Mark absent">
    <div v-if="proposal == null" class="flex flex-col gap-4">
      <UiField v-model="from" label="From" type="date" />
      <UiField v-model="to" label="To" type="date" />
    </div>

    <div v-else class="flex flex-col gap-4">
      <p class="text-sm text-zinc-600">{{ from }} to {{ to }}</p>
      <p v-if="proposal.assignments.length === 0" class="text-sm text-zinc-600">No customers need coverage for this absence.</p>
      <template v-else>
        <p class="text-sm text-zinc-600">Choose which rider covers each customer.</p>
        <UiSelect v-for="row in proposal.assignments" :key="row.customerId" v-model="row.coveringRiderId" :label="row.customerName" :options="riderOptions" />
      </template>
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <p v-if="blockReason.length > 0 && proposal == null" id="absence-block-reason" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <div class="flex justify-end gap-2">
          <UiButton v-if="proposal != null" variant="secondary" size="lg" @click="proposal = undefined">Back</UiButton>
          <UiButton
            v-if="proposal == null"
            size="lg"
            :disabled="blockReason.length > 0"
            :loading="isPreviewing"
            :aria-describedby="blockReason.length > 0 ? 'absence-block-reason' : undefined"
            @click="loadPreview"
            >Preview coverage</UiButton
          >
          <UiButton v-else size="lg" :loading="isCreating" @click="submit">Confirm absence</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
