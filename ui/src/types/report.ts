export type TReportRow = Record<string, unknown> & { _date?: string };
export type TReportColumn = { key: string; label: string; align?: "left" | "right" };
export type TReportTable = { columns: TReportColumn[]; rows: TReportRow[] };
export type TReportSummary = { value: string; hint?: string; tone?: "default" | "warn" };
