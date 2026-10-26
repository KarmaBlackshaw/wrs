import { expenseCreateSchema, expenseSchema } from "@wrs/contract/expense";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { createExpense } from "../domain/expense.ts";
import { withTx } from "../lib/context/withTx.ts";

const expenseRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post("/expenses", { config: { roles: ["owner", "cashier"] }, schema: { body: expenseCreateSchema, response: { 200: expenseSchema } } }, (request) =>
    withTx(request, (ctx) => createExpense(ctx, request.body))
  );
};

export default expenseRoutes;
