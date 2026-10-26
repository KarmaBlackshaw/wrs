export type TVoidStatus = "pending" | "approved" | "rejected";

export type TVoid = {
  id: string;
  refType: string;
  refId: string;
  reason: string;
  requestedBy: string;
  status: TVoidStatus;
  approvedBy?: string;
  createdAt: string;
};

export type TApprovalKind = "void" | "loan" | "credit" | "waiver";

export type TApproval = {
  id: string;
  kind: TApprovalKind;
  refId: string;
  summary: string;
  requestedBy: string;
  createdAt: string;
};
