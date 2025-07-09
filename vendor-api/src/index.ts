import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";
import router from "./routes";
import type { Context, Next } from 'hono';

const app = new OpenAPIHono();

// Request timing middleware - must be first to capture full request lifecycle
app.use("/*", async (c: Context, next: Next) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  // Continue to next middleware/route
  await next();
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  // Color-code based on response time
  const getTimeColor = (time: number) => {
    if (time < 10) return '\x1b[32m'; // Green for fast responses
    if (time < 50) return '\x1b[33m'; // Yellow for medium responses
    return '\x1b[31m'; // Red for slow responses
  };
  
  const getStatusColor = (status: number) => {
    if (status < 300) return '\x1b[32m'; // Green for success
    if (status < 400) return '\x1b[33m'; // Yellow for redirects
    return '\x1b[31m'; // Red for errors
  };
  
  const reset = '\x1b[0m';
  const timeColor = getTimeColor(totalTime);
  const statusColor = getStatusColor(c.res.status);
  
  // Log detailed request timing information
  console.log(`${timeColor}[${totalTime.toFixed(2)}ms]${reset} ${statusColor}${c.res.status}${reset} ${c.req.method} ${c.req.url} (${requestId})`);
});

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
