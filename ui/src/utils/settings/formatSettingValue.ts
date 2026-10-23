import type { TSettingKey, TSettingValues } from "@wrs/contract/setting";

import { ROLE_LABEL } from "@/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null;
}

function isLabelKey<T extends Record<string, string>>(labels: T, value: unknown): value is keyof T {
  return typeof value === "string" && Object.keys(labels).includes(value);
}

function isRange(value: unknown): value is TSettingValues["water.tdsRangePpm"] {
  return isRecord(value) && typeof value.min === "number" && typeof value.max === "number";
}

function isBaseRate(value: unknown): value is TSettingValues["pay.baseRate"] {
  return isRecord(value) && BASE_RATE_ROLES.every((role) => typeof value[role] === "number");
}

function withUnit(text: string, key: TSettingKey) {
  const unit = SETTING_UNIT[key];

  return unit != null ? `${text} ${unit}` : text;
}

export function formatSettingValue({ key, value }: { key: TSettingKey; value: unknown }) {
  switch (SETTING_KIND[key]) {
    case "money":
      return typeof value === "number" ? formatMoney(value) : "Not set";
    case "roleMoney":
      return isBaseRate(value) ? BASE_RATE_ROLES.map((role) => `${ROLE_LABEL[role]} ${formatMoney(value[role])}`).join(" · ") : "Not set";
    case "enum":
      if (key === "pay.frequency") {
        return isLabelKey(PAY_FREQUENCY_LABEL, value) ? PAY_FREQUENCY_LABEL[value] : "Not set";
      }

      return isLabelKey(LOAN_METHOD_LABEL, value) ? LOAN_METHOD_LABEL[value] : "Not set";
    case "range":
      return isRange(value) ? withUnit(`${value.min}–${value.max}`, key) : "Not set";
    case "time":
      return typeof value === "string" ? value : "Not set";
    case "number":
      return typeof value === "number" ? withUnit(String(value), key) : "Not set";
  }
}
