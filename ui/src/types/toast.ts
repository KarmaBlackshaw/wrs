export type TToastTone = "success" | "info" | "warning" | "error";

export type TToast = {
  id: number;
  message: string;
  tone: TToastTone;
};
