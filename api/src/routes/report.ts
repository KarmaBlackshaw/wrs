import { digestDaySchema, reportQuerySchema, reportSummarySchema, reportTableSchema } from "@wrs/contract/report";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { digestDays } from "../domain/digest.ts";
import { reportCsv, reportRange, reportSummaries, reportTable } from "../domain/report.ts";
import { withTx } from "../lib/context/withTx.ts";

const slugParamsSchema = z.object({ slug: z.string() });

const reportRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/reports/summaries",
    { config: { roles: ["owner"] }, schema: { querystring: reportQuerySchema, response: { 200: z.array(reportSummarySchema) } } },
    (request) => withTx(request, (ctx) => reportSummaries(ctx, request.query))
  );

  app.get(
    "/reports/digest",
    { config: { roles: ["owner"] }, schema: { querystring: reportQuerySchema, response: { 200: z.array(digestDaySchema) } } },
    (request) => withTx(request, (ctx) => digestDays(ctx, reportRange(ctx, request.query)))
  );

  app.get(
    "/reports/:slug",
    { config: { roles: ["owner"] }, schema: { params: slugParamsSchema, querystring: reportQuerySchema, response: { 200: reportTableSchema } } },
    (request) => withTx(request, (ctx) => reportTable(ctx, { ...request.params, ...request.query }))
  );

  app.get(
    "/reports/:slug/csv",
    { config: { roles: ["owner"] }, schema: { params: slugParamsSchema, querystring: reportQuerySchema, response: { 200: z.string() } } },
    async (request, reply) => {
      const { filename, csv } = await withTx(request, (ctx) => reportCsv(ctx, { ...request.params, ...request.query }));

      return reply.type("text/csv; charset=utf-8").header("content-disposition", `attachment; filename="${filename}"`).send(csv);
    }
  );
};

export default reportRoutes;
