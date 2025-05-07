import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { PaymentService } from "../../services/paymentService";
import {
  paymentErrorResponse,
  type PaymentErrorResponse,
} from "../../schemas/payment";

const paymentService = new PaymentService(prisma);
export const verifyHashRouter = new OpenAPIHono();

// Define success response schema for hash verification
const verifyHashSuccessResponse = z.object({
  success: z.literal(true),
  isValid: z.boolean(),
  message: z.string(),
});

type VerifyHashSuccessResponse = z.infer<typeof verifyHashSuccessResponse>;

// Verify hash route
const verifyHashRoute = createRoute({
  method: "post",
  path: "/payments/verify",
  tags: ["Payments"],
  summary: "Verify payment hash",
  description: "Checks if a payment hash is valid and hasn't been used before",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            hash: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: verifyHashSuccessResponse,
        },
      },
      description: "Hash verification result",
    },
    400: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "Invalid input data",
    },
    500: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "Internal server error",
    },
  },
});

verifyHashRouter.openapi(verifyHashRoute, async (c) => {
  try {
    const { hash } = c.req.valid("json");
    const isValid = await paymentService.verifyHash(hash);

    const response: VerifyHashSuccessResponse = {
      success: true,
      isValid,
      message: isValid ? "Hash is valid and has not been used" : "Hash has already been used",
    };

    return c.json(response, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: PaymentErrorResponse = {
        success: false,
        message: "Invalid input data",
      };
      return c.json(errorResponse, 400);
    }

    const errorResponse: PaymentErrorResponse = {
      success: false,
      message: "Internal server error",
    };
    return c.json(errorResponse, 500);
  }
});

export default verifyHashRouter;
