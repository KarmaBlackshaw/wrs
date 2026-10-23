export type TMeterReading = {
  id: string;
  liters: number;
  at: string;
  by: string;
};

export type TMaintenanceLog = {
  id: string;
  consumableId: string;
  at: string;
  meterLiters: number;
};

export type TMaintenanceDueStatus = "ok" | "due" | "overdue";

export type TMaintenanceState = {
  lastReplacedAt: string | null;
  litersSince: number | null;
  daysSince: number | null;
  status: TMaintenanceDueStatus;
};
