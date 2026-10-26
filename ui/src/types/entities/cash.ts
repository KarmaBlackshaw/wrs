export type TDrawerSession = {
  id: string;
  cashierId: string;
  openedAt: string;
  openingCash: number;
  closedAt?: string;
  countedCash?: number;
};

export type TShortageSource = "trip" | "drawer";

export type TShortage = {
  id: string;
  employeeId: string;
  source: TShortageSource;
  cash: number;
  containers: number;
  approvedForDeduction: boolean;
};
