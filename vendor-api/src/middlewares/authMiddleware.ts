import { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Authentication middleware that checks for a valid bearer token
 * This middleware is applied only to routes that require authentication (POST, PUT, DELETE)
 * while GET routes remain public
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  // The API token should be stored in process.env.ADMIN_API_KEY
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
  
  if (!ADMIN_API_KEY) {
    console.error("ADMIN_API_KEY is not configured in environment variables");
    throw new HTTPException(500, { message: "Server configuration error" });
  }

  // Get the authorization header
  const authHeader = c.req.header("Authorization");
  
  if (!authHeader) {
    return c.json(
      {
        success: false,
        message: "Authentication required",
      },
      401
    );
  }

  // Check if it's a bearer token and verify it
  const [authType, token] = authHeader.split(" ");
  
  if (authType !== "Bearer" || !token) {
    return c.json(
      {
        success: false,
        message: "Invalid authentication format",
      },
      401
    );
  }

  // Verify token
  if (token !== ADMIN_API_KEY) {
    return c.json(
      {
        success: false,
        message: "Invalid authentication token",
      },
      401
    );
  }

  // Token is valid, proceed to the route handler
  await next();
}; 