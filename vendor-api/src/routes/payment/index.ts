import { OpenAPIHono } from "@hono/zod-openapi";
import createPaymentRouter from "./create";
import listPaymentsRouter from "./list";
import getPaymentRouter from "./get";
import vendorPaymentsRouter from "./vendor-payments";
import channelPaymentsRouter from "./channel-payments";
import latestContractPaymentRouter from "./latest-contract";
import verifyHashRouter from "./verify";
import { authMiddleware } from "../../middlewares/authMiddleware";

export const paymentRouter = new OpenAPIHono();

// Register security scheme at the payment router level
paymentRouter.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "API Token", 
  description: "Enter your API token (required for POST, PUT, DELETE operations)"
});

// GET routes don't use authentication middleware
paymentRouter.route("/", listPaymentsRouter);
paymentRouter.route("/", getPaymentRouter);
paymentRouter.route("/", vendorPaymentsRouter);
paymentRouter.route("/", channelPaymentsRouter);
paymentRouter.route("/", latestContractPaymentRouter);

// Non-GET routes use authentication middleware
paymentRouter.use("/payments", authMiddleware);
paymentRouter.route("/", createPaymentRouter);
paymentRouter.route("/", verifyHashRouter);

// Global error handling
paymentRouter.notFound((c) => {
  return c.json({
    success: false,
    message: "Route not found",
  }, 404);
});

paymentRouter.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({
    success: false,
    message: "Internal server error",
  }, 500);
});

export default paymentRouter;