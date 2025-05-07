import { OpenAPIHono } from "@hono/zod-openapi";
import { serveStatic } from "@hono/node-server/serve-static"; // Adjust import based on your server environment (Node, Bun, Deno, etc.)
import path from "path";
import { Hono } from "hono"; // Import Hono if not already
import { ChannelService } from "../../services/channelService"; // Adjust path as needed
import { PrismaClient } from "@prisma/client"; // Import Prisma Client
import { BlockchainService } from "../../services/blockchainService"; // Needed by ChannelService
import { PaymentService } from "../../services/paymentService"; // Add PaymentService for payword validation
import type { Context, Next } from 'hono'; // Import Hono types
import { isAddress, isHash } from "viem"; // Import viem utilities
import { CreatePaymentInput } from "../../schemas/payment"; // Import CreatePaymentInput type

// Define error type locally
export type HLSErrorResponse = {
  success: false;
  message: string;
};

// Helper function to transform address to proper format
const toHexAddress = (address: string): `0x${string}` => {
  return `0x${address.replace("0x", "")}` as `0x${string}`;
};

// Helper function to transform hash to proper format
const toHexHash = (hash: string): `0x${string}` => {
  return `0x${hash.replace("0x", "")}` as `0x${string}`;
};

export const hlsRouter = new Hono(); // Use Hono directly or keep OpenAPIHono if other OpenAPI features are needed on this router level

// Instantiate Prisma and Services (adjust based on your DI setup)
const prisma = new PrismaClient();
const blockchainService = new BlockchainService(); // Assuming default constructor
const channelService = new ChannelService(prisma, blockchainService);
const paymentService = new PaymentService(prisma); // Initialize payment service

// Middleware for HLS Access Validation
const validateHlsAccess = async (c: Context, next: Next) => {
  // Get all required headers
  const contractAddress = c.req.header('x-smart-contract-address');
  const payword = c.req.header('x-hash');
  const paywordIndex = c.req.header('x-hash-index');
  
  // Log all headers for debugging
  console.log("HLS Access Headers:", {
    contractAddress,
    payword,
    paywordIndex,
  });

  if (!contractAddress) {
    const errorResponse: HLSErrorResponse = {
      success: false,
      message: "Missing x-smart-contract-address header",
    };
    return c.json(errorResponse, 401);
  }

  // Validate payword headers are present
  if (!payword || !paywordIndex) {
    const errorResponse: HLSErrorResponse = {
      success: false,
      message: "Missing required payment headers (x-payword or x-payword-index)",
    };
    return c.json(errorResponse, 401);
  }

  try {
    // Basic hex check (optional but good practice)
    if (!isAddress(contractAddress)) {
       throw new Error("Invalid contract address format");
    }

    // Basic hex check for payword (must be a hash)
    if (!isHash(payword)) {
      throw new Error("Invalid payword format");
    }

    // Basic check for payword index (must be a number)
    const index = parseInt(paywordIndex, 10);
    if (isNaN(index) || index < 0) {
      throw new Error("Invalid payword index format");
    }

    const channel = await channelService.findByContractAddress(contractAddress);

    if (!channel) {
      // Channel not found in our DB for this contract address
      throw new Error("Channel not found or access denied");
    }

    // Validate payword hash hasn't been used before
    const isValidPayword = await paymentService.verifyHash(payword);
    if (!isValidPayword) {
      throw new Error("Invalid or already used payword");
    }

    // Get the vendor information from the channel
    const vendorId = channel.vendor.id;
    const amount = channel.vendor.amountPerHash; // Assuming this field exists

    // Create payment data object with proper types
    const paymentData: CreatePaymentInput = {
      xHash: toHexHash(payword),
      amount,
      index,
      vendorId,
      contractAddress,
    };

    // Record the payment in the database
    await paymentService.create(paymentData);

    console.log(`HLS Access Validation: Payment processed successfully for channel ${channel.id}`);
    await next();
  } catch (error) {
    // Log the specific error message if it's an Error instance
    const errorMessage = error instanceof Error ? error.message : "Access denied";
    console.error(`HLS Access Validation Error for ${contractAddress}:`, errorMessage);
    const errorResponse: HLSErrorResponse = {
      success: false,
      message: errorMessage,
    };
    // Use 403 Forbidden as the channel might exist but access isn't allowed/found
    return c.json(errorResponse, 403);
  }
};

// --- Static File Serving Setup ---
// Define the absolute path to the 'data' directory created by init_video.sh
// Assumes the server runs from the project root where 'data' directory exists.
const dataDir = path.resolve(process.cwd(), "data");
console.log(`Serving HLS files from: ${dataDir}`); // Log the directory path for verification

// Apply validation middleware *before* serving static files
hlsRouter.use('/hls/*', validateHlsAccess);

// Middleware to serve static files from the 'data' directory
// Requests to /hls/filename.m3u8 or /hls/segment.ts will be served from data/filename.m3u8 or data/segment.ts
hlsRouter.use(
  "/hls/*",
  serveStatic({
    root: "./", // Use relative path from cwd (usually vendor-api)
    rewriteRequestPath: (p) => path.join("data", p.replace(/^\/hls\//, "")), // Prepend 'data/' to the filename
    onNotFound: (path, c) => {
      console.error(`Static file not found: ${path}`);
      const errorResponse: HLSErrorResponse = {
        success: false,
        message: "HLS file not found",
      };
      c.res = c.json(errorResponse, 404);
    },
  })
);

// Middleware to add CORS and other headers for served static files
hlsRouter.use("/hls/*", async (c, next) => {
  await next();
  // Check if serveStatic successfully served a file (indicated by response having headers/body)
  // Adjust this check if needed based on how serveStatic behaves in your env
  if (c.res.headers.get("Content-Type")) {
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Cross-Origin-Resource-Policy", "cross-origin");
    // Optional: Set Cache-Control headers if serveStatic doesn't do it appropriately
    // c.header('Cache-Control', 'public, max-age=3600')
  }
});

// --- End Static File Serving Setup ---

// Add a simple root route for the /hls path if desired
hlsRouter.get("/", (c) => {
  return c.json({
    success: true,
    message: "HLS service active. Files served under /hls/",
  });
});

// Error handling (keep or adjust as needed)
hlsRouter.notFound((c) => {
  // This might be hit if the request doesn't match /hls/* or /
  const errorResponse: HLSErrorResponse = {
    success: false,
    message: "HLS endpoint not found",
  };
  return c.json(errorResponse, 404);
});

hlsRouter.onError((err, c) => {
  console.error("HLS Server error:", err);
  const errorResponse: HLSErrorResponse = {
    success: false,
    message: "Internal server error",
  };
  return c.json(errorResponse, 500);
});

export default hlsRouter;
