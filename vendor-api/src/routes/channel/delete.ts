import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ChannelService } from "../../services/channelService";
import { BlockchainService } from '../../services/blockchainService';
import {
  channelErrorResponse,
  channelDeleteSuccessResponse,
  type ChannelErrorResponse,
} from "../../schemas/channel";

const blockchainService = new BlockchainService();
const channelService = new ChannelService(prisma, blockchainService);
export const deleteChannelRouter = new OpenAPIHono();

// Delete channel route
const deleteChannelRoute = createRoute({
  method: "delete",
  path: "/channels/{id}",
  tags: ["Channels"],
  summary: "Delete a channel",
  description: "Permanently removes a streaming channel from the system",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: channelDeleteSuccessResponse,
        },
      },
      description: "Channel deleted successfully",
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

deleteChannelRouter.openapi(deleteChannelRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    await channelService.delete(id);

    const response = channelDeleteSuccessResponse.parse({
      success: true as const,
      message: "Channel deleted successfully",
    });

    return c.json(response, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ChannelErrorResponse = {
        success: false,
        message: "Invalid channel ID",
      };
      return c.json(errorResponse, 400);
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

export default deleteChannelRouter;