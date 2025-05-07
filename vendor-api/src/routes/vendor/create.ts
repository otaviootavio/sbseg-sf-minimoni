import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { VendorService, VendorAlreadyExistsError } from "../../services/vendorService";
import {
  createVendorSchema,
  vendorSuccessResponse,
  vendorErrorResponse,
  transformVendorResponse,
  type VendorSuccessResponse,
  type VendorErrorResponse,
} from "../../schemas/vendor";

const vendorService = new VendorService(prisma);
export const createVendorRouter = new OpenAPIHono();

// Create vendor route
const createVendorRoute = createRoute({
  method: "post",
  path: "/vendors",
  tags: ["Vendors"],
  summary: "Create a new vendor",
  description: "Creates a new vendor with the provided information",
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createVendorSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: vendorSuccessResponse,
        },
      },
      description: "Vendor created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: vendorErrorResponse,
        },
      },
      description: "Authentication required",
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

createVendorRouter.openapi(createVendorRoute, async (c) => {
  try {
    const data = c.req.valid("json");
    const vendor = await vendorService.create(data);
    const transformedVendor = transformVendorResponse(vendor);

    const response: VendorSuccessResponse = {
      success: true,
      data: transformedVendor,
    };

    return c.json(response, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: VendorErrorResponse = {
        success: false,
        message: "Invalid input data",
      };
      return c.json(errorResponse, 400);
    }

    if (error instanceof VendorAlreadyExistsError) {
      const errorResponse: VendorErrorResponse = {
        success: false,
        message: error.message,
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

export default createVendorRouter;
