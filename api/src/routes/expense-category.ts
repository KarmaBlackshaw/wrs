import { expenseCategorySchema } from "@wrs/contract/expense";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { listExpenseCategories } from "../domain/expense-category.ts";
import { withTx } from "../lib/context/withTx.ts";

const expenseCategoryRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/expense-categories", { config: { roles: ["owner", "cashier"] }, schema: { response: { 200: z.array(expenseCategorySchema) } } }, (request) =>
    withTx(request, (ctx) => listExpenseCategories(ctx))
  );
};

export default expenseCategoryRoutes;
