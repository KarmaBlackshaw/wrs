import type { TAgingBucket, TCreditAging } from "@wrs/contract/customer";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { customerQuery, toCustomer, type TCustomerRow } from "./customer.ts";

const BUCKETS: TAgingBucket[] = ["current", "7", "15", "30+"];

const byOldestUnpaid = (a: TCustomerRow, b: TCustomerRow) =>
  (a.oldestUnpaidOn ?? "").localeCompare(b.oldestUnpaidOn ?? "") || a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);

export const creditAging = async (ctx: TCtx): Promise<TCreditAging> => {
  const rows: TCustomerRow[] = await customerQuery(ctx).where("b.creditBalance", ">", 0);

  const buckets = BUCKETS.map((bucket) => {
    const customers = rows
      .filter(({ agingBucket }) => agingBucket === bucket)
      .sort(byOldestUnpaid)
      .map(toCustomer);

    return { bucket, total: customers.reduce((sum, { creditBalance }) => sum + creditBalance, 0), customers };
  });

  return { buckets, grandTotal: buckets.reduce((sum, { total }) => sum + total, 0) };
};
