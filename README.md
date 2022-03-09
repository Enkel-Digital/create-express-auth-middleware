# create-express-auth-middleware
Library to easily create Express JS authentication and authorization middlewares using predicate functions.  


## Installation
```shell
npm install create-express-auth-middleware
```


## Example
View [samples](./samples) folder for more specific examples

1. Make a API call from client, and include an Authorization header, e.g.
    ```
    Authorization: Bearer <your-client-token>
    ```

2. If an API call is made with a valid token, you can access the decoded token object from request
    ```js
    const app = require("express")();
    const { create_authn_middleware, create_authz_middleware } = require("create-express-auth-middleware");

    // Make all routes in this express app to be authentication protected.
    // Meaning all routes defined later can only be called if a valid JWT is provided.
    // This DOES NOT mean that routes are fully protected yet,
    // as you need to ensure users have sufficient permission to access APIs using authorization middleware.
    app.use(create_authn_middleware((req) => req.get("Authorization") === "some_JWT_Value"));

    // The actual route that requires both authentication and authorization to run.
    app.get(
        "/data/:userID",

        // Add authorization middleware to ensure users can only access their own data
        // Uses an imaginary decodeJWT function
        // Checks that the specified userID in the URL matches user's own userID value in their token.
        create_authz_middleware((req) => decodeJWT(req.get("Authorization")).userID === req.params.userID),

        // Uses an imaginary rate limiting function
        // If the function fails, the error object is returned,
        // The object can contain 'status' to override the error status code,
        // and can have a 'error' string to override the default error message
        create_authz_middleware((req) => isNotRateLimited(req) || { status: 429, error: "Too many requests" }),

        // This request handler will only run if both predicate above returns true!
        (req, res) => res.status(200).json({ data: "Protected user data" })
    );
    ```

3.  If authentication failed, you get a 401 code with the following response by default
    ```json
    { "ok": false, "error": "Authentication Failed" }
    ```

4.  If authorization failed, you get a 403 code with the following response by default
    ```json
    { "ok": false, "error": "Authorization Failed" }
    ```

The only difference between authentication middlewares and authorization middlewares is their error HTTP status codes and their default error responses as shown above.


## Using with Auth providers
Instead of building your own authentication and authorization backend, you can use auth providers like Firebase Auth, Okta, Auth0 to provide auth services and just use this library to create authentication and authorization middlewares built on top of their API.

Integrations available
- [Firebase Auth](https://github.com/Enkel-Digital/firebase-auth-express-middleware/)


## License and Author
This project is made available under MIT LICENSE and written by [JJ](https://github.com/Jaimeloeuf)