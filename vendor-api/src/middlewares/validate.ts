import { Context, MiddlewareHandler } from "hono";
import { z } from "zod";

export const validate = (schema: z.ZodSchema): MiddlewareHandler => {
  return async (c: Context, next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      c.set("validatedBody", validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            success: false,
            message: "Validation error",
            errors: error.errors.map((e) => ({
              path: e.path,
              message: e.message,
            })),
          },
          400
        );
      }
      throw error;
    }
  };
};
