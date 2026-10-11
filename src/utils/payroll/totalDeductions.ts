import sumBy from "lodash/sumBy";

import type { TPayLine } from "@/types";

export function totalDeductions(line: TPayLine) {
  return sumBy(line.deductions, "amount");
}
