import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "La contrasena debe tener al menos 8 caracteres.")
  .max(128, "La contrasena es demasiado larga.");

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo invalido."),
  password: passwordSchema,
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(2).max(160),
});

export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
