import { settingEntrySchema, settingWriteSchema } from "@wrs/contract/setting";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { listSettings, writeSetting } from "../domain/setting.ts";
import { withTx } from "../lib/context/withTx.ts";

const settingRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/settings", { config: { roles: ["owner"] }, schema: { response: { 200: z.array(settingEntrySchema) } } }, (request) =>
    withTx(request, (ctx) => listSettings(ctx))
  );

  app.post("/settings", { config: { roles: ["owner"] }, schema: { body: settingWriteSchema, response: { 200: settingEntrySchema } } }, (request) =>
    withTx(request, (ctx) => writeSetting(ctx, request.body))
  );
};

export default settingRoutes;
