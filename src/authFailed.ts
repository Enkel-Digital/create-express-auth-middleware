import type { Response } from "express";

// Create function used to end request in this middleware and call error handler if any
export default function authFailed(
  res: Response,
  status: number,
  error: string,
  errorJSON?: object,
  errorHandler?: (err: { error: string; [key: string]: any }) => any
) {
  const resObj = {
    error,

    // No need to set ok: false as this is the default value in errorJSON

    // Use the error json passed by user
    // Use this after the standard keys so that user's error JSON can override it
    ...errorJSON,
  };

  res.status(status).json(resObj);

  // @todo errorMessage function CANNOT BE ASYNCHRONOUS
  // @todo Cannot throw!! If fn throws then it will crash the express app
  // Run user's custom error handler if any
  // if (errorHandler) errorHandler(resObj).catch(console.error);
  if (errorHandler) errorHandler(resObj);
}
