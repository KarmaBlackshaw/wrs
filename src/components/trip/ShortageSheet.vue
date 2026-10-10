<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  suggestedShortageCash: number;
  initialContainers: number;
}>();

const toast = useToast();
const shortageCashPad = ref("");
const shortageCashAmount = computed(() => padToCentavos(shortageCashPad.value));
const shortageContainers = ref(props.initialContainers);

function recordShortage() {
  toast.show("Saved");
  open.value = false;
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Record shortage">
    <div class="flex flex-col gap-4">
      <UiStepper v-model="shortageContainers" label="Containers short" :min="0" :max="999" />
      <p class="text-center"><UiMoneyText :centavos="shortageCashAmount" size="xl" /></p>
      <UiButton v-if="suggestedShortageCash > 0" variant="ghost" @click="shortageCashPad = String(suggestedShortageCash)">
        Use {{ formatMoney(suggestedShortageCash) }}
      </UiButton>
      <UiNumberPad v-model="shortageCashPad" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="recordShortage">Save shortage</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
