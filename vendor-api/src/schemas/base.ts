import { z } from "zod";

export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
  });

// Pagination schema for list endpoints
export const paginationSchema = z.object({
  page: z.preprocess(
    (val) => Number(val),
    z.number().int().positive().default(1)
  ),
  limit: z.preprocess(
    (val) => Number(val),
    z.number().int().positive().max(100).default(10)
  ),
});

// Common error response schema
export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z
    .array(
      z.object({
        path: z.array(z.string()).optional(),
        message: z.string(),
      })
    )
    .optional(),
});
