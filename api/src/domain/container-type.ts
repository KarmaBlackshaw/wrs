import { containerTypeSchema, type TContainerType, type TContainerTypeCode, type TContainerTypeUpdate } from "@wrs/contract/container";
import { z } from "zod";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { domainError } from "../lib/errors/domainError.ts";

export const listContainerTypes = async (ctx: TCtx): Promise<TContainerType[]> => {
  const rows = await ctx.db("containerTypes").orderBy("code").select("code", "deliverable", "depositAmount");

  return z.array(containerTypeSchema).parse(rows);
};

export const requireContainerType = async (ctx: TCtx, code: TContainerTypeCode) => {
  const row = await ctx.db("containerTypes").where({ code }).first("code");

  if (!row) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: `Container type ${code} does not exist.`, details: { field: "containerType" } });
  }
};

export const updateContainerType = async (ctx: TCtx, { code, depositAmount }: TContainerTypeUpdate & { code: TContainerTypeCode }): Promise<TContainerType> => {
  const row = await ctx.db("containerTypes").where({ code }).forUpdate().first("code");

  if (!row) {
    throw domainError({ statusCode: 404, code: "not_found", message: `Container type ${code} does not exist.` });
  }

  await ctx.db("containerTypes").where({ code }).update({ depositAmount });

  const updated = await ctx.db("containerTypes").where({ code }).first("code", "deliverable", "depositAmount");

  return containerTypeSchema.parse(updated);
};
