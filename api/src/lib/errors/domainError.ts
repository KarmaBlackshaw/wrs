import type { TApiError } from "@wrs/contract/common";

export type TDomainErrorOptions = Omit<TApiError, "statusCode"> & { statusCode: 403 | 404 | 409 | 422 };

export class DomainError extends Error {
  readonly body: TApiError;

  constructor(body: TApiError) {
    super(body.message);
    this.body = body;
  }
}

export const domainError = ({ statusCode, code, message, details }: TDomainErrorOptions) => new DomainError({ statusCode, code, message, details });
