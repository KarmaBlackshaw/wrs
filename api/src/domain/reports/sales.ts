import type { TPaymentType, TSaleSource, TVoidStatus } from "@wrs/contract/sale";
import { listSales } from "../sale.ts";
import { allPages } from "./allPages.ts";
import type { TReportDefinition } from "./types.ts";

const TYPE_LABEL: Record<TSaleSource, string> = { delivery: "Delivery", walk_in: "Walk-in" };

const PAYMENT_LABEL: Record<TPaymentType, string> = { cash: "Cash", e_wallet: "E-wallet", credit: "Credit" };

const STATUS_LABEL: Record<TVoidStatus, string> = { none: "Completed", pending: "Void pending", voided: "Voided" };

export const salesReport: TReportDefinition = {
  build: async (ctx, range) => {
    const sales = await allPages((page) => listSales(ctx, { ...range, ...page }));

    return {
      columns: [
        { key: "date", label: "Date", align: "left", format: "datetime" },
        { key: "type", label: "Type", align: "left", format: "text" },
        { key: "customer", label: "Customer", align: "left", format: "text" },
        { key: "amount", label: "Amount", align: "right", format: "money" },
        { key: "payment", label: "Payment", align: "left", format: "text" },
        { key: "status", label: "Status", align: "left", format: "text" },
      ],
      rows: sales.map(({ createdAt, source, customerName, amount, paymentType, voidStatus }) => ({
        date: createdAt,
        type: TYPE_LABEL[source],
        customer: customerName ?? "Walk-in customer",
        amount,
        payment: PAYMENT_LABEL[paymentType],
        status: STATUS_LABEL[voidStatus],
      })),
    };
  },
  summarize: async (ctx, range) => {
    const { totals } = await listSales(ctx, { ...range, page: 1, pageSize: 1 });

    return { slug: "sales", value: totals.amount, count: totals.count, tone: "default" };
  },
};
