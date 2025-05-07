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
export const channelPaymentsRouter = new OpenAPIHono();

// Get payments by channel route
const getPaymentsByChannelRoute = createRoute({
  method: "get",
  path: "/channels/{channelId}/payments",
  tags: ["Payments", "Channels"],
  summary: "List payments by channel",
  description: "Returns all payment transactions associated with a specific channel",
  request: {
    params: z.object({ channelId: z.string().uuid() }),
    query: paginationSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: paymentListResponse,
        },
      },
      description: "List of channel payments",
    },
    400: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "Invalid channel ID or pagination parameters",
    },
    404: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "Channel not found",
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

channelPaymentsRouter.openapi(getPaymentsByChannelRoute, async (c) => {
  try {
    const { channelId } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const result = await paymentService.findByChannel(channelId, page, limit);

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
        message: "Invalid channel ID or pagination parameters",
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

export default channelPaymentsRouter;
