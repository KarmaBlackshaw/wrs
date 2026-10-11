<script setup lang="ts">
import startCase from "lodash/startCase";

import { IconGear } from "@/components";
import { settings as settingsMock } from "@/mocks/settings";
import { OWNER_TABS, ROUTES, type TRowAction, type TSetting } from "@/types";

definePage({ meta: { title: "Settings" } });

const route = useRoute("/owner/settings/[[group]]");
const toast = useToast();

const settingsHistory = ref<TSetting[]>([...settingsMock]);

const settingLabel: Record<string, string> = {
  "rider.dailyQuota": "Rider daily quota",
  "rider.incentivePerContainer": "Incentive per container above quota",
  "pay.frequency": "Pay frequency",
  "pay.baseRate": "Base rate",
  "pay.deductionCapPct": "Deduction cap",
  "loan.interestRatePct": "Loan interest rate",
  "loan.interestMethod": "Loan interest method",
  "loan.maxAmount": "Max loan amount",
  "loan.maxTermMonths": "Max loan term",
  "container.depositAmount.round": "Container deposit (round)",
  "container.depositAmount.slim": "Container deposit (slim)",
  "customer.creditLimit": "Customer credit limit",
  "void.approvalThreshold": "Void approval threshold",
  "water.tdsAcceptableRangePpm": "TDS acceptable range",
  "labTest.reminderDays": "Lab test reminder",
  "digest.sendTime": "Digest send time",
};

const moneyKeys = new Set([
  "pay.baseRate",
  "rider.incentivePerContainer",
  "loan.maxAmount",
  "container.depositAmount.round",
  "container.depositAmount.slim",
  "customer.creditLimit",
  "void.approvalThreshold",
]);

const unitSuffix: Record<string, string> = {
  "rider.dailyQuota": "containers",
  "loan.interestRatePct": "% per month",
  "pay.deductionCapPct": "% of gross",
  "loan.maxTermMonths": "months",
  "labTest.reminderDays": "days before due",
  "water.tdsAcceptableRangePpm": "ppm",
};

const groupKeys: Record<string, string[]> = {
  [ROUTES.OWNER.SETTINGS.INDEX]: ["rider.dailyQuota", "rider.incentivePerContainer", "pay.frequency", "pay.baseRate", "pay.deductionCapPct"],
  [ROUTES.OWNER.SETTINGS.LOANS]: ["loan.interestRatePct", "loan.interestMethod", "loan.maxAmount", "loan.maxTermMonths"],
  [ROUTES.OWNER.SETTINGS.CONTAINERS_CREDIT]: [
    "container.depositAmount.round",
    "container.depositAmount.slim",
    "customer.creditLimit",
    "void.approvalThreshold",
  ],
  [ROUTES.OWNER.SETTINGS.WATER_QUALITY]: ["water.tdsAcceptableRangePpm", "labTest.reminderDays"],
  [ROUTES.OWNER.SETTINGS.DIGEST]: ["digest.sendTime"],
};

const title = computed(() => OWNER_TABS.SETTINGS.find((tab) => tab.to === route.path)?.label ?? "Settings");

const settingsColumns = [
  { key: "setting", label: "Setting" },
  { key: "value", label: "Value" },
];

const settingsRows = computed(() => (groupKeys[route.path] ?? []).map((key) => ({ key, setting: currentSetting(key) })));

function currentSetting(key: string) {
  const found = latestEffective(settingsHistory.value.filter((setting) => setting.key === key));

  return found ?? { key, value: null, effectiveFrom: "" };
}

function displayValue(setting: TSetting) {
  if (setting.value === null) {
    return null;
  }

  if (moneyKeys.has(setting.key)) {
    return formatMoney(typeof setting.value === "number" ? setting.value : Number(setting.value));
  }

  const suffix = unitSuffix[setting.key];

  if (suffix) {
    return `${setting.value} ${suffix}`;
  }

  return typeof setting.value === "string" ? startCase(setting.value) : String(setting.value);
}

const editSetting = ref<TSetting>();

function addSetting(setting: TSetting) {
  settingsHistory.value.push(setting);
}

function saveChanges() {
  toast.show("Saved");
}

function settingActions({ setting }: { setting: TSetting }): TRowAction[] {
  return [{ label: "Edit", onSelect: () => (editSetting.value = setting) }];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-zinc-500">Changing settings requires an online connection.</p>

    <UiDataTable :row-actions="settingActions" :title="title" :icon="IconGear" :columns="settingsColumns" :rows="settingsRows" :row-key="(row) => row.key">
      <template #actions>
        <UiButton @click="saveChanges">Save changes</UiButton>
      </template>
      <template #cell-setting="{ row }">{{ settingLabel[row.key] }}</template>
      <template #cell-value="{ row }">
        <span v-if="displayValue(row.setting) !== null" class="text-zinc-700">{{ displayValue(row.setting) }}</span>
        <UiStatusPill v-else tone="warn">Not set</UiStatusPill>
      </template>
    </UiDataTable>

    <p class="text-sm text-zinc-500">
      Stock and maintenance settings (reorder levels, intervals) are configured per item in
      <RouterLink :to="ROUTES.OWNER.INVENTORY.CONSUMABLES" class="underline">Consumables</RouterLink> and
      <RouterLink :to="ROUTES.OWNER.INVENTORY.MAINTENANCE" class="underline">Maintenance</RouterLink>.
    </p>

    <SettingEditSheet v-model:setting="editSetting" :setting-label="settingLabel" :money-keys="moneyKeys" @submit="addSetting" />
  </div>
</template>
