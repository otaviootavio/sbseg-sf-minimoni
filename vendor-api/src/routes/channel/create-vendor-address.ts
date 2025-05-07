import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ChannelService } from "../../services/channelService";
import { BlockchainService } from '../../services/blockchainService';
import { isAddress } from "viem";
import {
  channelSchema,
  channelSuccessResponse,
  channelErrorResponse,
  transformChannelResponse,
  type ChannelSuccessResponse,
  type ChannelErrorResponse,
} from "../../schemas/channel";

const blockchainService = new BlockchainService();
const channelService = new ChannelService(prisma, blockchainService);
export const createChannelByVendorAddressRouter = new OpenAPIHono();

// Extend the channel schema to use vendorAddress instead of vendorId
const createChannelByVendorAddressSchema = channelSchema.omit({ vendorId: true }).extend({
  vendorAddress: z
    .string()
    .trim()
    .refine((addr) => isAddress(addr), {
      message: "Invalid Ethereum address",
    })
    .describe("Ethereum address of the vendor"),
});

// Create channel by vendor address route
const createChannelByVendorAddressRoute = createRoute({
  method: "post",
  path: "/channels/by-vendor-address",
  tags: ["Channels"],
  summary: "Create a new channel by vendor address",
  description: "Creates a new streaming channel using the vendor's blockchain address",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createChannelByVendorAddressSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: channelSuccessResponse,
        },
      },
      description: "Channel created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: channelErrorResponse,
        },
      },
      description: "Invalid input data",
    },
    404: {
      content: {
        "application/json": {
          schema: channelErrorResponse,
        },
      },
      description: "Vendor not found",
    },
    500: {
      content: {
        "application/json": {
          schema: channelErrorResponse,
        },
      },
      description: "Internal server error",
    },
  },
});

createChannelByVendorAddressRouter.openapi(createChannelByVendorAddressRoute, async (c) => {
  try {
    const data = c.req.valid("json");
    
    // First, find the vendor by address
    const vendor = await prisma.vendor.findFirst({
      where: {
        address: data.vendorAddress
      }
    });

    if (!vendor) {
      const errorResponse: ChannelErrorResponse = {
        success: false,
        message: "Vendor not found with the provided address",
      };
      return c.json(errorResponse, 404);
    }

    // Use the vendor's ID to create the channel
    const channelData = {
      ...data,
      vendorId: vendor.id,
    };

    // Remove vendorAddress since it's not part of the channel schema
    delete (channelData as any).vendorAddress;

    const channel = await channelService.create(channelData);
    const transformedChannel = transformChannelResponse(channel);

    const response: ChannelSuccessResponse = {
      success: true,
      data: transformedChannel,
    };

    return c.json(response, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ChannelErrorResponse = {
        success: false,
        message: "Invalid input data",
      };
      return c.json(errorResponse, 400);
    }

    if (error instanceof Error && error.message === "Vendor not found") {
      const errorResponse: ChannelErrorResponse = {
        success: false,
        message: "Vendor not found",
      };
      return c.json(errorResponse, 404);
    }

    console.error("Error creating channel by vendor address:", error);
    const errorResponse: ChannelErrorResponse = {
      success: false,
      message: "Internal server error",
    };
    return c.json(errorResponse, 500);
  }
});

export default createChannelByVendorAddressRouter; 