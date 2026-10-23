import { containerTypeCodeSchema, containerTypeSchema, containerTypeUpdateSchema } from "@wrs/contract/container";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { listContainerTypes, updateContainerType } from "../domain/container-type.ts";
import { withTx } from "../lib/context/withTx.ts";

const containerTypeRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/container-types", { schema: { response: { 200: z.array(containerTypeSchema) } } }, (request) => withTx(request, (ctx) => listContainerTypes(ctx)));

  app.patch(
    "/container-types/:code",
    {
      config: { roles: ["owner"] },
      schema: { params: z.object({ code: containerTypeCodeSchema }), body: containerTypeUpdateSchema, response: { 200: containerTypeSchema } },
    },
    (request) => withTx(request, (ctx) => updateContainerType(ctx, { code: request.params.code, ...request.body }))
  );
};

export default containerTypeRoutes;
