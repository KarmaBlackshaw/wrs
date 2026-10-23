import type { TPaymentType } from "@/types/entities/payment";

export type TTripStatus = "open" | "returned" | "reconciled";

export type TTrip = {
  id: string;
  riderId: string;
  status: TTripStatus;
  loadedAt: string;
  returnedAt?: string;
  cashRemitted?: number;
};

export type TTripLine = {
  tripId: string;
  productId: string;
  loaded: number;
  returnedFull: number;
  returnedEmpty: number;
};

export type TDelivery = {
  id: string;
  tripId: string;
  customerId: string;
  productId: string;
  delivered: number;
  emptiesCollected: number;
  amount: number;
  paymentType: TPaymentType;
  depositCollected: number;
  createdAt: string;
};

export type TTripRow = {
  id: string;
  status: TTripStatus;
  loadedAt: string;
  riderName: string;
  cashVariance: number | null;
  containerVariance: number | null;
};
