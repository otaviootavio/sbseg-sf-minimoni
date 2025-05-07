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
export const senderChannelsRouter = new OpenAPIHono();

// Get channels by sender route
const getChannelsBySenderRoute = createRoute({
  method: "get",
  path: "/senders/{sender}/channels",
  tags: ["Channels", "Senders"],
  summary: "List channels by sender",
  description: "Returns all channels associated with a specific sender address",
  request: {
    params: z.object({ sender: z.string() }),
    query: paginationSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: channelListResponse,
        },
      },
      description: "List of sender channels",
    },
    400: {
      content: {
        "application/json": {
          schema: channelErrorResponse,
        },
      },
      description: "Invalid sender address or pagination parameters",
    },
    404: {
      content: {
        "application/json": {
          schema: channelErrorResponse,
        },
      },
      description: "Sender not found",
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

senderChannelsRouter.openapi(getChannelsBySenderRoute, async (c) => {
  try {
    const { sender } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const result = await channelService.findBySender(sender, page, limit);

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
        message: "Invalid sender address or pagination parameters",
      };
      return c.json(errorResponse, 400);
    }

    if (error instanceof Error && error.message === "Sender not found") {
      const errorResponse: ChannelErrorResponse = {
        success: false,
        message: "Sender not found",
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

export default senderChannelsRouter;
