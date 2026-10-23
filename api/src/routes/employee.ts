import { idSchema, pageOf } from "@wrs/contract/common";
import {
  employeeCreateSchema,
  employeeDetailSchema,
  employeeListQuerySchema,
  employeeOptionSchema,
  employeeOptionsQuerySchema,
  employeePasswordBodySchema,
  employeeSchema,
  employeeUpdateSchema,
  payPlanCreateSchema,
  payPlanSchema,
} from "@wrs/contract/employee";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createEmployee,
  createPayPlan,
  getEmployeeDetail,
  listEmployeeOptions,
  listEmployees,
  setEmployeePassword,
  updateEmployee,
} from "../domain/employee.ts";
import { withTx } from "../lib/context/withTx.ts";

const params = z.object({ id: idSchema });

const employeeRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/employees",
    { config: { roles: ["owner"] }, schema: { querystring: employeeListQuerySchema, response: { 200: pageOf(employeeSchema) } } },
    (request) => withTx(request, (ctx) => listEmployees(ctx, request.query))
  );

  app.get(
    "/employees/options",
    { config: { roles: ["owner", "cashier"] }, schema: { querystring: employeeOptionsQuerySchema, response: { 200: z.array(employeeOptionSchema) } } },
    (request) => withTx(request, (ctx) => listEmployeeOptions(ctx, request.query))
  );

  app.post("/employees", { config: { roles: ["owner"] }, schema: { body: employeeCreateSchema, response: { 200: employeeSchema } } }, (request) =>
    withTx(request, (ctx) => createEmployee(ctx, request.body))
  );

  app.get("/employees/:id", { config: { roles: ["owner"] }, schema: { params, response: { 200: employeeDetailSchema } } }, (request) =>
    withTx(request, (ctx) => getEmployeeDetail(ctx, request.params.id))
  );

  app.patch("/employees/:id", { config: { roles: ["owner"] }, schema: { params, body: employeeUpdateSchema, response: { 200: employeeSchema } } }, (request) =>
    withTx(request, (ctx) => updateEmployee(ctx, { id: request.params.id, patch: request.body }))
  );

  app.post(
    "/employees/:id/password",
    { config: { roles: ["owner"] }, schema: { params, body: employeePasswordBodySchema, response: { 204: z.null() } } },
    async (request, reply) => {
      await withTx(request, (ctx) => setEmployeePassword(ctx, { id: request.params.id, password: request.body.password }));

      return reply.code(204).send(null);
    }
  );

  app.post(
    "/employees/:id/pay-plans",
    { config: { roles: ["owner"] }, schema: { params, body: payPlanCreateSchema, response: { 200: payPlanSchema } } },
    (request) => withTx(request, (ctx) => createPayPlan(ctx, { employeeId: request.params.id, plan: request.body }))
  );
};

export default employeeRoutes;
