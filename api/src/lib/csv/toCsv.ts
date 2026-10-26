import type { TReportColumn, TReportTable } from "@wrs/contract/report";
import { manilaDate } from "../dates/manilaDate.ts";

type TCell = TReportTable["rows"][number][string];

const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const manilaDateTimeFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const quote = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value);

const stringCell = (value: string, format: TReportColumn["format"]) => {
  const date = new Date(value);
  const isValidDate = !Number.isNaN(date.getTime());

  if (format === "datetime" && isValidDate) {
    return manilaDateTimeFormat.format(date);
  }

  if (format === "date" && isValidDate && !ISO_DATE.test(value)) {
    return manilaDate(date);
  }

  return FORMULA_PREFIX.test(value) ? `'${value}` : value;
};

const cellText = (value: TCell | undefined, { format }: TReportColumn) => {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return stringCell(value, format);
  }

  return format === "money" ? (value / 100).toFixed(2) : String(value);
};

export function toCsv({ columns, rows }: TReportTable): string {
  const header = columns.map(({ label }) => quote(label)).join(",");
  const lines = rows.map((row) => columns.map((column) => quote(cellText(row[column.key], column))).join(","));

  return [header, ...lines].map((line) => `${line}\r\n`).join("");
}
