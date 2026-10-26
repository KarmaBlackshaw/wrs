import type { TRole } from "@wrs/contract/auth";
import fp from "fastify-plugin";
import { db } from "../db.ts";
import type { TActor } from "../lib/context/makeCtx.ts";
import { domainError } from "../lib/errors/domainError.ts";

declare module "fastify" {
  interface FastifyContextConfig {
    roles?: TRole[];
    isPublic?: boolean;
  }

  interface FastifyRequest {
    actor: TActor;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
  }
}

export default fp(async (app) => {
  app.decorateRequest("actor");

  app.addHook("onRequest", async (request) => {
    const { isPublic, roles: allowedRoles } = request.routeOptions.config;

    if (isPublic) {
      return;
    }

    await request.jwtVerify();

    const { sub } = request.user;
    const employee = await db("employees").where({ id: sub, active: true }).first("firstName", "lastName");

    if (!employee) {
      throw app.httpErrors.unauthorized();
    }

    const roles: TRole[] = await db("employeeRoles").where({ employeeId: sub }).pluck("role");
    const heldRole = roles.find((role) => role === request.headers["x-active-role"]);

    if (allowedRoles && !heldRole) {
      throw domainError({ statusCode: 403, code: "auth.role_not_held", message: "You don't hold that role." });
    }

    if (allowedRoles && heldRole && !allowedRoles.includes(heldRole)) {
      throw domainError({ statusCode: 403, code: "auth.role_forbidden", message: "Your role can't do this." });
    }

    const activeRole = heldRole ?? roles[0];

    if (!activeRole) {
      throw app.httpErrors.unauthorized();
    }

    request.actor = { id: sub, name: `${employee.firstName} ${employee.lastName}`, roles, activeRole };
  });
});
