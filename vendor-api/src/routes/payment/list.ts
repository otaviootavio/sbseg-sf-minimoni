import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { PaymentService } from "../../services/paymentService";
import { paginationSchema } from "../../schemas/base";
import {
  paymentListResponse,
  paymentErrorResponse,
  transformPaymentResponse,
  type PaymentListResponse,
  type PaymentErrorResponse,
} from "../../schemas/payment";

const paymentService = new PaymentService(prisma);
export const listPaymentsRouter = new OpenAPIHono();

// Get all payments route
const getAllPaymentsRoute = createRoute({
  method: "get",
  path: "/payments",
  tags: ["Payments"],
  summary: "List all payments",
  description: "Returns a paginated list of all payment transactions",
  request: {
    query: paginationSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: paymentListResponse,
        },
      },
      description: "List of all payments",
    },
    400: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "Invalid pagination parameters",
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

listPaymentsRouter.openapi(getAllPaymentsRoute, async (c) => {
  try {
    const { page, limit } = c.req.valid("query");
    const result = await paymentService.findAll(page, limit);

    const response: PaymentListResponse = {
      success: true,
      data: result.payments.map(transformPaymentResponse),
      pagination: result.pagination,
    };

    return c.json(response, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: PaymentErrorResponse = {
        success: false,
        message: "Invalid pagination parameters",
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

export default listPaymentsRouter;
