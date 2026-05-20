import type { SupabaseClient } from "@supabase/supabase-js";

import { buildAuthCallbackUrl, buildInviteCallbackUrl } from "@/domain/auth/redirects";
import type { Database } from "@/lib/supabase/database.types";
import type { CreateTeamMemberInput } from "./member-schemas";
import type { MemberRole } from "./schemas";
import { type TeamMember, roleLabels } from "./team";

type ServiceClient = SupabaseClient<Database>;

async function findAuthUserIdByEmail(
  client: ServiceClient,
  email: string,
): Promise<string | null> {
  let page = 1;

  while (page <= 5) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error || !data.users.length) {
      return null;
    }

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (match) {
      return match.id;
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return null;
}

async function resolveAuthUserId(
  client: ServiceClient,
  params: {
    email: string;
    fullName: string;
    siteUrl: string;
  },
): Promise<{ userId: string; inviteLink: string | null }> {
  const existingUserId = await findAuthUserIdByEmail(client, params.email);

  if (existingUserId) {
    return { userId: existingUserId, inviteLink: null };
  }

  const { data, error } = await client.auth.admin.generateLink({
    type: "invite",
    email: params.email,
    options: {
      redirectTo: buildAuthCallbackUrl(params.siteUrl, "/auth/activar-cuenta"),
      data: { full_name: params.fullName },
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "No se pudo generar la invitacion.");
  }

  const tokenHash = data.properties?.hashed_token;

  if (!tokenHash) {
    throw new Error("No se pudo generar el enlace de activacion.");
  }

  const inviteLink = buildInviteCallbackUrl(
    params.siteUrl,
    tokenHash,
    "/auth/activar-cuenta",
  );

  return {
    userId: data.user.id,
    inviteLink,
  };
}

async function ensureProfile(
  client: ServiceClient,
  userId: string,
  fullName: string,
): Promise<void> {
  const { error } = await client.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
    } as never,
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`No se pudo crear el perfil: ${error.message}`);
  }
}

async function assertBranchBelongsToOrganization(
  client: ServiceClient,
  organizationId: string,
  branchId: string,
): Promise<void> {
  const { data, error } = await client
    .from("branches")
    .select("id")
    .eq("id", branchId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("La sucursal seleccionada no pertenece a la organizacion.");
  }
}

export type AddTeamMemberResult = {
  member: TeamMember;
  inviteLink: string | null;
};

export async function addTeamMember(
  client: ServiceClient,
  params: {
    organizationId: string;
    input: CreateTeamMemberInput;
    siteUrl: string;
  },
): Promise<AddTeamMemberResult> {
  if (params.input.branchId) {
    await assertBranchBelongsToOrganization(
      client,
      params.organizationId,
      params.input.branchId,
    );
  }

  const { userId, inviteLink } = await resolveAuthUserId(client, {
    email: params.input.email,
    fullName: params.input.fullName,
    siteUrl: params.siteUrl,
  });

  await ensureProfile(client, userId, params.input.fullName);

  const { data: existingMember } = await client
    .from("organization_members")
    .select("role")
    .eq("organization_id", params.organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMember) {
    throw new Error("Este usuario ya pertenece al equipo.");
  }

  const { error: insertError } = await client.from("organization_members").insert({
    user_id: userId,
    organization_id: params.organizationId,
    role: params.input.role,
    branch_id: params.input.branchId ?? null,
  } as never);

  if (insertError) {
    throw new Error(`No se pudo agregar al equipo: ${insertError.message}`);
  }

  const { data, error } = await client
    .from("organization_members")
    .select("user_id, branch_id, role, created_at, profiles(full_name), branches(name)")
    .eq("organization_id", params.organizationId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Colaborador agregado, pero no se pudo cargar su detalle.");
  }

  const row = data as {
    user_id: string;
    branch_id: string | null;
    role: MemberRole;
    created_at: string;
    profiles: { full_name: string } | null;
    branches: { name: string } | null;
  };

  return {
    member: {
      userId: row.user_id,
      branchId: row.branch_id,
      branchName: row.branches?.name ?? null,
      fullName: row.profiles?.full_name ?? params.input.fullName,
      role: row.role,
      roleLabel: roleLabels[row.role],
      joinedAt: row.created_at,
    },
    inviteLink,
  };
}
