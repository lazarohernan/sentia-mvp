import { z } from "zod";

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
  name: z.string().trim().min(2).max(160),
  address: z.string().trim().max(320).optional(),
});

export type Branch = z.infer<typeof branchSchema>;
export type CreateBranchInput = z.infer<typeof createBranchInputSchema>;
