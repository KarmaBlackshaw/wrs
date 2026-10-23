<script setup lang="ts">
import type { TSetting } from "@/types";

const setting = defineModel<TSetting>("setting");

const { settingLabel, moneyKeys } = defineProps<{
  settingLabel: Record<string, string>;
  moneyKeys: Set<string>;
}>();

const emit = defineEmits<{
  submit: [setting: TSetting];
}>();

const editValue = ref("");
const editEffectiveFrom = ref(todayIso());

const open = computed({
  get: () => setting.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      setting.value = undefined;
    }
  },
});

const isMoney = computed(() => setting.value != null && moneyKeys.has(setting.value.key));
const canSubmit = computed(() => editValue.value.trim().length > 0 && editEffectiveFrom.value.length > 0);

watch(setting, (current) => {
  if (!current) {
    return;
  }

  const numericValue = typeof current.value === "number" ? current.value : Number(current.value);

  editValue.value = current.value === null ? "" : moneyKeys.has(current.key) ? String(numericValue / 100) : String(current.value);
  editEffectiveFrom.value = todayIso();
});

function submit() {
  if (!setting.value || !canSubmit.value) {
    return;
  }

  const key = setting.value.key;
  const raw = editValue.value.trim();
  const numeric = Number(raw);
  const value = moneyKeys.has(key) ? Math.round(numeric * 100) : Number.isNaN(numeric) ? raw : numeric;

  emit("submit", { key, value, effectiveFrom: editEffectiveFrom.value });
  setting.value = undefined;
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Edit setting">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ setting ? settingLabel[setting.key] : "" }}</p>
      <UiField v-model="editValue" :label="isMoney ? 'Value (₱)' : 'Value'" :type="isMoney ? 'number' : 'text'" :inputmode="isMoney ? 'decimal' : undefined" />
      <UiField v-model="editEffectiveFrom" label="Effective date" type="date" hint="Applies forward from this date; history is kept." />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canSubmit" @click="submit">Save setting</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
