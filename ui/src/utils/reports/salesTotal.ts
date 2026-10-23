import sumBy from "lodash/sumBy";

import { deliveries } from "@/mocks/trips";
import { walkInSales } from "@/mocks/walkInSales";

export function salesTotal() {
  return sumBy(deliveries, "amount") + sumBy(walkInSales, "amount");
}
