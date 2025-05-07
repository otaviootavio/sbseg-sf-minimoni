import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ChannelService } from "../../services/channelService";
import { BlockchainService } from '../../services/blockchainService';
import {
  channelSuccessResponse,
  channelErrorResponse,
  transformChannelResponse,
  type ChannelSuccessResponse,
  type ChannelErrorResponse,
} from "../../schemas/channel";

const blockchainService = new BlockchainService();
const channelService = new ChannelService(prisma, blockchainService);
export const getChannelRouter = new OpenAPIHono();

// Get channel by ID route
const getChannelByIdRoute = createRoute({
  method: "get",
  path: "/channels/{id}",
  tags: ["Channels"],
  summary: "Get channel by ID",
  description: "Retrieves detailed information about a specific streaming channel",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: channelSuccessResponse,
        },
      },
      description: "Channel retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: channelErrorResponse,
        },
      },
      description: "Invalid channel ID",
    },
    404: {
      content: {
        "application/json": {
          schema: channelErrorResponse,
        },
      },
      description: "Channel not found",
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

getChannelRouter.openapi(getChannelByIdRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const channel = await channelService.findById(id);

    if (!channel) {
      const errorResponse: ChannelErrorResponse = {
        success: false,
        message: "Channel not found",
      };
      return c.json(errorResponse, 404);
    }

    const transformedChannel = transformChannelResponse(channel);
    const response: ChannelSuccessResponse = {
      success: true,
      data: transformedChannel,
    };

    return c.json(response, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ChannelErrorResponse = {
        success: false,
        message: "Invalid channel ID",
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

export default getChannelRouter;