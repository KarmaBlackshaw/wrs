import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common.ts";

export const fileMimeSchema = z.enum(["image/png", "image/jpeg", "image/webp", "image/heic", "application/pdf"]);

export const fileSchema = z.object({
  id: idSchema,
  originalName: z.string(),
  mime: fileMimeSchema,
  size: z.number().int(),
  uploadedBy: idSchema,
  uploadedByName: z.string(),
  createdAt: isoDateTimeSchema,
});

export type TFileMime = z.infer<typeof fileMimeSchema>;
export type TFile = z.infer<typeof fileSchema>;
