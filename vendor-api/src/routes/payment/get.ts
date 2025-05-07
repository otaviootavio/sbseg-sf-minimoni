import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { PaymentService } from "../../services/paymentService";
import {
  paymentSuccessResponse,
  paymentErrorResponse,
  transformPaymentResponse,
  type PaymentSuccessResponse,
  type PaymentErrorResponse,
} from "../../schemas/payment";

const paymentService = new PaymentService(prisma);
export const getPaymentRouter = new OpenAPIHono();

// Get payment by ID route
const getPaymentByIdRoute = createRoute({
  method: "get",
  path: "/payments/{id}",
  tags: ["Payments"],
  summary: "Get payment by ID",
  description: "Retrieves detailed information about a specific payment transaction",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: paymentSuccessResponse,
        },
      },
      description: "Payment retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "Invalid payment ID",
    },
    404: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "Payment not found",
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

getPaymentRouter.openapi(getPaymentByIdRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const payment = await paymentService.findById(id);

    if (!payment) {
      const errorResponse: PaymentErrorResponse = {
        success: false,
        message: "Payment not found",
      };
      return c.json(errorResponse, 404);
    }

    const transformedPayment = transformPaymentResponse(payment);
    const response: PaymentSuccessResponse = {
      success: true,
      data: transformedPayment,
    };

    return c.json(response, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: PaymentErrorResponse = {
        success: false,
        message: "Invalid payment ID",
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

export default getPaymentRouter;
