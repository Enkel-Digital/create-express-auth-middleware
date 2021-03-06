import type { Request, Response, RequestHandler } from "express";

/**
 * Namespace and interface declared in global scope for plugins/users to override,
 * so that they can properly type their API request objects.
 */
declare global {
  export namespace ExpressAuthMiddleware {
    /**
     * Empty interface that extends Request, for users to extend this again through
     * TS declaration merging, without having to modify the Request type directly.
     */
    export interface DefaultRequestType extends Request {}
  }
}

/**
 * Create function used to end request in this middleware and call error handler if any
 */
function authFailed(
  res: Response,
  status: number,
  error: string,
  errorJSON?: object,
  errorHandler?: (err: { error: string; [key: string]: any }) => any
) {
  // Spread errorJSON in after error, so that user's error object can override if needed
  const resObj = { error, ...errorJSON };

  res.status(status).json(resObj);

  // Run user's custom error handler if any
  if (errorHandler)
    // STUPIDLY EXTRA WRAPPER code to ensure that if errorHandler throws an error, it will be caught and logged
    // The extra stuff is to accommodate for the fact that errorHandler can be either sync or async
    //
    // Alternative for no-op on errors
    // try {
    //   Promise.resolve(errorHandler(resObj)).catch(() => {});
    // } catch {}
    try {
      Promise.resolve(errorHandler(resObj)).catch(console.error);
    } catch (e) {
      console.error(e);
    }
}

/**
 * Function to create the factory function itself,
 * because the code between authn and authz factory are basically the same,
 * with only the 2 params stated below being different.
 *
 * So instead of duplicating the code twice, just reuse the same things using this function.
 *
 * @param defaultErrorMsg The default error message sent back to client on any auth errors
 * @param authFailedStatus The status code of a request that failed/errored out in its authentication or authorization predicate
 * @returns Factory functions to create express RequestHandler middlewares
 */
export const create_factory =
  <
    DefaultRequestType extends Request = ExpressAuthMiddleware.DefaultRequestType
  >(
    // The default error message is Auth Failed instead of Authn or Authz as it could be either
    defaultErrorMsg: string = "Auth Failed",
    // The default status code is 400 to indicate client error rather than 401 or 403
    authFailedStatus: number = 400
  ) =>
  /**
   * Factory function to create an auth middleware
   *
   * @template CustomRequestType Type variable to extend express.Request passed to predicate function
   * @param predicate User provided predicate used to check if user is authenticated or authorized
   * @param options Entirely optional parameters to override default values, generally unused
   * @param options.errorJSON A default JSON response for all error JSON responses spread in. E.g. Useful if you want a failed auth response to be { success:false } instead of the default { ok:false }
   * @param options.errorMessage This is a function used to generate a error string from Errors that are thrown
   * @param options.errorHandler Custom error handler to deal with every auth failure, e.g. log to APM service
   * @returns An express RequestHandler middleware function
   */
  <CustomRequestType extends Request = DefaultRequestType>(
    // Use generics to let caller insert a different Request type that extends on the original express.Request type
    // E.g. Useful for when user wants to attach a JWT or something to the request object and still have it typed correctly
    predicate: (req: CustomRequestType) => any,

    {
      errorJSON = { ok: false },
      errorMessage = (err: Error) => err.message || defaultErrorMsg,
      errorHandler,
    }: {
      errorJSON?: object;
      errorMessage?: (err: Error) => string;
      errorHandler?: (err: { error: string; [key: string]: any }) => any;
    } = {}
  ): RequestHandler =>
  /**
   * Apply this middleware to protected routes that require authentication or authorization.
   * This middleware allows all users' requests that passes the predicate through.
   *
   * Applying Promise.resolve on predicate's return value to turn return type to Promise<T>
   * As the predicate may be a synchronous function and return a value that is not thenable.
   *
   * If predicate returns true, call next middleware as user is authenticated / authorized.
   * Predicate must return the boolean true as truthy values are not accepted.
   *
   * If predicate failed or an error is thrown, end request in this middleware instead of
   * relying on a 500 middleware, as not every application includes a 500 error middleware.
   *
   * If an error is thrown, generate error message first before passing in the returned string.
   */
  async (req, res, next) =>
    Promise.resolve(predicate(req as CustomRequestType))
      .then((result) =>
        result === true
          ? next()
          : authFailed(
              res,
              result?.status || authFailedStatus,
              result?.error || defaultErrorMsg,
              errorJSON,
              errorHandler
            )
      )
      .catch((error) =>
        authFailed(
          res,
          authFailedStatus,
          errorMessage(error),
          errorJSON,
          errorHandler
        )
      );
