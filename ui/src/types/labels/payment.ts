import type { TPaymentMethod } from "@wrs/contract/payment";
import type { TPaymentType } from "@wrs/contract/sale";
import type { TOption } from "@/types/ui";

export const PAYMENT_LABEL: Record<TPaymentType, string> = {
  cash: "Cash",
  e_wallet: "E-wallet",
  credit: "Credit",
};

export const PAYMENT_OPTIONS: TOption<TPaymentType>[] = [
  { value: "cash", label: PAYMENT_LABEL.cash },
  { value: "e_wallet", label: PAYMENT_LABEL.e_wallet },
  { value: "credit", label: PAYMENT_LABEL.credit },
];

export const PAYMENT_METHOD_LABEL: Record<TPaymentMethod, string> = {
  cash: PAYMENT_LABEL.cash,
  e_wallet: PAYMENT_LABEL.e_wallet,
};

export const PAYMENT_METHOD_OPTIONS: TOption<TPaymentMethod>[] = [
  { value: "cash", label: PAYMENT_METHOD_LABEL.cash },
  { value: "e_wallet", label: PAYMENT_METHOD_LABEL.e_wallet },
];
