import { OpenAPIHono } from "@hono/zod-openapi";
import vendorRouter from "./vendor";
import channelRouter from "./channel";
import paymentRouter from "./payment";
import hlsRouter from "./hls";

// Create main router
export const router = new OpenAPIHono();

// Mount all route groups
router.route("/api", vendorRouter);
router.route("/api", channelRouter);
router.route("/api", paymentRouter);
router.route("/", hlsRouter);

// OpenAPI documentation
router.doc("/docs", {
  openapi: "3.0.0",
  info: {
    title: "Vendor and Channel API",
    version: "1.0.0",
    description:
      "API for managing vendors, channels, payments, and HLS streams.",
  },
  tags: [
    { name: "Vendors", description: "Operations related to vendors" },
    { name: "Channels", description: "Operations related to channels" },
    { name: "Payments", description: "Operations related to payments" },
    { name: "HLS", description: "Operations related to HLS streaming" }
  ],
  servers: [
    {
      url: "/",
      description: "Development server"
    }
  ]
});

// Global error handling
router.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "Route not found",
    },
    404
  );
});

router.onError((err, c) => {
  console.error("Server error:", err);
  return c.json(
    {
      success: false,
      message: "Internal server error",
    },
    500
  );
});

export default router;
