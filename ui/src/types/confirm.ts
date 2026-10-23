import type { TButtonVariant } from "./ui";

export type TConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: TButtonVariant;
};
