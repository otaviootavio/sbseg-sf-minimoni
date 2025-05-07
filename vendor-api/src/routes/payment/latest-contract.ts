import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { isAddress } from "viem";
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
export const latestContractPaymentRouter = new OpenAPIHono();

// Get latest payment by smart contract address route
const getLatestPaymentByContractRoute = createRoute({
  method: "get",
  path: "/payments/contract/{smartContractAddress}/latest",
  tags: ["Payments"],
  summary: "Get latest payment by smart contract",
  description: "Retrieves the most recent payment transaction for a specific smart contract address",
  request: {
    params: z.object({
      smartContractAddress: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: paymentSuccessResponse,
        },
      },
      description: "Latest payment retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "Invalid smart contract address",
    },
    404: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "No payment found for the given smart contract",
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

latestContractPaymentRouter.openapi(
  getLatestPaymentByContractRoute,
  async (c) => {
    try {
      const { smartContractAddress } = c.req.valid("param");

      if (!isAddress(smartContractAddress)) {
        const errorResponse: PaymentErrorResponse = {
          success: false,
          message: "Invalid smart contract address",
        };
        return c.json(errorResponse, 400);
      }

      const payment =
        await paymentService.getLatestPaymentBySmartContractAddress(
          smartContractAddress
        );

      if (!payment) {
        const errorResponse: PaymentErrorResponse = {
          success: false,
          message: "No payment found for the given smart contract",
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
          message: "Invalid smart contract address",
        };
        return c.json(errorResponse, 400);
      }

      if (error instanceof Error && error.message === "Channel not found") {
        const errorResponse: PaymentErrorResponse = {
          success: false,
          message: "No payment found for the given smart contract",
        };
        return c.json(errorResponse, 404);
      }

      const errorResponse: PaymentErrorResponse = {
        success: false,
        message: "Internal server error",
      };
      return c.json(errorResponse, 500);
    }
  }
);

export default latestContractPaymentRouter;
