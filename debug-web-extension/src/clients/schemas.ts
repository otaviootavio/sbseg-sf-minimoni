import { z } from "zod";
import { isAddress, isHash } from "viem";

// Helper function to convert address to 0x prefixed string
const toHexAddress = (address: string): `0x${string}` => {
  return `0x${address.replace("0x", "")}` as `0x${string}`;
};

// Helper function to convert hash to 0x prefixed string
const toHexHash = (hash: string): `0x${string}` => {
  return `0x${hash.replace("0x", "")}` as `0x${string}`;
};

// Generic error response schema
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
});

// Base schemas
const PaginationResponseSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  pages: z.number(),
});

// Vendor Schemas
export const VendorCreateRequestSchema = z.object({
  chainId: z.number().int().min(1).describe("Chain ID for the vendor"),
  address: z
    .string()
    .trim()
    .refine((addr) => isAddress(addr), {
      message: "Invalid Ethereum address",
    })
    .transform(toHexAddress)
    .describe("Ethereum address of the vendor"),
  amountPerHash: z.number().min(0).describe("Amount per hash in ETH"),
});

export const VendorUpdateRequestSchema = VendorCreateRequestSchema.partial();

export const VendorDataSchema = z.object({
  id: z.string().uuid(),
  chainId: z.number(),
  address: z.string().transform(toHexAddress),
  amountPerHash: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const VendorResponseSchema = z.object({
  success: z.literal(true),
  data: VendorDataSchema,
});

export const VendorListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(VendorDataSchema),
  pagination: PaginationResponseSchema,
});

// Channel status enum
export const ChannelStatus = z.enum(["OPEN", "CLOSED"]);
export type ChannelStatus = z.infer<typeof ChannelStatus>;

// Channel Schemas
export const ChannelCreateRequestSchema = z.object({
  contractAddress: z
    .string()
    .trim()
    .refine((addr) => isAddress(addr), {
      message: "Invalid contract address",
    })
    .transform(toHexAddress)
    .describe("Contract address for the channel"),
  numHashes: z.number().int().min(1).describe("Number of hashes"),
  lastIndex: z.number().int().min(0).describe("Last index processed"),
  tail: z
    .string()
    .trim()
    .refine((hash) => isHash(hash), {
      message: "Invalid tail format",
    })
    .transform(toHexHash)
    .describe("Last hash processed"),
  totalAmount: z.string().min(0).describe("Total amount in ETH"),
  vendorId: z.string().uuid().describe("UUID of the associated vendor"),
});

// Schema for creating channels by vendor address
export const ChannelCreateByVendorAddressSchema = z.object({
  contractAddress: z
    .string()
    .trim()
    .refine((addr) => isAddress(addr), {
      message: "Invalid contract address",
    })
    .transform(toHexAddress)
    .describe("Contract address for the channel"),
  numHashes: z.number().int().min(1).describe("Number of hashes"),
  lastIndex: z.number().int().min(0).describe("Last index processed"),
  tail: z
    .string()
    .trim()
    .refine((hash) => isHash(hash), {
      message: "Invalid tail format",
    })
    .transform(toHexHash)
    .describe("Last hash processed"),
  totalAmount: z.string().min(0).describe("Total amount in ETH"),
  vendorAddress: z
    .string()
    .trim()
    .refine((addr) => isAddress(addr), {
      message: "Invalid vendor address",
    })
    .transform(toHexAddress)
    .describe("Ethereum address of the vendor"),
});

export const ChannelUpdateRequestSchema = ChannelCreateRequestSchema.partial();

export const CloseChannelRequestSchema = z.object({
  settlementTx: z
    .string()
    .trim()
    .refine((hash) => isHash(hash), {
      message: "Invalid settlement transaction hash",
    })
    .transform(toHexHash)
    .optional()
    .describe("Optional settlement transaction hash"),
});

export const ChannelDataSchema = z.object({
  id: z.string().uuid(),
  contractAddress: z.string().transform(toHexAddress),
  numHashes: z.number(),
  lastIndex: z.number(),
  tail: z.string().transform(toHexHash),
  totalAmount: z.string(),
  vendorId: z.string(),
  status: ChannelStatus.default("OPEN"),
  closedAt: z.string().nullable().optional(),
  settlementTx: z.string().transform(toHexHash).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ChannelResponseSchema = z.object({
  success: z.literal(true),
  data: ChannelDataSchema,
});

export const ChannelListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ChannelDataSchema),
  pagination: PaginationResponseSchema,
});

export const ChannelDeleteResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

export const PaymentCreateRequestSchema = z.object({
  xHash: z
    .string()
    .trim()
    .refine((hash) => isHash(hash), {
      message: "Invalid hash format",
    })
    .transform(toHexHash)
    .describe("Payment hash"),
  amount: z.number().min(0).describe("Payment amount in ETH"),
  index: z.number().int().min(0).describe("Payment index"),
  vendorId: z.string().uuid().describe("UUID of the associated vendor"),
  contractAddress: z
    .string()
    .trim()
    .refine((addr) => isAddress(addr), {
      message: "Invalid contract address",
    })
    .transform(toHexAddress)
    .describe("Contract address for the channel"),
});

export const PaymentDataSchema = z.object({
  id: z.string().uuid(),
  xHash: z.string().transform(toHexHash),
  amount: z.number(),
  index: z.number(),
  channelId: z.string(),
  vendorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  vendor: VendorDataSchema,
  channel: ChannelDataSchema,
});

export const PaymentResponseSchema = z.object({
  success: z.literal(true),
  data: PaymentDataSchema,
});

export const PaymentListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(PaymentDataSchema),
  pagination: PaginationResponseSchema,
});

export const PaymentVerifyHashResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    isValid: z.boolean(),
    message: z.string(),
  }),
});

// Type exports
export type VendorCreateRequest = z.infer<typeof VendorCreateRequestSchema>;
export type VendorUpdateRequest = z.infer<typeof VendorUpdateRequestSchema>;
export type VendorResponse = z.infer<typeof VendorResponseSchema>;
export type VendorListResponse = z.infer<typeof VendorListResponseSchema>;

export type ChannelCreateRequest = z.infer<typeof ChannelCreateRequestSchema>;
export type ChannelCreateByVendorAddressRequest = z.infer<typeof ChannelCreateByVendorAddressSchema>;
export type ChannelUpdateRequest = z.infer<typeof ChannelUpdateRequestSchema>;
export type CloseChannelRequest = z.infer<typeof CloseChannelRequestSchema>;
export type ChannelResponse = z.infer<typeof ChannelResponseSchema>;
export type ChannelListResponse = z.infer<typeof ChannelListResponseSchema>;
export type ChannelDeleteResponse = z.infer<typeof ChannelDeleteResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export type PaymentCreateRequest = z.infer<typeof PaymentCreateRequestSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;
export type PaymentListResponse = z.infer<typeof PaymentListResponseSchema>;
export type PaymentVerifyHashResponse = z.infer<
  typeof PaymentVerifyHashResponseSchema
>;
