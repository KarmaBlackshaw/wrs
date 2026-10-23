export type TPaymentType = "cash" | "e-wallet" | "credit";
export type TPaymentSource = "trip" | "drawer";

export type TPayment = {
  id: string;
  customerId: string;
  amount: number;
  collectedBy: string;
  source: TPaymentSource;
  createdAt: string;
};
