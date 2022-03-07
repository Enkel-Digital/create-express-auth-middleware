/**
 * Authentication middleware
 *
 * Will end connection in this middleware if there is an error instead of relying on a 500 middleware,
 * as not every application includes a 500 error middleware.
 */

// Factory function to setup the middleware
module.exports = function setup(
  predicate,
  {
    errorJSON = { ok: false },
    errorMessage = (errorObject) => errorObject.message || "UNAUTHORIZED",

    // Allow users to pass in an error handler to deal with every error, for example to log to APM service
    // The object sent back to client on error will also be passed into this function if provided
    errorHandler,
  } = {} // Last argument is optional
) {
  // Assume that it can only be a string or function
  if (typeof errorMessage !== "function")
    if (typeof errorMessage === "string") errorMessage = () => errorMessage;
    else
      throw new Error("Only Functions or Strings are allowed for errorMessage");

  // Create function used to end request in this middleware and call error handler if any
  function authFailed(res, status, error) {
    res.status(status).json({
      error,

      // No need to set ok: false as this is the default value in errorJSON

      // Use the error json passed by user
      // Use this after the standard keys so that user's error JSON can override it
      ...errorJSON,
    });

    // @todo errorMessage function CANNOT BE ASYNCHRONOUS... and it cannot throw!! If the fn throws then it will crash the express app
    // Run user's custom error handler if any
    if (errorHandler) {
      // Set status onto object too so that user's error handler can have access to it
      resObj.status = status;
      errorHandler(resObj);
    }
  }

  /**
   * Apply this middleware to protected routes that require authentication.
   * This middleware allows all users' requests that passes the predicate through.
   *
   * If predicate returns true with the request object, call next middleware as user is authenticated.
   * Predicate must return true if passes authentication as truthy values are not accepted.
   *
   * If predicate failed or an error is thrown, end the request in this middleware.
   * If an error is thrown, generate error message first before passing in the final string.
   */
  return async (req, res, next) =>
    predicate(req)
      .then((result) =>
        result === true ? next() : authFailed(res, 401, "Authentication Failed")
      )
      // 403 identity known but authentication failed or is denied
      .catch((error) => authFailed(res, 403, errorMessage(error)));
};
