"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  getSafeRedirectPath,
  signInSchema,
  signUpSchema,
} from "@/domain/auth/schemas";
import { REGISTRATION_ENABLED } from "@/domain/auth/config";
import { sanitizeEmailInput } from "@/lib/security/input";
import {
  consumeRateLimit,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { createUserOrganization } from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "error";
  message?: string;
};

export async function signInAction(formData: FormData): Promise<void> {
  const headerStore = await headers();
  const clientIp = getClientIpFromHeaders(headerStore);
  const emailValue = formData.get("email");
  const email =
    typeof emailValue === "string" ? sanitizeEmailInput(emailValue) : "unknown";
  const rateLimit = consumeRateLimit({
    namespace: "auth:sign-in",
    key: `${clientIp}:${email}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    redirect("/login?error=rate_limited");
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_credentials");
  }

  if (!hasSupabasePublicEnv()) {
    redirect("/login?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect("/login?error=auth_failed");
  }

  redirect(getSafeRedirectPath(formData.get("redirectTo")?.toString()));
}

export async function signUpAction(formData: FormData): Promise<void> {
  if (!REGISTRATION_ENABLED) {
    redirect("/login?error=registration_disabled");
  }

  const headerStore = await headers();
  const clientIp = getClientIpFromHeaders(headerStore);
  const emailValue = formData.get("email");
  const email =
    typeof emailValue === "string" ? sanitizeEmailInput(emailValue) : "unknown";
  const rateLimit = consumeRateLimit({
    namespace: "auth:sign-up",
    key: `${clientIp}:${email}`,
    limit: 3,
    windowMs: 30 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    redirect("/login?error=rate_limited");
  }

  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_signup");
  }

  if (!hasSupabasePublicEnv()) {
    redirect("/login?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        company_name: parsed.data.companyName,
      },
    },
  });

  if (authError || !authData.user) {
    redirect("/login?error=signup_failed");
  }

  const orgSlug = parsed.data.companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  try {
    await createUserOrganization(supabase, {
      fullName: parsed.data.fullName,
      orgName: parsed.data.companyName,
      orgSlug,
    });
  } catch {
    redirect("/login?error=org_creation_failed");
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  if (!hasSupabasePublicEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
