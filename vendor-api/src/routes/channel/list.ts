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
export const listChannelsRouter = new OpenAPIHono();

// Get all channels route
const getAllChannelsRoute = createRoute({
  method: "get",
  path: "/channels",
  tags: ["Channels"],
  summary: "List all channels",
  description: "Returns a paginated list of channels with optional filtering",
  request: {
    query: paginationSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: channelListResponse,
        },
      },
      description: "List of all channels",
    },
    400: {
      content: {
        "application/json": {
          schema: channelErrorResponse,
        },
      },
      description: "Invalid pagination parameters",
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

listChannelsRouter.openapi(getAllChannelsRoute, async (c) => {
  try {
    const { page, limit } = c.req.valid("query");
    const result = await channelService.findAll(page, limit);

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
        message: "Invalid pagination parameters",
      };
      return c.json(errorResponse, 400);
    }

    const errorResponse: ChannelErrorResponse = {
      success: false,
      message: "Internal server error",
    };
    return c.json(errorResponse, 500);
  }
});

export default listChannelsRouter;
