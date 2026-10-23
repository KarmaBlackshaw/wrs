import type { TApiError } from "@wrs/contract/common";
import type { FastifyError } from "fastify";
import fp from "fastify-plugin";
import { DomainError } from "../lib/errors/domainError.ts";

type THandledError = Error & Partial<Pick<FastifyError, "code" | "statusCode" | "validation">>;

const SESSION_EXPIRED: Pick<TApiError, "code" | "message"> = { code: "unauthorized", message: "Your session has expired. Log in again." };

const CLIENT_ERROR: Partial<Record<number, Pick<TApiError, "code" | "message">>> = {
  400: { code: "validation", message: "The request is invalid." },
  401: SESSION_EXPIRED,
  404: { code: "not_found", message: "Not found." },
  413: { code: "validation", message: "The request is too large." },
  415: { code: "validation", message: "This content type is not supported." },
};

const DUPLICATE_KEY: Partial<Record<string, Pick<TApiError, "code" | "message">>> = {
  employees_username_unique: { code: "employee.duplicate_username", message: "An employee with this username already exists." },
  expense_categories_name_unique: { code: "expense_category.duplicate_name", message: "An expense category with this name already exists." },
};

const toApiError = (error: THandledError): TApiError | undefined => {
  if (error instanceof DomainError) {
    return error.body;
  }

  if (error.validation) {
    return { statusCode: 400, code: "validation", message: "Some fields are invalid.", details: { issues: error.validation } };
  }

  if (error.code?.startsWith("FST_JWT_")) {
    return { statusCode: 401, ...SESSION_EXPIRED };
  }

  if (error.code === "FST_REQ_FILE_TOO_LARGE") {
    return { statusCode: 422, code: "file.too_large", message: "The file is larger than 10 MB." };
  }

  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    return { statusCode: 422, code: "reference.not_found", message: "A referenced record does not exist." };
  }

  if (error.code === "ER_DUP_ENTRY") {
    const [, key = ""] = /for key '(?:[^.']+\.)?([^']+)'/.exec(error.message) ?? [];

    return { statusCode: 409, ...(DUPLICATE_KEY[key] ?? { code: "conflict", message: "This record already exists." }) };
  }

  const { statusCode = 500 } = error;
  const clientError = CLIENT_ERROR[statusCode];

  return clientError && { statusCode, ...clientError };
};

export default fp(async (app) => {
  app.setErrorHandler<THandledError>((error, request, reply) => {
    const apiError = toApiError(error);

    if (apiError) {
      return reply.status(apiError.statusCode).send(apiError);
    }

    request.log.error(error);

    return reply.status(500).send({ statusCode: 500, code: "internal", message: "Something went wrong." });
  });

  app.setNotFoundHandler((_request, reply) => reply.status(404).send({ statusCode: 404, code: "not_found", message: "Not found." }));
});
