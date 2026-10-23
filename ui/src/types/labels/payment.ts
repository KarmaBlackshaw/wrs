import type { TPaymentType } from "@/types/entities/payment";
import type { TOption } from "@/types/ui";

export const PAYMENT_LABEL: Record<TPaymentType, string> = {
  cash: "Cash",
  "e-wallet": "E-wallet",
  credit: "Credit",
};

export const PAYMENT_OPTIONS: TOption<TPaymentType>[] = [
  { value: "cash", label: PAYMENT_LABEL.cash },
  { value: "e-wallet", label: PAYMENT_LABEL["e-wallet"] },
  { value: "credit", label: PAYMENT_LABEL.credit },
];
