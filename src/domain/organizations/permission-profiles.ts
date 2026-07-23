import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { sanitizeTextInput } from "@/lib/security/input";

import type { Database } from "@/lib/supabase/database.types";
import type { MemberRole } from "./schemas";

export type PermissionKey =
  | "summary"
  | "comments"
  | "alerts"
  | "branches"
  | "team"
  | "settings";

export type PermissionProfile = {
  id: string;
  name: string;
  permissions: PermissionKey[];
  memberCount?: number;
};

export type PermissionProfileUsage = {
  memberCount: number;
  memberNames: string[];
};

export type InferredMemberRole = "manager" | "collaborator";

type Client = SupabaseClient<Database>;

export const platformPermissions: Array<{
  key: PermissionKey;
  label: string;
  description: string;
}> = [
  {
    key: "summary",
    label: "Resumen",
    description: "Ver indicadores ejecutivos y salud general del negocio.",
  },
  {
    key: "comments",
    label: "Valoraciones",
    description: "Revisar comentarios, opiniones, quejas y observaciones.",
  },
  {
    key: "alerts",
    label: "Alertas",
    description: "Atender senales criticas y seguimiento operativo.",
  },
  {
    key: "branches",
    label: "Sucursales",
    description: "Ver y administrar puntos de atencion.",
  },
  {
    key: "team",
    label: "Equipo",
    description: "Ver colaboradores y asignar perfiles.",
  },
  {
    key: "settings",
    label: "Configuracion",
    description: "Editar datos generales del negocio.",
  },
];

export const permissionKeySchema = z.enum([
  "summary",
  "comments",
  "alerts",
  "branches",
  "team",
  "settings",
]);

export const createPermissionProfileInputSchema = z.object({
  name: z
    .string()
    .transform(sanitizeTextInput)
    .pipe(z.string().min(2).max(80)),
  permissions: z.array(permissionKeySchema).min(1).transform((permissions) => [
    ...new Set(permissions),
  ]),
});

export const updatePermissionProfileInputSchema = createPermissionProfileInputSchema;

export const updateTeamMemberPermissionProfileInputSchema = z
  .object({
    organizationRoleId: z.string().uuid().nullable().optional(),
    participatesInListening: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.organizationRoleId !== undefined ||
      value.participatesInListening !== undefined,
    { message: "Sin cambios." },
  );

export type CreatePermissionProfileInput = z.infer<
  typeof createPermissionProfileInputSchema
>;

export type UpdatePermissionProfileInput = z.infer<
  typeof updatePermissionProfileInputSchema
>;

export function getPermissionLabels(keys: PermissionKey[]) {
  const labelsByKey = new Map(
    platformPermissions.map((permission) => [permission.key, permission.label]),
  );

  return keys.map((key) => labelsByKey.get(key) ?? key);
}

export function inferMemberRoleFromPermissionProfile(
  profile: PermissionProfile | null,
): InferredMemberRole {
  if (!profile) {
    return "collaborator";
  }

  const managerPermissions = new Set<PermissionKey>([
    "branches",
    "team",
    "settings",
  ]);

  return profile.permissions.some((permission) => managerPermissions.has(permission))
    ? "manager"
    : "collaborator";
}

const allPermissionKeys = platformPermissions.map((permission) => permission.key);

/**
 * Resuelve los permisos efectivos del miembro.
 * - owner: acceso completo
 * - con perfil asignado: solo las keys del perfil
 * - manager sin perfil: acceso completo (compatibilidad legacy)
 * - resto: sin permisos de plataforma
 */
export function resolveMemberPermissions(params: {
  role: MemberRole;
  profile: PermissionProfile | null;
}): PermissionKey[] {
  if (params.role === "owner") {
    return [...allPermissionKeys];
  }

  if (params.profile) {
    return [...params.profile.permissions];
  }

  if (params.role === "manager") {
    return [...allPermissionKeys];
  }

  return [];
}

export function memberHasPermission(
  params: {
    role: MemberRole;
    profile: PermissionProfile | null;
  },
  permission: PermissionKey,
): boolean {
  return resolveMemberPermissions(params).includes(permission);
}

export function memberHasBusinessAccess(params: {
  role: MemberRole;
  profile: PermissionProfile | null;
}): boolean {
  return resolveMemberPermissions(params).length > 0;
}

function normalizePermissionKeys(value: string[]): PermissionKey[] {
  const allowedKeys = new Set(platformPermissions.map((permission) => permission.key));

  return value.filter((permission): permission is PermissionKey =>
    allowedKeys.has(permission as PermissionKey),
  );
}

function mapPermissionProfileRow(row: {
  id: string;
  name: string;
  permissions: string[];
}): PermissionProfile {
  return {
    id: row.id,
    name: row.name,
    permissions: normalizePermissionKeys(row.permissions),
  };
}

async function getPermissionProfileMemberCounts(
  client: Client,
  organizationId: string,
): Promise<Record<string, number>> {
  const { data, error } = await client
    .from("organization_members")
    .select("organization_role_id")
    .eq("organization_id", organizationId)
    .not("organization_role_id", "is", null);

  if (error || !data) {
    return {};
  }

  const counts: Record<string, number> = {};
  const rows = data as Array<{ organization_role_id: string | null }>;

  for (const row of rows) {
    const roleId = row.organization_role_id;
    if (!roleId) {
      continue;
    }

    counts[roleId] = (counts[roleId] ?? 0) + 1;
  }

  return counts;
}

export async function getPermissionProfilesByOrganization(
  client: Client,
  organizationId: string,
): Promise<PermissionProfile[]> {
  const { data, error } = await client
    .from("organization_roles")
    .select("id, name, permissions")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  const memberCounts = await getPermissionProfileMemberCounts(client, organizationId);
  const rows = data as Array<{ id: string; name: string; permissions: string[] }>;

  return rows.map((row) => ({
    ...mapPermissionProfileRow(row),
    memberCount: memberCounts[row.id] ?? 0,
  }));
}

export async function getPermissionProfileUsage(
  client: Client,
  params: {
    organizationId: string;
    organizationRoleId: string;
  },
): Promise<PermissionProfileUsage | null> {
  const profile = await getPermissionProfileById(client, params);

  if (!profile) {
    return null;
  }

  const { data, error } = await client
    .from("organization_members")
    .select("profiles(full_name)")
    .eq("organization_id", params.organizationId)
    .eq("organization_role_id", params.organizationRoleId)
    .neq("role", "owner")
    .order("created_at", { ascending: true });

  if (error) {
    return { memberCount: 0, memberNames: [] };
  }

  const rows = (data ?? []) as Array<{
    profiles: { full_name?: string } | null;
  }>;

  const memberNames = rows
    .map((row) => row.profiles?.full_name?.trim() ?? "")
    .filter((name) => name.length > 0);

  return {
    memberCount: memberNames.length,
    memberNames,
  };
}

export async function getPermissionProfileById(
  client: Client,
  params: {
    organizationId: string;
    organizationRoleId: string;
  },
): Promise<PermissionProfile | null> {
  const { data, error } = await client
    .from("organization_roles")
    .select("id, name, permissions")
    .eq("organization_id", params.organizationId)
    .eq("id", params.organizationRoleId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapPermissionProfileRow(data);
}

export async function createPermissionProfile(
  client: Client,
  params: {
    organizationId: string;
    input: CreatePermissionProfileInput;
  },
): Promise<PermissionProfile> {
  const { data, error } = await client
    .from("organization_roles")
    .insert({
      organization_id: params.organizationId,
      name: params.input.name,
      permissions: params.input.permissions,
    } as never)
    .select("id, name, permissions")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear el rol: ${error?.message ?? "Error desconocido"}`);
  }

  return mapPermissionProfileRow(data);
}

export async function updatePermissionProfile(
  client: Client,
  params: {
    organizationId: string;
    organizationRoleId: string;
    input: UpdatePermissionProfileInput;
  },
): Promise<PermissionProfile> {
  const existing = await getPermissionProfileById(client, {
    organizationId: params.organizationId,
    organizationRoleId: params.organizationRoleId,
  });

  if (!existing) {
    throw new Error("El rol no existe o no pertenece a la organizacion.");
  }

  const { data, error } = await client
    .from("organization_roles")
    .update({
      name: params.input.name,
      permissions: params.input.permissions,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("organization_id", params.organizationId)
    .eq("id", params.organizationRoleId)
    .select("id, name, permissions")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo actualizar el rol: ${error?.message ?? "Error desconocido"}`);
  }

  const profile = mapPermissionProfileRow(data);
  const inferredRole = inferMemberRoleFromPermissionProfile(profile);

  const { error: membersError } = await client
    .from("organization_members")
    .update({ role: inferredRole } as never)
    .eq("organization_id", params.organizationId)
    .eq("organization_role_id", params.organizationRoleId)
    .neq("role", "owner");

  if (membersError) {
    throw new Error("No se pudo sincronizar el rol de los colaboradores asignados.");
  }

  const memberCounts = await getPermissionProfileMemberCounts(client, params.organizationId);

  return {
    ...profile,
    memberCount: memberCounts[profile.id] ?? 0,
  };
}

export async function deletePermissionProfile(
  client: Client,
  params: {
    organizationId: string;
    organizationRoleId: string;
  },
): Promise<{ affectedMemberCount: number }> {
  const usage = await getPermissionProfileUsage(client, {
    organizationId: params.organizationId,
    organizationRoleId: params.organizationRoleId,
  });

  if (!usage) {
    throw new Error("El rol no existe o no pertenece a la organizacion.");
  }

  const { error } = await client
    .from("organization_roles")
    .delete()
    .eq("organization_id", params.organizationId)
    .eq("id", params.organizationRoleId);

  if (error) {
    throw new Error(`No se pudo eliminar el rol: ${error?.message ?? "Error desconocido"}`);
  }

  return { affectedMemberCount: usage.memberCount };
}

export async function updateTeamMemberPermissionProfile(
  client: Client,
  params: {
    organizationId: string;
    targetUserId: string;
    organizationRoleId?: string | null;
    participatesInListening?: boolean;
  },
): Promise<{
  permissionProfileId: string | null;
  permissionProfileName: string | null;
  role: MemberRole;
  participatesInListening: boolean;
}> {
  const { data: currentRow, error: currentError } = await client
    .from("organization_members")
    .select("organization_role_id, participates_in_listening, role")
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.targetUserId)
    .neq("role", "owner")
    .maybeSingle();

  if (currentError || !currentRow) {
    throw new Error("No se pudo actualizar el rol del colaborador.");
  }

  const current = currentRow as {
    organization_role_id: string | null;
    participates_in_listening: boolean;
    role: MemberRole;
  };

  const nextRoleId =
    params.organizationRoleId !== undefined
      ? params.organizationRoleId
      : current.organization_role_id;
  const nextListening =
    params.participatesInListening !== undefined
      ? params.participatesInListening
      : Boolean(current.participates_in_listening);

  const permissionProfile = nextRoleId
    ? await getPermissionProfileById(client, {
        organizationId: params.organizationId,
        organizationRoleId: nextRoleId,
      })
    : null;

  if (nextRoleId && !permissionProfile) {
    throw new Error("El rol seleccionado no pertenece a la organizacion.");
  }

  const role = permissionProfile
    ? inferMemberRoleFromPermissionProfile(permissionProfile)
    : "collaborator";

  const hasBusinessAccess = memberHasBusinessAccess({
    role,
    profile: permissionProfile,
  });
  const canListen = role !== "manager" && nextListening;

  if (!hasBusinessAccess && !canListen) {
    throw new Error(
      "Asigna un rol con permisos de plataforma o activa la participación en Escucha.",
    );
  }

  const { data, error } = await client
    .from("organization_members")
    .update({
      organization_role_id: nextRoleId,
      role,
      participates_in_listening: nextListening,
    } as never)
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.targetUserId)
    .neq("role", "owner")
    .select("role, participates_in_listening")
    .maybeSingle();

  if (error || !data) {
    throw new Error("No se pudo actualizar el rol del colaborador.");
  }

  const row = data as {
    role: MemberRole;
    participates_in_listening: boolean;
  };

  return {
    permissionProfileId: permissionProfile?.id ?? null,
    permissionProfileName: permissionProfile?.name ?? null,
    role: row.role,
    participatesInListening: Boolean(row.participates_in_listening),
  };
}
