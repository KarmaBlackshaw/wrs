import { randomUUID } from "node:crypto";
import type { TLoginBody, TMe, TRole } from "@wrs/contract/auth";
import argon2 from "argon2";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { domainError } from "../lib/errors/domainError.ts";

const unknownUserHash = argon2.hash(randomUUID());

export const findMe = async (db: TCtx["db"], id: string): Promise<TMe> => {
  const employee = await db("employees").where({ id }).first("id", "username", "firstName", "lastName", "phone");
  const roles: TRole[] = await db("employeeRoles").where({ employeeId: id }).pluck("role");

  return { ...employee, roles };
};

export const authenticate = async (db: TCtx["db"], { username, password }: TLoginBody) => {
  const employee = await db("employees").where({ username }).first("id", "passwordHash", "active");
  const isValid = await argon2.verify(employee?.passwordHash ?? (await unknownUserHash), password);

  if (!employee || !isValid) {
    throw domainError({ statusCode: 401, code: "auth.invalid_credentials", message: "Wrong username or password." });
  }

  if (!employee.active) {
    throw domainError({ statusCode: 403, code: "auth.inactive", message: "This account is inactive." });
  }

  return findMe(db, employee.id);
};
