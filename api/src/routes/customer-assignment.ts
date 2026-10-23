import { idSchema, pageOf } from "@wrs/contract/common";
import {
  customerOwnershipListQuerySchema,
  customerOwnershipSchema,
  customerReleaseBodySchema,
  customerSchema,
  distributeCommitSchema,
  distributePreviewBodySchema,
  distributeProposalSchema,
} from "@wrs/contract/customer";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { commitDistribution, listCustomerOwnerships, previewDistribution, releaseCustomer } from "../domain/customer-assignment.ts";
import { withTx } from "../lib/context/withTx.ts";

const params = z.object({ id: idSchema });

const customerAssignmentRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/customers/:id/release",
    { config: { roles: ["owner"] }, schema: { params, body: customerReleaseBodySchema, response: { 200: customerSchema } } },
    (request) => withTx(request, (ctx) => releaseCustomer(ctx, { ...request.body, customerId: request.params.id }))
  );

  app.get(
    "/customers/:id/ownerships",
    { config: { roles: ["owner"] }, schema: { params, querystring: customerOwnershipListQuerySchema, response: { 200: pageOf(customerOwnershipSchema) } } },
    (request) => withTx(request, (ctx) => listCustomerOwnerships(ctx, { customerId: request.params.id, query: request.query }))
  );

  app.post(
    "/customers/distribute/preview",
    { config: { roles: ["owner"] }, schema: { body: distributePreviewBodySchema, response: { 200: distributeProposalSchema } } },
    (request) => withTx(request, (ctx) => previewDistribution(ctx, request.body))
  );

  app.post(
    "/customers/distribute",
    { config: { roles: ["owner"] }, schema: { body: distributeCommitSchema, response: { 204: z.null() } } },
    async (request, reply) => {
      await withTx(request, (ctx) => commitDistribution(ctx, request.body));

      return reply.code(204).send(null);
    }
  );
};

export default customerAssignmentRoutes;
