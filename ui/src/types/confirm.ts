import type { TButtonVariant } from "./ui";

export type TConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: TButtonVariant;
};

export type TReasonPromptOptions = {
  title: string;
  confirmLabel?: string;
  submit: (reason: string) => Promise<boolean>;
};

export type TReasonActionOptions = {
  title: string;
  confirmLabel: string;
  successMessage: string;
  submit: (reason: string) => Promise<unknown>;
};
