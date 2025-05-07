import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { PaymentService } from "../../services/paymentService";
import {
  createPaymentSchema,
  paymentSuccessResponse,
  paymentErrorResponse,
  transformPaymentResponse,
  type PaymentSuccessResponse,
  type PaymentErrorResponse,
} from "../../schemas/payment";

const paymentService = new PaymentService(prisma);
export const createPaymentRouter = new OpenAPIHono();

// Create payment route
const createPaymentRoute = createRoute({
  method: "post",
  path: "/payments",
  tags: ["Payments"],
  summary: "Create a new payment",
  description: "Records a new payment transaction for a channel or vendor",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createPaymentSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: paymentSuccessResponse,
        },
      },
      description: "Payment created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "Invalid input data",
    },
    404: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "Vendor or channel not found",
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

createPaymentRouter.openapi(createPaymentRoute, async (c) => {
  try {
    const data = c.req.valid("json");
    const payment = await paymentService.create(data);
    const transformedPayment = transformPaymentResponse(payment);

    const response: PaymentSuccessResponse = {
      success: true,
      data: transformedPayment,
    };

    return c.json(response, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: PaymentErrorResponse = {
        success: false,
        message: "Invalid input data",
      };
      return c.json(errorResponse, 400);
    }

    if (error instanceof Error) {
      if (
        error.message === "Vendor not found" ||
        error.message === "Channel not found"
      ) {
        const errorResponse: PaymentErrorResponse = {
          success: false,
          message: error.message,
        };
        return c.json(errorResponse, 404);
      }

      if (error.message === "Hash has already been used") {
        const errorResponse: PaymentErrorResponse = {
          success: false,
          message: error.message,
        };
        return c.json(errorResponse, 400);
      }
    }

    const errorResponse: PaymentErrorResponse = {
      success: false,
      message: "Internal server error",
    };
    return c.json(errorResponse, 500);
  }
});

export default createPaymentRouter;
