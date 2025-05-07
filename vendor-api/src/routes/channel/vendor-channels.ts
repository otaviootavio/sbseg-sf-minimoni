import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ChannelService } from "../../services/channelService";
import { BlockchainService } from "../../services/blockchainService";
import { paginationSchema } from "../../schemas/base";
import {
  channelListResponse,
  channelErrorResponse,
  transformChannelResponse,
  type ChannelListResponse,
  type ChannelErrorResponse,
} from "../../schemas/channel";

const blockchainService = new BlockchainService();
const channelService = new ChannelService(prisma, blockchainService);
export const vendorChannelsRouter = new OpenAPIHono();

// Get channels by vendor route
const getChannelsByVendorRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}/channels",
  tags: ["Channels", "Vendors"],
  summary: "List channels by vendor",
  description: "Returns all channels associated with a specific vendor",
  request: {
    params: z.object({ vendorId: z.string().uuid() }),
    query: paginationSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: channelListResponse,
        },
      },
      description: "List of vendor channels",
    },
    400: {
      content: {
        "application/json": {
          schema: channelErrorResponse,
        },
      },
      description: "Invalid vendor ID or pagination parameters",
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

vendorChannelsRouter.openapi(getChannelsByVendorRoute, async (c) => {
  try {
    const { vendorId } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const result = await channelService.findByVendor(vendorId, page, limit);

    const response: ChannelListResponse = {
      success: true,
      data: result.channels.map(transformChannelResponse),
      pagination: result.pagination,
    };

    return c.json(response, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ChannelErrorResponse = {
        success: false,
        message: "Invalid vendor ID or pagination parameters",
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

    const errorResponse: ChannelErrorResponse = {
      success: false,
      message: "Internal server error",
    };
    return c.json(errorResponse, 500);
  }
});

export default vendorChannelsRouter;
