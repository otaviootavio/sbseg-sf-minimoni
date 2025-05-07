import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ChannelService } from "../../services/channelService";
import { BlockchainService } from '../../services/blockchainService';
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
export const createChannelRouter = new OpenAPIHono();

// Create channel route
const createChannelRoute = createRoute({
  method: "post",
  path: "/channels",
  tags: ["Channels"],
  summary: "Create a new channel",
  description: "Creates a new streaming channel with the provided information",
  request: {
    body: {
      content: {
        "application/json": {
          schema: channelSchema,
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

createChannelRouter.openapi(createChannelRoute, async (c) => {
  try {
    const data = c.req.valid("json");
    const channel = await channelService.create(data);
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

    const errorResponse: ChannelErrorResponse = {
      success: false,
      message: "Internal server error",
    };
    return c.json(errorResponse, 500);
  }
});

export default createChannelRouter;