import type { TPaymentType } from "@/types/entities/payment";

export type TWalkInSaleLine = {
  productId: string;
  qty: number;
};

export type TWalkInSale = {
  id: string;
  customerId?: string;
  lines: TWalkInSaleLine[];
  borrowed: boolean;
  returned: boolean;
  amount: number;
  paymentType: TPaymentType;
  depositCollected: number;
  createdAt: string;
};

export type TSaleRow = {
  id: string;
  source: "walk-in" | "delivery";
  createdAt: string;
  customerName: string;
  items: string;
  amount: number;
  paymentType: TPaymentType;
};
