import { z } from "zod";

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(160),
  created_at: z.string(),
});

export const organizationMemberSchema = z.object({
  user_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  role: z.enum(["owner", "manager", "collaborator"]),
  created_at: z.string(),
});

export type Organization = z.infer<typeof organizationSchema>;
export type OrganizationMember = z.infer<typeof organizationMemberSchema>;
export type MemberRole = OrganizationMember["role"];
