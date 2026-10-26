import type { REPORTS } from "@/constants/reports";

export function formatReportTile(value: number | null, kind: (typeof REPORTS)[number]["kind"]) {
  if (value == null) {
    return "—";
  }

  if (kind === "money") {
    return formatMoney(value);
  }

  return kind === "ppm" ? `${value} ppm` : value.toLocaleString("en-PH");
}
