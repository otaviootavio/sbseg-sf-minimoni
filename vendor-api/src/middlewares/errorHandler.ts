import { Context } from "hono";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export const errorHandler = (err: unknown, c: Context) => {
  console.error("Error details:", err);

  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        message: "Validation error",
        errors: err.errors.map((e) => ({
          path: e.path,
          message: e.message,
        })),
      },
      400
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    switch (err.code) {
      case "P2002": // Unique constraint violation
        return c.json(
          {
            success: false,
            message: "A record with this value already exists",
          },
          409
        );
      case "P2025": // Record not found
        return c.json(
          {
            success: false,
            message: "Record not found",
          },
          404
        );
      default:
        return c.json(
          {
            success: false,
            message: "Database error",
          },
          500
        );
    }
  }

  // Default error response
  return c.json(
    {
      success: false,
      message: "Internal server error",
    },
    500
  );
};
