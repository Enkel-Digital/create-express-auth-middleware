import type { Request, RequestHandler } from "express";

export const create_authn_middleware: (
  predicate: (req: Request) => boolean | Promise<boolean>,
  {
    errorJSON,
    errorMessage,
    errorHandler,
  }?: {
    errorJSON?: {
      ok: boolean;
    };
    errorMessage?: (errorObject: Error) => string;
    errorHandler: Function;
  }
) => RequestHandler;

export const create_authz_middleware: (
  predicate: (req: Request) => boolean | Promise<boolean>,
  {
    errorJSON,
    errorMessage,
    errorHandler,
  }?: {
    errorJSON?: {
      ok: boolean;
    };
    errorMessage?: (errorObject: Error) => string;
    errorHandler: Function;
  }
) => RequestHandler;
