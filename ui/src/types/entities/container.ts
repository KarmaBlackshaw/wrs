export type TContainerTypeCode = "round" | "slim";

export type TContainerType = {
  code: TContainerTypeCode;
  deliverable: boolean;
  depositAmount: number;
};

export type TContainerMovementType = "purchased" | "to-rider" | "to-customer" | "collected" | "returned" | "damaged" | "lost" | "retired";

export type TContainerMovement = {
  id: string;
  type: TContainerMovementType;
  containerType: TContainerTypeCode;
  qty: number;
  full: boolean;
  from: string;
  to: string;
  riderId?: string;
  customerId?: string;
  reason?: string;
  refType: string;
  refId: string;
  createdAt: string;
};

export type TContainerCount = {
  id: string;
  date: string;
  type: TContainerTypeCode;
  full: number;
  empty: number;
  expected: number;
};

export type TContainerHolding = {
  location: string;
  locationLabel: string;
  type: TContainerTypeCode;
  full: number;
  empty: number;
};

export type TDepositKind = "collected" | "refunded" | "forfeited";

export type TDepositEntry = {
  id: string;
  customerId: string;
  containerType: TContainerTypeCode;
  amount: number;
  kind: TDepositKind;
  createdAt: string;
};
