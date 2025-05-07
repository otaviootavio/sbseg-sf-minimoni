import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { isAddress } from "viem";
import { prisma } from "../../lib/prisma";
import { VendorService } from "../../services/vendorService";
import {
  vendorSuccessResponse,
  vendorErrorResponse,
  transformVendorResponse,
  type VendorSuccessResponse,
  type VendorErrorResponse,
} from "../../schemas/vendor";

const vendorService = new VendorService(prisma);
export const getVendorByAddressRouter = new OpenAPIHono();

// Get vendor by Address route
const getVendorByAddressRoute = createRoute({
  method: "get",
  path: "/vendors/by-address/{address}",
  tags: ["Vendors"],
  summary: "Get vendor by address",
  description: "Retrieves vendor information using their blockchain address",
  request: {
    params: z.object({
      address: z
        .string()
        .trim()
        .refine((addr) => isAddress(addr), {
          message: "Invalid Ethereum address",
        }),
    }),
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
      description: "Invalid vendor address",
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

getVendorByAddressRouter.openapi(getVendorByAddressRoute, async (c) => {
  try {
    const { address } = c.req.valid("param");
    const vendor = await vendorService.findByAddress(address);

    if (!vendor) {
      const errorResponse: VendorErrorResponse = {
        success: false,
        message: "Vendor not found with the provided address",
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
        message: "Invalid vendor address",
      };
      return c.json(errorResponse, 400);
    }

    console.error("Error fetching vendor by address:", error);
    const errorResponse: VendorErrorResponse = {
      success: false,
      message: "Internal server error",
    };
    return c.json(errorResponse, 500);
  }
});

export default getVendorByAddressRouter; 