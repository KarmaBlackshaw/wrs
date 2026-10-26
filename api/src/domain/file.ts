import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileMimeSchema, type TFile } from "@wrs/contract/file";
import { env } from "../env.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { domainError } from "../lib/errors/domainError.ts";

type TFileUpload = { originalName: string; mime: string; content: Buffer };

export const findFile = async (db: TCtx["db"], id: string): Promise<TFile> => {
  const file = await db("files")
    .join("employees", "employees.id", "files.uploadedBy")
    .where("files.id", id)
    .first(
      "files.id",
      "files.originalName",
      "files.mime",
      "files.size",
      "files.uploadedBy",
      "files.createdAt",
      db.raw("concat(employees.first_name, ' ', employees.last_name) as uploaded_by_name")
    );

  if (!file) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Not found." });
  }

  return file;
};

export const openFile = async (db: TCtx["db"], id: string) => {
  const file = await findFile(db, id);

  return { file, stream: createReadStream(join(env.UPLOAD_DIR, file.id)) };
};

export const createFile = async (ctx: TCtx, { originalName, mime, content }: TFileUpload) => {
  const { success: isAllowed } = fileMimeSchema.safeParse(mime);

  if (!isAllowed) {
    throw domainError({ statusCode: 422, code: "file.type_not_allowed", message: "Only images (PNG, JPEG, WebP, HEIC) and PDFs can be uploaded." });
  }

  const id = await insertRecord(ctx, "files", { originalName: originalName.slice(0, 255), mime, size: content.length, uploadedBy: ctx.actor.id });

  await mkdir(env.UPLOAD_DIR, { recursive: true });
  await writeFile(join(env.UPLOAD_DIR, id), content);

  return findFile(ctx.db, id);
};
