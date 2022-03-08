import { create_factory } from "./auth";

/**
 * Factory function to create Authentication middlewares
 *
 * Using 401 Unauthorized for failed auth status code.
 * Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated".
 * That is, the client must authenticate itself to get the requested response.
 */
export const create_authn_middleware = create_factory(
  "Authentication Failed",
  401
);
