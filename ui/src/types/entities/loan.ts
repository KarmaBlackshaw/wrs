export type TLoanType = "advance" | "loan";
export type TLoanInterestMethod = "flat" | "diminishing";
export type TLoanStatus = "requested" | "approved" | "released" | "paid" | "rejected";

export type TLoan = {
  id: string;
  employeeId: string;
  type: TLoanType;
  principal: number;
  ratePct: number;
  method: TLoanInterestMethod;
  termMonths: number;
  authorizationUrl?: string;
  status: TLoanStatus;
};

export type TInstallment = {
  loanId: string;
  seq: number;
  due: string;
  principalPart: number;
  interestPart: number;
  paid: boolean;
};

export type TLoanRow = TLoan & { employee: string; balance: number };
