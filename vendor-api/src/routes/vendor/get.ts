import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { VendorService } from "../../services/vendorService";
import {
  getVendorParamsSchema,
  vendorSuccessResponse,
  vendorErrorResponse,
  transformVendorResponse,
  type VendorSuccessResponse,
  type VendorErrorResponse,
} from "../../schemas/vendor";

const vendorService = new VendorService(prisma);
export const getVendorRouter = new OpenAPIHono();

// Get vendor by ID route
const getVendorByIdRoute = createRoute({
  method: "get",
  path: "/vendors/{id}",
  tags: ["Vendors"],
  summary: "Get vendor by ID",
  description: "Retrieves detailed information for a specific vendor by its ID",
  request: {
    params: getVendorParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: vendorSuccessResponse,
        },
      },
      description: "Vendor retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: vendorErrorResponse,
        },
      },
      description: "Invalid vendor ID",
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

getVendorRouter.openapi(getVendorByIdRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const vendor = await vendorService.findById(id);

    if (!vendor) {
      const errorResponse: VendorErrorResponse = {
        success: false,
        message: "Vendor not found",
      };
      return c.json(errorResponse, 404);
    }

    const transformedVendor = transformVendorResponse(vendor);
    const response: VendorSuccessResponse = {
      success: true,
      data: transformedVendor,
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

    const errorResponse: VendorErrorResponse = {
      success: false,
      message: "Internal server error",
    };
    return c.json(errorResponse, 500);
  }
});

export default getVendorRouter;
