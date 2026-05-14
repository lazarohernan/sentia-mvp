import { z } from "zod";

import {
  sanitizeOptionalTextInput,
  sanitizeTextInput,
} from "@/lib/security/input";

export const branchSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(160),
  address: z.string().max(320).nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export const createBranchInputSchema = z.object({
  name: z
    .string()
    .transform(sanitizeTextInput)
    .pipe(z.string().min(2).max(160)),
  address: z
    .string()
    .optional()
    .transform(sanitizeOptionalTextInput)
    .refine((value) => value === undefined || value.length <= 320),
});

export const updateBranchInputSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .transform(sanitizeTextInput)
    .pipe(z.string().min(2).max(160)),
  address: z
    .string()
    .optional()
    .transform(sanitizeOptionalTextInput)
    .refine((value) => value === undefined || value.length <= 320),
  is_active: z.boolean(),
});

export type Branch = z.infer<typeof branchSchema>;
export type CreateBranchInput = z.infer<typeof createBranchInputSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchInputSchema>;
