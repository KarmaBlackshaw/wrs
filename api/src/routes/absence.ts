import { absenceCreateSchema, absencePreviewBodySchema, absenceSchema, coverageProposalSchema } from "@wrs/contract/employee";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { createAbsence, previewAbsence } from "../domain/absence.ts";
import { withTx } from "../lib/context/withTx.ts";

const absenceRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/absences/preview",
    { config: { roles: ["owner"] }, schema: { body: absencePreviewBodySchema, response: { 200: coverageProposalSchema } } },
    (request) => withTx(request, (ctx) => previewAbsence(ctx, request.body))
  );

  app.post("/absences", { config: { roles: ["owner"] }, schema: { body: absenceCreateSchema, response: { 200: absenceSchema } } }, (request) =>
    withTx(request, (ctx) => createAbsence(ctx, request.body))
  );
};

export default absenceRoutes;
