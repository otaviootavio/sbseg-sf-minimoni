import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { BlockchainService } from "../../services/blockchainService";
import { ChannelService } from "../../services/channelService";
import {
  channelSuccessResponse,
  channelErrorResponse,
  transformChannelResponse,
  type ChannelSuccessResponse,
  type ChannelErrorResponse,
} from "../../schemas/channel";

const blockchainService = new BlockchainService();
const channelService = new ChannelService(prisma, blockchainService);
export const closeChannelRouter = new OpenAPIHono();

// Close channel route
const closeChannelRoute = createRoute({
  method: "post",
  path: "/channels/{channelId}/close",
  tags: ["Channels"],
  summary: "Close a channel",
  description: "Finalizes a streaming channel and marks it as closed, with optional settlement transaction",
  request: {
    params: z.object({
      channelId: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            settlementTx: z
              .string()
              .optional()
              .describe("Optional settlement transaction hash"),
          }),
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
      description: "Channel closed successfully",
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
    409: {
      content: {
        "application/json": {
          schema: channelErrorResponse,
        },
      },
      description: "Channel is already closed",
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

closeChannelRouter.openapi(closeChannelRoute, async (c) => {
  try {
    const { channelId } = c.req.valid("param");
    const { settlementTx } = c.req.valid("json");

    // First check if channel exists and is not already closed
    const existingChannel = await channelService.findById(channelId);

    if (!existingChannel) {
      const errorResponse: ChannelErrorResponse = {
        success: false,
        message: "Channel not found",
      };
      return c.json(errorResponse, 404);
    }

    if (existingChannel.status === "CLOSED") {
      const errorResponse: ChannelErrorResponse = {
        success: false,
        message: "Channel is already closed",
      };
      return c.json(errorResponse, 409);
    }

    // Update channel with closed status and metadata
    const updatedChannel = await channelService.update(channelId, {
      status: "CLOSED",
      closedAt: new Date(),
      settlementTx: settlementTx,
    });

    const transformedChannel = transformChannelResponse(updatedChannel);
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

    if (error instanceof Error && (error as any).code === "P2025") {
      const errorResponse: ChannelErrorResponse = {
        success: false,
        message: "Channel not found",
      };
      return c.json(errorResponse, 404);
    }

    console.error("Error closing channel:", error);
    const errorResponse: ChannelErrorResponse = {
      success: false,
      message: "Internal server error",
    };
    return c.json(errorResponse, 500);
  }
});

export default closeChannelRouter;
