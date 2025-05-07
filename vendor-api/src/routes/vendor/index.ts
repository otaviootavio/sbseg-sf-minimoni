import { OpenAPIHono } from "@hono/zod-openapi";
import createVendorRouter from "./create";
import listVendorsRouter from "./list";
import getVendorRouter from "./get";
import getVendorByAddressRouter from "./get-by-address";
import updateVendorRouter from "./update";
import deleteVendorRouter from "./delete";
import { authMiddleware } from "../../middlewares/authMiddleware";

export const vendorRouter = new OpenAPIHono();

// Register security scheme at the vendor router level
vendorRouter.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "API Token", 
  description: "Enter your API token (required for POST, PUT, DELETE operations)"
});

// Mount all vendor routes
// GET routes don't use authentication middleware
vendorRouter.route("/", listVendorsRouter);
vendorRouter.route("/", getVendorRouter);
vendorRouter.route("/", getVendorByAddressRouter);

// Non-GET routes use authentication middleware
// vendorRouter.use("/vendors", authMiddleware);
vendorRouter.route("/", createVendorRouter);
vendorRouter.route("/", updateVendorRouter);
vendorRouter.route("/", deleteVendorRouter);

// Global error handling
vendorRouter.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "Route not found",
    },
    404
  );
});

vendorRouter.onError((err, c) => {
  console.error("Server error:", err);
  return c.json(
    {
      success: false,
      message: "Internal server error",
    },
    500
  );
});

export default vendorRouter;
