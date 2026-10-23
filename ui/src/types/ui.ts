import type { Component } from "vue";
import type { RouteLocationRaw } from "vue-router";

export type TTone = "ok" | "warn" | "danger" | "neutral" | "info";

export type TAlertTone = "warn" | "danger" | "info";

export type TAlert = {
  id: string;
  title: string;
  to: string;
  tone: TAlertTone;
};

export type TButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type TRowAction = {
  label: string;
  onSelect?: () => void;
  to?: RouteLocationRaw;
  variant?: TButtonVariant;
  icon?: Component;
};

export type TOption<T extends string = string> = {
  value: T;
  label: string;
};

export type TTab = {
  label: string;
  to: string;
  count?: number;
};
