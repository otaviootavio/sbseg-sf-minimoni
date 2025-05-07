import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { VendorService } from "../../services/vendorService";
import {
  getVendorParamsSchema,
  updateVendorSchema,
  vendorSuccessResponse,
  vendorErrorResponse,
  transformVendorResponse,
  type VendorSuccessResponse,
  type VendorErrorResponse,
} from "../../schemas/vendor";

const vendorService = new VendorService(prisma);
export const updateVendorRouter = new OpenAPIHono();

// Update vendor route
const updateVendorRoute = createRoute({
  method: "put",
  path: "/vendors/{id}",
  tags: ["Vendors"],
  summary: "Update a vendor",
  description: "Updates an existing vendor with the provided information",
  security: [{ BearerAuth: [] }],
  request: {
    params: getVendorParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: updateVendorSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: vendorSuccessResponse,
        },
      },
      description: "Vendor updated successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: vendorErrorResponse,
        },
      },
      description: "Invalid input data",
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

updateVendorRouter.openapi(updateVendorRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");

    const vendor = await vendorService.update(id, data);

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
        message: "Invalid input data",
      };
      return c.json(errorResponse, 400);
    }

    if (error instanceof Error && error.message.includes("not found")) {
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

export default updateVendorRouter;
