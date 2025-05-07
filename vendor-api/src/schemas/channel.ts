import { z } from "zod";
import { isAddress, isHash } from "viem";
import type { Channel, Vendor, Payment } from "@prisma/client";

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

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// Channel Status enum
export const channelStatusSchema = z.enum(["OPEN", "CLOSED"]);

// Base channel schema
const baseChannelSchema = z.object({
  contractAddress: baseAddressSchema.describe(
    "Contract address for the channel"
  ),
  numHashes: z.number().int().positive().describe("Number of hashes"),
  lastIndex: z.number().int().min(0).describe("Last index processed"),
  tail: baseHashSchema.describe("Tail hash processed"),
  totalAmount: z.string().describe("Total amount in ETH"),
  vendorId: z.string().uuid().describe("UUID of the associated vendor"),
  status: channelStatusSchema.default("OPEN").describe("Channel status"),
  closedAt: z
    .date()
    .nullable()
    .optional()
    .describe("Timestamp when channel was closed"),
  settlementTx: baseHashSchema
    .nullable()
    .optional()
    .describe("Settlement transaction hash"),
});

// Payment schema
const basePaymentSchema = z.object({
  xHash: baseHashSchema.describe("Payment hash"),
  amount: z.number().positive().describe("Payment amount"),
  index: z.number().int().min(0).describe("Payment index"),
  channelId: z.string().uuid().describe("UUID of the associated channel"),
  vendorId: z.string().uuid().describe("UUID of the associated vendor"),
});

// Channel schemas for different operations
export const channelSchema = baseChannelSchema;
export const updateChannelSchema = baseChannelSchema.partial();
export const getChannelParamsSchema = z.object({
  id: z.string().uuid(),
});

// Payment schemas
export const paymentSchema = basePaymentSchema;
export const updatePaymentSchema = basePaymentSchema.partial();
export const getPaymentParamsSchema = z.object({
  id: z.string().uuid(),
});

// Input types
export type CreateChannelInput = z.input<typeof channelSchema>;
export type UpdateChannelInput = z.input<typeof updateChannelSchema>;
export type CreatePaymentInput = z.input<typeof paymentSchema>;
export type UpdatePaymentInput = z.input<typeof updatePaymentSchema>;

// Base vendor response schema
const vendorResponseSchema = z.object({
  id: z.string(),
  chainId: z.number(),
  address: baseAddressSchema,
  amountPerHash: z.number(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

// Payment response schema
export const paymentResponseSchema = z.object({
  id: z.string().uuid(),
  xHash: baseHashSchema,
  amount: z.number(),
  index: z.number(),
  channelId: z.string(),
  vendorId: z.string(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

// Channel response schema
export const channelResponseSchema = z.object({
  id: z.string().uuid(),
  contractAddress: baseAddressSchema,
  numHashes: z.number(),
  lastIndex: z.number(),
  tail: baseHashSchema,
  totalAmount: z.string(),
  vendorId: z.string(),
  status: channelStatusSchema,
  closedAt: z.date().nullable(),
  settlementTx: baseHashSchema.nullable(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
  vendor: vendorResponseSchema,
  recipient: z.string(),
  sender: z.string(),
});

// Pagination response schema
const paginationResponseSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  pages: z.number(),
});

// API response schemas
export const channelSuccessResponse = z.object({
  success: z.literal(true),
  data: channelResponseSchema,
});

export const channelListResponse = z.object({
  success: z.literal(true),
  data: z.array(channelResponseSchema),
  pagination: paginationResponseSchema,
});

export const channelErrorResponse = z.object({
  success: z.literal(false),
  message: z.string(),
});

export const paymentSuccessResponse = z.object({
  success: z.literal(true),
  data: paymentResponseSchema,
});

export const paymentListResponse = z.object({
  success: z.literal(true),
  data: z.array(paymentResponseSchema),
  pagination: paginationResponseSchema,
});

export const paymentErrorResponse = z.object({
  success: z.literal(false),
  message: z.string(),
});

// Response types
export type ChannelSuccessResponse = z.infer<typeof channelSuccessResponse>;
export type ChannelListResponse = z.infer<typeof channelListResponse>;
export type ChannelErrorResponse = z.infer<typeof channelErrorResponse>;
export type PaymentSuccessResponse = z.infer<typeof paymentSuccessResponse>;
export type PaymentListResponse = z.infer<typeof paymentListResponse>;
export type PaymentErrorResponse = z.infer<typeof paymentErrorResponse>;

// Transform functions for API responses
export const transformChannelResponse = (
  channel: Omit<Channel, "createdAt" | "updatedAt"> & {
    createdAt: string | Date;
    updatedAt: string | Date;
    vendor: Omit<Vendor, "createdAt" | "updatedAt"> & {
      createdAt: string | Date;
      updatedAt: string | Date;
    };
  }
): z.infer<typeof channelResponseSchema> => {
  return channelResponseSchema.parse({
    ...channel,
    contractAddress: toHexAddress(channel.contractAddress),
    tail: toHexHash(channel.tail),
    settlementTx: channel.settlementTx ? toHexHash(channel.settlementTx) : null,
    status: channel.status,
    closedAt: channel.closedAt ? new Date(channel.closedAt) : null,
    createdAt: new Date(channel.createdAt),
    updatedAt: new Date(channel.updatedAt),
    recipient: channel.recipient,
    sender: channel.sender,
    vendor: {
      ...channel.vendor,
      address: toHexAddress(channel.vendor.address),
      createdAt: new Date(channel.vendor.createdAt),
      updatedAt: new Date(channel.vendor.updatedAt),
    },
  });
};

export const transformPaymentResponse = (
  payment: Omit<Payment, "createdAt" | "updatedAt"> & {
    createdAt: string | Date;
    updatedAt: string | Date;
  }
): z.infer<typeof paymentResponseSchema> => {
  return paymentResponseSchema.parse({
    ...payment,
    xHash: toHexHash(payment.xHash),
    createdAt: new Date(payment.createdAt),
    updatedAt: new Date(payment.updatedAt),
  });
};

export const closeChannelParamsSchema = z.object({
  channelId: z.string().uuid(),
  settlementTx: baseHashSchema
    .optional()
    .describe("Optional on-chain settlement transaction hash"),
});

export type CloseChannelInput = z.input<typeof closeChannelParamsSchema>;

export const channelDeleteSuccessResponse = z.object({
  success: z.literal(true),
  message: z.string(),
});
