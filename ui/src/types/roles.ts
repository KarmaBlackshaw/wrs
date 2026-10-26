import type { TRole } from "@wrs/contract/auth";

import { ROUTES } from "@/types/routes";
import type { TOption } from "@/types/ui";

export type { TRole };

export const ROLE_HOME: Record<TRole, string> = {
  owner: ROUTES.OWNER.INDEX,
  cashier: ROUTES.CASHIER.INDEX,
  rider: ROUTES.RIDER.INDEX,
  washer: ROUTES.STAFF.LOGS,
  helper: ROUTES.STAFF.LOGS,
};

export const ROLE_LABEL: Record<TRole, string> = {
  owner: "Owner",
  cashier: "Cashier",
  rider: "Rider",
  washer: "Washer",
  helper: "Helper",
};

export const ROLE_OPTIONS: TOption<TRole>[] = [
  { value: "owner", label: ROLE_LABEL.owner },
  { value: "cashier", label: ROLE_LABEL.cashier },
  { value: "rider", label: ROLE_LABEL.rider },
  { value: "washer", label: ROLE_LABEL.washer },
  { value: "helper", label: ROLE_LABEL.helper },
];
