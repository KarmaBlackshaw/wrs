import type { TApproval, TApprovalKind, TApprovalListQuery, TApprovalStatus } from "@wrs/contract/approval";
import type { TPage } from "@wrs/contract/common";
import type { TWaiverRequest } from "@wrs/contract/customer";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { customerQuery, toCustomer, type TCustomerRow } from "./customer.ts";
import { loanQuery, withInstallments } from "./loan.ts";
import { syncConflictQuery, toSyncConflict, type TConflictRow } from "./sync-conflict.ts";
import { voidQuery, withVoidRefunds } from "./void.ts";
import { waiverRequestQuery } from "./waiver.ts";

type TDb = TCtx["db"];

type TFeedRow = { kind: TApprovalKind; id: string; createdAt: string };

type TDecision = Pick<TApproval, "requestedByName" | "decidedByName" | "decidedAt" | "decisionReason"> & { status: keyof typeof DECISION };

type TSyncConflictRow = TConflictRow & Pick<TApproval, "decidedByName" | "decidedAt" | "decisionReason">;

const DECISION = {
  pending: null,
  requested: null,
  approved: "approved",
  released: "approved",
  paid: "approved",
  rejected: "rejected",
  accepted: "accepted",
  voided: "voided",
} as const;

const STATUS_SQL = (pending: string) => `case when status = '${pending}' then 'pending' else 'handled' end as status`;

const feedQuery = (db: TDb) =>
  db
    .from("voids")
    .select(db.raw("'void' as kind"), "id", "createdAt", db.raw(STATUS_SQL("pending")))
    .where((query) => query.where("status", "pending").orWhereRaw("decided_at > created_at"))
    .unionAll([
      db.from("loans").select(db.raw("'loan' as kind"), "id", "createdAt", db.raw(STATUS_SQL("requested"))),
      db
        .from("approvalRequests")
        .where("kind", "waiver")
        .select(db.raw("'waiver' as kind"), "id", "createdAt", db.raw(STATUS_SQL("pending"))),
      db.from("customers").where("status", "pending").select(db.raw("'customer' as kind"), "id", "createdAt", db.raw("'pending' as status")),
      db.from("syncConflicts").select(db.raw("'sync_conflict' as kind"), "id", "createdAt", db.raw(STATUS_SQL("pending"))),
    ])
    .as("f");

const decided = (row: TFeedRow, { status, ...fields }: TDecision): Omit<TApproval, "kind" | "item"> => {
  const decision = DECISION[status];
  const approvalStatus: TApprovalStatus = decision == null ? "pending" : "handled";

  return { id: row.id, createdAt: row.createdAt, ...fields, status: approvalStatus, decision };
};

const idsOf = (rows: TFeedRow[], kind: TApprovalKind) => rows.filter((row) => row.kind === kind).map(({ id }) => id);

const customerRequesters = async (db: TDb, customerIds: string[]) => {
  const rows: { customerId: string; requestedByName: string }[] = await db("customerOwnerships as o")
    .join("employees as e", "e.id", "o.byEmployeeId")
    .where("o.event", "created")
    .whereIn("o.customerId", customerIds)
    .select("o.customerId", db.raw(`${fullNameSql("e")} as requested_by_name`));

  return new Map(rows.map(({ customerId, requestedByName }) => [customerId, requestedByName]));
};

const feedVoids = async (db: TDb, ids: string[]) => {
  const rows = await voidQuery(db).whereIn("v.id", ids);

  return withVoidRefunds(db, rows);
};

const feedLoans = async (db: TDb, ids: string[]) => {
  const rows = await loanQuery(db).whereIn("loans.id", ids);

  return withInstallments(db, rows);
};

const feedWaivers = async (ctx: TCtx, ids: string[]) => {
  const rows: TWaiverRequest[] = await waiverRequestQuery(ctx).whereIn("a.id", ids);

  return rows;
};

const feedCustomers = async (ctx: TCtx, ids: string[]) => {
  const rows: TCustomerRow[] = await customerQuery(ctx).whereIn("c.id", ids);

  return rows.map(toCustomer);
};

const feedConflicts = async (db: TDb, ids: string[]) => {
  const rows: TSyncConflictRow[] = await syncConflictQuery(db)
    .leftJoin("employees as d", "d.id", "s.decidedBy")
    .select(db.raw(`${fullNameSql("d")} as decided_by_name`), "s.decidedAt", "s.decisionReason")
    .whereIn("s.id", ids);

  return rows;
};

const hydrate = async (ctx: TCtx, rows: TFeedRow[]): Promise<TApproval[]> => {
  const { db } = ctx;
  const customerIds = idsOf(rows, "customer");

  const [voids, loans, waivers, customers, requesters, conflicts] = await Promise.all([
    feedVoids(db, idsOf(rows, "void")),
    feedLoans(db, idsOf(rows, "loan")),
    feedWaivers(ctx, idsOf(rows, "waiver")),
    feedCustomers(ctx, customerIds),
    customerRequesters(db, customerIds),
    feedConflicts(db, idsOf(rows, "sync_conflict")),
  ]);

  return rows.flatMap((row): TApproval[] => {
    switch (row.kind) {
      case "void": {
        const item = voids.find(({ id }) => id === row.id);

        return item ? [{ kind: "void", item, ...decided(row, { ...item, decidedByName: item.approvedByName }) }] : [];
      }
      case "loan": {
        const item = loans.find(({ id }) => id === row.id);

        return item ? [{ kind: "loan", item, ...decided(row, { ...item, requestedByName: item.employeeName, decidedByName: item.approvedByName }) }] : [];
      }
      case "waiver": {
        const item = waivers.find(({ id }) => id === row.id);

        return item ? [{ kind: "waiver", item, ...decided(row, item) }] : [];
      }
      case "customer": {
        const item = customers.find(({ id }) => id === row.id);

        return item
          ? [
              {
                kind: "customer",
                item,
                ...decided(row, {
                  status: "pending",
                  requestedByName: requesters.get(row.id) ?? "",
                  decidedByName: null,
                  decidedAt: null,
                  decisionReason: null,
                }),
              },
            ]
          : [];
      }
      case "sync_conflict": {
        const found = conflicts.find(({ conflictId }) => conflictId === row.id);

        if (!found) {
          return [];
        }

        const { decidedByName, decidedAt, decisionReason, ...conflict } = found;
        const item = toSyncConflict(conflict);

        return [
          { kind: "sync_conflict", item, ...decided(row, { status: item.status, requestedByName: item.riderName, decidedByName, decidedAt, decisionReason }) },
        ];
      }
    }
  });
};

export const listApprovals = async (ctx: TCtx, { status, page, pageSize }: TApprovalListQuery): Promise<TPage<TApproval>> => {
  const query = ctx.db
    .from(feedQuery(ctx.db))
    .select("f.kind", "f.id", "f.createdAt")
    .orderBy([
      { column: "f.createdAt", order: "desc" },
      { column: "f.id", order: "desc" },
    ]);

  if (status) {
    query.where("f.status", status);
  }

  const { items, ...rest } = await paginate<TFeedRow>(query, { page, pageSize });

  return { ...rest, items: await hydrate(ctx, items) };
};
