import type { TContainerTypeCode } from "@wrs/contract/container";
import type { TDepositKind } from "@wrs/contract/deposit";
import type { TPaymentMethod } from "@wrs/contract/payment";
import { insertRecord } from "../lib/context/insertRecord.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";

type TRecordDepositInput = {
  customerId: string;
  kind: TDepositKind;
  method?: TPaymentMethod;
  tripId?: string;
  drawerSessionId?: string;
  refType: string;
  refId: string;
  lines: { containerType: TContainerTypeCode; qty: number; amount: number }[];
};

export const recordDeposit = async (ctx: TCtx, { customerId, kind, method, tripId, drawerSessionId, refType, refId, lines }: TRecordDepositInput) => {
  await Promise.all(
    lines.map(({ containerType, qty, amount }) =>
      insertRecord(ctx, "depositEntries", {
        customerId,
        containerType,
        qty,
        amount,
        kind,
        method: method ?? null,
        tripId: tripId ?? null,
        drawerSessionId: drawerSessionId ?? null,
        refType,
        refId,
        createdBy: ctx.actor.id,
      })
    )
  );
};
