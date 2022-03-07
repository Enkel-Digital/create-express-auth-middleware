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
   * This middleware allows all users' requests with valid firebase auth tokens through.
   * Thus business logics need to handle extra conditions locally. E.g. user can only request for their own data.
   */
  return async function auth(req, res, next) {
    try {
      // If predicate returns true with the given request object,
      // user is authorized to access resource, thus call next middleware.
      // Predicate must return true or false, does not accept truthy values in place of true
      // Break out of this middleware and continue with the next one
      if ((await predicate(req)) === true) return next();

      // If token missing or token malformed, end the request in this middleware
      // 401 Missing auth token thus unauthorised
      authFailed(res, 401, "MISSING OR MALFORMED AUTH");
    } catch (error) {
      // If verifyIdToken method threw an error, end the request in this middleware
      // Generate the error message first before passing in the final string
      // 403 identity known but denied / failed authentication
      authFailed(res, 403, errorMessage(error));
    }
  };
};
