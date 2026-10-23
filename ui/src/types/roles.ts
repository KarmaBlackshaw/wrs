import { ROUTES } from "@/types/routes";

export type TRole = "owner" | "cashier" | "rider" | "washer" | "helper";

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
