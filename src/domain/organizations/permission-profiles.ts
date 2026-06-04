import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";
import type { MemberRole } from "./schemas";

export type PermissionKey =
  | "summary"
  | "comments"
  | "alerts"
  | "branches"
  | "team"
  | "settings"
  | "listening";

export type PermissionProfile = {
  id: string;
  name: string;
  permissions: PermissionKey[];
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
  {
    key: "listening",
    label: "Escucha",
    description: "Ver y registrar niveles de escucha interna.",
  },
];

export const permissionKeySchema = z.enum([
  "summary",
  "comments",
  "alerts",
  "branches",
  "team",
  "settings",
  "listening",
]);

export const createPermissionProfileInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  permissions: z.array(permissionKeySchema).min(1).transform((permissions) => [
    ...new Set(permissions),
  ]),
});

export const updateTeamMemberPermissionProfileInputSchema = z.object({
  organizationRoleId: z.string().uuid().nullable(),
});

export type CreatePermissionProfileInput = z.infer<
  typeof createPermissionProfileInputSchema
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

  return data.map(mapPermissionProfileRow);
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

export async function updateTeamMemberPermissionProfile(
  client: Client,
  params: {
    organizationId: string;
    targetUserId: string;
    organizationRoleId: string | null;
  },
): Promise<{
  permissionProfileId: string | null;
  permissionProfileName: string | null;
  role: MemberRole;
}> {
  const permissionProfile = params.organizationRoleId
    ? await getPermissionProfileById(client, {
        organizationId: params.organizationId,
        organizationRoleId: params.organizationRoleId,
      })
    : null;

  if (params.organizationRoleId && !permissionProfile) {
    throw new Error("El rol seleccionado no pertenece a la organizacion.");
  }

  const role = inferMemberRoleFromPermissionProfile(permissionProfile);
  const { data, error } = await client
    .from("organization_members")
    .update({
      organization_role_id: params.organizationRoleId,
      role,
    } as never)
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.targetUserId)
    .neq("role", "owner")
    .select("role")
    .maybeSingle();

  if (error || !data) {
    throw new Error("No se pudo actualizar el rol del colaborador.");
  }

  const row = data as { role: MemberRole };

  return {
    permissionProfileId: permissionProfile?.id ?? null,
    permissionProfileName: permissionProfile?.name ?? null,
    role: row.role,
  };
}
