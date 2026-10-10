<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  suggestedShortageCash: number;
  initialContainers: number;
}>();

const toast = useToast();
const shortageCashAmount = ref(0);
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
      <UiMoneyPad v-model="shortageCashAmount" :suggestion="suggestedShortageCash" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="recordShortage">Save shortage</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
