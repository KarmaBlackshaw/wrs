import type { TReportColumn } from "@wrs/contract/report";

export function formatReportCell(value: string | number | null, format: TReportColumn["format"]) {
  if (value == null) {
    return "—";
  }

  if (format === "date") {
    return formatDate(value);
  }

  if (format === "datetime") {
    return formatDateTime(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (format === "money") {
    return formatMoney(value);
  }

  return value.toLocaleString("en-PH");
}
