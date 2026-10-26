import { z } from "zod";
import { idSchema, isoDateSchema, moneySchema } from "./common.ts";
import { ptoBalanceSchema } from "./employee.ts";
import { loanSchema } from "./loan.ts";

export const meSummarySchema = z.object({
  payslips: z.array(z.object({ runId: idSchema, periodStart: isoDateSchema, periodEnd: isoDateSchema, net: moneySchema })),
  loans: z.array(loanSchema),
  pto: ptoBalanceSchema,
});

export type TMeSummary = z.infer<typeof meSummarySchema>;
