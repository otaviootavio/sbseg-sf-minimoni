import { z } from "zod";
import { isAddress } from "viem";
import type { Vendor } from "@prisma/client";

// Helper function to convert address to 0x prefixed string
const toHexAddress = (address: string): `0x${string}` => {
  return `0x${address.replace("0x", "")}` as `0x${string}`;
};

// Base vendor schema for creation/updates
export const createVendorSchema = z.object({
  chainId: z
    .number()
    .int()
    .positive()
    .describe("Chain ID for the vendor")
    .openapi({ example: 1 }),
  address: z
    .string()
    .trim()
    .refine((addr) => isAddress(addr), {
      message: "Invalid Ethereum address",
    })
    .transform(toHexAddress)
    .describe("Ethereum address of the vendor")
    .openapi({ example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" }),
  amountPerHash: z
    .number()
    .positive()
    .describe("Amount per hash in ETH")
    .openapi({ example: 0.01 }),
});

// Update schema is partial of create schema
export const updateVendorSchema = createVendorSchema
  .partial()
  .describe("Partial schema for updating vendor details");

// Parameters schema for vendor ID
export const getVendorParamsSchema = z.object({
  id: z
    .string()
    .uuid()
    .describe("Unique identifier for the vendor")
    .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
});

// Transform function for Prisma dates
const transformDate = (date: Date) => date.toISOString();

// Vendor response schema
export const vendorResponseSchema = z.object({
  id: z.string().uuid().describe("Unique identifier for the vendor"),
  chainId: z.number().describe("Chain ID for the vendor"),
  address: z
    .string()
    .transform(toHexAddress)
    .describe("Ethereum address of the vendor"),
  amountPerHash: z.number().describe("Amount per hash in ETH"),
  createdAt: z
    .date()
    .transform(transformDate)
    .describe("Timestamp when the vendor was created"),
  updatedAt: z
    .date()
    .transform(transformDate)
    .describe("Timestamp when the vendor was last updated"),
});

// Transform function for vendor responses
export const transformVendorResponse = (
  vendor: Vendor
): z.infer<typeof vendorResponseSchema> => {
  return vendorResponseSchema.parse({
    ...vendor,
    address: toHexAddress(vendor.address),
  });
};

// Success response schema for single vendor
export const vendorSuccessResponse = z.object({
  success: z.literal(true).describe("Indicates if the request was successful"),
  data: vendorResponseSchema.describe("Vendor details"),
});

// Success response schema for paginated vendor list
export const vendorListResponse = z.object({
  success: z.literal(true).describe("Indicates if the request was successful"),
  data: z.array(vendorResponseSchema).describe("List of vendors"),
  pagination: z
    .object({
      total: z.number().describe("Total number of vendors"),
      page: z.number().describe("Current page number"),
      limit: z.number().describe("Number of vendors per page"),
      pages: z.number().describe("Total number of pages"),
    })
    .describe("Pagination metadata"),
});

// Error response schema
export const vendorErrorResponse = z.object({
  success: z.literal(false).describe("Indicates if the request failed"),
  message: z.string().describe("Error message"),
});

// Response types
export type VendorSuccessResponse = z.infer<typeof vendorSuccessResponse>;
export type VendorListResponse = z.infer<typeof vendorListResponse>;
export type VendorErrorResponse = z.infer<typeof vendorErrorResponse>;
