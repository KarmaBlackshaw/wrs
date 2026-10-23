import sumBy from "lodash/sumBy";

import { installments } from "@/mocks/loans";
import type { TLoan } from "@/types";

export function loanBalance(loan: TLoan) {
  const paid = sumBy(
    installments.filter((installment) => installment.loanId === loan.id && installment.paid),
    "principalPart"
  );

  return loan.status === "released" || loan.status === "paid" ? Math.max(0, loan.principal - paid) : loan.principal;
}
