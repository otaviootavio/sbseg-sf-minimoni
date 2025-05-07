import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { VendorService } from "../../services/vendorService";
import { paginationSchema } from "../../schemas/base";
import {
  vendorListResponse,
  vendorErrorResponse,
  transformVendorResponse,
  type VendorListResponse,
  type VendorErrorResponse,
} from "../../schemas/vendor";

const vendorService = new VendorService(prisma);
export const listVendorsRouter = new OpenAPIHono();

// Get all vendors route
const getAllVendorsRoute = createRoute({
  method: "get",
  path: "/vendors",
  tags: ["Vendors"],
  summary: "List all vendors",
  description: "Returns a paginated list of vendors with optional filtering",
  request: {
    query: paginationSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: vendorListResponse,
        },
      },
      description: "List of all vendors",
    },
    400: {
      content: {
        "application/json": {
          schema: vendorErrorResponse,
        },
      },
      description: "Invalid pagination parameters",
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

listVendorsRouter.openapi(getAllVendorsRoute, async (c) => {
  try {
    const { page, limit } = c.req.valid("query");
    const result = await vendorService.findAll(page, limit);

    const response: VendorListResponse = {
      success: true,
      data: result.vendors.map(transformVendorResponse),
      pagination: result.pagination,
    };

    return c.json(response, 200);
  } catch (error) {
    let errorResponse: VendorErrorResponse;

    if (error instanceof z.ZodError) {
      errorResponse = {
        success: false,
        message: "Invalid pagination parameters",
      };
      return c.json(errorResponse, 400);
    }

    errorResponse = {
      success: false,
      message: "Internal server error",
    };

    return c.json(errorResponse, 500);
  }
});

export default listVendorsRouter;