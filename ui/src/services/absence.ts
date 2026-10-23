import type { TAbsence, TAbsenceCreate, TAbsencePreviewBody, TCoverageProposal } from "@wrs/contract/employee";

import { http } from "@/lib/http";

export function previewAbsence(body: TAbsencePreviewBody) {
  return http.post<TCoverageProposal>("/absences/preview", body);
}

export function createAbsence(body: TAbsenceCreate) {
  return http.post<TAbsence>("/absences", body);
}
