import { z } from "zod";
import { idSchema } from "./common.ts";

export const roleSchema = z.enum(["owner", "cashier", "rider", "washer", "helper"]);
export const loginBodySchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export const meSchema = z.object({
  id: idSchema,
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  roles: z.array(roleSchema),
});

export const loginResponseSchema = z.object({ token: z.string(), me: meSchema });

export type TRole = z.infer<typeof roleSchema>;
export type TLoginBody = z.infer<typeof loginBodySchema>;
export type TMe = z.infer<typeof meSchema>;
export type TLoginResponse = z.infer<typeof loginResponseSchema>;
