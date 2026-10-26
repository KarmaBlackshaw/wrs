import type { TAgingBucket } from "@wrs/contract/customer";
import { AGING_LABEL } from "@wrs/contract/labels/customer";
import type { TCtx } from "../../lib/context/makeCtx.ts";
import { manilaDayBounds } from "../../lib/dates/manilaDayBounds.ts";
import { fullNameSql } from "../../lib/sql/fullNameSql.ts";
import { creditFifoQuery } from "../customer.ts";
import type { TReportDefinition } from "./types.ts";

type TAgingRow = { customer: string; rider: string | null; bucket: TAgingBucket; balance: number };

const BUCKETS: TAgingBucket[] = ["current", "7", "15", "30+"];

const agingAsOf = async ({ db }: TCtx, to: string) => {
  const asOf = new Date(manilaDayBounds(to).end.getTime() - 1);
  const oldestUnpaidOn = "min(date(convert_tz(f.created_at, '+00:00', '+08:00')))";

  const rows: (TAgingRow & { bucketRank: number })[] = await db
    .from(creditFifoQuery(db, asOf).as("f"))
    .join("customers as c", "c.id", "f.customerId")
    .leftJoin("employees as r", "r.id", "c.riderId")
    .where("f.unpaid", ">", 0)
    .groupBy("c.id", "c.firstName", "c.lastName", "r.firstName", "r.lastName")
    .select(
      db.raw(`${fullNameSql("c")} as customer`),
      db.raw(`${fullNameSql("r")} as rider`),
      db.raw("sum(f.unpaid) as balance"),
      db.raw(`interval(datediff(?, ${oldestUnpaidOn}), 7, 15, 30) as bucket_rank`, [to])
    )
    .orderByRaw(`bucket_rank, ${oldestUnpaidOn}, c.last_name, c.first_name`);

  return rows.map(({ bucketRank, ...row }) => ({ ...row, bucket: BUCKETS[bucketRank] ?? "30+" }));
};

export const creditAgingReport: TReportDefinition = {
  build: async (ctx, { to }) => ({
    columns: [
      { key: "customer", label: "Customer", align: "left", format: "text" },
      { key: "rider", label: "Rider", align: "left", format: "text" },
      { key: "bucket", label: "Bucket", align: "left", format: "text" },
      { key: "balance", label: "Balance", align: "right", format: "money" },
    ],
    rows: (await agingAsOf(ctx, to)).map((row) => ({ ...row, bucket: AGING_LABEL[row.bucket] })),
  }),
  summarize: async (ctx, { to }) => {
    const rows = await agingAsOf(ctx, to);

    return { slug: "credit-aging", value: rows.reduce((sum, { balance }) => sum + balance, 0), count: rows.length, tone: "default" };
  },
};
