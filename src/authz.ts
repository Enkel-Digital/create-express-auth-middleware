import { create_factory } from "./auth";

/**
 * Factory function to create Authorization middlewares
 *
 * Use this factory function to create middlewares for protected routes that require authorization.
 * The created middleware will allow all requests that passes the authorization predicate through.
 * Business logics to handle authorization like 'user can only request for own data',
 * should be written in the predicates for this factory function.
 *
 * Using 403 Forbidden
 * The client does not have access rights to the content; that is, it is unauthorized,
 * so the server is refusing to give the requested resource.
 * Unlike 401 Unauthorized, the client's identity is known to the server.
 */
export const create_authz_middleware = create_factory(
  "Authorization Failed",
  401
);
