import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { CreateTeamMemberInput } from "./member-schemas";
import { createInviteActivationLink } from "./invite-link";
import { getPermissionProfileById } from "./permission-profiles";
import type { MemberRole } from "./schemas";
import { type TeamMember, roleLabels } from "./team";

type ServiceClient = SupabaseClient<Database>;

type AuthUserMatch = {
  id: string;
  last_sign_in_at?: string | null;
};

function needsActivationInvite(user: AuthUserMatch) {
  return !user.last_sign_in_at;
}

async function findAuthUserByEmail(
  client: ServiceClient,
  email: string,
): Promise<AuthUserMatch | null> {
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
      return {
        id: match.id,
        last_sign_in_at: match.last_sign_in_at,
      };
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
  const existingUser = await findAuthUserByEmail(client, params.email);

  if (existingUser) {
    if (!needsActivationInvite(existingUser)) {
      return { userId: existingUser.id, inviteLink: null };
    }

    const { userId, inviteLink } = await createInviteActivationLink(client, {
      email: params.email,
      fullName: params.fullName,
      siteUrl: params.siteUrl,
    });

    return {
      userId,
      inviteLink,
    };
  }

  const { userId, inviteLink } = await createInviteActivationLink(client, {
    email: params.email,
    fullName: params.fullName,
    siteUrl: params.siteUrl,
  });

  return {
    userId,
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

  const permissionProfile = params.input.organizationRoleId
    ? await getPermissionProfileById(client, {
        organizationId: params.organizationId,
        organizationRoleId: params.input.organizationRoleId,
      })
    : null;

  if (params.input.organizationRoleId && !permissionProfile) {
    throw new Error("El rol seleccionado no pertenece a la organizacion.");
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
    organization_role_id: permissionProfile?.id ?? null,
  } as never);

  if (insertError) {
    throw new Error(`No se pudo agregar al equipo: ${insertError.message}`);
  }

  const { data, error } = await client
    .from("organization_members")
    .select(
      "user_id, branch_id, organization_role_id, role, created_at, profiles(full_name), branches(name), organization_roles(name)",
    )
    .eq("organization_id", params.organizationId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Colaborador agregado, pero no se pudo cargar su detalle.");
  }

  const row = data as {
    user_id: string;
    branch_id: string | null;
    organization_role_id: string | null;
    role: MemberRole;
    created_at: string;
    profiles: { full_name: string } | null;
    branches: { name: string } | null;
    organization_roles: { name: string } | null;
  };

  return {
    member: {
      userId: row.user_id,
      branchId: row.branch_id,
      branchName: row.branches?.name ?? null,
      fullName: row.profiles?.full_name ?? params.input.fullName,
      email: params.input.email,
      role: row.role,
      roleLabel: roleLabels[row.role],
      permissionProfileId: row.organization_role_id,
      permissionProfileName: row.organization_roles?.name ?? null,
      joinedAt: row.created_at,
      accountStatus: inviteLink ? "pending_activation" : "active",
    },
    inviteLink,
  };
}
