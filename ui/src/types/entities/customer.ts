export type TAgingBucket = "current" | "7" | "15" | "30+";

export type TCustomer = {
  id: string;
  name: string;
  address: string;
  phone: string;
  riderId?: string;
  creditEnabled: boolean;
  creditLimit?: number;
  depositWaived: boolean;
  containersHeld: number;
  depositOnFile: number;
  creditBalance: number;
  agingBucket: TAgingBucket;
};

export type TCustomerScope = "mine" | "open" | "all";
