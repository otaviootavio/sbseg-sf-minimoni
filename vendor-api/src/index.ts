import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";
import router from "./routes";

const app = new OpenAPIHono();

// Middleware
app.use(
  "/*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-hash",
      "x-hash-index",
      "x-smart-contract-address",
    ],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 3600,
    credentials: true,
  })
);

app.use("/*", secureHeaders());

// Mount the main router
app.route("/", router);

// OpenAPI docs - usando a documentação definida no router
app.get("/swagger", swaggerUI({ url: "/docs" }));

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`); // Listening on http://localhost:3000
});
