import { idSchema } from "@wrs/contract/common";
import { fileSchema } from "@wrs/contract/file";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../db.ts";
import { createFile, openFile } from "../domain/file.ts";
import { withTx } from "../lib/context/withTx.ts";

const encodeRfc5987 = (value: string) => encodeURIComponent(value).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

const contentDisposition = (filename: string) =>
  `inline; filename="${filename.replace(/[^\x20-\x7e]|["\\]/g, "_")}"; filename*=UTF-8''${encodeRfc5987(filename)}`;

const fileRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post("/files", { schema: { response: { 200: fileSchema } } }, async (request) => {
    const upload = request.isMultipart() ? await request.file() : undefined;

    if (!upload || upload.fieldname !== "file") {
      throw app.httpErrors.badRequest();
    }

    const content = await upload.toBuffer();

    return withTx(request, (ctx) => createFile(ctx, { originalName: upload.filename, mime: upload.mimetype, content }));
  });

  app.get("/files/:id", { schema: { params: z.object({ id: idSchema }) } }, async (request, reply) => {
    const { file, stream } = await openFile(db, request.params.id);

    return reply
      .type(file.mime)
      .header("x-content-type-options", "nosniff")
      .header("content-security-policy", "default-src 'none'")
      .header("content-disposition", contentDisposition(file.originalName))
      .send(stream);
  });
};

export default fileRoutes;
