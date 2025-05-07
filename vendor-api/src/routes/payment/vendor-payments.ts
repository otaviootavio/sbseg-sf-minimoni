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
export const vendorPaymentsRouter = new OpenAPIHono();

// Get payments by vendor route
const getPaymentsByVendorRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}/payments",
  tags: ["Payments", "Vendors"],
  summary: "List payments by vendor",
  description: "Returns all payment transactions associated with a specific vendor",
  request: {
    params: z.object({ vendorId: z.string().uuid() }),
    query: paginationSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: paymentListResponse,
        },
      },
      description: "List of vendor payments",
    },
    400: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "Invalid vendor ID or pagination parameters",
    },
    404: {
      content: {
        "application/json": {
          schema: paymentErrorResponse,
        },
      },
      description: "Vendor not found",
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

vendorPaymentsRouter.openapi(getPaymentsByVendorRoute, async (c) => {
  try {
    const { vendorId } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const result = await paymentService.findByVendor(vendorId, page, limit);

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
        message: "Invalid vendor ID or pagination parameters",
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

export default vendorPaymentsRouter;
