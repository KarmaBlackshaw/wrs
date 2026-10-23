import type { FastifyRequest } from "fastify";
import { db } from "../../db.ts";
import { makeCtx, type TCtx } from "./makeCtx.ts";

export const withTx = <R>(
  request: FastifyRequest,
  fn: (ctx: TCtx) => Promise<R>,
  { mode = "strict", now = new Date() }: { mode?: TCtx["mode"]; now?: Date } = {}
) => db.transaction((trx) => fn(makeCtx({ db: trx, actor: request.actor, now, mode })));
