<script setup lang="ts">
import type { TConsumable, TConsumableKind } from "@wrs/contract/consumable";

import { createConsumable, updateConsumable } from "@/services/consumable";

const open = defineModel<boolean>("open", { default: false });

const { consumable } = defineProps<{
  consumable?: TConsumable;
}>();

const emit = defineEmits<{
  submit: [consumable: TConsumable];
}>();

const toast = useToast();
const { run: create, isRunning: isCreating, error: createError } = useAction(createConsumable, { inline: ["validation"] });
const { run: update, isRunning: isUpdating, error: updateError } = useAction(updateConsumable, { inline: ["validation"] });

const name = ref("");
const unit = ref("");
const kind = ref<TConsumableKind>("general");
const reorderLevel = ref<number>();
const intervalLiters = ref<number>();
const intervalDays = ref<number>();

const isEdit = computed(() => consumable != null);
const isRunning = computed(() => isCreating.value || isUpdating.value);
const error = computed(() => (isEdit.value ? updateError.value : createError.value));
const isMaintenance = computed(() => kind.value === "maintenance");

const blockReason = computed(() => {
  if (name.value.trim().length === 0) {
    return "Enter a name.";
  }

  if (unit.value.trim().length === 0) {
    return "Enter a unit.";
  }

  if (reorderLevel.value == null || reorderLevel.value < 0) {
    return "Enter a reorder level of zero or more.";
  }

  return undefined;
});

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  name.value = consumable?.name ?? "";
  unit.value = consumable?.unit ?? "";
  kind.value = consumable?.kind ?? "general";
  reorderLevel.value = consumable?.reorderLevel;
  intervalLiters.value = consumable?.intervalLiters ?? undefined;
  intervalDays.value = consumable?.intervalDays ?? undefined;
});

async function submit() {
  if (reorderLevel.value == null) {
    return;
  }

  const body = {
    name: name.value.trim(),
    unit: unit.value.trim(),
    kind: kind.value,
    reorderLevel: reorderLevel.value,
    intervalLiters: isMaintenance.value ? (intervalLiters.value ?? null) : null,
    intervalDays: isMaintenance.value ? (intervalDays.value ?? null) : null,
  };

  const saved = consumable != null ? await update({ id: consumable.id, body }) : await create(body);

  if (error.value != null || saved == null) {
    return;
  }

  emit("submit", saved);
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" :title="isEdit ? 'Edit consumable' : 'Add consumable'">
    <div class="flex flex-col gap-4">
      <UiField v-model="name" label="Name" />
      <UiField v-model="unit" label="Unit" hint="e.g. pcs, kg, L" />
      <UiSelect v-model="kind" label="Kind" :options="CONSUMABLE_KIND_OPTIONS" />
      <UiNumberField v-model="reorderLevel" label="Reorder level" :min="0" :is-integer="false" />
      <template v-if="isMaintenance">
        <UiNumberField v-model="intervalLiters" label="Interval (liters)" :min="1" />
        <UiNumberField v-model="intervalDays" label="Interval (days)" :min="1" />
      </template>
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="blockReason != null" id="consumable-block-reason" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton
            size="lg"
            :disabled="blockReason != null"
            :loading="isRunning"
            :aria-describedby="blockReason != null ? 'consumable-block-reason' : undefined"
            @click="submit"
            >Save consumable</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
