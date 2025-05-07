import { OpenAPIHono } from "@hono/zod-openapi";
import closeChannelRouter from "./close";
import createChannelRouter from "./create";
import createChannelByVendorAddressRouter from "./create-vendor-address";
import getChannelRouter from "./get";
import updateChannelRouter from "./update";
import deleteChannelRouter from "./delete";
import listChannelsRouter from "./list";
import vendorChannelsRouter from "./vendor-channels";
import senderChannelsRouter from "./sender-channels";
import { authMiddleware } from "../../middlewares/authMiddleware";

export const channelRouter = new OpenAPIHono();

// Register security scheme at the channel router level
channelRouter.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "API Token", 
  description: "Enter your API token (required for POST, PUT, DELETE operations)"
});

// GET routes don't use authentication middleware
channelRouter.route("/", getChannelRouter);
channelRouter.route("/", listChannelsRouter);
channelRouter.route("/", vendorChannelsRouter);
channelRouter.route("/", senderChannelsRouter);

// The user can create a channel without authentication
channelRouter.route("/", createChannelRouter);
channelRouter.route("/", createChannelByVendorAddressRouter);


// Non-GET routes use authentication middleware
channelRouter.use("/", authMiddleware);
channelRouter.route("/", updateChannelRouter);
channelRouter.route("/", deleteChannelRouter);
channelRouter.route("/", closeChannelRouter);

// Global error handling
channelRouter.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "Route not found",
    },
    404
  );
});

channelRouter.onError((err, c) => {
  console.error("Server error:", err);
  return c.json(
    {
      success: false,
      message: "Internal server error",
    },
    500
  );
});

export default channelRouter;
