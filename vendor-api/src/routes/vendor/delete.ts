import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { VendorService } from "../../services/vendorService";
import {
  getVendorParamsSchema,
  vendorErrorResponse,
  type VendorErrorResponse,
} from "../../schemas/vendor";

const vendorService = new VendorService(prisma);
export const deleteVendorRouter = new OpenAPIHono();

// Define success response schema for delete operation
const vendorDeleteSuccessResponse = z.object({
  success: z.literal(true),
  message: z.string(),
});

type VendorDeleteSuccessResponse = z.infer<typeof vendorDeleteSuccessResponse>;

// Delete vendor route
const deleteVendorRoute = createRoute({
  method: "delete",
  path: "/vendors/{id}",
  tags: ["Vendors"],
  summary: "Delete a vendor",
  description: "Permanently removes a vendor from the system",
  security: [{ BearerAuth: [] }],
  request: {
    params: getVendorParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: vendorDeleteSuccessResponse,
        },
      },
      description: "Vendor deleted successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: vendorErrorResponse,
        },
      },
      description: "Invalid vendor ID",
    },
    401: {
      content: {
        "application/json": {
          schema: vendorErrorResponse,
        },
      },
      description: "Authentication required",
    },
    404: {
      content: {
        "application/json": {
          schema: vendorErrorResponse,
        },
      },
      description: "Vendor not found",
    },
    500: {
      content: {
        "application/json": {
          schema: vendorErrorResponse,
        },
      },
      description: "Internal server error",
    },
  },
});

deleteVendorRouter.openapi(deleteVendorRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    await vendorService.delete(id);

    const response: VendorDeleteSuccessResponse = {
      success: true,
      message: "Vendor deleted successfully",
    };

    return c.json(response, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: VendorErrorResponse = {
        success: false,
        message: "Invalid vendor ID",
      };
      return c.json(errorResponse, 400);
    }

    // Handle Prisma errors for record not found
    if (error instanceof Error && (error as any).code === "P2025") {
      const errorResponse: VendorErrorResponse = {
        success: false,
        message: "Vendor not found",
      };
      return c.json(errorResponse, 404);
    }

    const errorResponse: VendorErrorResponse = {
      success: false,
      message: "Internal server error",
    };
    return c.json(errorResponse, 500);
  }
});

export default deleteVendorRouter;
