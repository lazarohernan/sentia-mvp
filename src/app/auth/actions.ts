"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";

import {
  activateAccountSchema,
  signInSchema,
  signUpSchema,
} from "@/domain/auth/schemas";
import { getSafeRedirectPath } from "@/domain/auth/redirects";
import { resolveHomePathForMembership } from "@/domain/auth/resolve-home-path";
import { needsOwnerOnboarding } from "@/domain/auth/owner-onboarding";
import { REGISTRATION_ENABLED } from "@/domain/auth/config";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import {
  createUserOrganization,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "error";
  message?: string;
};

export async function signInAction(formData: FormData): Promise<void> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_credentials");
  }

  const accountKey = createHash("sha256").update(parsed.data.email).digest("hex");
  const rateLimit = consumeRateLimit({
    namespace: "auth:sign-in",
    key: accountKey,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    redirect("/login?error=rate_limited");
  }

  if (!hasSupabasePublicEnv()) {
    redirect("/login?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !authData.user) {
    redirect("/login?error=auth_failed");
  }

  const membership = await getOrganizationMembershipByUser(supabase, authData.user.id);
  if (needsOwnerOnboarding(authData.user)) {
    redirect("/configurar-negocio");
  }

  const redirectTo = formData.get("redirectTo")?.toString();
  if (redirectTo) {
    redirect(getSafeRedirectPath(redirectTo));
  }

  redirect(await resolveHomePathForMembership(supabase, membership));
}

export async function signUpAction(formData: FormData): Promise<void> {
  if (!REGISTRATION_ENABLED) {
    redirect("/login?error=registration_disabled");
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

  const accountKey = createHash("sha256").update(parsed.data.email).digest("hex");
  const rateLimit = consumeRateLimit({
    namespace: "auth:sign-up",
    key: accountKey,
    limit: 3,
    windowMs: 30 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    redirect("/login?error=rate_limited");
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

export async function activateAccountAction(formData: FormData): Promise<void> {
  const parsed = activateAccountSchema.safeParse({
    fullName: formData.get("fullName"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/auth/activar-cuenta?error=invalid_activation");
  }

  if (!hasSupabasePublicEnv()) {
    redirect("/auth/activar-cuenta?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/auth/activar-cuenta");
  }

  const rateLimit = consumeRateLimit({
    namespace: "auth:activate-account",
    key: user.id,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    redirect("/auth/activar-cuenta?error=rate_limited");
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: {
      full_name: parsed.data.fullName,
    },
  });

  if (passwordError) {
    redirect("/auth/activar-cuenta?error=activation_failed");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (profileError) {
    redirect("/auth/activar-cuenta?error=activation_failed");
  }

  await supabase.auth.signOut();
  redirect("/login?status=account_activated");
}
