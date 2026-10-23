import { priceCreateSchema, priceSchema, productCreateSchema, productListQuerySchema, productSchema, productUpdateSchema } from "@wrs/contract/product";
import { idSchema } from "@wrs/contract/common";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { addPrice, createProduct, listPrices, listProducts, updateProduct } from "../domain/product.ts";
import { withTx } from "../lib/context/withTx.ts";
import { domainError } from "../lib/errors/domainError.ts";

const params = z.object({ id: idSchema });

const productRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/products", { schema: { querystring: productListQuerySchema, response: { 200: z.array(productSchema) } } }, (request) => {
    if (request.query.includeInactive === "yes" && request.actor.activeRole !== "owner") {
      throw domainError({ statusCode: 403, code: "auth.role_forbidden", message: "Your role can't do this." });
    }

    return withTx(request, (ctx) => listProducts(ctx, request.query));
  });

  app.get("/products/:id/prices", { config: { roles: ["owner"] }, schema: { params, response: { 200: z.array(priceSchema) } } }, (request) =>
    withTx(request, (ctx) => listPrices(ctx, request.params.id))
  );

  app.post("/products", { config: { roles: ["owner"] }, schema: { body: productCreateSchema, response: { 200: productSchema } } }, (request) =>
    withTx(request, (ctx) => createProduct(ctx, request.body))
  );

  app.patch("/products/:id", { config: { roles: ["owner"] }, schema: { params, body: productUpdateSchema, response: { 200: productSchema } } }, (request) =>
    withTx(request, (ctx) => updateProduct(ctx, { id: request.params.id, ...request.body }))
  );

  app.post("/products/:id/prices", { config: { roles: ["owner"] }, schema: { params, body: priceCreateSchema, response: { 200: priceSchema } } }, (request) =>
    withTx(request, (ctx) => addPrice(ctx, { productId: request.params.id, ...request.body }))
  );
};

export default productRoutes;
