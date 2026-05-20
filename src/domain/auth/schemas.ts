import { z } from "zod";

import {
  sanitizeEmailInput,
  sanitizeTextInput,
} from "@/lib/security/input";

const passwordSchema = z
  .string()
  .min(8, "La contrasena debe tener al menos 8 caracteres.")
  .max(128, "La contrasena es demasiado larga.");

export const signInSchema = z.object({
  email: z
    .string()
    .transform(sanitizeEmailInput)
    .pipe(z.string().email("Correo invalido.")),
  password: passwordSchema,
});

export const signUpSchema = signInSchema.extend({
  fullName: z
    .string()
    .transform(sanitizeTextInput)
    .pipe(z.string().min(2).max(120)),
  companyName: z
    .string()
    .transform(sanitizeTextInput)
    .pipe(z.string().min(2).max(160)),
});

export const activateAccountSchema = z
  .object({
    fullName: z
      .string()
      .transform(sanitizeTextInput)
      .pipe(z.string().min(2).max(120)),
    password: passwordSchema,
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"],
  });

export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
