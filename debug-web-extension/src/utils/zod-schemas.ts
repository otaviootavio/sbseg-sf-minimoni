import { z } from "zod";

export const HashChainElementSchema = z.object({
  hash: z.string(),
  index: z.number(),
});

export const HashObjectSchema = z.object({
  address_contract: z.string(),
  address_to: z.string(),
  length: z.number(),
  hashchain: z.array(z.string().regex(/^0x[a-fA-F0-9]+$/)),
  isValid: z.boolean(),
  key: z.string(),
  tail: z.string().regex(/^0x[a-fA-F0-9]+$/),
  secret: z.string(),
});

export const StorageDataSchema = z.object({
  selectedKey: z.string().optional(),
  hashChains: z.array(HashObjectSchema).optional(),
});

export const SecretLengthSchema = z.object({
  secret: z.string(),
  length: z.number(),
  tail: z.string(),
  lastHashSendIndex: z.number(),
});
