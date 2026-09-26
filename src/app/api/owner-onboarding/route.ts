import { NextResponse } from "next/server";
import { z } from "zod";

import { needsOwnerOnboarding } from "@/domain/auth/owner-onboarding";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { sanitizeTextInput } from "@/lib/security/input";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv, hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const inputSchema = z.object({
  fullName: z.string().transform(sanitizeTextInput).pipe(z.string().min(2).max(120)),
  businessName: z.string().transform(sanitizeTextInput).pipe(z.string().min(2).max(160)),
});

function businessSlug(name: string, userId: string) {
  const base = name.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");

  return `${base || "negocio"}-${userId.replaceAll("-", "")}`;
}

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv() || !hasSupabaseServiceEnv()) {
    return NextResponse.json({ error: "Perks no está configurado." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const membership = await getOrganizationMembershipByUser(supabase, user.id);
  if (!needsOwnerOnboarding(user)) {
    return NextResponse.json({ error: "Esta cuenta no tiene una invitación de dueño." }, { status: 403 });
  }
  if (membership && membership.role !== "owner") {
    return NextResponse.json({ error: "Esta cuenta ya tiene un negocio." }, { status: 409 });
  }

  const limit = consumeRateLimit({
    namespace: "owner:onboarding",
    key: user.id,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Espera unos minutos antes de intentarlo de nuevo." }, { status: 429 });
  }

  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "Revisa tu nombre y el nombre del negocio." }, { status: 400 });
  }

  const service = createServiceClient();
  const { error: profileError } = await service.from("profiles").upsert({
    id: user.id,
    full_name: input.data.fullName,
  } as never);
  if (profileError) {
    return NextResponse.json({ error: "No se pudo guardar tu nombre." }, { status: 500 });
  }

  if (membership) {
    const { error: updateError } = await service
      .from("organizations")
      .update({ name: input.data.businessName } as never)
      .eq("id", membership.organizationId)
      .select("id")
      .single();
    if (updateError) {
      return NextResponse.json({ error: "No se pudo guardar el nombre del negocio." }, { status: 500 });
    }
    return NextResponse.json({ organizationId: membership.organizationId });
  }

  const { data: organization, error: organizationError } = await service
    .from("organizations")
    .insert({
      name: input.data.businessName,
      slug: businessSlug(input.data.businessName, user.id),
    } as never)
    .select("id")
    .single();
  const organizationId = (organization as { id: string } | null)?.id;
  if (organizationError || !organizationId) {
    return NextResponse.json({ error: "No se pudo crear el negocio." }, { status: 500 });
  }

  const { error: membershipError } = await service.from("organization_members").insert({
    user_id: user.id,
    organization_id: organizationId,
    role: "owner",
  } as never);
  if (membershipError) {
    await service.from("organizations").delete().eq("id", organizationId);
    return NextResponse.json({ error: "No se pudo asignar el dueño al negocio." }, { status: 500 });
  }

  return NextResponse.json({ organizationId }, { status: 201 });
}

export async function PATCH() {
  if (!hasSupabasePublicEnv() || !hasSupabaseServiceEnv()) {
    return NextResponse.json({ error: "Perks no está configurado." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const membership = await getOrganizationMembershipByUser(supabase, user.id);
  if (!membership || membership.role !== "owner" || !needsOwnerOnboarding(user)) {
    return NextResponse.json({ error: "Primero configura tu negocio." }, { status: 403 });
  }

  const service = createServiceClient();
  const { error } = await service.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, perks_owner_onboarding: false },
  });
  if (error) {
    return NextResponse.json({ error: "No se pudo completar la bienvenida." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
