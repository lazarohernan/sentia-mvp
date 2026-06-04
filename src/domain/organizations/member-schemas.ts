import { z } from "zod";

import { sanitizeEmailInput, sanitizeTextInput } from "@/lib/security/input";

export const createTeamMemberInputSchema = z.object({
  fullName: z
    .string()
    .transform(sanitizeTextInput)
    .refine((value) => value.length >= 2 && value.length <= 120),
  email: z
    .string()
    .transform(sanitizeEmailInput)
    .pipe(z.string().email("Correo invalido.")),
  role: z.enum(["manager", "collaborator"]),
  organizationRoleId: z.string().uuid().nullable().optional(),
  branchId: z.string().uuid().optional(),
});

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberInputSchema>;
