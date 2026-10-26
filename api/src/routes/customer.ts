import { idSchema, pageOf } from "@wrs/contract/common";
import {
  customerCreateSchema,
  customerCreditBodySchema,
  customerListQuerySchema,
  customerSchema,
  customerUpdateSchema,
  customerWaiverBodySchema,
} from "@wrs/contract/customer";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  approveCustomer,
  createCustomer,
  getCustomer,
  listCustomers,
  setCustomerCredit,
  setCustomerDepositWaiver,
  updateCustomer,
} from "../domain/customer.ts";
import { withTx } from "../lib/context/withTx.ts";

const params = z.object({ id: idSchema });

const customerRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/customers",
    { config: { roles: ["owner", "cashier", "rider"] }, schema: { querystring: customerListQuerySchema, response: { 200: pageOf(customerSchema) } } },
    (request) => withTx(request, (ctx) => listCustomers(ctx, request.query))
  );

  app.get("/customers/:id", { config: { roles: ["owner", "cashier", "rider"] }, schema: { params, response: { 200: customerSchema } } }, (request) =>
    withTx(request, (ctx) => getCustomer(ctx, request.params.id))
  );

  app.post("/customers", { config: { roles: ["owner", "cashier"] }, schema: { body: customerCreateSchema, response: { 200: customerSchema } } }, (request) =>
    withTx(request, async (ctx) => {
      const { customer } = await createCustomer(ctx, request.body);

      return customer;
    })
  );

  app.patch("/customers/:id", { config: { roles: ["owner"] }, schema: { params, body: customerUpdateSchema, response: { 200: customerSchema } } }, (request) =>
    withTx(request, (ctx) => updateCustomer(ctx, request.params.id, request.body))
  );

  app.post("/customers/:id/approve", { config: { roles: ["owner"] }, schema: { params, response: { 200: customerSchema } } }, (request) =>
    withTx(request, (ctx) => approveCustomer(ctx, request.params.id))
  );

  app.put(
    "/customers/:id/credit",
    { config: { roles: ["owner"] }, schema: { params, body: customerCreditBodySchema, response: { 200: customerSchema } } },
    (request) => withTx(request, (ctx) => setCustomerCredit(ctx, request.params.id, request.body))
  );

  app.put(
    "/customers/:id/deposit-waiver",
    { config: { roles: ["owner"] }, schema: { params, body: customerWaiverBodySchema, response: { 200: customerSchema } } },
    (request) => withTx(request, (ctx) => setCustomerDepositWaiver(ctx, request.params.id, request.body))
  );
};

export default customerRoutes;
