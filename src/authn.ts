/**
 * Authentication middleware
 *
 * Will end connection in this middleware if there is an error instead of relying on a 500 middleware,
 * as not every application includes a 500 error middleware.
 */

import type { Request, Response, RequestHandler } from "express";

/**
 * Factory function to create an authentication middleware
 *
 * @param predicate User provided predicate used to check if user is authenticated
 * @param options Entirely optional parameters to override default values, generally unused
 * @param options.errorJSON A default JSON response for all error JSON responses spread in. E.g. Useful if you want a failed auth response to be { success:false } instead of the default { ok:false }
 * @param options.errorMessage This is a function used to generate a error string from Errors that are thrown
 * @param options.errorHandler Custom error handler to deal with every auth failure, e.g. log to APM service
 * @returns An express RequestHandler middleware function
 */
export function create_authn_middleware(
  predicate: (req: Request) => any,

  {
    errorJSON = { ok: false },
    errorMessage = (err: Error) => err.message || "UNAUTHENTICATED",
    errorHandler,
  }: {
    errorJSON?: object;
    errorMessage?: (err: Error) => string;
    errorHandler?: (err: { error: string; [key: string]: any }) => any;
  } = {}
): RequestHandler {
  // Create function used to end request in this middleware and call error handler if any
  function authFailed(res: Response, status: number, error: string) {
    const resObj = {
      error,

      // No need to set ok: false as this is the default value in errorJSON

      // Use the error json passed by user
      // Use this after the standard keys so that user's error JSON can override it
      ...errorJSON,
    };

    res.status(status).json(resObj);

    // @todo errorMessage function CANNOT BE ASYNCHRONOUS... and it cannot throw!! If the fn throws then it will crash the express app
    // Run user's custom error handler if any
    if (errorHandler) errorHandler(resObj);
  }

  /**
   * Apply this middleware to protected routes that require authentication.
   * This middleware allows all users' requests that passes the predicate through.
   *
   * Applying Promise.resolve on predicate's return value to turn return type to Promise<T>
   * As the predicate may be a synchronous function and return a value that is not thenable
   *
   * If predicate returns true with the request object, call next middleware as user is authenticated.
   * Predicate must return true if passes authentication as truthy values are not accepted.
   *
   * If predicate failed or an error is thrown, end the request in this middleware.
   * If an error is thrown, generate error message first before passing in the final string.
   */
  return async (req, res, next) =>
    Promise.resolve(predicate(req))
      .then((result) =>
        result === true ? next() : authFailed(res, 401, "Authentication Failed")
      )
      // 403 identity known but authentication failed or is denied
      .catch((error) => authFailed(res, 403, errorMessage(error)));
}
