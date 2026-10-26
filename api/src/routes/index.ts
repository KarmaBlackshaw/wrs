import { readdir } from "node:fs/promises";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

const isRoutePlugin = (mod: unknown): mod is { default: FastifyPluginAsyncZod } =>
  typeof mod === "object" && mod != null && "default" in mod && typeof mod.default === "function";

const routes: FastifyPluginAsyncZod = async (app) => {
  const entries = await readdir(import.meta.dirname);
  const files = entries.filter((file) => /^[^.]+\.ts$/.test(file) && file !== "index.ts").toSorted();

  for (const file of files) {
    const mod: unknown = await import(new URL(file, import.meta.url).href);

    if (!isRoutePlugin(mod)) {
      throw new Error(`routes/${file} must export default a route plugin`);
    }

    await app.register(mod.default);
  }
};

export default routes;
