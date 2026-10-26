import type { TRole } from "@wrs/contract/auth";
import type { Knex } from "knex";
import { domainError } from "../errors/domainError.ts";

const VIOLATION_STATUS = {
  "trip.open_exists": 409,
  "trip.not_open": 409,
  "trip.not_returning": 409,
  "trip.not_returned": 409,
  "delivery.duplicate": 409,
  "drawer.open_exists": 409,
  "drawer.not_open": 409,
  "customer.duplicate_phone": 409,
  "customer.duplicate_name": 409,
  "customer.release_not_due": 409,
  "payroll.overlap": 409,
  "payroll.finalized": 409,
  "shortage.not_in_run": 409,
  "shortage.already_deducted": 409,
  "void.already_voided": 409,
  "approval.not_pending": 409,
  "expense.session_closed": 409,
  "credit.not_enabled": 422,
  "credit.over_limit": 422,
  "deposit.required": 422,
  "trip.over_remaining": 422,
  "product.not_deliverable": 422,
  "payment.over_balance": 422,
  "price.changed": 422,
  "meter.below_last": 422,
  "loan.over_max": 422,
  "loan.authorization_required": 422,
  "customer.interval_required": 422,
  "setting.not_set": 422,
  "file.type_not_allowed": 422,
  "file.too_large": 422,
  "reference.not_found": 422,
} as const;

type TViolationCode = keyof typeof VIOLATION_STATUS;
type TMode = "strict" | "record";

export type TActor = { id: string; name: string; roles: TRole[]; activeRole: TRole };

export type TCtx = {
  db: Knex | Knex.Transaction;
  actor: TActor;
  now: Date;
  mode: TMode;
  violations: { code: TViolationCode; message: string; details?: Record<string, unknown> }[];
  violation: (code: TViolationCode, message: string, details?: Record<string, unknown>) => void;
};

export const makeCtx = ({ db, actor, now, mode }: Pick<TCtx, "db" | "actor" | "now" | "mode">): TCtx => {
  const violations: TCtx["violations"] = [];

  return {
    db,
    actor,
    now,
    mode,
    violations,
    violation: (code, message, details) => {
      if (mode === "strict") {
        throw domainError({ statusCode: VIOLATION_STATUS[code], code, message, details });
      }

      violations.push({ code, message, details });
    },
  };
};
