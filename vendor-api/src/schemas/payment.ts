import { z } from "zod";
import { isHash, isAddress } from "viem";
import type { Payment, Channel, Vendor } from "@prisma/client";

// Helper functions
const toHexAddress = (address: string): `0x${string}` => {
  return `0x${address.replace("0x", "")}` as `0x${string}`;
};

const toHexHash = (hash: string): `0x${string}` => {
  return `0x${hash.replace("0x", "")}` as `0x${string}`;
};

// Base schemas
const baseAddressSchema = z
  .string()
  .trim()
  .refine((addr) => isAddress(addr), {
    message: "Invalid contract address",
  })
  .transform(toHexAddress);

const baseHashSchema = z
  .string()
  .trim()
  .refine((hash) => isHash(hash), {
    message: "Invalid hash format",
  })
  .transform(toHexHash);

// Base payment schema for creation
export const createPaymentSchema = z.object({
  xHash: baseHashSchema
    .describe("Payment hash")
    .openapi({
      example:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    }),
  amount: z
    .number()
    .positive()
    .describe("Payment amount in ETH")
    .openapi({ example: 0.01 }),
  index: z
    .number()
    .int()
    .nonnegative()
    .describe("Payment index")
    .openapi({ example: 1 }),
  contractAddress: z
    .string()
    .describe("Smart contract address")
    .openapi({ example: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" }),
  vendorId: z
    .string()
    .uuid()
    .describe("Vendor ID")
    .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
});

// Update schema is partial of create schema
export const updatePaymentSchema = createPaymentSchema
  .partial()
  .describe("Partial schema for updating payment details");

// Export input types
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

// Parameters schema for payment ID
export const getPaymentParamsSchema = z.object({
  id: z
    .string()
    .uuid()
    .describe("Unique identifier for the payment")
    .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
});

// Transform function for Prisma dates
const transformDate = (date: Date) => date.toISOString();

// Payment response schema
export const paymentResponseSchema = z.object({
  id: z.string().uuid().describe("Unique identifier for the payment"),
  xHash: baseHashSchema.describe("Payment hash"),
  amount: z.number().describe("Payment amount in ETH"),
  index: z.number().describe("Payment index"),
  channelId: z.string().uuid().describe("Channel ID"),
  vendorId: z.string().uuid().describe("Vendor ID"),
  createdAt: z.date().transform(transformDate).describe("Creation timestamp"),
  updatedAt: z
    .date()
    .transform(transformDate)
    .describe("Last update timestamp"),
  channel: z
    .object({
      id: z.string().uuid(),
      contractAddress: baseAddressSchema,
      numHashes: z.number(),
      lastIndex: z.number(),
      tail: baseHashSchema,
      totalAmount: z.string(),
      vendorId: z.string().uuid(),
      createdAt: z.date().transform(transformDate),
      updatedAt: z.date().transform(transformDate),
    })
    .describe("Associated channel"),
  vendor: z
    .object({
      id: z.string().uuid(),
      chainId: z.number(),
      address: baseAddressSchema,
      amountPerHash: z.number(),
      createdAt: z.date().transform(transformDate),
      updatedAt: z.date().transform(transformDate),
    })
    .describe("Associated vendor"),
});

// Verify hash response schema
export const verifyHashResponseSchema = z.object({
  isValid: z.boolean(),
  message: z.string().optional(),
});

export type VerifyHashResponse = z.infer<typeof verifyHashResponseSchema>;

// Transform function for payment responses
export const transformPaymentResponse = (
  payment: Payment & {
    channel: Channel;
    vendor: Vendor;
  }
): z.infer<typeof paymentResponseSchema> => {
  return paymentResponseSchema.parse({
    ...payment,
    xHash: toHexHash(payment.xHash),
    channel: {
      ...payment.channel,
      contractAddress: toHexAddress(payment.channel.contractAddress),
    },
    vendor: {
      ...payment.vendor,
      address: toHexAddress(payment.vendor.address),
    },
  });
};

// Success response schema for single payment
export const paymentSuccessResponse = z.object({
  success: z.literal(true).describe("Indicates if the request was successful"),
  data: z
    .union([paymentResponseSchema, verifyHashResponseSchema])
    .describe("Payment details or verification result"),
});

// Success response schema for paginated payment list
export const paymentListResponse = z.object({
  success: z.literal(true).describe("Indicates if the request was successful"),
  data: z.array(paymentResponseSchema).describe("List of payments"),
  pagination: z
    .object({
      total: z.number().describe("Total number of payments"),
      page: z.number().describe("Current page number"),
      limit: z.number().describe("Number of payments per page"),
      pages: z.number().describe("Total number of pages"),
    })
    .describe("Pagination metadata"),
});

// Error response schema
export const paymentErrorResponse = z.object({
  success: z.literal(false).describe("Indicates if the request failed"),
  message: z.string().describe("Error message"),
});

// Response types
export type PaymentSuccessResponse = z.infer<typeof paymentSuccessResponse>;
export type PaymentListResponse = z.infer<typeof paymentListResponse>;
export type PaymentErrorResponse = z.infer<typeof paymentErrorResponse>;

// Delete success response
export const paymentDeleteSuccessResponse = z.object({
  success: z.literal(true),
  message: z.string(),
});
