import closeWithGrace from "close-with-grace";
import { buildApp } from "./app.ts";
import { env } from "./env.ts";

const app = await buildApp();

closeWithGrace(async ({ err }) => {
  if (err) {
    app.log.error(err);
  }

  await app.close();
});

await app.listen({ host: env.HOST, port: env.PORT });
