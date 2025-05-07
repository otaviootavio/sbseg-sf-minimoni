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
export const updateChannelRouter = new OpenAPIHono();

// Update channel route
const updateChannelRoute = createRoute({
  method: "put",
  path: "/channels/{id}",
  tags: ["Channels"],
  summary: "Update a channel",
  description: "Updates an existing streaming channel with new information",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: channelSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: channelSuccessResponse,
        },
      },
      description: "Channel updated successfully",
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

updateChannelRouter.openapi(updateChannelRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");

    const channel = await channelService.update(id, data);

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

    if (error instanceof Error && (error as any).code === "P2025") {
      const errorResponse: ChannelErrorResponse = {
        success: false,
        message: "Channel not found",
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

export default updateChannelRouter;