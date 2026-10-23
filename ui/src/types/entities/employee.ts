import type { TRole } from "@/types/roles";

export type TEmployee = {
  id: string;
  name: string;
  phone: string;
  roles: TRole[];
  active: boolean;
};
