import { idSchema } from "@wrs/contract/common";
import { expenseCreateSchema, expenseListQuerySchema, expensePageSchema, expenseSchema, expenseUpdateSchema } from "@wrs/contract/expense";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { createExpense, deleteExpense, listExpenses, updateExpense } from "../domain/expense.ts";
import { withTx } from "../lib/context/withTx.ts";

const params = z.object({ id: idSchema });

const expenseRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/expenses", { config: { roles: ["owner"] }, schema: { querystring: expenseListQuerySchema, response: { 200: expensePageSchema } } }, (request) =>
    withTx(request, (ctx) => listExpenses(ctx, request.query))
  );

  app.post("/expenses", { config: { roles: ["owner", "cashier"] }, schema: { body: expenseCreateSchema, response: { 200: expenseSchema } } }, (request) =>
    withTx(request, (ctx) => createExpense(ctx, request.body))
  );

  app.patch("/expenses/:id", { config: { roles: ["owner"] }, schema: { params, body: expenseUpdateSchema, response: { 200: expenseSchema } } }, (request) =>
    withTx(request, (ctx) => updateExpense(ctx, { id: request.params.id, ...request.body }))
  );

  app.delete("/expenses/:id", { config: { roles: ["owner"] }, schema: { params, response: { 200: expenseSchema } } }, (request) =>
    withTx(request, (ctx) => deleteExpense(ctx, request.params.id))
  );
};

export default expenseRoutes;
