import type { Request, RequestHandler } from "express";

declare function _exports(
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
): RequestHandler;
export = _exports;
