import type { TDigestDay, TReportQuery, TReportSlug, TReportSummary, TReportTable } from "@wrs/contract/report";

import { http } from "@/lib/http";

export function listReportSummaries(query: TReportQuery, signal?: AbortSignal) {
  return http.get<TReportSummary[]>("/reports/summaries", { params: query, signal });
}

export function getReport({ slug, range }: { slug: TReportSlug; range: TReportQuery }, signal?: AbortSignal) {
  return http.get<TReportTable>(`/reports/${slug}`, { params: range, signal });
}

export function getReportCsv(slug: TReportSlug, range: { from?: string; to?: string }) {
  return http.get<Blob>(`/reports/${slug}/csv`, { params: range, responseType: "blob" });
}

export function listDigestDays(query: TReportQuery, signal?: AbortSignal) {
  return http.get<TDigestDay[]>("/reports/digest", { params: query, signal });
}
